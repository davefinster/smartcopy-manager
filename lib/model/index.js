var store = require('./store');

exports.init = function(c, cb){
  var config = c;
  store.setConfig(config);
  exports.Vm = require('./vm');
  exports.BackupResult = require('./backup_result');
  var notifications = require('./notification');
  notifications.setEmailSettings(config);
  exports.Notification = notifications;
  cb(null);
}
