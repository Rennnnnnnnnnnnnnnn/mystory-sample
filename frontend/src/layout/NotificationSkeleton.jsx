function NotificationSkeleton() {
    return (
        <div className="mx-auto w-full lg:max-w-2/5">
            <div className="p-6 rounded-lg
                border-t-12 border-gray-600 dark:border-blue-600/60
                bg-gray-400 dark:bg-gray-900
                space-y-1
                animate-pulse
            ">
                <div className="h-3 w-1/6 bg-gray-600 dark:bg-gray-500 rounded" />
                <div className="h-4 w-3/5 bg-gray-600 dark:bg-gray-500 rounded" />
                <div className="flex items-center gap-2">
                    <div className="h-4 w-20 bg-gray-600 dark:bg-gray-500 rounded" />
                    <div className="h-6 w-6 bg-gray-600 dark:bg-gray-500 rounded-full" />
                </div>
                <div className="h-2" />
                <div className="h-4 w-full bg-gray-600 dark:bg-gray-500 rounded" />
                <div className="h-4 w-5/6 bg-gray-600 dark:bg-gray-500 rounded" />
            </div>
        </div>
    );
}

export default NotificationSkeleton;
