# frozen_string_literal: true

module Dashboard
  class CurrentTasksController < ApplicationController
    include InputSanitizeHelper

    before_action :check_view_permissions, only: :show

    def show
      project = current_team.projects.find_by(id: task_filters[:project_id]) if task_filters[:project_id]
      experiment = project.experiments.find_by(id: task_filters[:experiment_id]) if task_filters[:experiment_id]

      tasks = if experiment
                experiment.my_modules.active
              elsif project
                MyModule.active.joins(:experiment).where('experiments.project_id': project.id)
              else
                MyModule.active.viewable_by_user(current_user, current_team)
              end
      if task_filters[:mode] == 'assigned'
        tasks = tasks.left_outer_joins(:user_my_modules).where('user_my_modules.user_id': current_user.id)
      end
      tasks = tasks.where('my_modules.state': task_filters[:view])

      case task_filters[:sort]
      when 'date_desc'
        tasks = tasks.order('my_modules.due_date': :desc)
      when 'date_asc'
        tasks = tasks.order('my_modules.due_date': :asc)
      when 'atoz'
        tasks = tasks.order('my_modules.name': :asc)
      when 'ztoa'
        tasks = tasks.order('my_modules.name': :desc)
      else
        tasks
      end

      respond_to do |format|
        format.json do
          render json: {
            tasks_list: tasks.map do |task|
              due_date = I18n.l(task.due_date, format: :full_with_comma) if task.due_date.present?
              { id: task.id,
                link: protocols_my_module_path(task.id),
                experiment: task.experiment.name,
                project: task.experiment.project.name,
                name: escape_input(task.name),
                due_date: due_date,
                overdue: task.is_overdue?,
                state: task.state,
                steps_state: task.completed_steps_percentage }
            end,
            status: :ok
          }
        end
      end
    end

    def project_filter
      projects = current_team.projects.search(current_user, false, params[:query], 1, current_team).select(:id, :name)
      unless params[:mode] == 'team'
        projects = projects.where(id: current_user.my_modules.joins(:experiment)
          .group(:project_id).select(:project_id).pluck(:project_id))
      end
      render json: projects.map { |i| { value: i.id, label: escape_input(i.name) } }, status: :ok
    end

    def experiment_filter
      project = current_team.projects.find_by(id: params[:project_id])
      unless project
        render json: []
        return false
      end
      experiments = project.experiments.search(current_user, false, params[:query], 1, current_team).select(:id, :name)
      unless params[:mode] == 'team'
        experiments = experiments.where(id: current_user.my_modules
          .group(:experiment_id).select(:experiment_id).pluck(:experiment_id))
      end
      render json: experiments.map { |i| { value: i.id, label: escape_input(i.name) } }, status: :ok
    end

    private

    def task_filters
      params.permit(
        :project_id, :experiment_id, :mode, :view, :sort
      )
    end

    def check_view_permissions
      experiment = Experiment.find_by_id(params[:experiment_id])
      project = Project.find_by_id(params[:project_id])

      render_403 if project && !can_read_project?(project)
      render_403 if experiment && !can_read_experiment?(experiment)
    end
  end
end