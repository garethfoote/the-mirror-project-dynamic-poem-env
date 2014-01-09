var app = (function(){
    "use strict";

    // Private functions.
    var self = this,
        config = {
            linePadding : 30,
            wordSpacing : 10
        },
        wordClasses = ["NNP", "NN", "VBP" ],
        // wordClasses = ["JJ" ],
        fixtures = {
            'NN' : [ 'Rock', 'Sea', 'thee', 'Angry', 'power', 'From', 'age', 'Scarred', 'frost']
        },
        paper = {},
        source = {},
        target = {},
        bucketindex = 0,
        wcindex = 0,
        cursor = [0, 0],
        diffX = 0,
        diffY = 0,
        swapped = false,

        loadPoem = function( source, onLoadCallback ){

            var xhr=new XMLHttpRequest();
            xhr.onload = onLoadCallback;
            xhr.open("GET", source, false);
            xhr.send();

        },

        init = function(){

            paper = Raphael("poem", 900, 1600),

            loadPoem( "dickinson/the-sea.xml", function(){
                target = new Poem(this.responseXML, 0);

            });

            loadPoem( "dickinson/the-rock.xml", function(){
                source = new Poem(this.responseXML, 450);
            });

        };

    // Poem class
    var Poem = function( doc, startX ){

        var lines, yPos = 0,
            paths = [], bucket = {},
            lines = doc.getElementsByTagName('line'),
            cursor = [0,0],
            bucketindex = 0,

            nexttarget = function( wordclass ){

                var found = false;

                if( gettarget() ){
                    var tg = gettarget();
                    console.log(tg.data('text'), tg.getBBox().width);
                }

                // Loop lines.
                for (var i = cursor[0]+1; i < paths.length; i++) {
                    // Break if new word has been found.
                    if(found){
                        break;
                    }
                    // Loop words in line.
                    for (var j = 0; j < paths[i].length; j++) {
                        // Target path is word to be changed.
                        var targetpath = paths[i][j];
                        if( targetpath.data('tagClass') == wordclass ){
                            cursor = [i,j];
                            found = true;
                            break;
                        }
                    }
                }

                return targetpath;

            },

            gettarget = function(){

                // No more lines.
                if( cursor[0] >= paths.length-1 ){
                    return false;
                }

                var lineindex = cursor[0],
                    wordindex = cursor[1];

                return paths[lineindex][wordindex];

            },

            nextsource = function(){

                bucketindex++;

            },

            getsource = function( wordclass ){

                if( ! bucket[wordclass] || bucketindex >= bucket[wordclass].length ){
                    return false;
                }

                if( bucket[wordclass][bucketindex].data("transformed") == true ){
                    console.log("Already transformed");
                    nextsource();
                }

                return bucket[wordclass][bucketindex];
            },

            resetbucket = function(){

                bucketindex = 0;

            },

            resetlines = function(){

                cursor[0] = 0;

            },

            // Shift remaining words in line.
            shiftwords = function( diffX ){

                var lineindex = cursor[0], wordindex = cursor[1];

                for (var j = wordindex+1; j < paths[lineindex].length; j++) {
                    // Target path is word to be changed.
                    var targetpath = paths[lineindex][j];
                    // If diff has been set then the successive
                    // words need to be moved by diffX amount.
                    var newpath = Raphael.transformPath(targetpath.attr("path"), "t"+diffX+",0");
                    targetpath.animate({ path: newpath},
                                        1000,
                                        "linear");

                    // targetpath.animate({transform: "t"+diffX+",0"}, 1000);
                    // targetpath.transform("T"+diffX+",0");
                }

            },

            render = function(){
                // Loop through lines.
                for (var i = 0; i < lines.length; i++) {

                    var original = lines[i].getElementsByTagName('original')[0].textContent,
                        tags = lines[i].getElementsByTagName('tag'),
                        tag, path,
                        nextStrIndex, xPos = startX, currStr, hide;

                    paths[i] = [];

                    // Break line into segments on each tag.
                    for (var j = 0; j < tags.length; j++) {
                        hide = false;

                        // TODO - Explain?
                        tag = j>0 ? tags[j-1].getAttribute('class') : "-";

                        nextStrIndex = original.indexOf( tags[j].textContent );
                        currStr = original.substring(0, nextStrIndex);
                        // console.log(currStr);

                        // TODO - Accomodate for spaces and tabs.
                        if( currStr === " "){
                            // console.log("SPACE");
                            // currStr = "a";
                            hide = true;
                        }
                        if( /\t/.test(currStr) ){
                            // console.log("TAB");
                            // currStr = "ww";
                            hide = true;
                        }

                        path = paper.print(
                                        xPos, yPos+50,
                                        currStr,
                                        paper.getFont("Fenix"), 20, 'baseline'
                                    );

                        // Remove everything up to this point.
                        original = original.slice( nextStrIndex );

                        // Data for replacement.
                        path.data('yPos', yPos+50);
                        path.data('tagClass', tag);
                        path.data('text', currStr);
                        bucket[tag] = bucket[tag] || [];
                        bucket[tag].push(path);

                        // Increase xposition and add xspacing.
                        xPos += path.getBBox().width + config.wordSpacing;

                        if( hide == true ){
                            // path.hide();
                        }

                        paths[i][j] = path;
                    };

                    // Remainder of the string if there is any.
                    if( original.length > 0 && tags.length > 0 ){
                        tag = tags[j-1].getAttribute('class');
                        path = paper.print(
                                            xPos, yPos+50,
                                            original.substring(0),
                                            paper.getFont("Fenix"), 20, 'baseline');
                        // Data for replacement.
                        path.data('yPos', yPos+50);
                        path.data('tagClass', tag);
                        path.data('text', original.substring(0));
                        bucket[tag] = bucket[tag] || [];
                        bucket[tag].push(path);
                        paths[i][j] = path;
                    }

                    if( tags.length === 0 ){
                        yPos += config.linePadding;
                    } else {
                        yPos += paths[i][0].getBBox(true).height+config.linePadding;
                    }

                };
            };


        render();

        return {
            getpaths    : function(){ return paths },
            bucket      : bucket,
            getcursor   : function(){ return cursor },
            bucketindex : bucketindex,
            nexttarget  : nexttarget,
            gettarget   : gettarget,
            nextsource  : nextsource,
            getsource   : getsource,
            shiftwords  : shiftwords,
            resetlines  : resetlines,
            resetbucket : resetbucket
        };

    }; // End Poem()


    var next = function(){

        var wc = wordClasses[wcindex];

        var paths = target.getpaths(),
            bosom = paths[4][3];

        // console.log("Bosom", bosom.getBBox().x);

        target.nexttarget(wc);

        console.log("Line", target.getcursor()[0], "Word", target.getcursor()[1],
                "Target", !!target.gettarget(), "Source", !! source.getsource(wc));

        // Increment word class if we:
        // 1. reach the end of the target lines
        // 2. we reach the end of the source bucket.
        if( ! target.gettarget()
                || ! source.getsource(wc) ){

            console.log("Next word class: "+ wordClasses[wcindex+1]);
            // Next word class.
            wcindex++;
            // Reset line.
            target.resetlines();
            // Reset bucket.
            source.resetbucket();
            if( wcindex >= wordClasses.length ){
                if( swapped == false ){
                    console.log("Swap poems.");
                    swapped = true;
                    wcindex = 0;
                    swap();
                    next();
                } else {
                    console.log("Finished.");
                }
            } else {
                next();
            }

        } else {
            transform();
        }

    };

    var completeHandler = function(){

        // Reset diff.
        diffX = 0;
        // TODO - Not sure this is the best method. 
        // Discuss with Mary.
        // Increment to next available word in bucket.
        source.nextsource();

        // swap();

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
        console.log("Source", sourcepath.data("text"));

        // Get difference in width in case the sucessive
        // words in sentence need to be moved.
        diffX = srcBBox.width - tgBBox.width;
        diffY = srcBBox.height -tgBBox.height;
        // console.log("DiffX", diffX);
        // console.log("DiffY", diffY);

        // Transform target and TODO add callback.
        transformTarget( targetpath, sourcepath, completeHandler);

        // Indicate the choosen source somehow. Glow or animate.
        var glow = sourcepath.glow({color: "#fff000"});
        setTimeout(function(glow){
            glow.remove();
        }, 1000, glow);

        // Move rest of line.
        if( diffX !== 0 ){
            // diffX -= config.wordSpacing;
            target.shiftwords(diffX);
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
                    bbox.x, bbox.y+bbox.height,
                    newtext,
                    paper.getFont("Fenix"), 20, 'baseline');

        // Animate targetpath path to newpath (based on sourcepath).
        targetpath.animate({ path: newpath.attr('path')},
                            1000,
                            "linear",
                            completeCallback );

        targetpath.data("transformed", true);

        // Remove new path (was just used as reference).
        newpath.remove();

    };

    var swap = function(){

        var tmptarget = target;

        target = source;
        source = tmptarget;

    };

    return {
        init : init,
        next : next
    };

}());


window.onload = function () {

    app.init();

    startBtn = document.querySelector('.start');
    startBtn.onclick = app.next;

};
