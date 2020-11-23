# frozen_string_literal: true

module Api
  module V1
    class ProjectFolderSerializer < ActiveModel::Serializer
      type :project_folders
      attributes :id, :name

      belongs_to :team, serializer: TeamSerializer
      belongs_to :parent_folder, serializer: ProjectFolderSerializer
    end
  end
end
