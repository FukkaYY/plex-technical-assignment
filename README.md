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

ブラウザ上のP0必須フローはPlaywrightで確認します。初回だけブラウザをインストールしてください。

```bash
cd frontend
npx playwright install chromium
npm run test:e2e
```

E2E実行前に、リポジトリ直下で `docker compose up --build -d` と `docker compose exec backend bin/rails db:seed` を実行しておきます。失敗時のスクリーンショット、動画、traceは `frontend/test-results/` に保存されます。

## デモ企業アカウント

コンテナ起動後、再実行可能なseedを実行します。

```bash
docker compose exec backend bin/rails db:seed
```

ローカル開発用のダミー資格情報は次のとおりです。

- メールアドレス: `company@example.com`
- パスワード: `password123`

## デモ学生アカウント

- メールアドレス: `student01@example.com`
- パスワード: `password123`

手動でP0の必須フローを確認する場合は、企業としてログインし「デモ学生 01」へメッセージを送信したあと、ログアウトして上記学生でログインします。学生マイページの「受信メッセージを見る」から、デモ企業名と送信本文を確認できます。

P1のプロフィール編集は、学生ログイン後の学生マイページから「プロフィールを編集」を選び、更新後に完了メッセージと変更内容が表示されることで確認できます。

企業向け学生一覧では、氏名・学校名・希望職種・スキルのキーワード検索と、卒業予定年・希望職種の完全一致による絞り込みを組み合わせられます。検索条件はURLに保持されます。

学生は受信メッセージ詳細から、企業が開始した既存会話へ返信できます。各メッセージの送信者は学生側・企業側の双方の履歴で確認できます。

学生の受信一覧には企業から届いた未確認メッセージ数が表示されます。受信詳細を開くと表示した範囲が既読になり、学生自身の返信は未読数に含まれません。

企業は学生一覧の「募集を管理」からインターン募集を作成・編集・募集終了にできます。学生はマイページの「インターン募集を見る」から公開中の募集一覧と詳細を確認できます。

企業は既存の会話画面から日本時間で面談予定を提案できます。学生は受信詳細で承諾または辞退でき、企業は回答前の提案を取り消せます。

企業は学生一覧から2〜20人の学生を選んでグループチャットを作成できます。参加学生は学生マイページからグループを開き、企業・他の参加学生と会話できます。

値は `.env` の `DEMO_COMPANY_EMAIL` と `DEMO_COMPANY_PASSWORD` で変更できます。本番環境でダミー値を使用しないでください。

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
