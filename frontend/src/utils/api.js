import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true
});

// REQUEST INTERCEPTOR
api.interceptors.request.use((config) => {

    const token = localStorage.getItem("accessToken");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

// RESPONSE INTERCEPTOR
api.interceptors.response.use(

    (response) => response,

    async (error) => {

        const originalRequest = error.config;

        const accessToken = localStorage.getItem("accessToken");
        const refreshToken = localStorage.getItem("refreshToken");

        // stop infinite refresh loop
        if (
            originalRequest.url.includes("/auth/refreshUserToken")
        ) {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");

            return Promise.reject(error);
        }

        // no refresh token
        if (!refreshToken) {
            return Promise.reject(error);
        }

        // attempt refresh
        if (
            error.response?.status === 401 &&
            !originalRequest._retry &&
            refreshToken
        ) {

            originalRequest._retry = true;

            try {

                const response = await axios.post(
                    `${import.meta.env.VITE_API_URL}/api/auth/refreshUserToken`,
                    { refreshToken }
                );

                const newAccessToken = response.data.accessToken;

                localStorage.setItem("accessToken", newAccessToken);

                originalRequest.headers.Authorization =
                    `Bearer ${newAccessToken}`;

                return api(originalRequest);

            } catch (refreshError) {

                localStorage.removeItem("accessToken");
                localStorage.removeItem("refreshToken");

                window.location.href = "/";

                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;