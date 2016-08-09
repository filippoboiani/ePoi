angular.module("GeofencingProject.controllers", [])

.controller('AppCtrl', function($scope, Api, $rootScope, $http, CONFIG, $window, AuthService, AUTH_EVENTS){

  // if user isn't authenticated yet, then logout and redirect to login page
  $scope.$on(AUTH_EVENTS.notAuthenticated, function(event) {
    AuthService.logout();
    $window.location.href = "/#/login";
    var alertPopup = "Session Lost.\nSorry you have to login again.";
  });

  // Logout service
  $scope.logout = function() {
    AuthService.logout();
    // Redirect to login page
    $window.location.href = "/#/login";
  };

})

.controller('ViewPoiCtrl', function($scope, Api, $window){
  console.log("ViewPoi");

  var map = null;
  var POIs = [];

  Api.getPois().then(function(response){
    console.log(response);
    if(response.success){

      $scope.poiList = response.data;
      POIs = response.data;

      // Centroid for all the points
      var centroid = {};
      var lat = 0;
      var lng = 0;
      var numOfPoints = POIs.length;

      // Calculate the centroid
      for(var i=0; i< numOfPoints; i++){
        lat += parseFloat(POIs[i].location.coordinates[1]);
        lng += parseFloat(POIs[i].location.coordinates[0]);
      }

      centroid.lat = lat / numOfPoints;
      centroid.lng = lng / numOfPoints;
      console.log(centroid);

      // Set the centroid as map center.
      var center =new google.maps.LatLng(centroid.lat, centroid.lng);

      var init = {
        center: center,
        zoom: 18,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        mapTypeControl: false,
      };

      // Create the map
      map = new google.maps.Map(document.getElementById("mapCanvas"), init);
    }
  })

  var marker = null;
  var circle = null;

  // Shows the selected POI
  $scope.setMap = function(index) {

    if(marker && circle){
      marker.setMap();
      circle.setMap();
    }

    // Create the marker related to the poi
    var c = new google.maps.LatLng(POIs[index].location.coordinates[1], POIs[index].location.coordinates[0]);
    marker = new google.maps.Marker({ position: c, title: POIs[index].name });

    // Random color
    var color = '#'+Math.floor( Math.random()*16777215 ).toString(16);

    // Create the circle area around the center
    circle = new google.maps.Circle({
      center: c,
      radius: parseInt(POIs[index].radius),
      strokeColor: color,
      strokeOpacity: 0.5,
      strokeWeight: 1,
      fillColor: color,
      fillOpacity: 0.2
    });

    // Set marker and circle in the map
    marker.setMap(map);
    circle.setMap(map);

  }
})

.controller('AddPoiCtrl', function($scope, $http, Api){
  console.log("AddPoi");

  // Sidebar set open
  $scope.sidebarClosed = null;

  // Set the centroid as map center.
  var center =new google.maps.LatLng(44.49500, 11.3439);
  var map = null;

  var init = {
    center: center,
    zoom: 17,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    mapTypeControl: false,
  };

  // Create the map
  map = new google.maps.Map(document.getElementById("mapCanvas"), init);

  // Center of the circle image
  // var image = new google.maps.MarkerImage('css/images/marker.png', new google.maps.Size(30, 30), new google.maps.Point(0,0), new google.maps.Point(15, 15), new google.maps.Size(30, 30));

  // Add click listener to the map: when the user clicks create a marker and a circle
  google.maps.event.addListener(map, 'click', function(event) {
    console.log("cliccato");
    placeMarker(event.latLng);
  });

  // Get search Box and set inside the map
  var input = document.getElementById('pac-input');
  map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

  // Create and bind auotcompletion to search box
  var autocomplete = new google.maps.places.Autocomplete(input);
  autocomplete.bindTo('bounds', map);

  // Info window
  var infowindow = new google.maps.InfoWindow();

  // Random color
  var color = '#'+Math.floor(Math.random()*16777215).toString(16);

  // Searched marker
  var marker = new google.maps.Marker({
    map: map,
    animation: google.maps.Animation.DROP,
    anchorPoint: new google.maps.Point(0, -29)
  });

  // Searched circle
  var circle = new google.maps.Circle({
    map: map,
    center: marker.position,
    radius: 50,
    strokeColor: color,
    strokeOpacity: 0.5,
    strokeWeight: 1,
    fillColor: color,
    fillOpacity: 0.2,
    editable: true
  });

  // Add listener to the search box
  autocomplete.addListener('place_changed', function() {
    infowindow.close();
    marker.setVisible(false);
    circle.setVisible(false)
    var place = autocomplete.getPlace();

    if (!place.geometry) {
      window.alert("Autocomplete's returned place contains no geometry");
      return;
    }

    // If the place has a geometry, then present it on a map.
    // if (place.geometry.viewport) {
    //   map.setCenter(place.geometry.location);
    //   map.setZoom(17);  // Why 17? Because it looks good.
    // }

    map.setCenter(place.geometry.location);
    map.setZoom(17);  // Why 17? Because it looks good.

    marker.setPosition(place.geometry.location);
    marker.setVisible(true);
    circle.setCenter(marker.position);
    circle.setVisible(true);

    var address = '';
    if (place.address_components) {
      address = [
        (place.address_components[0] && place.address_components[0].short_name || ''),
        (place.address_components[1] && place.address_components[1].short_name || ''),
        (place.address_components[2] && place.address_components[2].short_name || '')
      ].join(' ');
    }

    infowindow.setContent('<div><strong>' + place.name + '</strong><br>' + address);
    infowindow.open(map, marker);
  });


  // Place a marker with circle area inside the map
  function placeMarker(location) {

    var color = '#'+Math.floor(Math.random()*16777215).toString(16);

    marker.setPosition(location);
    circle.setCenter(marker.position);

  }

  $scope.addAction = function(){
    console.log("add");
    var x = $("#key-value-template").clone();
    x.attr("id", "");
    $(".action-message").append(x);
  }

  // Save a Poi
  $scope.savePoi = function(poi){

    var actions = {
      "still": false,
      "walking": false,
      "running": false,
      "car": false,
      "train": false
    }
    var activities = []
    var ok = false

    $(".key-value").each(function( index ) {
      var key = $("select", this).val()
      var value = $("input", this).val()
      console.log(key+": "+value);

      var act = {
        "name": key,
        "message": value
      }

      if( !actions[key] ){
        ok = true
        activities.push(act);
        actions[key] = true;
      }

    });
    console.log(activities);

    if(circle && marker && poi.from && poi.to && poi.name && ok){
      poi.lat = circle.getCenter().lat();
      poi.lng = circle.getCenter().lng();
      poi.radius = circle.getRadius();
      poi.activities = activities
      console.log(poi);

      Api.addPoi( poi ).then( function(response){

        console.log(response);
      });
    }
    // ApiCall
  }

  // Function: toggle the sidebar
  $scope.toggleSidebar = function() {
    console.log("Clicked");
    $scope.sidebarClosed = $scope.sidebarClosed ? null: "sidebar-closed";
  };

})

.controller('LoginCtrl', function($scope, AuthService, $rootScope, $window) {

  // don't show the header navbar in the login page
  $rootScope.navbar = false;
  // check if the user is already authenticated
  if (AuthService.isAuthenticated() === true) {
    // if is authenticated redirect him to the homepage
    $window.location.href = "/#/poi/view";
  }

  // setting user fields for login
  $scope.user = {
    email: '',
    pass: ''
  };

  // when the user click on the login button
  $scope.login = function() {
    // call the AuthService login funciton and post the user data in the func
    AuthService.login($scope.user).then(function(msg) {
      // reload the page
      // it will automatically check if the user is logged, then redirect to home
      $window.location.reload();
    }, function(errMsg) {
      // if there are server errors, let the user know by console and client alert
      $scope.error = errMsg;
    });
  };
})

.controller('RegisterCtrl', function($scope, $rootScope, $timeout, $location, $window, AuthService) {

  // don't show the header navbar in the registration page
  $rootScope.navbar = false;
  // check if the user is already authenticated
  if (AuthService.isAuthenticated() === true) {
    // if is authenticated redirect him to the homepage
    $window.location.href = "/#/poi/view";
  }

  // setting user fields for registration
  $scope.user = {
    email: '',
    pass: '',
    given_name: '',
    family_name: '',
    sex: ''
  };

  // when the user click on the register button
  $scope.signup = function() {
    // call the AuthService service -lol- and it's function register with user data
    AuthService.register($scope.user).then(function(msg) {
      // let the user know he is successfully registered
      $scope.info = "Registered successfully!";
      // change location of the page, redirecting to homepage
      $timeout(function() {
        $location.path('/#/login');
        }, 3000);

    }, function(errMsg) {
      // if there are server errors, let the user know by console and client alert
      $scope.error = errMsg;
    });
  };
})

.controller('UserCtrl', function($scope, Api, $rootScope, $http, CONFIG, $window, AuthService, AUTH_EVENTS){
  console.log("UserCtrl");

  var map = null;
  var center = new google.maps.LatLng(44.49500, 11.3439);
  var directionsService = new google.maps.DirectionsService;
  var directionsDisplay = new google.maps.DirectionsRenderer;

  var route = null;
  $scope.userList = [];
  // Get all users
  Api.getUsers().then( function( response ){
    console.log(response)
    if ( response.success ) {
      console.log("Success");
      $scope.userList = response.data


      // Set the centroid as map center.
      //var center =new google.maps.LatLng(centroid.lat, centroid.lng);

      var init = {
        center: center,
        zoom: 18,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        mapTypeControl: false,
      };

      // Create the map
      map = new google.maps.Map(document.getElementById("mapCanvas"), init);
      directionsDisplay.setMap(map);
    }
  });

  var todayHistory = [];

  // Fill the map with the route
  $scope.setMap = function(index){
    console.log("setMap("+index+")");

    if (route){
      route.setMap(null);
      directionsDisplay.setDirections(null);
    }

    // Select the user
    var user = $scope.userList[index];

    // Extract (today) coordinates list from history
    todayCoordinates = selectTodayData(user.history, { onlyCoordinates: true});
    console.log(todayCoordinates);

    // If the user has an hisotry
    if (todayCoordinates.length > 0) {

      // List of waypoints
      var waypoints = [];
      for (var i=0; i< todayCoordinates.length; i++){
        if(i != 0 && i != todayCoordinates.length-1){
          waypts.push({
            location: todayCoordinates[i],
            stopover: false
          });
        }
      }

      // Call direction service on points to draw the route over the streets
      directionsService.route({
          origin: todayCoordinates[0],
          destination: todayCoordinates[todayCoordinates.length-1],
          waypoints: waypoints,
          optimizeWaypoints: true,
          travelMode: 'WALKING'
        }, function(response, status) {
          if (status === 'OK') {
            directionsDisplay.setDirections(response);
          } else {
            window.alert('Directions request failed due to ' + status);
          }
        });

      // Original line drawn from the list of points  
      route = new google.maps.Polyline({
            path: todayCoordinates,
            geodesic: true,
            strokeColor: '#FF0000',
            strokeOpacity: 1.0,
            strokeWeight: 2
          });

      route.setMap(map);
    }
  }

  function selectTodayData( listOfData, params ){
    var result = []
    var today = new Date();
    console.log("today: "+today);

    for(var i = 0; i < listOfData.length; i++ ){

      var data = listOfData[i];
      console.log(data)
      var dateToCheck = new Date(data.time);
      console.log("check: "+dateToCheck);

      var day = ( today.getDay() == dateToCheck.getDay() )
      var month = ( today.getMonth() == dateToCheck.getMonth() )
      var year = ( today.getFullYear() == dateToCheck.getFullYear() )

      if(day && month && year) {
        if (params.onlyCoordinates) {
          result.push(data.coordinates);
        }else {
          result.push(data);
        }
      }
    }

    return result;
  }

});
