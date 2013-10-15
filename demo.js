$(document).ready(function() {

    var divifyAll = function(imgData) { 
        divifyImage($('#pix1')[0], imgData, 5); 
        divifyImage($('#pix2')[0], imgData, 10); 
        divifyImage($('#pix3')[0], imgData, 10, {'border-radius':'5px'}); 
        divifyImage($('#pix4')[0], imgData, 10, {'margin':'1px'}); 
        divifyImage($('#pix5')[0], imgData, 10, {'border':'1px solid black'}); 
        divifyImage($('#pix6')[0], imgData, 10, {'border':'1px solid black', 'margin':'1px'}); 
        divifyImage($('#pix7')[0], imgData, 10, {'border-radius':'5px', 'box-shadow':'3px 3px 3px', 'margin':'1px'});     }

    var canvas = document.getElementById('original');
    imageToCanvas('images/mt_townsend.jpg', canvas, divifyAll);

});
