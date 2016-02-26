// BridgeService.js
// Manages serial connection with the bridge, pings constantly for status
// Events:
//  - bridgeConnected
//  - bridgeDisconnected
//  - tempMeasured
"use strict";

var util = require("util");
var events = require("events");
var SerialTransport = require("./SerialTransport");
var config = require("./config");

var PING_TOUT = 60000;
var PING_INTERVAL = 20000;
var CONNECT_TIMEOUT = 10000;

var BridgeService = function()
{
  var self = this;
  self.noBind = true;
  this.isConnected = false;
  this.transport = null;

  this.lastTimePingOk = new Date();
  
  this.on("pingOk", function onPing()
    {
      self.lastTimePingOk = new Date();
      var justConnected = false;
      if(self.isConnected === false) justConnected = true;
      self.isConnected = true;
      if(justConnected) self.emit("bridgeConnected");
    });

  // Ping the bridge every minute
  setInterval(function bridgeWatchdog()
    {
      if(!self.transport || !self.transport.serialPort.isOpen())
      {
        if(self.isConnected)
        {
          self.isConnected = false;
          self.emit("bridgeDisconnected");
        }
        return;
      }
      if(new Date() - self.lastTimePingOk > PING_TOUT)
      {
        // Bridge not responding
        self.isConnected = false;
        self.emit("bridgeDisconnected");
        console.log("The Bridge is not responding");
      }
      self.pingBridge();
    }, PING_INTERVAL);

  // Socket events
  /*self.on("bridgeConnected", function()
    {
      sails.sockets.blast("bridgeConnected");
    });

  self.on("bridgeDisconnected", function()
    {
      sails.sockets.blast("bridgeDisconnected");
    });*/

  // DEBUG
  /*self.on("feed", function(feedData, shortAddr, longAddr)
    {
      sails.log.info(":::::Feed:", feedData, shortAddr, longAddr);
    });*/

};

util.inherits(BridgeService, events.EventEmitter);

BridgeService.prototype.connect = function(callback)
{
  var self = this;
  var timeout = false;

  if(!callback) callback = function(){};

  if(self.isConnected) return callback(new Error("Bridge is already connected"));

  if(self.transport !== null) self.transport.close();

  self.transport = new SerialTransport(config.bridge.baudrate, config.bridge.port);

  self.transport.on("ready", function onReady()
    {
      // For when the bridge is not automatically restarted
      setTimeout(function(){self.pingBridge();}, 1500);
      if(callback) self.once("pingOk", function onConnectOk(){ 
        if(!timeout)
        {
          timeout = true;
          callback(); 
        }
      });
    });
  self.transport.on("data", function onData(data)
    {
      self.parse(data);
    });
  self.transport.on("crcError", function(data){ console.log("crcError", data); });
  self.transport.on("framingError", function(data){ console.log("framingError", data); });
  self.transport.on("escapeError", function(data){ console.log("escapeError", data); });

  // Handle timeout
  setTimeout(function()
    {
      if(!timeout)
      {
        timeout = true;
        console.log("Timeout connecting to the bridge");
        callback(new Error("Timeout connecting to the bridge"));
      }
    }, CONNECT_TIMEOUT);
};

BridgeService.prototype.disconnect = function(callback)
{
  var self = this;
  self.isConnected = false;
  if(self.transport) self.transport.close(callback);
};

BridgeService.prototype.sendCommand = function(action, shortAddr, param)
{
  var self = this;
  if(!param) param = 0;
  if(self.isConnected) self.transport.write([action, param, shortAddr&0x00FF, (shortAddr>>8)&0x00FF]);
};

BridgeService.prototype.parse = function(data)
{
  var self = this;
  // [evtN][param][shortAddr (x2)][longAddr (x8)]
  var expectedLen = 12;
  if(data.length < expectedLen) return;
  var command = data[0];
  var param = data[1];
  var shortAddr = data.readUInt16LE(2);
  var longAddr = data.slice(4, 12);
  // Battery command
  switch(command)
  {
    case 0: // tempMeasured command
      self.emit("tempMeasured", param, shortAddr, longAddr);
    break;
    case 7:
      self.emit("pingOk");
    break;
  }
};

BridgeService.prototype.pingBridge = function()
{
  var self = this;
  if(self.transport && self.transport.serialPort.isOpen()) self.transport.write([0,0,0,0,0,0,0,0,0]);
};

module.exports = new BridgeService();