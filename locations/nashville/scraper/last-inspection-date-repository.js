const ConfigurationClient = require('./_configuration-client');

class LastInspectionDateRepository {
  constructor(moment, dynamoDb, tableName) {
    this.moment = moment;
    this.configurationClient = new ConfigurationClient(dynamoDb, tableName);

    this.KEY = 'LastInspectionDate';
    this.storedValue = undefined;
  }

  async get() {
    if (!this.storedValue) {
      this.storedValue = await this._fetch();
    }

    return this.storedValue;
  }

  set(value) {
    const formattedValue = value.format('YYYY-MM-DD');
    return this.configurationClient.setValue(this.KEY, formattedValue)
      .then(res => this.storedValue = value);
  }

  async _fetch() {
    const rawValue = await this.configurationClient.getValue(this.KEY);
    return rawValue
      ? this.moment(rawValue, 'YYYY-MM-DD')
      : undefined;
  }
}

module.exports = LastInspectionDateRepository;
