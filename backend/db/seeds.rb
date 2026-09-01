company_email = if Rails.env.production?
  ENV.fetch("DEMO_COMPANY_EMAIL")
else
  ENV.fetch("DEMO_COMPANY_EMAIL", "company@example.com")
end

company_password = if Rails.env.production?
  ENV.fetch("DEMO_COMPANY_PASSWORD")
else
  ENV.fetch("DEMO_COMPANY_PASSWORD", "password123")
end

normalized_email = company_email.strip.downcase

User.transaction do
  company = User.find_or_initialize_by(email: normalized_email)
  if company.persisted? && !company.company?
    raise "Seed email is already assigned to a non-company user"
  end

  company.assign_attributes(
    role: :company,
    password: company_password,
    password_confirmation: company_password
  )
  company.save!

  profile = company.company_profile || company.build_company_profile
  profile.company_name = "デモ企業株式会社"
  profile.save!
end
