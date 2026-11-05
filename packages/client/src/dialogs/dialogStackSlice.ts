import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { DialogKind } from './DialogKind';
import type { DialogStep } from './DialogStep';

const INITIAL: { order: DialogKind[]; trail: DialogStep[] } = { order: [], trail: [] };

const dialogStackSlice = createSlice({
  name: 'dialogStack',
  initialState: INITIAL,
  reducers: {
    orderChanged: (state, action: PayloadAction<DialogKind[]>) => {
      state.order = action.payload;
    },
    trailChanged: (state, action: PayloadAction<DialogStep[]>) => {
      state.trail = action.payload;
    },
  },
});

export { dialogStackSlice };
