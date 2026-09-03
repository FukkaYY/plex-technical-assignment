require "rails_helper"

RSpec.describe "Student profiles", type: :request do
  before { Rails.cache.clear }

  let!(:student) do
    user = User.create!(
      email: "student@example.com",
      password: "password123",
      password_confirmation: "password123",
      role: :student
    )
    user.create_student_profile!(
      name: "更新前 学生",
      school_name: "更新前大学",
      graduation_year: Time.zone.today.year + 1,
      desired_role: "エンジニア",
      skills: ["Ruby"],
      self_introduction: "更新前の自己紹介"
    )
    user
  end

  let!(:company) do
    user = User.create!(
      email: "company@example.com",
      password: "password123",
      password_confirmation: "password123",
      role: :company
    )
    user.create_company_profile!(company_name: "企業株式会社")
    user
  end

  def csrf_token
    get "/api/v1/csrf"
    response.parsed_body.dig("data", "csrf_token")
  end

  def login(user, role: user.role)
    post "/api/v1/session",
      params: { session: { email: user.email, password: "password123", role: role } },
      headers: { "X-CSRF-Token" => csrf_token },
      as: :json
  end

  def update_profile(attributes)
    patch "/api/v1/student_profile",
      params: { student_profile: attributes },
      headers: { "X-CSRF-Token" => csrf_token },
      as: :json
  end

  def update_visibility(value, include_csrf: true)
    headers = include_csrf ? { "X-CSRF-Token" => csrf_token } : {}
    patch "/api/v1/student_profile/visibility",
      params: { student_profile: { visible_to_companies: value } },
      headers: headers,
      as: :json
  end

  it "updates the signed-in student's profile with normalized values" do
    login(student)

    update_profile(
      name: "  更新後 学生  ",
      school_name: " 更新後大学 ",
      graduation_year: Time.zone.today.year + 2,
      desired_role: " バックエンドエンジニア ",
      skills: [" Rails ", "PostgreSQL", "Rails", ""],
      self_introduction: " 更新後の自己紹介 ",
      email: "changed@example.com",
      password: "changed-password",
      role: "company"
    )

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.fetch("data")).to include(
      "user_id" => student.id,
      "name" => "更新後 学生",
      "school_name" => "更新後大学",
      "graduation_year" => Time.zone.today.year + 2,
      "desired_role" => "バックエンドエンジニア",
      "skills" => ["Rails", "PostgreSQL"],
      "self_introduction" => "更新後の自己紹介"
    )
    expect(student.reload).to have_attributes(email: "student@example.com", role: "student")
    expect(student.authenticate("password123")).to eq(student)
  end

  it "returns validation errors without changing the profile" do
    login(student)

    expect {
      update_profile(name: "", graduation_year: Time.zone.today.year - 1)
    }.not_to change { student.student_profile.reload.name }

    expect(response).to have_http_status(:unprocessable_entity)
    expect(response.parsed_body.fetch("errors")).to include(
      include("field" => "name", "code" => "blank"),
      include("field" => "graduation_year", "code" => "greater_than_or_equal_to")
    )
  end

  it "rejects unauthenticated requests" do
    update_profile(name: "変更不可")

    expect(response).to have_http_status(:unauthorized)
    expect(response.parsed_body.dig("errors", 0, "code")).to eq("unauthenticated")
  end

  it "rejects company requests" do
    login(company)
    update_profile(name: "変更不可")

    expect(response).to have_http_status(:forbidden)
    expect(response.parsed_body.dig("errors", 0, "code")).to eq("forbidden")
    expect(student.student_profile.reload.name).to eq("更新前 学生")
  end

  it "lets a student hide and republish their profile" do
    login(student)

    update_visibility(false)
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig("data", "visible_to_companies")).to be(false)
    expect(student.student_profile.reload.visible_to_companies).to be(false)

    update_visibility(true)
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig("data", "visible_to_companies")).to be(true)
    expect(student.student_profile.reload.visible_to_companies).to be(true)
  end

  it "protects visibility changes with authentication, role authorization, and CSRF" do
    update_visibility(false)
    expect(response).to have_http_status(:unauthorized)

    login(company)
    update_visibility(false)
    expect(response).to have_http_status(:forbidden)

    login(student)
    update_visibility(false, include_csrf: false)
    expect(response).to have_http_status(:unprocessable_entity)
    expect(response.parsed_body.dig("errors", 0, "field")).to eq("csrf_token")
    expect(student.student_profile.reload.visible_to_companies).to be(true)
  end

  it "rejects a missing or non-boolean visibility value" do
    login(student)

    [nil, "false"].each do |value|
      update_visibility(value)
      expect(response).to have_http_status(:unprocessable_entity)
      expect(response.parsed_body.dig("errors", 0)).to include(
        "field" => "visible_to_companies",
        "code" => "invalid"
      )
    end
  end
end
