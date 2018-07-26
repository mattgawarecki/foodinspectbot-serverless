const AWS = require('aws-sdk');
const s3 = new AWS.S3({ apiVersion: '2006-03-01' });

const randomUuid = require('uuid/v4');

exports.handler = async (event, context) => {
  console.log(
    'Received message:',
    JSON.stringify({ event }, null, 2)
  );

  const snsPayload = event.Records[0].Sns;
  const params = createS3Object(snsPayload);

  console.log(
    'Sending object to S3 with parameters:',
    JSON.stringify(params, null, 2)
  );

  return new Promise((resolve, reject) => {
    s3.putObject(params, (error, success) => {
      console.log(
        'Result:',
        JSON.stringify({ error, success }, null, 2)
      );

      return (error
        ? reject(error)
        : resolve(success)
      );
    });
  });
}

function createS3Object(snsPayload) {
  const location = 'Location' in snsPayload.MessageAttributes
    ? snsPayload.MessageAttributes['Location'].Value
    : 'unknown';

  const hash = 'UniqueId' in snsPayload.MessageAttributes
    ? snsPayload.MessageAttributes['UniqueId'].Value
    : randomUuid();

  return {
    Bucket: process.env.BUCKET_NAME,
    Body: snsPayload.Message,
    Key: `${location}/${hash}.json`,
    ContentType: 'application/json'
  };
}
