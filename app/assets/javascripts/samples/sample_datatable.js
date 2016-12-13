//= require jquery-ui

var rowsSelected = [];

// Tells whether we're currently viewing or editing table
var currentMode = 'viewMode';

// Tells what action will execute by pressing on save button (update/create)
var saveAction = 'update';
var selectedSample;

// Helps saving correct table state
var myData;
var loadFirstTime = true;

var table;
var originalHeader;

function dataTableInit() {
  // Make a copy of original samples table header
  originalHeader = $('#samples thead').children().clone();
  table = $('#samples').DataTable({
    order: [[2, 'desc']],
    dom: "R<'row'<'col-sm-9-custom toolbar'l><'col-sm-3-custom'f>>tpi",
    stateSave: true,
    processing: true,
    serverSide: true,
    colReorder: {
      fixedColumnsLeft: 2,
      realtime: false
    },
    destroy: true,
    ajax: {
      url: $('#samples').data('source'),
      global: false,
      type: 'POST'
    },
    columnDefs: [{
      targets: 0,
      searchable: false,
      orderable: false,
      className: 'dt-body-center',
      sWidth: '1%',
      render: function() {
        return "<input type='checkbox'>";
      }
    }, {
      targets: 1,
      searchable: false,
      orderable: true,
      sWidth: '1%'
    }, {
      targets: 2,
      render: function(data, type, row) {
        return "<a href='#' data-href='" + row.sampleUpdateUrl + "'" +
                      "class='sample_info' data-toggle='modal'" +
                      "data-target='#modal-info-sample'>" + data + '</a>';
      }
    }],
    rowCallback: function(row, data) {
      // Get row ID
      var rowId = data.DT_RowId;

      // If row ID is in the list of selected row IDs
      if ($.inArray(rowId, rowsSelected) !== -1) {
        $(row).find('input[type="checkbox"]').prop('checked', true);

        $(row).addClass('selected');
      }
    },
    columns: (function() {
      var numOfColumns = $('#samples').data('num-columns');
      var columns = [];

      for (var i = 0; i < numOfColumns; i++) {
        var visible = (i <= 6);
        columns.push({
          data: String(i),
          defaultContent: '',
          visible: visible
        });
      }
      return columns;
    })(),
    fnDrawCallback: function() {
      animateSpinner(this, false);
      changeToViewMode();
      sampleInfoListener();
      updateButtons();
    },
    preDrawCallback: function() {
      animateSpinner(this);
      $('.sample_info').off('click');
    },
    stateLoadCallback: function(settings) {
      // Send an Ajax request to the server to get the data. Note that
      // this is a synchronous request since the data is expected back from the
      // function
      var org = $('#samples').attr('data-organization-id');
      var user = $('#samples').attr('data-user-id');

      $.ajax({
        url: '/state_load/' + org + '/' + user,
        data: {org: org},
        async: false,
        dataType: 'json',
        type: 'POST',
        success: function(json) {
          myData = json.state;
        }
      });
      return myData;
    },
    stateSaveCallback: function(settings, data) {
      // Send an Ajax request to the server with the state object
      var org = $('#samples').attr('data-organization-id');
      var user = $('#samples').attr('data-user-id');
      // Save correct data
      if (loadFirstTime == true) {
        data = myData;
      }

      $.ajax({
        url: '/state_save/' + org + '/' + user,
        data: {org: org, state: data},
        dataType: 'json',
        type: 'POST'
      });
      loadFirstTime = false;
    },
    fnInitComplete: function(oSettings, json) {
      // Reload correct column order and visibility (if you refresh page)
      for (var i = 0; i < table.columns()[0].length; i++) {
        debugger
        var visibility = myData.columns[i].visible;
        if (typeof (visibility) === 'string') {
          visibility = (visibility === 'true');
        }
        table.column(i).visible(visibility);
      }
      oSettings._colReorder.fnOrder(myData.ColReorder);
    }
  });

  // Append button to inner toolbar in table
  $('div.toolbarButtons').appendTo('div.toolbar');
  $('div.toolbarButtons').show();

  $('.delete_samples_submit').click(function() {
      animateLoading();
  });

  $('#assignSamples, #unassignSamples').click(function() {
      animateLoading();
  });

  // Handle click on table cells with checkboxes
  $('#samples').on('click', 'tbody td, thead th:first-child', function() {
    $(this).parent().find('input[type="checkbox"]').trigger('click');
  });

  // Handle clicks on checkbox
  $('#samples tbody').on('click', "input[type='checkbox']", function(e) {
    if (currentMode !== 'viewMode') {
      return false;
    }
    // Get row ID
    var $row = $(this).closest('tr');
    var data = table.row($row).data();
    var rowId = data.DT_RowId;

    // Determine whether row ID is in the list of selected row IDs
    var index = $.inArray(rowId, rowsSelected);

    // If checkbox is checked and row ID is not in list of selected row IDs
    if (this.checked && index === -1) {
      rowsSelected.push(rowId);
    // Otherwise, if checkbox is not checked and row ID is in list of selected row IDs
    } else if (!this.checked && index !== -1) {
      rowsSelected.splice(index, 1);
    }

    if (this.checked) {
      $row.addClass('selected');
    } else {
      $row.removeClass('selected');
    }

    updateDataTableSelectAllCtrl(table);

    e.stopPropagation();

    updateButtons();
  });

  // Handle click on "Select all" control
  $('#samples thead input[name="select_all"]').on('click', function(e) {
    if (this.checked) {
      $('#samples tbody input[type="checkbox"]:not(:checked)').trigger('click');
    } else {
      $('#samples tbody input[type="checkbox"]:checked').trigger('click');
    }

    // Prevent click event from propagating to parent
    e.stopPropagation();
  });

  // Handle table draw event
  table.on('draw', function() {
    updateDataTableSelectAllCtrl(table);
  });

  return table;
}

table = dataTableInit();

// Enables noSearchHidden plugin
$.fn.dataTable.defaults.noSearchHidden = true;

// Updates "Select all" control in a data table
function updateDataTableSelectAllCtrl(table) {
    var $table             = table.table().node();
    var $chkbox_all        = $('tbody input[type="checkbox"]', $table);
    var $chkbox_checked    = $('tbody input[type="checkbox"]:checked', $table);
    var chkbox_select_all  = $('thead input[name="select_all"]', $table).get(0);

    // If none of the checkboxes are checked
    if($chkbox_checked.length === 0){
        chkbox_select_all.checked = false;
        if('indeterminate' in chkbox_select_all){
            chkbox_select_all.indeterminate = false;
        }

        // If all of the checkboxes are checked
    } else if ($chkbox_checked.length === $chkbox_all.length){
        chkbox_select_all.checked = true;
        if('indeterminate' in chkbox_select_all){
            chkbox_select_all.indeterminate = false;
        }

        // If some of the checkboxes are checked
    } else {
        chkbox_select_all.checked = true;
        if('indeterminate' in chkbox_select_all){
            chkbox_select_all.indeterminate = true;
        }
    }
}

// Append selected samples to form
$("form#form-samples").submit(function(e){
    var form = this;

    if (currentMode == "viewMode")
        appendSamplesIdToForm(form);
});

// Append selected samples and headers form
$("form#form-export").submit(function(e){
    var form = this;

    if (currentMode == "viewMode") {
        // Remove all hidden fields
        $("#form-export").find("input[name=sample_ids\\[\\]]").remove();
        $("#form-export").find("input[name=header_ids\\[\\]]").remove();

        // Append samples
        appendSamplesIdToForm(form);

        // Append visible column information
        $("table#samples thead tr").children("th").each(function(i) {
            var th = $(this);
            var val;

            if ($(th).attr("id") == "sample-name")
                val = -1;
            else if ($(th).attr("id") == "sample-type")
                val = -2;
            else if ($(th).attr("id") == "sample-group")
                val = -3;
            else if ($(th).attr("id") == "added-by")
                val = -4;
            else if ($(th).attr("id") == "added-on")
                val = -5;
            else if ($(th).hasClass("custom-field"))
                val = th.attr("id");

            if (val)
                $(form).append(
                    $('<input>')
                    .attr('type', 'hidden')
                    .attr('name', 'header_ids[]')
                    .val(val)
                );
        });

    }
});

function appendSamplesIdToForm(form) {
    $.each(rowsSelected, function(index, rowId){
        $(form).append(
            $('<input>')
            .attr('type', 'hidden')
            .attr('name', 'sample_ids[]')
            .val(rowId)
        );
    });
}

//Show sample info
function sampleInfoListener() {
    $(".sample_info").on("click", function(e){
        var that = $(this);
        $.ajax({
            method: "GET",
            url: that.attr("data-href")  + '.json',
            dataType: "json"
        }).done(function(xhr, settings, data) {
            $("body").append($.parseHTML(data.responseJSON.html));
            $("#modal-info-sample").modal('show',{
                backdrop: true,
                keyboard: false,
            }).on('hidden.bs.modal', function () {
                $(this).find(".modal-body #sample-info-table").DataTable().destroy();
                $(this).remove();
            });

            $('#sample-info-table').DataTable({
                dom: "RBltpi",
                stateSave: false,
                buttons: [],
                processing: true,
                colReorder: {
                    fixedColumnsLeft: 1000000 // Disable reordering
                },
                columnDefs: [{
                    targets: 0,
                    searchable: false,
                    orderable: false
                }],
                fnDrawCallback: function(settings, json) {
                    animateSpinner(this, false);
                },
                preDrawCallback: function(settings) {
                    animateSpinner(this);
                }
            });
        }).fail(function(error){
            // TODO
        }).always(function(data){
            // TODO
        });
        e.preventDefault();
        return false;
    });
}

// Edit sample
function onClickEdit() {
    if (rowsSelected.length != 1) return;

    var row = table.row("#" + rowsSelected[0]);
    var node = row.node();
    var rowData = row.data();

    $(node).find("td input").trigger("click");
    selectedSample = node;

    clearAllErrors();
    changeToEditMode();
    updateButtons();
    saveAction = "update";

    $.ajax({
        url: rowData["sampleInfoUrl"],
        type: "GET",
        dataType: "json",
        success: function (data) {
            // Show save and cancel buttons in first two columns
            $(node).children("td").eq(0).html($("#saveSample").clone());
            $(node).children("td").eq(1).html($("#cancelSave").clone());

            // Sample name column
            var colIndex = getColumnIndex("#sample-name");
            if (colIndex) {
                $(node).children("td").eq(colIndex).html(changeToInputField("sample", "name", data["sample"]["name"]));
            }

            // Sample type column
            var colIndex = getColumnIndex("#sample-type");
            if (colIndex) {
                var selectType = createSampleTypeSelect(data["sample_types"], data["sample"]["sample_type"]);
                $(node).children("td").eq(colIndex).html(selectType);
                $("select[name=sample_type_id]").selectpicker();
            }

            // Sample group column
            var colIndex = getColumnIndex("#sample-group");
            if (colIndex) {
                var selectGroup = createSampleGroupSelect(data["sample_groups"], data["sample"]["sample_group"]);
                $(node).children("td").eq(colIndex).html(selectGroup);
                $("select[name=sample_group_id]").selectpicker();
            }

            // Take care of custom fields
            var cfields = data["sample"]["custom_fields"];
            $(node).children("td").each(function(i) {
                var td = $(this);
                var rawIndex = table.column.index("fromVisible", i);
                var colHeader = table.column(rawIndex).header();
                if ($(colHeader).hasClass("custom-field")) {
                    // Check if custom field on this sample exists
                    var cf = cfields[$(colHeader).attr("id")];
                    if (cf)
                        td.html(changeToInputField("sample_custom_fields", cf["sample_custom_field_id"], cf["value"]));
                    else
                        td.html(changeToInputField("custom_fields", $(colHeader).attr("id"), ""));
                }
            });
        },
        error: function (e, data, status, xhr) {
            if (e.status == 403) {
                sampleAlertMsg(I18n.t("samples.js.permission_error"), "danger");
                changeToViewMode();
                updateButtons();
            }
        }
    });
}

// Save sample
function onClickSave() {
    if (saveAction == "update") {
        var row = table.row(selectedSample);
        var node = row.node();
        var rowData = row.data();
    } else if (saveAction == "create")
        var node = selectedSample;

    // First fetch all the data in input fields
    data = {
        sample_id: $(selectedSample).attr("id"),
        sample: {},
        custom_fields: {}, // These fields are not currently bound to this sample
        sample_custom_fields: {} // These fields are already in database (linked to this sample)
    };

    // Direct sample attributes
    // Sample name
    $(node).find("td input[data-object = sample]").each(function() {
        data["sample"][$(this).attr("name")] = $(this).val();
    });

    // Sample type
    $(node).find("td select[name = sample_type_id]").each(function() {
        data["sample"]["sample_type_id"] = $(this).val();
    });

    // Sample group
    $(node).find("td select[name = sample_group_id]").each(function() {
        data["sample"]["sample_group_id"] = $(this).val();
    });

    // Custom fields (new fields)
    $(node).find("td input[data-object = custom_fields]").each(function () {
        // Send data only and only if string is not empty
        if ($(this).val().trim()) {
            data["custom_fields"][$(this).attr("name")] = $(this).val();
        }
    });

    // Sample custom fields (existent fields)
    $(node).find("td input[data-object = sample_custom_fields]").each(function () {
        data["sample_custom_fields"][$(this).attr("name")] = $(this).val();
    });

    var url = (saveAction == "update" ? rowData["sampleUpdateUrl"] : $("table#samples").data("create-sample"))
    var type = (saveAction == "update" ? "PUT" : "POST")
    $.ajax({
        url: url,
        type: type,
        dataType: "json",
        data: data,
        success: function (data) {
            sampleAlertMsg(data.flash, "success");
            onClickCancel();
        },
        error: function (e, eData, status, xhr) {
            var data = e.responseJSON;
            clearAllErrors();
            sampleAlertMsgHide();

            if (e.status == 404) {
                sampleAlertMsg(I18n.t("samples.js.not_found_error"), "danger");
                changeToViewMode();
                updateButtons();
            }
            else if (e.status == 403) {
                sampleAlertMsg(I18n.t("samples.js.permission_error"), "danger");
                changeToViewMode();
                updateButtons();
            }
            else if (e.status == 400) {
                if (data["init_fields"]) {
                    var init_fields = data["init_fields"];

                    // Validate sample name
                    if (init_fields["name"]) {
                        var input = $(selectedSample).find("input[name=name]");

                        if (input) {
                            input.closest(".form-group").addClass("has-error");
                            input.parent().append("<span class='help-block'>" + init_fields["name"] + "<br /></span>");
                        }
                    }
                };

                // Validate custom fields
                $.each(data["custom_fields"] || [], function(key, val) {
                    $.each(val, function(key, val) {
                        var input = $(selectedSample).find("input[name=" + key + "]");

                        if (input) {
                            input.closest(".form-group").addClass("has-error");
                            input.parent().append("<span class='help-block'>" + val["value"][0] + "<br /></span>");
                        }
                    });
                });

                // Validate sample custom fields
                $.each(data["sample_custom_fields"] || [], function(key, val) {
                    $.each(val, function(key, val) {
                        var input = $(selectedSample).find("input[name=" + key + "]");

                        if (input) {
                            input.closest(".form-group").addClass("has-error");
                            input.parent().append("<span class='help-block'>" + val["value"][0] + "<br /></span>");
                        }
                    });
                });
            }
        }
    });
}

// Enable/disable edit button
function updateButtons() {
    if (currentMode=="viewMode") {
        $("#importSamplesButton").removeClass("disabled");
        $("#importSamplesButton").prop("disabled",false);
        $("#addSample").removeClass("disabled");
        $("#addSample").prop("disabled",false);
        $("#addNewColumn").removeClass("disabled");
        $("#addNewColumn").prop("disabled",false);

        if (rowsSelected.length == 1) {
            $("#editSample").prop("disabled", false);
            $("#editSample").removeClass("disabled");
            $("#deleteSamplesButton").prop("disabled", false);
            $("#deleteSamplesButton").removeClass("disabled");
            $("#exportSamplesButton").removeClass("disabled");
            $("#exportSamplesButton").prop("disabled",false);
            $("#exportSamplesButton").on("click", function() { $('#form-export').submit(); });
            $("#assignSamples").removeClass("disabled");
            $("#assignSamples").prop("disabled", false);
            $("#unassignSamples").removeClass("disabled");
            $("#unassignSamples").prop("disabled", false);
        }
        else if (rowsSelected.length == 0) {
            $("#editSample").prop("disabled", true);
            $("#editSample").addClass("disabled");
            $("#deleteSamplesButton").prop("disabled", true);
            $("#deleteSamplesButton").addClass("disabled");
            $("#exportSamplesButton").addClass("disabled");
            $("#exportSamplesButton").prop("disabled",true);
            $("#exportSamplesButton").off("click");
            $("#assignSamples").addClass("disabled");
            $("#assignSamples").prop("disabled", true);
            $("#unassignSamples").addClass("disabled");
            $("#unassignSamples").prop("disabled", true);
        }
        else {
            $("#editSample").prop("disabled", true);
            $("#editSample").addClass("disabled");
            $("#deleteSamplesButton").prop("disabled", false);
            $("#deleteSamplesButton").removeClass("disabled");
            $("#exportSamplesButton").removeClass("disabled");
            $("#exportSamplesButton").prop("disabled",false);
            $("#exportSamplesButton").on("click", function() { $('#form-export').submit(); });
            $("#assignSamples").removeClass("disabled");
            $("#assignSamples").prop("disabled", false);
            $("#unassignSamples").removeClass("disabled");
            $("#unassignSamples").prop("disabled", false);
        }
    }
    else if (currentMode=="editMode") {
            $("#importSamplesButton").addClass("disabled");
            $("#importSamplesButton").prop("disabled",true);
            $("#addSample").addClass("disabled");
            $("#addSample").prop("disabled",true);
            $("#editSample").addClass("disabled");
            $("#editSample").prop("disabled",true);
            $("#addNewColumn").addClass("disabled");
            $("#addNewColumn").prop("disabled", true);
            $("#exportSamplesButton").addClass("disabled");
            $("#exportSamplesButton").off("click");
            $("#deleteSamplesButton").addClass("disabled");
            $("#deleteSamplesButton").prop("disabled",true);
            $("#assignSamples").addClass("disabled");
            $("#assignSamples").prop("disabled", true);
            $("#unassignSamples").addClass("disabled");
            $("#unassignSamples").prop("disabled", true);
    }
}

// Clear all has-error tags
function clearAllErrors() {
    // Remove any validation errors
    $(selectedSample).find(".has-error").each(function() {
        $(this).removeClass("has-error");
        $(this).find("span").remove();
    });

    // Remove any alerts
    $("#alert-container").find("div").remove();
}

// Restore previous table
function onClickCancel() {
    table.ajax.reload();

    changeToViewMode();
    updateButtons();
}

function onClickAddSample() {
    changeToEditMode();
    updateButtons();

    saveAction = "create";
    $.ajax({
        url: $("table#samples").data("new-sample"),
        type: "GET",
        dataType: "json",
        success: function (data) {
            var tr = document.createElement("tr")
            $("table#samples thead tr").children("th").each(function(i) {
                var th = $(this);
                if ($(th).attr("id") == "checkbox") {
                    var td = createTdElement("");
                    $(td).html($("#saveSample").clone());
                    tr.appendChild(td);
                }
                else if ($(th).attr("id") == "assigned") {
                   var td = createTdElement("");
                    $(td).html($("#cancelSave").clone());
                    tr.appendChild(td);
                }
                else if ($(th).attr("id") == "sample-name") {
                    var input = changeToInputField("sample", "name", "");
                    tr.appendChild(createTdElement(input));
                }
                else if ($(th).attr("id") == "sample-type") {
                    var colIndex = getColumnIndex("#sample-type")
                    if (colIndex) {
                        var selectType = createSampleTypeSelect(data["sample_types"]);
                        var td = createTdElement("");
                        td.appendChild(selectType[0]);
                        tr.appendChild(td);
                    }
                }
                else if ($(th).attr("id") == "sample-group") {
                    var colIndex = getColumnIndex("#sample-group")
                    if (colIndex) {
                        var selectGroup = createSampleGroupSelect(data["sample_groups"]);
                        var td = createTdElement("");
                        td.appendChild(selectGroup[0]);
                        tr.appendChild(td);
                    }
                }
                else if ($(th).hasClass("custom-field")) {
                    var input = changeToInputField("custom_fields", th.attr("id"), "");
                    tr.appendChild(createTdElement(input));
                }
                else {
                    // Column we don't care for, just add empty td
                    tr.appendChild(createTdElement(""));
                }
            });
            $("table#samples").prepend(tr);
            selectedSample = tr;

            // Init dropdown with icons
            $("select[name=sample_group_id]").selectpicker();
            $("select[name=sample_type_id]").selectpicker();
        },
        error: function (e, eData, status, xhr) {
            if (e.status == 403)
                sampleAlertMsg(I18n.t("samples.js.permission_error"), "danger");
            changeToViewMode();
            updateButtons();
        }
    });
}

// Handle enter key
$(document).off('keypress').keypress(function(event) {
  var keycode = (event.keyCode ? event.keyCode : event.which);
  if (currentMode === 'editMode' && keycode === '13') {
    $('#saveSample').click();
    return false;
  }
});

// Helper functions
function getColumnIndex(id) {
  if (id < 0) {
    return false;
  }
  return table.column(id).index('visible');
}

// Takes object and surrounds it with input
function changeToInputField(object, name, value) {
  return "<div class='form-group'><input class='form-control' data-object='" +
      object + "' name='" + name + "' value='" + value + "'></input></div>";
}

// Return td element with content
function createTdElement(content) {
  var td = document.createElement('td');
  td.innerHTML = content;
  return td;
}

/**
 * Creates select dropdown for sample type
 * @param {Object[]} data List of sample types
 * @param {number} selected Selected sample type id
 * @return {Object} select dropdown
 */
function createSampleTypeSelect(data, selected) {
  selected = _.isUndefined(selected) ? 1 : selected + 1;

  var $selectType = $('<select></select>')
    .attr('name', 'sample_type_id').addClass('show-tick');

  var $option = $("<option href='/organizations/1/sample_types'></option>")
                  .attr('value', -2)
                  .text(I18n.t('samples.table.add_sample_type'));
  $selectType.append($option);
  $option = $('<option></option>')
    .attr('value', -1).text(I18n.t('samples.table.no_type'))
  $selectType.append($option);

  $.each(data, function(i, val) {
    var $option = $('<option></option>')
      .attr('value', val.id).text(val.name);
    $selectType.append($option);
  });
  $selectType.makeDropdownOptionsLinks(selected, 'add-mode');
  return $selectType;
}

/**
 * Creates select dropdown for sample group
 * @param data List of sample groups
 * @param selected Selected sample group id
 */
function createSampleGroupSelect(data, selected) {
  selected = _.isUndefined(selected) ? 1 : selected + 1;

  var $selectGroup = $('<select></select>')
    .attr('name', 'sample_group_id').addClass('show-tick');

  var $option = $("<option href='/organizations/1/sample_groups'></option>")
                  .text(I18n.t('samples.table.add_sample_group'));
  $selectGroup.append($option);
  $option = $('<option></option>')
    .attr('value', -1).text(I18n.t('samples.table.no_group'))
    .attr('data-icon', 'glyphicon glyphicon-asterisk');
  $selectGroup.append($option);

  $.each(data, function(i, val) {
    var $span = $('<span></span>').addClass('glyphicon glyphicon-asterisk')
      .css('color', val.color);
    var $option = $('<option></option>')
      .attr('value', val.id).text(val.name)
      .attr('data-content', $span.prop('outerHTML') + ' ' + val.name);

    $selectGroup.append($option);
  });
  $selectGroup.makeDropdownOptionsLinks(selected, 'add-mode');
  return $selectGroup;
}

function changeToViewMode() {
  currentMode = 'viewMode';

    // $("#saveCancel").hide();

    // Table specific stuff
  table.button(0).enable(true);
}

function changeToEditMode() {
  currentMode = 'editMode';

    // $("#saveCancel").show();

    // Table specific stuff
  table.button(0).enable(false);
}

/*
 * Sample columns dropdown
 */
(function(table) {
  'use strict';

  var dropdown = $('#samples-columns-dropdown');
  var dropdownList = $('#samples-columns-list');
  var columnEditMode = false;

  function createNewColumn() {
    // Make an Ajax request to custom_fields_controller
    var url = $('#new-column-form').data('action');
    var columnName = $('#new-column-name').val();
    if (columnName.length > 0) {
      $.ajax({
        method: 'POST',
        dataType: 'json',
        data: {custom_field: {name: columnName}},
        error: function(data) {
          var form = $('#new-column-form');
          form.addClass('has-error');
          form.find('.help-block').remove();
          form.append('<span class="help-block">' +
            data.responseJSON.name +
            '</span>');
        },
        success: function(data) {
          var form = $('#new-column-form');
          form.find('.help-block').remove();
          if (form.hasClass('has-error')) {
            form.removeClass('has-error');
          }
          $('#new-column-name').val('');
          form.append('<span class="help-block">' +
            I18n.t('samples.js.column_added') +
            '</span>');
          $('#samples').data('num-columns',
            $('#samples').data('num-columns') + 1);
          originalHeader.append(
            '<th class="custom-field" id="' + data.id + '" ' +
            'data-editable data-deletable ' +
            'data-edit-url="' + data.edit_url + '" ' +
            'data-destroy-html-url="' + data.destroy_html_url + '"' +
            '>' +
            data.name + '</th>');
          var colOrder = table.colReorder.order();
          colOrder.push(colOrder.length);
          // Remove all event handlers as we re-initialize them later with
          // new table
          $('#samples').off();
          $('#samples thead').empty();
          $('#samples thead').append(originalHeader);
          // Preserve save/delete buttons as we need them after new table
          // will be created
          $('div.toolbarButtons').appendTo('div.samples-table');
          $('div.toolbarButtons').hide();
          table = dataTableInit();
          table.on('init.dt', function() {
            loadColumnsNames();
          });
        },
        url: url
      });
    } else {
      var form = $('#new-column-form');
      form.addClass('has-error');
      form.find('.help-block').remove();
      form.append('<span class="help-block">' +
        I18n.t('samples.js.empty_column_name') +
        '</span>');
    }
  }

  function initNewColumnForm() {
    $('#samples-columns-dropdown').on('show.bs.dropdown', function() {
      // Clear input and errors when dropdown is opened
      var input = $(this).find('input#new-column-name');
      input.val('');
      var form = $('#new-column-form');
      if (form.hasClass('has-error')) {
        form.removeClass('has-error');
      }
      form.find('.help-block').remove();
    });

    $('#add-new-column-button').click(function(e) {
      e.stopPropagation();
      createNewColumn();
    });

    $('#new-column-name').keydown(function(e) {
      if (e.keyCode === 13) {
        e.preventDefault();
        createNewColumn();
      }
    });
  }

  // loads the columns names in the dropdown list
  function loadColumnsNames() {
    // First, clear the list
    dropdownList.find('li[data-position]').remove();
    _.each(table.columns().header(), function(el, index) {
      if (index > 1) {
        var colIndex = $(el).attr('data-column-index');
        var visible = table.column(colIndex).visible();
        var editable = $(el).is('[data-editable]');
        var deletable = $(el).is('[data-deletable]');

        var visClass = (visible) ? 'glyphicon-eye-open' : 'glyphicon-eye-close';
        var visLi = (visible) ? '' : 'col-invisible';
        var editClass = (editable) ? '' : 'disabled';
        var delClass = (deletable) ? '' : 'disabled';
        var html =
          '<li ' +
          'data-position="' + colIndex + '" ' +
          'data-id="' + $(el).attr('id') + '" ' +
          'data-edit-url=' + $(el).attr('data-edit-url') + ' ' +
          'data-destroy-html-url=' + $(el).attr('data-destroy-html-url') + ' ' +
          'class="' + visLi + '"' +
          '>' +
          '<i class="grippy"></i> ' +
          '<span class="text">' + el.innerText + '</span> ' +
          '<input type="text" class="text-edit form-control" style="display: none;" />' +
          '<span class="pull-right controls">' +
          '<span class="ok glyphicon glyphicon-ok" style="display: none;"></span>' +
          '<span class="cancel glyphicon glyphicon-remove" style="display: none;"></span>' +
          '<span class="vis glyphicon ' + visClass + '"></span> ' +
          '<span class="edit glyphicon glyphicon-pencil ' + editClass + '">' +
          '</span> ' +
          '<span class="del glyphicon glyphicon-trash ' + delClass + '">' +
          '</span>' +
          '</span>' +
          '</li>';
        dropdownList.append(html);
      }
    });
    toggleColumnVisibility();
    // toggles grip img
    customLiHoverEffect();
  }

  function customLiHoverEffect() {
    var liEl = dropdownList.find('li');
    liEl.mouseover(function() {
      $(this)
        .find('.grippy')
        .addClass('grippy-img');
    }).mouseout(function() {
      $(this)
        .find('.grippy')
        .removeClass('grippy-img');
    });
  }

  function toggleColumnVisibility() {
    var lis = dropdownList.find('.vis');
    lis.on('click', function(event) {
      event.stopPropagation();
      var self = $(this);
      var li = self.closest('li');
      var column = table.column(li.attr('data-position'));

      if (column.visible()) {
        self.addClass('glyphicon-eye-close');
        self.removeClass('glyphicon-eye-open');
        li.addClass('col-invisible');
        column.visible(false);
      } else {
        self.addClass('glyphicon-eye-open');
        self.removeClass('glyphicon-eye-close');
        li.removeClass('col-invisible');
        column.visible(true);
      }
    });
  }

  function initSorting() {
    dropdownList.sortable({
      items: 'li:not(.add-new-column-form)',
      cancel: '.new-samples-column',
      axis: 'y',
      update: function() {
        var reorderer = table.colReorder;
        var listIds = [];
        // We skip first two columns
        listIds.push(0, 1);
        dropdownList.find('li[data-position]').each(function() {
          listIds.push($(this).first().data('position'));
        });
        reorderer.order(listIds, false);
        loadColumnsNames();
      }
    });
  }

  function initEditColumns() {
    function cancelEditMode() {
      dropdownList.find('.text-edit').hide();
      dropdownList.find('.controls .ok,.cancel').hide();
      dropdownList.find('.text').css('display', ''); // show() doesn't work
      dropdownList.find('.controls .vis,.edit,.del').css('display', ''); // show() doesn't work
      columnEditMode = false;
    }

    function editColumn(li) {
      var id = li.attr('data-id');
      var text = li.find('.text');
      var textEdit = li.find('.text-edit');
      var newName = textEdit.val().trim();
      var url = li.attr('data-edit-url');

      $.ajax({
        url: url,
        type: 'PUT',
        data: {custom_field: {name: newName}},
        dataType: 'json',
        success: function() {
          text.text(newName);
          $(table.columns().header()).filter('#' + id).text(newName);
          cancelEditMode();
        },
        error: function(xhr) {
          // TODO
        }
      });
    }

    // On edit buttons click (bind onto master dropdown list)
    dropdownList.on('click', '.edit:not(.disabled)', function(event) {
      event.stopPropagation();

      cancelEditMode();

      var self = $(this);
      var li = self.closest('li');
      var text = li.find('.text');
      var textEdit = li.find('.text-edit');
      var controls = li.find('.controls .vis,.edit,.del');
      var controlsEdit = li.find('.controls .ok,.cancel');

      // Toggle edit mode
      columnEditMode = true;
      li.addClass('editing');

      // Set the text-edit's value
      textEdit.val(text.text().trim());

      // Toggle elements
      text.hide();
      controls.hide();
      textEdit.css('display', ''); // show() doesn't work
      controlsEdit.css('display', ''); // show() doesn't work

      // Focus input
      textEdit.focus();
    });

    // On hiding dropdown, cancel edit mode throughout dropdown
    dropdown.on('hidden.bs.dropdown', function() {
      cancelEditMode();
    });

    // On ok buttons click
    dropdownList.on('click', '.ok', function(event) {
      event.stopPropagation();
      var self = $(this);
      var li = self.closest('li');
      editColumn(li);
    });

    // On enter click while editing column text
    dropdownList.on('keydown', 'input.text-edit', function(event) {
      if (event.keyCode === 13) {
        event.preventDefault();
        var self = $(this);
        var li = self.closest('li');
        editColumn(li);
      }
    });

    // On cancel buttons click
    dropdownList.on('click', '.cancel', function(event) {
      event.stopPropagation();
      var self = $(this);
      var li = self.closest('li');

      columnEditMode = false;
      li.removeClass('editing');

      li.find('.text-edit').hide();
      li.find('.controls .ok,.cancel').hide();
      li.find('.text').css('display', ''); // show() doesn't work
      li.find('.controls .vis,.edit,.del').css('display', ''); // show() doesn't work
    });
  }

  function initDeleteColumns() {
    var modal = $('#deleteCustomField');

    dropdownList.on('click', '.del', function(event) {
      event.stopPropagation();

      var self = $(this);
      var li = self.closest('li');
      var url = li.attr('data-destroy-html-url');
      var pos = li.attr('data-position');

      $.ajax({
        url: url,
        type: 'GET',
        dataType: 'json',
        data: { position: pos },
        success: function(data) {
          var modalBody = modal.find('.modal-body');

          // Inject the body's HTML into modal
          modalBody.html(data.html);

          // Show the modal
          modal.modal('show');
        },
        error: function(xhr) {
          // TODO
        }
      });
    });

    modal.find('.modal-footer [data-action=delete]').on('click', function() {
      var modalBody = modal.find('.modal-body');
      var form = modalBody.find('[data-role=destroy-custom-field-form]');
      var id = form.attr('data-id');

      form
      .on('ajax:success', function() {
        // Destroy datatable
        table.destroy();

        // Subtract number of columns
        $('#samples').data(
          'num-columns',
          $('#samples').data('num-columns') - 1
        );

        // Remove column from table (=table header) & rows
        var th = originalHeader.find('#' + id);
        var index = th.index();
        th.remove();
        $('#samples tbody td:nth-child(' + (index + 1) + ')').remove();

        // Remove all event handlers as we re-initialize them later with
        // new table
        $('#samples').off();
        $('#samples thead').empty();
        $('#samples thead').append(originalHeader);

        // Preserve save/delete buttons as we need them after new table
        // will be created
        $('div.toolbarButtons').appendTo('div.samples-table');
        $('div.toolbarButtons').hide();

        // Re-initialize datatable
        table = dataTableInit();
        loadColumnsNames();

        // Hide modal
        modal.modal('hide');
      })
      .on('ajax:error', function() {
        // TODO
      });

      form.submit();
    });

    modal.on('hidden.bs.modal', function() {
      // Remove event handlers, clear contents
      var modalBody = modal.find('.modal-body');
      modalBody.off();
      modalBody.html('');
    });
  }

  // initialze dropdown after the table is loaded
  function initDropdown() {
    table.on('init.dt', function() {
      initNewColumnForm();
      initSorting();
      toggleColumnVisibility();
      initEditColumns();
      initDeleteColumns();
    });
    $('#samples-columns-dropdown').on('show.bs.dropdown', function() {
      loadColumnsNames();
    });
  }

  initDropdown();
})(table);
