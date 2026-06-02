import React from "react";

function NotifBadge({ unreadCount }) {
    return (
        <div >
            {/* Red badge */}
            {unreadCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                    {unreadCount}
                </span>
            )}
        </div>
    );
}

export default NotifBadge;
