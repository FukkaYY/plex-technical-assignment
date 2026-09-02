module Api
  module V1
    class ConversationsController < ApplicationController
      before_action :require_student

      def index
        conversations = current_user.student_conversations
          .includes(company: :company_profile, messages: :sender)
          .sort_by { |conversation| [conversation.messages.last&.created_at || conversation.created_at, conversation.id] }
          .reverse

        render json: {
          data: conversations.filter_map { |conversation| list_item_json(conversation) }
        }
      end

      def show
        conversation = current_user.student_conversations
          .includes(company: :company_profile, messages: :sender)
          .find_by(id: params[:id])

        unless conversation
          render json: {
            errors: [{ field: "conversation", code: "not_found", message: "会話が見つかりません" }]
          }, status: :not_found
          return
        end

        render json: {
          data: {
            id: conversation.id,
            company: company_json(conversation.company),
            messages: conversation.messages.map { |message| message_json(message) }
          }
        }
      end

      def mark_read
        conversation = current_user.student_conversations.find_by(id: params[:id])

        unless conversation
          render json: {
            errors: [{ field: "conversation", code: "not_found", message: "会話が見つかりません" }]
          }, status: :not_found
          return
        end

        message = conversation.messages.find_by(id: read_params[:message_id])
        unless message
          render json: {
            errors: [{ field: "message_id", code: "invalid", message: "既読にするメッセージが正しくありません" }]
          }, status: :unprocessable_entity
          return
        end

        conversation.mark_read_by_student!(message)
        render json: { data: { unread_count: conversation.student_unread_count } }
      end

      private

      def list_item_json(conversation)
        latest_message = conversation.messages.last
        return unless latest_message

        {
          id: conversation.id,
          company: company_json(conversation.company),
          latest_message_excerpt: latest_message.body.truncate(120, omission: "…"),
          latest_message_sent_at: latest_message.created_at.utc.iso8601,
          unread_count: conversation.student_unread_count
        }
      end

      def read_params
        params.require(:conversation).permit(:message_id)
      end

      def company_json(company)
        {
          company_name: company.company_profile.company_name
        }
      end

      def message_json(message)
        {
          id: message.id,
          body: message.body,
          sent_at: message.created_at.utc.iso8601,
          sender_role: message.sender.role
        }
      end
    end
  end
end
