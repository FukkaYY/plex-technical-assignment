Rails.application.routes.draw do
  namespace :api do
    namespace :v1 do
      get "health", to: "health#show"
      get "csrf", to: "csrf#show"
      post "student_registrations", to: "student_registrations#create"
      post "session", to: "sessions#create"
      get "me", to: "sessions#show"
      delete "session", to: "sessions#destroy"
      resource :student_profile, only: :update
      resources :students, only: %i[index show] do
        resources :messages, only: %i[index create], controller: :student_messages
        resources :schedule_proposals, only: :create, controller: :company_schedule_proposals
      end
      resources :conversations, only: %i[index show] do
        patch :read, on: :member, action: :mark_read
        resources :messages, only: :create, controller: :conversation_messages
      end
      resources :job_postings, only: %i[index show]
      namespace :company do
        resources :job_postings, only: %i[index show create update] do
          patch :close, on: :member
        end
      end
      patch "company/schedule_proposals/:id/cancel", to: "company_schedule_proposals#cancel"
      patch "schedule_proposals/:id/accept", to: "student_schedule_proposals#accept"
      patch "schedule_proposals/:id/decline", to: "student_schedule_proposals#decline"
      get "company/group_conversations", to: "company_group_conversations#index"
      post "company/group_conversations", to: "company_group_conversations#create"
      get "company/group_conversations/:id", to: "company_group_conversations#show"
      post "company/group_conversations/:id/messages", to: "company_group_conversations#create_message"
      get "group_conversations", to: "group_conversations#index"
      get "group_conversations/:id", to: "group_conversations#show"
      post "group_conversations/:id/messages", to: "group_conversations#create_message"
    end
  end
end
