const fs = require('fs');
const os = require('os');
//var uuid = require('uuid');
const request = require("request");
const csv = require("fast-csv");
const express = require('express');
const mysql = require('mysql');
const converter = require('json-2-csv');
const isCoordinates = require('is-coordinates');
const router = express.Router();
const fileProp = 'config.properties';
const _platform = os.type();
/*if (_platform.indexOf('Windows') != -1) {
  fileProp = 'config.test'
};*/
var _f = JSON.parse(fs.readFileSync(fileProp, 'utf8'));
var connection;
var pool;

if(!_f.conn.password){
  pool = mysql.createPool({
    connectionLimit: 100, //important
    host: _f.conn.host,
    user: _f.conn.user,
    //  password: _f.conn.password,
    database: _f.conn.database
  });
}else{
  pool = mysql.createPool({
    connectionLimit: 100, //important
    host: _f.conn.host,
    user: _f.conn.user,
    password: _f.conn.password,
    database: _f.conn.database
  });
}

//connection =
function sentenceSQL(sql_sentence, type, format, callback) {
  callback = callback || function() {};
  return new Promise(function(resolve, reject) {
    var sql = sql_sentence;
    var resp;
    pool.getConnection(function(err, connection) {
      if (err) {
        resp = {
          "Error": true,
          "Message": "Error in connection database",
          "debug": err
        };
        reject(resp);
        return callback(resp);
      }
      connection.query(sql, function(err, rows) {
        connection.release();
        if (!err) {
          if (type == 1) { //insert
            resp = {
              "Error": false,
              "Message": "Geolocation Added !"
            };
          } else { //select
            if (format == "CSV") {
              resp = rows;
            } else if (format == "JSON"){
              resp = rows;
            } else {
              var geoJSON = {
                "type": "FeatureCollection",
                "features": []
              }
              for (var i = 0; i < rows.length; i++) {
                geoJSON.features.push({
                  "type": "Feature",
                  "properties": {
                    "id": rows[i].id,
                    "device": rows[i].device,
                    "session": rows[i].session,
                    "lat": rows[i].lat,
                    "lon": rows[i].lon,
                    "timestamp": rows[i].timestamp,
                    "accuracy":rows[i].accuracy,
                    "provider":rows[i].provider,
                    "locationProvider":rows[i].locationProvider,
                    "speed":rows[i].speed,
                    "altitude":rows[i].altitude
                  },
                  "geometry": {
                    "type": "Point",
                    "coordinates": [
                      rows[i].lon,
                      rows[i].lat
                    ]
                  }
                });
              } //fi for
              resp = geoJSON;
            }
          }
          resolve(resp);
          return callback(null, resp);
        } else {
          resp = {
            "Error": true,
            "Message": "Error executing SQL query",
            "debug": err
          };
          reject(resp);
          return callback(resp);
        }
      });
    }); //End getconnection
  });
};

module.exports.testConn = function(req, res) {
  try {
    pool.getConnection(function(err, connection) {
      if (err) {
        resp = {
          "Error": true,
          "Message": "Error in connection database",
          "debug": err
        };
        res.send(resp);
      }else{
        resp = {
          "Error": false,
          "Message": "Connection OK",
          "debug": err
        };
  res.send(resp);
      }
    });
  } catch (err) {
    resp = {
      "Error": true,
      "Message": "Error to insert",
      "debug": err
    };
    res.send(resp);
  }
};

module.exports.getDownload = function(req, res) {
  var format = req.query.device || req.body.device;
  var sql_sentence = "SELECT * FROM geolocations";
  sentenceSQL(sql_sentence, 0, 'CSV').then(function(resolve) {
    if (resolve) {
      res.setHeader('Content-disposition', 'attachment; filename=geolocations.csv');
      res.set('Content-Type', 'text/csv');
      var options = {
        DELIMITER: {
          FIELD: ';',
          ARRAY: '/',
          EOL: '\n'
        },
        PARSE_CSV_NUMBERS: false
      };
      converter.json2csv(resolve, function(err, csv) {
        if (err) {
          throw err;
        }
        res.status(200).send(csv);
      }, options);
    } else {
      res.header('Content-type', 'application/json');
      res.header('Charset', 'utf8');
      res.jsonp(reject);
    }
  }).catch(function(reject) {
    res.header('Content-type', 'application/json');
    res.header('Charset', 'utf8');
    res.jsonp(reject);
  });
};

module.exports.getByBBOX = function(req, res) {
  res.header('Content-type', 'application/json');
  res.header('Charset', 'utf8');
  var bbox = req.params.bbox || req.query.bbox; //mandatory
  var device = req.query.device || req.body.device;
  var dateBefore = req.query.dateBefore || req.body.dateBefore;
  var dateAfter = req.query.dateAfter || req.body.dateAfter;
  var format = req.query.format || 'JSON';
  var sqlFilter = "";
  try {
    if (bbox && bbox.indexOf(',') != -1) {
      if (dateBefore) {
        sqlFilter = sqlFilter + " AND timestamp <= " + dateBefore;
      }
      if (dateAfter) {
        sqlFilter = sqlFilter + " AND timestamp >= " + dateAfter;
      }
      if (device) {
        sqlFilter = sqlFilter + " AND device = " + device;
      }
      format = format.toUpperCase();

      var _bbox = bbox.split(',');
      var sqlBBOX = " lon >= " + parseFloat(_bbox[0]).toFixed(8) + " AND lon <= " + parseFloat(_bbox[2]).toFixed(8) + " AND lat >= " + parseFloat(_bbox[1]).toFixed(8) + " AND lat <= " + parseFloat(_bbox[3]).toFixed(8);

      var sql_sentence = "SELECT * FROM geolocations WHERE " + sqlBBOX + " " + sqlFilter;
      sentenceSQL(sql_sentence, 0, format).then(function(resolve) {
        if (resolve) {
          res.jsonp(resolve);
        } else {
          res.jsonp(reject);
        }
      }).catch(function(reject) {
        res.jsonp(reject);
      });
    } else {
      res.jsonp({
        "Error": true,
        "Message": "Missing or null parameter"
      });
    }
  } catch (err) {
    res.jsonp({
      "Error": true,
      "Message": "Missing or null parameter",
      "debug": err
    })
  }
};

module.exports.getDownloadByDevice  = function(req, res) {
  var bbox = req.query.bbox || req.body.bbox;
  var device = req.params.device || req.query.device; //mandatory
  var dateBefore = req.query.dateBefore || req.body.dateBefore;
  var dateAfter = req.query.dateAfter || req.body.dateAfter;
  var format = 'CSV';
  res.header('Content-type', 'application/json');
  res.header('Charset', 'utf8');
  try {
    if (device) {

      sql_sentence = getByDeviceQuery(device, dateBefore, dateAfter, bbox, null);
      format = format.toUpperCase();
      sentenceSQL(sql_sentence, 0, format).then(function(resolve) {
        if (resolve) {
          res.setHeader('Content-disposition', 'attachment; filename=geolocations.csv');
          res.set('Content-Type', 'text/csv');
          var options = {
            DELIMITER: {
              FIELD: ';',
              ARRAY: '/',
              EOL: '\n'
            },
            PARSE_CSV_NUMBERS: false
          };
          converter.json2csv(resolve, function(err, csv) {
            if (err) {
              throw err;
            }
            res.status(200).send(csv);
          }, options);
        } else {
          res.jsonp(reject);
        }
      }).catch(function(reject) {
        res.jsonp(reject);
      });
    } else {
      res.jsonp({
        "Error": true,
        "Message": "Missing or null parameter"
      });
    }
  } catch (err) {
    res.jsonp({
      "Error": true,
      "Message": "Missing or null parameter",
      "debug": err
    })
  }
};

module.exports.getLastPositionByDevice  = function(req, res) {
  res.header('Content-type', 'application/vnd.geo+json');
  res.header('Charset', 'utf8');
  var device = req.params.device || req.query.device; //mandatory
  var format = req.query.format || 'GEOJSON';
  try {
    if (device) {
      sql_sentence = getByDeviceQuery(device, null, null, null, true);
      format = format.toUpperCase();
      sentenceSQL(sql_sentence, 0, format).then(function(resolve) {
        if (resolve) {
          res.jsonp(resolve);
        } else {
          res.jsonp(reject);
        }
      }).catch(function(reject) {
        res.jsonp(reject);
      });
    } else {
      res.jsonp({
        "Error": true,
        "Message": "Missing or null parameter"
      });
    }
  } catch (err) {
    res.jsonp({
      "Error": true,
      "Message": "Missing or null parameter",
      "debug": err
    })
  }
};

module.exports.getByDevice = function(req, res) {
  res.header('Content-type', 'application/vnd.geo+json');
  res.header('Charset', 'utf8');
  var bbox = req.query.bbox || req.body.bbox;
  var device = req.params.device || req.query.device; //mandatory
  var dateBefore = req.query.dateBefore || req.body.dateBefore;
  var dateAfter = req.query.dateAfter || req.body.dateAfter;
  var format = req.query.format || 'GEOJSON';
  try {
    if (device) {
      sql_sentence = getByDeviceQuery(device, dateBefore, dateAfter, bbox, null);
      format = format.toUpperCase();
      sentenceSQL(sql_sentence, 0, format).then(function(resolve) {
        if (resolve) {
          res.jsonp(resolve);
        } else {
          res.jsonp(reject);
        }
      }).catch(function(reject) {
        res.jsonp(reject);
      });
    } else {
      res.jsonp({
        "Error": true,
        "Message": "Missing or null parameter"
      });
    }
  } catch (err) {
    res.jsonp({
      "Error": true,
      "Message": "Missing or null parameter",
      "debug": err
    })
  }
}

function getByDeviceQuery(device, dateBefore, dateAfter, bbox, last){
  var sqlFilter = "";
  if (dateBefore) {
    sqlFilter = sqlFilter + " AND timestamp <= " + dateBefore;
  }
  if (dateAfter) {
    sqlFilter = sqlFilter + " AND timestamp >= " + dateAfter;
  }
  if (bbox && bbox.indexOf(',') != -1) {
    var _bbox = bbox.split(',');
    sqlFilter = sqlFilter + " AND lon >= " + parseFloat(_bbox[0]).toFixed(8) + " AND lon <= " + parseFloat(_bbox[2]).toFixed(8) + " AND lat >= " + parseFloat(_bbox[1]).toFixed(8) + " AND lat <= " + parseFloat(_bbox[3]).toFixed(8);
  }
  if(last){
    sqlFilter = sqlFilter + " order by id DESC LIMIT 1";
  }
  var sql_sentence = "SELECT * FROM geolocations WHERE device= '" + device + "' " + sqlFilter;
  return sql_sentence;
}

module.exports.insertLocations = function(req, res) {
  res.header('Content-type', 'application/json');
  res.header('Charset', 'utf8');
  var insertLocations = {};
  var device = req.params.device || req.body.device;
  var session = req.params.session || req.body.session;
  var lat = req.params.lat || req.body.lat;
  var lon = req.params.lon || req.body.lon;
  var timestamp = req.params.timestamp || req.body.timestamp;
  var accuracy = req.params.accuracy || req.body.accuracy;
  var provider = req.params.provider || req.body.provider;
  var locationProvider = req.params.locationProvider || req.body.locationProvider;
  var speed = req.params.speed || req.body.speed;
  var altitude = req.params.altitude || req.body.altitude;
  
  var values = [];

  if (device && lat && lon && timestamp && session) {
    lat = parseFloat(parseFloat(lat).toFixed(8));
    lon = parseFloat(parseFloat(lon).toFixed(8));

    if (isCoordinates([lon,lat])) {
      values.push([device, session, lat, lon, timestamp, accuracy, provider, locationProvider, speed, altitude]);
      insertDBLocation(values).then(function(resp){
        res.jsonp(resp);
      });
    }
    else {
      res.jsonp({
        "Error": true,
        "Message": "Invalid coordinates"
      });
    }
  } else {
    res.jsonp({
      "Error": true,
      "Message": "Missing or null parameter"
    });
  }
};

module.exports.insertJSON = function(req, res) {
   /*
  { id: 13,
    device: 'b2cda548-afaf-4073-9a53-4ed8bab7ea76',
    session: '9f869b70-1e21-4b7e-84c4-07f68b95e589',
    lat: 41.40578461,
    lon: 2.20155716,
    timestamp: 1514737185665,
    accuracy: 11 }
...
  */
  try {
    var data = req.body.geolocations;
    var values = [];
    var errorValues = [];
    var resp = {};
    data = JSON.parse(data);
    data.forEach(function(items) {
      items.lat = parseFloat(parseFloat(items.lat).toFixed(8));
      items.lon = parseFloat(parseFloat(items.lon).toFixed(8));
      if (isCoordinates([items.lon,items.lat])) {
        values.push([items.device, items.session, items.lat, items.lon, items.timestamp, items.accuracy, items.provider, items.locationProvider, items.speed, items.altitude]);
      }
      else {
        errorValues.push([items.device, items.session, items.lat, items.lon, items.timestamp, items.accuracy, items.provider, items.locationProvider, items.speed, items.altitude]);
      }
    });

    insertDBLocation(values).then(function(resp){
      if (errorValues.length>0){
        var total = data.length;
        var ninserted = total - errorValues.length;
        resp = {
          "Error": true,
          "Message": `${ninserted} geolocalizations of ${total} have been inserted`
        };
      }
      res.jsonp(resp);
    });
  } catch (err) {
    resp = {
      "Error": true,
      "Message": "Error to insert",
      "debug": err
    };
    res.jsonp(resp);
  }
}

function insertDBLocation(values){
  var sql = "INSERT INTO geolocations (device,session,lat,lon,timestamp,accuracy,provider,locationProvider,speed,altitude) VALUES ?";
  return new Promise(function(resolve, reject){
    pool.getConnection(function(err, connection) {
      if (err) {
        resp = {
          "Error": true,
          "Message": "Error in connection database",
          "debug": err
        };
        resolve(resp);
      }
      connection.query(sql, [values], function(err) {
        connection.release();
        if (err) {
          resp = {
            "Error": true,
            "Message": "Error in connection database",
            "debug": err
          };
          resolve(resp);
        } else {
          resp = {
            "Error": false,
            "Message": "Geolocations Added!"
          };
          resolve(resp);
        }
      });
    });
  });
}
