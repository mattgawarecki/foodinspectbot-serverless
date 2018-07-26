const ScoredInspection = require('./scored-inspection');

class DetailedInspection extends ScoredInspection {
  constructor(establishment, date, score, details) {
    super(establishment, date, score);
    this.details = details;
  }
}

module.exports = DetailedInspection;
