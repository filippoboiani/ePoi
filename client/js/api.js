angular.module('GeofencingProject.api', ['GeofencingProject.config'])

.factory('Api', function($http,CONFIG,$window,$timeout,$q) {
  var self = this;

  self.getPois = function() {
    return $http.get(CONFIG.endpoint+CONFIG.pois).then(
      function(response) {
        return response.data;
      },function(error) {
        return error;
      });
  };

  self.addPoi = function( poi ) {
    return $http.put(CONFIG.endpoint+CONFIG.poi, poi).then(
      function(response) {
        return response.data;
      },function(error) {
        return error;
      });
  }

  self.getUsers = function() {
    return $http.get(CONFIG.endpoint+CONFIG.users).then(
      function(response) {
        return response.data;
      },function(error) {
        return error;
      });
    };

  self.getCurrentUser = function() {
    return $http.get(CONFIG.endpoint + CONFIG.userinfo).then(function(result) {
      return result.data;
    },function(error) {
      return error;
    });
  };

  return self;
  }
);
