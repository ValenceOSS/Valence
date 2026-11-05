import { configureStore } from '@reduxjs/toolkit';
import { dialogStackSlice } from './dialogStackSlice';

const dialogStore = configureStore({
  reducer: { dialogStack: dialogStackSlice.reducer },
});

export { dialogStore };
