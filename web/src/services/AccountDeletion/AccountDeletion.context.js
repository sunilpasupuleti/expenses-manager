/* eslint-disable react-hooks/exhaustive-deps */
import { createContext } from "react";

import useHttp from "../../hooks/useHttp";

export const AccountDeletionContext = createContext({
  onGetRequests: (status, callback, errorCallBack, loader, notify) => null,
  onCreateRequest: (
    accountKey,
    data,
    callback,
    errorCallBack,
    loader,
    notify
  ) => null,
  onRejectRequest: (requestId, data, callback, errorCallBack, loader, notify) =>
    null,
  onDeleteAccount: (requestId, callback, errorCallBack, loader, notify) => null,
  onGetRequestStatus: (callback, errorCallBack, loader, notify) => null,
});

export const AccountDeletionContextProvider = ({ children }) => {
  const { sendRequest } = useHttp();

  const accountDeletionUrl = "/admin/account-deletion";

  const onGetRequests = async (
    status,
    callback = () => {},
    errorCallBack = () => {},
    loader = true,
    notify = true
  ) => {
    sendRequest(
      {
        url: `${accountDeletionUrl}/${status}`,
        type: "GET",
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

  const onCreateRequest = async (
    accountKey,
    data,
    callback = () => {},
    errorCallBack = () => {},
    loader = true,
    notify = true
  ) => {
    sendRequest(
      {
        url: `${accountDeletionUrl}/${accountKey}`,
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

  const onRejectRequest = async (
    requestId,
    data,
    callback = () => {},
    errorCallBack = () => {},
    loader = true,
    notify = true
  ) => {
    sendRequest(
      {
        url: `${accountDeletionUrl}/${requestId}`,
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

  const onDeleteAccount = async (
    requestId,
    callback = () => {},
    errorCallBack = () => {},
    loader = true,
    notify = true
  ) => {
    sendRequest(
      {
        url: `${accountDeletionUrl}/${requestId}`,
        type: "DELETE",
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

  const onGetRequestStatus = async (
    id,
    callback = () => {},
    errorCallBack = () => {},
    loader = true,
    notify = true
  ) => {
    sendRequest(
      {
        url: `${accountDeletionUrl}/status?id=${id}`,
        type: "GET",
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
    <AccountDeletionContext.Provider
      value={{
        onGetRequests,
        onCreateRequest,
        onRejectRequest,
        onDeleteAccount,
        onGetRequestStatus,
      }}
    >
      {children}
    </AccountDeletionContext.Provider>
  );
};
