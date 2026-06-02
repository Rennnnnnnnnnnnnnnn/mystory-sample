// React
import { useEffect, useState } from "react";
// React Router
import { useLocation, useParams } from "react-router-dom";
// React Query
import { useQuery } from "@tanstack/react-query";
// Utils
import api from "../utils/api";
// Hooks
import useDeleteStory from "../hooks/useDeleteStory";
import useStoryEditor from "../hooks/useStoryEditor";
// Components
import StoryItem from "../components/profile-components/StoryItem";
import EditStoryModal from "../components/modals/EditStoryModal";

function SinglePostPage() {
    const { post_id } = useParams();
    const [activeStory, setActiveStory] = useState(null);
    const storyEditor = useStoryEditor();
    const deleteStory = useDeleteStory();
    const location = useLocation();
    const [openCommentsFromNotif, setOpenCommentsFromNotif] = useState(false);

    useEffect(() => {
        if (location.state?.openComments) {
            setOpenCommentsFromNotif(true);
        }
    }, [location.state]);

    const { data: story, isLoading, isError, refetch: fetchPost } = useQuery({
        queryKey: ["singlePost", post_id],
        queryFn: async () => {
            const res = await api.get(`/api/story/getIndividualPublicPost/${post_id}`);
            return res.data;
        },
        enabled: !!post_id,
        staleTime: 1000 * 60, 
        cacheTime: 1000 * 60 * 5 
    });

    if (isLoading) return (
        <div className="mx-3 pt-3 lg:mx-50 lg:p-10 min-h-screen">
            <div className="mt-19 h-max-screen p-6 mb-4 rounded-lg border-t-12 border-gray-600 dark:border-blue-600/60 bg-gray-400 dark:bg-neutral-900">
                {/* HEADER */}
                <div className="flex justify-between animate-pulse">
                    <div className="space-y-2">
                        <div className="h-3 w-32 bg-gray-600 dark:bg-gray-500 rounded" />
                    </div>

                    <div className="flex gap-2">
                        <div className="h-8 w-8 bg-gray-600 dark:bg-gray-500 rounded-xl" />
                    </div>
                </div>
                {/* TITLE */}
                <div className="mt-4 mb-6 animate-pulse">

                    <div className="h-6 w-3/3 bg-gray-600 dark:bg-gray-500 rounded" />
                </div>
                {/* CONTENT */}
                <div className="space-y-3 animate-pulse">

                    {/* paragraph 1 */}
                    <div className="space-y-2">
                        <div className="h-4 w-full bg-gray-600 dark:bg-gray-500 rounded" />
                        <div className="h-4 w-11/12 bg-gray-600 dark:bg-gray-500 rounded" />
                        <div className="h-4 w-5/6 bg-gray-600 dark:bg-gray-500 rounded" />
                        <div className="h-4 w-9/12 bg-gray-600 dark:bg-gray-500 rounded" />
                    </div>

                    {/* paragraph 2 */}
                    <div className="space-y-2">
                        <div className="h-4 w-10/12 bg-gray-600 dark:bg-gray-500 rounded" />
                        <div className="h-4 w-full bg-gray-600 dark:bg-gray-500 rounded" />
                        <div className="h-4 w-8/12 bg-gray-600 dark:bg-gray-500 rounded" />
                    </div>

                    {/* paragraph break */}
                    <div className="h-2" />

                    {/* paragraph 3 */}
                    <div className="space-y-2">
                        <div className="h-4 w-full bg-gray-600 dark:bg-gray-500 rounded" />
                        <div className="h-4 w-7/12 bg-gray-600 dark:bg-gray-500 rounded" />
                        <div className="h-4 w-11/12 bg-gray-600 dark:bg-gray-500 rounded" />
                        <div className="h-4 w-4/5 bg-gray-600 dark:bg-gray-500 rounded" />
                    </div>

                    {/* paragraph 4 */}
                    <div className="space-y-2">
                        <div className="h-4 w-9/12 bg-gray-600 dark:bg-gray-500 rounded" />
                        <div className="h-4 w-full bg-gray-600 dark:bg-gray-500 rounded" />
                        <div className="h-4 w-10/12 bg-gray-600 dark:bg-gray-500 rounded" />
                    </div>

                    {/* paragraph break */}
                    <div className="h-2" />

                    {/* paragraph 5 */}
                    <div className="space-y-2">
                        <div className="h-4 w-full bg-gray-600 dark:bg-gray-500 rounded" />
                        <div className="h-4 w-11/12 bg-gray-600 dark:bg-gray-500 rounded" />
                        <div className="h-4 w-8/12 bg-gray-600 dark:bg-gray-500 rounded" />
                        <div className="h-4 w-3/4 bg-gray-600 dark:bg-gray-500 rounded" />
                    </div>

                    {/* paragraph 6 */}
                    <div className="space-y-2">
                        <div className="h-4 w-10/12 bg-gray-600 dark:bg-gray-500 rounded" />
                        <div className="h-4 w-full bg-gray-600 dark:bg-gray-500 rounded" />
                        <div className="h-4 w-9/12 bg-gray-600 dark:bg-gray-500 rounded" />
                    </div>

                    {/* paragraph 6 */}
                    <div className="space-y-2">
                        <div className="h-4 w-full bg-gray-600 dark:bg-gray-500 rounded" />
                        <div className="h-4 w-11/12 bg-gray-600 dark:bg-gray-500 rounded" />
                    </div>
                </div>

                {/* FOOTER */}
                <div className="flex justify-between items-center mt-6 animate-pulse">
                    <div className="flex items-center gap-2">
                        <div className="h-7 w-7 bg-gray-600 dark:bg-gray-500 rounded-full" />
                        <div className="h-4 w-10 bg-gray-600 dark:bg-gray-500 rounded" />
                    </div>
                    <div className="h-3 w-20 bg-gray-600 dark:bg-gray-500 rounded" />
                </div>
            </div>
        </div>
    )

    if (isError) return (
        <div className="min-h-screen">
            <div className="mx-3 pt-3 lg:mx-50 lg:p-10 ">
                <div className="mt-40 dark:text-white text-center">
                    POST NOT FOUND
                </div>
            </div>
        </div>
    )

    return (
        <>
            <div className="min-h-screen pt-15">
                <div className="mx-3 pt-3 lg:mx-50 lg:p-10 pb-1">
                    <StoryItem
                        key={story.post_id}
                        story={story}
                        isPrivate={false}
                        onEdit={() => storyEditor.edit(story)}
                        onDelete={() => deleteStory(story.post_id)}
                        activeStory={activeStory}
                        setActiveStory={setActiveStory}
                        isFromSinglePage={true}
                        openCommentsFromNotif={openCommentsFromNotif}
                    />
                </div>

                <EditStoryModal
                    isOpen={storyEditor.open}
                    onClose={storyEditor.close}
                    storyToEdit={storyEditor.storyToEdit}
                    fetchStories={fetchPost}
                />
            </div>
        </>
    )
}

export default SinglePostPage;
