require "rails_helper"

RSpec.describe Conversation, type: :model do
  def create_user(email:, role:)
    user = User.create!(
      email: email,
      password: "password123",
      password_confirmation: "password123",
      role: role
    )
    role == :company ? user.create_company_profile!(company_name: "企業") : user.create_student_profile!(
      name: "学生",
      school_name: "大学",
      graduation_year: Time.zone.today.year + 1,
      desired_role: "エンジニア",
      skills: ["Ruby"],
      self_introduction: "自己紹介"
    )
    user
  end

  it "allows only one conversation for a company and student pair" do
    company = create_user(email: "company@example.com", role: :company)
    student = create_user(email: "student@example.com", role: :student)
    described_class.create!(company: company, student: student)

    duplicate = described_class.new(company: company, student: student)

    expect(duplicate).not_to be_valid
    expect(duplicate.errors.of_kind?(:student_id, :taken)).to be(true)
  end

  it "requires participants to have the expected roles" do
    first_student = create_user(email: "student1@example.com", role: :student)
    second_student = create_user(email: "student2@example.com", role: :student)

    conversation = described_class.new(company: first_student, student: second_student)

    expect(conversation).not_to be_valid
    expect(conversation.errors.of_kind?(:company, :invalid)).to be(true)
  end
end
