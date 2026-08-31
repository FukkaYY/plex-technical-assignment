# plex-technical-assignment

株式会社プレックスのインターン技術課題に対する、インターン生スカウトサービスの仕様・実装リポジトリです。

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

