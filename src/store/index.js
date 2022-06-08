import {configureStore} from '@reduxjs/toolkit';
import loaderSlice from './loader-slice';
import notificationSlice from './notification-slice';
import serviceSlice from './service-slice';

const store = configureStore({
  reducer: {
    loader: loaderSlice.reducer,
    notification: notificationSlice.reducer,
    service: serviceSlice.reducer,
  },
});

export default store;
