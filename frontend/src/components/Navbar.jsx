// React Router
import { useNavigate, useLocation } from "react-router-dom";
// Third-party libraries
import { useQuery } from "@tanstack/react-query";
// Auth & API
import { useAuth } from "../pages/auth/AuthProvider";
import api from "../utils/api";
// Assets - Icons
import AboutIcon from "../assets/nav-icons/AboutIcon";
import FeedIcon from "../assets/nav-icons/FeedIcon";
import NotificationIcon from "../assets/nav-icons/NotificationIcon";
import ProfileIcon from "../assets/nav-icons/ProfileIcon";

const useUnreadNotificationCount = (user_id) => {
    return useQuery({
        queryKey: ["unreadNotificationCount", user_id],
        queryFn: async () => {
            const res = await api.get(
                "/api/notifications/getUnreadNotificationCount"
            );
            return res.data.unreadCount;
        },
        enabled: !!user_id,
        staleTime: 30 * 1000,
        refetchInterval: 60 * 1000,
        refetchIntervalInBackground: true,
    });
};

function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    //  const { data: unreadCount = 0 } = useUnreadNotificationCount(user?.user_id);

    return (
        <div className="fixed z-50 top-0 left-0 w-full bg-gradient-to-l from-gray-200 to-gray-700 dark:from-blue-200 dark:to-blue-900 p-4 md:px-8">
            <div className="flex justify-between items-center">
                <div className="flex flex-row gap-3 justify-center items-center">         
                    <span
                        className="text-white text-2xl hover:cursor-pointer"
                        onClick={() => navigate("/")}
                    >
                        MyStory
                    </span>
                </div>
                {/* ICONS */}
                <div className="flex flex-row gap-6 md:gap-10 lg:gap-10 justify-center items-center">
                    {/* ABOUT */}
                    <div
                        className="hover:cursor-pointer text-semibold text-2xl text-blue-800"
                        onClick={() => { navigate("/about") }}
                    >
                        <AboutIcon
                            className={`h-7 w-7 ${location.pathname === "/about" ? "text-blue-700" : "text-black hover:text-blue-500"}`}
                        />
                    </div>
                    {/* FEED */}
                    <div
                        className="hover:cursor-pointer text-semibold text-2xl text-blue-800"
                        onClick={() => { navigate("/") }}
                    >
                        <FeedIcon
                            className={`h-8 w-8 ${location.pathname === "/" ? "text-blue-700" : "text-black hover:text-blue-500"}`}
                        />
                    </div>
                    <div
                        className="relative hover:cursor-pointer"
                        onClick={() => navigate("/notification")}
                    >
                        {/* Badge */}
                        <div className="absolute -top-2 -right-2">
                            {/* {unreadCount > 0 && (
                                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-semibold leading-none text-white bg-red-600 rounded-full">
                                    {unreadCount}
                                </span>
                            )} */}
                        </div>
                        <NotificationIcon
                            className={`h-7 w-7 ${location.pathname === "/notification" ? "text-blue-700" : "text-black hover:text-blue-500"}`}
                        />
                    </div>

                    <div className="hover:cursor-pointer text-semibold text-2xl text-blue-800"
                        onClick={() => {
                            navigate("/profile/my-stories")
                        }}>
                        <ProfileIcon
                            className={`h-7 w-7 ${location.pathname.includes("/profile") ? "text-blue-700" : "text-black hover:text-blue-500"}`}
                        />
                    </div>

                </div>
            </div>
        </div>
    )
}

export default Navbar;