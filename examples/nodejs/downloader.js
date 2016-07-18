var fs = require('fs');
var http = require('http');
var url = require('url');
var querystring = require('querystring');

/*
	* Function for print error in console and in page.
	*
	* @param {String} message : Error who is display in shell.
	* @param {http.ServerResponse} res
*/

var printError = function(message, res) {
	res.writeHead(200, {"Content-Type": "text/plain"});
	res.write("-1");
	res.end();
	console.log(message);
}

/*
	* Function for get path to file.
	*
	* @param {Object} conf : List of file can be downloaded.
	* @param {String} file : File downloaded.
	* @return {String} filename.
*/

var getFilePath = function(conf, file) {
	var filename = '';
	for(var alias in conf) {
		if(alias == file) {
			filename = conf[alias];
			break;
		}
	}
	return filename;	
}

/*
	* Function for download file by parts.
	*
	* @param {Object} conf : List of file can be downloaded.
	* @param {String} file : File downloaded.
	* @param {Int} file : Part's size who is downloaded.
	* @param {Int} Index : Position of starting part.
	* @param {http.ServerResponse} res
*/

var getDatas = function(filename, formdata, size, index, res,req) {

	var position = parseInt(index);
	var blockSize = parseInt(size);
	if(fs.existsSync(filename)) {
		if(position <= fs.statSync(filename).size) {
			if(blockSize == 0) {
				res.writeHead(200, {"Content-Type": "text/plain"});
				res.write("");
				res.end();
			} else if(size > -1) {

				var sizeBuff = blockSize+1;
				if(fs.statSync(filename).size <= blockSize+position) {
					sizeBuff = fs.statSync(filename).size-position;
				}
				var buff = new Buffer(sizeBuff);
				var fd = fs.openSync(filename, "r");
				//Read file.
				fs.readSync(fd, buff, 0, sizeBuff, position);
				fs.closeSync(fd);
				var cookie = "downloadToken=" + formdata["downloadToken"]
				res.writeHead(200, {"Content-Type": "application/zip;text/plain",
									"Content-Disposition":"attachment; filename=test.zip",
									"Content-Length":blockSize,
									'Set-Cookie': cookie // 向客户端设置一个Cookie

				});
				res.write(buff.toString());
				res.end();
			} else {
				printError("Error - size must be greater than -1.",res);
			}
		} else {
			printError("Error - index must be lowest than file\'s size.",res);
		}
	} else {
		printError("Error - ' + filename + ' file does not exist.",res);
	}
}

/*
	* Function for print file's size in web page.
	*
	* @param {Object} conf : List of file can be downloaded.
	* @param {String} file : File downloaded.
	* @param {http.ServerResponse} res
*/

var infoFile = function(conf, file, res) {
	var filename = getFilePath(conf, file);
	//Print file's size.
	if(fs.existsSync(filename)) {
		res.writeHead(200, {"Content-Type": "text/plain"});
		res.write(String(fs.statSync(filename).size));
		res.end();
	} else {
		res.writeHead(200, {"Content-Type": "text/plain"});
		res.write("-1");
		res.end();
		console.log('Error - ' + filename + ' file does not exist.');
	}
}


/*
	* Function for run action.
	*
	* @param {Object} files : list of files can be downloaded.
	* @param {http.IncomingMessage} req
	* @param {http.ServerResponse} res
*/

var manageRequest = function( req, res,conf,formdata) {
	var params = querystring.parse(url.parse(req.url).query);	
	if('type' in params) {
		switch(params['type']) {
			//Get file's size.
			case 'size':
				if('file' in params) {
					infoFile(conf, params['file'], res);
				} else {
					printError("Error - Size request without file.",res);
				}
				break;
			//Download file.
			case 'download':
				    var filename = params['file'];
					var filepath = getFilePath(conf, filename);
					var filesize = String(fs.statSync(filepath).size);
					getDatas(filepath, formdata, filesize, 0, res, req);
				break;
			default:
				printError("Error - Unknow type.",res);
		}
	}
}

/*
	* Function for run server app.
	*
	* @param {Object} files : list of files can be downloaded.
	* @param {http.IncomingMessage} req
	* @param {http.ServerResponse} res
*/

var run = function(req, res,files, formdata) {
		if(typeof files == 'object') {
			manageRequest( req, res, files,formdata);
		} else {
			printError("Error - You must put object in parameter.",res);
		}
}

exports.run = run;
