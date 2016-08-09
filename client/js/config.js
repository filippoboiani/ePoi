/*
 * Configuration module
 * Contains constants and url abbreviations
*/
angular.module("GeofencingProject.config", [])
.constant('AUTH_EVENTS', {
  notAuthenticated: 'auth-not-authenticated',
  notAuthorized: 'auth-not-authorized'
})
.constant("CONFIG", {
  "appVersion": "1.5.0",
  "base_url": "http://localhost:8080",
  "endpoint": "/api",
  "login": "/authenticate",
  "register": "/signup",
  "users": "/users",
  "user": "/user",
  "poi": "/poi",
  "pois": "/pois"
});
