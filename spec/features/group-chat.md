# グループチャット

## 目的

企業が複数の学生へ共通の連絡を送り、招待された参加者だけで会話できるようにする。

## 優先度・区分

- 優先度: P2
- 設計判断: 1対1会話とデータ・認可を分離する。
- 設計判断: 企業だけがグループを作成し、作成後の参加者変更は扱わない。

## 作成

- 企業がグループ名、2〜20人の学生、最初のメッセージを指定する。
- グループ名は前後空白除去後1〜100文字。
- 最初のメッセージは前後空白除去後1〜2,000文字。
- 重複、不正、企業ロールを含む学生IDを拒否する。
- グループ、参加者、最初のメッセージを同一トランザクションで作成する。

## 閲覧・送信

- 作成企業と参加学生だけが一覧・詳細・メッセージ送信を利用できる。
- 一覧は最新メッセージ活動順で、グループ名、参加人数、最新本文の抜粋を表示する。
- 詳細は参加学生の表示名と全メッセージを古い順で表示する。
- メッセージは送信者名、student/companyロール、送信日時を含む。
- 学生のメールアドレスやプロフィール詳細は返さない。
- 他社・非参加学生のグループは404として存在を隠す。

## API

- `GET/POST /api/v1/company/group_conversations`
- `GET /api/v1/company/group_conversations/:id`
- `POST /api/v1/company/group_conversations/:id/messages`
- `GET /api/v1/group_conversations`
- `GET /api/v1/group_conversations/:id`
- `POST /api/v1/group_conversations/:id/messages`

## 画面

- 企業: `/companies/groups`、`/companies/groups/new`、`/companies/groups/:id`
- 学生: `/students/groups`、`/students/groups/:id`
- メッセージ送信中は入力とボタンを無効にし、成功時は履歴へ反映する。

## 対象外

- 参加者追加・削除、名称変更、グループ削除、未読管理、予定調整、添付ファイル。
