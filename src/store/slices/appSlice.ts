import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'; 
import type { AppState, Zone, Division, AssetType } from '../../types';
import {api} from  '../../services/api';

const initialState: AppState = {
  zones: [],
  divisions: [],
  assetTypes: [],
  selectedZone: null,
  selectedDivision: null,
  themeMode: 'light',
};

export const loadZones = createAsyncThunk('app/loadZones', async () => {
  return await api.zones.getAll();
});

export const loadDivisions = createAsyncThunk('app/loadDivisions', async () => {
  return await api.divisions.getAll();
});

export const loadAssetTypes = createAsyncThunk('app/loadAssetTypes', async () => {
  return await api.assetTypes.getAll();
});

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setSelectedZone: (state, action: PayloadAction<string | null>) => {
      state.selectedZone = action.payload;
      state.selectedDivision = null;
    },
    setSelectedDivision: (state, action: PayloadAction<string | null>) => {
      state.selectedDivision = action.payload;
    },
    toggleTheme: (state) => {
      state.themeMode = state.themeMode === 'light' ? 'dark' : 'light';
    },
    setThemeMode: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.themeMode = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadZones.fulfilled, (state, action) => {
        state.zones = action.payload;
      })
      .addCase(loadDivisions.fulfilled, (state, action) => {
        state.divisions = action.payload;
      })
      .addCase(loadAssetTypes.fulfilled, (state, action) => {
        state.assetTypes = action.payload;
      });
  },
});

export const { setSelectedZone, setSelectedDivision, toggleTheme, setThemeMode } =
  appSlice.actions;
export default appSlice.reducer;
