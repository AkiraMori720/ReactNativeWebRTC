const axios = require('axios');

const host = "projects.dgtns.me";
const apiCall = {
    get: function(method, params, successCallback, failCallback = () => {}, errorCallback = null ){
        axios.get(`https://${host}/${method}`, {
            ...params
        })
            .then(response => {
                console.log("apiGetCall: success", response);
                if(response.status === 200){
                    successCallback(response.data.payload);
                } else {
                    failCallback();
                }
            })
            .catch(error => {
                console.log("apiGetCall: fail", error);
                if(errorCallback){
                    errorCallback();
                } else {
                    failCallback();
                }
            });
    },

    post: function(method, params, successCallback, failCallback = () => {}, errorCallback = null ){
        axios.post(`https://${host}/${method}`, {
            ...params
        })
            .then(response => {
                console.log("apiPostCall: success", response);
                if(response.status === 200){
                    successCallback(response.data.payload);
                } else {
                    failCallback();
                }
            })
            .catch(error => {
                console.log("apiGetCall: fail", error);
                if(errorCallback){
                    errorCallback();
                } else {
                    failCallback();
                }
            });
    },
}

export default apiCall;