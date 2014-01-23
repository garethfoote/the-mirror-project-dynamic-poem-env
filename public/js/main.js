var utils,
    main = (function(){

    "use strict";

    // Private functions.
    var self = this,
        selected = [],
        config = {

        },
        init = function(){

            // Attach listeners to poems.
            var els = document.querySelectorAll(".poem-choice"),
                goel = document.querySelector(".progress");

            utils.forEach.call(els, function( el ){
                el.addEventListener("click", handlepoemselect);
            });

            // Attach listener to progress btn.
            goel.addEventListener("click", handleprogress);

        },

        handleprogress = function(e){

            e.preventDefault();

            var els = document.querySelectorAll(".poem-choice.is-selected"),
                progressel = document.querySelector(".progress"),
                url = progressel.href;

            console.log(els);
            utils.forEach.call(els, function(el){
                url += "/"+el.getAttribute("data-dir") +"/"+el.getAttribute("data-name");
            });

            document.location = url;

        },

        handlepoemselect = function(e){

            var el = e.currentTarget;

            if( utils.hasClass(el, "is-selected") ){
                utils.removeClass(el, "is-selected");
            } else {
                utils.addClass(el, "is-selected");
            }

            checkprogress();
        },

        checkprogress = function(){

            var els = document.querySelectorAll(".poem-choice.is-selected"),
                rootel = document.querySelector(".choose");

            if( els.length == 2 ){
                utils.addClass(rootel, "can-progress");
            } else {
                utils.removeClass(rootel, "can-progress");
            }

        };

    return {
        init : init
    };

}());


window.onload = function () {

    utils = new Utils();
    main.init();

};
