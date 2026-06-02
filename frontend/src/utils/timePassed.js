export const timePassed = (dateString, isPrivate = false) => {
    const date = new Date(dateString);
    const diffMs = Date.now() - date.getTime();
    const seconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    const time = date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", });

    const dateFormatted = date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    if (days >= 7) {
        return isPrivate
            ? `${dateFormatted} • ${time}`
            : dateFormatted;
    }

    if (days > 0) return `${days} day${days !== 1 ? "s" : ""} ago${isPrivate ? ` • ${time}` : ""}`;
    if (hours > 0) return `${hours} hour${hours !== 1 ? "s" : ""} ago${isPrivate ? ` • ${time}` : ""}`;
    if (minutes > 0) return `${minutes} minute${minutes !== 1 ? "s" : ""} ago${isPrivate ? ` • ${time}` : ""}`;
    if (seconds < 10) return "Just now";
    
    return `${seconds} second${seconds !== 1 ? "s" : ""} ago${isPrivate ? ` • ${time}` : ""}`;
};