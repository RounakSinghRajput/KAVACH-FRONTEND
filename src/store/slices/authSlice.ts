import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import type { AuthPayload, AuthUser, AuthSession } from "../../services/api";
import { SESSION_DURATION } from "../../constants/auth";

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
  loading: false, // Set default loading to false for mock mode
  isAuthenticated: false,
  error: null,
};

// MOCK SIGN IN THUNK (Bypasses API completely)
export const signIn = createAsyncThunk<
  AuthPayload,
  { username: string; password: string; captchaInput: string; captchaId: string },
  { rejectValue: string }
>(
  "auth/signIn",
  async ({ username }, { rejectWithValue }) => {
    try {
      // Simulate brief network delay
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Return hardcoded mock payload matching AuthPayload type
      const mockPayload: AuthPayload = {
        user: {
          id: "101",
          username: username || "test_user",
          roles: ["ROLE_ZONAL_ADMIN"],
        } as AuthUser,
        session: {
          accessToken: "MOCK_JWT_ACCESS_TOKEN",
          expiresAt: Date.now() + SESSION_DURATION,
        } as AuthSession,
      };

      // Store token in localStorage if required by rest of app
      localStorage.setItem("accessToken", mockPayload.session.accessToken);

      return mockPayload;
    } catch (error: any) {
      return rejectWithValue("Mock login failed");
    }
  }
);

// MOCK SIGN OUT THUNK
export const signOut = createAsyncThunk("auth/signOut", async () => {
  localStorage.removeItem("accessToken");
  await new Promise((resolve) => setTimeout(resolve, 100));
});

// MOCK LOAD USER THUNK
export const loadUser = createAsyncThunk<AuthPayload | null>(
  "auth/loadUser",
  async () => {
    const token = localStorage.getItem("accessToken");
    
    // If no token, pretend user is logged out
    if (!token) return null;

    // Return mock active user session
    return {
      user: {
        id: "101",
        username: "test_user",
        roles: ["ROLE_ZONAL_ADMIN"],
      } as AuthUser,
      session: {
        accessToken: token,
        expiresAt: Date.now() + SESSION_DURATION,
      } as AuthSession,
    };
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
      // Sign In
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
      
      // Sign Out
      .addCase(signOut.fulfilled, (state) => {
        state.user = null;
        state.session = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.error = null;
      })

      // Load User
      .addCase(loadUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(loadUser.fulfilled, (state, action) => {
        state.loading = false;

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