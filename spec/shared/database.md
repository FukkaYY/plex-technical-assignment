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

## conversations（案）

| カラム | 型 | 制約 |
|---|---|---|
| id | bigint | PK |
| company_id | bigint | usersへのFK、NOT NULL |
| student_id | bigint | usersへのFK、NOT NULL |
| created_at / updated_at | datetime | NOT NULL |

`company_id, student_id` の複合UNIQUEを第一候補とするが、メッセージ仕様確定時に決定する。

## messages（案）

| カラム | 型 | 制約 |
|---|---|---|
| id | bigint | PK |
| conversation_id | bigint | FK、NOT NULL |
| sender_id | bigint | usersへのFK、NOT NULL |
| body | text | NOT NULL |
| created_at / updated_at | datetime | NOT NULL |

## 共通制約

- 外部キーと検索対象へ適切なindexを設定する。
- `users.email` はDB制約でも大文字小文字を無視して一意にする。
- ユーザー削除時の従属データ削除方針を明示する。
- roleとプロフィール種別の整合性はモデル検証と作成サービスで保証する。
- `company_profiles` は `company` ロールのユーザーにだけ関連付ける。
- 学生一覧の `created_at DESC, id DESC` を安定して取得するため、`student_profiles(created_at, id)` に複合indexを設定する。
