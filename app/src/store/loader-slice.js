import {createSlice} from '@reduxjs/toolkit';

const laoderSlice = createSlice({
  name: 'loader',
  initialState: {isLoading: false, backdrop: true, loaderType: null},
  reducers: {
    showLoader(state, action) {
      state.isLoading = true;
      state.backdrop = action.payload.backdrop;
      if (action.payload.loaderType) {
        state.loaderType = action.payload.loaderType;
      }
    },
    hideLoader(state) {
      state.isLoading = false;
      state.loaderType = null;
    },
  },
});

export const loaderActions = laoderSlice.actions;
export default laoderSlice;
