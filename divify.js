// The number of pixelated divs added so far.
// used to create specific syle rules for each div.
var DIVCOUNTER = 0;


// Pixelate an image into a grid of divs. The width of the image must
// be a multiple of the pixel size, if the height is not, the image is
// cropped to the next lowest multiple.
//
//
// Pixelating with a pixelSize of 1 will work (and result in a perfect
// looking replication of the image) but for non-trivial image sizes
// this will result in a LARGE number of DOM elements, the rendering
// of which could cause your browser to choke. Success has been had
// with getting a 500x375 image rendering on Chrome and Opera.
//
// In general styling of the pixels is left to the user afterwards via
// the generated stylesheet, with the exception of margin and border,
// as these alter the width of the final pixelated image and this needs
// the parent div needs to have its width updated to reflect this. 
//
// Parameters: 
//   divified    The target element to place the grid in.
//   img         target to pixelate. Either an image URL, img element or 
//               canvas element with image loaded using drawImage, or
//               an ImageData object -- the result of context.getImageData()
//               to facillitate not having to get this multiple times. 
//   pixelSize   The size of the pixels, must be a multiple of the image width.
//   margin      Optional margin to add to pixels. 'explodes' the image.
function divifyImage(divified, image, pixelSize, margin) {

    var divifyOnLoad = function () {
        var width = this.width;
        var height = this.height;
        canvas.width = width;
        canvas.height = height;
        
        var context = canvas.getContext('2d');
        context.drawImage(this, 0, 0);
        var imgd = context.getImageData(0, 0, width, height);
        var pix = imgd.data;

        divify(pix, divified, pixelSize, width, margin);
    }  

    if (typeof image == "string") {
        var canvas = document.createElement('canvas');
        var img = new Image();        
        img.src = image;
        img.onload = divifyOnLoad;
    } else if (image.tagName == 'IMG') {
        var canvas = document.createElement('canvas');
        image.onload = divifyOnLoad;
    } else if (image.tagName == 'CANVAS') {
        var context = image.getContext('2d');
        var imgd = context.getImageData(0, 0, image.width, image.height);
        divify(imgd.data, divified, pixelSize, image.width);
    } else if (image instanceof ImageData) {
        divify(image.data, divified, pixelSize, image.width, margin);
    }
}


// Useful if you want to display the source canvas and/or creating
// multiple pixelations from the one image without having to
// continually create canvases/extract pixels.
function imageToCanvas(image, canvas, callback) {
    if (typeof image == "string") {
        var img = new Image();        
        img.src = image; 
    } else {
        var img = image;
    }

    img.onload = function() {
        var width = this.width;
        var height = this.height;
        canvas.width = width;
        canvas.height = height;
        var context = canvas.getContext('2d');
        context.drawImage(this, 0, 0);
        var imgd = context.getImageData(0, 0, img.width, img.height);
        callback(imgd);
    }
}


function divify(pix, divified, pixelSize, width, margin) {
    var margin = margin || 0;

    // It is much faster to insert a single element with a large
    // number of child elements than to directly insert them all.
    var divs = ['<div id="divified',DIVCOUNTER,'">'];
    
    if (pixelSize == 1)
        addDivs1(divs, pix);
    else
        addDivs(divs, pix, pixelSize, width);

    divs.push('<div style="clear:both"></div>');
    divs.push('</div>');


    divified.style.width = (width + 2*margin*width/pixelSize)+ 'px';
    makeStyleSheet(pixelSize, margin);
    divified.innerHTML = divs.join('');
    DIVCOUNTER++;
}


// Make a style sheet and attach to the DOM rather than style the divs
// directly, to facilitate user styling once the div is created.
// We need to make the styles relative to the current divified div in
// case multiple are being made on the same page. 
function makeStyleSheet(pixelSize, margin) {
    var sheet = document.createElement('style');
    sheet.id = 'divified-styles';
    sheet.innerHTML = '#divified'+DIVCOUNTER+' .p { float: left; width: '+pixelSize+'px; height: '+pixelSize+'px; margin: '+margin+'px}';
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
    var height = pix.length/4/width;
    var croppedHeight = height - height % l;
    var n = 4*width*croppedHeight;
    
    while(i < n) {
        var x = Math.floor(i/4); 

        if ( x % width == 0 && x % (l*width) != 0) {
            // If we have finished adding a row, ie: if we are at the
            // start of row and that start row is NOT a multiple of l:
            // skip by incrementing the counter to bring us to the
            // start of the next row to add.
            i += 4*(l-1)*width;
        }

        // check that we haven't jumped off the edge of the image
        // or we've gone over the to the nearest pixel height 
        if (i >= n)
            break;

        var r = averageCol(i, 0);
        var g = averageCol(i, 1);
        var b = averageCol(i, 2);
        var a = averageCol(i, 3);
        if (isNaN(r))
            var z = 1;
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
