$(document).ready(function() {

    var divifyAll = function(imgd) { 
        divifyImage(document.getElementById('pixelated1'), imgd, 5); 
        divifyImage(document.getElementById('pixelated2'), imgd, 10); 
        divifyImage(document.getElementById('rounded'), imgd, 10); 
        divifyImage(document.getElementById('exploded'), imgd, 10, 1); 
        divifyImage(document.getElementById('bordered'), imgd, 10, 1); 
    }

    var canvas = document.getElementById('original');
    imageToCanvas('images/mt_townsend.jpg', canvas, divifyAll);

});
