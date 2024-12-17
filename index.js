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
const DANGEROUS_WORDS = ['ミサイル', '発射', '着弾'];

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

// ミサイル検出関数 (非同期でデータを返す)
async function detectMissileByNHK(callback, lambdaCallback) {
  try {
    const threeMinutesAgo = new Date(Date.now() - UPTODATE_DURATION_MIN * 60 * 1000);

    // NHK_URLリクエスト
    const res1 = await axios.get(NHK_URL);
    if (res1.status !== 200) throw new Error(`NHK_URL Error: ${res1.statusText}`);

    const json1 = res1.data;
    const items = json1.channel.item;

    for (const item of items) {
      const update = Date.parse(item.pubDate);
      const text = item.title;

      if (threeMinutesAgo < update && detectMissile(text)) {
        const url = `http://www3.nhk.or.jp/news/${item.link}`;
        callback(text, url);
        return; // ミサイルを検出したら早期終了
      }
    }

    // NHK_HEAD_URLリクエスト
    const res2 = await axios.get(NHK_HEAD_URL);
    if (res2.status !== 200) throw new Error(`NHK_HEAD_URL Error: ${res2.statusText}`);

    const json2 = res2.data;
    if (json2.viewFlg && detectMissile(json2.title)) {
      callback(json2.title, '');
    }

  } catch (error) {
    console.error('Error during missile detection:', error.message);
    lambdaCallback(error); // Lambdaのエラーハンドリング
  }
}

async function detectMissileByYahoo(callback, lambdaCallback) {
  try {
    // YahooのURLからデータ取得
    const response = await axios.get(YAHOO_URL);

    // ステータスコード確認
    if (response.status !== 200) {
      throw new Error(`Yahoo request failed with status: ${response.status}`);
    }

    const body = response.data;

    // ミサイル関連の単語を検出
    if (detectMissile(body)) {
      const headline = extractHeadline(body); // ヘッドラインを抽出
      callback(headline, YAHOO_URL);
    } else {
      lambdaCallback(null, "no missile");
    }

  } catch (error) {
    console.error("Error detecting missile by Yahoo:", error.message);
    lambdaCallback(error);
  }
}

function detectMissile(body) {
  return DANGEROUS_WORDS.some(word => body.includes(word));
}

// 仮のヘッドライン抽出関数
function extractHeadline(body, words) {
  const indices = words
    .map(word => body.indexOf(word))
    .filter(index => index !== -1);

  if (indices.length === 0) {
    return "No headline found";
  }

  const start = Math.min(...indices);
  return body.substring(start, start + HEADLINE_LENGTH);
}
