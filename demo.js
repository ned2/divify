$(document).ready(function() {

    var divifyAll = function(imgData) { 
        divifyImage($('#pixelated1')[0], imgData, 5); 
        divifyImage($('#pixelated2')[0], imgData, 10); 
        divifyImage($('#rounded')[0], imgData, 10, {'border-radius':'5px'}); 
        divifyImage($('#exploded')[0], imgData, 10, {'margin':'1px'}); 
        divifyImage($('#bordered')[0], imgData, 10, {'border':'1px solid black'}); 
        divifyImage($('#exploded-bordered')[0], imgData, 10, {'border':'1px solid black', 'margin':'1px'}); 
    }

    var canvas = document.getElementById('original');
    imageToCanvas('images/mt_townsend.jpg', canvas, divifyAll);

});
