import {createSlice} from '@reduxjs/toolkit';

const notificationSlice = createSlice({
  name: 'notification',
  initialState: {
    toast: null,
  },
  reducers: {
    showToast(state, action) {
      state.toast = {
        status: action.payload.status,
        message: action.payload.message,
      };
    },

    hideToast(state, action) {
      state.toast = null;
    },
  },
});

export const notificationActions = notificationSlice.actions;
export default notificationSlice;
