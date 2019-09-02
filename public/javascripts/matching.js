var check = function()  {
    if (document.getElementById('password').value ==
        document.getElementById('confirm').value) {
        document.getElementById('matching-message').style.color = 'green';
        document.getElementById('matching-message').innerHTML = '';
    } else {
        document.getElementById('matching-message').style.color = 'red';
        document.getElementById('matching-message').innerHTML = 'Passwords Do Not Match';
    }
  }