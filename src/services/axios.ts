import axios from 'axios';
import { store } from "../store/index";
import { signOut } from "../store/slices/authSlice";

export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// REQUEST INTERCEPTOR (Headers + Backend Proxy Bypass Mocks)
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // --- CLIENT-SIDE PROXY / BACKEND BYPASS MOCKS ---

  // 1. Mock CAPTCHA Fetch Endpoint
  if (config.url?.includes("/api/captcha")) {
    config.adapter = async () => ({
      data: {
        status: "SUCCESS",
        data: {
          captchaId: "BYPASS_CAPTCHA_ID",
          imageBase64:
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
        },
      },
      status: 200,
      statusText: "OK",
      headers: {},
      config,
    });
  }

  // 2. Mock SignIn / Login Endpoint
  if (config.url?.includes("/auth/login") || config.url?.includes("/signIn")) {
    config.adapter = async () => ({
      data: {
        user: {
          id: "101",
          username: "test_user",
          roles: ["ROLE_ZONAL_ADMIN"],
        },
        accessToken: "MOCK_JWT_ACCESS_TOKEN",
      },
      status: 200,
      statusText: "OK",
      headers: {},
      config,
    });
  }

  // 3. Mock Current User Details Endpoint
  if (config.url?.includes("/user") || config.url?.includes("/profile")) {
    config.adapter = async () => ({
      data: {
        id: "101",
        empCode: "EMP12345",
        name: "Test User",
        roles: ["ROLE_ZONAL_ADMIN"],
      },
      status: 200,
      statusText: "OK",
      headers: {},
      config,
    });
  }

  // 4. Mock Navigation Menu Endpoint
  if (config.url?.includes("/menu")) {
    config.adapter = async () => ({
      data: [
        {
          id: 1,
          name: "Dashboard",
          link: "/dashboard",
          active: true,
        },
        {
          id: 2,
          name: "Reports",
          link: "/reports",
          active: true,
        },
      ],
      status: 200,
      statusText: "OK",
      headers: {},
      config,
    });
  }

  return config;
});

let isLoggingOut = false;

// RESPONSE INTERCEPTOR
axiosInstance.interceptors.response.use(
  (response) => response,

  (error) => {
    if (error.response?.status === 401 && !isLoggingOut) {
      isLoggingOut = true;

      console.warn("401 Unauthorized → auto logout");

      store.dispatch(signOut());
    }

    return Promise.reject(error);
  }
);