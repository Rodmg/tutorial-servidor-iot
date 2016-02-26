"use strict";

var util = require("util");
var events = require("events");
var bridgeService = require("./BridgeService");

// Definimos la "clase" SensorService
var SensorService = function()
{

};

// Sensor service hereda de eventEmitter
util.inherits(SensorService, events.EventEmitter);

// Funcion de inicialización, la llamaremos en bootstrap.js ya que la app esté lista
SensorService.prototype.init = function()
{
  // Realizar la conexión serial con el puente
  bridgeService.connect(function onConnected(err)
    {
      if(err)
      {
        console.log("Error conectándose con el puente");
        return process.exit();
      }
      console.log("Puente conectado");
    });

  // Inscribirse a los eventos que nos interesan de BridgeService
  bridgeService.on("tempMeasured", function(param, shortAddr, longAddr)
    {
      // Aquí empieza la magia
      // Buscamos si ya conocemos al dispositivo que emitió el evento, o lo creamos en caso contrario
      longAddr = longAddr.toString('hex').toUpperCase(); // Estandarizamos longAddr como un String de los valores hexadecimales
      Sensor.findOrCreate(
          { longAddress: longAddr }, 
          { longAddress: longAddr, shortAddress: shortAddr, connected: true, lastSeen: new Date()  }
        ).exec(function(err, foundSensor)
        {
          if(err) return console.log("Error buscando sensor", err);
          if(!foundSensor) return console.log("Error creando sensor");

          // Sí conocemos el dispositivo, guardar lectura
          Reading.create({ value: param, time: new Date(), sensor: foundSensor.id }).exec(function(err, created)
            {
              if(err) return sails.log(err);
              sails.log("Se creó el registro:", created);
            });

          // Actualizar estado del dispositivo como conectado y que lo acabamos de ver
          Sensor.update({ id: foundSensor.id }, { connected: true, lastSeen: new Date() }).exec(function(err, updated)
            {
              if(err) return sails.log(err);
            });

        });
    });

};

module.exports = new SensorService();