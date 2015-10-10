var util = require("util");
var Store = require("./store");

function KvObject(options){
  var self = this;
  Object.keys(options).forEach(function(key){
    self[key] = options[key];
  });
}

KvObject.bucket = 'kvObjectBucket';

KvObject.staticFunctions = {
  getBucket: function(){
    return this.bucket;
  },
  withKey: function(key, callback){
    var self = this;
    return Store.get(self.getBucket(), key, function(err, obj){
      if ( err != null ){
        return callback(err, null);
      }
      var kvo = null;
      if ( obj != null ){
        kvo = new self(obj.value);
      }
      return callback(null, kvo);
    });
  },
  withKeys: function(keys, callback){
    var self = this;
    return Store.getKeys(self.getBucket(), keys, function(err, objs){
      if ( err != null ){
        return callback(err, null);
      }
      var results = [];
      objs.forEach(function(obj){
        results.push(new self(obj.value));
      });
      return callback(null, results);
    });
  },
  validKeys: function(){
    return [];
  },
  all: function(options, callback){
    var self = this;
    return Store.all(self.getBucket(), options, function(err, objs){
      if ( err != null ){
        return callback(err, null);
      }
      var results = [];
      objs.forEach(function(obj){
        results.push(new self(obj.value));
      });
      return callback(null, results);
    });
  }
}

KvObject.prototype.key = function(){
  return 'key';
}

KvObject.prototype.save = function(callback){
  var saveObject = {};
  var self = this;
  this.constructor.validKeys().forEach(function(key){
    saveObject[key] = self[key];
  });
  console.log(this, saveObject, this.constructor.validKeys());
  Store.set(this.constructor.getBucket(), this.key(), saveObject, callback);
}

KvObject.prototype.delete = function(callback){
  Store.delete(this.constructor.getBucket(), this.key(), callback);
}

module.exports = KvObject;
