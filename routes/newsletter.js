const express = require("express");
const router = express.Router();
const { subscribe, unsubscribe } = require("../controllers/newsletterController");

router.post("/", subscribe);
router.get("/unsubscribe", unsubscribe);

module.exports = router;
