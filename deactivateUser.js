// import axios module
const axios = require("axios");

// required to stringify for 360Learning API
const qs = require("qs");

module.exports = (syncedUsersIgnoreEmail, lmsApiKey, lmsCompanyID) => {
  // update users' toDeactivateAt field

  for (let i = 0; i < syncedUsersIgnoreEmail.length; i++) {
    task(i);
  }

  function task(i) {
    setTimeout(function () {
      const axiosData3 = qs.stringify({
        toDeactivateAt: syncedUsersIgnoreEmail[i].toDeactivateAt,
      });

      // axios config for updateUser method
      const axiosConfig4 = {
        method: "put",
        url:
          "https://app.360learning.com/api/v1/users/" +
          syncedUsersIgnoreEmail[i].mail +
          "?company=" +
          lmsCompanyID +
          "&apiKey=" +
          lmsApiKey,
        headers: {},
        data: axiosData3,
      };

      // axios call to updateUser method
      axios(axiosConfig4)
        .then(function (response) {
          console.log(JSON.stringify(response.data));
        })
        .catch(function (error) {
          console.log("error with update user", error);
        });
    }, 200 * i);
  }
};
