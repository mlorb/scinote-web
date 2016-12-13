class SamplesTable < ActiveRecord::Base
  validates :user, :organization, presence: true

  belongs_to :user, inverse_of: :samples_tables
  belongs_to :organization, inverse_of: :samples_tables

  scope :find_status,
        ->(org, user) { where(user: user, organization: org).pluck(:status) }

  def self.update_samples_table_state(custom_field, position)
    samples_table = SamplesTable.where(user: custom_field.user,
                                       organization: custom_field.organization)
    org_status = samples_table.first['status']
    if position
      org_status['columns'].delete(position)
      org_status['ColReorder'].delete(position)
    else
      index = org_status['columns'].count
      org_status['columns'][index] = SampleDatatable::
                                     SAMPLES_TABLE_DEFAULT_STATE['columns'].first
      org_status['ColReorder'] << index.to_s
    end
    samples_table.first.update(status: org_status)
  end

  def self.create_samples_table_state(user_org)
    default_columns_num = SampleDatatable::
                          SAMPLES_TABLE_DEFAULT_STATE['columns'].count
    org_status = SampleDatatable::SAMPLES_TABLE_DEFAULT_STATE.deep_dup
    user_org.organization.custom_fields.each_with_index do |_, index|
      org_status['columns'] << SampleDatatable::
                               SAMPLES_TABLE_DEFAULT_STATE['columns'].first
      org_status['ColReorder'] << (default_columns_num + index)
    end
    SamplesTable.create(user: user_org.user,
                        organization: user_org.organization,
                        status: org_status)
  end
end
