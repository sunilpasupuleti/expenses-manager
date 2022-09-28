import {createSlice} from '@reduxjs/toolkit';

const applockSlice = createSlice({
  name: 'applock',
  initialState: {show: true, status: 'enter', success: false, enabled: false},
  reducers: {
    showChoosePinLock(state, action) {
      state.show = action.payload.show;
      state.status = action.payload.status;
    },

    finishProcess(state, action) {
      state.success = true;
    },

    setEnabledStatus(state, action) {
      state.enabled = action.payload.enabled;
    },
  },
});

export const applockActions = applockSlice.actions;
export default applockSlice;
