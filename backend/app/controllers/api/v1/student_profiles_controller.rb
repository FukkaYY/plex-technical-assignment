module Api
  module V1
    class StudentProfilesController < ApplicationController
      before_action :require_student

      def update
        profile = current_user.student_profile

        if profile.update(profile_params)
          render json: { data: student_profile_json(profile) }
        else
          render json: { errors: validation_errors(profile.errors) }, status: :unprocessable_entity
        end
      end

      private

      def profile_params
        params.require(:student_profile).permit(
          :name,
          :school_name,
          :graduation_year,
          :desired_role,
          :self_introduction,
          skills: []
        )
      end
    end
  end
end
