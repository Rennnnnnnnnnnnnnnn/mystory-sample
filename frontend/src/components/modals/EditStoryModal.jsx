import { useEffect, useState, useRef } from "react";
import { useConfirmationModal } from "../../context/ModalContext";
import api from "../../utils/api";
import { emotionFilterConfig } from "../../utils/StoryFilters";

const categoryToFeelingMap = Object.entries(emotionFilterConfig).reduce(
    (acc, [feeling, data]) => {
        acc[data.category] = feeling;
        return acc;
    },
    {}
);

function EditStoryModal({ isOpen, onClose, storyToEdit, fetchStories }) {

    const [selectedFeelings, setSelectedFeelings] = useState([]);
    const [showFeelingsButtons, setShowFeelingsButtons] = useState(false);
    const [error, setError] = useState("");
    const textareaRef = useRef(null);

    const [updatedStory, setUpdatedStory] = useState({
        heading: "",
        content: "",
        audience: "",
        canComment: "",
        category: []
    });

    const { openConfirmationModal } = useConfirmationModal();

    useEffect(() => {
        if (!storyToEdit) return;

        const feelings = (storyToEdit.category || [])
            .map(cat => categoryToFeelingMap[cat])
            .filter(Boolean);

        setSelectedFeelings(feelings);

        setUpdatedStory({
            heading: storyToEdit.heading,
            content: storyToEdit.content,
            audience: storyToEdit.audience,
            canComment: storyToEdit.can_comment,
            category: storyToEdit.category
        });
    }, [storyToEdit]);

    useEffect(() => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const computed = window.getComputedStyle(textarea);
        const lineHeight = parseFloat(computed.lineHeight);
        const maxLines = 5;
        const maxHeight = lineHeight * maxLines;

        textarea.style.height = "auto";

        if (textarea.scrollHeight > maxHeight) {
            textarea.style.height = `${maxHeight}px`;
            textarea.style.overflowY = "auto";
        } else {
            textarea.style.height = `${textarea.scrollHeight}px`;
            textarea.style.overflowY = "hidden";
        }
    }, [updatedStory.heading]);

    const toggleFeeling = (feeling) => {
        setSelectedFeelings(prev => {
            const next = prev.includes(feeling)
                ? prev.filter(f => f !== feeling)
                : [...prev, feeling];

            const categories = next.map(
                f => emotionFilterConfig[f].category
            );

            setUpdatedStory(prevStory => ({
                ...prevStory,
                category: categories
            }));
            return next;
        });
    };

    const triggerError = (msg) => {
        setError(msg);
        setTimeout(() => {
            setError("");
        }, 5000);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setUpdatedStory(prev => ({
            ...prev,
            [name]: value
        }));
    }

    const handleSubmit = () => {
        if (!updatedStory.content.trim()) {
            triggerError("Please write story content before saving.");
            return;
        }
        if (updatedStory.category.length === 0) {
            triggerError("Please select at least one feeling.");
            setShowFeelingsButtons(true)
            return;
        }

        openConfirmationModal({
            title: "Confirm Changes",
            message: "Are you sure you want to save the changes to this story?",
            actionLabel: "Editing story",
            onConfirm: async () => {
                try {
                    const res = await api.put(`/api/story/updateStory`, {
                        post_id: storyToEdit.post_id,
                        heading: updatedStory.heading,
                        content: updatedStory.content,
                        audience: updatedStory.audience,
                        canComment: updatedStory.canComment,
                        category: updatedStory.category
                    })

                    if (res.status === 200) {
                        fetchStories();
                        onClose();
                        setSelectedFeelings([]);
                    }
                } catch (error) {
                    console.log("Error updating story: ", error)
                }
            }
        })
    }

    const grouped = {
        positive: [],
        neutral: [],
        negative: [],
    };

    Object.entries(emotionFilterConfig).forEach(([name, data]) => {
        grouped[data.polarity].push([name, data]);
    });


    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-neutral-100 dark:bg-gray-800 z-50 flex flex-col">
            {/* Top Bar */}
            <div className="flex items-center justify-between px-4 py-3 border-b bg-white dark:bg-gray-800 sticky top-0">
                <button
                    onClick={onClose}
                    className="text-blue-600 dark:text-blue-400 font-medium hover:cursor-pointer"
                >
                    Cancel
                </button>

                <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200">
                    Edit Story
                </h2>

                <button
                    onClick={handleSubmit}
                    className="text-blue-600 dark:text-blue-400 font-semibold hover:cursor-pointer"
                >
                    Save
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 p-4">
                {/* Story Heading */}
                <textarea
                    ref={textareaRef}
                    name="heading"
                    value={updatedStory.heading}
                    onChange={handleInputChange}
                    placeholder="Story title (optional)"
                    rows={1}
                    className="w-full text-xl font-semibold placeholder-gray-400 dark:placeholder-gray-500
                                focus:outline-none bg-transparent dark:bg-gray-800 
                                resize-none overflow-hidden text-gray-800 dark:text-gray-100"
                />

                {/* Divider */} <div className="border-t-2 border-gray-200 dark:border-gray-600 my-3" />

                {/* Error for content */}
                {error === "Please write story content before saving." && (
                    <p className="text-red-500 dark:text-red-400 text-xs mb-2">
                        ⚠️ {error}
                    </p>
                )}

                {/* Story Content */}
                <textarea
                    name="content"
                    value={updatedStory.content}
                    onChange={handleInputChange}
                    placeholder="What's your story . . ."
                    className="w-full min-h-[60vh] text-md leading-relaxed
                        bg-transparent dark:bg-gray-800 resize-none
                        focus:outline-none text-gray-800 dark:text-gray-300 text-justify pr-2 md:pr-4
                        "
                />

                {/* Divider */} <div className="border-t-2 border-gray-200 dark:border-gray-600 my-3" />

                {/* Feelings */}
                <div className="flex flex-col">
                    {error === "Please select at least one feeling." && (
                        <p className="text-red-500 dark:text-red-400 text-xs my-1">
                            ⚠️ {error}
                        </p>
                    )}

                    <span
                        className="text-gray-700 dark:text-gray-300 font-medium mb-2 cursor-pointer"
                        onClick={() => setShowFeelingsButtons(!showFeelingsButtons)}
                    >
                        This story feels
                        <span className="text-sm">{showFeelingsButtons ? " ▲" : " . . ."}</span>
                    </span>

                    {/* Collapsed: show only selected */}
                    {!showFeelingsButtons && selectedFeelings.length > 0 && (
                        <div className="flex flex-col gap-1">
                            <div className="grid grid-cols-5 sm:grid-cols-4 md:grid-cols-6 gap-1">
                                {selectedFeelings.map((name) => {
                                    const data = emotionFilterConfig[name];
                                    return (
                                        <button
                                            key={name}
                                            onClick={() => toggleFeeling(name)}
                                            className={`w-full px-2 py-1 rounded-lg transition hover:cursor-pointer
                        flex items-center justify-center
                        text-center leading-tight
                        whitespace-normal break-words hyphens-auto
                        text-[10px] sm:text-xs
                        min-h-[2.25rem]
                        ${selectedFeelings.includes(name)
                                                    ? `bg-gradient-to-bl ${data.gradient} shadow-md`
                                                    : "bg-gray-400"
                                                }`}
                                        >
                                            <span>{name}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Expanded: grouped buttons */}
                    {showFeelingsButtons && (
                        <div className="flex flex-col gap-1 md:gap-3">
                            {["positive", "negative", "neutral"].map((group) => (
                                <div
                                    key={group}
                                    className="
                                    grid grid-cols-5 
                                    md:grid-cols-[repeat(auto-fit,minmax(140px,1fr))]
                                    gap-1 md:gap-3 
                                    md:justify-center"
                                >
                                    {grouped[group].map(([name, data]) => (
                                        <button
                                            key={name}
                                            onClick={() => toggleFeeling(name)}
                                            className={`px-3 py-1 rounded-lg transition
                                flex items-center justify-center hover:cursor-pointer
                                text-center leading-tight
                                whitespace-normal break-words hyphens-auto
                                text-[10px] sm:text-xs
                                min-h-[2.25rem]
                                ${selectedFeelings.includes(name)
                                                    ? `bg-gradient-to-bl ${data.gradient} shadow-md`
                                                    : "bg-gray-400"
                                                }`}
                                        >
                                            <span>{name}</span>
                                        </button>
                                    ))}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Divider */} <div className="border-t-2 border-gray-200 dark:border-gray-600 my-3" />

                {/* Story Settings */}
                <div className="mt-2 bg-gray-50 dark:bg-gray-800">
                    {/* Visibility */}
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="font-medium text-gray-700 dark:text-gray-300">
                                Visibility
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Who can see your story
                            </p>
                        </div>

                        <select
                            name="audience"
                            value={updatedStory.audience}
                            onChange={handleInputChange}
                            className="p-2 rounded-lg bg-white dark:bg-gray-800 border dark:border-gray-700 text-sm text-gray-800 dark:text-gray-100"
                        >
                            <option value="only me">Only Me</option>
                            <option value="public">Public</option>
                        </select>
                    </div>

                    {/* Divider */} <div className="border-t-2 border-gray-200 dark:border-gray-600 my-3" />

                    {/* Comments */}
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-gray-700 dark:text-gray-300">
                                Allow Comments
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Let others share their thoughts about your story
                            </p>
                        </div>

                        {/* ON / OFF TOGLE */}
                        <div className="flex items-center gap-2">
                            <span className={`text-sm ${!updatedStory.canComment ? "text-gray-900 dark:text-white" : "text-gray-400"}`}>
                                No
                            </span>
                            <button
                                type="button"
                                onClick={() =>
                                    setUpdatedStory(prev => ({
                                        ...prev,
                                        canComment: !prev.canComment
                                    }))
                                }
                                className={`
                                        relative w-12 h-6 flex items-center rounded-full transition
                                        ${updatedStory.canComment ? "bg-gray-500 dark:bg-blue-500" : "bg-gray-400 dark:bg-gray-600"}
                                    `}
                            >
                                <div
                                    className={`
                                        absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-md transform transition
                                        ${updatedStory.canComment ? "translate-x-6" : "translate-x-0"}
                                    `}
                                />
                            </button>

                            <span className={`text-sm ${updatedStory.canComment ? "text-gray-900 dark:text-white" : "text-gray-400"}`}>
                                Yes
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default EditStoryModal;
