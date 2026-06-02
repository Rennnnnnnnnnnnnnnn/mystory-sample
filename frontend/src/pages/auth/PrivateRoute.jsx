import { useState, useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import LoginRegisterModal from "../../components/modals/LoginRegisterModal";
import SquareSpinner from "../../components/others/SquareSpinner";

export default function PrivateRoute() {
    const { isAuthenticated, loading } = useAuth();
    const [showLoginRegisterModal, setShowLoginRegisterModal] = useState(false);
    const [cancelled, setCancelled] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) {
            setShowLoginRegisterModal(true);
        }
    }, [isAuthenticated]);

    if (loading) {
        return (
            <div className="mt-25">
                <SquareSpinner />
            </div>
        )
    }

    if (isAuthenticated) {
        return <Outlet />;
    }

    if (cancelled) {
        return <Navigate to="/" replace />;
    }

    return (
        <LoginRegisterModal
            onSuccess={() => {
                setShowLoginRegisterModal(false);
            }}
            onCancel={() => setCancelled(true)}
        />
    );
}
