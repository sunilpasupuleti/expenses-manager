const axios = require("axios");

const MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY;
const MSG91_SENDER_ID = process.env.MSG91_SENDER_ID;
const MSG91_URL = process.env.MSG91_URL;

const sendSMS = (phoneNumber, templateId, variables = {}) => {
  return new Promise(async (resolve, reject) => {
    try {
      phoneNumber = phoneNumber.replace(/^\+/, "");
      const recipientsData = [
        {
          mobiles: phoneNumber,
          ...variables,
        },
      ];

      const response = await axios.post(
        MSG91_URL,
        {
          template_id: templateId,
          recipients: recipientsData,
        },
        {
          headers: {
            authkey: MSG91_AUTH_KEY,
            accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      const responseData = response.data;
      console.log(responseData);

      if (responseData?.type === "error") {
        return reject(responseData?.message || "Unknown MSG91 error");
      }

      resolve(responseData);
    } catch (error) {
      const errorMessage = error.message || error.toString();
      reject(errorMessage);
    }
  });
};

module.exports = { sendSMS };
