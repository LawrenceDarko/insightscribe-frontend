"use client";

import { Modal, ModalHeader, ModalBody, ModalFooter } from "./Modal";
import { Button } from "./Button";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "primary";
  isLoading?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  isLoading,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} className="max-w-md">
      <div className="flex items-start gap-4">
        {variant === "danger" && (
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <svg className="h-5 w-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
          </div>
        )}
        <div className="flex-1">
          <ModalHeader>{title}</ModalHeader>
          {description && (
            <ModalBody>
              <p className="text-sm leading-relaxed text-surface-600 dark:text-surface-400">
                {description}
              </p>
            </ModalBody>
          )}
        </div>
      </div>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose} disabled={isLoading}>
          {cancelLabel}
        </Button>
        <Button
          variant={variant === "danger" ? "danger" : "primary"}
          onClick={onConfirm}
          isLoading={isLoading}
        >
          {confirmLabel}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
