// import axios module
const axios = require("axios");

// required to stringify for 360Learning API
const qs = require("qs");

module.exports = (syncedUsersChangeEmail, lmsApiKey, lmsCompanyID) => {
  //  update pre existing users that have NEW your_domain email in Alliance

  for (let i = 0; i < syncedUsersChangeEmail.length; i++) {
    task(i);
  }

  function task(i) {
    setTimeout(function () {
      const axiosData3 = qs.stringify({
        mail: syncedUsersChangeEmail[i].mail,
        firstName: syncedUsersChangeEmail[i].firstName,
        lastName: syncedUsersChangeEmail[i].lastName,
        phone: syncedUsersChangeEmail[i].cellPhone,
      });

      // axios config for updateUser method
      const axiosConfig4 = {
        method: "put",
        url:
          "https://app.360learning.com/api/v1/users/" +
          syncedUsersChangeEmail[i].oldMail +
          "?company=" +
          lmsCompanyID +
          "&apiKey=" +
          lmsApiKey,
        headers: {},
        data: axiosData3,
      };

      // set custom field values
      const dataSyncCustomFields1 = JSON.stringify({
        values: [
          {
            customFieldId: "612d3ebc302725e83526294f", // address1
            value: syncedUsersChangeEmail[i].address1,
          },
          {
            customFieldId: "612d3ec0302725e835262950", // address2
            value: syncedUsersChangeEmail[i].address2,
          },
          {
            customFieldId: "61269c8b5ffee455d1a63089", // allPayID
            value: syncedUsersChangeEmail[i].allPayID,
          },
        ],
      });

      // axios config for addCustomFieldValue method
      const configSyncCustomFields1 = {
        method: "put",
        url:
          "https://app.360learning.com/api/v1/users/" +
          syncedUsersChangeEmail[i].lmsID +
          "/customfields?company=" +
          lmsCompanyID +
          "&apiKey=" +
          lmsApiKey,
        headers: {
          "Content-Type": "application/json",
        },
        data: dataSyncCustomFields1,
      };

      // axios call to updateUser method
      axios(axiosConfig4)
        .then(function (response) {
          console.log(JSON.stringify(response.data));
        })
        .then(
          // axios call to addCustomFieldsValue method
          axios(configSyncCustomFields1)
            .then(function (response) {
              console.log(JSON.stringify(response.data));
            })
            .catch(function (error) {
              console.log("error with update field", error);
            })
        )
        .catch(function (error) {
          console.log("error with update user", error);
        });
    }, 200 * i);
  }
};
