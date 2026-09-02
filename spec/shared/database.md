# DB設計

## users

| カラム | 型 | 制約 |
|---|---|---|
| id | bigint | PK |
| email | string | NOT NULL、前後空白除去・小文字化後UNIQUE |
| password_digest | string | NOT NULL |
| role | string | NOT NULL、student/company |
| created_at / updated_at | datetime | NOT NULL |

## student_profiles

| カラム | 型 | 制約 |
|---|---|---|
| id | bigint | PK |
| user_id | bigint | FK、NOT NULL、UNIQUE |
| name | string | NOT NULL |
| school_name | string | NOT NULL |
| graduation_year | integer | NOT NULL |
| desired_role | string | NOT NULL |
| skills | jsonb | NOT NULL、既定値 `[]` |
| self_introduction | text | NOT NULL |
| created_at / updated_at | datetime | NOT NULL |

## company_profiles

| カラム | 型 | 制約 |
|---|---|---|
| id | bigint | PK |
| user_id | bigint | FK、NOT NULL、UNIQUE |
| company_name | string | NOT NULL、200文字以内 |
| created_at / updated_at | datetime | NOT NULL |

## conversations

| カラム | 型 | 制約 |
|---|---|---|
| id | bigint | PK |
| company_id | bigint | usersへのFK、NOT NULL |
| student_id | bigint | usersへのFK、NOT NULL |
| created_at / updated_at | datetime | NOT NULL |

`company_id, student_id` に複合UNIQUE制約を設定し、同じ企業と学生の会話を1件に固定する。両IDが同じ値になることをCHECK制約で禁止する。

## messages

| カラム | 型 | 制約 |
|---|---|---|
| id | bigint | PK |
| conversation_id | bigint | FK、NOT NULL |
| sender_id | bigint | usersへのFK、NOT NULL |
| body | text | NOT NULL |
| created_at / updated_at | datetime | NOT NULL |

メッセージは `conversation_id, created_at, id` の順で古いものから安定して取得できるindexを持つ。本文は前後空白除去後1文字以上2,000文字以内とする。

## 共通制約

- 外部キーと検索対象へ適切なindexを設定する。
- `users.email` はDB制約でも大文字小文字を無視して一意にする。
- ユーザー削除時の従属データ削除方針を明示する。
- roleとプロフィール種別の整合性はモデル検証と作成サービスで保証する。
- `company_profiles` は `company` ロールのユーザーにだけ関連付ける。
- `conversations.company_id` は企業ロール、`conversations.student_id` は学生ロールだけを関連付ける。
- `messages.sender_id` は会話参加者だけを関連付ける。
- ユーザー削除時は参加する会話と送信メッセージ、会話削除時は配下のメッセージを削除する。
- 学生一覧の `created_at DESC, id DESC` を安定して取得するため、`student_profiles(created_at, id)` に複合indexを設定する。
