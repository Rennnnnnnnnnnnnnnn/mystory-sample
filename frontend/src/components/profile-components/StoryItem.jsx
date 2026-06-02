// React
import { useState, useRef, useEffect } from "react";
// Third-party
import { useQueryClient } from "@tanstack/react-query";
// Context / hooks
import { useAuth } from "../../pages/auth/AuthProvider.jsx";
// Components
import { timePassed } from "../../utils/timePassed.js";
import CheckStoryOverflow from "./CheckStoryOverflow";
import CategoryTags from "./CategoryTags.jsx";
import RevealStory from "../profile-components/RevealStory.jsx";
import StoryTracker from "../others/StoryTracker.jsx";
// UI / Modals / Feedback
import LoginRegisterModal from "../modals/LoginRegisterModal.jsx";
import HeartNotificationToast from "../others/HeartNotificationToast.jsx";
// Assets (icons)
import BookmarkIcon from "../../assets/action-icons/BookmarkIcon.jsx";
import HeartIcon from "../../assets/action-icons/HeartIcon.jsx";
import ShareIcon from "../../assets/action-icons/ShareIcon.jsx";
import EditIcon from "../../assets/action-icons/EditIcon.jsx";
import DeleteIcon from "../../assets/action-icons/DeleteIcon.jsx";
import EllipsisIcon from "../../assets/action-icons/EllipsisIcon.jsx";
import CommentIcon from "../../assets/action-icons/CommentIcon.jsx";
import FlagIcon from "../../assets/action-icons/FlagIcon.jsx";
// Utils / config
import { emotionFilterConfig } from "../../utils/StoryFilters.js";
import ReportModal from "../modals/ReportModal.jsx";
// API
import api from "../../utils/api.js";
import CommentsModal from "../CommentsModal.jsx";

function StoryItem({ story, isPrivate, onEdit, onDelete, index, activeStory, setActiveStory, isFromSinglePage, openCommentsFromNotif }) {
    // UI state
    const [showLoginRegisterModal, setShowLoginRegisterModal] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [copied, setCopied] = useState(false);
    const [showReportLabel, setShowReportLabel] = useState(false);
    // Story interaction state
    const [isLiked, setIsLiked] = useState(story.is_liked);
    const [isSaved, setIsSaved] = useState(story.is_saved);
    const [totalLikes, setTotalLikes] = useState(story.total_likes);
    const [totalSaves, setTotalSaves] = useState(story.total_saves);
    const [totalComments, setTotalComments] = useState(story.total_comments);
    const [isOwner, setIsOwner] = useState(story.is_owner);
    const [canComment, setCanComment] = useState(story.can_comment);

    // Scroll state
    const [scrollDir, setScrollDir] = useState("down");
    const [commentText, setCommentText] = useState("");
    // Auth & data
    const { user, isAuthenticated } = useAuth();
    const queryClient = useQueryClient();
    // Refs
    const storyRef = useRef(null);
    const textareaRef = useRef(null);
    const lastScrollY = useRef(0);
    const [loginModalTitle, setLoginModalTitle] = useState(null);
    const [animateToggle, setAnimateToggle] = useState(false);
    const [showCommentingPopUp, setShowCommentingPopUp] = useState(false);

    useEffect(() => {
        setIsLiked(story.is_liked);
        setIsSaved(story.is_saved);
        setTotalLikes(story.total_likes);
        setTotalSaves(story.total_saves)
        setIsOwner(story.is_owner);
        setTotalComments(story.total_comments);
        setCanComment(story.can_comment);
    }, [story]);

    // Open modal if coming from notification
    useEffect(() => {
        if (openCommentsFromNotif) {
            setShowCommentingPopUp(true);
        }
    }, [openCommentsFromNotif]);

    useEffect(() => {
        if (showCommentingPopUp || showReportModal) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "auto";
        }

        // cleanup (important when component unmounts)
        return () => {
            document.body.style.overflow = "auto";
        };
    }, [showCommentingPopUp, showReportModal]);

    const handleShare = () => {
        const link = `${window.location.origin}/story/${story.post_id}`;
        navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const toggleExpanded = () => {
        setAnimateToggle(true);

        setIsExpanded(prev => {
            const newExpanded = !prev;
            // Only scroll when collapsing
            if (prev && storyRef.current) {
                storyRef.current.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                });
            }
            return newExpanded;
        });
    };

    useEffect(() => {
        if (isExpanded) {
            setActiveStory(story.post_id);
        }
    }, [isExpanded, story.post_id, setActiveStory]);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            setScrollDir(currentScrollY > lastScrollY.current ? "down" : "up");
            lastScrollY.current = currentScrollY;
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const handleToggleLike = async (post_id) => {

        if (!user) {
            setLoginModalTitle("Sign in to like stories");
            setShowLoginRegisterModal(true);
            return;
        }

        const prevLiked = isLiked;
        // Optimistic UI
        setIsLiked(!prevLiked);
        setTotalLikes(prev => prevLiked ? prev - 1 : prev + 1);

        const matchingQueries = queryClient.getQueriesData((query) =>
            query.queryKey[0]?.includes('Stories')
        );

        matchingQueries.forEach(([key]) => {
            queryClient.setQueryData(key, (prevData) => {
                if (!prevData?.pages) return prevData;
                return {
                    ...prevData,
                    pages: prevData.pages.map(page => ({
                        ...page,
                        stories: page.stories?.map(s =>
                            s.post_id === post_id
                                ? {
                                    ...s,
                                    is_liked: prevLiked ? 0 : 1,
                                    total_likes: prevLiked ? s.total_likes - 1 : s.total_likes + 1
                                }
                                : s
                        ) || []
                    }))
                };
            });
        });

        try {
            if (!prevLiked) {
                await api.post('/api/story/addlike', { post_id });
            } else {
                await api.delete('/api/story/deleteLike', {
                    data: { post_id }
                });
            }
        } catch (error) {
            console.error("Error toggling like:", error);
            // Rollback UI and cache on failure
            setIsLiked(prevLiked);
            setTotalLikes(prev => prevLiked ? prev + 1 : prev - 1);

            const matchingQueries = queryClient.getQueriesData((query) =>
                query.queryKey[0]?.includes('Stories')
            );

            matchingQueries.forEach(([key]) => {
                queryClient.setQueryData(key, (prevData) => {
                    if (!prevData?.pages) return prevData;
                    return {
                        ...prevData,
                        pages: prevData.pages.map(page => ({
                            ...page,
                            stories: page.stories?.map(s =>
                                s.post_id === post_id
                                    ? {
                                        ...s,
                                        // revert to previous liked state
                                        is_liked: prevLiked,
                                        // revert total_likes to previous count
                                        total_likes: prevLiked ? s.total_likes + 1 : s.total_likes - 1
                                    }
                                    : s
                            ) || [] // fallback if stories undefined
                        }))
                    };
                });
            });
        }
    };

    const handleToggleSave = async (post_id) => {

        if (!user) {
            setLoginModalTitle("Sign in to save stories");
            setShowLoginRegisterModal(true);
            return;
        }

        const { user_id } = user;
        const prevSaved = isSaved;
        // Optimistic UI update
        setIsSaved(!prevSaved);
        setTotalSaves(prev => prevSaved ? prev - 1 : prev + 1);
        // this adds story to savedstories
        // Update the saved stories cache
        queryClient.setQueryData(['savedStories', user_id], (oldData) => {
            if (!oldData?.pages) return oldData;
            return {
                ...oldData,
                pages: oldData.pages.map(page => ({
                    ...page,
                    stories: prevSaved
                        ? page.stories.filter(s => s.post_id !== post_id)  // Remove the story if unsaved
                        : [{ ...story, is_saved: 1 }, ...page.stories]  // Add story to saved if newly saved
                }))
            };
        });

        // Update the main stories cache
        const matchingQueries = queryClient.getQueriesData((query) =>
            query.queryKey[0]?.includes('Stories')
        );

        matchingQueries.forEach(([key]) => {
            queryClient.setQueryData(key, (prevData) => {
                if (!prevData?.pages) return prevData; // exit if no pages

                return {
                    ...prevData,
                    pages: prevData.pages.map(page => ({
                        ...page,
                        stories: page.stories?.map(s =>
                            s.post_id === post_id
                                ? {
                                    ...s,
                                    is_saved: prevSaved ? 0 : 1, // toggle save state
                                    total_saves: prevSaved ? s.total_saves - 1 : s.total_saves + 1 // Update total_saves optimistically
                                }
                                : s
                        ) || [] // fallback if stories undefined
                    }))
                };
            });
        });

        try {
            if (!prevSaved) {
                await api.post("/api/story/saveStory", { post_id });
            } else {
                await api.delete("/api/story/unsaveStory", { data: { post_id } });
            }
        } catch (error) {
            console.error("Error saving story:", error);
            setIsSaved(prevSaved);
        }
    };

    3

    return (
        <>
            <RevealStory delay={index * 10}>
                {(visible) => (
                    <div
                        ref={storyRef}
                        className={`border-t-12 
                                    border-1 border-gray-500 dark:border-blue-900/50
                                    scroll-mt-36 p-5 pb-2 my-2 rounded-lg
                                    bg-gray-100 dark:bg-gray-800
                                    text-black dark:text-gray-300/90
                                    transition-all duration-300 ease-out
                            ${activeStory === story.post_id
                                ? 'border-t-gray-900 dark:border-t-blue-400'
                                : 'border-t-gray-500 dark:border-t-blue-700'
                            }
                            ${visible
                                ? 'opacity-100 translate-y-0'
                                : scrollDir === 'down'
                                    ? 'opacity-0 translate-y-10'
                                    : 'opacity-0 -translate-y-10'
                            }
                            `}
                        onDoubleClick={toggleExpanded}
                    >
                        {/* HEADER */}
                        <div className="flex flex-col justify-between">
                            <div className="flex justify-between">
                                <div className="flex flex-col">
                                    <small>{timePassed(story.create_date, isPrivate)}</small>
                                    {isOwner && !!isPrivate && (
                                        <div className="-mt-1">
                                            <small>
                                                Audience: <span className="font-bold">{story.audience}</span>
                                            </small>
                                        </div>
                                    )}
                                </div>

                                {isOwner ? (
                                    <div className="flex flex-shrink-0 gap-2 h-10 items-center">
                                        <button
                                            className="px-3 py-1 border dark:border-gray-500 rounded-xl md:border-0 hover:bg-gray-300 dark:hover:bg-gray-900 transition-colors duration-200 ease-in-out hover:cursor-pointer"
                                            onClick={onEdit}
                                        >
                                            <EditIcon className="h-5 w-5 text:black dark:text-white hover:dark:text-blue-300 cursor-pointer transition-all duration-150 active:scale-90" />
                                        </button>

                                        <button
                                            className="px-3 py-1 border dark:border-gray-500 rounded-xl md:border-0 hover:bg-gray-300 dark:hover:bg-gray-900 transition-colors duration-200 ease-in-out hover:cursor-pointer"
                                            onClick={onDelete}
                                        >
                                            <DeleteIcon className="h-5 w-5 text:black dark:text-white hover:dark:text-blue-300 cursor-pointer transition-colors" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="relative inline-block">
                                        <div onClick={() => setShowReportLabel((prev) => !prev)}>
                                            <EllipsisIcon className="h-5 w-5 text-black dark:text-white cursor-pointer transition-all duration-150 active:scale-40" />
                                        </div>

                                        {showReportLabel && (
                                            <span className="absolute top-1/2 left-0 transform -translate-x-25 -translate-y-1/2 px-3 py-2 text-xs text-white bg-gray-500 dark:bg-white dark:text-black rounded shadow-md hover:cursor-pointer"
                                                onClick={() => {
                                                    setShowReportLabel(false);

                                                    if (!isAuthenticated) {
                                                        setLoginModalTitle("Sign in to report this story");
                                                        setShowLoginRegisterModal(true);
                                                        return;
                                                    }

                                                    setShowReportModal(true);
                                                }}
                                            >
                                                <span className="flex items-center gap-2">
                                                    <FlagIcon className="h-5 w-5 text-white dark:text-black transition-colors duration-150" />
                                                    Report
                                                </span>
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div>
                                <CategoryTags
                                    story={story}
                                    emotionFilterConfig={emotionFilterConfig}
                                />
                            </div>
                        </div>
                        {/* CONTENT */}
                        <h1 className="mt-2 mb-2 font-semibold text-md">
                            {story.heading || ""}
                        </h1>

                        <StoryTracker story={story} isPrivate={isPrivate}>
                            <CheckStoryOverflow
                                story={story.content}
                                isExpanded={isExpanded}
                                toggleExpanded={toggleExpanded}
                                isFromSinglePage={isFromSinglePage}
                                animateToggle={animateToggle}
                            />
                        </StoryTracker>

                        <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center">
                                {/* HEART ICON */}
                                <div className="flex items-center">
                                    {isPrivate ? (
                                        <HeartIcon filled className="h-6 w-6 text-red-500" />
                                    ) : (
                                        <button
                                            onClick={() => handleToggleLike(story.post_id)}
                                            className="group flex items-center justify-center transition-all duration-150 active:scale-30 cursor-pointer"
                                            title={isLiked ? "Liked" : "Not liked"}
                                        >
                                            <HeartIcon
                                                filled={isLiked}
                                                className={`h-6 w-6 ${isLiked ? "text-red-500" : "text-black dark:text-white group-hover:text-red-400"}`}
                                            />
                                        </button>
                                    )}
                                    <span
                                        className={`text-xl font-light ml-1`}
                                        style={{ width: `${totalLikes.toString().length}ch` }}
                                    >
                                        {totalLikes}
                                    </span>
                                </div>

                                {canComment && (
                                    <>
                                        {/* COMMENT ICON */}
                                        < div className="flex items-center gap-1">
                                            <button
                                                className="px-3 py-1 md:border-0 cursor-pointer"
                                                onClick={() => setShowCommentingPopUp(true)}
                                            >
                                                <CommentIcon
                                                    className={`h-6 w-6 transition-all duration-150 
                                                        active:scale-30 active:-translate-y-0.5 
                                                        hover:text-blue-400 
                                                        text-black dark:text-gray-300`}
                                                />
                                            </button>
                                            <span
                                                className="inline-block text-xl font-light text-center -ml-3"
                                                style={{ width: `${totalComments.toString().length}ch` }} // 'ch' is width of one character
                                            >
                                                {totalComments}
                                            </span>
                                        </div>
                                    </>)}



                                {/* SEND ICON */}
                                <div className="relative flex items-center ml-1">
                                    {copied && (
                                        <div className="absolute bottom-full mb-2 px-2 py-1 text-sm text-white bg-gray-500 dark:bg-white dark:text-black rounded whitespace-nowrap">
                                            Link copied!
                                        </div>
                                    )}
                                    <button
                                        className="p-2 flex items-center justify-center cursor-pointer"
                                        onClick={handleShare}
                                    >
                                        <ShareIcon
                                            className="h-6 w-5 text-black dark:text-gray-300 transition-all duration-150 
                                            hover:text-blue-400
                                            active:scale-80 active:translate-x-1 active:-translate-y-1"
                                        />
                                    </button>
                                </div>
                                {/* SAVE ICON */}
                                <div className="flex items-center gap-1 -m-2">
                                    <button
                                        className="px-3 py-1 md:border-0 cursor-pointer"
                                        onClick={() => handleToggleSave(story.post_id)}
                                    >
                                        <BookmarkIcon
                                            filled={isSaved}
                                            className={`h-7 w-6 transition-all duration-150 active:scale-30 active:-translate-y-0.5  hover:text-blue-400  ${isSaved
                                                ? "text-gray-800 dark:text-white"
                                                : "text-black dark:text-white"
                                                }`}
                                        />
                                    </button>
                                    <span
                                        className="inline-block text-xl font-light text-center -ml-3"
                                        style={{ width: `${totalSaves.toString().length}ch` }} // 'ch' is width of one character
                                    >
                                        {totalSaves}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <small>
                                    {story.total_reads} {story.total_reads != 1 ? " READS" : " READ"}
                                </small>
                            </div>
                        </div>
                    </div>
                )}
            </RevealStory >

            {showLoginRegisterModal &&
                <LoginRegisterModal
                    onSuccess={() => {
                        setShowLoginRegisterModal(false);
                    }}
                    onCancel={() => setShowLoginRegisterModal(false)}
                    title={loginModalTitle}
                />
            }

            {
                showReportModal && (
                    <ReportModal
                        isOpen={showReportModal}
                        onClose={() => setShowReportModal(false)}
                        postId={story.post_id}
                    />
                )
            }

            {showCommentingPopUp && (
                <CommentsModal
                    isOpen={true}
                    onClose={() => setShowCommentingPopUp(false)}
                    storyId={story.post_id}
                />
            )}
        </>
    );
}

export default StoryItem;
