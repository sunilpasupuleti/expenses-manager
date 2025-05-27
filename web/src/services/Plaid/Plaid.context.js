/* eslint-disable react-hooks/exhaustive-deps */
import { createContext } from "react";

import useHttp from "../../hooks/useHttp";

export const PlaidContext = createContext({
  onGetPlaidData: (data, callback, errorCallBack, loader, notify) => null,
  onUpdatePlaidSettings: (data, callback, errorCallBack, loader, notify) =>
    null,
  onUpdatePlaidUrls: (data, callback, errorCallBack, loader, notify) => null,
});

export const PlaidContextProvider = ({ children }) => {
  const { sendRequest } = useHttp();

  const plaidUrl = "/admin/plaid";

  const onGetPlaidData = async (
    data,
    callback = () => {},
    errorCallBack = () => {},
    loader = true,
    notify = true
  ) => {
    sendRequest(
      {
        url: `${plaidUrl}`,
        type: "POST",
        data: data,
      },
      {
        successCallback: async (result) => {
          callback(result);
        },
        errorCallback: errorCallBack,
      },
      loader,
      notify
    );
  };

  const onUpdatePlaidSettings = async (
    data,
    callback = () => {},
    errorCallBack = () => {},
    loader = true,
    notify = true
  ) => {
    sendRequest(
      {
        url: `${plaidUrl}/settings`,
        type: "POST",
        data: data,
      },
      {
        successCallback: async (result) => {
          callback(result);
        },
        errorCallback: errorCallBack,
      },
      loader,
      notify
    );
  };

  const onUpdatePlaidUrls = async (
    data,
    callback = () => {},
    errorCallBack = () => {},
    loader = true,
    notify = true
  ) => {
    sendRequest(
      {
        url: `${plaidUrl}/url`,
        type: "PUT",
        data: data,
      },
      {
        successCallback: async (result) => {
          callback(result);
        },
        errorCallback: errorCallBack,
      },
      loader,
      notify
    );
  };

  return (
    <PlaidContext.Provider
      value={{
        onGetPlaidData,
        onUpdatePlaidSettings,
        onUpdatePlaidUrls,
      }}
    >
      {children}
    </PlaidContext.Provider>
  );
};
