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
      end
      resources :conversations, only: %i[index show] do
        patch :read, on: :member, action: :mark_read
        resources :messages, only: :create, controller: :conversation_messages
      end
    end
  end
end
