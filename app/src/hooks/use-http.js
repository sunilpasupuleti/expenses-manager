import React, { useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { loaderActions } from "../store/loader-slice";
import { notificationActions } from "../store/notification-slice";

const useHttp = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const dispatch = useDispatch();
  useEffect(() => {
    if (isLoading) {
      dispatch(loaderActions.showLoader({ backdrop: true }));
    } else {
      dispatch(loaderActions.hideLoader());
    }
  }, [isLoading]);

  useEffect(() => {
    if (error) {
      dispatch(loaderActions.hideLoader());
      dispatch(
        notificationActions.showToast({
          status: "error",
          message: error,
        })
      );
    } else {
      dispatch(loaderActions.hideLoader());
    }
  }, [error]);

  const sendRequest = useCallback(async (requestConfig, applyData) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(requestConfig.url, {
        method: requestConfig.method ? requestConfig.method : "GET",
        headers: requestConfig.headers ? requestConfig.headers : {},
        body: requestConfig.body ? JSON.stringify(requestConfig.body) : null,
      });
      if (!response.ok) {
        setError("Request failed");
        throw new Error("Request failed");
      }
      const data = await response.json();
      applyData(data);
    } catch (err) {
      console.log(err);
      setError(err.message || "Something went wrong");
    }
    setIsLoading(false);
  }, []);

  return {
    isLoading,
    error,
    sendRequest,
  };
};
export default useHttp;
