import { Button } from "flowbite-react";

const AttachmentViewer = ({ showAttachment, onClose }) => {
    if (!showAttachment) return null;

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={onClose}
        >
            <div
                className="bg-white p-4 rounded-lg max-w-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <img
                    src={`/storage/leaves/${showAttachment.image}`}
                    alt="Attachment"
                    className="max-w-full max-h-[80vh] object-contain"
                />
                <Button color="gray" className="mt-4" onClick={onClose}>
                    Close
                </Button>
            </div>
        </div>
    );
};

export default AttachmentViewer;
