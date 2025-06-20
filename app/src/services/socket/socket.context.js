import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import io from 'socket.io-client';
import NetInfo from '@react-native-community/netinfo';
import remoteConfig from '@react-native-firebase/remote-config';

export const SocketContext = createContext({
  initializeWebSocket: uid => {},
  initializePlaidWebSocket: uid => {},
  socket: null,
  plaidSocket: null,
});

export const SocketContextProvider = ({children}) => {
  const BACKEND_URL = remoteConfig().getValue('BACKEND_URL').asString();
  const PLAID_BACKEND_URL = remoteConfig().getValue('BACKEND_URL').asString();

  const [socket, setSocket] = useState(null);
  const [plaidSocket, setPlaidSocket] = useState(null);

  const socketRef = useRef(null);
  const plaidSocketRef = useRef(null);

  const initializeWebSocket = uid => {
    if (!uid || socketRef.current) return; // Prevent re-initializing

    socketRef.current = io(BACKEND_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 3000,
      query: {uid},
    });

    socketRef.current.on('connect', () => {
      console.log('✅ WebSocket Connected');
      setSocket(socketRef.current);
    });

    socketRef.current.on('disconnect', () => {
      console.log('❌ WebSocket Disconnected');
      setSocket(null);
    });

    // Monitor network connectivity
    const netEvent = NetInfo.addEventListener(state => {
      if (!state.isConnected) {
        console.warn('⚠️ No Internet Connection, WebSocket may disconnect.');
      }
    });

    return () => {
      netEvent();
      socketRef.current?.disconnect();
    };
  };

  const initializePlaidWebSocket = uid => {
    if (!uid || plaidSocketRef.current) return; // Prevent re-initializing

    plaidSocketRef.current = io(PLAID_BACKEND_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 3000,
      query: {uid},
    });

    plaidSocketRef.current.on('connect', () => {
      console.log('✅ Plaid WebSocket Connected');
      setPlaidSocket(plaidSocketRef.current);
    });

    plaidSocketRef.current.on('disconnect', () => {
      console.log('❌Plaid WebSocket Disconnected');
      setPlaidSocket(null);
    });

    // Monitor network connectivity
    const netEvent = NetInfo.addEventListener(state => {
      if (!state.isConnected) {
        console.warn(
          '⚠️ No Internet Connection, Plaid WebSocket may disconnect.',
        );
      }
    });

    return () => {
      netEvent();
      plaidSocketRef.current?.disconnect();
    };
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        plaidSocket,
        initializeWebSocket,
        initializePlaidWebSocket,
      }}>
      {children}
    </SocketContext.Provider>
  );
};
