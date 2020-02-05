# frozen_string_literal: true

class RepositoryChecklistItem < ApplicationRecord
  validates :data, presence: true,
                   uniqueness: { scope: :repository_column_id, case_sensitive: false },
                   length: { maximum: Constants::NAME_MAX_LENGTH }
  belongs_to :repository, inverse_of: :repository_checklist_items
  belongs_to :repository_column
  belongs_to :created_by, foreign_key: 'created_by_id', class_name: 'User',
             inverse_of: :created_repository_checklist_types
  belongs_to :last_modified_by, foreign_key: 'last_modified_by_id', class_name: 'User',
             inverse_of: :modified_repository_checklist_types
  has_many :repository_checklist_items_values, dependent: :destroy
  has_many :repository_checklist_values, through: :repository_checklist_items_values, dependent: :destroy
end
