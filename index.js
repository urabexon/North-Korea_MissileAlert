var request = require('request');

var YAHOO_URL = 'https://www.yahoo.co.jp/';
var NHK_URL = 'http://www3.nhk.or.jp/news/json16/new_001.json';
var NHK_HEAD_URL = 'http://www3.nhk.or.jp/news/json16/tvnews.json';

var DANGEROUS_WORDS = process.env['DANGEROUS_WORDS'] ?
		process.env['DANGEROUS_WORDS'].split(',') :
    ['北朝鮮', 'ミサイル'];

var UPTODATE_DURATION_MIN = process.env['UPTODATE_DURATION_MIN'] ?
    parseInt(process.env['UPTODATE_DURATION_MIN']) :
    3;

var HEADLINE_LENGTH = 20;

var WEBHOOK_URL = process.env['WEBHOOK_URL'];

const axios = require('axios');

exports.handler = async (event, context) => {
  try {
    // ミサイル情報検出
    const { headline, url } = await detectMissileByNHK();

    // SlackのWebhookに送信する
    const payload = {
      text: "@here",
      attachments: [
        {
          color: 'danger',
          text: headline,
          pretext: url
        }
      ]
    };

    const response = await axios.post(process.env.WEBHOOK_URL, payload);

    // Slack APIのレスポンス
    if (response.status === 200) {
      console.log('Notification sent successfully');
      return { status: 'success', message: headline };
    } else {
      console.error('Failed to send notification', response.statusText);
      throw new Error(`Slack API error: ${response.statusText}`);
    }

  } catch (error) {
    console.error('Error occurred:', error.message);
    throw error;
  }
};

// 仮のNHKミサイル検出関数 (非同期でデータを返す)
async function detectMissileByNHK() {
  return new Promise((resolve, reject) => {
    // 仮のデータ取得処理
    const headline = "Missile detected: Breaking news from NHK";
    const url = "https://www.nhk.or.jp/";
    resolve({ headline, url });
  });
}






///////////////////

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