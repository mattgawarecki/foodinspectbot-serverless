const AWS = require('aws-sdk');

// Date parser/formatter; used in both steps 1 and 4
const moment = require('moment');

// Steps 1 and 6: Get/set last published inspection date
const dynamoDb = new AWS.DynamoDB({ apiVersion: '2012-08-10' });
const LastInspectionDateRepository = require('./last-inspection-date-repository');
const lastInspectionDateRepository = new LastInspectionDateRepository(
  moment,
  dynamoDb,
  process.env.CONFIGURATION_TABLE_NAME
);

// Fallback date, in the event that no inspections have yet been published
const FIRST_INSPECTION_DATE = moment('2007-08-01', 'YYYY-MM-DD');

// Step 2: Scrape data for given date range
const axios = require('axios');
const scrapeByDateRange = require('./scrape-by-date-range')(axios);

// Step 3: Extract inspection texts from HTML
const cheerio = require('cheerio');
const extractInspectionTexts = require('./extract-inspection-texts')(cheerio);

// Step 4: Parse inspection texts
const parseInspectionText = require('./parse-inspection-text')(moment);

// Step 5: Publish inspection results to given topic,
//         keeping track of most recent inspection date
//         that's been published
const sns = new AWS.SNS({ apiVersion: '2010-03-31' });
const SnsPublisher = require('./sns-publisher');
const inspectionPublisher = new SnsPublisher(sns, process.env.NEW_INSPECTION_TOPIC_ARN);

exports.handler = async (event, context) => {
  console.log('Starting inspection scraper.');

  const startDate = await getStartDate();
  const endDate = moment();
  console.log(
    `Start date: ${startDate.format('YYYY-MM-DD')}`,
    `End date: ${endDate.format('YYYY-MM-DD')}`
  );

  const inspections = await
    scrapeByDateRange(startDate, endDate)
      .then(extractInspectionTexts)
      .then(texts => texts.map(parseInspectionText));

  if (inspections.length === 0) {
    console.log('No inspections found. Exiting ...');
    return;
  }

  console.log(`Found ${inspections.length} inspections. Publishing ...`);

  const publishPromises = inspections.map(publishWithProgress);
  return Promise.all(publishPromises)
    .then(results => Promise.all([
      updateLastInspectionDate(results),
      reportSummary(results)
    ]));
};

async function getStartDate() {
  const lastInspection = await lastInspectionDateRepository.get();

  return (lastInspection
    ? lastInspection.add(1, 'day')
    : FIRST_INSPECTION_DATE
  );
}

function createUniqueId(inspection) {
  const establishmentId = `${inspection.establishment.name}_${inspection.establishment.streetAddress}`;
  const inspectionId = `${inspection.date}-${establishmentId}`;

  return new Buffer(inspectionId).toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

async function publishWithProgress(currentInspection, index, arr) {
  const progressInterval = Math.floor(arr.length / 10);

  const logProgress = (response, index, arr) => {
    if (arr.length < 10 ||
        (index + 1) % progressInterval === 0) {
      const percentageComplete = Math.round((index + 1) / arr.length * 100);
      console.log(
        `${percentageComplete}%: Published message ${index + 1}/${arr.length} ...`,
        JSON.stringify({ response }, null, 2)
      );
    }
  };

  const attributes = {
    Location: 'nashville',
    Date: currentInspection.date,
    UniqueId: createUniqueId(currentInspection)
  };

  return inspectionPublisher.publish(currentInspection, attributes)
    .then(res => {
      logProgress(res, index, arr);
      return res;
    }).catch(err => err);
}

function reportSummary(publishResults) {
  const failures = publishResults.filter(r => r.status === 'failure');
  const successes = publishResults.filter(r => r.status === 'success');

  if (failures.length > 0) {
    console.log(
      '${failures.length} inspections could not be published:',
      JSON.stringify(failures, null, 2)
    );
  }

  if (successes.length > 0) {
    console.log(`${successes.length} inspections published successfully.`);
  }
}

function updateLastInspectionDate(publishResults) {
  const successes = publishResults.filter(r => r.status === 'success');
  if (successes.length === 0) {
    console.log('No inspections were successfully published; not updating last inspection date.');
    return;
  }

  const mostRecentPublished = successes
    .map(r => moment(r.originalPayload.date))
    .reduce((max, curr) => curr > max ? curr : max, FIRST_INSPECTION_DATE);

  console.log(`Updating most recent published inspection date: ${mostRecentPublished.format('YYYY-MM-DD')}`);

  return lastInspectionDateRepository.set(mostRecentPublished)
    .then(res => {
      console.log('Last inspection date updated.')
      return res;
    });
}
