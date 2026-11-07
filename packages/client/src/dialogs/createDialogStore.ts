import { configureStore } from '@reduxjs/toolkit';
import { dialogStackSlice } from './dialogStackSlice';

/**
 * Makes a fresh store for the order of the open dialogs, so each place that holds one starts empty.
 *
 * @returns The store.
 */
const createDialogStore = () =>
  configureStore({
    reducer: { dialogStack: dialogStackSlice.reducer },
  });

export { createDialogStore };
