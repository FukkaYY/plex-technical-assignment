module Api
  module V1
    class StudentsController < ApplicationController
      PER_PAGE = 20

      before_action :require_company

      def index
        page = parsed_page
        return unless page

        scope = StudentProfile.includes(:user).order(created_at: :desc, id: :desc)
        total_count = scope.count
        total_pages = (total_count.to_f / PER_PAGE).ceil
        profiles = scope.offset((page - 1) * PER_PAGE).limit(PER_PAGE)

        render json: {
          data: profiles.map { |profile| list_item_json(profile) },
          meta: {
            page: page,
            per_page: PER_PAGE,
            total_count: total_count,
            total_pages: total_pages,
            has_previous: page > 1,
            has_next: page < total_pages
          }
        }
      end

      def show
        profile = StudentProfile.find_by(user_id: params[:id])
        unless profile
          render json: {
            errors: [{ field: "student", code: "not_found", message: "学生が見つかりません" }]
          }, status: :not_found
          return
        end

        render json: { data: detail_json(profile) }
      end

      private

      def parsed_page
        value = params[:page]
        return 1 if value.nil?
        return value.to_i if value.to_s.match?(/\A[1-9]\d*\z/)

        render json: {
          errors: [{ field: "page", code: "invalid", message: "ページ番号は1以上の整数で指定してください" }]
        }, status: :unprocessable_entity
        nil
      end

      def list_item_json(profile)
        {
          id: profile.user_id,
          name: profile.name,
          school_name: profile.school_name,
          graduation_year: profile.graduation_year,
          desired_role: profile.desired_role,
          skills: profile.skills.first(3),
          skills_count: profile.skills.length,
          self_introduction_excerpt: profile.self_introduction.truncate(120, omission: "…"),
          registered_at: profile.created_at.utc.iso8601
        }
      end

      def detail_json(profile)
        {
          id: profile.user_id,
          name: profile.name,
          school_name: profile.school_name,
          graduation_year: profile.graduation_year,
          desired_role: profile.desired_role,
          skills: profile.skills,
          self_introduction: profile.self_introduction
        }
      end
    end
  end
end
