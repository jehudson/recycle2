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
