var request = require('request');

var YAHOO_URL = 'https://www.yahoo.co.jp/';

var DANGEROUS_WORDS = [
  '北朝鮮',
  'ミサイル',
];

var HEADLINE_LENGTH = 20;

var WEBHOOK_URL = process.env['WEBHOOK_URL'];

exports.handler = function(event, context, callback) {
  request(YAHOO_URL, function(err, res, body) {
    if (err) {
      callback(err);
    }
    if (res.statusCode != 200) {
      callback(res);
    }

    if (detectMissile(body)) {
      var headline = extractHeadline(body);

      var payload =
      {
          text: "@here",
          attachments: [
            {
              color: 'danger',
              text: headline,
              pretext: YAHOO_URL
            }
          ]
      };

      request({
        url: WEBHOOK_URL,
        method: "POST",
        json: payload
      }, function(err, res, body) {
        if (err) {
          callback(err);
        }
        if (res.statusCode != 200) {
          callback(res);
        }

        callback(null, headline);
      });
    }
    else {
      callback(null, "no missile");
    }
  });
}

function detectMissile(body) {
  return DANGEROUS_WORDS
    .map(function(word) {
      return body.search(word);
    })
    .reduce(function(acc, index) {
      return acc && (index > -1);
    }, true);
}

function extractHeadline(body) {
  var indices = DANGEROUS_WORDS
    .map(function(word) {
      return body.search(word);
    });
  var start = Math.min.apply(Math, indices);
  return body.substring(start, start + HEADLINE_LENGTH);
}