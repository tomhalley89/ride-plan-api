"use strict";

var EventRepository = require("../models/repositories/EventRepository"),
    ErrorHandler = require("../common/ErrorHandler"),
    Errors = require("../common/Errors"),
    SessionRepository = require("../models/repositories/SessionRepository"),
    EventService = require("../models/services/EventService"),
    ObjectId = require("mongoose").Types.ObjectId;

module.exports = {
    indexAction: function(req, res) {
        EventRepository.getEvents()
            .then(function(events) {
                res.status(200).json(events);
            })
            .fail(function(err) {
                ErrorHandler.handleError(res, err);
            });
    },
    eventAction: function(req, res) {
        if(req.params.id === undefined) {
            throw new Errors.HttpBadRequest("EventID was missing from request");
        }

        EventRepository.getEventById(req.params.id)
            .then(function(event) {
                if(event === null) {
                    throw new Errors.HttpNotFound("Event not found");
                }

                res.status(200).json(event);
            })
            .fail(function(err) {
                ErrorHandler.handleError(res, err);
            });
    },
    createAction: function(req, res) {
        if(req.body.data === undefined) {
            throw new Errors.HttpBadRequest("Body data was missing");
        }

        if(!EventService.validateEvent(req.body.data)) {
            throw new Errors.HttpBadRequest("Body data was invalid");
        }

        SessionRepository.findSessionByToken(req.headers.authorization)
            .then(function(session) {
                if(session === null) {
                    throw new Errors.HttpBadRequest("Invalid authorization token in header");
                }

                return EventRepository.createEvent(req.body.data, new ObjectId(session.user_id));
            })
            .then(function(event) {
                res.status(200).json(event);
            })
            .fail(function(err) {
                ErrorHandler.handleError(res, err);
            });
    },
    rsvpAction: function(req, res) {
        if(req.headers.authorization === undefined) {
            throw new Errors.HttpBadRequest("Authorization token missing");
        }

        if(req.params.id === undefined) {
            throw new Errors.HttpBadRequest("EventID was missing from request");
        }

        if(req.body.rsvpBool === undefined) {
            throw new Errors.HttpBadRequest("Rsvp Status missing from request");
        }

        SessionRepository.findSessionByToken(req.headers.authorization)
            .then(function(session) {
                if(session === null) {
                    throw new Errors.HttpBadRequest("Invalid authorization token in header");
                }

                return EventRepository.updateUserEventRsvp(session.user_id, req.params.id, req.body.rsvpBool);
            })
            .then(function() {
                res.status(200).json();
            })
            .fail(function(err) {
                ErrorHandler.handleError(res, err);
            });
    }
};