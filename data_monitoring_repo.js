'use strict';

const q = require('q');
const Models = require('../models');
const config = require('../config');
const Patient = require('../../common/models/patient');
const uuid = require('node-uuid');
const TestDataLoader = require('./test-data-loader');

/*
DESCRIPTION
This is a file that interfaces directly with a MSSQL database and uses 
sequelize to turn the table objects into usable models
*/

class MonitoringRepo {
  constructor() {
  }

  getAdtById(adtId) {
    let defer = q.defer();
    if (adtId === null || adtId === 0) {
      defer.resolve(null);
    } else {
      Models.Adt.find({
        where: {
          Id: adtId
        }
      }).then(function (adtModel) {
        defer.resolve(adtModel);
      }, function (e) {
        defer.reject(e);
      });
    }
    return defer.promise;
  }

  // same as addOrUpadatAdt, except it always create new Adt record and doesn't update existing record
  addAdt(adt) {
    return Models.adt.create({
      TransferType: adt.TransferType,
      TransferDt: (adt.TransferDt === null) ? new Date() : adt.TransferDt,
      PatientGuid: adt.PatientGuid,
      ToBed: adt.ToBed,
      FromBed: adt.FromBed
    });
  }

  addOrUpdateAdt(adt) {
    return this.getAdtById(adt.adtId).then(function (adtModel) {
      if (adtModel && adtModel.dataValues) {
        return adtModel.update({
          TransferType: adt.TransferType,
          TransferDt: (adt.TransferDt === null) ? new Date() : adt.TransferDt,
          PatientGuid: adt.PatientGuid,
          ToBed: adt.ToBed,
          FromBed: adt.FromBed
        });
      } else {
        return Models.adt.create({
          TransferType: adt.TransferType,
          TransferDt: (adt.TransferDt === null) ? new Date() : adt.TransferDt,
          PatientGuid: adt.PatientGuid,
          ToBed: adt.ToBed,
          FromBed: adt.FromBed
        });
      }
    });
  }

  getEventById(eventId) {
    let defer = q.defer();
    if (eventId === null) {
      defer.resolve(null);
    } else {
      Models.Event.find({
        where: {
          EventId: eventId
        }
      }).then(function (eventModel) {
        defer.resolve(eventModel);
      }, function (e) {
        defer.reject(e);
      });
    }
    return defer.promise;
  }

  addEvent(evnt) {
    return Models.Event.create({
      EventId: evnt.EventId,
      EventType: evnt.EventType,
      EventValue: evnt.EventValue,
      EventText: evnt.EventText,
      EventStartDt: (evnt.EventStartDt === null) ? new Date() : evnt.EventStartDt,
      EventEndDt: (evnt.EventEndDt === null) ? new Date() : evnt.EventEndDt,
      PatientMrn: evnt.PatientMrn,
      OriginalGuid: (evnt.OriginalGuid === null || evnt.OriginalGuid === '') ? evnt.PatientMrn : evnt.OriginalGuid,
      EventCriticality: evnt.EventCriticality,
      EventDevice: evnt.EventDevice,
      EventOrgans: evnt.EventOrgans,
      EventSystem: evnt.EventSystem,
      UnitBedUID: evnt.UnitBedUID
    });
  }

  addOrUpdateEvent(evnt) {
    return this.getEventById(evnt.eventId).then(function (eventModel) {
      if (eventModel && eventModel.dataValues) {
        return eventModel.update({
          EventId: evnt.EventId,
          EventType: evnt.EventType,
          EventValue: evnt.EventValue,
          EventText: evnt.EventText,
          EventStartDt: (evnt.EventStartDt === null) ? new Date() : evnt.EventStartDt,
          EventEndDt: (evnt.EventEndDt === null) ? new Date() : evnt.EventEndDt,
          PatientMrn: evnt.PatientMrn,
          OriginalGuid: (evnt.OriginalGuid === null || evnt.OriginalGuid === '') ? evnt.PatientMrn : evnt.OriginalGuid,
          EventCriticality: evnt.EventCriticality,
          EventDevice: evnt.EventDevice,
          EventOrgans: evnt.EventOrgans,
          EventSystem: evnt.EventSystem,
          UnitBedUID: evnt.UnitBedUID
        });
      } else {
        return Models.Event.create({
          EventId: evnt.EventId,
          EventType: evnt.EventType,
          EventValue: evnt.EventValue,
          EventText: evnt.EventText,
          EventStartDt: (evnt.EventStartDt === null) ? new Date() : evnt.EventStartDt,
          EventEndDt: (evnt.EventEndDt === null) ? new Date() : evnt.EventEndDt,
          PatientMrn: evnt.PatientMrn,
          OriginalGuid: (evnt.OriginalGuid === null || evnt.OriginalGuid === '') ? evnt.PatientMrn : evnt.OriginalGuid,
          EventCriticality: evnt.EventCriticality,
          EventDevice: evnt.EventDevice,
          EventOrgans: evnt.EventOrgans,
          EventSystem: evnt.EventSystem,
          UnitBedUID: evnt.UnitBedUID
        });
      }
    });
  }

  getEventsByPatientMrn(mrn, lastHours) {
    let defer=q.defer();
    if(mrn===null || mrn==='') {
      defer.resolve(null);
    } else {
      Models.Event.findAll({
        where: {
          PatientMrn: mrn,
          EventStartDt: {
            $gt: new Date(new Date() - lastHours * 60 * 60 *1000)
          }
        }
      }).then(function (eventArr) {
        defer.resolve(eventArr);
      }, function (e) {
        defer.reject(e);
      });
    }
    return defer.promise;
  }

  getAlarms(eventType, lastHours) {
    let defer=q.defer();
    if(eventType===null || eventType==='') {
      defer.resolve(null);
    } else {
      Models.Event.findAll({
        where: {
          EventType: eventType,
          EventStartDt: {
            $gt: new Date(new Date() - lastHours * 60 * 60 *1000)
          }
        }
      }).then(function (eventArr) {
        defer.resolve(eventArr);
      }, function (e) {
        defer.reject(e);
      });
    }
    return defer.promise;
  }

  getEventsByBedUnit(bedUID, lastHours) {
    let defer=q.defer();
    if(bedUID===null || bedUID==='') {
      defer.resolve(null);
    } else {
      Models.Event.findAll({
        where: {
          UnitBedUID: bedUID,
          EventStartDt: {
            $gt: new Date(new Date() - lastHours * 60 * 60 *1000)
          }
        }
      }).then(function (eventArr) {
        defer.resolve(eventArr);
      }, function (e) {
        defer.reject(e);
      });
    }
    return defer.promise;
  }

  getEventsByUnit(unit, lastHours) {
    let defer=q.defer();
    if(unit===null || unit==='') {
      defer.resolve(null);
    } else {
      Models.Event.findAll({
        where: {
          UnitBedUID: {
            $like: unit + '%'
          },
          EventStartDt: {
            $gt: new Date(new Date() - lastHours * 60 * 60 *1000)
          }
        }
      }).then(function (eventArr) {
        defer.resolve(eventArr);
      }, function (e) {
        defer.reject(e);
      });
    }
    return defer.promise;
  }

  /**
   * load initial data from test data from 'test/test-data.json'
   * @returns {null} - no return value
   */
  dbInitDataScript() {
    let testDataLoader = new TestDataLoader();
    testDataLoader.load(__dirname + '/../../../test/test-data.json');
  }

  up() {
    console.log('initializing database...');
    /*eslint-disable*/
    let dbSyncForce = (process.env.NODE_ENV === 'production') ? false : config.dbSyncForce;
    let dbInitData = (process.env.NODE_ENV === 'production') ? false : config.dbInitData;
    /*eslint-enable*/
    return Models.sequelize.sync({force: dbSyncForce}).then(() => {
      let defer = q.defer();
      setTimeout(() => {
        if (dbInitData) {
          this.dbInitDataScript();
        }
        defer.resolve();
      }, config.dbSyncDelay);
      return defer.promise;
    });
  }

  down() {
  }
}

module.exports = MonitoringRepo;
