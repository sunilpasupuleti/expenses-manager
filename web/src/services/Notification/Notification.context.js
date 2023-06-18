/* eslint-disable react-hooks/exhaustive-deps */
import { createContext } from "react";

import useHttp from "../../hooks/useHttp";

export const NotificationContext = createContext({
  onSendNotificationToUsers: (data, callback, errorCallBack, loader, notify) =>
    null,

  onGetActiveUsersList: (callback, errorCallBack, loader, notify) => null,
});

export const NotificationContextProvider = ({ children }) => {
  const { sendRequest } = useHttp();

  const notificationUrl = "/admin/notification/";

  const onSendNotificationToUsers = async (
    data,
    callback = () => {},
    errorCallBack = () => {},
    loader = true,
    notify = true
  ) => {
    sendRequest(
      {
        url: notificationUrl,
        type: "POST",
        data: data,
      },
      {
        successCallback: async (result) => {
          callback();
        },
        errorCallback: errorCallBack,
      },
      loader,
      notify
    );
  };

  const onGetActiveUsersList = async (
    callback = () => {},
    errorCallBack = () => {},
    loader = true,
    notify = true
  ) => {
    sendRequest(
      {
        url: notificationUrl + "active-users",
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
    <NotificationContext.Provider
      value={{
        onSendNotificationToUsers,
        onGetActiveUsersList,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
