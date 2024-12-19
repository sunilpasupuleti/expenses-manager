import {createSlice} from '@reduxjs/toolkit';

const smsTransactionsSlice = createSlice({
  name: 'smsTransactions',
  initialState: {transactions: [], dialogVisible: false},
  reducers: {
    showDialog(state, action) {
      state.dialogVisible = true;
    },
    hideDialog(state) {
      state.dialogVisible = false;
    },
    setTransactions(state, action) {
      state.transactions = action.payload;
      state.dialogVisible = true;
    },
  },
});

export const smsTransactionsActions = smsTransactionsSlice.actions;
export default smsTransactionsSlice;
