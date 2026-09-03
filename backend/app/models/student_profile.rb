class StudentProfile < ApplicationRecord
  MAX_SKILLS = 20
  MAX_SKILL_LENGTH = 50

  belongs_to :user

  scope :visible_to_companies, -> { where(visible_to_companies: true) }

  before_validation :normalize_attributes

  validates :name, presence: true, length: { maximum: 100 }
  validates :school_name, presence: true, length: { maximum: 200 }
  validates :desired_role, presence: true, length: { maximum: 100 }
  validates :self_introduction, presence: true, length: { maximum: 2_000 }
  validates :graduation_year,
    numericality: {
      only_integer: true,
      greater_than_or_equal_to: ->(_) { Time.zone.today.year },
      less_than_or_equal_to: ->(_) { Time.zone.today.year + 10 }
    }
  validate :skills_are_valid
  validate :user_is_student

  private

  def normalize_attributes
    self.name = name.to_s.strip
    self.school_name = school_name.to_s.strip
    self.desired_role = desired_role.to_s.strip
    self.self_introduction = self_introduction.to_s.strip
    self.skills = normalize_skills
  end

  def normalize_skills
    return skills unless skills.is_a?(Array)

    skills.filter_map do |skill|
      normalized = skill.is_a?(String) ? skill.strip : skill
      normalized unless normalized == ""
    end.uniq
  end

  def skills_are_valid
    unless skills.is_a?(Array)
      errors.add(:skills, :invalid)
      return
    end

    errors.add(:skills, :too_many, count: MAX_SKILLS) if skills.length > MAX_SKILLS
    errors.add(:skills, :invalid) unless skills.all? { |skill| skill.is_a?(String) }
    errors.add(:skills, :too_long, count: MAX_SKILL_LENGTH) if skills.any? { |skill| skill.is_a?(String) && skill.length > MAX_SKILL_LENGTH }
  end

  def user_is_student
    errors.add(:user, :invalid) if user.present? && !user.student?
  end
end
