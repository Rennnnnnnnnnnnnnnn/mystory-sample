import { createContext, useContext, useState } from "react";
import ConfirmationModal from "../components/modals/ConfirmationModal";

const ModalContext = createContext();

function ModalProvider({ children }) {
    const [confirmationModalProps, setConfirmationModalProps] = useState({
        isOpen: false,
        title: "",
        message: "",
        actionLabel: "",
        onConfirm: () => { },
        onCancel: () => { }
    });

    const closeModal = () => {
        setConfirmationModalProps(prev => ({ ...prev, isOpen: false }));
    };

    const openConfirmationModal = ({ title, message, onConfirm, actionLabel }) => {
        setConfirmationModalProps({
            isOpen: true,
            title,
            message,
            actionLabel,
            onConfirm: async () => {
                await onConfirm();
                closeModal();
            },
            onCancel: closeModal
        });
    };

    return (
        <ModalContext.Provider value={{ openConfirmationModal }}>
            {children}
            <ConfirmationModal {...confirmationModalProps} />
        </ModalContext.Provider>
    );
}

export const useConfirmationModal = () => useContext(ModalContext);

export default ModalProvider;
