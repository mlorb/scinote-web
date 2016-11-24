class SamplesTable < ActiveRecord::Base
  store_accessor :preferences, :reordering, :visibility

  validates :user, :organization, presence: true

  belongs_to :user, inverse_of: :samples_tables
  belongs_to :organization, inverse_of: :samples_tables
end
