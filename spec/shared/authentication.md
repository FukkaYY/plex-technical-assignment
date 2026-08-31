# 認証

## 方針

Railsが認証を管理し、セッションIDをHttpOnly Cookieで保持する。

## 採用理由

- ブラウザJavaScriptから認証情報を読み取れない。
- Railsの標準的なセッション管理を利用できる。
- 2週間のMVPでJWTの更新・失効管理を追加せずに済む。

## Cookie

- `HttpOnly`: 必須
- `Secure`: 本番環境で必須
- `SameSite`: 配置構成に応じて `Lax` を第一候補に検証
- 有効期限: MVPでは固定期間とし、値は実装時に決定

## パスワード

- Railsの `has_secure_password` を利用する。
- 平文をDB・ログ・エラーレスポンスへ残さない。
- 最低8文字。

## エンドポイント

- `POST /api/v1/session`
- `DELETE /api/v1/session`
- `GET /api/v1/me`

## CSRF

- Cookie認証の変更系リクエストでCSRF対策を行う。
- Next.jsとRailsの本番配置を確定後、トークン取得・送信方式を決める。

## 未確定事項

- 本番の同一オリジン転送方式。
- セッション有効期限と延長方針。

