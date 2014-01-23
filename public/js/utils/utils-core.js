var Utils = (function(){

    var UtilsCore = function() {

    };

    UtilsCore.prototype.hasAnyClass = function( el, selectors ) {

        if( ! this.isArray( selectors ) ){
            throw "Not an array.";
            return;
        }

        var i = selectors.length,
            found = false;
        while( i-- ){
            found = this.hasClass( el, selectors[i] );
            if( found ){
                break;
            }
        }
        return found;
    };

    /* currently only working for classes */
    UtilsCore.prototype.exclude = function( results, excluding ) {

        var i = results.length, j,
            notExcluded = [],
            isClass = function(selector){
                return ( selector.trim().substr(0,1) === "." );
            },
            classes = excluding.filter( isClass ),
            filterByClass = function( el ){
                var hasExcludedClass = false,
                    k = classes.length;
                hasExcludedClass = (typeof el === "undefined");
                while( k-- && typeof el !== "undefined" ){
                    // debug.log( el, classes[k], hasExcludedClass);
                    hasExcludedClass = UtilsCore.prototype.hasClass( el, classes[k].trim().substr(1) );
                    if( hasExcludedClass === true ){
                        break;
                    }
                }
                return !hasExcludedClass;
            };

        notExcluded = results.filter( filterByClass );

        return notExcluded;

    };

    var nativeIsArray = Array.isArray;
    UtilsCore.prototype.isArray = nativeIsArray || function( obj ) {
        var toString = Object.prototype.toString;
        return toString.call(obj) === '[object Array]';

    };

    UtilsCore.prototype.hasClass = function( el, selector ) {
        var className;

        if ( this.isArray( el ) ) {
            for(var e = el.length; e > 0; e-- ) {
                if (  this.hasClass( el[e-1], selector )  ) {
                    return true;
                }  
            }
            return false;

        } else {

            className = " " + selector + " ";

            if ((" " + el.className + " ").replace(/[\n\t]/g, " ").indexOf(className) > -1) {
                return true;
            }
            return false;

        }

    };

    UtilsCore.prototype.addClass = function(el, names) {

        if ( this.isArray( el ) ){

            for(var e = el.length; e > 0; e-- ) {
                this.addClass( el[e-1], names );    
            }

        } else {

            if( ! this.isArray( names ) ){
                names = [names];
            }

            for(var n = names.length; n > 0; n-- ) {
                if( ! this.hasClass( el, names[n-1] ) ){
                    el.className += ' ' + names[n-1];
                }
            }
            el.className = el.className.replace(/^\s+|\s+$/g, '').replace('  ',' ').trim();
        }

    };

    UtilsCore.prototype.removeClass = function(el, names) {

        if (this.isArray( el )){

            for(var e = el.length; e > 0; e-- ) {
                this.removeClass( el[e-1], names );    
            }

        } else {

            if( ! this.isArray( names ) ){
                names = [names];
            }

            for(var n = names.length; n > 0; n-- ) {
                el.className = el.className.replace(names[n-1],'').replace(/^\s+|\s+$/g, '').trim();
            }
            el.className = el.className.replace(/^\s+|\s+$/g, '').replace('  ',' ').trim();
        }
    };


    UtilsCore.prototype.toggleClass = function(el, names) {

        if (this.hasClass(el,names)) {
            this.removeClass(el,names);
        } else {
            this.addClass(el,names);
        }

    };

    // Determine if obj has no properties.
    // https://github.com/jashkenas/underscore/blob/master/underscore.js
    UtilsCore.prototype.isEmpty = function( obj ) {
        var hasOwnProperty = Object.prototype.hasOwnProperty;
        if (obj == null) return true;
        if (this.isArray(obj) || this.isString(obj)) return obj.length === 0;
        for (var key in obj) if (hasOwnProperty(obj, key)) return false;
        return true;
    }

    // Simple extend function from here:
    // http://andrewdupont.net/2009/08/28/deep-extending-objects-in-javascript/
    UtilsCore.prototype.extend = function( destination, source ){
        for (var property in source) {
            if (source[property] && source[property].constructor &&
                source[property].constructor === Object) {
                    destination[property] = destination[property] || {};
                    arguments.callee(destination[property], source[property]);
                } else {
                    destination[property] = source[property];
                }
        }
        return destination;
    };


    UtilsCore.prototype.forEach = function(){

        return Array.prototype.forEach;

    }();

    return UtilsCore;

}());
