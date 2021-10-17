import React, { useEffect } from 'react';
import { BookingTypeForm } from './BookingTypeForm';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('BookingTypeForm', () => {
  it('should not show button for choosing exceptions when there are no picked slots', () => {
    render(<BookingTypeForm />);

    expect(screen.queryByText('Add exceptions')).toBeDisabled();
  });

  it('when a slot is picked, should show button for choosing exceptions', async () => {
    render(<BookingTypeForm />);

    userEvent.click(screen.getByTestId('add-slot-button-monday'));

    await waitFor(() => expect(screen.getByText('Add exceptions')).not.toBeDisabled());
  });

  it('given a slot is picked, when choosing exceptions button is clicked, shows modal for choosing dates', async () => {
    render(<BookingTypeForm />);

    userEvent.click(screen.getByTestId('add-slot-button-monday'));
    userEvent.click(screen.getByRole('button', { name: 'Add exceptions' }));

    await waitFor(() => expect(screen.getByTestId('date-picker-modal')).toBeInTheDocument());
  });
});
