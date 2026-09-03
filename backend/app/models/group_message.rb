class GroupMessage < ApplicationRecord
  MAX_BODY_LENGTH = 2_000

  belongs_to :group_conversation, inverse_of: :group_messages, touch: true
  belongs_to :sender, class_name: "User", inverse_of: :sent_group_messages

  before_validation { self.body = body.to_s.strip }

  validates :body, presence: true, length: { maximum: MAX_BODY_LENGTH }
  validate :sender_participates

  private

  def sender_participates
    return if group_conversation.blank? || sender.blank?
    return if sender_id == group_conversation.company_id
    return if group_conversation.group_memberships.any? { |membership| membership.student_id == sender_id }

    errors.add(:sender, :invalid)
  end
end
