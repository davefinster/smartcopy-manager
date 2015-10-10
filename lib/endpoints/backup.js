var Model = require('../model');
var common = require('./common');
var async = require('async');
var uuid = require('uuid');

function Backup(){

}

Backup.dispatchNotifications = function(req, res, next){
  //get latest notification's createdAt stamp
  //if none, show all - if one, show only backups after
  var options = {
    limit: 1,
    order: 'createdAt DESC'
  }
  Model.Notification.all(options, function(err, notifications){
    if ( err != null ){
      err.statusCode = 500;
      return next(err);
    }
    var backupQuery = {
      order: 'createdAt DESC'
    };
    var timestamp = Date.now();
    var whereClauses = [];
    if ( notifications.length > 0){
      console.log(notifications[0])
      whereClauses.push('createdAt >= ' +
       notifications[0].timestamp.toString());
    }
    whereClauses.push('createdAt < ' + timestamp.toString());
    backupQuery.where = whereClauses.join(' AND ');
    Model.BackupResult.all(backupQuery, function(err, backups){
      if ( err != null ){
        err.statusCode = 500;
        return next(err);
      }
      var note = new Model.Notification({
        uuid: uuid.v4(),
        timestamp: timestamp
      });
      note.setBackupObjects(backups);
      note.dispatch(function(err){
        if ( err != null ){
          err.statusCode = 500;
          return next(err);
        }
        note.success = true;
        note.save(function(err){
          if ( err != null ){
            err.statusCode = 500;
            return next(err);
          }
          res.json(note);
          next();
        });
      });
    });
  });
}

Backup.newEntry = function(req, res, next){
  if ( req.body.vm == null ){
    var err = new Error('Virtual machine missing');
    err.statusCode = 400;
    return next(err);
  }
  var vm = req.body.vm;
  async.waterfall([
    function(callback){
      Model.Vm.withKey(vm.uuid, function(err, vm){
        callback(err, vm);
      });
    },
    function(vm, callback){
      if ( vm != null ){
        return callback(null, vm);
      }
      var obj = new Model.Vm(req.body.vm);
      return obj.save(function(err){
        callback(err, obj);
      });
    },
    function(vm, callback){
      var backup = new Model.BackupResult({
        uuid: uuid.v4(),
        vmUuid: vm.uuid,
        snapshots: req.body.snapshots,
        errors: req.body.errors,
        alias: vm.alias
      });
      return backup.save(function(err){
        return callback(err, backup);
      });
    }
  ], function(err, backup){
    if ( err ){
      err.statusCode = 500;
      return next(err);
    }
    res.json(backup);
    next();
  });
}

exports.attach = function(server, configuration){
	server.post('/backup', Backup.newEntry);
  server.get('/backup/notify', Backup.dispatchNotifications);
}
