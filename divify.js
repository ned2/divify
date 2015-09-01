// The number of pixelated divs added so far.  Used for identifying
// the dividied images to create specific style rules for each div.
var DIVCOUNTER = 0;


/* Pixelates an image into a grid of divs and inserts them into
 * target element. This function mainly works out what kind of 
 * image parameter was supplied and performs relevant setup before 
 * invoking the main divify function.
 *
 * Parameters: 
 *
 * divified    The target element to place the div of divs in.
 *             Any existing contents will be clobbered. 
 * image       Target to pixelate. Either an image URL, <img> element, 
 *             canvas element with image loaded using drawImage(), or
 *             an ImageData object -- the result of context.getImageData(),
 *             for repeated use of the same image without having to reload it.
 * pixelSize   The size of the pixels, must be a factor of the image width.
 *             If it is not a factor of the image height, the height of the
 *             pixelated image will be cropped to the closest multiple.
 *             A size of 1 is valid but results in a large number of divs and 
 *             may crash your broswer.
 * styles      Optional {style:value} object of CSS styles to be applied 
 *             to pixels. Note that only a single value is supported for 
 *             margin and padding. 
 */
function divifyImage(divified, image, pixelSize, styles) {

    if (typeof image == "string") {
        // image is a URL
        var divifyOnLoad = function () {
            var width = this.width;
            var height = this.height;
            canvas.width = width;
            canvas.height = height; 
            var context = canvas.getContext('2d');
            context.drawImage(this, 0, 0);
            var imgData = context.getImageData(0, 0, width, height);
            divify(imgData, divified, pixelSize, styles);
        }  

        var canvas = document.createElement('canvas');
        var img = new Image();        
        img.src = image;
        img.onload = divifyOnLoad;
    } else if (image.tagName == 'IMG') {
        // image is an <img> element  
        var canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        var context = canvas.getContext('2d');
        context.drawImage(image, 0, 0);
        var imgData = context.getImageData(0, 0, image.width, image.height);
        divify(imgData, divified, pixelSize, styles);
    } else if (image.tagName == 'CANVAS') {
        // image is a <canvas> element pre-loaded with image  
        var canvas = image;
        var context = canvas.getContext('2d');
        var imgData = context.getImageData(0, 0, canvas.width, canvas.height);
        divify(imgData, divified, pixelSize, styles);
    } else if (image instanceof ImageData) {
        // image is an ImageData object
        divify(image, divified, pixelSize, styles);
    }
}


/* Takes an arrary of pixels returned by the canvas getImageData() function 
 * and  converts them into a grid of divs representing the image and inserts
 * them into the target element.
 *
 * Parameters: 
 *
 * imageData   ImageData object returned by the getImageData() function.  
 * divified    The target element to place the div of divs in.
 *             Any existing contents will be clobbered. 
 * pixelSize   The size of the pixels, must be a factor of the image width.
 *             If it is not a factor of the image height, the height of the
 *             pixelated image will be cropped to the closest multiple.
 *             A size of 1 is valid but results in a large number of divs and 
 *             may crash your broswer.
 * styles      Optional {style:value} object of CSS styles to be applied 
 *             to pixels. Note that only a single value is supported for 
 *             margin and padding. 
 */
function divify(imageData, divified, pixelSize, styles) {
    var styles = styles || {};
    var pixelSize = parseInt(pixelSize) || 10;
    var margin = parseInt(styles.margin) || 0;
    var border = parseInt(styles.border) || 0;
    var padding = parseInt(styles.padding) || 0;

    var width = imageData.width;
    var height = imageData.height;
    var pixels = imageData.data;

    // if the pixelSize does not divide evenly into the width
    // crop the image so that it does. (Not a problem for height
    // as the the averaging algorithm implicitly crops the height 
    originalWidth = width;
    width = width - width % pixelSize;
    height = height - height % pixelSize;
    
    // Set the width of the divified element, taking into account any
    // extra margin, padding or border introduced with styles.
    var extraMargin = 2*margin*width/pixelSize;
    var extraBorder = 2*border*width/pixelSize;
    var extraPadding = 2*padding*width/pixelSize;
    divified.style.width = (width + extraMargin +
                            extraBorder + extraPadding) + 'px';

    // Set the styles for the divified element by making a new stylesheet
    makeStyleSheet(pixelSize, styles);

    // It's faster to insert a single element with a large number of
    // child elements than to directly insert them all. So we'll just
    // build up an array of strings which will be concatenated into
    // one single string of HTML.
    var htmlStrs = ['<div id="divified-', DIVCOUNTER, '" class="divified">'];
    
    if (pixelSize == 1)
        addDivs1Px(htmlStrs, pixels);
    else
        addDivs(htmlStrs, pixels, pixelSize, height, width, originalWidth);

    htmlStrs.push('<div style="clear:both"></div></div>');
    htmlStrs.push(divified.innerHTML)
    divified.innerHTML = htmlStrs.join('')
    DIVCOUNTER++;
}


/* Adds HTML strings for the div 'pixels' to an array.
 * 
 * Parameters:
 * htmlStrs    Array for building up HTML strings
 * pixels      Array of pixels returned by context.getImageData 
 * l           Int representing pixel size
 * width       Int representing image width in pixels 
 */  
function addDivs(htmlStrs, pixels, l, height, width, originalWidth) {
    var averageCol = function(index, offset) {
        var x_indexes = range(index+offset, index+offset + 4*l, 4);
        var y_indexes = range(index+offset, index+offset + 4*l*originalWidth, 4*originalWidth);
        var vals = x_indexes.concat(y_indexes).map(function(x){ return pixels[x]; });
        return Math.round(vals.average());
    }

    var rows = 0;
    var i = 0;
    var cropped = originalWidth - width;
    var n = 4*width*height;
    
    while(i < n) {
        var x = Math.floor(i/4); 

        if (cropped)
            x = x + cropped;
        
        if ( x % originalWidth == 0 && x % (l*originalWidth) != 0) {
            // If we have finished adding a row, ie: if we are at the
            // start of row and that start row is NOT a multiple of l:
            // skip by incrementing the counter to bring us to the
            // start of the next row to add.
            i += 4*(l-1)*originalWidth + 4*cropped;
        }

        // check that we haven't jumped off the edge of the image
        // or we've gone over the to the nearest pixel height 
        if (i >= n)
            break;

        var r = averageCol(i, 0);
        var g = averageCol(i, 1);
        var b = averageCol(i, 2);
        var a = averageCol(i, 3);
        htmlStrs.push('<div class="p" style="background-color:rgba(');
        htmlStrs.push([r,g,b,a].join(','));
        htmlStrs.push(')"></div>');
        i += 4*l;
    }
}


/* Dedicated function for when the pixel length is 1. No pixelation is
 * required. Just recreates the image with divs. A wonderfully
 * inefficient image rendering method.
 * 
 * Parameters:
 * htmlStrs    Array for building up HTML strings
 * pixels      Array of pixels returned by context.getImageData 
 */
function addDivs1Px(htmlStrs, pixels) {
    for (var i = 0, n = pixels.length; i < n; i += 4) {
        var r = pixels[i  ];
        var g = pixels[i+1];
        var b = pixels[i+2];
        var a = pixels[i+3];
        htmlStrs.push('<div class="p" style="background-color:rgba(');
        htmlStrs.push([r,g,b,a].join(','));
        htmlStrs.push(')"></div>');
    }
}


/* Makes a stylesheet and attaches it to the DOM.
 * 
 * Do this rather than styling the divs inline in order to facilitate
 * user styling once the divs are created.  Makes the styles relative
 * to the current divified div in case multiple divified images are
 * added to the same page.
 */
function makeStyleSheet(pixelSize, styles) {
    var stylesArray = [];

    for (property in styles)
        stylesArray.push(property + ':' + styles[property] + ';');

    var sheet = document.createElement('style');
    sheet.id = 'divified-styles-'+DIVCOUNTER;
    // TODO: clean this up
    sheet.innerHTML = '#divified-'+DIVCOUNTER+' .p { float: left; width: '+pixelSize+'px; height: '+pixelSize+'px; ' + stylesArray.join(' ') + '}';
    document.body.appendChild(sheet);
}



/* Loads an image onto supplied canvas element.
 * 
 * Parameters: 
 * image       Image to load onto canvas, can be a URL or <img> element.
 * canvas      Canvas element to be loaded onto.
 * callback    Optional callback to apply to imageData object from canvas.  
 *
 * Useful if you want to display the source canvas and/or for creating
 * multiple pixelations from the one image without having to
 * continually create canvases/extract pixels.
 */
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

        if (typeof callback === 'function') {
            var imgData = context.getImageData(0, 0, img.width, img.height);
            callback(imgData);
        }
    }
}


// Add an average method to the Arrary prototype
Array.prototype.average = function() {
    var i = this.length;
    var s = 0;

    while (i--) 
        s += this[i];

    return s/this.length;
}


// Mimics Python's range function
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
