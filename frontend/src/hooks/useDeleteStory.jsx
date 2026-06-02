import api from "../utils/api";
import { useConfirmationModal } from "../context/ModalContext";
export default function useDeleteStory(onSuccess) {
    const { openConfirmationModal } = useConfirmationModal();

    const deleteStory = (post_id) => {
        openConfirmationModal({
            title: (
                <>
                    <span className="text-red-400">Delete story</span>
                </>
            ),

            message: (
                <>
                    Are you sure you want to delete this story?
                    <br />
                    This cannot be undone!
                </>
            ),

            actionLabel: "Deleting story",

            onConfirm: async () => {
                try {
                    await api.delete(`/api/story/deleteStory/${post_id}`);
                    onSuccess?.();
                } catch (error) {
                    console.error("Error deleting story:", error);
                }
            },
        });
    };

    return deleteStory;
}
