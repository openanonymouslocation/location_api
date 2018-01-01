var express = require('express');
var appV1 = require('../models/appv1');
router = express.Router();

//router.all('/', appV1.getAll);
router.all('/insertCSV/', appV1.insertCSV);
router.all('/insertLocations/:device', appV1.insertLocations);
router.all('/getDownload/', appV1.getDownload);
router.all('/getByDevice/:device', appV1.getByDevice);
router.all('/getByBBOX/:bbox', appV1.getByBBOX);
router.all('/testConn/', appV1.testConn);

var notImplimented = function (req, res) {
	res.send(501)
}

module.exports = router;
