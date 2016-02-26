/**
* Sensor.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

  attributes: {
    name: {
      type: 'string',
      defaultsTo: 'Nuevo sensor'
    },
    connected: {
      type: 'boolean',
      defaultsTo: false
    },
    lastSeen: {
      type: 'datetime'
    },
    shortAddress: {
      type: 'integer'
    },
    longAddress: {
      type: 'string',
      unique: true
    }
  }
};

