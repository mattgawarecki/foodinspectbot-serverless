class SnsPublisher {
  constructor(sns, topicArn) {
    this.sns = sns;
    this.topicArn = topicArn;
  }

  publish(messageObj, attributes) {
    const messageString = typeof messageObj === 'string' || messageObj instanceof String
      ? messageObj
      : JSON.stringify(messageObj);

    const params = {
      TopicArn: this.topicArn,
      Message: messageString,
      MessageAttributes: this._buildMessageAttributes(attributes)
    };

    return new Promise((resolve, reject) => {
      this.sns.publish(params, (err, res) => {
        const detailedResult = {
          status: err ? 'failure' : 'success',
          originalPayload: messageObj,
          request: params,
          response: err || res,
        };

        if (err) {
          console.log(
            'Error occurred while publishing to SNS:',
            JSON.stringify({ detailedResult }, null, 2)
          );

          return reject(detailedResult);
        } else {
          return resolve(detailedResult);
        }
      });
    });
  }

  _buildMessageAttributes(attributes = {}) {
    const snsMessageAttributes = {};
    Object.keys(attributes).forEach(key => {
      const formattedAttribute = {
        DataType: 'String',
        StringValue: (attributes[key] || '').toString()
      };

      snsMessageAttributes[key] = formattedAttribute;
    });

    return snsMessageAttributes;
  }
}

module.exports = SnsPublisher;
