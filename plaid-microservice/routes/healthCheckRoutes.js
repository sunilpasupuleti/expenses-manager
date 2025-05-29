// routes/healthRoute.js
const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  return res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    message: "Plaid microservice is alive 🚀",
  });
});

module.exports = router;
