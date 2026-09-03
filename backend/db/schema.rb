# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_09_03_000010) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "company_profiles", force: :cascade do |t|
    t.string "company_name", limit: 200, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["user_id"], name: "index_company_profiles_on_user_id", unique: true
  end

  create_table "conversations", force: :cascade do |t|
    t.bigint "company_id", null: false
    t.datetime "created_at", null: false
    t.bigint "student_id", null: false
    t.datetime "updated_at", null: false
    t.bigint "student_last_read_message_id"
    t.index ["company_id", "student_id"], name: "index_conversations_on_company_id_and_student_id", unique: true
    t.index ["company_id"], name: "index_conversations_on_company_id"
    t.index ["student_id"], name: "index_conversations_on_student_id"
    t.index ["student_last_read_message_id"], name: "index_conversations_on_student_last_read_message_id"
    t.check_constraint "company_id <> student_id", name: "conversations_distinct_participants"
    t.check_constraint "student_last_read_message_id IS NULL OR student_last_read_message_id > 0", name: "conversations_student_last_read_message_id_positive"
  end

  create_table "group_conversations", force: :cascade do |t|
    t.bigint "company_id", null: false
    t.string "name", limit: 100, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["company_id"], name: "index_group_conversations_on_company_id"
  end

  create_table "group_memberships", force: :cascade do |t|
    t.bigint "group_conversation_id", null: false
    t.bigint "student_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["group_conversation_id", "student_id"], name: "index_group_memberships_on_group_and_student", unique: true
    t.index ["group_conversation_id"], name: "index_group_memberships_on_group_conversation_id"
    t.index ["student_id"], name: "index_group_memberships_on_student_id"
  end

  create_table "group_messages", force: :cascade do |t|
    t.bigint "group_conversation_id", null: false
    t.bigint "sender_id", null: false
    t.text "body", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["group_conversation_id", "created_at", "id"], name: "index_group_messages_on_group_and_created_at"
    t.index ["group_conversation_id"], name: "index_group_messages_on_group_conversation_id"
    t.index ["sender_id"], name: "index_group_messages_on_sender_id"
  end

  create_table "messages", force: :cascade do |t|
    t.text "body", null: false
    t.bigint "conversation_id", null: false
    t.datetime "created_at", null: false
    t.bigint "sender_id", null: false
    t.datetime "updated_at", null: false
    t.index ["conversation_id", "created_at", "id"], name: "index_messages_on_conversation_id_and_created_at_and_id"
    t.index ["conversation_id"], name: "index_messages_on_conversation_id"
    t.index ["sender_id"], name: "index_messages_on_sender_id"
  end

  create_table "job_postings", force: :cascade do |t|
    t.bigint "company_id", null: false
    t.string "title", limit: 120, null: false
    t.string "role_name", limit: 100, null: false
    t.string "work_location", limit: 200, null: false
    t.text "description", null: false
    t.text "requirements", null: false
    t.string "status", default: "published", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["company_id"], name: "index_job_postings_on_company_id"
    t.index ["status", "created_at", "id"], name: "index_job_postings_on_status_and_created_at_and_id"
    t.check_constraint "status::text = ANY (ARRAY['published'::character varying, 'closed'::character varying]::text[])", name: "job_postings_status_check"
  end

  create_table "student_profiles", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "desired_role", limit: 100, null: false
    t.integer "graduation_year", null: false
    t.string "name", limit: 100, null: false
    t.string "school_name", limit: 200, null: false
    t.text "self_introduction", null: false
    t.jsonb "skills", default: [], null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["created_at", "id"], name: "index_student_profiles_on_created_at_and_id"
    t.index ["user_id"], name: "index_student_profiles_on_user_id", unique: true
  end

  create_table "schedule_proposals", force: :cascade do |t|
    t.bigint "conversation_id", null: false
    t.datetime "starts_at", null: false
    t.datetime "ends_at", null: false
    t.string "location", limit: 200, null: false
    t.text "note", default: "", null: false
    t.string "status", default: "pending", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["conversation_id", "created_at", "id"], name: "index_schedule_proposals_on_conversation_and_created_at"
    t.index ["conversation_id"], name: "index_schedule_proposals_on_conversation_id"
    t.check_constraint "ends_at > starts_at", name: "schedule_proposals_valid_period"
    t.check_constraint "status::text = ANY (ARRAY['pending'::character varying, 'accepted'::character varying, 'declined'::character varying, 'cancelled'::character varying]::text[])", name: "schedule_proposals_status_check"
  end

  create_table "users", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "email", null: false
    t.string "password_digest", null: false
    t.string "role", null: false
    t.datetime "updated_at", null: false
    t.index "lower((email)::text)", name: "index_users_on_lower_email", unique: true
    t.check_constraint "role::text = ANY (ARRAY['student'::character varying, 'company'::character varying]::text[])", name: "users_role_check"
  end

  add_foreign_key "company_profiles", "users", on_delete: :cascade
  add_foreign_key "conversations", "users", column: "company_id", on_delete: :cascade
  add_foreign_key "conversations", "users", column: "student_id", on_delete: :cascade
  add_foreign_key "group_conversations", "users", column: "company_id", on_delete: :cascade
  add_foreign_key "group_memberships", "group_conversations", on_delete: :cascade
  add_foreign_key "group_memberships", "users", column: "student_id", on_delete: :cascade
  add_foreign_key "group_messages", "group_conversations", on_delete: :cascade
  add_foreign_key "group_messages", "users", column: "sender_id", on_delete: :cascade
  add_foreign_key "job_postings", "users", column: "company_id", on_delete: :cascade
  add_foreign_key "messages", "conversations", on_delete: :cascade
  add_foreign_key "messages", "users", column: "sender_id", on_delete: :cascade
  add_foreign_key "schedule_proposals", "conversations", on_delete: :cascade
  add_foreign_key "student_profiles", "users", on_delete: :cascade
end
