import StoryItem from "./StoryItem.jsx";
import { useState } from "react";
import useDeleteStory from "../../hooks/useDeleteStory.jsx";

function StoryCard({ storyEditor, stories, isPrivate, fetchStories }) {

    const deleteStory = useDeleteStory(fetchStories);
    const [activeStory, setActiveStory] = useState(null);

    return (
        <>
            <div className="mx-3 pb-2 lg:px-50 lg:px-10">
                {stories.map((story, index) => {
                 
                    return (
                        <StoryItem
                            key={story.post_id}
                            story={story}
                            index={index}
                            isPrivate={isPrivate}
                            onEdit={() => storyEditor.edit(story)}
                            onDelete={() => deleteStory(story.post_id)}
                            setActiveStory={setActiveStory}
                            activeStory={activeStory}
                        />
                    )
                })}
            </div>
        </>
    );
}

export default StoryCard;
