function ButtonCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="
        h-9 min-w-[72px]
        rounded-lg
        bg-gray-500 dark:bg-gray-700
        animate-pulse
        flex-shrink-0
      "
    />
  );
}

function HorizontalStoryFiltersSkeleton() {
  return (
    <div className="flex lg:justify-center">
      <div className="flex gap-2 overflow-x-auto scrollbar-none px-4">

        {/* "All" button skeleton */}
        <ButtonCardSkeleton />

        {/* Category skeletons */}
        {Array.from({ length: 11 }).map((_, i) => (
          <ButtonCardSkeleton key={i} />
        ))}

      </div>
    </div>
  );
}

export default HorizontalStoryFiltersSkeleton;
