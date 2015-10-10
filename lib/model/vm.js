var Store = require('./store');
var util = require('util');
var KvObject = require('./kv_object');
var validKeyList = [
  'brand',
  'image_uuid',
  'max_physical_memory',
  'max_swap',
  'hostname',
  'alias',
  'datasets',
  'disks',
  'nics',
  'uuid'
];

function Vm(options){
  KvObject.call(this, options);
}

Vm.bucket = 'virtualMachines';

Object.keys(KvObject.staticFunctions).forEach(function (key) {
  Vm[key] = KvObject.staticFunctions[key];
});

util.inherits(Vm, KvObject);

Vm.validKeys = function(){
  return validKeyList;
}

Vm.prototype.key = function(){
  return this.uuid;
}

module.exports = Vm;
