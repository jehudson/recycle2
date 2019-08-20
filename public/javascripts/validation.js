$('#registration-btn').click(function () {
    $.ajax({
      url: '/register',
      type: 'POST',
      cache: false,
      data: {
        fullname: $('#fullname').val(),
        username: $('#username').val(),
        email: $('#email').val(),
        password: $('#password').val(),
        confirm_password: $('#confirm').val(),
        location: $('#location').val()
      },
      success: function () {
        $('#error-group').css('display', 'none');
        
      },
      error: function (data) {
        $('#error-group').css('display', 'block');
        var errors = JSON.parse(data.responseText);
        var errorsContainer = $('#errors');
        errorsContainer.innerHTML = '';
        var errorsList = '';
  
        for (var i = 0; i < errors.length; i++) {
          errorsList += '<li>' + errors[i].msg + '</li>';
        }
        errorsContainer.html(errorsList);
      }
    });
  });
