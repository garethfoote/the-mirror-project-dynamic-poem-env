Object.defineProperty(Array.prototype, 'unique', {
    enumerable: false,
    configurable: false,
    writable: false,
    value: function() {
        var a = this.concat();
        for(var i=0; i<a.length; ++i) {
            for(var j=i+1; j<a.length; ++j) {
                if(a[i] === a[j])
                    a.splice(j--, 1);
            }
        }

        return a;
    }
});

var dpe = (function(){
    "use strict";

    // Private functions.
    var self = this,
        config = {
            linepadding : 20,
            wordspacing : 10,
            poemspacing : 100,
            animationduration : 1000,
        },
        // Flanagan.
        wordClasses1 = ['NN', 'DT', 'IN', 'NNP', 'JJ', 'NNS', 'PRP', 'VBZ', 'RB', 'VBP', 'VB', 'CC', 'PRP$', 'TO', 'VBD', 'VBN', 'VBG', 'WRB', 'MD', 'CD', 'WP', 'EX', 'RP', 'JJR', 'WDT', 'JJS', 'RBR', 'WP$'],
        // Dickinson.
        wordClasses2 = ['NN', 'NNP', 'PRP', 'CC', 'VBP', 'DT', 'IN', 'JJ', 'NNS', 'PRP$', 'TO', 'VB', 'VBN', 'VBZ', 'RB', 'VBD', 'CD', 'EX', 'MD', 'RP', 'VBG'],
        // Combined
        wordClasses = wordClasses1.concat(wordClasses2).unique(),
        // wordClasses = ["NNP", "NN", "VBP" ],
        paper = {},
        source = {},
        target = {},
        bucketindex = 0,
        wcindex = 0,
        cursor = [0, 0],
        diffX = 0,
        diffY = 0,
        numtransitions = 0,
        swapaftertransition = false,
        swapped = false,
        stopped = false,

        loadPoem = function( source, onLoadCallback ){

            var xhr=new XMLHttpRequest();
            xhr.onload = onLoadCallback;
            xhr.open("GET", source, false);
            xhr.send();

        },

        setDebug = function(key, message){
            var el = document.querySelector('.debug__'+key);
            el.innerText = message;
        },

        init = function( poem1, poem2 ){

            var td, sd, canvasHeight, canvasWidth;

            setDebug('default-word-classes', wordClasses.join(', '));

            paper = Raphael("poem", "100%", 1000),

            loadPoem( poem1, function(){
                target = new Poem(this.responseXML, 0);
                td = target.getdimensions();
                loadPoem( poem2, function(){
                    source = new Poem(this.responseXML, td.width+config.poemspacing);
                    sd = source.getdimensions();
                    canvasHeight = Math.max(sd.height, td.height);
                    canvasWidth = td.width+(config.poemspacing*2)+sd.width;
                    paper.setSize(canvasWidth, canvasHeight);
                });
            });

        },

        stop = function(){
            stopped = true;
        },

        start = function(){

            var customWordClasses = document.querySelector('input[name="wordClasses"]').value,
                swapBehaviourCheckbox = document.querySelector('input[name="swapBehaviour"]');

            setDebug('direction', "TARGET<<<<<<SOURCE");
            setDebug('default-word-classes', wordClasses.join(', '));

            if(customWordClasses !== ""){
                wordClasses = customWordClasses.split(',');
                // Trim and remove empties.
                wordClasses = wordClasses.map(function(str){ return str.trim();});
                wordClasses = wordClasses.filter(function(str){ return str || false; });
            }
            swapaftertransition = swapBehaviourCheckbox.checked;
            console.log(swapaftertransition);
            setDebug('custom-word-classes', wordClasses.join(', '));

            next();

        };

    // Poem class
    var Poem = function( doc, startX ){

        var lines, yPos = 0,
            paths = [], bucket = {},
            lines = doc.getElementsByTagName('line'),
            cursor = [-1,0],
            bucketindex = 0,
            dimensions = { width:0, height:0 },

            // Next word to be changed/morphed.
            nexttarget = function( wordclass ){

                var found = false;

                // if( gettarget() ){
                //     var tg = gettarget();
                //     console.log(tg.data('text'), tg.getBBox().width);
                // }

                // Increment line.
                cursor[0]++;

                // Loop lines.
                for (var i = cursor[0]; i < paths.length; i++) {
                    // Break if new word has been found.
                    if(found){
                        break;
                    }
                    // Loop words in line.
                    for (var j = 0; j < paths[i].length; j++) {
                        // Target path is word to be changed.
                        var targetpath = paths[i][j];
                        // console.log(targetpath.data("text"),
                        //             targetpath.data("tagClass"), targetpath, i, j);
                        if( targetpath.data('tagClass')
                                && targetpath.data('tagClass') == wordclass
                                && targetpath.data("transformed") != true  ){
                            cursor = [i,j];
                            found = true;
                            break;
                        }
                    }
                }

                if(!found){
                    cursor = [paths.length, 0];
                }

                return targetpath;

            },

            gettarget = function(){

                // No more lines.
                if( cursor[0] < 0 || cursor[0] >= paths.length ){
                    return false;
                }

                var lineindex = cursor[0],
                    wordindex = cursor[1];

                return paths[lineindex][wordindex] || false;

            },

            nextsource = function(){

                bucketindex++;

            },

            getsource = function( wordclass ){

                if( ! bucket[wordclass] || bucketindex >= bucket[wordclass].length-1 ){
                    console.log("No more bucket", wordclass, bucket);
                    return false;
                }

                if( bucket[wordclass][bucketindex].data("transformed") == true ){
                    console.log("Already transformed");
                    nextsource();
                    return getsource(wordclass);
                }

                return bucket[wordclass][bucketindex] || false;
            },


            resetbucket = function(){

                bucketindex = 0;
            },

            resetlines = function(){

                cursor[0] = -1;

            },

            transitionwords = function( diffX ){

                var lineindex = cursor[0], wordindex = cursor[1],
                    currDiffX = 0;


                for (var j = wordindex+1; j < paths[lineindex].length; j++) {
                    // Target path is word to be changed.
                    var targetpath = paths[lineindex][j];
                    currDiffX = diffX + (targetpath.data("currDiffX") || 0);

                    // Animate using css transitions instead of svg animation.
                    targetpath.node.style["-webkit-transition"] = "all " + config.animationduration+"ms linear";
                    targetpath.node.style["transition"] = "all " + config.animationduration+"ms linear";
                    targetpath.node.style["-webkit-transform"] = "translate("+currDiffX+"px)";
                    targetpath.node.style["transform"] = "translate("+currDiffX+"px)";

                    targetpath.data("currDiffX", currDiffX);

                }
                // targetpath.data("currDiffX", diffX);


            },

            replacewords = function( diffX ){

                return;
                var lineindex = cursor[0], wordindex = cursor[1];

                for (var j = wordindex+1; j < paths[lineindex].length; j++) {
                    // Target path is word to be changed.
                    var targetpath = paths[lineindex][j];
                    // Reverse CSS translate.
                    targetpath.node.style["-webkit-transition"] = "";
                    targetpath.node.style["transition"] = "";
                    targetpath.node.style["-webkit-transform"] = "none";
                    targetpath.node.style["transform"] = "none";

                    // var newpath = Raphael.transformPath(targetpath.attr("path"), "t"+diffX+",0");
                    targetpath.transform("t"+diffX+",0");
                    // targetpath.animate({ path: newpath }, config.animationduration, "linear");
                    // targetpath.animate({ transform: "t"+diffX+",0"}, 1000);
                }

            },

            render = function(){
                // Loop through lines.
                for (var i = 0; i < lines.length; i++) {

                    var original = lines[i].getElementsByTagName('original')[0].textContent,
                        tags = lines[i].getElementsByTagName('tag'),
                        tag, path, tagtext, precedingtext, precedingpath,
                        nextStrIndex, currStr,
                        xPos = startX,
                        bbox = {};

                    paths[i] = [];

                    // Break line into segments on each tag.
                    for (var j = 0; j < tags.length; j++) {
                        // hide = false;
                        tagtext = tags[j].textContent;
                        precedingtext = "";

                        // Search for next word.
                        // Does string fully match next word.
                        // If so render.
                        // if not render split on word and render text beforehand first.

                        nextStrIndex = original.indexOf( tagtext );
                        currStr = original.substring(0, nextStrIndex + tagtext.length);
                        tag = tags[j].getAttribute('class');
                        // console.log("currStr", currStr, "("+currStr.length+")", tagtext, "("+tagtext.length+")");


                        // TODO - Trim start spaces for the moment. Address preceding whitespace later.
                        if(j===0){
                            // console.log(currStr, currStr.match(/^\s+/));
                            // currStr = currStr.replace(/^\s+/, '');
                        }

                        // If this string contains next tag plus preceding text...
                        // console.log(currStr, tagtext, currStr.trim() !==tagtext, currStr.length, tagtext.length);
                        if(currStr.trim() !== tagtext){

                            precedingtext = currStr.replace(tagtext, "");
                            // console.log("PRECEDING", precedingtext);
                            precedingpath = paper.print(
                                                xPos, yPos+50,
                                                precedingtext,
                                                paper.getFont("Fenix"), 20, 'baseline'
                                            );

                            bbox = precedingpath.getBBox();
                            xPos = bbox.x + bbox.width + config.wordspacing;
                            paths[i].push(precedingpath);

                        } else if(j !== 0){
                            xPos += config.wordspacing;
                        }

                        path = paper.print(
                                        xPos, yPos+50,
                                        tagtext,
                                        paper.getFont("Fenix"), 20, 'baseline'
                                    );

                        // Remove everything up to this point.
                        original = original.slice( nextStrIndex+tagtext.length );

                        // Data for replacement.
                        path.data('yPos', yPos+50);
                        path.data('tagClass', tag);
                        path.data('text', tagtext);
                        bucket[tag] = bucket[tag] || [];
                        bucket[tag].push(path);

                        // Increase xposition and add xspacing.
                        bbox = path.getBBox();
                        xPos = bbox.x + bbox.width;
                        dimensions.width = xPos-startX>dimensions.width ? xPos-startX : dimensions.width;

                        // if( hide == true ){
                        //     // path.hide();
                        // }

                        paths[i].push(path);
                    };

                    // Remainder of the string if there is any.
                    if( original.length > 0 && tags.length > 0 ){
                        path = paper.print(
                                            xPos, yPos+50,
                                            original.substring(0),
                                            paper.getFont("Fenix"), 20, 'baseline');
                        // Data for replacement.
                        path.data('yPos', yPos+50);
                        path.data('text', original.substring(0));
                        dimensions.width = xPos-startX>dimensions.width ? xPos-startX : dimensions.width;
                        paths[i].push(path);
                    }

                    if( tags.length === 0 ){
                        // Empty line.
                        yPos += config.linepadding;
                    } else {
                        yPos += paths[i][0].getBBox(true).height+config.linepadding;
                    }
                    dimensions.height = yPos+50;

                };
            };


        render();

        return {
            getdimensions : function(){ return dimensions },
            getpaths    : function(){ return paths },
            bucket      : function(){ return bucket },
            getcursor   : function(){ return cursor },
            bucketindex : bucketindex,
            nexttarget  : nexttarget,
            gettarget   : gettarget,
            nextsource  : nextsource,
            getsource   : getsource,
            transitionwords : transitionwords,
            replacewords : replacewords,
            resetlines  : resetlines,
            resetbucket : resetbucket
        };

    }; // End Poem()

    var next = function(){

        var wc = wordClasses[wcindex],
            s, t;

        if(stopped)
            return;

        setDebug('current-class', wc);
        target.nexttarget(wc);

        s = source.getsource(wc);
        t = target.gettarget();

        console.log("Current word class ", wordClasses[wcindex]);
        console.log("Line/Word          ", target.getcursor()[0],target.getcursor()[1]);
        console.log("Target             ", !!t,
                    (t!=false)?t.data("text"):"");
        console.log("Source             ", !!s,
                    (s!==false)?s.data("text"):"");

        // if we:
        // 1. reach the end of the target lines
        // 2. reach the end of the source bucket.
        if( ! t || ! s ){

            console.log(">>>>>> NEXT word class: "+ wordClasses[wcindex+1]);
            // Next word class.
            wcindex++;
            // Reset line.
            target.resetlines();
            // Reset bucket.
            source.resetbucket();
            if( wcindex >= wordClasses.length ){
                if( !swapaftertransition && swapped == false ){
                    // console.log("Finished. No swap.");
                    // return;
                    console.log(">>>>>> swap poems <<<<<<");
                    swapped = true;
                    setDebug('direction', "SOURCE>>>>>>TARGET");
                    wcindex = 0;
                    swap();
                    next();
                } else {
                    setDebug('direction', ">>>>>>FINISHED<<<<<<");
                    console.log("Finished.");
                }
            } else {
                next();
            }

        } else {
            setDebug('target-word', t.data('text'));
            setDebug('source-word', s.data('text'));
            console.log("^^^^^^^FOUND^^^^^^^^^");
            transform();
        }

    };

    var swap = function(){

        var tmptarget = target;

        target = source;
        source = tmptarget;

        if(numtransitions%2===0){
            setDebug('direction', "TARGET<<<<<<SOURCE");
        } else {
            setDebug('direction', "SOURCE>>>>>>TARGET");
        }

    };

    var completeHandler = function(){

        // Reset diff.
        diffX = 0;

        // Increment to next available word in bucket.
        source.nextsource();

        numtransitions++;
        setDebug('num-transitions', numtransitions);

        if(swapaftertransition){
            console.log(">>>>>> swap poems <<<<<<");
            swap();
        }

        // Pause for ms and then next.
        setTimeout( next, 500 );

        console.log("+++++++++++++++++++++++++++");

    };


    var transform = function() {

        var wc = wordClasses[wcindex],
            srcBBox = {}, tgBBox = {};

        // Target path is word to be changed.
        var targetpath = target.gettarget();
        tgBBox = targetpath.getBBox();

        // A target word has been found.
        var sourcepath = source.getsource(wc); 
        srcBBox = sourcepath.getBBox();

        // Get difference in width in case the sucessive
        // words in sentence need to be moved.
        diffX = srcBBox.width - tgBBox.width;
        diffY = srcBBox.height -tgBBox.height;

        // Transform target and TODO add callback.
        transformTarget( targetpath, sourcepath, function(){
            console.log("complete");
            // When transition is complete move words using svg
            // transform instead of css translate/transition.
            target.replacewords( diffX );
            completeHandler();
        });

        // Indicate the choosen source somehow. Glow or animate.
        var glow = sourcepath.glow({color: "#fff000"});
        setTimeout(function(glow){
            glow.remove();
        }, config.animationduration, glow);

        // Move rest of line.
        if( diffX !== 0 ){
            // diffX -= config.wordspacing;
            target.transitionwords(diffX);
        }

    };

    var transformTarget = function( targetpath, sourcepath, completeCallback ){

        // Get path of word (sourcepath) with same wordClass.
        var bbox = targetpath.getBBox(),
            newtext = sourcepath.data('text'),
            newpath = {};

        if( newtext.trim() == ""){
            // TODO - Why does this have no string?
            return;
        }

        // Create new path at same location as target word.
        // From this we can get the vector path to transform
        // the target word.
        newpath = paper.print(
                    bbox.x, targetpath.data("yPos"),
                    newtext,
                    paper.getFont("Fenix"), 20, 'baseline');

        // Animate targetpath path to newpath (based on sourcepath).
        targetpath.animate({ path: newpath.attr('path')},
                            config.animationduration,
                            "linear",
                            completeCallback );

        targetpath.data("transformed", true);

        // Remove new path (was just used as reference).
        newpath.remove();

    };

    return {
        init : init,
        start : start,
        stop : stop,
        next : next
    };

}());

