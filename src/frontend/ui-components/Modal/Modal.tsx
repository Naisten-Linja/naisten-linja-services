import React from 'react';
import ReactModal from 'react-modal';

interface ModalProps {
  isOpen: boolean;
  closeModal: (b: boolean) => void;
  label: string;
  testId?: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, closeModal, label, testId, children }) => {
  const testEnv = process.env.NODE_ENV === 'test';

  if (!testEnv) {
    ReactModal.setAppElement('#root');
  }

  return (
    <ReactModal
      isOpen={isOpen}
      contentLabel={label}
      ariaHideApp={!testEnv}
      onRequestClose={() => closeModal(!isOpen)}
      testId={testId}
      style={{
        overlay: {
          position: 'fixed',
          top: '0',
          left: '0',
          right: '0',
          bottom: '0',
          backgroundColor: 'rgba(0, 0, 0, 0.1)',
        },
        content: {
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: ' translate(-50%, -50%)',
          border: '1px solid #ccc',
          background: '#fff',
          overflow: 'auto',
          borderRadius: '4px',
          outline: 'none',
          padding: '20px',
          minHeight: '30rem',
          maxWidth: '30rem',
        },
      }}
    >
      {children}
    </ReactModal>
  );
};

export default Modal;
