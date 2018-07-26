const InspectionBase = require('./inspection-base');

class ScoredInspection extends InspectionBase {
  constructor(establishment, date, score) {
    super(establishment, date);
    this.score = score;
  }
}

module.exports = ScoredInspection;
