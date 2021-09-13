// import axios module
const axios = require("axios");

// required to stringify for 360Learning API
const qs = require("qs");

module.exports = (newUsers, lmsApiKey, lmsCompanyID) => {
  // create new user (with PERSONALIZED @yourdomain.com) in 360Learning

  for (let i = 0; i < newUsers.length; i++) {
    task(i);
  }

  function task(i) {
    setTimeout(function () {
      let axiosData2 = qs.stringify({
        mail: newUsers[i].mail,
        password: "aPassword",
        firstName: newUsers[i].firstName,
        lastName: newUsers[i].lastName,
        phone: newUsers[i].cellPhone,
        custom: newUsers[i].allPayID, // Set custom attribute on user account
      });

      // set custom field values
      const dataSyncCustomFields2 = JSON.stringify({
        values: [
          {
            customFieldId: "612d3ebc302725e83526294f", // address1
            value: newUsers[i].address1,
          },
          {
            customFieldId: "612d3ec0302725e835262950", // address2
            value: newUsers[i].address2,
          },
          {
            customFieldId: "61269c8b5ffee455d1a63089", // allPayID
            value: newUsers[i].allPayID,
          },
        ],
      });

      // axios config for createOrInviteUser method
      const axiosConfig3 = {
        method: "post",
        url:
          "http://app.360learning.com/api/v1/users?company=" +
          lmsCompanyID +
          "&apiKey=" +
          lmsApiKey,
        headers: {},
        data: axiosData2,
      };

      // axios call to createOrInviteUser method
      axios(axiosConfig3)
        .then(function (response) {
          return response.data;
        })
        .then((data) => {
          // axios config for addCustomFieldValue method
          const configSyncCustomFields2 = {
            method: "put",
            url:
              "https://app.360learning.com/api/v1/users/" +
              data["_id"] +
              "/customfields?company=" +
              lmsCompanyID +
              "&apiKey=" +
              lmsApiKey,
            headers: {
              "Content-Type": "application/json",
            },
            data: dataSyncCustomFields2,
          };

          // axios call to addCustomFieldsValue method
          axios(configSyncCustomFields2)
            .then(function (response) {
              console.log(JSON.stringify(response.data));
            })
            .catch(function (error) {
              console.log("error with update field", error);
            });

          console.log(data);
        })
        .catch((error) => console.log(error));
    }, 200 * i);
  }
};
