module Api
  module V1
    class CompanyGroupConversationsController < ApplicationController
      before_action :require_company

      def index
        groups = current_user.company_group_conversations.includes(:students, :group_messages).order(updated_at: :desc, id: :desc)
        render json: { data: groups.map { |group| list_json(group) } }
      end

      def show
        group = current_user.company_group_conversations.includes(students: :student_profile, group_messages: :sender).find_by(id: params[:id])
        return render_not_found unless group

        render json: { data: detail_json(group) }
      end

      def create
        creation = GroupConversationCreation.new(company: current_user, **creation_params.to_h.symbolize_keys)
        if creation.save
          group = current_user.company_group_conversations.includes(students: :student_profile, group_messages: :sender).find(creation.group_conversation.id)
          render json: { data: detail_json(group) }, status: :created
        else
          render json: { errors: creation_errors(creation) }, status: :unprocessable_entity
        end
      end

      def create_message
        group = current_user.company_group_conversations.find_by(id: params[:id])
        return render_not_found unless group

        message = group.group_messages.create!(sender: current_user, body: message_params[:body])
        render json: { data: message_json(message) }, status: :created
      rescue ActiveRecord::RecordInvalid => error
        render json: { errors: validation_errors(error.record.errors) }, status: :unprocessable_entity
      end

      private

      def creation_params
        params.require(:group_conversation).permit(:name, :body, student_ids: [])
      end

      def message_params
        params.require(:message).permit(:body)
      end

      def list_json(group)
        latest = group.group_messages.last
        { id: group.id, name: group.name, student_count: group.students.length, latest_message_excerpt: latest&.body&.truncate(120, omission: "…"), latest_message_sent_at: latest&.created_at&.utc&.iso8601 }
      end

      def detail_json(group)
        { id: group.id, name: group.name, students: group.students.map { |student| { id: student.id, name: student.student_profile.name } }, messages: group.group_messages.map { |message| message_json(message) } }
      end

      def message_json(message)
        { id: message.id, body: message.body, sent_at: message.created_at.utc.iso8601, sender_role: message.sender.role, sender_name: sender_name(message.sender) }
      end

      def sender_name(sender)
        sender.company? ? sender.company_profile.company_name : sender.student_profile.name
      end

      def creation_errors(creation)
        creation.errors.map do |error|
          message = case [error.attribute, error.type]
          when [:student_ids, :count] then "参加学生は2人以上20人以下で選択してください"
          when [:student_ids, :invalid] then "参加学生が正しくありません"
          else validation_message(error.attribute, error.type, error.message)
          end
          { field: error.attribute.to_s, code: error.type.to_s, message: message }
        end
      end

      def render_not_found
        render json: { errors: [{ field: "group_conversation", code: "not_found", message: "グループが見つかりません" }] }, status: :not_found
      end
    end
  end
end
