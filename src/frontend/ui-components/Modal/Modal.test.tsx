import Modal from './Modal';
import { render, screen } from '@testing-library/react';
import React from 'react';
import userEvent from '@testing-library/user-event';

describe('Modal', () => {
  const closeModalMock = jest.fn();

  it('given the modal is closed, does not show content', () => {
    render(
      <Modal
        isOpen={false}
        closeModal={closeModalMock}
        label="some-label"
        children={<div>some-content</div>}
      />,
    );

    expect(screen.queryByText('some-content')).not.toBeInTheDocument();
  });

  describe('given the modal is open', () => {
    beforeEach(() => {
      render(
        <Modal
          isOpen={true}
          closeModal={closeModalMock}
          label="some-label"
          children={
            <div>
              <p>some-content</p>
              <button onClick={closeModalMock}>close modal</button>
            </div>
          }
        />,
      );
    });

    it('shows content', () => {
      expect(screen.getByText('some-content')).toBeInTheDocument();
    });

    it('when the modal is closed, closes modal', () => {
      userEvent.click(screen.getByRole('button'));

      expect(closeModalMock).toHaveBeenCalled();
    });
  });
});
