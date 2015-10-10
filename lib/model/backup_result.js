var Store = require('./store');
var util = require('util');
var KvObject = require('./kv_object');
var validKeyList = [
  'uuid',
  'vmUuid',
  'alias',
  'snapshots',
  'errors',
];

function BackupResult(options){
  KvObject.call(this, options);
}

BackupResult.bucket = 'backupResults';

Object.keys(KvObject.staticFunctions).forEach(function (key) {
  BackupResult[key] = KvObject.staticFunctions[key];
});

util.inherits(BackupResult, KvObject);

BackupResult.validKeys = function(){
  return validKeyList;
}

BackupResult.prototype.key = function(){
  return this.uuid;
}

module.exports = BackupResult;
