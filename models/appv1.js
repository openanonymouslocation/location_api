var fs = require('fs');
var os = require('os');
//var uuid = require('uuid');
var request = require("request");
var csv = require("fast-csv");
var express = require('express');
var mysql = require('mysql');
var converter = require('json-2-csv');
var router = express.Router();
var fileProp = 'config.properties';
var _platform = os.type();
if (_platform.indexOf('Windows') != -1) {
  fileProp = 'config.test'
};
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
        console.info("entro");
        console.info(err);
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
            console.info(rows);

            if (format == "JSON") {
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
                    "id": 1,
                    "device": rows[i].device,
                    "session": rows[i].session,
                    "lat": rows[i].lat,
                    "lon": rows[i].lon,
                    "timestamp": rows[i].timestamp
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

} ;


module.exports.insertCSV = function(req, res) {

  /*
  { id: 13,
    device: 'b2cda548-afaf-4073-9a53-4ed8bab7ea76',
    session: '9f869b70-1e21-4b7e-84c4-07f68b95e589',
    lat: 41.40578461,
    lon: 2.20155716,
    timestamp: 1514737185665 }



  */
  try {
    var data = req.body.geolocations;
    var values = [];

    data = JSON.parse(data);
    data.forEach(function(items) {
      values.push([items.device, items.session, items.lat, items.lon, items.timestamp]);
    });

    var sql = "INSERT INTO geolocations (device,session,lat,lon,timestamp) VALUES ?";


    pool.getConnection(function(err, connection) {
      if (err) {

        resp = {
          "Error": true,
          "Message": "Error in connection database",
          "debug": err
        };
        res.jsonp(resp);
      }

      connection.query(sql, [values], function(err) {
        connection.release();
        if (err) {
          resp = {
            "Error": true,
            "Message": "Error in connection database",
            "debug": err
          };
          res.jsonp(resp);
        } else {
          resp = {
            "Error": false,
            "Message": "Geolocation Added !"
          };
          res.jsonp(resp);
        }

      });

    });

  } catch (err) {
    resp = {
      "Error": true,
      "Message": "Error to insert",
      "debug": err
    };
    res.jsonp(resp);

  }

};

module.exports.insertLocations = function(req, res) {
  res.header('Content-type', 'application/json');
  res.header('Charset', 'utf8');
  var insertLocations = {};
  var device = req.params.device || req.query.device;
  var session = req.params.session || req.query.session;
  var lat = req.params.lat || req.query.lat;
  var lon = req.params.lon || req.query.lon;
  var timestamp = req.params.timestamp || req.query.timestamp;

  if (device && lat && lon && timestamp && session) {
    lat = parseFloat(lat).toFixed(8);
    lon = parseFloat(lon).toFixed(8);

    var sql_sentence = "INSERT INTO geolocations (device,session,lat, lon, timestamp) VALUES ('" + device + "','" + session + "'," + lat + "," + lon + "," + timestamp + ")";

    console.info(sql_sentence);
    sentenceSQL(sql_sentence, 1, 'JSON').then(function(resolve) {
      if (resolve) {
        console.log(resolve);
        res.jsonp(resolve);
      } else {
        console.log(reject);
        res.jsonp(reject);
      }
    }).catch(function(reject) {
      console.log(reject);
      res.jsonp(reject);
    });




  } else {
    console.info("entrono");
    res.jsonp({
      "Error": true,
      "Message": "Missing or null parameter"
    });

  }



};


module.exports.getDownload = function(req, res) {
  var format = req.query.device || req.body.device;
  var sql_sentence = "SELECT * FROM geolocations";
  console.info(sql_sentence);
  sentenceSQL(sql_sentence, 0, 'JSON').then(function(resolve) {
    if (resolve) {
      res.setHeader('Content-disposition', 'attachment; filename=geolocations.csv');
      res.set('Content-Type', 'text/csv');
      console.log(resolve);
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
      console.log(reject);
      res.jsonp(reject);
    }
  }).catch(function(reject) {
    res.header('Content-type', 'application/json');
    res.header('Charset', 'utf8');
    console.log(reject);
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
  console.info(req.params);
  console.info(bbox);
  try {
    if (bbox && bbox.indexOf(',') != -1) {
      console.info(bbox);
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
      console.info(sql_sentence);
      sentenceSQL(sql_sentence, 0, format).then(function(resolve) {
        if (resolve) {
          res.jsonp(resolve);
        } else {
          res.jsonp(reject);
        }
      }).catch(function(reject) {
        console.log("reject");
        res.jsonp(reject);
      });
    } else {
      res.jsonp({
        "Error": true,
        "Message": "Missing or null parameter"
      });

    }


  } catch (err) {
    console.info(err);
    res.jsonp({
      "Error": true,
      "Message": "Missing or null parameter",
      "debug": err
    })

  }

};

module.exports.endpoint = function(req, res) {

};

module.exports.getByDevice = function(req, res) {
  res.header('Content-type', 'application/json');
  res.header('Charset', 'utf8');
  var bbox = req.query.bbox || req.body.bbox;
  var device = req.params.device || req.query.device; //mandatory
  var dateBefore = req.query.dateBefore || req.body.dateBefore;
  var dateAfter = req.query.dateAfter || req.body.dateAfter;
  var format = req.query.format || 'JSON';
  var sqlFilter = "";
  try {
    if (device) {

      if (dateBefore) {
        sqlFilter = sqlFilter + " AND timestamp <= " + dateBefore;
      }
      if (dateAfter) {
        sqlFilter = sqlFilter + " AND timestamp >= " + dateAfter;
      }
      format = format.toUpperCase();
      if (bbox && bbox.indexOf(',') != -1) {
        var _bbox = bbox.split(',');
        sqlFilter = sqlFilter + " AND lon >= " + parseFloat(_bbox[0]).toFixed(8) + " AND lon <= " + parseFloat(_bbox[2]).toFixed(8) + " AND lat >= " + parseFloat(_bbox[1]).toFixed(8) + " AND lat <= " + parseFloat(_bbox[3]).toFixed(8);
      }

      var sql_sentence = "SELECT * FROM geolocations WHERE device= '" + device + "' " + sqlFilter;
      console.info(sql_sentence);
      sentenceSQL(sql_sentence, 0, format).then(function(resolve) {
        if (resolve) {
          res.jsonp(resolve);
        } else {
          res.jsonp(reject);
        }
      }).catch(function(reject) {
        console.log("reject");
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
