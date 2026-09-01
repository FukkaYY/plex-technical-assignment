# plex-technical-assignment

株式会社プレックスのインターン技術課題に対する、インターン生スカウトサービスの仕様・実装リポジトリです。

## 技術構成

- Ruby 3.4.10 / Rails 8.1.3.1（APIモード）
- Node.js 24 LTS / Next.js 16.3.3 / TypeScript
- PostgreSQL 17
- Docker Compose

## ローカル起動

Docker Desktopを起動した状態で、リポジトリ直下から実行します。

```bash
cp .env.example .env
docker compose up --build
```

- フロントエンド: http://localhost:3000
- APIヘルスチェック: http://localhost:3000/api/v1/health
- Rails直接アクセス: http://localhost:3001/api/v1/health

停止は `Ctrl+C`、コンテナの削除は `docker compose down` です。DBデータも削除する場合のみ `docker compose down --volumes` を使用してください。

`.env.example` の値はローカル開発用のダミーです。本番環境では別の強固な値を設定し、`.env` はコミットしません。

## 個別実行

Dockerを使わない場合は、Ruby 3.4.10、PostgreSQL 17、Node.js 24を用意してください。

```bash
cd backend
bundle install
bin/rails db:prepare
bin/rails server -p 3001
```

別ターミナルで次を実行します。

```bash
cd frontend
npm ci
BACKEND_INTERNAL_URL=http://localhost:3001 npm run dev
```

## 確認コマンド

```bash
cd frontend && npm run lint && npm run build
cd backend && bundle exec rspec
```

## 仕様の参照先

- 公開用の概要: `index.html`
- 実装用の仕様入口: `spec/README.md`
- 機能別仕様: `spec/features/`
- 共通仕様: `spec/shared/`
- 画面とフロー: `spec/ui/`
- テスト仕様: `spec/testing/`
- 設計判断: `spec/decisions/`

実装時は `spec/README.md` の参照表から、対象機能に必要なファイルだけを読みます。

## 公開時の注意

- 認証情報、個人情報、秘密鍵、実在ユーザーのデータをコミットしない。
- 課題ページなど、公開意図が確認できない外部URLを掲載しない。
- `.env` はコミットせず、`.env.example` にはダミー値だけを置く。
