var async = require('async');

exports.Endpoints = require('./endpoints');
exports.Model = require('./model');

exports.init = function(s, c, cb){
  var server = s;
  var config = c;
  var initCallback = cb;
  async.waterfall([
    function(callback){
      exports.Model.init(config, callback);
    },
    function(callback){
      exports.Endpoints.init(server, config, callback);
    }
  ], function(err, result){
    initCallback(err);
  });
}
