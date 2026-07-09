import React, { useEffect } from "react";
import { X } from "lucide-react"; // Optional: for the close button icon

// 1. Define the props interface for the modal
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl"; // Allow different sizing options
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = "md", // Default size
}) => {
  // 2. Accessibility: Close the modal when pressing the 'Escape' key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.body.style.overflow = "hidden"; // Prevent background scrolling
      window.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.body.style.overflow = "unset"; // Re-enable scrolling
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  // If the modal isn't open, render nothing
  if (!isOpen) return null;

  // Map size classes dynamically
  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-2xl",
  };

  return (
    // 3. The Backdrop/Overlay
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dark background tint with fade-in effect */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose} // Close modal when clicking outside on the backdrop
      />

      {/* 4. The Modal Box (Card) */}
      <div
        className={`w-full ${sizeClasses[size]} transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all z-10 animate-in fade-in zoom-in-95 duration-200`}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900">
            {title || "Notification"}
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body / Children Content */}
        <div className="mt-4 text-sm text-slate-600">{children}</div>
      </div>
    </div>
  );
};
