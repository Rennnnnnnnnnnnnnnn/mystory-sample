// React
import { useEffect, useLayoutEffect, useRef, } from "react";
// React Query
import { useInfiniteQuery } from "@tanstack/react-query";
// Auth
import { useAuth } from "./auth/AuthProvider.jsx";
// Hooks
import useScrollRestoration from "../hooks/useScrollRestoration.jsx";
import useStoryEditor from "../hooks/useStoryEditor.jsx";
// Utils
import api from "../utils/api.js";
import { scrollPositions } from "../utils/scrollPositions.js";
// Components
import EditStoryModal from "../components/modals/EditStoryModal.jsx";
import StoryCard from "../components/profile-components/StoryCard.jsx";
import StorySkeleton from "../layout/StorySkeleton.jsx";

const useSavedStories = (user_id, limit = 10) => {
    return useInfiniteQuery({
        queryKey: ["savedStories", user_id],
        enabled: !!user_id,
        queryFn: async ({ pageParam = null }) => {
            // Build params object
            const params = { limit };

            // Add cursor params if fetching next page
            if (pageParam) {
                params.cursorDate = pageParam.cursorDate;
                params.cursorId = pageParam.cursorId;
                console.log("CursorDate sent to backend:", pageParam.cursorDate);
                console.log("Fetching with cursor:", pageParam);
            }
            const { data } = await api.get("/api/story/getSavedStories", {
                params,
            });

            return data;
        },
        getNextPageParam: (lastPage) => {
            return lastPage.nextCursor || undefined;
        },
        staleTime: 1000 * 60 * 5,   // 5 minutes
        cacheTime: 1000 * 60 * 30,  // 30 minutes
    });
};

function SavedStories() {
    const restoredRef = useRef(false);
    const { user } = useAuth();
    const user_id = user?.user_id;
    const storyEditor = useStoryEditor();

    const {
        data,
        isLoading,
        isError,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        refetch: getSavedStories,
    } = useSavedStories(user_id);

    // Flatten Pages
    const stories =
        data?.pages.flatMap((page) => page.stories) || [];

    // Scroll Restoration
    useScrollRestoration(
        "profileSavedStories",
        stories.length > 0
    );

    // Infinite Scroll
    useEffect(() => {
        const handleScroll = () => {
            const reachedBottom =
                window.innerHeight + window.scrollY >=
                document.body.offsetHeight - 200;

            if (
                reachedBottom &&
                !isFetchingNextPage
            ) {
                if (hasNextPage) {
                    console.log(
                        "Fetching next page, more data exists in DB"
                    );

                    fetchNextPage();
                } else {
                    console.log(
                        "No more data in the database"
                    );
                }
            }
        };

        window.addEventListener("scroll", handleScroll);

        return () =>
            window.removeEventListener(
                "scroll",
                handleScroll
            );
    }, [
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    ]);

    // Prevent Background Scroll When Modal Opens
    useEffect(() => {
        if (storyEditor.open) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }

        return () => {
            document.body.style.overflow = "";
        };
    }, [storyEditor.open]);
    // Conditional rendering based on query state
    if (isLoading && stories.length === 0) {
        return (
            <div className="dark:bg-gray-900 min-h-screen">
                <div className="flex flex-col text-center">
                    <h1 className="text-3xl font-semibold dark:text-white mb-2">
                        Saved Stories
                    </h1>
                    <div className="text-sm dark:text-white mb-3">
                        <p>Echoes of lives that touched yours.</p>
                    </div>
                </div>

                <div className="mt-2 mx-3 lg:mx-50">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <StorySkeleton key={i} />
                    ))}
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="dark:bg-gray-900 min-h-screen text-center">
                <div className="flex flex-col">
                    <h1 className="text-3xl font-semibold dark:text-white mb-2">
                        Saved Stories
                    </h1>
                    <div className="text-sm dark:text-white mb-3">
                        <p>Echoes of lives that touched yours.</p>
                    </div>
                </div>
                <p className="mt-40 text-red-500">
                    Failed to load saved stories.
                </p>
            </div>
        );
    }

    return (
        <>
            <div className="min-h-screen">
                <div className="flex flex-col text-center">
                    <h1 className="text-3xl font-semibold dark:text-white mb-2">
                        Saved Stories
                    </h1>
                    <div className="mb-3 text-sm dark:text-white">
                        <p>Echoes of lives that touched yours.</p>
                    </div>
                </div>

                {stories.length > 0 ? (
                    <StoryCard
                        stories={stories}
                        isPrivate={false}
                        storyEditor={storyEditor}
                        fetchStories={getSavedStories}
                    />
                ) : (
                    <p className="mt-60 text-center dark:text-white">
                        No saved stories.
                    </p>
                )}

                {isFetchingNextPage && (
                    <div className="-mt-2 mx-3 lg:mx-50">
                        <StorySkeleton />
                    </div>
                )}
            </div>

            <EditStoryModal
                isOpen={storyEditor.open}
                onClose={storyEditor.close}
                storyToEdit={storyEditor.storyToEdit}
                fetchStories={getSavedStories}
            />
        </>
    );

}

export default SavedStories;
