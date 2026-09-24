import { createListenerMiddleware } from "@reduxjs/toolkit";
import { signIn, signOut, loadUser } from "./slices/authSlice";
import { startSessionTimer, clearSessionTimer } from "../utils/sessionTimer";

export const authListener = createListenerMiddleware();

/* LOGIN → start 24h timer */
authListener.startListening({
  actionCreator: signIn.fulfilled,
  effect: async (action, api) => {
    clearSessionTimer();

    startSessionTimer(action.payload.session.expiresAt, () => {
      api.dispatch(signOut());
    });
  },
});

/* PAGE REFRESH → restart timer */
authListener.startListening({
  actionCreator: loadUser.fulfilled,
  effect: async (action, api) => {
    if (action.payload?.session?.expiresAt) {
      clearSessionTimer();

      startSessionTimer(action.payload.session.expiresAt, () => {
        api.dispatch(signOut());
      });
    }
  },
});

/* LOGOUT → clear timer */
authListener.startListening({
  actionCreator: signOut.fulfilled,
  effect: async () => {
    clearSessionTimer();
  },
});
