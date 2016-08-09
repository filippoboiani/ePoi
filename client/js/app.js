angular.module("GeofencingProject", ['ngRoute', 'ngSanitize', 'mgcrea.ngStrap', 'GeofencingProject.config', 'GeofencingProject.controllers', 'GeofencingProject.authServices', 'GeofencingProject.api',])
.run(function($rootScope, AuthService, AUTH_EVENTS, $window) {
  console.info("Geofencing Project");

  // handling navbar in different controllers (to hide or show the header navbar)
  $rootScope.$on('$routeChangeSuccess', function (event, current, previous) {
    if (current.$$route.controller === "RegisterCtrl" || current.$$route.controller === "LoginCtrl")
    {
      $rootScope.navbar = false;
      $rootScope.footerbar = false;
    } else if (current.$$route.controller === "AnnotatorCtrl"){
      $rootScope.navbar = true;
      $rootScope.footerbar = false;
    } else {
      $rootScope.navbar = true;
      $rootScope.footerbar = true;
    }
  });

  // event handler fired when the transition begins
  $rootScope.$on('$stateChangeStart', function (event, next, nextParams, fromState) {
    if (!AuthService.isAuthenticated()) {
      if (next.name !== 'outside.login' && next.name !== 'outside.register') {
        event.preventDefault();
        window.location.href = "/login";
      }
    }
  });
})

.config(function($routeProvider, $httpProvider) {

  $routeProvider.
  when('/poi/view', {
    templateUrl: 'templates/view-pois.html',
    controller: 'ViewPoiCtrl'
  }).
  when('/poi/add', {
    templateUrl: 'templates/add-poi.html',
    controller: 'AddPoiCtrl'
  }).
  when('/users/info', {
    templateUrl: 'templates/view-users.html',
    controller: 'UserCtrl'
  }).
  when('/login', {
    templateUrl: 'templates/login.html',
    controller: 'LoginCtrl'
  }).
  when('/register', {
    templateUrl: 'templates/register.html',
    controller: 'RegisterCtrl'
  }).

  otherwise({
    redirectTo: '/poi/add'
  });

  $httpProvider.interceptors.push('AuthInterceptor');
});
