import { configureStore } from "@reduxjs/toolkit";
import loaderSlice from "./Loader.slice";

const store = configureStore({
  reducer: {
    loader: loaderSlice.reducer,
  },
});

export default store;
