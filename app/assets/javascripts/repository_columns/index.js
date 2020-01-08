/* global I18n HelperModule animateSpinner RepositoryListColumnType */
/* global RepositoryDatatable RepositoryStatusColumnType dropdownSelector */
/* eslint-disable no-restricted-globals */
var RepositoryColumns = (function() {
  var TABLE_ID = '';
  var TABLE = null;
  var manageModal = '#manage-repository-column';
  var columnTypeClassNames = {
    RepositoryListValue: 'RepositoryListColumnType',
    RepositoryStatusValue: 'RepositoryStatusColumnType',
    RepositoryDateValue: 'RepositoryDateColumnType',
    RepositoryDateTimeValue: 'RepositoryDateTimeColumnType',
    RepositoryTimeValue: 'RepositoryDateTimeColumnType',
    RepositoryChecklistValue: 'RepositoryChecklistColumnType',
    RepositoryNumberValue: 'RepositoryNumberColumnType'
  };

  function initColumnTypeSelector() {
    var $manageModal = $(manageModal);
    $manageModal.on('change', '#repository-column-data-type', function() {
      $('.column-type').hide();
      $('[data-column-type="' + $(this).val() + '"]').show();
    });
  }

  // function removeElementFromDom(column) {
  //   $('.repository-column-edtior .list-group-item[data-id="' + column.id + '"]').remove();
  //   if ($('.list-group-item').length === 0) {
  //     location.reload();
  //   }
  // }

  function initDeleteSubmitAction() {
    var $manageModal = $(manageModal);
    $manageModal.on('click', '#delete-repo-column-submit', function() {
      animateSpinner();
      $manageModal.modal('hide');
      $.ajax({
        url: $(this).data('delete-url'),
        type: 'DELETE',
        dataType: 'json',
        success: (result) => {
          // removeElementFromDom(result);
          HelperModule.flashAlertMsg(result.message, 'success');
          animateSpinner(null, false);
          $manageModal.find('#back-to-column-modal').trigger('click');
        },
        error: (result) => {
          animateSpinner(null, false);
          HelperModule.flashAlertMsg(result.responseJSON.error, 'danger');
        }
      });
    });
  }

  function checkData() {
    var currentPartial = $('#repository-column-data-type').val();

    if (columnTypeClassNames[currentPartial]) {
      return eval(columnTypeClassNames[currentPartial])
        .checkValidation();
    }
    return true;
  }

  function addSpecificParams(type, params) {
    var allParams = params;
    var columnParams;
    var specificParams;
    var currentPartial = $('#repository-column-data-type').val();

    if (columnTypeClassNames[currentPartial]) {
      specificParams = eval(columnTypeClassNames[currentPartial]).loadParams();
      columnParams = Object.assign(params.repository_column, specificParams);
      allParams.repository_column = columnParams;
    }

    return allParams;
  }

  // function insertNewListItem(column) {
  //   var attributes = column.attributes;
  //   var html = `<li class="list-group-item row" data-id="${column.id}">
  //
  //                 <div class="col-xs-8">
  //                   <span class="pull-left column-name">${attributes.name}</span>
  //                 </div>
  //                 <div class="col-xs-4">
  //                   <span class="controlls pull-right">
  //                     <button class="btn btn-default edit-repo-column manage-repo-column"
  //                             data-action="edit"
  //                             data-modal-url="${attributes.edit_html_url}"
  //                     >
  //                     <span class="fas fa-pencil-alt"></span>
  //                       ${ I18n.t('libraries.repository_columns.index.edit_column')}
  //                     </button>
  //                     <button class="btn btn-default delete-repo-column manage-repo-column"
  //                             data-action="destroy"
  //                             data-modal-url="${attributes.destroy_html_url}"
  //                     >
  //                       <span class="fas fa-trash-alt"></span>
  //                       ${ I18n.t('libraries.repository_columns.index.delete_column')}
  //                     </button>
  //                   </span>
  //                 </div>
  //               </li>`;
  //
  //   // remove element if already persent
  //   $('[data-id="' + column.id + '"]').remove();
  //   $(html).insertBefore('.repository-columns-body ul li:first');
  //   // remove 'no column' list item
  //   $('[data-attr="no-columns"]').remove();
  // }

  // function updateListItem(column) {
  //   var name = column.attributes.name;
  //   $('li[data-id=' + column.id + ']').find('span').first().html(name);
  // }

  function initCreateSubmitAction() {
    var $manageModal = $(manageModal);
    $manageModal.on('click', '#new-repo-column-submit', function() {
      var url = $('#repository-column-data-type').find(':selected').data('create-url');
      var params = { repository_column: { name: $('#repository-column-name').val() } };
      var selectedType = $('#repository-column-data-type').val();
      params = addSpecificParams(selectedType, params);
      if (!checkData()) return;

      $.ajax({
        url: url,
        type: 'POST',
        data: JSON.stringify(params),
        contentType: 'application/json',
        success: function(result) {
          var data = result.data;
          // insertNewListItem(data);
          HelperModule.flashAlertMsg(data.attributes.message, 'success');
          // $manageModal.modal('hide');
          debugger;
          TABLE.destroy();
          // $(TABLE_ID).empty();
          // $(TABLE_ID).off();


          $(TABLE_ID).remove();

          // Add number of columns
          $(TABLE_ID).data('num-columns',
            $(TABLE_ID).data('num-columns') + 1);

          $(TABLE_ID).data('repository-columns-ids').push(parseInt(data.id, 10));

          $(TABLE_ID).find('thead tr').append(
            '<th class="repository-column" id="' + data.id + '" ' +
            'data-type="' + 'RepositoryTextValue' + '" ' +
            '>' + data.attributes.name + '</th>'
          );
          RepositoryDatatable.init(TABLE_ID);


          $manageModal.find('#back-to-column-modal').trigger('click');
        },
        error: function(error) {
          $('#new-repository-column').renderFormErrors('repository_column', error.responseJSON.repository_column, true);
        }
      });
    });
  }

  function initEditSubmitAction() {
    var $manageModal = $(manageModal);
    $manageModal.on('click', '#update-repo-column-submit', function() {
      var url = $('#repository-column-data-type').find(':selected').data('edit-url');
      var params = { repository_column: { name: $('#repository-column-name').val() } };
      var selectedType = $('#repository-column-data-type').val();
      params = addSpecificParams(selectedType, params);
      if (!checkData()) return;

      $.ajax({
        url: url,
        type: 'PUT',
        data: JSON.stringify(params),
        dataType: 'json',
        contentType: 'application/json',
        success: function(result) {
          var data = result.data;
          // updateListItem(data);
          HelperModule.flashAlertMsg(data.attributes.message, 'success');
          // $manageModal.modal('hide');
          $manageModal.find('#back-to-column-modal').trigger('click');
        },
        error: function(error) {
          $('#new-repository-column').renderFormErrors('repository_column', error.responseJSON.repository_column, true);
        }
      });
    });
  }

  function initBackToManageColumns() {
    var $manageModal = $(manageModal);
    $manageModal.on('click', '#back-to-column-modal', function() {
      debugger
      var button = $(this);
      initManageColumnModal1(button);
    });
  }

  function generateColumnNameTooltip(name) {
    var maxLength = $(TABLE_ID).data('max-dropdown-length');
    if ($.trim(name).length > maxLength) {
      return '<div class="modal-tooltip">'
             + truncateLongString(name, maxLength)
             + '<span class="modal-tooltiptext">' + name + '</span></div>';
    }
    return name;
  }

  function loadColumnsNames1() {
    debugger
    // Clear the list
    // dropdownList.find('li[data-position]').remove();
    _.each(TABLE.columns().header(), function(el, index) {
      if (index > 1) {
        let colIndex = $(el).attr('data-column-index');
        let visible = TABLE.column(colIndex).visible();

        let visClass = (visible) ? 'fa-eye' : 'fa-eye-slash';
        let visLi = (visible) ? '' : 'col-invisible';

        let thederName;
        if ($(el).find('.modal-tooltiptext').length > 0) {
          thederName = $(el).find('.modal-tooltiptext').text();
        } else {
          thederName = el.innerText;
        }

        let listItem = dropdownList.find('.repository-columns-list-template').clone(); //TODO rename dropdownList

        let repoId = $(TABLE_ID).data('repository-id');
        let colId = $(el).attr('id');
        let actionUrl = '/repositories/' + repoId + '/repository_columns/' + colId;

        listItem.attr('data-position', colIndex);
        listItem.attr('data-id', colId);
        listItem.addClass(visLi);
        listItem.removeClass('repository-columns-list-template hide');

        if ($(el).attr('data-type')) {
          listItem.find('.manage-controls').removeClass('hide');
          debugger
          listItem.find('[data-action="edit"]').attr('data-modal-url', actionUrl + '/edit');
          listItem.find('[data-action="destroy"]').attr('data-modal-url', actionUrl + '/destroy_html');
        }

        listItem.find('.text').html(generateColumnNameTooltip(thederName));
        if (thederName !== 'Name') {
          listItem.find('.vis').addClass(visClass);
          listItem.find('.vis').attr('title', $(TABLE_ID).data('columns-visibility-text'));
        }
        dropdownList.append(listItem);
      }
    });
  }

  function toggleColumnVisibility1() {
    debugger
    var lis = dropdownList.find('.vis');
    lis.on('click', function(event) {
      debugger
      var self = $(this);
      var li = self.closest('li');
      var column = TABLE.column(li.attr('data-position'));

      event.stopPropagation();

      if (column.header.id !== 'row-name') {
        if (column.visible()) {
          self.addClass('fa-eye-slash');
          self.removeClass('fa-eye');
          li.addClass('col-invisible');
          column.visible(false);
          TABLE.setColumnSearchable(column.index(), false);
        } else {
          self.addClass('fa-eye');
          self.removeClass('fa-eye-slash');
          li.removeClass('col-invisible');
          column.visible(true);
          TABLE.setColumnSearchable(column.index(), true);
        }
      }
      // Re-filter/search if neccesary
      let searchText = $('div.dataTables_filter input').val();
      if (!_.isEmpty(searchText)) {
        TABLE.search(searchText).draw();
      }
      // initRowSelection();
      // FilePreviewModal.init();
    });
  }

  function initSorting1() {
    debugger
    dropdownList.sortable({
      items: 'li:not(.repository-columns-list-template)',
      cancel: '.new-repository-column',
      axis: 'y',
      update: function() {
        var reorderer = TABLE.colReorder;
        var listIds = [];
        // We skip first two columns
        listIds.push(0, 1);
        dropdownList.find('li[data-position]').each(function() {
          listIds.push($(this).first().data('position'));
        });
        reorderer.order(listIds, false);
        // loadColumnsNames();
        // initRowSelection();
      }
    });
    // $('.sorting').on('click', checkAvailableColumns);
  }

  function customLiHoverEffect1() {
    debugger
    var liEl = dropdownList.find('li');
    liEl.mouseover(function() {
      $(this).find('.grippy').addClass('grippy-img');
    }).mouseout(function() {
      $(this).find('.grippy').removeClass('grippy-img');
    });
  }

  function initManageColumnModal1(button) {
    debugger
    var modalUrl = button.data('modal-url');
    $.get(modalUrl, (data) => {

      $(manageModal).modal('show').find('.modal-content').html(data.html);
      // $(this).find('.repository-table').DataTable()
      TABLE_ID = '#repository-table-' + data.id;
      TABLE = $(TABLE_ID).DataTable();
      dropdownList = $('#repository-columns-list1');
      debugger
      loadColumnsNames1();
      initSorting1();
      toggleColumnVisibility1();
      customLiHoverEffect1();
      initManageColumnAction();
    }).fail(function() {
      // HelperModule.flashAlertMsg(I18n.t('libraries.repository_columns.no_permissions'), 'danger');
    });
  }

  function initColumnsButton() {
    $('#repository-toolbar').on('click', '.manage-repo-column-index', function() {
      debugger;
      var button = $(this);
      initManageColumnModal1(button);
    });
  }

  function initManageColumnAction() {
    var $manageModal = $(manageModal);
    $manageModal.on('click', '.manage-repo-column', function() {
      debugger
      var button = $(this);
      var modalUrl = button.data('modal-url');
      var columnType;
      $.get(modalUrl, (data) => {
        debugger
        $manageModal.find('.modal-content').html(data.html)
          .find('#repository-column-name')
          .focus();
        columnType = $('#repository-column-data-type').val();
        dropdownSelector.init('#repository-column-data-type', {
          noEmptyOption: true,
          singleSelect: true,
          closeOnSelect: true,
          optionClass: 'custom-option',
          selectAppearance: 'simple'
        });
        $manageModal
          .trigger('columnModal::partialLoadedFor' + columnType);

        if (button.data('action') === 'new') {
          $('[data-column-type="RepositoryTextValue"]').show();
          $('#new-repo-column-submit').show();
        } else {
          $('#update-repo-column-submit').show();
          $('[data-column-type=' + columnType + ']').show();
        }
      }).fail(function() {
        HelperModule.flashAlertMsg(I18n.t('libraries.repository_columns.no_permissions'), 'danger');
      });
    });
  }

  function initManageColumnModal() {
    var $manageModal = $(manageModal);
    $('.repository-column-edtior').on('click', '.manage-repo-column', function() {
      debugger
      var button = $(this);
      var modalUrl = button.data('modal-url');
      var columnType;
      $.get(modalUrl, (data) => {
        debugger
        $manageModal.modal('show').find('.modal-content').html(data.html)
          .find('#repository-column-name')
          .focus();
        columnType = $('#repository-column-data-type').val();
        dropdownSelector.init('#repository-column-data-type', {
          noEmptyOption: true,
          singleSelect: true,
          closeOnSelect: true,
          optionClass: 'custom-option',
          selectAppearance: 'simple'
        });
        $manageModal
          .trigger('columnModal::partialLoadedFor' + columnType);

        if (button.data('action') === 'new') {
          $('[data-column-type="RepositoryTextValue"]').show();
          $('#new-repo-column-submit').show();
        } else {
          $('#update-repo-column-submit').show();
          $('[data-column-type=' + columnType + ']').show();
        }
      }).fail(function() {
        HelperModule.flashAlertMsg(I18n.t('libraries.repository_columns.no_permissions'), 'danger');
      });
    });
  }

  return {
    init: () => {
      if ($('.repository-columns-header').length > 0 // TODO: remove old check
      || $('#repository-toolbar').length > 0) {
        initColumnTypeSelector();
        initEditSubmitAction();
        initCreateSubmitAction();
        initDeleteSubmitAction();
        initBackToManageColumns();
        initManageColumnModal();
        initColumnsButton();
        RepositoryListColumnType.init();
        RepositoryStatusColumnType.init();
        RepositoryChecklistColumnType.init();
      }
    }
  };
}());

$(document).on('turbolinks:load', function() {
  RepositoryColumns.init();
});
