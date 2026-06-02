import { useRef, useState, useLayoutEffect, useEffect } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useAuth } from "./auth/AuthProvider";
import useStoryEditor from "../hooks/useStoryEditor";
import StoryCard from "../components/profile-components/StoryCard";
import StorySkeleton from "../layout/StorySkeleton";
import CreateStoryModal from "../components/modals/CreateStoryModal";
import EditStoryModal from "../components/modals/EditStoryModal";
import api from "../utils/api";
import { scrollPositions } from "../utils/scrollPositions";
import useScrollRestoration from "../hooks/useScrollRestoration";

export const usePrivateStories = (user_id, limit = 10) => {
    return useInfiniteQuery({
        queryKey: ["privateStories", user_id],
        queryFn: async ({ pageParam = null }) => {
            // Stringify the object so it's not sent as "[object Object]"
            const cursorStr = pageParam ? encodeURIComponent(JSON.stringify(pageParam)) : null;
            
            const url = cursorStr
                ? `/api/story/getPrivateStories?limit=${limit}&cursor=${cursorStr}`
                : `/api/story/getPrivateStories?limit=${limit}`;

            const res = await api.get(url);
            return res.data;
        },
        getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
        enabled: !!user_id,
        staleTime: 1000 * 60 * 5,
        cacheTime: 1000 * 60 * 30,
    });
};

function MyStories() {
    const restoredRef = useRef(false);
    const { user } = useAuth();
    const user_id = user.user_id;
    const storyEditor = useStoryEditor();
    const [isCreateStoryModalOpen, setIsCreateStoryModalOpen] = useState(false);

    const {
        data,
        isLoading,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        refetch: getPrivateStories,
    } = usePrivateStories(user_id, 10);

    const stories = data?.pages.flatMap((page) => page.stories) || [];

    //SCROLL POSITION RESTORATION
    useScrollRestoration("profileMyStories", stories.length > 0);

    // Infinite scroll on scroll event
    useEffect(() => {
        const handleScroll = () => {
            if (
                window.innerHeight + window.scrollY >=
                document.body.offsetHeight - 200 &&
                hasNextPage &&
                !isFetchingNextPage
            ) {
                fetchNextPage();
            }
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

    // Prevent background scrolling when a modal is open
    useEffect(() => {
        if (isCreateStoryModalOpen || storyEditor.open) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        // Clean up in case component unmounts
        return () => {
            document.body.style.overflow = "";
        };
    }, [isCreateStoryModalOpen, storyEditor.open]);


    if (isLoading && stories.length === 0) {
        return (
            <div className="dark:bg-gray-900 min-h-screen">
                <div className="flex flex-col text-center">
                    <h1 className="text-3xl font-semibold dark:text-white text-center mb-2">
                        My Stories
                    </h1>
                    <div className="text-sm dark:text-white mb-3">
                        <p>Some you shared with others.</p>
                        <p>Some you kept for yourself.</p>
                        {/* <p>Either way, everything is valuable.</p> */}
                    </div>
                </div>

                <div className="flex justify-center items-center mb-4">
                    <button
                        className="mt-1 px-4 py-3 bg-red-600/80 hover:bg-red-700 dark:bg-red-700 hover:dark:bg-red-600/80 text-white font-semibold rounded-lg shadow-md transition transform"
                        onClick={() => setIsCreateStoryModalOpen(true)}
                    >
                        CREATE STORY
                    </button>
                </div>

                <div className="mx-3 lg:mx-50">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <StorySkeleton key={i} />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="min-h-screen">
                <div className="flex flex-col text-center dark:text-white">
                    <h1 className="text-3xl font-semibold mb-2">My Stories</h1>
                    <div className="text-sm mb-3">
                        <p>Some you shared with others.</p>
                        <p>Some you kept for yourself.</p>
                        {/* <p>Either way, everything is valuable.</p> */}
                    </div>
                </div>

                <div className="flex justify-center items-center mb-4">
                    <button
                        className="mt-1 px-4 py-3 bg-red-600/80 dark:bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition transform hover:cursor-pointer"
                        onClick={() => setIsCreateStoryModalOpen(true)}
                    >
                        CREATE STORY
                    </button>
                </div>

                <StoryCard
                    stories={stories}
                    storyEditor={storyEditor}
                    fetchStories={getPrivateStories}
                    isPrivate={true}
                />
            </div>

            {isFetchingNextPage && (
                <div className="mx-3 -mt-2 lg:mx-50">
                    <StorySkeleton />
                </div>
            )}

            <CreateStoryModal
                isOpen={isCreateStoryModalOpen}
                onClose={() => setIsCreateStoryModalOpen(false)}
                getPrivateStories={getPrivateStories}
            />
            <EditStoryModal
                isOpen={storyEditor.open}
                onClose={storyEditor.close}
                storyToEdit={storyEditor.storyToEdit}
                fetchStories={getPrivateStories}
            />
        </>
    )
}

export default MyStories;
