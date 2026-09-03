require "rails_helper"

RSpec.describe "Group conversations", type: :request do
  before { Rails.cache.clear }
  let!(:company) { create_user("company@example.com", :company, "企業") }
  let!(:other_company) { create_user("other@example.com", :company, "他社") }
  let!(:first_student) { create_user("first@example.com", :student, "学生1") }
  let!(:second_student) { create_user("second@example.com", :student, "学生2") }
  let!(:outsider) { create_user("outsider@example.com", :student, "部外者") }

  def create_user(email, role, name)
    user = User.create!(email: email, password: "password123", password_confirmation: "password123", role: role)
    role == :company ? user.create_company_profile!(company_name: name) : user.create_student_profile!(name: name, school_name: "大学", graduation_year: Time.zone.today.year + 1, desired_role: "開発", skills: ["Ruby"], self_introduction: "紹介")
    user
  end

  def csrf_token
    get "/api/v1/csrf"
    response.parsed_body.dig("data", "csrf_token")
  end

  def login_as(user)
    post "/api/v1/session", params: { session: { email: user.email, password: "password123", role: user.role } }, headers: { "X-CSRF-Token" => csrf_token }, as: :json
  end

  def create_group
    group = GroupConversation.create!(company: company, name: "開発グループ")
    [first_student, second_student].each { |student| group.group_memberships.create!(student: student) }
    group.group_messages.create!(sender: company, body: "最初の連絡")
    group
  end

  it "creates a group, memberships, and initial message atomically" do
    login_as(company)
    expect {
      post "/api/v1/company/group_conversations", params: { group_conversation: { name: " 新規グループ ", student_ids: [first_student.id, second_student.id], body: " よろしくお願いします " } }, headers: { "X-CSRF-Token" => csrf_token }, as: :json
    }.to change(GroupConversation, :count).by(1).and change(GroupMembership, :count).by(2).and change(GroupMessage, :count).by(1)
    expect(response).to have_http_status(:created)
    expect(response.parsed_body.dig("data", "students").pluck("name")).to contain_exactly("学生1", "学生2")
    expect(response.parsed_body.dig("data", "messages", 0, "body")).to eq("よろしくお願いします")
  end

  it "rejects too few, duplicate, or invalid students without partial records" do
    login_as(company)
    [[first_student.id], [first_student.id, first_student.id], [first_student.id, 999_999]].each do |ids|
      expect {
        post "/api/v1/company/group_conversations", params: { group_conversation: { name: "不正", student_ids: ids, body: "本文" } }, headers: { "X-CSRF-Token" => csrf_token }, as: :json
      }.not_to change(GroupConversation, :count)
      expect(response).to have_http_status(:unprocessable_entity)
    end
  end

  it "lets members and the owner exchange messages" do
    group = create_group
    login_as(first_student)
    post "/api/v1/group_conversations/#{group.id}/messages", params: { message: { body: "学生返信" } }, headers: { "X-CSRF-Token" => csrf_token }, as: :json
    expect(response).to have_http_status(:created)

    delete "/api/v1/session", headers: { "X-CSRF-Token" => csrf_token }
    login_as(company)
    get "/api/v1/company/group_conversations/#{group.id}"
    expect(response.parsed_body.dig("data", "messages").pluck("body")).to eq(["最初の連絡", "学生返信"])
    expect(response.parsed_body.dig("data", "messages", 1, "sender_name")).to eq("学生1")
  end

  it "hides groups from other companies and non-member students" do
    group = create_group
    login_as(other_company)
    get "/api/v1/company/group_conversations/#{group.id}"
    expect(response).to have_http_status(:not_found)

    delete "/api/v1/session", headers: { "X-CSRF-Token" => csrf_token }
    login_as(outsider)
    get "/api/v1/group_conversations/#{group.id}"
    expect(response).to have_http_status(:not_found)
  end

  it "does not expose participant emails and orders lists by latest activity" do
    older = create_group
    newer = GroupConversation.create!(company: company, name: "新しいグループ")
    [first_student, second_student].each { |student| newer.group_memberships.create!(student: student) }
    newer.group_messages.create!(sender: company, body: "新着")
    older.update_columns(updated_at: 1.day.ago)
    login_as(first_student)
    get "/api/v1/group_conversations"
    expect(response.parsed_body.fetch("data").pluck("id")).to eq([newer.id, older.id])
    get "/api/v1/group_conversations/#{newer.id}"
    expect(response.body).not_to include(first_student.email, second_student.email)
  end

  it "requires CSRF for creation" do
    login_as(company)
    post "/api/v1/company/group_conversations", params: { group_conversation: { name: "グループ", student_ids: [first_student.id, second_student.id], body: "本文" } }, as: :json
    expect(response).to have_http_status(:unprocessable_entity)
    expect(GroupConversation.count).to eq(0)
  end
end
