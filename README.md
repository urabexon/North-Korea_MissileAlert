# 🚀North-Korea_MissileAlert🚀

JavaScript + AWS Lambda + AWS CloudWatch Project<br>
ミサイル発射情報をSlackに通知するアプリケーションです。

## 🚀Overview
このアプリケーションはNHKやYahooのニュースをスクレイピングし、ミサイル発射情報を検出した場合にSlackへ自動通知します。<br>
AWS Lambda と AWS CloudWatch を組み合わせて、定期的に実行されるよう設計されています。

## 🚀Setup

### Upload to AWS Lambda
```bash
$ npm install
$ node-lambda package
```

node-lambda package コマンドでLambdaにアップロードする ZIPファイル が生成されます。<br>
npmをインストール後、zipファイルをAWS Lambdaアカウントにアップロードしてください。

### Set Environment Variables on AWS Lambda
以下の環境変数をLambda関数に設定してください。

- WEBHOOK_URL: SlackのWebhook URLを入力
- DANGEROUS_WORDS: 検出するキーワード（例: ミサイル, 発射など）
- UPTODATE_DURATION_MIN: 過去何分以内の情報を対象にするか設定

### Set up AWS CloudWatch
AWS CloudWatchで定期実行のため、スケジュールイベントを作成します。<br>
rate(1 minute) など、実行間隔を指定してください。<br>
その後、Slackチャンネルに通知が送信されれば完了です。

## 🛠️Stack
- Node.js: アプリケーションの実装
- AWS Lambda: サーバーレス環境での定期実行
- AWS CloudWatch: スケジュールイベント管理
- Slack Webhook: 通知送信先