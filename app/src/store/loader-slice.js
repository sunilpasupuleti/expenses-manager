import {createSlice} from '@reduxjs/toolkit';

const laoderSlice = createSlice({
  name: 'loader',
  initialState: {
    isLoading: false,
    backdrop: true,
    loaderType: null,
    loaderText: null,
  },
  reducers: {
    showLoader(state, action) {
      state.isLoading = true;
      state.backdrop = action.payload.backdrop;
      if (action.payload.loaderType) {
        state.loaderType = action.payload.loaderType;
        state.loaderText = action.payload.loaderText;
      }
    },
    hideLoader(state) {
      state.isLoading = false;
      state.loaderType = null;
      state.loaderText = null;
    },
  },
});

export const loaderActions = laoderSlice.actions;
export default laoderSlice;
