import {configureStore} from '@reduxjs/toolkit';
import applockSlice from './applock-slice';
import loaderSlice from './loader-slice';
import notificationSlice from './notification-slice';
import serviceSlice from './service-slice';
import smsTransactionsSlice from './smsTransactions-slice';

const store = configureStore({
  reducer: {
    loader: loaderSlice.reducer,
    notification: notificationSlice.reducer,
    service: serviceSlice.reducer,
    applock: applockSlice.reducer,
    smsTransactions: smsTransactionsSlice.reducer,
  },
});

export default store;
