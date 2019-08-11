function openPosts(evt, cityName) {
    var i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    document.getElementById(cityName).style.display = "block";
    evt.currentTarget.className += " active";
}

// Get the element with id="defaultOpen" and click on it
document.getElementById("defaultOpen").click();

$(document).ready(function(){
    $("newpost-button").click(function(){
        $("#newPost").toggle();
    });
});

$(document).ready(function(){
    $("recentpost-button").click(function(){
        $("#recentPost").toggle();
    });
});

$('.drop-down-show-hide').hide();



$('#dropDown-message-type').change(function () {
    $('.drop-down-show-hide').hide()
    $('#' + this.value).show();

});

$('#update-password-btn').click(function () {
    $.ajax({
      url: '/reset_password',
      type: 'POST',
      cache: false,
      data: {
        password: $('#password').val(),
        confirm: $('#confirm').val()
      },
      success: function () {
        $('#error-group').css('display', 'none');
        location.replace("/")
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

function resizePhoto() {
    var output = document.getElementById('filesInfo');
    output.style.visibility = "visible";
    output.innerHTML = "image resized.<br>";
    if (window.File && window.FileReader && window.FileList) {
        var filefield = document.getElementById('postimage');
        var file = filefield.files[0];

        output.innerHTML = output.innerHTML + file.type;
        if (!file.type.match(/image.(png|jpg|jpeg)/)) {
                output.innerHTML = output.innerHTML + "this file is not a PNG or JPG image file.   ";
                return false;
        };

        var reader = new FileReader();
        reader.onloadend = function() {

            var tempImg = new Image();
            tempImg.src = reader.result;
            tempImg.onload = function() {

                var MAX_WIDTH = 600;
                var MAX_HEIGHT = 600;
                var tempW = tempImg.width;
                var tempH = tempImg.height;
                if (tempW > tempH) {
                    if (tempW > MAX_WIDTH) {
                       tempH *= MAX_WIDTH / tempW;
                       tempW = MAX_WIDTH;
                    }
                } else {
                    if (tempH > MAX_HEIGHT) {
                       tempW *= MAX_HEIGHT / tempH;
                       tempH = MAX_HEIGHT;
                    }
                }

                var canvas = document.getElementById('imagePreview');
                canvas.width = tempW;
                canvas.height = tempH;
                var ctx = canvas.getContext("2d");
                ctx.drawImage(this, 0, 0, tempW, tempH);
                var dataURL = canvas.toDataURL("image/jpeg");
                var data = dataURL.replace(/^.*base64,/, "");

                document.getElementById('resizedPostimage').value = unescape(encodeURIComponent(data));   output.innerHTML = output.innerHTML + "<br> " + tempImg.width + "x" + tempImg.height + " -> " + Math.round(tempW) + "x" + Math.round(tempH) + "<br> "  + document.getElementById('resizedPostimage').value.length + " bytes";

              }

           }
           reader.readAsDataURL(file);
    } else {
            output.innerHTML = 'image re-sizing is not fully supported in this browser.';
    }
}


 function fileDisable() {
// if the resizer doesnt work because of browser issues, use regular file field, but if it does, delete the regular file field, because by now, we've resized and put the new image somewhere else.
    if (window.File && window.FileReader && window.FileList) {
        var postimage =  document.getElementById('postimage');
        postimage.remove();
    }
}  
