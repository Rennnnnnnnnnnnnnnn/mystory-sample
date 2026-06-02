// React
import { useState, useRef, useEffect } from "react";
// Third-party libraries
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../utils/api";
// Utilities / hooks
import { timePassed } from "../utils/timePassed";
import useDeleteComment from "../hooks/useDeleteComment";
// Assets / icons
import EditIcon from "../assets/action-icons/EditIcon";
import DeleteIcon from "../assets/action-icons/DeleteIcon";
import EllipsisIcon from "../assets/action-icons/EllipsisIcon";
import FlagIcon from "../assets/action-icons/FlagIcon";
import SendIcon from "../assets/action-icons/SendIcon";
import { useAuth } from "../pages/auth/AuthProvider";
import LoginRegisterModal from "./modals/LoginRegisterModal";
import HeartIcon from "../assets/action-icons/HeartIcon";
import CommentIcon from "../assets/action-icons/CommentIcon";
import ReportModal from "./modals/ReportModal";
import SquareSpinner from "./others/SquareSpinner";

function CommentsModal({ isOpen, onClose, storyId }) {
    const queryClient = useQueryClient();
    const [loginModalTitle, setLoginModalTitle] = useState(null);
    const [showLoginRegisterModal, setShowLoginRegisterModal] = useState(false);
    const { isAuthenticated } = useAuth();
    const [replyingTo, setReplyingTo] = useState(null);
    const [commentText, setCommentText] = useState("");
    const [showReportModal, setShowReportModal] = useState(false);
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editingText, setEditingText] = useState("");
    const [activeMenuId, setActiveMenuId] = useState(null);
    const [closing, setClosing] = useState(false);
    const newCommentRef = useRef(null);
    const editingCommentRef = useRef(null);
    const [reportTarget, setReportTarget] = useState(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const { data: comments, isLoading, isError } = useQuery({
        queryKey: ["comments", storyId],
        queryFn: async () => {
            const res = await api.get(`/api/comment/getComments/${storyId}`);
            return res.data;
        },
        enabled: !!storyId && isOpen,
    });

    const handleClose = () => {
        setClosing(true);
        setTimeout(() => {
            setClosing(false);
            onClose();
        }, 250);
    };

    const handleInput = (e) => {
        const el = e.target;
        el.style.height = "auto";
        el.style.height = Math.min(el.scrollHeight) + "px";
    };

    const handleToggleLike = async (comment_id, is_liked) => {
        if (!isAuthenticated) {
            setLoginModalTitle("Sign in to like a comment");
            setShowLoginRegisterModal(true);
            return;
        }
        const prevLiked = is_liked;
        // 🔥 Optimistic update (React Query cache)
        queryClient.setQueryData(["comments", storyId], (oldComments) => {
            if (!oldComments) return oldComments;
            return oldComments.map(c =>
                c.comment_id === comment_id ?
                    {
                        ...c,
                        is_liked: !prevLiked,
                        total_like_count: prevLiked
                            ? c.total_like_count - 1
                            : c.total_like_count + 1
                    } : c
            );
        });
        try {
            if (!prevLiked) {
                await api.post("/api/comment/addCommentLike", { comment_id });
            } else {
                await api.delete("/api/comment/deleteCommentLike", {
                    data: { comment_id }
                });
            }
        } catch (error) {
            console.error(error);
            // ❌ rollback on failure
            queryClient.invalidateQueries(["comments", storyId]);
        }
    };

    const handleCommentSubmit = async () => {
        if (!commentText.trim() || loading) return;

        setLoading(true);

        try {
            await api.post("/api/comment/createComment", {
                post_id: storyId,
                content: commentText.trim(),
                parent_comment_id: replyingTo,
            });

            setCommentText("");
            setReplyingTo(null);

            if (newCommentRef.current) {
                newCommentRef.current.style.height = "auto";
            }

            queryClient.invalidateQueries(["comments", storyId]);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false); // ✅ IMPORTANT FIX
        }
    };

    const deleteComment = useDeleteComment(() => {
        queryClient.invalidateQueries(["comments", storyId]);
    });

    const handleEditSave = async () => {
        if (!editingText.trim() || saving) return;

        setSaving(true);

        try {
            await api.put("/api/comment/update-comment", {
                comment_id: editingCommentId,
                content: editingText.trim(),
            });

            setEditingCommentId(null);
            setEditingText("");
            queryClient.invalidateQueries(["comments", storyId]);
        } catch (error) {
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    const buildCommentTree = (comments) => {
        const map = {};
        const roots = [];

        comments.forEach(c => {
            map[c.comment_id] = { ...c, replies: [] };
        });

        comments.forEach(c => {
            if (c.parent_comment_id) {
                map[c.parent_comment_id]?.replies.push(map[c.comment_id]);
            } else {
                roots.push(map[c.comment_id]);
            }
        });
        return roots;
    };
    const commentTree = buildCommentTree(comments || []);
    const renderComments = (comments, depth = 0) => {
        return comments.map((comment) => (
            <div
                key={comment.comment_id}
                className={`${depth === 0 ? "border-b pb-3" : "pb-2"} dark:border-gray-300`}
                style={{ marginLeft: depth * 45 }}
            >
                {/* TOP BAR */}
                <div className="flex flex-row justify-between mt-2 ">
                    <div className="flex items-center justify-center gap-2 text-center">
                        {comment.is_author && (
                            <>
                                <span className="text-xs text-blue-600 dark:text-blue-400">
                                    Author
                                </span>
                                <span className="text-gray-500 text-xs ">
                                    •
                                </span>
                            </>
                        )}

                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {timePassed(comment.create_date)}
                            {comment.is_edited && " • Edited"}
                        </p>
                    </div>

                    {comment.is_owner ? (
                        // ✅ COMMENT OWNER
                        <div className="flex flex-shrink-0 gap-2 items-center">
                            <button
                                disabled={editingCommentId !== null}
                                className="px-3 py-1 border dark:border-gray-500 rounded-xl md:border-0 hover:bg-gray-300 dark:hover:bg-gray-900 transition-colors duration-200 ease-in-out hover:cursor-pointer"
                                onClick={() => {
                                    if (editingCommentId !== null) return;
                                    setReplyingTo(null);
                                    setEditingCommentId(comment.comment_id);
                                    setEditingText(comment.content);
                                }}
                            >
                                <EditIcon className="h-4 w-4 text-black dark:text-white cursor-pointer transition-all duration-150 active:scale-90" />
                            </button>

                            <button
                                className="px-3 py-1 border dark:border-gray-500 rounded-xl md:border-0 hover:bg-gray-300 dark:hover:bg-gray-900 transition-colors duration-200 ease-in-out hover:cursor-pointer"
                                onClick={() => deleteComment(comment.comment_id)}
                            >
                                <DeleteIcon className="h-4 w-4 text-black dark:text-white cursor-pointer transition-colors duration-150 active:scale-90" />
                            </button>
                        </div>

                    ) : (
                        // 👇 BOTH post owner & normal users
                        <div className="relative inline-block">
                            <div
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveMenuId(prev =>
                                        prev === comment.comment_id ? null : comment.comment_id
                                    );
                                }}
                            >
                                <EllipsisIcon className="h-5 w-5 text-black dark:text-white cursor-pointer transition-all duration-150 active:scale-90" />
                            </div>

                            {activeMenuId === comment.comment_id && (
                                <div className="absolute right-0 mt-2 w-22 bg-gray-500 dark:bg-gray-200 text-white dark:text-black rounded shadow-md text-xs overflow-hidden">

                                    {/* ✅ DELETE → only post owner */}
                                    {comment.is_post_owner && (
                                        <div
                                            className="px-3 py-2 hover:bg-gray-600 dark:hover:bg-gray-400 transition-colors duration-150 cursor-pointer"
                                            onClick={() => {
                                                setActiveMenuId(null);
                                                deleteComment(comment.comment_id);
                                            }}
                                        >
                                            <span className="flex items-center gap-1">
                                                <DeleteIcon className="h-5 w-5 text-white dark:text-black transition-colors duration-150" />
                                                Delete
                                            </span>
                                        </div>
                                    )}

                                    {/* ✅ REPORT */}
                                    <div
                                        className="px-3 py-2 hover:bg-gray-600 dark:hover:bg-gray-400 transition-colors duration-150 cursor-pointer"
                                        onClick={() => {
                                            if (!isAuthenticated) {
                                                setLoginModalTitle("Sign in to report a comment");
                                                setShowLoginRegisterModal(true);
                                                setActiveMenuId(null);
                                                return;
                                            }

                                            setActiveMenuId(null);
                                            setReportTarget({
                                                type: "comment",
                                                id: comment.comment_id
                                            });
                                            setShowReportModal(true);
                                        }}
                                    >
                                        <span className="flex items-center gap-1">
                                            <FlagIcon className="h-5 w-5 text-white dark:text-black transition-colors duration-150" />
                                            Report
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}


                </div>
                {/* CONTENT */}
                {editingCommentId === comment.comment_id ? (
                    <div className="flex flex-col gap-2">
                        <textarea
                            ref={editingCommentRef}
                            autoFocus
                            value={editingText}
                            onInput={handleInput}
                            onClick={() => {
                                if (!isAuthenticated) {
                                    setLoginModalTitle("Sign in to comment");
                                    setShowLoginRegisterModal(true);
                                    return;
                                }
                            }}
                            onChange={(e) => { setEditingText(e.target.value) }}
                            className="
                                        flex-1 px-3 py-2 rounded 
                                        bg-white dark:bg-gray-800 dark:text-gray-200
                                        border border-gray-300 dark:border-gray-600 text-sm
                                        placeholder-gray-500 dark:placeholder-gray-400
                                        resize-none overflow-y-auto transition-all duration-150
                                        focus:outline-none focus:border-gray-800 focus:dark:border-cyan-500
                                    "
                        />

                        <div className="flex justify-end gap-2 mt-1">
                            <button
                                onClick={handleEditSave}
                                disabled={saving}
                                className={`p-1 py-2 text-xs text-white bg-green-700 dark:hover:bg-green-600 rounded-lg dark:text-gray-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed 
                                ${saving ? "px-3  w-auto" : "w-14"}`}                            >
                                {saving ? (
                                    <div className="flex gap-2">
                                        <SquareSpinner /> Saving
                                    </div>
                                ) : (
                                    "Save"
                                )}
                            </button>

                            <button
                                onClick={() => {
                                    setEditingCommentId(null);
                                    setEditingText("");
                                }}
                                className="p-1 py-2 w-14 text-xs text-white bg-gray-700 dark:hover:bg-gray-600 rounded-lg dark:text-gray-100 transition-colors duration-200"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <div>
                        <p className="text-sm pb-2 text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
                            {comment.content}
                        </p>
                        {/* Inline reply box */}
                        {replyingTo === comment.comment_id ? (
                            <div className="mt-2 flex gap-2 items-end ">
                                <textarea
                                    ref={newCommentRef}
                                    rows={1}
                                    autoFocus
                                    value={commentText}
                                    onClick={() => {
                                        if (!isAuthenticated) {
                                            setLoginModalTitle("Sign in to comment");
                                            setShowLoginRegisterModal(true);
                                            return;
                                        }
                                    }}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    onInput={handleInput}
                                    placeholder="Write your reply..."
                                    className="
                                                flex-1 px-3 py-2 rounded 
                                                bg-white dark:bg-gray-800 dark:text-gray-200
                                                border border-gray-300 dark:border-gray-600 text-sm
                                                placeholder-gray-500 dark:placeholder-gray-400
                                                resize-none overflow-y-auto transition-all duration-150
                                                focus:outline-none focus:border-gray-800 focus:dark:border-cyan-500
                                            "
                                />
                                <button
                                    className="p-1 bg-blue-500/80 hover:bg-red-600/90 dark:bg-blue-600/90 dark:hover:bg-blue-500/80 text-white rounded transition hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                    onClick={handleCommentSubmit}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <SquareSpinner size="h-4 w-4 m-1.5" />
                                    ) : (
                                        <SendIcon className="h-7 w-7 text-gray-100 transition-all duration-150 active:scale-90" />
                                    )}
                                </button>
                                {/* CANCEL */}
                                <button
                                    className="px-2 py-2.5 bg-gray-400 hover:bg-gray-500 dark:bg-gray-600 dark:hover:bg-gray-500 text-white rounded  transition text-xs hover:cursor-pointer"
                                    onClick={() => {
                                        setReplyingTo(null);
                                        setCommentText("");
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-row gap-3">
                                <div className="flex">
                                    <button
                                        onClick={() => handleToggleLike(comment.comment_id, comment.is_liked)}
                                        className="group flex items-center justify-center transition-all duration-150 active:scale-30 cursor-pointer"
                                        title={comment.is_liked ? "Liked" : "Not liked"}
                                    >
                                        <HeartIcon
                                            filled={comment.is_liked}
                                            className={`h-4 w-4 ${comment.is_liked ? "text-red-500" : "text-black dark:text-white group-hover:text-red-400"}`}
                                        />
                                    </button>
                                    <span
                                        className={`text-sm font-light ml-1 dark:text-white`}
                                        style={{ width: `${comment.total_like_count.toString().length}ch` }}
                                    >
                                        {comment.total_like_count || 0}
                                    </span>
                                </div>

                                <button
                                    onClick={() => {
                                        if (!isAuthenticated) {
                                            setLoginModalTitle("Sign in to reply");
                                            setShowLoginRegisterModal(true);
                                        } else {
                                            setEditingCommentId(null); // 🔥 cancel edit
                                            setEditingText("");
                                            setReplyingTo(comment.comment_id);
                                        }
                                    }}
                                    className="text-xs text-blue-500 hover:cursor-pointer"
                                >
                                    <CommentIcon
                                        className={`h-4 w-4 transition-all duration-150 
                                                active:scale-30 active:-translate-y-0.5 
                                                hover:text-blue-400 
                                                text-black dark:text-gray-300`}
                                    />
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* 🔥 REPLIES */}
                {comment.replies.length > 0 &&
                    renderComments(comment.replies, depth + 1)
                }
            </div>
        ));
    };

    useEffect(() => {
        const handleClick = () => setActiveMenuId(null);
        window.addEventListener("click", handleClick);
        return () => window.removeEventListener("click", handleClick);
    }, []);

    useEffect(() => {
        if (!isOpen) {
            setEditingCommentId(null);
            setEditingText("");
            setActiveMenuId(null);
            setReplyingTo(null);
        }
    }, [isOpen]);

    useEffect(() => {
        if (editingCommentId && editingCommentRef.current) {
            const el = editingCommentRef.current;
            el.style.height = "auto";
            el.style.height = Math.min(el.scrollHeight) + "px";
        }
    }, [editingCommentId, editingText]);

    if (!isOpen && !closing) return null;

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-end"
                onClick={handleClose}
            >
                {/* BACKDROP */}
                <div
                    className="absolute inset-0 bg-black/20 backdrop-blur-xs"
                    onClick={handleClose}
                />
                {/* SHEET */}
                <div
                    onClick={(e) => e.stopPropagation()}
                    className={`flex flex-col relative w-full bg-white dark:bg-gray-900 rounded-t-lg md:rounded-t-2xl p-4 max-h-screen border-t-3 dark:border-blue-500 border-black overflow-y-auto ${closing ? "animate-slide-down" : "animate-slide-up"}`}
                >
                    <div className="hover:cursor-pointer h-10"
                        onClick={handleClose}>
                        {/* HANDLE BAR */}
                        <div className="w-12 h-1.5 bg-gray-400 rounded-full mx-auto mb-10" />
                    </div>


                    {/* COMMENTS LIST */}
                    <div className="flex-1 overflow-y-auto mx-2 lg:mx-50 lg:p-10">
                        {isLoading && (
                            <div className="flex gap-2 items-center justify-center w-full h-full text-gray-500 dark:text-gray-400 pb-20 pt-5">
                                <SquareSpinner size="w-6 h-6" />
                                <span>Loading comments . . .</span>
                            </div>
                        )}

                        {isError && (
                            <p className="text-red-500 dark:text-red-400 pb-20">
                                Failed to load comments
                            </p>
                        )}

                        {!isLoading && !isError && comments?.length === 0 && (
                            <p className="text-gray-900 dark:text-gray-400 text-center pb-20 pt-5">
                                No comments
                            </p>
                        )}

                        {!isLoading && !isError && comments?.length > 0 && (
                            <div>
                                <h2 className="text-center dark:text-gray-200 font-semibold mb-10">Comments</h2>
                                <div className="space-y-2">
                                    {renderComments(commentTree)}
                                </div>
                                {/* SPACER */}
                                {comments?.length === 0 && (<div className="h-20" />)}
                            </div>
                        )}
                    </div>
                    {/* COMMENT INPUT */}
                    {(!editingCommentId && !replyingTo) && (
                        <div className="mt-3 p-3 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-400 dark:border-gray-700 transition-all duration-300 lg:mx-50">
                            <div className="flex gap-2 items-end ">
                                <textarea
                                    ref={newCommentRef}
                                    rows={1}
                                    value={commentText}
                                    onClick={() => {
                                        if (!isAuthenticated) {
                                            setLoginModalTitle("Sign in to comment");
                                            setShowLoginRegisterModal(true);
                                            return;
                                        }
                                    }}
                                    onChange={(e) => { setCommentText(e.target.value) }}
                                    onInput={handleInput}
                                    placeholder="What do you think of this story . . ."
                                    className="
                                    flex-1 px-3 py-2 rounded 
                                    bg-white dark:bg-gray-800 dark:text-gray-200
                                    border border-gray-300 dark:border-gray-600 text-sm
                                    placeholder-gray-500 dark:placeholder-gray-400
                                    resize-none overflow-y-auto transition-all duration-150
                                    focus:outline-none focus:border-gray-800 focus:dark:border-cyan-500
                                "
                                />

                                <button
                                    className="p-1 bg-blue-500/80 hover:bg-red-600/90 dark:bg-blue-600/90 dark:hover:bg-blue-500/80 text-white rounded transition hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                    onClick={handleCommentSubmit}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <SquareSpinner size="h-4 w-4 m-1.5" />
                                    ) : (
                                        <SendIcon className="h-7 w-7 text-gray-100 transition-all duration-150 active:scale-90" />
                                    )}
                                </button>
                            </div>

                        </div>
                    )}
                </div>
            </div >

            {showLoginRegisterModal &&
                <LoginRegisterModal
                    onSuccess={() => {
                        setShowLoginRegisterModal(false);
                    }}
                    onCancel={() => setShowLoginRegisterModal(false)}
                    title={loginModalTitle}
                />}

            {showReportModal && (
                <ReportModal
                    isOpen={showReportModal}
                    onClose={() => {
                        setShowReportModal(false);
                        setReportTarget(null);
                    }}
                    targetId={reportTarget?.id}
                    type={reportTarget?.type}
                />
            )}
        </>
    );

}

export default CommentsModal;


