
import { createContext, useState, useContext, useEffect } from 'react';
import api from '../../utils/api';
import { useQueryClient } from "@tanstack/react-query";
import SquareSpinner from '../../components/others/SquareSpinner';

const AuthContext = createContext(null);

function AuthProvider({ children }) {

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const isAuthenticated = !!user;
    const queryClient = useQueryClient();

    const login = (userData) => {
        setUser(userData);
    }

    const logout = () => {
        setUser(null);
    }

    useEffect(() => {
        const verifyUser = async () => {
            try {
                const res = await api.get("/api/auth/verifyUser");
                setUser(res.data.user);
            } catch (error) {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        verifyUser();
    }, [])

    useEffect(() => {
        if (!user?.user_id) return;

        queryClient.prefetchInfiniteQuery({
            queryKey: ["notifications", user.user_id],
            queryFn: async ({ pageParam = null }) => {
                const url = pageParam
                    ? `/api/notifications/getNotifications?limit=10&cursor=${pageParam}`
                    : `/api/notifications/getNotifications?limit=10`;
                const res = await api.get(url);
                return res.data;
            },
            staleTime: 1000 * 60 * 5,
        });
    }, [user?.user_id, queryClient]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen" >
                <SquareSpinner size="w-12 h-12" />
            </div>
        );
    }

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext);
export default AuthProvider;