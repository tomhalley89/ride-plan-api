"use strict";

var Errors = require("../../common/Errors"),
    UserRepository = require("../repositories/UserRepository"),
    ConfigProvider = require("../../common/ConfigProvider"),
    Config = ConfigProvider.getConfig(),
    SessionService = require("../services/SessionService"),
    https = require('https'),
    Q = require("q");

var FacebookService = {
    verifyAccessToken: function(accessToken) {
        var deferred = Q.defer();

        if(accessToken === null || accessToken === undefined) {
            deferred.reject(new Errors.AppError("Parameter 'accessToken' was not defined"));
        }

        //2. Verify User Access Token
        var options = {
            host: "graph.facebook.com",
            port: 443,
            method: "GET",
            path: "/debug_token" +
            "?input_token=" + accessToken +
            "&access_token=" + ConfigProvider.getFacebookAppToken()
        };

        https.get(options, function(res) {
            res.setEncoding('utf8');
            res.on('data', function(result) {
                result = JSON.parse(result);

                // If data contains error...
                if(result.error !== undefined) {
                    deferred.reject(new Errors.HttpUnauthorised(result.error.message));
                } else if (result.data === undefined) {
                    deferred.reject(new Errors.AppError("No Data returned from API"));
                } else {
                    if (result.data.app_id != Config.facebook.app_id) {
                        deferred.reject(new Errors.AppError("What? The API responded with someone elses APP Id"));
                    } else if (result.data.is_valid !== true) {
                        deferred.reject(new Error("For some reason the response says the AccessToken is not valid :("));
                    } else {
                        deferred.resolve(true);
                    }
                }
            });
        }).on('error', function(e) {
            deferred.reject(e);
        });

        return deferred.promise;
    },
    getUserDetails: function(accessToken) {
        var deferred = Q.defer();

        if(accessToken === null || accessToken === undefined) {
            deferred.reject(new Errors.AppError("Parameter 'accessToken' was not defined"));
        }

        var options = {
            host: "graph.facebook.com",
            port: 443,
            method: "GET",
            path: "/me" +
            "?access_token=" + accessToken
        };

        https.get(options, function(res) {
            res.setEncoding('utf8');
            res.on('data', function(userData) {
                deferred.resolve(JSON.parse(userData));
            });

            res.on('error', function(err) {
                deferred.reject(new Errors.AppError(err.message));
            });
        });

        return deferred.promise;
    },
    authenticate: function(accessToken, fbUserId) {
        return FacebookService.verifyAccessToken(accessToken)
            .then(function() {
                return UserRepository.findUserByFacebookId(fbUserId);
            })
            .then(function (user) {
                if (user === null) {
                    return FacebookService.getUserDetails(accessToken)
                        .then(function (userData) {
                            return UserRepository.createUser(userData.id, userData.name, userData.email);
                        });
                } else {
                    return user;
                }
            })
            .then(function(user) {
                return SessionService.sessionizeUser(user);
            })
            .then(function(session) {
                return session.token;
            });
    }
};

module.exports = FacebookService;