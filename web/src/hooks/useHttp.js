import axios from "axios";
import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { hideLoader, showLoader } from "../shared/Loader/Loader";
import { showNotification } from "../shared/Notification/Notification";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { removeLocalStorage } from "../services/LocalStorage.service";
axios.defaults.withCredentials = "include";

function refreshToken() {
  return axios.get(process.env.REACT_APP_BACKEND_URL + "/admin/auth/refresh");
}
// if refresh token expired
function onLogout(navigate) {
  Swal.fire({
    title: "Your session is expired! please login to continue",
    showCancelButton: true,
    confirmButtonText: "Login",
    confirmButtonColor: "var(--primary)",
  }).then((result) => {
    /* Read more about isConfirmed, isDenied below */
    // if (result.isConfirmed) {
    removeLocalStorage("loggedIn");
    navigate("/admin");
    window.location.reload();
    // }
  });
}

const useHttp = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const sendRequest = useCallback(
    async (
      requestConfig,
      callbacks = {
        successCallback: () => null,
        errorCallback: () => null,
      },
      loader = false,
      notify = true
    ) => {
      loader && showLoader(dispatch);
      let type = requestConfig.type;
      let url = process.env.REACT_APP_BACKEND_URL + requestConfig.url;
      let data = requestConfig.data;

      let headers = {
        "Access-Control-Allow-Origin": "*",
        ...requestConfig.headers,
      };

      try {
        let request;
        if (!type || type === "GET") {
          request = axios.get(url, { headers: headers });
        } else if (type && type === "POST") {
          request = axios.post(url, data, {
            headers: headers,
            withCredentials: true,
          });
        } else if (type && type === "PUT") {
          request = axios.put(url, data, { headers: headers });
        } else if (type && type === "DELETE") {
          request = axios.delete(url, data, { headers: headers });
        } else {
          loader && hideLoader(dispatch);
          showNotification({
            status: "error",
            message: "Invalid http call request",
          });
          return;
        }
        request
          .then((res) => {
            callbacks.successCallback(res.data);
            if (res.data && res.data.message) {
              notify &&
                showNotification({
                  status: "success",
                  message: res.data.message,
                });
            }
            loader && hideLoader(dispatch);
          })
          .catch(async (err) => {
            callbacks.errorCallback &&
              callbacks.errorCallback(err.response?.data);
            console.log(err, "error in http call");
            loader && hideLoader(dispatch);
            let message;
            // for refeshing token call api
            if (
              err.response &&
              err.response.data &&
              err.response.data.accessToken === null
            ) {
              const config = err.config;
              try {
                let res = await refreshToken();
                if (res.data && res.data.result) {
                  return axios.request(config).then((result) => {
                    callbacks.successCallback(result.data);
                    if (result.data && result.data.message) {
                      notify &&
                        showNotification({
                          status: "success",
                          message: result.data.message,
                        });
                    }
                    loader && hideLoader(dispatch);
                  });
                }
              } catch (err) {
                // if refresh token also expired
                if (
                  err.response &&
                  err.response.data &&
                  err.response.data.refreshToken === null
                ) {
                  return onLogout(navigate);
                }
              }
            } else if (
              err.response &&
              err.response.data &&
              err.response.data.refreshToken === null
            ) {
              return onLogout(navigate);
            }

            // end of calling refresh token
            else if (
              err.response &&
              err.response.data &&
              err.response.data.message
            ) {
              message = err.response.data.message;
            } else if (err.response && err.response.statusText) {
              message = err.response.statusText;
            } else {
              message = "Error in http call request";
            }

            showNotification({
              status: "error",
              message: message,
            });
          });
      } catch (err) {
        callbacks.errorCallback && callbacks.errorCallback();
        loader && hideLoader(dispatch);
        showNotification({ status: "error", message: err });
      }
    },
    [dispatch, navigate]
  );

  return {
    sendRequest,
  };
};

export default useHttp;
