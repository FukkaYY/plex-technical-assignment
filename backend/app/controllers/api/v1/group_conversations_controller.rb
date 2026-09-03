module Api
  module V1
    class GroupConversationsController < ApplicationController
      before_action :require_student

      def index
        groups = current_user.student_group_conversations.includes(company: :company_profile, group_messages: :sender).order(updated_at: :desc, id: :desc)
        render json: { data: groups.map { |group| list_json(group) } }
      end

      def show
        group = current_user.student_group_conversations.includes(company: :company_profile, students: :student_profile, group_messages: :sender).find_by(id: params[:id])
        return render_not_found unless group

        render json: { data: detail_json(group) }
      end

      def create_message
        group = current_user.student_group_conversations.find_by(id: params[:id])
        return render_not_found unless group

        message = group.group_messages.create!(sender: current_user, body: message_params[:body])
        render json: { data: message_json(message) }, status: :created
      rescue ActiveRecord::RecordInvalid => error
        render json: { errors: validation_errors(error.record.errors) }, status: :unprocessable_entity
      end

      private

      def message_params
        params.require(:message).permit(:body)
      end

      def list_json(group)
        latest = group.group_messages.last
        { id: group.id, name: group.name, company: { company_name: group.company.company_profile.company_name }, student_count: group.students.length, latest_message_excerpt: latest&.body&.truncate(120, omission: "…"), latest_message_sent_at: latest&.created_at&.utc&.iso8601 }
      end

      def detail_json(group)
        { id: group.id, name: group.name, company: { company_name: group.company.company_profile.company_name }, students: group.students.map { |student| { id: student.id, name: student.student_profile.name } }, messages: group.group_messages.map { |message| message_json(message) } }
      end

      def message_json(message)
        { id: message.id, body: message.body, sent_at: message.created_at.utc.iso8601, sender_role: message.sender.role, sender_name: message.sender.company? ? message.sender.company_profile.company_name : message.sender.student_profile.name }
      end

      def render_not_found
        render json: { errors: [{ field: "group_conversation", code: "not_found", message: "グループが見つかりません" }] }, status: :not_found
      end
    end
  end
end
