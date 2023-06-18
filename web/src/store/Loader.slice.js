import { createSlice } from "@reduxjs/toolkit";

const loaderSlice = createSlice({
  name: "loader",
  initialState: {
    isLoading: false,
  },
  reducers: {
    showLoader(state, action) {
      state.isLoading = true;
    },
    hideLoader(state) {
      state.isLoading = false;
    },
  },
});

export const loaderActions = loaderSlice.actions;
export default loaderSlice;
