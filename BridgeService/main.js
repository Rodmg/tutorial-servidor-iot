"use strict";

var bridgeService = require("./BridgeService");

bridgeService.connect(function onConnected(err)
  {
    if(err)
    {
      console.log("Error conectándose con el puente.");
      return process.exit();
    }
    console.log("Puente conectado.");
  });

bridgeService.on("tempMeasured", function(param, shortAddr, longAddr)
  {
    console.log("Se obtuvo la temperatura:", param, "De:", shortAddr, longAddr.toString('hex').toUpperCase());
  });