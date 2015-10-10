exports.Backup = require('./backup');

exports.init = function(server, configuration, callback){
  exports.Backup.attach(server, configuration);
  callback(null);
}
