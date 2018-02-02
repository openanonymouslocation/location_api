var express = require('express');
var appV1 = require('../models/appv1');
router = express.Router();

//router.all('/', appV1.getAll);
router.post('/insertJSON/', appV1.insertJSON);
router.post('/insertLocations/:device', appV1.insertLocations);
router.get('/getDownload/', appV1.getDownload);
router.get('/getDownload/:device', appV1.getDownloadByDevice);
router.get('/getLastPosition/:device', appV1.getLastPositionByDevice);
router.get('/getByDevice/:device', appV1.getByDevice);
router.get('/getByBBOX/:bbox', appV1.getByBBOX);
router.get('/testConn/', appV1.testConn);

var notImplimented = function (req, res) {
	res.send(501)
}

module.exports = router;
