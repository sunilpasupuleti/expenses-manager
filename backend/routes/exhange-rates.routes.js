const express = require("express");
const router = express.Router();

const exchangeRatesCtrl = require("../controllers/exchange-rates");

router.post("/get-exchange-rates", exchangeRatesCtrl.getExchangeRates);
