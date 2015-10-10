var appName = 'smartcopy-manager';
var path = require('path');
var fs = require('fs');
var bunyan = require('bunyan');
var env = process.env.NODE_ENV || 'development';
var port = process.env.PORT || 3000;
var restify = require('restify');

var configData = fs.readFileSync(__dirname +
  "/configuration." + env + ".json", 'utf8');
var config = JSON.parse(configData);
config.log = bunyan.createLogger({
  name: 'smartcopy',
  serializers: bunyan.stdSerializers,
  stream: process.stdout,
  level: "info"
});
config.dbPath = [config.dbFolder, config.dbFile].join(path.sep);

var server = restify.createServer({
  name: appName,
  version: '0.0.1',
  log: config.log
});

server.pre(restify.pre.sanitizePath());
server.use(restify.queryParser());
server.use(restify.bodyParser());

var lib = require('./lib');
lib.init(server, config, function(err){
	if ( err ){
		throw err;
	}
	server.listen(port, function(e){
		if ( e != null ){
			server.log.info('Unable to listen', e);
		}else{
			server.log.info('Server listening on', port);
		}
	});
});
