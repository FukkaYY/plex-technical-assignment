class Conversation < ApplicationRecord
  belongs_to :company, class_name: "User", inverse_of: :company_conversations
  belongs_to :student, class_name: "User", inverse_of: :student_conversations
  has_many :messages, -> { order(created_at: :asc, id: :asc) }, dependent: :destroy, inverse_of: :conversation

  validates :student_id, uniqueness: { scope: :company_id }
  validate :participants_have_expected_roles

  def student_unread_count
    if messages.loaded?
      return messages.count do |message|
        message.sender_id == company_id &&
          (student_last_read_message_id.nil? || message.id > student_last_read_message_id)
      end
    end

    scope = messages.where(sender_id: company_id)
    scope = scope.where("id > ?", student_last_read_message_id) if student_last_read_message_id
    scope.count
  end

  def mark_read_by_student!(message)
    raise ArgumentError, "message must belong to conversation" unless message.conversation_id == id

    with_lock do
      if student_last_read_message_id.nil? || message.id > student_last_read_message_id
        update!(student_last_read_message_id: message.id)
      end
    end
  end

  private

  def participants_have_expected_roles
    errors.add(:company, :invalid) if company.present? && !company.company?
    errors.add(:student, :invalid) if student.present? && !student.student?
  end
end
