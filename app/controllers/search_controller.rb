class SearchController < ApplicationController
  include SearchActions

  before_filter :load_vars, only: :index
  before_filter :load_markdown, only: :index

  MIN_QUERY_CHARS = 2

  def index
    if not @search_query
      redirect_to new_search_path
    end

    count_search_results

    search_projects if @search_category == :projects
    search_experiments if @search_category == :experiments
    search_workflows if @search_category == :workflows
    search_modules if @search_category == :modules
    search_results if @search_category == :results
    search_tags if @search_category == :tags
    search_reports if @search_category == :reports
    search_protocols if @search_category == :protocols
    search_steps if @search_category == :steps
    search_checklists if @search_category == :checklists
    search_samples if @search_category == :samples
    search_assets if @search_category == :assets
    search_tables if @search_category == :tables
    search_comments if @search_category == :comments

    @search_pages = (@search_count.to_f / SEARCH_LIMIT.to_f).ceil
    @start_page = @search_page - 2
    @start_page = 1 if @start_page < 1
    @end_page = @start_page + 4

    if @end_page > @search_pages
      @end_page = @search_pages
      @start_page = @end_page - 4
      @start_page = 1 if @start_page < 1
    end
  end

  def new
  end

  private

  def load_vars
    @search_query = params[:q] || ''
    @search_category = params[:category] || ''
    @search_category = @search_category.to_sym
    @search_page = params[:page].to_i || 1
    @display_query = @search_query

    if @search_query.length < MIN_QUERY_CHARS
      flash[:error] = t'search.index.error.query_length', n: MIN_QUERY_CHARS
      return redirect_to :back
    end

    # splits the search query to validate all entries
    @splited_query = @search_query.split

    if @splited_query.first.length < MIN_QUERY_CHARS
      flash[:error] = t'search.index.error.query_length', n: MIN_QUERY_CHARS
      redirect_to :back
    elsif @splited_query.length > 1
      @search_query = ''
      @splited_query.each_with_index do |w, i|
        @search_query += "#{@splited_query[i]} " if w.length >= MIN_QUERY_CHARS
      end
    else
      @search_query = @splited_query.join(' ')
    end

    @search_page = 1 if @search_page < 1
  end

  # Initialize markdown parser
  def load_markdown
    if @search_category == :results
      @markdown = Redcarpet::Markdown.new(
        Redcarpet::Render::HTML.new(
          filter_html: true,
          no_images: true
        )
      )
    end
  end
end
