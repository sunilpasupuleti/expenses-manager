import { createSlice } from "@reduxjs/toolkit";

const laoderSlice = createSlice({
  name: "loader",
  initialState: { isLoading: false, backdrop: true },
  reducers: {
    showLoader(state, action) {
      state.isLoading = true;
      state.backdrop = action.payload.backdrop;
    },
    hideLoader(state) {
      state.isLoading = false;
    },
  },
});

export const loaderActions = laoderSlice.actions;
export default laoderSlice;
