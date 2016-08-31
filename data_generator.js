'use strict';

// Load Chance
const Chance = require('chance');

// Instantiate Chance so it can be used
let myseed = 999;
// use seed to make the generated random test data repeatable
let chance = new Chance(myseed);

let config = {
  numIcuUnit: 9,
  minNumBedsPerUnit: 0,
  maxNumBedsPerUnit: 50,
  numPatients: 1000,
  numEvents: 300
};

function dateInRange(startHour, endHour) {
  let date = new Date(Date.now());
  let hour = (chance.natural({ min: 0, max: 200})) * 24 | 0;
  date.setHours(hour);
  return date;
}

chance.mixin({
  patient: function () {
    let mrnPrefixOption = { length: 2, pool: 'ABCDEFGHJKLMNPQRSTUV' };
    let male = chance.bool();
    let dob = chance.birthday((chance.bool) ?
        { type: 'adult' } :
        { type: 'senior' });
    let patientModel = {
      Guid: chance.guid(),
      FirstName: chance.first((male) ?
        { gender: 'male' }
        : { gender: 'female' }),
      LastName: chance.last(),
      Gender: (male) ? 'M' : 'F',
      Dob: `${dob.getFullYear()}-${(dob.getMonth()<9)?'0'+(dob.getMonth()+1):(dob.getMonth()+1)}-${(dob.getDate()<10)?'0'+dob.getDate():dob.getDate()}T00:00:00.000Z`,
      Mrn: `${chance.string(mrnPrefixOption)}${chance.integer({ min: 1000000, max: 9999999 })}`,
      Race: `${chance.race()}`,
      Ethnicity: `${chance.ethnicity()}`
    };
    return patientModel;
  }
});

let json = {
  units: [],
  patients: [],
  beds: [],
  events: []
};


let assignedMrns = {};
for (let i = 0; i < config.numPatients; ++i) {
  let patient = null;
  do {
    patient = chance.patient();
  } while (assignedMrns[patient.Mrn]);
  assignedMrns[patient.Mrn] = true;
  json.patients.push(patient);
  // console.log(patient);
}
let assignedPatients = {};
for (let i = 0; i < json.units.length; ++i) {
  for (let j = 0; j < json.units[i].Beds.length; ++j) {
    let patientIdx = -1;
    do {
      patientIdx = chance.integer({min: 0, max: config.numPatients-1});
    } while (assignedPatients[patientIdx]);
    assignedPatients[patientIdx] = true;
    // console.log(`patientIdx = ${patientIdx}`);
    let patientGuid = json.patients[patientIdx].Guid;
    // console.log(`unit = ${i}  bed = ${j} bedCode = ${json.units[i].Beds[j]}`);
    let bed = {
      BedCode: json.units[i].Beds[j],
      PatientGuid: patientGuid
    };
    json.beds.push(bed);
  }
}

chance.mixin({
  evnt: function () {
    let optionsArr = ['Asystole 1 ECG Cardiovascular Warning', 'Vtach 1 ECG Cardiovascular Warning', 'Vfib 1 ECG Cardiovascular Warning', 'Apnea 2 ABP Pulmonary Warning', 'EcgLeads 4 ECG Cardiovascular Advisory', 'SpO2 3 PulseOx Cardiovascular Advisory', 'CVP 2 CVP Cardiovascular Advisory', 'ART 3 PA Cardiovascular Warning', 'Tachy 3 ECG Cardiovascular Warning', 'Brady 3 ECG Cardiovascular Warning', 'Couplet 4 ECG Cardiovascular Advisory', 'Bigeminy 4 ECG Cardiovascular Advisory', 'Artifact 4 PulseOx Cardiovascular Advisory', 'PVC 4 PulseOx Cardiovascular Warning', 'LeadII 4 ECG Cardiovascular Warning'];
    let alarmIdx = chance.natural({min: 0, max: 14});
    let alarmArr = optionsArr[alarmIdx].split(' ');
    let rIcu = chance.natural({min: 1, max: 6});
    let numBedsInUnit = json.units[rIcu].Beds.length;
    let rBed = chance.natural({min: 0, max: numBedsInUnit-1});
    let patientGuid = json.beds[rBed].PatientGuid;
    let patMrn = '';
    console.log(patMrn);
    for(let i = 0; i<json.patients.length; ++i) {
      if(json.patients[i].Guid === patientGuid) {
        patMrn = json.patients[i].Mrn;
      }
    }
    let evntModel = {
      EventId: chance.natural({min: 0, max: 10000}),
      EventType: 'Alarm',
      EventValue: alarmArr[0],
      EventText: optionsArr[alarmIdx],
      EventStartDt: dateInRange(),
      EventEndDt: dateInRange(),
      PatientMrn: patMrn,
      OriginalGuid: patMrn,
      EventCriticality: alarmArr[1],
      EventDevice: alarmArr[2],
      EventOrgans: alarmArr[3],
      EventSystem: alarmArr[4],
      UnitBedUID: json.beds[rBed].BedCode
    };
    return evntModel;
  }
});

for(let i = 0; i<config.numEvents; ++i) {
  let evnt = chance.evnt();
  evnt.EventId = i;
  json.events.push(evnt);
}

const fs = require('fs');
fs.writeFile('./test/test-data.json', JSON.stringify(json, null, 4), function (err) {
  if(err) {
    return console.log(err);
  }
  console.log('done');
  return 0;
});
