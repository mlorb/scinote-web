module SearchActions
  @@targetController = :search

  def self.set(param)
  	@@targetController = param
  end

  def search_by_name(model)
    if( @@targetController == :samples && model == User )
      model.search(true, @search_query, nil)
	else
	  model.search(current_user, true, @search_query, @search_page)
	end
  end

  def count_by_name(model)
    search_by_name(model).limit(nil).offset(nil).size
  end

  def count_search_results()
    @project_search_count = count_by_name Project
    @experiment_search_count = count_by_name Experiment
    @workflow_search_count = count_by_name MyModuleGroup
    @module_search_count = count_by_name MyModule
    @result_search_count = count_by_name Result
    @tag_search_count = count_by_name Tag
    @report_search_count = count_by_name Report
    @protocol_search_count = count_by_name Protocol
    @step_search_count = count_by_name Step
    @checklist_search_count = count_by_name Checklist
    @asset_search_count = count_by_name Asset
    @table_search_count = count_by_name Table
    @comment_search_count = count_by_name Comment
    if @@targetController == :samples
      @user_search_count = count_by_name User
    else
      @sample_search_count = count_by_name Sample
    end

    @search_results_count = @project_search_count
    @search_results_count += @experiment_search_count
    @search_results_count += @workflow_search_count
    @search_results_count += @module_search_count
    @search_results_count += @result_search_count
    @search_results_count += @tag_search_count
    @search_results_count += @report_search_count
    @search_results_count += @protocol_search_count
    @search_results_count += @step_search_count
    @search_results_count += @checklist_search_count
    @search_results_count += @asset_search_count
    @search_results_count += @table_search_count
    @search_results_count += @comment_search_count
    if @@targetController == :samples
      @search_results_count += @user_search_count
    else
      @search_results_count += @sample_search_count
    end
  end

  def search_projects
    @project_results = []
    if @project_search_count > 0
      @project_results = search_by_name Project
    end
    @search_count = @project_search_count
  end

  def search_experiments
    @experiment_results = []
    if @experiment_search_count > 0
      @experiment_results = search_by_name Experiment
    end
    @search_count = @experiment_search_count
  end

  def search_workflows
    @workflow_results = []
    if @workflow_search_count > 0
      @workflow_results = search_by_name MyModuleGroup
    end
    @search_count = @workflow_search_count
  end

  def search_modules
    @module_results = []
    if @module_search_count > 0
      @module_results = search_by_name MyModule
    end
    @search_count = @module_search_count
  end

  def search_results
    @result_results = []
    if @result_search_count > 0
      @result_results = search_by_name Result
    end
    @search_count = @result_search_count
  end

  def search_tags
    @tag_results = []
    if @tag_search_count > 0
      @tag_results = search_by_name Tag
    end
    @search_count = @tag_search_count
  end

  def search_reports
    @report_results = []
    if @report_search_count > 0
      @report_results = search_by_name Report
    end
    @search_count = @report_search_count
  end

  def search_protocols
    @protocol_results = []
    if @protocol_search_count > 0
      @protocol_results = search_by_name Protocol
    end
    @search_count = @protocol_search_count
  end

  def search_steps
    @step_results = []
    if @step_search_count > 0
      @step_results = search_by_name Step
    end
    @search_count = @step_search_count
  end

  def search_checklists
    @checklist_results = []
    if @checklist_search_count > 0
      @checklist_results = search_by_name Checklist
    end
    @search_count = @checklist_search_count
  end

  def search_samples
    @sample_results = []
    if @sample_search_count > 0
      @sample_results = search_by_name Sample
    end
    @search_count = @sample_search_count
  end

  def search_assets
    @asset_results = []
    if @asset_search_count > 0
      @asset_results = search_by_name Asset
    end
    @search_count = @asset_search_count
  end

  def search_tables
    @table_results = []
    if @table_search_count > 0
      @table_results = search_by_name Table
    end
    @search_count = @table_search_count
  end

  def search_comments
    @comment_results = []
    if @comment_search_count > 0
      @comment_results = search_by_name Comment
    end
    @search_count = @comment_search_count
  end

  def search_users
    @user_results = []
    if @user_search_count > 0
      @user_results = search_by_name User
    end
    @search_count = @user_search_count
  end
end