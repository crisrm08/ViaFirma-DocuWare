const express = require("express");
const router = express.Router();

const { recibirCallBackViaFirma } = require("../controllers/viafirma.controller");
router.post("/callback", recibirCallBackViaFirma);

module.exports = router;
