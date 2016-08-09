/*
  This module manages all the http requests coming from the application.
  It is involved in authenitcation, lock managing, email sending.
  It can be considered a GRASP Controller (or a handler).
*/
var mongoose = require('mongoose'); // Mongodb connection
// Mongoose schemas
var Poi = require('./models/poi');
var User = require('./models/user');
// History

var passport	= require('passport');
var jwt = require('jwt-simple');
var config = require('../config/server/database'); // get db config file
var path = require('path');
var color = require('colors-cli/safe')
var error = color.red.bold;
var warn = color.yellow;
var notice = color.x45;


// Middleware: Checks if the user is authenticated
checkAuth = function(req, res, next) {
  var token = getToken(req.headers);
  if (token) {
    var decoded = jwt.decode(token, config.secret);
    User.findOne({
      email: decoded.email
    }, function(err, user) {
      if (err) throw err;

      if (!user) {
        errToSend = {
          success: false,
          msg: 'Authentication failed. User not found.'
        };
        console.log(error(errToSend));
        return res.status(403).send(errToSend);
      } else {
        console.log(notice("Authentication success"));
        req.user = user;
        next();
      }
    });
  } else {
    errToSend = {
      success: false,
      msg: 'No token provided.'
    };
    console.log(error(errToSend));
    return res.status(403).send(errToSend);
  }
};

// Get the token from the HTTP header
getToken = function (headers) {
  if (headers && headers.authorization) {
    var parted = headers.authorization.split(' ');
    if (parted.length === 2) {
      return parted[1];
    } else {
      return null;
    }
  } else {
    return null;
  }
};


// Routing module related to app
module.exports = function (app) {

    app.get('/api/poi/customer/:id/:mobility/:lat/:lng', function(req, res, next) {
      console.log("api/poi/customer");
      // the id is the mail??

      // Authentication ??
      // req = { _id = "", coords: {}, mobility: ""}
      // Save history
      var userRequest = {};
      userRequest.coordinates = {};
      userRequest.coordinates.lat = parseFloat(req.params.lat);
      userRequest.coordinates.lng = parseFloat(req.params.lng);
      userRequest.mobility = req.params.mobility;
      userRequest.id = req.params.id;
      console.log(userRequest);

      // Search for POI in radius
      Poi.aggregate([
        // Match documents "near" the queried point
        { "$geoNear": {
          "near": {
              "type": "Point",
              "coordinates": [ userRequest.coordinates.lng , userRequest.coordinates.lat ]
          },
          "distanceField": "distance",
          "spherical": true
        }},

        // Calculate if distance is within radius
        { "$project": {
            "name": 1,
            "location": 1,
            "radius": 1,
            "distance": 1,
            "within": { "$lte": [ "$distance", "$radius" ] }
        }},

        // Match only documents within the radius
        { "$match": { "within": true } }
      ],

        function (err, resultSet) {
        if (err) return next(err);
        else {
          res.json(resultSet);
        }

      });

      // Current time
      var time = new Date();

      // Save the request in History
      User.findByIdAndUpdate(req.params.id,
        { "$push": {
          "history": {
            "coordinates": {
              "lat": req.params.lat,
              "lng": req.params.lng,
            },
            "mobility": req.params.mobility,
            "time": time
          }
        }
      }, function(err, numberAffected){

      });
    });

    // When a business user insert a poi
    app.put("/api/poi", passport.authenticate('jwt', {session: false}), checkAuth, function(req, res, next){

      var poi = new Poi({
        name: req.body.name,
        activities: req.body.activities,
        sender: req.user.email,
        location: {
          coordinates: [req.body.lng, req.body.lat]
        },
        radius: req.body.radius,
        interval: {
          from: req.body.from,
          to: req.body.to
        }
      });

      poi.save(function(err) {
        if (err) {
          errToSend = {
            success: false,
            err: err,
            msg: 'Error while salving the poi.'
          };
          console.log(error(err),error(errToSend));

          return res.json(errToSend);

        } else {
          msgToSend = {
            success: true,
            msg: 'Poi successfully created.'
          };
          console.log(notice("New poi created"),notice(JSON.stringify(msgToSend)));
          res.json(msgToSend);
        }
      });

    });

    // When a business user requires the list of pois
    app.get("/api/pois", passport.authenticate('jwt', {session: false}), checkAuth, function(req, res, next){
      console.log(req)
      // If admin return all the pois
      if(req.user.type === "admin"){
        Poi.find(function(err, pois){
          if (err) throw err;
          else {
            res.json({success: true, data: pois});
          }
        });
      }else {
        // If business user, return only the related pois
        Poi.find({"sender": req.user.email}, function(err, pois){
          if (err) throw err;
          else {
            res.json({success: true, data: pois});
          }
        });
      }

    });

    // When a business user requires the list of pois
    app.get("/api/users", passport.authenticate('jwt', {session: false}), checkAuth, function(req, res, next){
      console.log(req)
      // If admin return all the pois
      if(req.user.type === "admin"){
        User.find(function(err, users){
          if (err) throw err;
          else {
            res.json({success: true, data: users});
          }
        });
      }else {
        // If business user or customer, return only his/her profile
        User.findOne({
          _id: req.body.email

        }, function(err, user){
          if (err) throw err;
          else {
            res.json({success: true, data: user});
          }
        });

      }

    });
    // Route to authenticate a user (POST http://localhost:8080/api/authenticate)
    app.post('/api/authenticate', function(req, res) {
      console.log(warn("»   /api/authenticate called. Request Body is: \n"+JSON.stringify(req.body)));
      User.findOne({
        _id: req.body.email,
        pass: req.body.pass

      }, function(err, user) {
        if (err) throw err;
        if (user) {
          console.log(notice("User correct!\n"), notice(user));
          // if user is found and password is right create a token
          var token = jwt.encode(user, config.secret);
          // return the information including token as JSON
          msgToSend = {
            success: true,
            token: 'JWT ' + token
          };
          console.log(notice("Got Token!\n"),notice(JSON.stringify(msgToSend)));
          res.json(msgToSend);
        } else {
          errToSend = {
            success: false,
            msg: 'Authentication failed. User not found.'
          };
          console.log(error(JSON.stringify(errToSend)));
          res.send(errToSend);

        }
      });
    });

    // User registration
    app.post('/api/signup', function(req, res) {

      console.log(warn("»   /api/signup called. Request Body is: \n" + JSON.stringify(req.body)));

      if (!req.body.email || !req.body.pass || !req.body.name || !req.body.lastname) {
        errToSend = {
          success: false,
          msg: 'Please insert at least email, password, name and surname'
        };
        console.info(warn("Error email/pass/name/surname"),warn(errToSend));
        res.json(errToSend);
      } else {
        // Create a new user
        var newUser = new User({
          _id: req.body.email,
          given_name: req.body.name,
          family_name: req.body.lastname,
          pass: req.body.pass,
          sex: req.body.sex,
          type: "business"
        });
        // save the user
        newUser.save(function(err) {
          if (err) {
            errToSend = {
              success: false,
              err: err,
              msg: 'The triple Name, Surname and Email already exists.'
            };
            console.log(error(err),error(errToSend));

            return res.json(errToSend);

          } else {
            msgToSend = {
              success: true,
              msg: 'User successfully created.'
            };
            console.log(notice("New user created"),notice(JSON.stringify(msgToSend)));
            res.json(msgToSend);
          }
        });
      }
    });

    // // Otherwise return the index.html
    // app.get('*', function (req, res) {
    //   // console.log(res)
    //   res.sendFile(__dirname + '/client/index.html'); // load the single view file (angular will handle the page changes on the front-end)
    // });
};
