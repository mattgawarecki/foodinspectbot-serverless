class ConfigurationClient {
  constructor(dynamoDb, tableName) {
    this.dynamoDb = dynamoDb;
    this.tableName = tableName;
  }

  async getValue(key) {
    const params = {
      TableName: this.tableName,
      Key: {
        Key: { S: key }
      },
      ExpressionAttributeNames: {
        '#V': 'Value'
      },
      ProjectionExpression: '#V'
    };

    console.log(
      `Getting value for key ${key} ...`,
      JSON.stringify({ params }, null, 2)
    );

    return new Promise((resolve, reject) => {
      this.dynamoDb.getItem(params, (err, res) => {
        console.log(
          'Result:',
          JSON.stringify({ err, res }, null, 2)
        );

        if (err) return reject(err);
        else {
          return resolve(res.Item
            ? res.Item.Value.S
            : undefined
          );
        }
      });
    });
  }

  async setValue(key, value) {
    console.log(
      'Setting configuration entry:',
      `Key: ${key}`,
      `Value: ${value}`
    );

    const params = {
      TableName: this.tableName,
      Key: {
        Key: { S: key }
      },
      UpdateExpression: 'SET #V = :value',
      ExpressionAttributeNames: {
        '#V': 'Value'
      },
      ExpressionAttributeValues: {
        ':value': { S: value }
      }
    };

    return new Promise((resolve, reject) => {
      this.dynamoDb.updateItem(params, (err, res) => {
        console.log(
          'Update result:',
          JSON.stringify({ err, res }, null, 2)
        );

        if (err) return reject(err);
        else return resolve(res);
      });
    });
  }
}

module.exports = ConfigurationClient;
