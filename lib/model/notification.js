var Store = require('./store');
var util = require('util');
var KvObject = require('./kv_object');
var Backup = require('./backup_result');
var emailSettings = null;
var validKeyList = [
  'uuid',
  'timestamp',
  'backups',
  'success'
];
var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');

function Notification(options){
  KvObject.call(this, options);
  if ( this.backups != null ){
    this.backups = [];
  }
  this.backupObjects = null;
}

Notification.bucket = 'notifications';

Object.keys(KvObject.staticFunctions).forEach(function (key) {
  Notification[key] = KvObject.staticFunctions[key];
});

util.inherits(Notification, KvObject);

Notification.setEmailSettings = function(conf){
  emailSettings = conf;
}

Notification.getTransportOptions = function(){
  var opts = {
    host: emailSettings.smtpHostname,
    port: emailSettings.smtpPort,
  }
  if (( emailSettings.smtpUsername != null ) &&
  ( emailSettings.smtpPassword != null )){
    opts.auth = {
      user: emailSettings.smtpUsername,
      pass: emailSettings.smtpPassword
    }
  }
  return opts;
}

Notification.getTransport = function(){
  var options = Notification.getTransportOptions();
  var transport = nodemailer.createTransport(smtpTransport(options));
  return transport;
}

Notification.validKeys = function(){
  return validKeyList;
}

Notification.prototype.key = function(){
  return this.uuid;
}

Notification.prototype.hasErrors = function(){
  var errCount = 0;
  if ( this.backupObjects.length == 0){
    return -1;
  }
  for ( var i = 0; i < this.backupObjects.length; i++ ){
    var backup = this.backupObjects[i];
    if (( backup.errors != null ) && (backup.errors.length > 0 )){
      errCount += 1;
    }
  }
  return errCount;
}

Notification.prototype.subject = function(){
  var errCount = this.hasErrors();
  if ( errCount == 0 ){
    return "All backups completed successfully";
  }else if ( errCount == -1 ){
    return "No backups have occured";
  }else{
    return errCount.toString() + " backup error(s) were encountered";
  }
}

Notification.prototype.setBackupObjects = function(objs){
  var ids = [];
  objs.forEach(function(obj){
    ids.push(obj.key());
  });
  this.backups = ids;
  this.backupObjects = objs;
}

Notification.prototype.fetchBackups = function(callback){
  var self = this;
  if ( this.backups.length == 0 ){
    this.backupObjects = [];
  }
  if ( this.backupObjects != null ){
    return callback(null, this.backupObjects);
  }
  return Backup.withKeys(self.backups, function(err, objs){
    if ( err != null ){
      return callback(err, null);
    }
    self.backupObjects = objs;
    return callback(null, self.backupObjects);
  });
}

Notification.prototype.emailBody = function(callback){
  if (( this.backups != null ) && ( this.backups.length == 0 )){
    var returnObj = {
      plain: "No backups have occured",
      html: "<html><body>No backups have occured</body></html>"
    }
    return callback(null, returnObj);
  }
  return this.fetchBackups(function(err, backups){
    if ( err != null ){
      return callback(err, null);
    }
    var backupTexts = [];
    var backupTableRows = [];
    backups.forEach(function(backup){
      var snapshotNames = [];
      if ( backup.snapshots != null ){
        backup.snapshots.forEach(function(snapshot){
          snapshotNames.push(
            [snapshot.datasetName, snapshot.snapshotName].join('@'));
        });
      }
      var vmName = backup.alias;
      if ( vmName == null ){
        vmName = backup.vmUuid;
      }
      var status = 'Success';
      var errorText = '';
      if (( backup.errors != null ) && (backup.errors.length > 0 )){
        status = 'Failed';
        errorText = backup.errors.join(', ');
      }
      var backupLine = [
        status,
        vmName,
        snapshotNames.join(', '),
        errorText
      ];
      var plain = backupLine.join(' - ');
      var html = [
        '<tr><td>',
        backupLine.join('</td><td>'),
        '</td></tr>'
      ].join('');
      backupTexts.push(plain);
      backupTableRows.push(html);
    });
    var allPlain = backupTexts.join('\n');
    var allHtml = [
      "<html><body><table><thead><tr><th>Result</th><th>VM</th>\
      <th>Snapshots</th><th>Errors</th></tr></thead><tbody>",
      backupTableRows.join(''),
      '</tbody></table></body></html>'
    ].join('');
    var returnObj = {
      plain: allPlain,
      html: allHtml
    }
    return callback(null, returnObj);
  });
}

Notification.prototype.dispatch = function(callback){
  var transport = Notification.getTransport();
  var self = this;
  return this.emailBody(function(err, bodies){
    if ( err != null ){
      return callback(err, null);
    }
    var mail = {
      from: emailSettings.smtpFromAddress,
      to: emailSettings.smtpToAddress,
      subject: self.subject(),
      text:bodies.plain,
      html:bodies.html
    };
    return transport.sendMail(mail, function(err, info){
      return callback(err);
    });
  });

}

module.exports = Notification;
