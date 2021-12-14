import sgMail from '@sendgrid/mail';

import { ApiBooking } from '../../common/constants-common';
import { getConfig } from '../config';

export type SendEmailParams = {
  to: string;
  subject: string;
  text: string;
};

export function sendBookingConfirmationEmail(booking: ApiBooking) {
  const startDate = new Date(booking.start);
  const startDay = startDate.toLocaleString('en-GB', {
    weekday: 'long',
    month: 'long',
    day: '2-digit',
    year: 'numeric',
  });
  const startTime = startDate.toLocaleString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const endTime = new Date(booking.end).toLocaleString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const text = `
Thank you, ${booking.fullName}!

You have reserved a volunteer time for "${
    booking.bookingType.name
  }" on ${startDay}, from ${startTime} to ${endTime}.

Here is a summary if your booking details:

Booking: ${booking.bookingType.name}
Date: ${startDay}
Time: ${startTime} - ${endTime}
Email: ${booking.email}
Phone: ${booking.phone}
Working location: ${booking.workingRemotely ? 'Remotely' : 'From the office'}
${booking.bookingNote ? 'Booking note:\n' + booking.bookingNote : ''}
  `;
  return sendEmail({
    to: booking.email,
    subject: `Volunteer reservation for ${booking.bookingType.name} on ${startDay}`,
    text,
  });
}

export async function sendEmail(messageData: SendEmailParams): Promise<boolean> {
  const { sendGridApiKey, sendGridFromEmailAddress } = getConfig();
  if (!sendGridApiKey || !sendGridFromEmailAddress) {
    console.log('sendEmail function called');
    // console.log(messageData);
  } else {
    sgMail.setApiKey(sendGridApiKey);
    try {
      const result = await sgMail.send({
        ...messageData,
        from: {
          name: 'Naisten Linja Volunteer Service',
          email: sendGridFromEmailAddress,
        },
      });
      if (result[0].statusCode === 202) {
        return true;
      }
    } catch (err) {
      console.log('Failed to send email');
      return false;
    }
  }
  return false;
}
