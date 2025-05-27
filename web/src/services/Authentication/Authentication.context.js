/* eslint-disable react-hooks/exhaustive-deps */
import { createContext, useContext, useEffect, useState } from "react";
import { SocketContext } from "../Socket/Socket.context";
import {
  setLocalStorage,
  getLocalStorage,
  removeLocalStorage,
} from "../LocalStorage.service";
import useHttp from "../../hooks/useHttp";
import { signInWithEmailAndPassword } from "firebase/auth";
import { showNotification } from "../../shared/Notification/Notification";
import { useDispatch } from "react-redux";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { firebaseAuth } from "../../firebase";
import { getFirebaseErrorMessage } from "../../utility/helper";

export const AuthenticationContext = createContext({
  userData: null,
  loggedIn: false,
  onSignin: (email, password, callback, errorCallBack) => null,
  onLogout: (callback) => null,
  onGetUsers: (callback, loader, notify) => null,
  onSetUserData: (data) => null,
});

export const AuthenticationContextProvider = ({ children }) => {
  const [userData, setUserData] = useState(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const { sendRequest } = useHttp();
  const dispatch = useDispatch();

  const adminUrl = "/admin/";

  const { onFetchEvent, socket, onConnectSocket, onDisConnectSocket } =
    useContext(SocketContext);

  useEffect(() => {
    (async () => {
      onAuthStateChanged(firebaseAuth, async (user) => {
        if (user) {
          setLocalStorage("loggedIn", true);
          setUserData(user);
          setLoggedIn(true);
          await onConnectSocket(user);
        } else {
          removeLocalStorage("loggedIn", false);
          setUserData(null);
          setLoggedIn(false);
          onDisConnectSocket();
        }
      });
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

  const onSignin = async (
    email,
    password,
    callback,
    errorCallBack = () => null
  ) => {
    try {
      const response = await signInWithEmailAndPassword(
        firebaseAuth,
        email,
        password
      );
      callback();
    } catch (err) {
      const errorMessage = getFirebaseErrorMessage(err?.code);
      showNotification({
        message: errorMessage || "Error in Sign In",
      });
      errorCallBack();
    }
  };

  const onSetUserData = (data) => {
    setUserData(data);
  };

  const onLogout = async (callback = () => {}) => {
    await signOut(firebaseAuth);
    callback();
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
