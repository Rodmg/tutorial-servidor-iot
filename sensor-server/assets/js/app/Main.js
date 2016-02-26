"use strict";

(function(){

  angular
    .module("iotApp", ["ngRoute", "ngResource", "ngMaterial", "ngMdIcons", "ngMessages", "chart.js"])
    .config(function($mdThemingProvider, $mdIconProvider, $sceDelegateProvider, $httpProvider)
    {
      $mdThemingProvider.theme('default')
        .primaryPalette('blue')
        .accentPalette('orange');

      $sceDelegateProvider.resourceUrlWhitelist([
          // Allow same origin resource loads.
          'self',
          // Allow loading from our server.
          // server + '**'
        ]);
    })
    .config(function($routeProvider, $locationProvider)
      {
        $routeProvider
          .when('/', {
            redirectTo: '/sensors'
          }).
          when('/sensors', {
            templateUrl: 'js/app/Sensors/sensors.html',
            controller: 'SensorsController as sctl'
          }).
          when('/sensor/:id', {
            templateUrl: 'js/app/Sensor/sensor.html',
            controller: 'SensorController as sctl'
          })
      });

})();