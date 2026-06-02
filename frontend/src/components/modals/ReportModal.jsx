import { useState } from "react";

export default function ReportModal({ isOpen, onClose, targetId, type }) {
    const reasons = ["Violence", "Misinformation", "Harassment", "Spam", "Bullying", "Sexual Content", "Other"];

    const [errors, setErrors] = useState({
        reasons: "",
        description: ""
    });

    const [selectedReasons, setSelectedReasons] = useState([]);
    const [reportReason, setReportReason] = useState("");
    const isOtherSelected = selectedReasons.includes("Other");

    const submitReport = () => {
        let hasError = false;

        const newErrors = {
            reasons: "",
            description: ""
        };

        // ❌ No reason selected
        if (selectedReasons.length === 0) {
            newErrors.reasons = "Please select at least one reason.";
            hasError = true;
        }

        // ❌ "Other" requires description
        if (selectedReasons.includes("Other") && !reportReason.trim()) {
            newErrors.description = "Please describe the issue for 'Other'.";
            hasError = true;
        }

        setErrors(newErrors);

        if (hasError) return;

        const finalData = {
            type,
            targetId,
            reasons: selectedReasons,
            description: reportReason
        };

        console.log("Report submitted:", finalData);

        setSelectedReasons([]);
        setReportReason("");
        setErrors({ reasons: "", description: "" });
        onClose();
    };

    const toggleReason = (reason) => {
        setSelectedReasons(prev => {
            const updated = prev.includes(reason)
                ? prev.filter(r => r !== reason)
                : [...prev, reason];

            if (updated.length > 0) {
                setErrors(prev => ({ ...prev, reasons: "" }));
            }

            return updated;
        });
    };

    const handleChange = (e) => {
        setReportReason(e.target.value);

        // clear description error when user types
        setErrors(prev => ({ ...prev, description: "" }));

        e.target.style.height = "auto";
        e.target.style.height = e.target.scrollHeight + "px";
    };

    if (!isOpen) return null; // Don't render if not open

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs "  >
            {/* BACKDROP */}
            <div className="bg-gray-200 dark:bg-gray-800 rounded-2xl w-full md:w-1/2  p-6 shadow-2xl relative border border-gray-900 dark:border-gray-700">
                {/* Header */}
                <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
                    {type === "comment" ? "Report Comment" : "Report Story"}
                </h2>

                <p className="text-sm text-gray-800 dark:text-gray-400 mb-4">
                    Select reason or reasons for reporting :
                </p>

                {errors.reasons && (
                    <p className="text-sm text-red-400 mb-2">
                        {errors.reasons}
                    </p>
                )}

                {/* Reasons (as selectable pills instead of plain checkboxes) */}
                <div className="flex flex-wrap gap-2 mb-5">
                    {reasons.map((reason) => {
                        const isSelected = selectedReasons.includes(reason);
                        return (
                            <button
                                key={reason}
                                type="button"
                                onClick={() => toggleReason(reason)}
                                className={`
                                px-3 py-1.5
                                rounded-full
                                text-sm
                                border
                                transition
                                cursor-pointer
                                ${isSelected
                                        ? "bg-red-600/20 dark:bg-red-600/20 text-gray-800 dark:text-white border-red-400 dark:border-red-400 hover:border-red-700 dark:hover:border-red-300"
                                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-800 hover:border-gray-500 dark:hover:border-gray-400"
                                    }`}
                            >
                                {reason}
                            </button>
                        );
                    })}
                </div>

                {errors.description && (
                    <p className="text-xs text-red-400 mb-2">
                        {errors.description}
                    </p>
                )}

                {/* Textarea */}
                <textarea
                    value={reportReason}
                    onChange={handleChange}
                    placeholder={
                        isOtherSelected
                            ? "Please describe the issue (required)..."
                            : "Additional details (optional)..."
                    }
                    className={`w-full  p-3 rounded-lg resize-none focus:outline-none focus:border-red-400 dark:bg-gray-700 dark:text-white mb-5 border
                            ${isOtherSelected ? "border-red-400" : "border-gray-600 dark:border-gray-600"}`}
                />

                {/* Buttons */}
                <div className="flex justify-end gap-2">
                    <button
                        onClick={submitReport}
                        className={`px-4 py-2 rounded-lg text-sm transition cursor-pointer bg-green-600 dark:bg-green-700 hover:bg-green-700 dark:hover:bg-green-600 text-white`}
                    >
                        Submit
                    </button>

                    <button
                        onClick={onClose}
                        className="px-4 py-1 text-sm hover:cursor-pointer transition rounded-lg text-gray-800 dark:text-gray-200 
                                bg-gray-300 dark:bg-gray-800 hover:bg-gray-400 dark:hover:bg-gray-900 border dark:border-gray-200"
                    >
                        Cancel
                    </button>
                </div>
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 text-lg hover:cursor-pointer"
                >
                    ✕
                </button>
            </div>

        </div>
    );
}