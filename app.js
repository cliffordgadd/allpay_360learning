// This file will pull employee data from AllPay
// pull employee data from 360Learning
// Create and Update employees in 360Learning
// based on employee information from AllPay.

// import axios module
const axios = require("axios");

// required to stringify for 360Learning API
const qs = require("qs");

// Import external modules
const createNewUser = require("./createNewUser");
const updateExisting = require("./updateExisting");
const updateExistingWithNewEmail = require("./updateExistingWithNewEmail");
const deactivateUser = require("./deactivateUser");

// create date object and add 4 minutes
let date = new Date();
date.setMinutes(date.getMinutes() + 4);

// API key and Company ID for 360Learning
const lmsCompanyID = "YOUR_360LEARNING_COMPANYID";
const lmsApiKey = "YOUR_360LEARNGIN_APIKEY";

// Username and Password for AllPay
const allpayUsername = "YOUR_ALLPAY_USERNAME";
const allpayPassword = "YOUR_ALLPAY_PASSWORD";

// stringify data
const axiosData1 = JSON.stringify({
  authorization: {
    requestExpiration: date.toISOString(), // convert date to a string
    userName: allpayUsername,
    password: allpayPassword,
    userType: 0,
    loginToken: "",
  },
  objectType: "EInfo",
  fieldsToPopulate:
    "id,lastName,firstName,address1,address2,termDate,emailAddress,cellPhone",
  filter: "empStatus = 'A'", // Filter by active employees
  sortOrder: "co",
  queryOptions: {
    batchSize: 6000,
    startRecord: 0,
    queryIdentifier: null,
  },
});

// set configuration options for AllPay API call
const axiosConfig1 = {
  method: "post",
  url: "https://api2.hralliance.net/AllPayRestData.svc/json/load",
  headers: {
    "Content-Type": "application/json",
  },
  data: axiosData1,
};

// Create empty array to later store AllPay user information
let allpayArray = [];

// use axios to make API call to AllPay
axios(axiosConfig1)
  .then(function (response) {
    return response.data;
  })
  // create new array of objects from returned data
  .then((data) => {
    const allPayRecords = data.payload.records; // store user Object array into variable

    // console.log(allPayRecords);

    // loop through allPayRecords array, pull out desired object attributes and store into new object
    for (let i = 0; i < allPayRecords.length; i++) {
      let reformedObj = {};

      // get object attributes from allPayRecords and place "copy" in reformedObj
      reformedObj.allPayID = allPayRecords[i].entity.id;
      reformedObj.lastName = allPayRecords[i].entity.lastName;
      reformedObj.firstName = allPayRecords[i].entity.firstName;
      reformedObj.address1 = allPayRecords[i].entity.address1;
      reformedObj.address2 = allPayRecords[i].entity.address2;
      reformedObj.toDeactivateAt = allPayRecords[i].entity.termDate;
      reformedObj.mail = allPayRecords[i].entity.emailAddress;
      reformedObj.cellPhone = allPayRecords[i].entity.cellPhone;

      // add new object to allpayArray array
      allpayArray[i] = reformedObj;
    }

    return allpayArray;
  })
  // Take new array of objects (allpayArray) and work with it
  .then((allpayArray) => {
    // config options for 360Learning API call
    const axiosConfig2 = {
      method: "get",
      url:
        "https://app.360learning.com/api/v1/users?company=" +
        lmsCompanyID +
        "&apiKey=" +
        lmsApiKey,
      headers: {},
    };

    // make getUsers method call to 360Learning API
    axios(axiosConfig2)
      .then(function (response) {
        // store 360Learning users array in variable lmsUserArray
        const lmsUserArray = response.data;

        // make array of allPayIDs (using mail for now cnange to "custom" later) from lmsUserArray
        const lmsUserIDs = lmsUserArray.map((item) => {
          return item.custom;
        });

        // make array of allPayIDs (using mail for now change to "allPayID" later) from allpayArray
        const allpayUserIDs = allpayArray.map((item) => {
          return item.allPayID;
        });

        // FIND NEW USERS ALLIANCE
        // compare arrays and return items from allpayUser array that do not match lmsUserIDs
        // array based on the allPayID
        const newUsers = allpayArray.filter((item) => {
          const regex = /@yourdomain.com/;
          if (!lmsUserIDs.includes(item.allPayID) && regex.test(item.mail)) {
            return item;
          } else if (
            // if new user and Alliance email is not your_domain email
            !lmsUserIDs.includes(item.allPayID) &&
            !regex.test(item.mail)
          ) {
            item.mail =
              "Training+" + item.allPayID.trim() + "@yourdomain.com"; // set email to Training#[AllpayID]@yourdomain.com
            return item;
          }
        });

        // find preexisting users with SAME @domain.com email in Alliance
        // compare arrays and return items from allpayUser array that match lmsUserArray array
        // based on the allPayID (using mail for now)
        const preExistingUsers = allpayArray.filter((item) => {
          const regex = /@yourdomain.com/;
          const found = lmsUserArray.find(
            (element) => element.custom === item.allPayID // user preexists in 360Learning and one or more custom fields do not match
          );

          if (
            found != undefined && // found value is not undefined
            regex.test(found.mail) && // 360 email is your_domain email
            regex.test(item.mail) && // Alliance email is your_domain email
            found.mail === item.mail // 360 and Alliance emails are the same
          ) {
            // add LMS ID to item in array
            addLmsId();

            function addLmsId() {
              item.lmsID = found["_id"];
            }
          } else if (
            found != undefined && // found value is not undefined
            regex.test(found.mail) && // 360 email is your_domain email
            !regex.test(item.mail) // if Alliance email is not your_domain email
          ) {
            // add LMS ID to item in array
            addLmsId();

            function addLmsId() {
              item.lmsID = found["_id"]; // add key:value to item
              item.mail = found["mail"]; // change email to 360 email
            }
          }

          return found;
        });

        // find preexisting users with NEW @yourdomain.com email in Alliance
        // compare arrays and return items from allpayUser array that match lmsUserArray
        // based on the allPayID (using mail for now)
        const preExistingChangeEmail = allpayArray.filter((item) => {
          const regex = /@yourdomain.com/;
          const found = lmsUserArray.find(
            (element) =>
              element.custom === item.allPayID && // user preexists in 360Learning
              regex.test(element.mail) && // 360Learning email is your_domain email
              regex.test(item.mail) && // Alliance email is your_domain email
              element.mail !== item.mail // 360Learning email doesn't match Alliance email
          );

          if (found != undefined) {
            // add LMS ID to item in array
            addLmsId();

            function addLmsId() {
              item.lmsID = found["_id"]; // add key:value to item
              item.oldMail = found["mail"]; // add key:value to item
            }
          }

          return found;
        });

        // find preexisting users with termDate populated in Alliance
        const deactivatedUsers = allpayArray.filter((item) => {
          const found = lmsUserArray.find(
            (element) =>
              element.custom === item.allPayID && // user exists in both environments
              item.toDeactivateAt != null && // ensure key is not null
              item.toDeactivateAt != undefined && // ensure key is not undefined
              item.toDeactivateAt.slice(0, 10) >
                date.toISOString().split("T")[0] // ensure date is in future
          );

          if (found != undefined) {
            // add LMS ID to item in array
            addLmsId();

            function addLmsId() {
              item.lmsID = found["_id"]; // add key:value to item
              item.mail = found["mail"]; // change email to 360 email
              item.toDeactivateAt = item.toDeactivateAt.slice(0, 10); // format date
            }
          }

          return found;
        });

        // Method to create new users that have an your_domain email in Alliance
        if (newUsers.length > 0) {
          // console.log("New Users:", newUsers);
          createNewUser(newUsers, lmsApiKey, lmsCompanyID);
        }

        // Method to update pre existing users than have an your_domain Email in 360Learning and Alliance
        if (preExistingUsers.length > 0) {
          // console.log("Synced Users:", preExistingUsers);
          updateExisting(preExistingUsers, lmsApiKey, lmsCompanyID);
        }

        // Method to update pre existing users that don't have your_domain Email in 360Learning
        if (preExistingChangeEmail.length > 0) {
          // console.log(
          //   "Synced Users with new your_domain email in Alliance:",
          //   preExistingChangeEmail
          // );
          updateExistingWithNewEmail(
            preExistingChangeEmail,
            lmsApiKey,
            lmsCompanyID
          );
        }

        // Method to update pre existing users that have termDate populated in Alliance
        if (deactivatedUsers.length > 0) {
          // console.log(
          //   "Synced users that will be deactivated:",
          //   deactivatedUsers
          // );
          deactivateUser(deactivatedUsers, lmsApiKey, lmsCompanyID);
        }

        //THIS IS THE END OF THE NESTED PROMISE TO 360LEARNING
      })
      .catch(function (error) {
        console.log("Error with 360Learning API:", error);
      });
    //THIS IS THE END OF THE PROMISE TO ALLPAY
  })
  .catch(function (error) {
    console.log("Error with AllPay API", error);
  });

