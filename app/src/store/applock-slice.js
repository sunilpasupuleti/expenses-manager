import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';

import {hasUserSetPinCode} from '@haskkor/react-native-pincode';

export const fetchAppLock = createAsyncThunk(
  'service/fetchAppLock',
  async () => {
    try {
      let result = await hasUserSetPinCode('@expenses-manager-app-lock');
      if (result) {
        return true;
      }

      return false;
    } catch (e) {
      console.log('error in fetching app lock - ', e);
      return false;
    }
  },
);

const applockSlice = createSlice({
  name: 'applock',
  initialState: {
    type: 'enter',
    success: false,
    enabled: false,
    appAuthStatus: false,
  },
  reducers: {
    showChoosePinLock(state, action) {
      state.type = action.payload.type;
    },

    finishProcess(state, action) {
      state.success = true;
    },

    setEnabledStatus(state, action) {
      state.enabled = action.payload.enabled;
    },

    setAppAuthStatus(state, action) {
      state.appAuthStatus = action?.payload?.appAuthStatus
        ? action.payload.appAuthStatus
        : true;
    },
  },

  extraReducers: builder => {
    builder.addCase(fetchAppLock.fulfilled, (state, action) => {
      state.enabled = action.payload;
    });
  },
});

export const applockActions = applockSlice.actions;
export default applockSlice;
