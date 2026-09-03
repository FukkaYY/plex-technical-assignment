class JobPosting < ApplicationRecord
  belongs_to :company, class_name: "User", inverse_of: :job_postings

  enum :status, { published: "published", closed: "closed" }, validate: true

  before_validation :normalize_fields

  validates :title, presence: true, length: { maximum: 120 }
  validates :role_name, presence: true, length: { maximum: 100 }
  validates :work_location, presence: true, length: { maximum: 200 }
  validates :description, presence: true, length: { maximum: 5_000 }
  validates :requirements, presence: true, length: { maximum: 3_000 }
  validate :company_has_company_role

  private

  def normalize_fields
    %i[title role_name work_location description requirements].each do |field|
      self[field] = self[field].to_s.strip
    end
  end

  def company_has_company_role
    errors.add(:company, :invalid) if company.present? && !company.company?
  end
end
