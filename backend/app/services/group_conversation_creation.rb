class GroupConversationCreation
  include ActiveModel::Model

  attr_accessor :company, :name, :student_ids, :body
  attr_reader :group_conversation

  validates :company, presence: true
  validate :validate_students

  def save
    return false unless valid?

    GroupConversation.transaction do
      @group_conversation = company.company_group_conversations.create!(name: name)
      students.each { |student| @group_conversation.group_memberships.create!(student: student) }
      @group_conversation.group_messages.create!(sender: company, body: body)
    end
    true
  rescue ActiveRecord::RecordInvalid => error
    error.record.errors.each { |item| errors.add(item.attribute, item.type) }
    false
  end

  private

  def students
    @students ||= User.student.where(id: normalized_student_ids).to_a
  end

  def normalized_student_ids
    @normalized_student_ids ||= raw_student_ids.select { |id| id.match?(/\A[1-9]\d*\z/) }.map(&:to_i).uniq
  end

  def raw_student_ids
    @raw_student_ids ||= Array(student_ids).map(&:to_s)
  end

  def validate_students
    if raw_student_ids.length != normalized_student_ids.length
      errors.add(:student_ids, :invalid)
      return
    end
    unless normalized_student_ids.length.between?(GroupConversation::MIN_STUDENTS, GroupConversation::MAX_STUDENTS)
      errors.add(:student_ids, :count)
      return
    end
    errors.add(:student_ids, :invalid) unless students.length == normalized_student_ids.length
  end
end
