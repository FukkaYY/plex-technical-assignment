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

schools = ["東京デモ大学", "関西サンプル大学", "北海道テスト大学", "九州モック工科大学"]
desired_roles = ["バックエンドエンジニア", "フロントエンドエンジニア", "プロダクトマネージャー", "データエンジニア"]
skill_sets = [
  ["Ruby", "Rails", "PostgreSQL", "Docker"],
  ["TypeScript", "React", "Next.js"],
  ["Python", "SQL", "AWS", "Git"],
  ["Figma", "TypeScript"]
]

25.times do |index|
  number = index + 1
  email = format("student%02d@example.com", number)

  User.transaction do
    student = User.find_or_initialize_by(email: email)
    if student.persisted? && !student.student?
      raise "Seed email is already assigned to a non-student user: #{email}"
    end

    student.assign_attributes(
      role: :student,
      password: "password123",
      password_confirmation: "password123"
    )
    student.save!

    profile = student.student_profile || student.build_student_profile
    profile.assign_attributes(
      name: "デモ学生 #{format('%02d', number)}",
      school_name: schools[index % schools.length],
      graduation_year: Time.zone.today.year + (index % 4) + 1,
      desired_role: desired_roles[index % desired_roles.length],
      skills: skill_sets[index % skill_sets.length],
      self_introduction: "架空のデモ学生#{number}です。学業と個人開発を両立し、チームで価値を届けることに関心があります。"
    )
    profile.save!
  end
end
