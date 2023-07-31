import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Alert, AppState} from 'react-native';
import {loaderActions} from './loader-slice';
import remoteConfig from '@react-native-firebase/remote-config';
import {
  ACCOUNT_DELETION_URL,
  APP_STORE_URL,
  BACKEND_URL,
  GOOGLE_API_KEY,
  GOOGLE_CLOUD_VISION_API_URL,
  MINDEE_API_KEY,
  MINDEE_API_URL,
  ONESIGNAL_APP_ID,
  PLAY_STORE_URL,
  WEB_CLIENT_ID,
} from '../../config';
import auth from '@react-native-firebase/auth';

export const fetchChangesMade = createAsyncThunk(
  'service/fetchChangesMade',
  async () => {
    try {
      const result = await AsyncStorage.getItem(
        `@expenses-manager-changesmade`,
      ).then(d => {
        return JSON.parse(d);
      });

      if (result) {
        return true;
      }

      return false;
    } catch (e) {
      console.log('error in fetching changesmade - ', e);
      return false;
    }
  },
);

export const fetchTheme = createAsyncThunk('service/fetchTheme', async () => {
  try {
    const result = await AsyncStorage.getItem(`@expenses-manager-theme`).then(
      d => {
        return JSON.parse(d);
      },
    );

    if (result) {
      return result;
    }
    return false;
  } catch (e) {
    console.log('error in fetching changesmade - ', e);
    return false;
  }
});

export const fetchExchangeRates = createAsyncThunk(
  'service/fetchExchangeRates',
  async ({showAlert = false, BASE_CURRENCY = 'INR', dispatch = null}) => {
    if (dispatch) {
      dispatch(loaderActions.showLoader({backdrop: true}));
    }
    let url = 'https://open.er-api.com/v6/latest/' + BASE_CURRENCY;
    let response = await fetch(url, {
      method: 'GET',
    });
    if (response.ok) {
      let responseJson = await response.json();
      if (responseJson.result === 'success') {
        if (showAlert) {
          Alert.alert('Successfully fetched the currency rates.');
        }
        if (dispatch) dispatch(loaderActions.hideLoader());
        console.log('got the exchange rates from exchange rates api');
        return responseJson.rates;
      } else {
        if (dispatch) dispatch(loaderActions.hideLoader());
        console.log('error from fetching currency rates - ', responseJson);
        if (showAlert) {
          Alert.alert(`Error in fetching currency rates!`);
        }
        return false;
      }
    } else {
      if (dispatch) dispatch(loaderActions.hideLoader());
      if (showAlert) {
        Alert.alert(`Error in fetching currency rates! Servers are busy`);
      }
      console.log('unable to get the exchange rates - error from api');
      return false;
    }
  },
);

export const setChangesMade = createAsyncThunk(
  'service/setChangesMade',
  async ({status, loaded = false}) => {
    await AsyncStorage.setItem(
      `@expenses-manager-changesmade`,
      JSON.stringify(status),
    );
    return {
      status: status,
      loaded: loaded,
    };
  },
);

export const setTheme = createAsyncThunk(
  'service/setTheme',
  async ({theme}) => {
    await AsyncStorage.setItem(
      `@expenses-manager-theme`,
      JSON.stringify(theme),
    );
    return theme;
  },
);

export const setOnBoarding = createAsyncThunk(
  'service/setOnBoarding',
  async status => {
    await AsyncStorage.setItem(
      '@expenses-manager-onboarded',
      JSON.stringify(status),
    );
    return status;
  },
);

export const setAppState = createAsyncThunk(
  'service/setAppState',
  async ({state}) => {
    return state;
  },
);

export const loadAppStatus = createAsyncThunk(
  'service/loadAppStatus',
  async () => {
    await remoteConfig().fetch(30 * 60);
    await remoteConfig()
      .setDefaults({
        BACKEND_URL: BACKEND_URL,
        WEB_CLIENT_ID: WEB_CLIENT_ID,
        GOOGLE_API_KEY: GOOGLE_API_KEY,
        GOOGLE_CLOUD_VISION_API_URL: GOOGLE_CLOUD_VISION_API_URL,
        ONE_SIGNAL_APP_ID: ONESIGNAL_APP_ID,
        ACCOUNT_DELETION_URL: ACCOUNT_DELETION_URL,
        APP_STORE_URL: APP_STORE_URL,
        PLAY_STORE_URL: PLAY_STORE_URL,
        MINDEE_API_KEY: MINDEE_API_KEY,
        MINDEE_API_URL: MINDEE_API_URL,
      })
      .then(() => {
        remoteConfig().fetchAndActivate();
      })
      .then(fetchedRemotely => {
        if (fetchedRemotely) {
          console.log('Configs were retrieved from the backend and activated.');
        } else {
          console.log(
            'No configs were fetched from the backend, and the local configs were already activated',
          );
        }
      });

    const logged = await AsyncStorage.getItem(`@expenses-manager-logged`).then(
      d => {
        return JSON.parse(d);
      },
    );

    const onBoarded = JSON.parse(
      await AsyncStorage.getItem('@expenses-manager-onboarded'),
    );

    let data = {
      hideSplashScreen: true,
      authenticated: false,
      onBoarded: onBoarded,
    };
    if (logged) data.authenticated = true;

    return data;
  },
);

const serviceSlice = createSlice({
  name: 'service',
  initialState: {
    changesMade: {
      loaded: false,
      status: null,
    },
    theme: 'automatic',
    exchangeRates: null,
    appState: AppState.currentState,
    appStatus: {
      hideSplashScreen: false,
      authenticated: false,
      onBoarded: false,
    },
  },
  reducers: {
    setAppStatus(state, action) {
      state.appStatus = {
        ...state.appStatus,
        ...action.payload,
      };
    },
  },
  extraReducers: builder => {
    builder.addCase(fetchChangesMade.fulfilled, (state, action) => {
      state.changesMade = {
        loaded: true,
        status: action.payload,
      };
    });

    builder.addCase(setChangesMade.fulfilled, (state, action) => {
      state.changesMade = action.payload;
    });

    builder.addCase(fetchTheme.fulfilled, (state, action) => {
      if (action.payload) {
        state.theme = action.payload;
      }
    });

    builder.addCase(setTheme.fulfilled, (state, action) => {
      state.theme = action.payload;
    });

    builder.addCase(setOnBoarding.fulfilled, (state, action) => {
      state.appStatus = {
        ...state.appStatus,
        onBoarded: action.payload,
      };
    });

    builder.addCase(setAppState.fulfilled, (state, action) => {
      state.appState = action.payload;
    });

    builder.addCase(fetchExchangeRates.fulfilled, (state, action) => {
      if (action.payload) {
        state.exchangeRates = action.payload;
      }
    });

    builder.addCase(loadAppStatus.fulfilled, (state, action) => {
      if (action.payload) {
        state.appStatus = action.payload;
      }
    });
  },
});

export const serviceActions = serviceSlice.actions;
export default serviceSlice;
