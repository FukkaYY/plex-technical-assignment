require "rails_helper"

RSpec.describe GroupConversation, type: :model do
  def user(email, role)
    User.create!(email: email, password: "password123", password_confirmation: "password123", role: role)
  end

  it "normalizes its name and requires a company owner" do
    company = user("company@example.com", :company)
    group = described_class.new(company: company, name: "  開発チーム  ")
    expect(group).to be_valid
    group.save!
    expect(group.name).to eq("開発チーム")

    group.company = user("student@example.com", :student)
    expect(group).not_to be_valid
  end
end
