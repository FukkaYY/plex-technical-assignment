module Api
  module V1
    class JobPostingsController < ApplicationController
      before_action :require_student

      def index
        postings = JobPosting.published.includes(company: :company_profile).order(created_at: :desc, id: :desc)
        render json: { data: postings.map { |posting| posting_json(posting) } }
      end

      def show
        posting = JobPosting.published.includes(company: :company_profile).find_by(id: params[:id])
        unless posting
          render json: {
            errors: [{ field: "job_posting", code: "not_found", message: "募集が見つかりません" }]
          }, status: :not_found
          return
        end

        render json: { data: posting_json(posting) }
      end

      private

      def posting_json(posting)
        posting.as_json(only: %i[id title role_name work_location description requirements created_at]).merge(
          company: { company_name: posting.company.company_profile.company_name }
        )
      end
    end
  end
end
