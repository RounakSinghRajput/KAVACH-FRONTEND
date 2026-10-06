import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { api } from "../../services/api";
import type { AuthPayload, AuthUser, AuthSession } from "../../services/api";
import {SESSION_DURATION} from '../../constants/auth';

export interface AuthState {
  user: AuthUser | null;
  session: AuthSession | null;
  loading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  
}
const initialState: AuthState = {
  user: null,
  session: null,
  loading: true,
  isAuthenticated: false,
  error: null,
  
};
export const signIn = createAsyncThunk<
  AuthPayload,                           
  { username: string; password: string; captchaInput: string; captchaId: string; }, 
  { rejectValue: string }                
>(
  "auth/signIn",
  async ({ username, password, captchaInput, captchaId }, { rejectWithValue }) => {
    try {
      const response = await api.auth.signIn(username, password, captchaInput, captchaId);

      return {
        ...response,
        session: {
          ...response.session,
          expiresAt: Date.now() + SESSION_DURATION,
        },
      };

    } catch (error: any) {

      if (!error.response) {
        return rejectWithValue("Network error. Check internet connection.");
      }

      if (error.response.status === 401) {
        return rejectWithValue("Invalid username or password.");
      }

      return rejectWithValue(
        error.response?.data?.message || "Login failed"
      );
    }
  }
);
export const signOut = createAsyncThunk("auth/signOut", async () => {
  await api.auth.signOut();
});
export const loadUser = createAsyncThunk<AuthPayload | null>(
  "auth/loadUser",
  async () => {
    return await api.auth.getCurrentUser();
  }
);
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<AuthUser | null>) => {
      state.user = action.payload;
      state.isAuthenticated = Boolean(action.payload);
    },
    clearError: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(signIn.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signIn.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.session = action.payload.session;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(signIn.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Sign in failed";
      })
     .addCase(signOut.fulfilled, (state) => {
        state.user = null;
        state.session = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.error = null;
      })
     .addCase(loadUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(loadUser.fulfilled, (state, action) => {
    state.loading = false;

    // Don't overwrite a user that has just logged in
    if (state.isAuthenticated && state.user) {
        return;
    }

    state.user = action.payload?.user ?? null;
    state.session = action.payload?.session ?? null;
    state.isAuthenticated = Boolean(action.payload);
})
      .addCase(loadUser.rejected, (state) => {
        state.loading = false;
        state.user = null;
        state.session = null;
        state.isAuthenticated = false;
      });
  },
});
export const { setUser, clearError } = authSlice.actions;
export default authSlice.reducer;