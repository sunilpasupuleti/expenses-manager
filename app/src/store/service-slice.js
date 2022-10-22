import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useDispatch} from 'react-redux';
import {Alert} from 'react-native';
import {loaderActions} from './loader-slice';
import remoteConfig from '@react-native-firebase/remote-config';
import {
  BACKEND_URL,
  GOOGLE_API_KEY,
  GOOGLE_CLOUD_VISION_API_URL,
  WEB_CLIENT_ID,
} from '../../config';
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

export const loadAppStatus = createAsyncThunk(
  'service/loadAppStatus',
  async () => {
    await remoteConfig().setDefaults({
      BACKEND_URL: BACKEND_URL,
      WEB_CLIENT_ID: WEB_CLIENT_ID,
      GOOGLE_API_KEY: GOOGLE_API_KEY,
      GOOGLE_CLOUD_VISION_API_URL: GOOGLE_CLOUD_VISION_API_URL,
    });
    const logged = await AsyncStorage.getItem(`@expenses-manager-logged`).then(
      d => {
        return JSON.parse(d);
      },
    );

    let fetchedRemotely = await remoteConfig().fetchAndActivate();
    if (fetchedRemotely) {
      console.log('Configs were retrieved from the backend and activated.');
    } else {
      console.log(
        'No configs were fetched from the backend, and the local configs were already activated',
      );
    }
    let data = {
      hideSplashScreen: true,
      authenticated: false,
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
    appStatus: {
      hideSplashScreen: false,
      authenticated: false,
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
