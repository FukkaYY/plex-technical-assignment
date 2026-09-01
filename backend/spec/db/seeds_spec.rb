require "rails_helper"

RSpec.describe "Database seeds" do
  it "creates the demo company idempotently" do
    expect do
      2.times { load Rails.root.join("db/seeds.rb") }
    end.to change(User.company, :count).by(1).and change(CompanyProfile, :count).by(1)

    company = User.find_by!(email: "company@example.com")
    expect(company.company_profile.company_name).to eq("デモ企業株式会社")
    expect(company.authenticate("password123")).to eq(company)
  end
end
