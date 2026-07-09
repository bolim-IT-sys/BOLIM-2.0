import axios from "axios";

// 1. Keep your base URL dynamic so it supports environment switching easily
const api = axios.create({
  baseURL: "http://localhost:3000/api",
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

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    // If the request came from the login route, don't try to refresh!
    if (
      (original.url && original.url.includes("/auth/login")) ||
      original.url.includes("/auth/refresh")
    ) {
      return Promise.reject(error);
    }

    // Check for 401 unauthorized errors and ensure we haven't already retried this request
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      try {
        // Use the instance base configuration to ensure the route hits your backend correctly
        const refresh = await api.post("/auth/refresh", {});
        const newAccessToken = refresh.data.accessToken;

        // Save only the new token
        localStorage.setItem("accessToken", newAccessToken);

        // Update authorization headers on the failed request configuration object
        original.headers.Authorization = `Bearer ${newAccessToken}`;

        // Fire the original request again with the updated token data
        return api(original);
      } catch (refreshError: any) {
        // Clean up only authentication data to protect user preferences
        console.log("REFRESH ERROR", refreshError);
        console.log(refreshError.response);
        console.log(refreshError.response?.data);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");

        // Boot them to login
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
