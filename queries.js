// source code: http://mherman.org/blog/2016/03/13/designing-a-restful-api-with-node-and-postgres/#.WOK8RvkrJPb

var promise = require('bluebird'); // http://bluebirdjs.com/docs/getting-started.html
var pgp = require('pg-promise')(options); // https://github.com/vitaly-t/pg-promise

var options = {
  promiseLib: promise // initialization options
};

var connectionString = process.env.DATABASE_URL || 'postgres://postgres:january2017*@localhost:5432/inventory'; // Heroku postgres OR local host postgres inventory database
var db = pgp(connectionString); // using pg-promise, create database with connection details

function getAddForm(req, res, next){
  res.render('add');
}

function getUpdateForm(req, res, next){
  res.render('update');
}

// function gets data based on user input (e.g., all, )
function api(req, res, next){
  var user_input = req.params.id.toLowerCase(),
      query = ""; // store the user's input

  if (user_input == 'all') {
    query = 'select * from standards';
  } else {
    query = 'select * from standards where lower(name) || lower(category) like \'%$1#%\'';
  }

  db.task(t => {
    db.each(query, user_input, row => {
      for (var column in row) {
        if (row[column] == '' || row[column] == null || row[column].toLowerCase() == 'unsure' || row[column] == undefined || row[column].toLowerCase() == 'null' || row[column].toLowerCase() == 'n/a') {
          row[column] = 'No information';
        }
      }
    }) //category::text, name::text like "%$1%"
      .then(function (data) {
        res.status(200)
        .json({
          data: data
        });
      })
      .catch(function (err) {
        return next(err);
      });
  });
}

// function gets all categories and standard names for the autocomplete 
function keywords(req, res, next){
  var query = 'select lower(name) as name, lower(category) as category from standards',
      keywords = [];
  db.task(t => {
    db.each(query, [], row =>{
      keywords.push(row.name, row.category);
    })
      .then(function () {
        res.send({keywords: keywords});
      })
      .catch(function (err) {
        return next(err);
      });
  });
}

// function gets data based on user input (e.g., all, )
function getData(req, res, next){
  var user_input = req.params.id.toLowerCase(),
      query = ""; // store the user's input

  if (user_input == 'all') {
    query = 'select * from standards';
  } else {
    query = 'select * from standards where lower(name) || lower(category) like \'%$1#%\'';
  }

  db.task(t => {
    db.each(query, user_input, row => {
      for (var column in row) {
         if (row[column] == '' || row[column] == null || row[column].toLowerCase() == 'unsure' || row[column] == undefined || row[column].toLowerCase() == 'null' || row[column].toLowerCase() == 'n/a') {
          row[column] = 'No information';
        } 
      }
    }) //category::text, name::text like "%$1%"
      .then(function (data) {
        res.render('directory', {standards: data})

      })
      .catch(function (err) {
        return next(err);
      });
  });
}

// Express middleware: function that will post any update or comment requests to postgres database
function post(req, res, next) {
  var data = {client_name: req.body.client_name, email: req.body.email, standard: req.body.email, comment: req.body.email, timestamp: req.body.timestamp}
  db.none('insert into posts(client_name, email, standard, comment, timestamp) values(${client_name}, ${email}, ${standard}, ${comment}, ${timestamp})', data)
    .then(function () {
      res.status(200)
        .json({
          status: 'successfully added post',
          message: 'Inserted post',
          data: data
        });
    })
    .catch(function (err) {
      return next(err);
    });
}

// Express middleware: function that will post a new row into the postgres database
function createStandard(req, res, next) {
  var data = {name: req.body.name, category: req.body.category, description: req.body.description, license: req.body.license, updated: req.body.update, version: req.body.version, stage_in_development: req.body.stage_in_development, documentation: req.body.documentation, website: req.body.website, contact: req.body.contact, example: req.body.example, publisher: req.body.publisher, publisher_reputation: req.body.publisher_reputation, number_of_consumers: req.body.number_of_consumers, consumers: req.body.consumers, number_of_apps: req.body.number_of_apps, apps: req.body.apps, open: req.body.open, transferability: req.body.transferability, transferability_rationale: req.body.transferability_rationale, stakeholder_participation: req.body.stakeholder_participation, stakeholder_participation_rationale: req.body.stakeholder_participation_rationale, consensus_government: req.body.consensus_government, consensus_government_rationale: req.body.consensus_government_rationale, extensions: req.body.extensions, extensions_indicators: req.body.extensions_indicators, machine_readable: req.body.machine_readable, machine_readable_rationale: req.body.machine_readable_rationale, human_readable: req.body.human_readable, human_readable_rationale: req.body.human_readable_rationale, requires_realtime: req.body.requires_realtime, requires_realtime_rationale: req.body.requires_realtime_rationale, metadata: req.body.metadata, metadata_rationale: req.body.metadata_rationale, recorded: req.body.recorded, verified: req.body.verified}
  db.none('insert into standards(name, category, description, license, updated, version, stage_in_development, documentation, website, contact, example, publisher, publisher_reputation, number_of_consumers, consumers, number_of_apps, apps, open, transferability, transferability_rationale, stakeholder_participation, stakeholder_participation_rationale, consensus_government, consensus_government_rationale, extensions, extensions_indicators, machine_readable, machine_readable_rationale, human_readable, human_readable_rationale, requires_realtime, requires_realtime_rationale, metadata, metadata_rationale, recorded, verified) values(${name}, ${category}, ${description}, ${license}, ${updated}, ${version}, ${stage_in_development}, ${documentation}, ${website}, ${contact}, ${example}, ${publisher}, ${publisher_reputation}, ${number_of_consumers}, ${consumers}, ${number_of_apps}, ${apps}, ${open}, ${transferability}, ${transferability_rationale}, ${stakeholder_participation}, ${stakeholder_participation_rationale}, ${consensus_government}, ${consensus_government_rationale}, ${extensions}, ${extensions_indicators}, ${machine_readable}, ${machine_readable_rationale}, ${human_readable}, ${human_readable_rationale}, ${requires_realtime}, ${requires_realtime_rationale}, ${metadata}, ${metadata_rationale}, ${recorded}, ${verified})', data)
    .then(function () {
      res.status(200)
        .json({
          status: 'successfully added standard',
          message: 'Inserted ONE standard'
        });
    })
    .catch(function (err) {
      return next(err);
    });
}

// add query functions to app 
module.exports = {
  getData: getData,
  createStandard: createStandard,
  post: post,
  getAddForm: getAddForm,
  getUpdateForm: getUpdateForm,
  keywords: keywords,
  api: api
};
