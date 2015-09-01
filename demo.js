//trying to get brickwork-like effect
//$('#divified-4 .p:nth-child(2n)').each(function() { val col= $(this).css('background-color'); $(this).css({'border-left':'1px solid '+col}); })

$(document).ready(function() {

    $("body").click(function(event){
        $(".popup").hide();
    });

    $(".popup").click(function(event){
        event.stopPropagation();
    });

    $('#divify-file-input').change(function(event){
        var file = event.target.files[0];
        var reader = new FileReader();
        var $img = $('#uploaded-image');

        if ($img.length == 0) {
            var img = document.createElement('img');
            img.id = 'uploaded-image';
            img.style.display = 'none';
            document.body.appendChild(img)
        } else {
            var img = $img[0];
        }

        img.title = file.name;

        reader.onload = function(event) {
            img.src = event.target.result;
            img.onload = function() {
                $('#image-width .input-value').html(img.width+'px'); 
                $('#image-height .input-value').html(img.height+'px'); 
            };
        };

        reader.readAsDataURL(file);
    });

    $('#get-html').click(function(event){
        event.stopPropagation();
        $('#html-popup').show();
    });

    $('#get-css').click(function(event){
        event.stopPropagation();
        $('#css-popup').show();
    });

    $('#submit-divify').click(function(event){
        var pixelSize = $('#pixel-size-input').val();
        var $target = $('#user-pix').empty();
        var img = $('#uploaded-image')[0];

        divifyImage($target[0], img, pixelSize); 

        var html = $('#user-pix').html();
        var id = $target.find('.divified')[0].id.split('-')[1];
        var css = $('#divified-styles-'+id).html();

        $('#get-html').show();
        $('#get-css').show();

        $('#html-popup textarea').val(html);
        $('#css-popup textarea').val(css);
    });

    var divifyAll = function(imgData) { 
        divifyImage($('#pix1')[0], imgData, 5); 
        divifyImage($('#pix2')[0], imgData, 10); 
        divifyImage($('#pix3')[0], imgData, 5, {'border-radius':'5px'}); 
        divifyImage($('#pix4')[0], imgData, 5, {'margin':'1px'}); 
        divifyImage($('#pix5')[0], imgData, 5, {'border':'1px solid black'}); 
        divifyImage($('#pix6')[0], imgData, 5, {'border':'1px solid black', 'margin':'1px'}); 
        divifyImage($('#pix7')[0], imgData, 10, {'border-radius':'5px', 'box-shadow':'3px 3px 3px', 'margin':'1px'});     }

    var canvas = document.getElementById('original');
    imageToCanvas('images/seattle_small.jpg', canvas, divifyAll);

});
