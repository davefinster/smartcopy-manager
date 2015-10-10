'use strict';
var sqlite3 = require('sqlite3').verbose();
var config = null;
var db = null;
var async = require('async');

var bucketCreateQuery = "CREATE TABLE ? ('key' TEXT NOT NULL UNIQUE,'value' TEXT NOT NULL, 'createdAt' INTEGER NOT NULL,'updatedAt' INTEGER NOT NULL, PRIMARY KEY(key));";

function Store(){

}

Store.setConfig = function(conf){
  config = conf;
}

Store.getDatabase = function(){
  if ( config == null ){
    throw new Error('Configuration not available. Aborting');
  }
  if ( db == null ){
    db = new sqlite3.cached.Database(config.dbPath);
  }
  return db;
}

Store.ensureBucket = function(bucket, callback){
  var db = Store.getDatabase();
  return db.get("SELECT name FROM sqlite_master WHERE \
  type='table' AND name= ?", bucket, function(err, row){
    if ( err ){
      return callback(err);
    }
    if ( row != null ){
      return callback(null);
    }
    //this is to workaround the SQLite limitation of not using
    //table names as parameters
    //see https://github.com/mapbox/node-sqlite3/issues/330
    var query = bucketCreateQuery.replace('?', bucket);
    return db.run(query, function(err){
      return callback(err);
    });
  });
}

Store.upsert = function(bucket, key, value, callback){
  var db = Store.getDatabase();
  var updateQuery = "UPDATE " + bucket + " SET value = ?,updatedAt = ? WHERE key = ?;"
  var insertQuery = "INSERT OR IGNORE INTO " + bucket + " (key, value, updatedAt, createdAt) VALUES (?, ?, ?, ?)";
  var updatedAt = Date.now();
  var createdAt = updatedAt;
  return async.series([
    function(cb){
      db.run(updateQuery, [value, updatedAt, key], cb);
    },
    function(cb){
      db.run(insertQuery, [key, value, updatedAt, createdAt], cb);
    }
  ], callback);
}

Store.set = function(bucket, key, value, callback){
  var valueText = value;
  if ( valueText == null ){
    //delete
    Store.delete(bucket, key, callback);
    return;
  }
  if ( typeof valueText == 'object' ){
    valueText = JSON.stringify(valueText);
  }
  var db = Store.getDatabase();
  async.waterfall([
    function(cb){
      Store.ensureBucket(bucket, cb);
    },
    function(cb){
      Store.upsert(bucket, key, valueText, cb);
    }
  ], callback);
}

Store.parseObject = function(databaseObj){
  var obj = {
    key: databaseObj.key,
    value: JSON.parse(databaseObj.value),
    createdAt: new Date(databaseObj.createdAt),
    updatedAt: new Date(databaseObj.updatedAt)
  };
  return obj;
}

Store.get = function(bucket, key, callback){
  var db = Store.getDatabase();
  return db.get("SELECT * FROM " + bucket + " WHERE key = ?", [key],
  function(err, row){
    if ((err != null ) && ( err.message.indexOf('no such table') == -1 )){
      return callback(err, null);
    }
    var obj = null;
    if ( row != null ){
      obj = Store.parseObject(row);
    }
    return callback(null, obj);
  });
}

Store.getKeys = function(bucket, keys, callback){
  var db = Store.getDatabase();
  return db.all("SELECT * FROM " + bucket + " WHERE key IN ?", [keys],
  function(err, rows){
    var results = [];
    if ((err != null ) && ( err.message.indexOf('no such table') == -1 )){
      return callback(err, results);
    }
    if ( rows != null ){
      rows.forEach(function(row){
        results.push(Store.parseObject(row));
      });
    }
    return callback(null, results);
  });
}

Store.all = function(bucket, options, callback){
  var opts = options || {};
  var db = Store.getDatabase();
  var queryParts = [
    "SELECT * FROM " + bucket
  ]
  if ( opts.where != null ){
    queryParts.push('WHERE ' + opts.where);
  }
  if ( opts.order != null ){
    queryParts.push('ORDER BY ' + opts.order);
  }
  if ( opts.limit != null ){
    queryParts.push('LIMIT ' + opts.limit.toString());
  }
  if ( opts.offset != null ){
    queryParts.push('OFFSET ' + opts.offset.toString());
  }
  console.log(queryParts.join(' '));
  return db.all(queryParts.join(' '), function(err, rows){
    var results = [];
    if ((err != null ) && ( err.message.indexOf('no such table') == -1 )){
      return callback(err, results);
    }
    if ( rows != null ){
      rows.forEach(function(row){
        results.push(Store.parseObject(row));
      });
    }
    return callback(null, results);
  });
}

Store.delete = function(bucket, key, callback){
  var db = Store.getDatabase();
  return db.run("DELETE FROM " + bucket + " WHERE key = ?", [key],
  function(err){
      callback(err);
  });
}

module.exports = Store;
