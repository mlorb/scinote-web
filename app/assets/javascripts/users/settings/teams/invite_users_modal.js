(function() {
  'use strict';

  function initializeModal(modal) {
    var modalDialog = modal.find('.modal-dialog');
    var type = modal.attr('data-type');
    var stepForm = modal.find('[data-role=step-form]');
    var stepResults = modal.find('[data-role=step-results]');
    var stepResultsDiv = modal.find('[data-role=step-results][data-clear]');
    var inviteBtn = modal.find('[data-role=invite-btn]');
    var inviteWithRoleDiv = modal.find('[data-role=invite-with-role-div]');
    var inviteWithRoleBtn = modal.find('[data-role=invite-with-role-btn]');
    var teamSelectorCheckbox = modal.find('[data-role=team-selector-checkbox]');
    var teamSelectorDropdown = modal.find('[data-role=team-selector-dropdown]');
    var teamSelectorDropdown2 = $();
    var tagsInput = modal.find('[data-role=tags-input]');

    // Set max tags
    tagsInput.tagsinput({
      maxTags: modal.data('max-tags')
    });

    modal.on('show.bs.modal', function() {
      // This cannot be scoped outside this function
      // because it is generated via JS
      teamSelectorDropdown2 = teamSelectorDropdown.parent()
        .find('button.dropdown-toggle, li');

      // Show/hide correct step
      stepForm.show();
      stepResults.hide();

      // Show/hide buttons & other elements
      switch (type) {
        case 'invite_to_team_with_role':
        case 'invite':
        case 'invite_with_team_selector':
        case 'invite_with_team_selector_and_role':
          inviteBtn.show();
          inviteWithRoleDiv.hide();
          break;
        case 'invite_to_team':
          inviteBtn.hide();
          inviteWithRoleDiv.show();
          break;
        default:
          break;
      }

      // Checkbox toggle event
      if (
        type === 'invite_with_team_selector' ||
        type === 'invite_with_team_selector_and_role'
      ) {
        teamSelectorCheckbox.on('change', function() {
          if ($(this).is(':checked')) {
            teamSelectorDropdown.removeAttr('disabled');
            teamSelectorDropdown2.removeClass('disabled');
            if (type === 'invite_with_team_selector') {
              inviteBtn.hide();
              inviteWithRoleDiv.show();
            }
          } else {
            teamSelectorDropdown.attr('disabled', 'disabled');
            teamSelectorDropdown2.addClass('disabled');
            if (type === 'invite_with_team_selector') {
              inviteBtn.show();
              inviteWithRoleDiv.hide();
            }
          }
        });
      }

      // Toggle depending on input tags
      tagsInput.on('itemAdded', function() {
        inviteBtn.removeAttr('disabled');
        inviteWithRoleBtn.removeAttr('disabled');
      }).on('itemRemoved', function() {
        if ($(this).val() === null) {
          inviteBtn.attr('disabled', 'disabled');
          inviteWithRoleBtn.attr('disabled', 'disabled');
        }
      });

      // Click action
      modal.find('[data-action=invite]').on('click', function() {
        var data = {
          emails: tagsInput.val()
        };

        animateSpinner(modalDialog);

        switch (type) {
          case 'invite_to_team':
            data.teamId = modal.attr('data-team-id');
            data.role = $(this).attr('data-team-role');
            break;
          case 'invite_to_team_with_role':
            data.teamId = modal.attr('data-team-id');
            data.role = modal.attr('data-team-role');
            break;
          case 'invite':
            break;
          case 'invite_with_team_selector':
            if (teamSelectorCheckbox.is(':checked')) {
              data.teamId = teamSelectorDropdown.val();
              data.role = $(this).attr('data-team-role');
            }
            break;
          case 'invite_with_team_selector_and_role':
            if (teamSelectorCheckbox.is(':checked')) {
              data.teamId = teamSelectorDropdown.val();
              data.role = modal.attr('data-team-role');
            }
            break;
          default:
            break;
        }

        $.ajax({
          method: 'POST',
          url: modal.attr('data-url'),
          dataType: 'json',
          data: data,
          success: function(data) {
            animateSpinner(modalDialog, false);
            stepForm.hide();
            stepResultsDiv.html(data.html);
            stepResults.show();
            // Add 'data-invited="true"' status to modal element
            modal.attr('data-invited', 'true');
          },
          error: function() {
            animateSpinner(modalDialog, false);
            modal.modal('hide');
            alert('Error inviting users.');
          }
        });
      });
    }).on('shown.bs.modal', function() {
      tagsInput.tagsinput('focus');

      // Remove 'data-invited="true"' status
      modal.removeAttr('data-invited');
    }).on('hide.bs.modal', function() {
      // 'Reset' modal state
      tagsInput.tagsinput('removeAll');
      teamSelectorCheckbox.prop('checked', false);
      inviteBtn.attr('disabled', 'disabled');
      inviteWithRoleBtn.attr('disabled', 'disabled');
      teamSelectorDropdown2.addClass('disabled');
      animateSpinner(modalDialog, false);

      // Unbind event listeners
      teamSelectorCheckbox.off('change');
      tagsInput.off('itemAdded itemRemoved');
      modal.find('[data-action=invite]').off('click');

      // Hide contents of the results <div>
      stepResultsDiv.html('');
      stepResults.hide();
      stepForm.show();
    });
  }

  function initializeModalsToggle() {
    $("[data-trigger='invite-users']").on('click', function(event) {
      var id = $(this).attr('data-modal-id');
      event.preventDefault();
      event.stopPropagation();
      $('[data-role=invite-users-modal][data-id=' + id + ']')
        .modal('show');
    });
  }

  $('[data-role=invite-users-modal]').each(function() {
    initializeModal($(this));
  });
  initializeModalsToggle();
}());