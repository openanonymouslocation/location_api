### OpenAnonymousLocation API

**Share your geolocations**

![alt text](http://openanonymouslocation.org/img/logov5_64x64.png "OpenAnonymousLocation")

##### [OpenAnonymousLocation.org](http://openanonymouslocation.org)

The OpenAnonymousLocation API provide you methods to publish and request geolocations

## Features

#### Methods:

- `/locations/insertCSV` - POST: Insert array JSON from CSV

    Mandatory body parameter:
    `geolocations`

    Sample Array JSON:
```
  [
  { id: 13,
    device: 'b2cda548-afaf-4073-9a53-4ed8bab7ea76',
    session: '9f869b70-1e21-4b7e-84c4-07f68b95e589',
    lat: 41.40578461,
    lon: 2.20155716,
    timestamp: 1514737185665 }
  ]
```

- `/locations/getDownload` - Get all Points

- `/locations/getByDevice/{device}`- Get points by device

    Mandatory parameter:

    `device` - Device ID

    Optional parameters:

     `bbox` - xmin,ymin,xmax,ymax

     `dateBefore` - Milliseconds

     `dateAfter` - Milliseconds

     `format` - JSON || GEOJSON

- `/locations/getByBBOX/{bbox}` - Get points by bounding box

    Mandatory parameter:

     `bbox` - xmin,ymin,xmax,ymax

    Optional parameters:   

    `device` - Device ID

    `dateBefore` - Milliseconds

    `dateAfter` - Milliseconds

    `format` - JSON || GEOJSON

- `/locations/insertLocations/{device}` - Insert a geolocation

    Mandatory parameters:

    `device` - Device ID

    `session` - Session ID

    `lat` - Latitude

    `lon` - Longitude

    `timestamp` - Milliseconds

#### Sample requests
[http://openanonymouslocation.org/api/v1/getByDevice/demo-openanonymouslocation-web](http://openanonymouslocation.org/api/v1/getByDevice/demo-openanonymouslocation-web)
[http://openanonymouslocation.org/api/v1/getByBBOX/2.0370411872863774,41.374828065836084,2.060623168945313,41.38126849498621/](http://openanonymouslocation.org/api/v1/getByBBOX/2.0370411872863774,41.374828065836084,2.060623168945313,41.38126849498621/)



## Documentation

Please refer to our extensive [API documentation](http://openanonymouslocation.org/api.html) for more information.

## Installation

To develope and install your own API instance

- Install [NodeJS](https://nodejs.org/)
- Clone the project
  ```
  git clone https://github.com/openanonymouslocation/location_api.git

  cd location_api

  npm install

  ```
- Setup a MySQL Database

  ```
  CREATE TABLE IF NOT EXISTS `geolocations` (
   `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY ,
    `device` VARCHAR( 60 ) NOT NULL ,
    `session` VARCHAR( 60 ),
    `lat` FLOAT( 12, 8 ) NOT NULL ,
    `lon` FLOAT( 12, 8 ) NOT NULL,
    `timestamp` BIGINT( 20 ) NOT NULL ,
    UNIQUE KEY `geolocation_id_unique` (`id`)
    ) ENGINE = InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci AUTO_INCREMENT=1;

  ```
- Setup *config.properties* with database connection

  ```
  {
  "pathMainWeb":"api",
  "conn":{
    "host": "localhost",
    "user": "user",
    "password": "XXXXXXXXX",
    "database": "geolocations"
    }
    }

  ```

- Test API

  http://locathost/test/


## License
Code released under the [MIT](https://github.com/BlackrockDigital/startbootstrap-new-age/blob/gh-pages/LICENSE) license.
