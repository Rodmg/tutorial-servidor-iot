"use strict";

(function(){

  angular
    .module('iotApp')
    .controller("SensorController", ["$scope", "$mdDialog", 
      "$mdBottomSheet",  "$window", "$location", "$http", "$routeParams",
      SensorController
    ]);

  function SensorController($scope, $mdDialog, $mdBottomsheet,  $window, $location, $http, $routeParams)
  {
    var self = this;
    self.init = init;
    self.go = go;
    self.toggleGraph = toggleGraph;

    self.state = "loading"; // normal, loading, error, graph

    self.id = $routeParams.id;
    self.sensor = {};
    self.readings = [];

    self.graph = {
      labels: [],
      data: [],
      series: ['Temperatura']
    };

    self.init();

    function go(path)
    {
      $location.path(path);
    };

    function toggleGraph()
    {
      // do nothing on loading or error
      if(self.state === "loading" || self.state === "error") return;
      if(self.state === "normal") self.state = "graph";
      else self.state = "normal";
    };

    function prepareGraph()
    {
      var dt = [];
      for(var i = 0; i < self.readings.length; i++)
      {
        self.graph.labels.push(self.readings[i].time);
        dt.push(self.readings[i].value);
      }
      self.graph.data[0] = dt;
    };

    function init()
    {
      self.state = "loading";
      $http.get("/sensor/" + self.id).then(
        function success(response)
        {
          console.log(response);
          self.sensor = response.data;

          $http.get("/reading?sensor=" + self.id + "&limit=100&sort=id%20DESC").then(
            function success(response)
            {
              console.log(response);
              self.readings = response.data;
              prepareGraph();
              self.state = "normal";
            },
            function error(response)
            {
              console.log(response);
              self.state = "error";
            });
        },
        function error(response)
        {
          console.log(response);
          self.state = "error";
        });
    };

  };

})();