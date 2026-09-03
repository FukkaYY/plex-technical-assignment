require "rails_helper"

RSpec.describe GroupMessage, type: :model do
  def user(email, role)
    account = User.create!(email: email, password: "password123", password_confirmation: "password123", role: role)
    role == :company ? account.create_company_profile!(company_name: "企業") : account.create_student_profile!(name: email, school_name: "大学", graduation_year: Time.zone.today.year + 1, desired_role: "開発", skills: ["Ruby"], self_introduction: "紹介")
    account
  end

  it "allows only the owner company or member students to send" do
    company = user("company@example.com", :company)
    member = user("member@example.com", :student)
    outsider = user("outsider@example.com", :student)
    group = GroupConversation.create!(company: company, name: "グループ")
    group.group_memberships.create!(student: member)

    expect(group.group_messages.new(sender: company, body: "企業")).to be_valid
    expect(group.group_messages.new(sender: member, body: "学生")).to be_valid
    expect(group.group_messages.new(sender: outsider, body: "部外者")).not_to be_valid
  end
end
