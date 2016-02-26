"use strict";

(function(){

  angular
    .module('iotApp')
    .controller("SensorsController", ["$scope", "$mdDialog", "$mdSidenav", 
      "$mdBottomSheet",  "$window", "$location", "$http",
      SensorsController
    ]);

  function SensorsController($scope, $mdDialog, $mdSidenav, $mdBottomsheet,  $window, $location, $http)
  {
    var self = this;
    self.init = init;
    self.edit = edit;
    self.go = go;
    self.toggleList = toggleList;
    self.onClick = onClick;

    self.state = "loading"; // normal, loading, error

    self.sensors = [];

    self.init();

    function go(path)
    {
      $location.path(path);
    };

    function toggleList()
    {
      $mdSidenav('left').toggle();
    };

    function init()
    {
      self.state = "loading";
      $http.get("/sensor").then(
        function success(response)
        {
          console.log(response);
          self.sensors = response.data;
          self.state = "normal";
        },
        function error(response)
        {
          console.log(response);
          self.state = "error";
        });
    };

    function onClick($event, sensor)
    {
      self.go("/sensor/" + sensor.id);
    };

    function edit(sensor)
    {
      $mdDialog.show({
        controller: SensorEditController,
        templateUrl: 'js/app/Sensors/editSensor.html',
        parent: angular.element(document.body),
        clickOutsideToClose: true,
        locals: {
          name: sensor.name
        }
      })
      .then(function(answer)
        {
          if(answer.type === 'apply')
          {
            sensor.name = answer.name;
            $http.put('/sensor/' + sensor.id, sensor)
              .then(
                function success(response)
                {
                  // Reload
                  self.init();
                },
                function error(response)
                {
                  console.log(response);
                  self.state = "error";
                });
          }
        });
    };

  };

  function SensorEditController($scope, $mdDialog, name)
  {
    $scope.newName = name;
    $scope.hide = function() {
      $mdDialog.hide();
    };
    $scope.cancel = function() {
      $mdDialog.cancel();
    }
    $scope.answer = function(answer) {
      // Custom validation
      if(answer === 'apply' && !$scope.newName) return;
      var ans = {
        type: answer,
        name: $scope.newName
      }
      $mdDialog.hide(ans);
    };
  };

})();