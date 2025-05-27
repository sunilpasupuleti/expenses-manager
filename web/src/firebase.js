// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCYikCEyB7fNW--TrLPa6Yrz5mjxYJsMl4",
  authDomain: "expensesmanager-da065.firebaseapp.com",
  databaseURL: "https://expensesmanager-da065-default-rtdb.firebaseio.com",
  projectId: "expensesmanager-da065",
  storageBucket: "expensesmanager-da065.appspot.com",
  messagingSenderId: "4544693826",
  appId: "1:4544693826:web:4d810f38b54f0aca548fdb",
  measurementId: "G-9S1VKDNKX5",
};

// Initialize Firebase
const firebaseConf = initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(firebaseConf);
export default firebaseConf;
