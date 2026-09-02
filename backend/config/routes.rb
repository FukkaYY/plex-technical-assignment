Rails.application.routes.draw do
  namespace :api do
    namespace :v1 do
      get "health", to: "health#show"
      get "csrf", to: "csrf#show"
      post "student_registrations", to: "student_registrations#create"
      post "session", to: "sessions#create"
      get "me", to: "sessions#show"
      delete "session", to: "sessions#destroy"
      resources :students, only: %i[index show] do
        resources :messages, only: %i[index create], controller: :student_messages
      end
      resources :conversations, only: %i[index show]
    end
  end
end
