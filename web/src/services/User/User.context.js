/* eslint-disable react-hooks/exhaustive-deps */
import { createContext } from "react";

import useHttp from "../../hooks/useHttp";

export const UserContext = createContext({
  onGetUsers: (data, callback, errorCallBack, loader, notify) => null,
});

export const UserContextProvider = ({ children }) => {
  const { sendRequest } = useHttp();

  const userUrl = "/admin/user/";

  const onGetUsers = async (
    callback = () => {},
    errorCallBack = () => {},
    loader = true,
    notify = true
  ) => {
    sendRequest(
      {
        url: userUrl,
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
    <UserContext.Provider
      value={{
        onGetUsers,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};