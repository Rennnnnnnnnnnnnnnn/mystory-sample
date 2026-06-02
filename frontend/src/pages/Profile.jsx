import { useRef, useEffect, useState } from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";

function Profile() {
    const [showProfileNav, setShowProfileNav] = useState(true);
    const lastScrollY = useRef(0);
    const ignoreNextScrollRef = useRef(false);
    const location = useLocation();

    // ✅ SAME LOGIC AS LAYOUT
    useEffect(() => {
        setShowProfileNav(true);
        ignoreNextScrollRef.current = true;
        lastScrollY.current = window.scrollY;
    }, [location.pathname]);

    useEffect(() => {
        const handleScroll = () => {
            if (ignoreNextScrollRef.current) {
                ignoreNextScrollRef.current = false;
                lastScrollY.current = window.scrollY;
                return;
            }

            if (window.scrollY > lastScrollY.current && window.scrollY > 10) {
                setShowProfileNav(false);
            } else if (window.scrollY < lastScrollY.current) {
                setShowProfileNav(true);
            }

            lastScrollY.current = window.scrollY;
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <div className="pt-15 min-h-screen">
            {/* Profile Navigation */}
            <div
                className={`
                    fixed top-18 w-full z-50
                    flex justify-evenly p-4
                    text-black dark:text-white
                    bg-gray-300 dark:bg-gray-900
                    hover:cursor-pointer
                    transition-transform transition-opacity duration-300 ease-in-out
                    ${showProfileNav ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-6 pointer-events-none"}
                        `}
            >
                <NavLink
                    to="saved-stories"
                    className={({ isActive }) =>
                        `cursor-pointer ${isActive ? "underline underline-offset-10 decoration-3 dark:text-blue-300" : ""}`
                    }
                >
                    Saved
                </NavLink>

                <NavLink
                    to="my-stories"
                    className={({ isActive }) =>
                        `cursor-pointer ${isActive ? "underline underline-offset-10 decoration-3 dark:text-blue-300" : ""}`
                    }
                >
                    My Stories
                </NavLink>



                <NavLink
                    to="settings"
                    className={({ isActive }) =>
                        `cursor-pointer ${isActive ? "underline underline-offset-10 decoration-3 dark:text-blue-300" : ""}`
                    }
                >
                    Settings
                </NavLink>
            </div>

            {/* Render nested profile pages */}
            <div className="overflow-hidden relative mt-20">
                <Outlet />
            </div>
        </div>
    );
}

export default Profile;