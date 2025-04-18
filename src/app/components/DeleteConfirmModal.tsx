import React, { useRef, useEffect } from 'react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  title: string;
  content: string;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  title,
  content,
  onClose,
  onConfirm,
}) => {
  const modalRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (isOpen) {
      modalRef.current?.showModal();
    } else {
      modalRef.current?.close();
    }
  }, [isOpen]);

  // 关闭时重置
  useEffect(() => {
    if (!isOpen) {
      // 可扩展重置逻辑
    }
  }, [isOpen]);

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <dialog ref={modalRef} className="modal" onClose={onClose}>
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-4">{title}</h3>
        <div className="mb-6 text-base-content/80">{content}</div>
        <div className="modal-action">
          <button type="button" className="btn btn-outline" onClick={onClose}>
            取消
          </button>
          <button type="button" className="btn btn-error" onClick={handleConfirm}>
            确定
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button>关闭</button>
      </form>
    </dialog>
  );
};

export default DeleteConfirmModal; 