class UserSamplesController < ApplicationController
  def save_samples_table_status
    byebug
    samples_table = SamplesTable.where(user: @current_user, organization: params[:org])#.pluck(:status)
    byebug
    if samples_table
      samples_table.update(status: params[:state])
    else
      samples_table = SamplesTable.create(user: @current_user, organization: params[:org], status: params[:state])
    end
    byebug
  end

  def load_samples_table_status
    samples_table_state = SamplesTable.find_status(current_user, current_organization)
    byebug
  end
end