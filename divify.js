// change this to make canvas optional
// if none specified, then we create one and make it hidden
function divifyImage(divified, src, canvas, pixelSize) {
    var img = new Image();
    img.src = src;
    img.onload = function () {
        var width = this.width;
        var height = this.height;
        canvas.width = width;
        canvas.height = height;
        divify(canvas, this, divified, pixelSize);
    }
}


// Make a style sheet and attach to the DOM rather than style the divs
// directly to faciliate user styling.
function makeStyleSheet(pixelSize) {
    var sheet = document.createElement('style');
    sheet.id = 'divified-styles';
    sheet.innerHTML = '.p { float: left; width: '+pixelSize+'px; height: '+pixelSize+'px; }';
    document.body.appendChild(sheet);
}


function addDivs1(divs, pix) {
    for (var i = 0, n = pix.length; i < n; i += 4) {
        var r = pix[i];
        var g = pix[i+1];
        var b = pix[i+2];
        var a = pix[i+3];
        divs.push('<div class="p" style="background-color:rgba(');
        divs.push([r,g,b,a].join(','));
        divs.push(')"></div>');
    }
}



// Skip if we are at start of row 
// and that start row is NOT a multiple of l
// Skipping means adding the block to skip

function addDivs(divs, pix, l, width) {
    var getpx = function(x){ return pix[x];};

    var i = 0;
    var n = pix.length;

    while(i < n) {
        var x = Math.floor(i/4); 

        if ( x % width == 0 && x % (l*width) != 0) {
            i += 4*(l-1)*width;
        }

        var r = Math.round(range(i  , i  +4*l, 4).map(getpx).average());
        var g = Math.round(range(i+1, i+1+4*l, 4).map(getpx).average());
        var b = Math.round(range(i+2, i+2+4*l, 4).map(getpx).average());
        var a = Math.round(range(i+3, i+2+4*l, 4).map(getpx).average());
        divs.push('<div class="p" style="background-color:rgba(');
        divs.push([r,g,b,a].join(','));
        divs.push(')"></div>');

        i += 4*l;
    }
}


function divify(canvas, img, divified, pixelSize) {
    var width = img.width;
    var height = img.height;
    var context = canvas.getContext('2d');
    context.drawImage(img, 0, 0);
    var imgd = context.getImageData(0, 0, width, height);
    var pix = imgd.data;

    // It is much faster to insert a single element with a bunch of
    // child elements than it is directly inserting a lot of elements.
    var divs = ['<div>'];
    
    if (pixelSize == 1)
        addDivs1(divs, pix);
    else
        addDivs(divs, pix, pixelSize, width);

    divs.push('<div style="clear:both"></div>');
    divs.push('</div>');
    divified.style.width = width + 'px';

    makeStyleSheet(pixelSize);
    divified.innerHTML = divs.join('');
}


Array.prototype.average = function() {
    var i = this.length;
    var s = 0;

    while (i--) 
        s += this[i];

    return s/this.length;
}


// modeling Python's range function, taken from 
// http://stackoverflow.com/a/3895521/77533
function range(start, end, step) {
    var range = [];
    typeof step == "undefined" && (step = 1);
    
    if (end < start) {
        step = -step;
    }
    
    while (step > 0 ? end > start : end < start) {
        range.push(start);
        start += step;
    }
    
    return range;

}


var test = function () {
    var canvas = document.getElementById('canvas'); 
    var divified = document.getElementById('divified');
    divifyImage(divified, 'images/mt_townsend.jpg', canvas, 5);
}

window.onload = test;
