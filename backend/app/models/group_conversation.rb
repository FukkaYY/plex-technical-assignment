class GroupConversation < ApplicationRecord
  MIN_STUDENTS = 2
  MAX_STUDENTS = 20

  belongs_to :company, class_name: "User", inverse_of: :company_group_conversations
  has_many :group_memberships, dependent: :destroy, inverse_of: :group_conversation
  has_many :students, through: :group_memberships
  has_many :group_messages, -> { order(created_at: :asc, id: :asc) }, dependent: :destroy, inverse_of: :group_conversation

  before_validation { self.name = name.to_s.strip }

  validates :name, presence: true, length: { maximum: 100 }
  validate :company_has_company_role

  private

  def company_has_company_role
    errors.add(:company, :invalid) if company.present? && !company.company?
  end
end
