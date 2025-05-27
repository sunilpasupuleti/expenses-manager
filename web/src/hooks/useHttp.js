import axios from "axios";
import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { hideLoader, showLoader } from "../shared/Loader/Loader";
import { showNotification } from "../shared/Notification/Notification";
import Swal from "sweetalert2";
import { getAuth } from "firebase/auth";
import { useNavigate } from "react-router-dom";
axios.defaults.withCredentials = "include";

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
      const auth = getAuth();
      const user = auth.currentUser;
      const token = (await user?.getIdToken()) || null;

      loader && showLoader(dispatch);
      let type = requestConfig.type;
      let url = process.env.REACT_APP_BACKEND_URL + requestConfig.url;
      let data = requestConfig.data;
      let headers = {
        "Access-Control-Allow-Origin": "*",
        ...requestConfig.headers,
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

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
          request = axios.delete(url, { data: data, headers: headers });
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
            // end of calling refresh token
            if (
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
            notify &&
              showNotification({
                status: "error",
                message: message,
              });
          });
      } catch (err) {
        callbacks.errorCallback && callbacks.errorCallback();
        loader && hideLoader(dispatch);
        notify && showNotification({ status: "error", message: err });
      }
    },
    [dispatch, navigate]
  );

  return {
    sendRequest,
  };
};

export default useHttp;
