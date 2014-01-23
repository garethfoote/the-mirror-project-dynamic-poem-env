var express = require('express'),
    app = express(),
    hbs = require('hbs'),
    https = require('https'),
    fs = require('fs'),
    Q = require('q');


var server = app.listen(process.env.PORT || 5000);
var io = require('socket.io').listen(server);

// Configuration.
app.set('view engine', 'html');
app.engine('html', hbs.__express);
app.use(express.urlencoded());
app.use(express.json());
app.use(express.static('public'));

var config = {
    datadir : "./public/data"
};

// Helpers
function handlepartials( headpartial, footpartial ){

    hbs.registerPartial('header', (!headpartial) ? '' : getviewfs(headpartial));
    hbs.registerPartial('foot', (!footpartial) ? '' : getviewfs(footpartial));

}

function getviewfs( filename ){
    return fs.readFileSync(__dirname + '/views/'+filename+'.html', 'utf8')
}

function walk(dir, done) {
    var results = [];
    fs.readdir(dir, function(err, list) {
        if (err) return done(err);
        var i = 0;
        (function next() {
            var file = list[i++];
            if (!file) return done(null, results);
            file = dir + '/' + file;
            fs.stat(file, function(err, stat) {
                if (stat && stat.isDirectory()) {
                    walk(file, function(err, res) {
                        results = results.concat(res);
                        next();
                    });
                } else {
                    results.push(file);
                    next();
                }
            });
        })();
    });
};

// Routes.
app.get('/', function(req, response){

    /*
    var file1 = req.params.file1,
        file2 = req.params.file2;
        */

    handlepartials( "choose-head", "choose-foot" );

    walk(config.datadir, function(err, results){
        if (err) throw err;
        var paths = [];
        results.forEach(function(path){
            var pieces = path.split("/");
            paths.push({
                filename : pieces.slice(-1).join(),
                directory : pieces.slice(-2, -1).join(),
                fullpath : path
            });
        });

        response.render('choose', { files : paths });
    });

});

app.get('/go/:dir1/:file1/:dir2/:file2', function(req, response){

    var p = req.params,
        file1 = "data/"+p.dir1 + "/" + p.file1,
        file2 = "data/"+p.dir2 + "/" + p.file2;

    handlepartials( "go-head", "go-foot" );
    response.render('go', { file1 : file1, file2 : file2 });

});

// sockets
io.sockets.on('connection', function (socket) {

    /*
    socket.on('tags', function (data) {
        console.log("Update tags: " + data.id);

        var tags = [];
        data.tags.split(",").forEach(function(tag){
            console.log(tag.trim(),tag.trim().match(/^[a-zA-Z0-9_]*$/));
            if( tag.trim() && tag.trim().match(/^[a-zA-Z0-9_]*$/)){
                tags.push(tag.trim());
            }
        });

        if( tags.length ){
            igramcollection.update({ id : data.id },
                    { $set: { custom_tags : tags }},
                    function(err, items){
                        console.log("Tags updated.", err, items);
                    });
        }

    });
    */

});
