module.exports = (axios) =>
  function scrapeByDateRange(startDate, endDate) {
    return axios.get(
      'http://foodinspections.nashville.gov/FoodScores.aspx',
      {
        timeout: 5 * 1000,
        params: {
          BegDate: startDate.format('M/D/YYYY'),
          EndDate: endDate.format('M/D/YYYY')
        },
        validateStatus: status => status === 200
      }
    ).then(res => {
      console.log(
        'Server responded with success.',
        `Bytes returned: ${res.data.length || 0}`
      );
      return res.data;
    }).catch(err => {
      if (err.response) {
        const responseErrorData = {
          data: err.response.data,
          status: err.response.status,
          headers: err.response.headers
        };

        console.log(
          'The server returned an error response:',
          JSON.stringify(responseErrorData, null, 2)
        );
      } else if (err.request) {
        console.log(
          'There was a problem with the request:',
          `- URL: ${err.request.url}`,
          `- Message: ${err.message}`
        );
      } else {
        console.log(
          'An error occurred while making an HTTP request:',
          err.message
        );
      }

      throw err;
    });
  }
