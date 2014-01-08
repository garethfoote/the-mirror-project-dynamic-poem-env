var config = {
    linePadding : 30,
    wordSpacing : 10
};

var fixtures = {
    'NN' : [ 'Rock', 'Sea', 'thee', 'Angry', 'power', 'From', 'age', 'Scarred', 'frost']
};

function renderPoem( doc, paper, poem, bucket, startX ){

    var lines, yPos = 0;

    lines = doc.getElementsByTagName('line');

    for (var i = 0; i < lines.length; i++) {
        var original = lines[i].getElementsByTagName('original')[0].textContent,
            tags = lines[i].getElementsByTagName('tag'),
            tag, path,
            nextStrIndex, xPos = startX, currStr, hide;

        poem[i] = [];

        // Break line into segments on each tag.
        for (var j = 0; j < tags.length; j++) {
            hide = false;

            tag = j>0 ? tags[j-1].getAttribute('class') : "-";

            nextStrIndex = original.indexOf( tags[j].textContent );
            currStr = original.substring(0, nextStrIndex);

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

            poem[i][j] = path;
        };

        // Remainder of the string if there is any.
        if( original.length > 0 && tags.length > 0 ){
            tag = tags[j-1].getAttribute('class');
            poem[i][j] = paper.print(
                                xPos, yPos+50,
                                original.substring(0),
                                paper.getFont("Fenix"), 20, 'baseline');
            // Data for replacement.
            path.data('yPos', yPos+50);
            path.data('tagClass', tag);
            path.data('text', original.substring(0));
            bucket[tag] = bucket[tag] || [];
            bucket[tag].push(path);
        }

        if( tags.length === 0 ){
            yPos += config.linePadding;
        } else {
            yPos += poem[i][0].getBBox(true).height+config.linePadding;
        }

    };
}



window.onload = function () {
    var paper = Raphael("poem", 900, 600),
        poem1 = [], poem1Bucket = {},
        poem2 = [], poem2Bucket = {},
        startBtn = document.querySelector('.start');

    paper.setViewBox(0, 0, 900, 600);

    startBtn.onclick = function(){

        var find = document.getElementById("word-class").value,
            bucketIndex = 0,
            pause = 500, diffX;

        if( find == "" ){
            find = "NNP";
        }

        // Loop lines.
        for (var i = 0; i < poem1.length; i++) {
            diffX = 0;
            // Loop words.
            for (var j = 0; j < poem1[i].length; j++) {
                var path = poem1[i][j];

                if( diffX !== 0 ){

                    // If diff has been set then the successive
                    // words need to be moved by diffX amount.
                    path.animate({transform: "t"+diffX+",0"}, 1000);
                    // path.transform("T"+diffX+",0");

                } else if( path.data('tagClass') == find ){

                    var bbox = path.getBBox(),
                        newtext = poem2Bucket[find][bucketIndex].data('text'),
                        newpath = {}, diffX = 0;

                    if( newtext.trim() == ""){
                        // TODO - Why does this have no string?
                        return;
                    }

                    // Create new path at same location as word to be replaced.
                    newpath = paper.print(
                                bbox.x, bbox.y+bbox.height,
                                newtext,
                                paper.getFont("Fenix"), 20, 'baseline');
                    // Get difference in width.
                    diffX = newpath.getBBox().width - bbox.width;

                    // Animate old word path to new.
                    path.animate({ path: newpath.attr('path')}, 1000 );

                    // Remove.
                    newpath.remove();

                    // TODO - Not sure this is the best method. 
                    // Discuss with Mary.
                    bucketIndex++;

                }
            };
        };

    };

    /*
    var letters = paper.print(100, 100, "POETRYROCKS", paper.getFont("Fenix"), 40, 'baseline');
    letters.attr({fill:"orange"});
    letters.animate({transform: "t100,100"}, 1000, "<>");
    */

    xhr=new XMLHttpRequest();
    xhr.onload = function(){
        renderPoem( this.responseXML, paper, poem1, poem1Bucket, 0 );
    };
    xhr.open("GET","dickinson/the-sea.xml", false);
    xhr.send();

    xhr=new XMLHttpRequest();
    xhr.onload = function(){
        renderPoem( this.responseXML, paper, poem2, poem2Bucket, 450 );
    };
    xhr.open("GET","dickinson/the-rock.xml", false);
    xhr.send();

};
