/* eslint-disable react-hooks/exhaustive-deps */
import { createContext, useContext, useEffect, useState } from "react";
import { SocketContext } from "../Socket/Socket.context";
import {
  setLocalStorage,
  getLocalStorage,
  removeLocalStorage,
} from "../LocalStorage.service";
import useHttp from "../../hooks/useHttp";

export const AuthenticationContext = createContext({
  userData: null,
  loggedIn: false,
  onSignin: (data, callback, errorCallBack, loader, notify) => null,
  onLogout: (callback) => null,
  onGetUsers: (callback, loader, notify) => null,
  onSetUserData: (data) => null,
});

export const AuthenticationContextProvider = ({ children }) => {
  const [userData, setUserData] = useState(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const { sendRequest } = useHttp();

  const adminUrl = "/admin/";

  const { onFetchEvent, socket, onConnectSocket, onDisConnectSocket } =
    useContext(SocketContext);

  useEffect(() => {
    (async () => {
      let loggedIn = getLocalStorage("loggedIn");
      if (loggedIn) {
        setLoggedIn(true);
        onGetSelfUser(
          async (result) => {
            onSetUserData(result.userData);
            await onConnectSocket(result.userData);
          },
          false,
          false
        );
      }
    })();
  }, []);

  useEffect(() => {
    if (socket) {
      const eventHandler = (data) => {
        onGetSelfUser(
          (result) => {
            onSetUserData(result.userData);
          },
          true,
          false
        );
      };
      onFetchEvent("refreshUserData", eventHandler);
      return () => {
        socket?.off("refreshUserData", eventHandler);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onFetchEvent, socket]);

  const onSignInSuccess = async (userData) => {
    setLocalStorage("loggedIn", true);
    setLoggedIn(true);
    setUserData(userData);
    await onConnectSocket(userData);
  };

  const onSignin = async (
    data,
    callback,
    errorCallBack = () => null,
    loader = true,
    notify = true
  ) => {
    sendRequest(
      {
        url: adminUrl + `auth/signin`,
        type: "POST",
        data: data,
      },
      {
        successCallback: async (result) => {
          await onSignInSuccess(result.userData);
          callback();
        },
        errorCallback: errorCallBack,
      },
      loader,
      notify
    );
  };

  const onSetUserData = (data) => {
    setUserData(data);
  };

  const onLogout = async (callback = () => {}) => {
    sendRequest(
      {
        url: adminUrl + `auth/signout`,
      },
      {
        successCallback: () => {
          removeLocalStorage("loggedIn");
          setUserData(null);
          setLoggedIn(false);
          onDisConnectSocket();
          callback();
        },
      },
      true,
      false
    );
  };

  const onGetSelfUser = async (
    callback = () => null,
    loader = true,
    notify = true
  ) => {
    sendRequest(
      {
        url: adminUrl + "auth",
      },
      {
        successCallback: callback,
      },
      loader,
      notify
    );
  };

  return (
    <AuthenticationContext.Provider
      value={{
        userData,
        loggedIn,
        onSignin,
        onLogout,
        onSetUserData,
        onGetSelfUser,
      }}
    >
      {children}
    </AuthenticationContext.Provider>
  );
};
