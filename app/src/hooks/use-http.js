import axios from 'axios';
import {useCallback, useEffect, useState} from 'react';
import {useDispatch} from 'react-redux';
import {loaderActions} from '../store/loader-slice';
import {notificationActions} from '../store/notification-slice';

const useHttp = () => {
  const [isLoading, setIsLoading] = useState({
    status: false,
    loaderType: null,
  });

  const [error, setError] = useState(null);
  const dispatch = useDispatch();
  useEffect(() => {
    if (isLoading.status) {
      if (isLoading.loaderType) {
        dispatch(
          loaderActions.showLoader({
            backdrop: true,
            loaderType: isLoading.loaderType,
          }),
        );
        return;
      }
      dispatch(loaderActions.showLoader({backdrop: true}));
    } else {
      dispatch(loaderActions.hideLoader());
    }
  }, [isLoading]);

  useEffect(() => {
    if (error) {
      dispatch(loaderActions.hideLoader());
      dispatch(
        notificationActions.showToast({
          status: 'error',
          message: error,
        }),
      );
    } else {
      dispatch(loaderActions.hideLoader());
    }
  }, [error]);

  const sendRequest = useCallback(
    async (
      requestConfig,
      callbacks = {
        successCallback: () => null,
        errorCallback: () => null,
      },
    ) => {
      let type = requestConfig.type;
      let url = requestConfig.url;
      let data = requestConfig.data;
      let headers = requestConfig.headers;
      let loaderType = requestConfig.loaderType;

      setIsLoading({
        status: true,
        loaderType: loaderType,
      });
      setError(null);

      try {
        let request;
        if (!type || type === 'GET') {
          request = axios.get(url, {headers: headers});
        } else if (type && type === 'POST') {
          request = axios.post(url, data, {
            headers: headers,
          });
        } else if (type && type === 'PUT') {
          request = axios.put(url, data, {headers: headers});
        } else if (type && type === 'DELETE') {
          request = axios.delete(url, data, {headers: headers});
        } else {
          setError('Invalid http call request');
          return;
        }
        request
          .then(res => {
            setIsLoading({
              status: false,
              loaderType: null,
            });
            callbacks.successCallback(res.data);
            if (res.data && res.data.message) {
              dispatch(
                notificationActions.showToast({
                  status: 'success',
                  message: res.data.message,
                }),
              );
            }
          })
          .catch(async err => {
            callbacks.errorCallback && callbacks.errorCallback();
            console.log(err, 'error in http call');
            let message;
            if (
              err.response &&
              err.response.data &&
              err.response.data.message
            ) {
              message = err.response.data.message;
            } else if (err.response && err.response.statusText) {
              message = err.response.statusText;
            } else {
              message = 'Error in http call request';
            }
            setError(message);
          });
      } catch (err) {
        callbacks.errorCallback && callbacks.errorCallback();
        setError(err);
      }
    },
    [dispatch],
  );

  return {
    sendRequest,
    error,
    isLoading,
  };
};

export default useHttp;
