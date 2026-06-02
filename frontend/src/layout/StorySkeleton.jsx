function StorySkeleton() {
    return (
        <div className="p-6 mb-4 rounded-lg border-t-12 border-gray-600 dark:border-blue-600/60 bg-gray-400 dark:bg-neutral-900">
            {/* HEADER */}
            <div className="animate-pulse">
                <div className="space-y-2">
                    <div className="h-3 w-28 bg-gray-600 dark:bg-gray-500 rounded" />
                    <div className="h-3 w-2/5 bg-gray-600 dark:bg-gray-500 rounded" />
                </div>
            </div>
            {/* TITLE */}
            <div className="mt-4 mb-4 animate-pulse space-y-2">
                <div className="h-5 w-3/3 bg-gray-600 dark:bg-gray-500 rounded" />
                <div className="h-5 w-2/3 bg-gray-600 dark:bg-gray-500 rounded" />
            </div>
            {/* CONTENT */}
            <div className="space-y-3 animate-pulse">
                <div className="h-4 w-full bg-gray-600 dark:bg-gray-500 rounded" />
                <div className="h-4 w-12/12 bg-gray-600 dark:bg-gray-500 rounded" />
                {/* <div className="h-4 w-12/12 bg-gray-600 dark:bg-gray-500 rounded" /> */}
                <div className="h-4 w-12/12 bg-gray-600 dark:bg-gray-500 rounded" />

                <div className="h-4 w-5/6 bg-gray-600 dark:bg-gray-500 rounded" />
            </div>
            {/* FOOTER */}
            <div className="flex justify-between items-center mt-4 animate-pulse">
                <div className="h-4 w-1/5 bg-gray-600 dark:bg-gray-500 rounded" />
                <div className="h-4 w-15 bg-gray-600 dark:bg-gray-500 rounded" />
            </div>
        </div>
    )
}

export default StorySkeleton