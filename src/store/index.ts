import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import appReducer from './slices/appSlice';
import { authListener } from "./authListener";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    app: appReducer,
  },
 middleware: (getDefaultMiddleware) =>
  getDefaultMiddleware({
    serializableCheck: {
      ignoredActions: ['auth/signIn/fulfilled'],
      ignoredPaths: ['auth.session'],
    },
  }).prepend(authListener.middleware),

});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
