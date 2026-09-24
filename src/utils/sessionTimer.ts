let logoutTimer: ReturnType<typeof setTimeout> | null = null;

export const startSessionTimer = (
  expiresAt: number,
  onExpire: () => void
) => {
  const remainingTime = expiresAt - Date.now();

  if (remainingTime <= 0) {
    onExpire();
    return;
  }

  logoutTimer = setTimeout(onExpire, remainingTime);
};

export const clearSessionTimer = () => {
  if (logoutTimer) {
    clearTimeout(logoutTimer);
    logoutTimer = null;
  }
};
