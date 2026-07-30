import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

let loggingOut = false;

// Define a structural interface for our queued requests
interface RetryQueueItem {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}

let isRefreshing = false;
let failedQueue: RetryQueueItem[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

export const setLoggingOut = (value: boolean) => {
  loggingOut = value;
};

const api = axios.create({
  baseURL: "http://172.17.49.40:3000/api", // "http://localhost:3000/api"
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Custom interface extending AxiosRequestConfig to legally track our retry status
interface CustomRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as CustomRequestConfig;

    const url = original?.url || "";
    if (url.includes("/auth/login") || url.includes("/auth/refresh")) {
      return Promise.reject(error);
    }

    if (loggingOut) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true;

      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            return api(original);
          })
          .catch((err) => Promise.reject(err));
      }

      isRefreshing = true;

      try {
        const refreshResponse = await axios.post<{ accessToken: string }>(
          `${api.defaults.baseURL}/auth/refresh`,
          {},
          { withCredentials: true },
        );

        const newAccessToken = refreshResponse.data.accessToken;

        localStorage.setItem("accessToken", newAccessToken);
        api.defaults.headers.common["Authorization"] =
          `Bearer ${newAccessToken}`;
        original.headers.Authorization = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);

        return api(original);
      } catch (refreshError) {
        processQueue(refreshError, null);

        console.error("REFRESH ERROR", refreshError);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");

        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default api;
