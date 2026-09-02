class Conversation < ApplicationRecord
  belongs_to :company, class_name: "User", inverse_of: :company_conversations
  belongs_to :student, class_name: "User", inverse_of: :student_conversations
  has_many :messages, -> { order(created_at: :asc, id: :asc) }, dependent: :destroy, inverse_of: :conversation

  validates :student_id, uniqueness: { scope: :company_id }
  validate :participants_have_expected_roles

  private

  def participants_have_expected_roles
    errors.add(:company, :invalid) if company.present? && !company.company?
    errors.add(:student, :invalid) if student.present? && !student.student?
  end
end
