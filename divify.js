// Pixelate an image into a grid of divs. If the image is not square
// you'll end up with an image with a slightly different height.
//
// Pixelating with a pixelSize of 1 will work (and result in a perfect
// looking replication of the image) but for non-trivial image sizes
// will result in a LARGE number of DOM elements, the rendering of
// which could cause your browser to choke. Success has been had with
// getting a 500x375 image rendering on Chrome and Opera.
//
// Parameters: 
//   divified    The target element to place the grid in.
//   img         Either an image URL or img element to pixelate.
//   pixelSize   The size of the pixels, must be a multiple of the image width.
//   canvas      Optional canvas element to use to load the image into.
//               If omitted, a canvas element is created but not attached
//               to the DOM.   
function divifyImage(divified, img, pixelSize, canvas) {
    if (typeof canvas == "undefined")
        var canvas = document.createElement('canvas');

    if (typeof img == "string") {
        var image = new Image();        
        image.src = img;
    }

    image.onload = function () {
        var width = this.width;
        var height = this.height;
        canvas.width = width;
        canvas.height = height;
        
        var context = canvas.getContext('2d');
        context.drawImage(this, 0, 0);
        var imgd = context.getImageData(0, 0, width, height);
        var pix = imgd.data;

        divify(pix, divified, pixelSize, width);
    }
}


function divify(pix, divified, pixelSize, width) {
    // It is much faster to insert a single element with a large
    // number of child elements than to directly them.
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


// Make a style sheet and attach to the DOM rather than style the divs
// directly, to facilitate user styling once the div is created.
function makeStyleSheet(pixelSize) {
    var sheet = document.createElement('style');
    sheet.id = 'divified-styles';
    sheet.innerHTML = '.p { float: left; width: '+pixelSize+'px; height: '+pixelSize+'px; }';
    document.body.appendChild(sheet);
}


// Dedicated function for when the pixel length is 1. No pixelation is
// required.
function addDivs1(divs, pix) {
    for (var i = 0, n = pix.length; i < n; i += 4) {
        var r = pix[i], g = pix[i+1], b = pix[i+2], a = pix[i+3];
        divs.push('<div class="p" style="background-color:rgba(');
        divs.push([r,g,b,a].join(','));
        divs.push(')"></div>');
    }
}


// Do the pixelation!!
function addDivs(divs, pix, l, width) {
    var averageCol = function(index, offset) {
        var x_indexes = range(index+offset, index+offset + 4*l, 4);
        var y_indexes = range(index+offset, index+offset + 4*l*width, 4*width);
        var vals = x_indexes.concat(y_indexes).map(function(x){ return pix[x]; });
        return Math.round(vals.average());
    }

    var i = 0;
    var n = pix.length;

    while(i < n) {
        var x = Math.floor(i/4); 

        if ( x % width == 0 && x % (l*width) != 0) {
            // If we have finished adding a row, ie: if we are at the
            // start of row and that start row is NOT a multiple of l:
            // skip by incrementing the counter to bring us to the
            // start of the next row to add.
            i += 4*(l-1)*width;
        }

        var r = averageCol(i, 0);
        var g = averageCol(i, 1);
        var b = averageCol(i, 2);
        var a = averageCol(i, 3);
        divs.push('<div class="p" style="background-color:rgba(');
        divs.push([r,g,b,a].join(','));
        divs.push(')"></div>');

        i += 4*l;
    }
}


Array.prototype.average = function() {
    var i = this.length;
    var s = 0;

    while (i--) 
        s += this[i];

    return s/this.length;
}


// models Python's range function
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
