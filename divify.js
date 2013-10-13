function loadImage(canvas, divified) {
    var img = new Image();
    img.src = 'images/mt_townsend.jpg';
    img.onload = function () {
        divify(canvas, divified, this);
    }
}

function divify(canvas, divified, img) {
    var context = canvas.getContext('2d');
    var width = img.width;
    var height = img.height;
    canvas.width = img.width;
    canvas.height = img.height;
    context.drawImage(img, 0, 0);
    var imgd = context.getImageData(0, 0, width, height);
    var pix = imgd.data;

    var divs = ['<div>'];
    for (var i = 0, n = pix.length; i < n; i += 4) {
        var r = pix[i];
        var g = pix[i+1];
        var b = pix[i+2];
        //var a = pix[i+3];
        divs.push('<div class="p" style="background-color:rgb(');
        divs.push([r,g,b].join(','));
        divs.push(')"></div>');
    }

    divs.push('<div class="clear"></div>');
    divs.push('</div>');
    divified.style.width = width + 'px';
    divified.innerHTML = divs.join('');
}


window.onload = function () {
    var canvas = document.getElementById('canvas'); 
    var divified = document.getElementById('divified');
    loadImage(canvas, divified);
}
