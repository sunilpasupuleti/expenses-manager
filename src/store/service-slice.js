import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDispatch } from "react-redux";
import { Alert } from "react-native";
import { loaderActions } from "./loader-slice";

export const fetchChangesMade = createAsyncThunk(
  "service/fetchChangesMade",
  async () => {
    try {
      const result = await AsyncStorage.getItem(
        `@expenses-manager-changesmade`
      ).then((d) => {
        return JSON.parse(d);
      });

      if (result) {
        return true;
      }

      return false;
    } catch (e) {
      console.log("error in fetching changesmade - ", e);
      return false;
    }
  }
);

export const fetchTheme = createAsyncThunk("service/fetchTheme", async () => {
  try {
    const result = await AsyncStorage.getItem(`@expenses-manager-theme`).then(
      (d) => {
        return JSON.parse(d);
      }
    );

    if (result) {
      return result;
    }
    return false;
  } catch (e) {
    console.log("error in fetching changesmade - ", e);
    return false;
  }
});

export const fetchExchangeRates = createAsyncThunk(
  "service/fetchExchangeRates",
  async ({ showAlert = false, BASE_CURRENCY = "INR", dispatch = null }) => {
    if (dispatch) {
      dispatch(loaderActions.showLoader({ backdrop: true }));
    }
    let url = "https://open.er-api.com/v6/latest/" + BASE_CURRENCY;
    let response = await fetch(url, {
      method: "GET",
    });
    if (response.ok) {
      let responseJson = await response.json();
      if (responseJson.result === "success") {
        if (showAlert) {
          Alert.alert("Successfully fetched the currency rates.");
        }
        if (dispatch) dispatch(loaderActions.hideLoader());
        console.log("got the exchange rates from exchange rates api");
        return responseJson.rates;
      } else {
        if (dispatch) dispatch(loaderActions.hideLoader());
        console.log("error from fetching currency rates - ", responseJson);
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
      console.log("unable to get the exchange rates - error from api");
      return false;
    }
  }
);

export const setChangesMade = createAsyncThunk(
  "service/setChangesMade",
  async ({ status, loaded = false }) => {
    await AsyncStorage.setItem(
      `@expenses-manager-changesmade`,
      JSON.stringify(status)
    );
    return {
      status: status,
      loaded: loaded,
    };
  }
);

export const setTheme = createAsyncThunk(
  "service/setTheme",
  async ({ theme }) => {
    await AsyncStorage.setItem(
      `@expenses-manager-theme`,
      JSON.stringify(theme)
    );
    return theme;
  }
);

const serviceSlice = createSlice({
  name: "service",
  initialState: {
    changesMade: {
      loaded: false,
      status: null,
    },
    theme: "automatic",
    exchangeRates: null,
  },
  reducers: {},
  extraReducers: (builder) => {
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
  },
});

export const serviceActions = serviceSlice.actions;
export default serviceSlice;
