class User < ApplicationRecord
  has_secure_password

  has_one :student_profile, dependent: :destroy
  has_one :company_profile, dependent: :destroy

  enum :role, { student: "student", company: "company" }, validate: true

  before_validation :normalize_email

  validates :email,
    presence: true,
    format: { with: URI::MailTo::EMAIL_REGEXP },
    uniqueness: { case_sensitive: false }
  validates :password, length: { minimum: 8 }, if: -> { password.present? }
  validates :password_confirmation, presence: true, if: -> { password.present? }

  private

  def normalize_email
    self.email = email.to_s.strip.downcase
  end
end
