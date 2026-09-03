class GroupMembership < ApplicationRecord
  belongs_to :group_conversation, inverse_of: :group_memberships
  belongs_to :student, class_name: "User", inverse_of: :group_memberships

  validates :student_id, uniqueness: { scope: :group_conversation_id }
  validate :student_has_student_role

  private

  def student_has_student_role
    errors.add(:student, :invalid) if student.present? && !student.student?
  end
end
