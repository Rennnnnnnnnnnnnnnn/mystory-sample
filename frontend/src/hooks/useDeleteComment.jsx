import api from "../utils/api";
import { useConfirmationModal } from "../context/ModalContext";
export default function useDeleteComment(onSuccess) {
    const { openConfirmationModal } = useConfirmationModal();

    const deleteComment = (comment_id) => {
        openConfirmationModal({
            title: (
                <span className="text-red-400">⚠️ Delete Comment</span>
            ),
            message: (
                <>
                    Are you sure you want to delete this comment?
                    <br />
                    This cannot be undone!
                    <br />
                    <br />
                    <div className="rounded-lg text-red-500 dark:text-red-300 text-xs">
                        All replies to this comment will also be permanently deleted.
                    </div>
                </>
            ),
            actionLabel: "Deleting Comment",
            onConfirm: async () => {
                try {
                    await api.delete(`/api/comment/deleteComment/${comment_id}`);
                    onSuccess?.(); // refresh comments after deletion
                } catch (error) {
                    console.error("Error deleting comment:", error);
                }
            },
        });
    };

    return deleteComment;
}
