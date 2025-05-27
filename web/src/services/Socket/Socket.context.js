import { createContext, useState } from "react";
import { io } from "socket.io-client";

export const SocketContext = createContext({
  socket: null,
  onEmitEvent: (eventName, data) => {},
  onFetchEvent: (eventName, callback) => {},
  onConnectSocket: (metadata) => null,
  onDisConnectSocket: () => null,
});

export const SocketContextProvider = ({ children }) => {
  // var socket;
  const [socket, setSocket] = useState();

  const onConnectSocket = async (metadata) => {
    return new Promise((resolve, reject) => {
      let query = `id=${metadata._id}`;
      var socketConnect = io(process.env.REACT_APP_SOCKET_URL, {
        transports: ["websocket"],
        secure: true,
        query,
      });
      socketConnect.on("connect", function () {
        setSocket(socketConnect);
        console.log("Socket status - ", socketConnect.connected);
        resolve(true);
      });
    });
  };

  const onDisConnectSocket = () => {
    socket?.disconnect();
    setSocket(null);
  };

  const onEmitEvent = async (eventName, data = {}) => {
    if (socket) {
      socket.emit(eventName, data);
    }
  };

  const onFetchEvent = (eventName, callback = () => {}) => {
    if (socket) {
      socket.on(eventName, callback);
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        onEmitEvent,
        onFetchEvent,
        onConnectSocket,
        onDisConnectSocket,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
