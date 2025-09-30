import {
    Button,
    Modal,
    ModalBody,
    ModalFooter,
    ModalHeader,
} from "flowbite-react";

console.log("DeleteConfirmationModal loaded");

const DeleteConfirmationModal = ({ show, onClose, onConfirm, itemName }) => {
    return (
        <Modal show={show} onClose={onClose} size="sm">
            <ModalHeader>Confirm Deletion</ModalHeader>
            <ModalBody>
                <p className="text-gray-700 dark:text-gray-300">
                    Are you sure you want to delete "{itemName}"? This action
                    cannot be undone.
                </p>
            </ModalBody>
            <ModalFooter>
                <Button
                    color="failure"
                    onClick={onConfirm}
                    className="bg-red-500 hover:bg-red-600 text-white"
                >
                    Delete
                </Button>
                <Button
                    color="gray"
                    onClick={onClose}
                    className="bg-gray-500 hover:bg-gray-600 text-white"
                >
                    Cancel
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default DeleteConfirmationModal;
