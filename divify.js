// The number of pixelated divs added so far.
// used to create specific style rules for each div.
var DIVCOUNTER = 0;


/* Pixelates an image into a grid of divs.
 *
 * Parameters: 
 *
 *   divified    The target element to place the div of divs in.
 *   img         Target to pixelate. Either an image URL, <img> element, 
 *               canvas element with image loaded using drawImage(), or
 *               an ImageData object -- the result of context.getImageData()
 *               to facillitate not having to get this multiple times. 
 *   pixelSize   The size of the pixels, must be a factor of the image width.
 *               If it is not a factor of the image height, the height of the
 *               pixelated image will be cropped to the closest multiple.
 *               A size of 1 is valid but results in a large number of divs and 
 *               may crash your broswer.
 *   styles      Optional {style:value} object of CSS styles to be applied 
 *               to pixels. Note that only a single value is supported for 
 *               margin and padding. 
 */

function divifyImage(divified, image, pixelSize, styles) {

    var divifyOnLoad = function () {
        var width = this.width;
        var height = this.height;
        canvas.width = width;
        canvas.height = height;
        
        var context = canvas.getContext('2d');
        context.drawImage(this, 0, 0);
        var imgd = context.getImageData(0, 0, width, height);
        var pix = imgd.data;

        divify(pix, divified, pixelSize, width, styles);
    }  

    if (typeof image == "string") {
        var canvas = document.createElement('canvas');
        var img = new Image();        
        img.src = image;
        img.onload = divifyOnLoad;
    } else if (image.tagName == 'IMG') {
        var canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        var context = canvas.getContext('2d');
        context.drawImage(image, 0, 0);
        var imgd = context.getImageData(0, 0, image.width, image.height);
        divify(imgd.data, divified, pixelSize, image.width, styles);
    } else if (image.tagName == 'CANVAS') {
        var canvas = image;
        var context = canvas.getContext('2d');
        var imgd = context.getImageData(0, 0, canvas.width, canvas.height);
        divify(imgd.data, divified, pixelSize, canvas.width, styles);
    } else if (image instanceof ImageData) {
        divify(image.data, divified, pixelSize, image.width, styles);
    }
}


// Useful if you want to display the source canvas and/or for creating
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


function divify(pix, divified, pixelSize, width, styles) {
    var styles = styles || {};
    var margin = parseInt(styles.margin) || 0;
    var border = parseInt(styles.border) || 0;
    var padding = parseInt(styles.padding) || 0;
    var pixelSize = parseInt(pixelSize);

    if (isNaN(pixelSize))
        pixelSize = 10;

    // It's much faster to insert a single element with a large number
    // of child elements than to directly insert them all.
    var divs = ['<div id="divified-',DIVCOUNTER,'" class="divified">'];
    
    if (pixelSize == 1)
        addDivs1(divs, pix);
    else
        addDivs(divs, pix, pixelSize, width);

    divs.push('<div style="clear:both"></div>');
    divs.push('</div>');


    var extraMargin = 2*margin*width/pixelSize;
    var extraBorder = 2*border*width/pixelSize;
    var extraPadding = 2*padding*width/pixelSize;
    divified.style.width = (width + extraMargin + extraBorder)+ 'px';
    makeStyleSheet(pixelSize, styles);

    divs.push(divified.innerHTML)
    divified.innerHTML = divs.join('')
    DIVCOUNTER++;
}


// Make a style sheet and attach to the DOM rather than style the divs
// directly, to facilitate user styling once the div is created.
// We need to make the styles relative to the current divified div in
// case multiple are being made on the same page. 
function makeStyleSheet(pixelSize, styles) {
    var stylesArray = [];

    for (property in styles)
        stylesArray.push(property + ':' + styles[property] + ';');

    var sheet = document.createElement('style');
    sheet.id = 'divified-styles-'+DIVCOUNTER;
    sheet.innerHTML = '#divified-'+DIVCOUNTER+' .p { float: left; width: '+pixelSize+'px; height: '+pixelSize+'px; ' + stylesArray.join(' ') + '}';
    document.body.appendChild(sheet);
}


// Dedicated function for when the pixel length is 1. No pixelation is
// required. Just recreates the image. With divs. Probably the most
// inefficient image rendering method there is. 
function addDivs1(divs, pix) {
    for (var i = 0, n = pix.length; i < n; i += 4) {
        var r = pix[i  ];
        var g = pix[i+1];
        var b = pix[i+2];
        var a = pix[i+3];
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
