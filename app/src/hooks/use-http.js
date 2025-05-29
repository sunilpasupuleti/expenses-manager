import {useNetInfo} from '@react-native-community/netinfo';
import axios from 'axios';
import {useCallback, useEffect, useState} from 'react';

const useHttp = () => {
  const [isLoading, setIsLoading] = useState(false);

  const [error, setError] = useState(null);

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

      setIsLoading(true);
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
          request = axios.delete(url, {headers: headers});
        } else {
          setError('Invalid http call request');
          return;
        }
        request
          .then(res => {
            setIsLoading(false);
            callbacks.successCallback(res.data);
            // if (res.data && res.data.message) {
            //   dispatch(
            //     notificationActions.showToast({
            //       status: 'success',
            //       message: res.data.message,
            //     }),
            //   );
            // }
          })
          .catch(async err => {
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
              message =
                'Check your Internet Connection or Error occured in calling the API';
            }
            console.log(err);
            console.log(message ? message : err, ' - error in http call', url);
            setError(message);
            callbacks.errorCallback &&
              callbacks.errorCallback(message, err?.response?.data);
          });
      } catch (err) {
        callbacks.errorCallback && callbacks.errorCallback(err);
        setError(err);
      }
    },
    [],
  );

  return {
    sendRequest,
    error,
    isLoading,
  };
};

export default useHttp;
