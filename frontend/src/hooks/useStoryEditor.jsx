// src/hooks/useStoryEditor.js
import { useState } from "react";

function useStoryEditor() {
    const [storyToEdit, setStoryToEdit] = useState(null);
    const [open, setOpen] = useState(false);

    const edit = (story) => {
        setStoryToEdit(story);
        setOpen(true);
    };

    const close = () => setOpen(false);

    return { edit, open, close, storyToEdit };
}

export default useStoryEditor;
