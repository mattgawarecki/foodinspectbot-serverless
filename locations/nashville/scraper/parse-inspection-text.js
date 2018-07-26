const Establishment = require('../models/establishment');
const ScoredInspection = require('../models/scored-inspection');
const DetailedInspection = require('../models/detailed-inspection');

const getEstablishment = (lines) => new Establishment(
  lines[0],
  lines[1]
);

const datePattern = RegExp('[0-9]{1,2}/[0-9]{1,2}/[0-9]{4}');
const getDate = (moment, lines) => {
  const rawDate = datePattern.exec(lines[2])[0];

  const formattedDate = moment(rawDate, 'M/D/YYYY').format('YYYY-MM-DD');
  return formattedDate;
}

const getScore = (lines) => parseInt(/\d+/.exec(lines[3])[0]);

const getDetails = (lines) => lines
  .slice(5)
  .map(line => line.replace(/^\s*\*\s+/, ''));

const hasDetails = (lines) => (
  lines.length > 5 &&
  lines[4] === 'MAJOR VIOLATIONS:'
);

module.exports = (moment) =>
  function parseInspectionText(text) {
    const lines = text
      .split('\n')
      .map(line => line.trim())
      .map(line => line.toUpperCase())
      .filter(line => line);

    const establishment = getEstablishment(lines);
    const date = getDate(moment, lines);
    const score = getScore(lines);

    return hasDetails(lines)
      ? new DetailedInspection(establishment, date, score, getDetails(lines))
      : new ScoredInspection(establishment, date, score);
  }
