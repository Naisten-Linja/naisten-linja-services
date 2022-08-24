import React from 'react';
import ReactModal from 'react-modal';

interface ModalProps {
  isOpen: boolean;
  closeModal: (b: boolean) => void;
  label: string;
  testId?: string;
  children: React.ReactNode;
  style?: ReactModal.Styles;
}

const Modal: React.FC<ModalProps> = ({ isOpen, closeModal, label, testId, children, style }) => {
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
          zIndex: 200,
          ...style?.overlay,
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
          height: 'fit-content',
          maxHeight: 'calc(100% - 40px - 2rem)', // full height - padding - extra space around
          width: 'calc(100% - 40px - 2rem)', // full width - padding - extra space around
          maxWidth: '30rem', // Override this with style prop to modify the normal width
          ...style?.content,
        },
      }}
    >
      {children}
    </ReactModal>
  );
};

export default Modal;
