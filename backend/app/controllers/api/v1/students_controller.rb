module Api
  module V1
    class StudentsController < ApplicationController
      PER_PAGE = 20

      before_action :require_company

      def index
        page = parsed_page
        return unless page
        filters = parsed_filters
        return unless filters

        scope = StudentProfile.visible_to_companies.includes(:user).order(created_at: :desc, id: :desc)
        scope = apply_filters(scope, filters)
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
        profile = StudentProfile.visible_to_companies.find_by(user_id: params[:id])
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

      def parsed_filters
        query = params[:query].to_s.strip
        desired_role = params[:desired_role].to_s.strip
        graduation_year = params[:graduation_year].to_s.strip

        return render_filter_error("query", "キーワードは100文字以内で指定してください") if query.length > 100
        return render_filter_error("desired_role", "希望職種は100文字以内で指定してください") if desired_role.length > 100

        if graduation_year.present?
          minimum_year = Time.zone.today.year
          maximum_year = minimum_year + 10
          unless graduation_year.match?(/\A\d+\z/) && graduation_year.to_i.between?(minimum_year, maximum_year)
            return render_filter_error("graduation_year", "卒業予定年が許可範囲外です")
          end
        end

        {
          query: query,
          graduation_year: graduation_year.presence&.to_i,
          desired_role: desired_role
        }
      end

      def render_filter_error(field, message)
        render json: {
          errors: [{ field: field, code: "invalid", message: message }]
        }, status: :unprocessable_entity
        nil
      end

      def apply_filters(scope, filters)
        if filters[:query].present?
          pattern = "%#{ActiveRecord::Base.sanitize_sql_like(filters[:query])}%"
          search_sql = <<~SQL.squish
            student_profiles.name ILIKE :pattern
            OR student_profiles.school_name ILIKE :pattern
            OR student_profiles.desired_role ILIKE :pattern
            OR EXISTS (
              SELECT 1
              FROM jsonb_array_elements_text(student_profiles.skills) AS skill
              WHERE skill ILIKE :pattern
            )
          SQL
          scope = scope.where(search_sql, pattern: pattern)
        end

        scope = scope.where(graduation_year: filters[:graduation_year]) if filters[:graduation_year]
        scope = scope.where(desired_role: filters[:desired_role]) if filters[:desired_role].present?
        scope
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
