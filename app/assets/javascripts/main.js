// Main JS for Adopta.
//
// Adopta, aka, is the configurarion object expected from
// main.conf.js.erb

(function($, a, w, undefined) {
$(function() {
  var o = a.options;
  var s = a.strings;
  
  // Variables used throughout
  var activeThingId;
  var activeMarker;
  var activeInfoWindow;
  var thingIds = [];
  var isWindowOpen = false;
  
  // Backbone objects.  Model for "Thing"
  var Thing = Backbone.Model.extend({
    
  });
  // Model for User
  var User = Backbone.Collection.extend({
    
  });
  
  // Collection for multiple things
  var Things = Backbone.Collection.extend({
    
  });
  
  // A marker that is a thing
  var ThingMarker = Backbone.View.extend({
    
  });
  // View of things on a map
  var ThingsMap = Backbone.View.extend({
    
  });
  // View of for User, like logging in
  var UserView = Backbone.View.extend({
    
  });
  
  // Create map object
  a.map = new google.maps.Map(document.getElementById("map"), o.mapOptions);

  function addMarker(thingId, point, color) {
    if(color === 'green') {
      var image = o.greenMarkerImage;
    } else if(color === 'red') {
      var image = o.redMarkerImage;
    }
    var marker = new google.maps.Marker({
      animation: google.maps.Animation.DROP,
      icon: image,
      map: a.map,
      position: point,
      shadow: o.markerShadowImage
    });
    google.maps.event.addListener(marker, 'click', function() {
      if(activeInfoWindow) {
        activeInfoWindow.close();
      }
      var infoWindow = new google.maps.InfoWindow({
        maxWidth: 210
      });
      google.maps.event.addListener(infoWindow, 'closeclick', function() {
        isWindowOpen = false;
      });
      activeInfoWindow = infoWindow;
      activeThingId = thingId;
      activeMarker = marker;
      $.ajax({
        type: 'GET',
        url: '/info_window',
        data: {
          'thing_id': thingId
        },
        success: function(data) {
          // Prevent race condition, which could lead to multiple windows being open at the same time.
          if(infoWindow === activeInfoWindow) {
            infoWindow.setContent(data);
            infoWindow.open(a.map, marker);
            isWindowOpen = true;
          }
        }
      });
    });
    thingIds.push(thingId);
  }
  function addMarkersAround(lat, lng) {
    var submitButton = $("#address_form input[type='submit']");
    $.ajax({
      type: 'GET',
      url: '/things.json',
      data: {
        'utf8': '✓',
        'authenticity_token': $('#address_form input[name="authenticity_token"]').val(),
        'lat': lat,
        'lng': lng,
        'limit': $('#address_form input[name="limit"]').val()
      },
      error: function(jqXHR) {
        $(submitButton).attr("disabled", false);
      },
      success: function(data) {
        $(submitButton).attr("disabled", false);
        if(data.errors) {
          $('#address').parent().addClass('error');
          $('#address').focus();
        } else {
          $('#address').parent().removeClass('error');
          var i = -1;
          $(data).each(function(index, thing) {
            if($.inArray(thing.id, thingIds) === -1) {
              i += 1;
            } else {
              // continue
              return true;
            }
            setTimeout(function() {
              var point = new google.maps.LatLng(thing.lat, thing.lng);
              if(thing.user_id) {
                var color = 'green';
              } else {
                var color = 'red';
              }
              addMarker(thing.id, point, color);
            }, i * 100);
          });
        }
      }
    });
  }
  google.maps.event.addListener(a.map, 'idle', function() {
    var center = a.map.getCenter();
    addMarkersAround(center.lat(), center.lng());
  });
  $('#address_form').live('submit', function() {
    var submitButton = $("#address_form input[type='submit']");
    $(submitButton).attr("disabled", true);
    if($('#address').val() === '') {
      $(submitButton).attr("disabled", false);
      $('#address').parent().addClass('error');
      $('#address').focus();
    } else {
      $.ajax({
        type: 'GET',
        url: '/address.json',
        data: {
          'utf8': '✓',
          'authenticity_token': $('#address_form input[name="authenticity_token"]').val(),
          'city_state': $('#city_state').val(),
          'address': $('#address').val()
        },
        error: function(jqXHR) {
          $(submitButton).attr("disabled", false);
          $('#address').parent().addClass('error');
          $('#address').focus();
        },
        success: function(data) {
          $(submitButton).attr("disabled", false);
          if(data.errors) {
            $('#address').parent().addClass('error');
            $('#address').focus();
          } else {
            $('#address').parent().removeClass('error');
            addMarkersAround(data[0], data[1]);
            var center = new google.maps.LatLng(data[0], data[1]);
            a.map.setCenter(center);
            a.map.setZoom(19);
          }
        }
      });
    }
    return false;
  });
  // Focus on the first non-empty text input or password field
  function setComboFormFocus() {
    $('#combo-form input[type="email"], #combo-form input[type="text"]:visible, #combo-form input[type="password"]:visible, #combo-form input[type="submit"]:visible, #combo-form input[type="tel"]:visible, #combo-form button:visible').each(function(index) {
      if($(this).val() === "" || $(this).attr('type') === 'submit' || this.tagName.toLowerCase() === 'button') {
        $(this).focus();
        return false;
      }
    });
  }
  $('#combo-form input[type="radio"]').live('click', function() {
    var radioInput = $(this);
    if('new' === radioInput.val()) {
      $('#combo-form').data('state', 'user_sign_up');
      $('#user_forgot_password_fields').slideUp();
      $('#user_sign_in_fields').slideUp();
      $('#user_sign_up_fields').slideDown(function() {
        setComboFormFocus();
      });
    } else if('existing' === radioInput.val()) {
      $('#user_sign_up_fields').slideUp();
      $('#user_sign_in_fields').slideDown(function() {
        $('#combo-form').data('state', 'user_sign_in');
        setComboFormFocus();
        $('#user_forgot_password_link').click(function() {
          $('#combo-form').data('state', 'user_forgot_password');
          $('#user_sign_in_fields').slideUp();
          $('#user_forgot_password_fields').slideDown(function() {
            setComboFormFocus();
            $('#user_remembered_password_link').click(function() {
              $('#combo-form').data('state', 'user_sign_in');
              $('#user_forgot_password_fields').slideUp();
              $('#user_sign_in_fields').slideDown(function() {
                setComboFormFocus();
              });
            });
          });
        });
      });
    }
  });
  $('#combo-form').live('submit', function() {
    var submitButton = $("#combo-form input[type='submit']");
    $(submitButton).attr("disabled", true);
    var errors = []
    if(!/[\w\.%\+]+@[\w]+\.+[\w]{2,}/.test($('#user_email').val())) {
      errors.push($('#user_email'));
      $('#user_email').parent().addClass('error');
    } else {
      $('#user_email').parent().removeClass('error');
    }
    if(!$(this).data('state') || $(this).data('state') === 'user_sign_up') {
      if($('#user_name').val() === '') {
        errors.push($('#user_name'));
        $('#user_name').parent().addClass('error');
      } else {
        $('#user_name').parent().removeClass('error');
      }
      if($('#user_password_confirmation').val().length < 6 || $('#user_password_confirmation').val().length > 20) {
        errors.push($('#user_password_confirmation'));
        $('#user_password_confirmation').parent().addClass('error');
      } else {
        $('#user_password_confirmation').parent().removeClass('error');
      }
      if(errors.length > 0) {
        $(submitButton).attr("disabled", false);
        errors[0].focus();
      } else {
        $.ajax({
          type: 'POST',
          url: '/users.json',
          data: {
            'utf8': '✓',
            'authenticity_token': $('#combo-form input[name="authenticity_token"]').val(),
            'user': {
              'email': $('#user_email').val(),
              'name': $('#user_name').val(),
              'organization': $('#user_organization').val(),
              'voice_number': $('#user_voice_number').val(),
              'sms_number': $('#user_sms_number').val(),
              'password': $('#user_password_confirmation').val(),
              'password_confirmation': $('#user_password_confirmation').val()
            }
          },
          error: function(jqXHR) {
            var data = $.parseJSON(jqXHR.responseText);
            $(submitButton).attr("disabled", false);
            if(data.errors.email) {
              errors.push($('#user_email'));
              $('#user_email').parent().addClass('error');
            }
            if(data.errors.name) {
              errors.push($('#user_name'));
              $('#user_name').parent().addClass('error');
            }
            if(data.errors.organization) {
              errors.push($('#user_organization'));
              $('#user_organization').parent().addClass('error');
            }
            if(data.errors.voice_number) {
              errors.push($('#user_voice_number'));
              $('#user_voice_number').parent().addClass('error');
            }
            if(data.errors.sms_number) {
              errors.push($('#user_sms_number'));
              $('#user_sms_number').parent().addClass('error');
            }
            if(data.errors.password) {
              errors.push($('#user_password_confirmation'));
              $('#user_password_confirmation').parent().addClass('error');
            }
            errors[0].focus();
          },
          success: function(data) {
            $.ajax({
              type: 'GET',
              url: '/sidebar/search',
              data: {
                'flash': {
                  'notice': s.notices.signed_up
                }
              },
              success: function(data) {
                $('#content').html(data);
              }
            });
          }
        });
      }
    } else if($(this).data('state') === 'user_sign_in') {
      if($('#user_password').val().length < 6 || $('#user_password').val().length > 20) {
        errors.push($('#user_password'));
        $('#user_password').parent().addClass('error');
      } else {
        $('#user_password').parent().removeClass('error');
      }
      if(errors.length > 0) {
        $(submitButton).attr("disabled", false);
        errors[0].focus();
      } else {
        $.ajax({
          type: 'POST',
          url: '/users/sign_in.json',
          data: {
            'utf8': '✓',
            'authenticity_token': $('#combo-form input[name="authenticity_token"]').val(),
            'user': {
              'email': $('#user_email').val(),
              'password': $('#user_password').val(),
              'remember_me': $('#user_remember_me').val()
            }
          },
          error: function(jqXHR) {
            $(submitButton).attr("disabled", false);
            $('#user_password').parent().addClass('error');
            $('#user_password').focus();
          },
          success: function(data) {
            $.ajax({
              type: 'GET',
              url: '/sidebar/search',
              data: {
                'flash': {
                  'notice': s.notices.signed_in
                }
              },
              success: function(data) {
                $('#content').html(data);
              }
            });
          }
        });
      }
    } else if($(this).data('state') === 'user_forgot_password') {
      if(errors.length > 0) {
        $(submitButton).attr("disabled", false);
        errors[0].focus();
      } else {
        $.ajax({
          type: 'POST',
          url: '/users/password.json',
          data: {
            'utf8': '✓',
            'authenticity_token': $('#combo-form input[name="authenticity_token"]').val(),
            'user': {
              'email': $('#user_email').val()
            }
          },
          error: function(jqXHR) {
            $(submitButton).attr("disabled", false);
            $('#user_email').parent().addClass('error');
            $('#user_email').focus();
          },
          success: function() {
            $(submitButton).attr("disabled", false);
            $('#user_remembered_password_link').click();
            $('#user_password').focus();
          }
        });
      }
    }
    return false;
  });
  $('#adoption_form').live('submit', function() {
    var submitButton = $("#adoption_form input[type='submit']");
    $(submitButton).attr("disabled", true);
    $.ajax({
      type: 'POST',
      url: '/things.json',
      data: {
        'id': $('#thing_id').val(),
        'utf8': '✓',
        'authenticity_token': $('#adoption_form input[name="authenticity_token"]').val(),
        '_method': 'put',
        'thing': {
          'user_id': $('#thing_user_id').val(),
          'name': $('#thing_name').val()
        }
      },
      error: function(jqXHR) {
        $(submitButton).attr("disabled", false);
      },
      success: function(data) {
        $.ajax({
          type: 'GET',
          url: '/info_window',
          data: {
            'thing_id': activeThingId,
            'flash': {
              'notice': s.notices.adopted_thing
            }
          },
          success: function(data) {
            activeInfoWindow.close();
            activeInfoWindow.setContent(data);
            activeInfoWindow.open(a.map, activeMarker);
            activeMarker.setIcon(o.greenMarkerImage);
            activeMarker.setAnimation(google.maps.Animation.BOUNCE);
          }
        });
      }
    });
    return false;
  });
  $('#abandon_form').live('submit', function() {
    var answer = window.confirm("Are you sure you want to abandon this " + s.defaults.thing + "?")
    if(answer) {
      var submitButton = $("#abandon_form input[type='submit']");
      $(submitButton).attr("disabled", true);
      $.ajax({
        type: 'POST',
        url: '/things.json',
        data: {
          'id': $('#thing_id').val(),
          'utf8': '✓',
          'authenticity_token': $('#abandon_form input[name="authenticity_token"]').val(),
          '_method': 'put',
          'thing': {
            'user_id': $('#thing_user_id').val(),
            'name': $('#thing_name').val()
          }
        },
        error: function(jqXHR) {
          $(submitButton).attr("disabled", false);
        },
        success: function(data) {
          $.ajax({
            type: 'GET',
            url: '/info_window',
            data: {
              'thing_id': activeThingId,
              'flash': {
                'warning': s.notices.abondoned_thing
              }
            },
            success: function(data) {
              activeInfoWindow.close();
              activeInfoWindow.setContent(data);
              activeInfoWindow.open(a.map, activeMarker);
              activeMarker.setIcon(o.redMarkerImage);
              activeMarker.setAnimation(null);
            }
          });
        }
      });
    }
    return false;
  });
  $('#edit_profile_link').live('click', function() {
    var link = $(this);
    $(link).addClass('disabled');
    $.ajax({
      type: 'GET',
      url: '/users/edit',
      error: function(jqXHR) {
        $(link).removeClass('disabled');
      },
      success: function(data) {
        $('#content').html(data);
      }
    });
    return false;
  });
  $('#edit_form').live('submit', function() {
    var submitButton = $("#edit_form input[type='submit']");
    $(submitButton).attr("disabled", true);
    var errors = []
    if(!/[\w\.%\+\]+@[\w\]+\.+[\w]{2,}/.test($('#user_email').val())) {
      errors.push($('#user_email'));
      $('#user_email').parent().addClass('error');
    } else {
      $('#user_email').parent().removeClass('error');
    }
    if($('#user_name').val() === '') {
      errors.push($('#user_name'));
      $('#user_name').parent().addClass('error');
    } else {
      $('#user_name').parent().removeClass('error');
    }
    if($('#user_zip').val() != '' && !/^\d{5}(-\d{4})?$/.test($('#user_zip').val())) {
      errors.push($('#user_zip'));
      $('#user_zip').parent().addClass('error');
    } else {
      $('#user_zip').parent().removeClass('error');
    }
    if($('#user_password').val() && ($('#user_password').val().length < 6 || $('#user_password').val().length > 20)) {
      errors.push($('#user_password'));
      $('#user_password').parent().addClass('error');
    } else {
      $('#user_password').parent().removeClass('error');
    }
    if($('#user_current_password').val().length < 6 || $('#user_current_password').val().length > 20) {
      errors.push($('#user_current_password'));
      $('#user_current_password').parent().addClass('error');
    } else {
      $('#user_current_password').parent().removeClass('error');
    }
    if(errors.length > 0) {
      $(submitButton).attr("disabled", false);
      errors[0].focus();
    } else {
      $.ajax({
        type: 'POST',
        url: '/users.json',
        data: {
          'id': $('#id').val(),
          'thing_id': activeThingId,
          'utf8': '✓',
          'authenticity_token': $('#edit_form input[name="authenticity_token"]').val(),
          '_method': 'put',
          'user': {
            'email': $('#user_email').val(),
            'name': $('#user_name').val(),
            'organization': $('#user_organization').val(),
            'voice_number': $('#user_voice_number').val(),
            'sms_number': $('#user_sms_number').val(),
            'address_1': $('#user_address_1').val(),
            'address_2': $('#user_address_2').val(),
            'city': $('#user_city').val(),
            'state': $('#user_state').val(),
            'zip': $('#user_zip').val(),
            'password': $('#user_password').val(),
            'password_confirmation': $('#user_password').val(),
            'current_password': $('#user_current_password').val()
          }
        },
        error: function(jqXHR) {
          var data = $.parseJSON(jqXHR.responseText);
          $(submitButton).attr("disabled", false);
          if(data.errors.email) {
            errors.push($('#user_email'));
            $('#user_email').parent().addClass('error');
          }
          if(data.errors.name) {
            errors.push($('#user_name'));
            $('#user_name').parent().addClass('error');
          }
          if(data.errors.organization) {
            errors.push($('#user_organization'));
            $('#user_organization').parent().addClass('error');
          }
          if(data.errors.voice_number) {
            errors.push($('#user_voice_number'));
            $('#user_voice_number').parent().addClass('error');
          }
          if(data.errors.sms_number) {
            errors.push($('#user_sms_number'));
            $('#user_sms_number').parent().addClass('error');
          }
          if(data.errors.address_1) {
            errors.push($('#user_address_1'));
            $('#user_address_1').parent().addClass('error');
          }
          if(data.errors.address_2) {
            errors.push($('#user_address_2'));
            $('#user_address_2').parent().addClass('error');
          }
          if(data.errors.city) {
            errors.push($('#user_city'));
            $('#user_city').parent().addClass('error');
          }
          if(data.errors.state) {
            errors.push($('#user_state'));
            $('#user_state').parent().addClass('error');
          }
          if(data.errors.zip) {
            errors.push($('#user_zip'));
            $('#user_zip').parent().addClass('error');
          }
          if(data.errors.password) {
            errors.push($('#user_password'));
            $('#user_password').parent().addClass('error');
          }
          if(data.errors.current_password) {
            errors.push($('#user_current_password'));
            $('#user_current_password').parent().addClass('error');
          }
          errors[0].focus();
        },
        success: function(data) {
          $('#content').html(data);
        }
      });
    }
    return false;
  });
  $('#sign_out_link').live('click', function() {
    var link = $(this);
    $(link).addClass('disabled');
    $.ajax({
      type: 'DELETE',
      url: '/users/sign_out.json',
      error: function(jqXHR) {
        $(link).removeClass('disabled');
      },
      success: function(data) {
        $.ajax({
          type: 'GET',
          url: '/sidebar/combo_form',
          data: {
            'flash': {
              'warning': s.notices.signed_out
            }
          },
          success: function(data) {
            $('#content').html(data);
          }
        });
      }
    });
    return false;
  });
  $('#sign_in_form').live('submit', function() {
    var submitButton = $("#sign_in_form input[type='submit']");
    $(submitButton).attr("disabled", true);
    $.ajax({
      type: 'GET',
      url: '/users/sign_in',
      error: function(jqXHR) {
        $(submitButton).attr("disabled", false);
      },
      success: function(data) {
        activeInfoWindow.close();
        activeInfoWindow.setContent(data);
        activeInfoWindow.open(a.map, activeMarker);
      }
    });
    return false;
  });
  $('#back_link').live('click', function() {
    var link = $(this);
    $(link).addClass('disabled');
    $.ajax({
      type: 'GET',
      url: '/sidebar/search',
      error: function(jqXHR) {
        $(link).removeClass('disabled');
      },
      success: function(data) {
        $('#content').html(data);
      }
    });
    return false;
  });
  $('#reminder_form').live('submit', function() {
    var submitButton = $("#reminder_form input[type='submit']");
    $(submitButton).attr("disabled", true);
    $.ajax({
      type: 'POST',
      url: '/reminders.json',
      data: {
        'utf8': '✓',
        'authenticity_token': $('#reminder_form input[name="authenticity_token"]').val(),
        'reminder': {
          'to_user_id': $('#reminder_to_user_id').val(),
          'thing_id': activeThingId
        }
      },
      error: function(jqXHR) {
        $(submitButton).attr("disabled", false);
      },
      success: function(data) {
        $.ajax({
          type: 'GET',
          url: '/info_window',
          data: {
            'thing_id': activeThingId,
            'flash': {
              'notice': s.notices.reminder_sent
            }
          },
          success: function(data) {
            activeInfoWindow.close();
            activeInfoWindow.setContent(data);
            activeInfoWindow.open(a.map, activeMarker);
          }
        });
      }
    });
    return false;
  });
  
  $('.alert-message').alert();
  
  // To present the user with instructions, we press the About button first.
  $(document).ready(function() {
    // Display if not signed in.  Body class will tell us.
    if ($('body').hasClass('signed-out')) {
      $('a#about_link').trigger('click');
    }
  });
});

})(jQuery, Adopta, window);
