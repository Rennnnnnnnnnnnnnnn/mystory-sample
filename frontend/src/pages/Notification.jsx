// React
import { useEffect, useLayoutEffect, useRef, useState, } from "react";
// React Router
import { useNavigate } from "react-router-dom";
// React Query
import { useInfiniteQuery, useMutation, useQueryClient, } from "@tanstack/react-query";
// Auth
import { useAuth } from "./auth/AuthProvider";
// Hooks
import useScrollRestoration from "../hooks/useScrollRestoration.jsx";
// Utils
import api from "../utils/api.js";
import { timePassed } from "../utils/timePassed.js";
// Components
import RevealStory from "../components/profile-components/RevealStory.jsx";
import NotificationSkeleton from "../layout/NotificationSkeleton.jsx";
// Icons
import BookmarkIcon from "../assets/action-icons/BookmarkIcon.jsx";
import CommentIcon from "../assets/action-icons/CommentIcon.jsx";
import HeartIcon from "../assets/action-icons/HeartIcon.jsx";

function Notification() {
    const { user } = useAuth();
    const user_id = user.user_id;
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [scrollDir, setScrollDir] = useState("down");
    const lastScrollY = useRef(0);

    const useGetNotifications = (limit = 10) => {
        return useInfiniteQuery({
            queryKey: ["notifications", user_id],

            queryFn: async ({ pageParam = null }) => {
                const params = { limit };

                if (pageParam) {
                    params.cursorDate = pageParam.create_date;
                    params.cursorId = pageParam.notif_id;

                    console.log("pageparams ", pageParam);
                }

                const { data } = await api.get(
                    "/api/notifications/getNotifications",
                    { params }
                );

                return data;
            },

            getNextPageParam: (lastPage) =>
                lastPage.nextCursor || undefined,

            staleTime: 1000 * 60 * 5,
            cacheTime: 1000 * 60 * 30,
            refetchInterval: 1000 * 60,
            refetchIntervalInBackground: true,
        });
    };

    const {
        data,
        isLoading,
        isError,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useGetNotifications();

    const notifications = data?.pages.flatMap((page) => page.notifications) || [];

    // Scroll Restoration
    useScrollRestoration(
        "notifications",
        notifications.length > 0
    );

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            setScrollDir(
                currentScrollY > lastScrollY.current
                    ? "down"
                    : "up"
            );

            lastScrollY.current = currentScrollY;
        };

        window.addEventListener(
            "scroll",
            handleScroll
        );

        return () =>
            window.removeEventListener(
                "scroll",
                handleScroll
            );
    }, []);

    // Infinite Scroll
    useEffect(() => {
        const handleScroll = () => {
            const reachedBottom =
                window.innerHeight + window.scrollY >=
                document.body.offsetHeight - 200;

            if (
                reachedBottom &&
                hasNextPage &&
                !isFetchingNextPage
            ) {
                fetchNextPage();
            }
        };

        window.addEventListener(
            "scroll",
            handleScroll
        );

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

    // Mark Notification as Read
    const markAsReadMutation = useMutation({
        mutationFn: (notif_id) =>
            api.post(
                "/api/notifications/updateNotificationRead",
                { notif_id }
            ),

        onMutate: async (notif_id) => {
            await queryClient.cancelQueries({
                queryKey: ["notifications", user_id],
            });

            const previousData = queryClient.getQueryData(["notifications", user_id,]);

            // Optimistic update
            queryClient.setQueryData(["notifications", user_id], (oldData) => {
                if (!oldData) return oldData;

                return {
                    ...oldData,

                    pages: oldData.pages.map((page) => ({
                        ...page,

                        notifications:
                            page.notifications.map((notif) =>
                                notif.notif_id === notif_id
                                    ? {
                                        ...notif,
                                        read_status: 1,
                                    }
                                    : notif
                            ),
                    })),
                };
            }
            );

            return { previousData };
        },

        onError: (_err, _notif_id, context) => {
            queryClient.setQueryData(
                ["notifications", user_id],
                context.previousData
            );
        },

        onSettled: () => {
            queryClient.invalidateQueries({
                queryKey: ["notifications", user_id],
            });
        },
    });

    // Notification Click Handler
    const handleNotifClick = async (n) => {
        try {
            // Mark as read if unread
            if (n.read_status === 0) {
                await markAsReadMutation.mutateAsync(
                    n.notif_id
                );
            }

            const isCommentOrReply = ["comment", "reply", "comment_like",].includes(n.notif_type);

            if (isCommentOrReply) {
                navigate(`/story/${n.post_id}`, {
                    state: {
                        openComments: true,
                    },
                });
            } else {
                navigate(`/story/${n.post_id}`);
            }
        } catch (err) {
            console.error(
                "Failed to mark notification as read",
                err
            );
        }
    };

    if (isLoading && notifications.length === 0) {
        return (
            <div className="bg-gray-800 min-h-screen pt-22 p-3 flex flex-col items-center gap-1">
                {Array.from({ length: 6 }).map((_, i) => (
                    <NotificationSkeleton key={i} />
                ))}
            </div>
        );
    }

    if (isError) {
        return (
            <div className="bg-gray-800 min-h-screen pt-22 p-3 flex items-center justify-center">
                <p className="text-red-400">Failed to load notifications.</p>
            </div>
        );
    }

    return (
        <>
            <div className="min-h-screen pt-22 p-3">
                <div className="mx-auto w-full lg:max-w-2/5 dark:text-gray-300">
                    {notifications.length === 0 && (
                        <p className="text-center py-20">
                            No notifications yet.
                        </p>
                    )}

                    {notifications.map((n, index) => {
                        const firstSentence =
                            n.post_content.split('.')[0] +
                            (n.post_content.includes('. ') ? '.' : '');
                        const bgClass = n.read_status === 0 ? "bg-gray-400 dark:bg-gray-600" : "bg-white dark:bg-gray-800";

                        return (
                            <RevealStory key={n.notif_id} delay={index * 10}>
                                {(visible) => (
                                    <div className={`
                                                text-left hover:cursor-pointer
                                                p-6 mb-1
                                                rounded-lg border-t-12 border-gray-500 dark:border-blue-700
                                                transition-all duration-400 ease-out
                                                ${visible
                                            ? "opacity-100 translate-y-0"
                                            : scrollDir === "down"
                                                ? "opacity-0 translate-y-5"
                                                : "opacity-0 -translate-y-5"
                                        }
                                                ${bgClass}
                                            `}
                                        onClick={() => handleNotifClick(n)}
                                    >

                                        <p className="text-sm">
                                            {timePassed(n.create_date)}
                                        </p>

                                        <div className="text-sm font-medium my-2 flex flex-row items-center gap-1">
                                            {n.notif_type === "post_like" && (
                                                <>
                                                    {/* {n.total_likes} {n.total_likes === 1 ? "Heart" : "Hearts"} */}
                                                    <HeartIcon filled className="h-6 w-6 text-red-500" />
                                                </>
                                            )}
                                            {n.notif_type === "comment_like" && (
                                                <>
                                                    {/* {n.total_likes} {n.total_likes === 1 ? "Heart" : "Hearts"} */}
                                                    <HeartIcon filled className="h-6 w-6 text-red-500" />
                                                </>
                                            )}
                                            {n.notif_type === "save" && (
                                                <>
                                                    {/* {n.total_saves} {n.total_saves === 1 ? "Save" : "Saves"} */}
                                                    <BookmarkIcon filled className="h-7 w-6 transition-all duration-150 active:scale-90 active:-translate-y-0.5 text-gray-800 dark:text-white"
                                                    />
                                                </>
                                            )}
                                            {n.notif_type === "comment" && (
                                                <>
                                                    <CommentIcon className="h-6 w-6" />
                                                </>
                                            )}
                                            {n.notif_type === "reply" && (
                                                <>
                                                    <CommentIcon
                                                        className="h-6 w-6"
                                                    />
                                                </>
                                            )}
                                            <p>{n.message + " :"}</p>
                                        </div>

                                        {/* COMMENT */}
                                        {n.notif_type === "comment" && (
                                            <div className="mt-3">
                                                <p className="text-xs font-semibold text-gray-900 dark:text-gray-400 mb-1">
                                                    Comment :
                                                </p>
                                                <div className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm max-h-[6rem] overflow-y-auto">
                                                    {n.comment_content}
                                                </div>
                                            </div>
                                        )}

                                        {/* REPLY */}
                                        {n.notif_type === "reply" && (
                                            <div className="mt-3">
                                                <p className="text-xs font-semibold text-gray-900 dark:text-gray-400 mb-1">
                                                    Your comment :
                                                </p>
                                                <div className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm mb-2 max-h-[6rem] overflow-y-auto">
                                                    {n.parent_comment_content}
                                                </div>
                                                <p className="text-xs font-semibold text-gray-900 dark:text-gray-400 mb-1">
                                                    Someone's reply :
                                                </p>
                                                <div className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm max-h-[6rem] overflow-y-auto">
                                                    {n.comment_content}
                                                </div>
                                            </div>
                                        )}

                                        {/* COMMENT LIKE */}
                                        {n.notif_type === "comment_like" && (
                                            <div className="mt-3">
                                                <div className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm max-h-[6rem] overflow-y-auto">
                                                    {n.comment_content}
                                                </div>
                                            </div>
                                        )}

                                        {/* POST (SAVE / LIKE) */}
                                        {(n.notif_type === "save" || n.notif_type === "post_like") && (
                                            <span className="text-sm font-semibold">
                                                {n.post_heading ? n.post_heading : firstSentence}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </RevealStory>
                        );
                    })}
                    {isFetchingNextPage && (
                        <NotificationSkeleton />
                    )}
                </div>
            </div>
        </>
    )
}

export default Notification;