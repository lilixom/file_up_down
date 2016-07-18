var http = require("http");
var url = require("url");
var fs = require("fs");
var Downloader = require("./downloader");
var qs = require('querystring');

var server = http.createServer(function(req, res) {
    var url_parts = url.parse(req.url, true);

    var files = {
        "test": "./examples/nodejs/test"
    };
    var body = '';
    if (req.method === 'POST') {
        req.on('data', function(data) {
            body += data;
        });
        req.on('end', function() {
            var formdata = qs.parse(body);
            Downloader.run(req, res, files, formdata);
        });
    } else {
        console.log('Request found with GET method');
        req.on('data', function(data) {
            res.end(' data event: ' + data);
        });

        if (url_parts.pathname == '/')
            fs.readFile('./examples/nodejs/index.html', function(error, data) {
                res.end(data);
            });
        else if (url_parts.pathname == '/getData') {
            Downloader.run(files, req, res, null);
        } else {
            fs.readFile('./examples/nodejs' + url_parts.pathname, function(error, data) {
                res.end(data);
            });
        }
    }
});
console.log("start");
server.listen(8089);