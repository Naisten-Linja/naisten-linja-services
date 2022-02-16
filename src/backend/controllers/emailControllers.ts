import sgMail from '@sendgrid/mail';

import { ApiBooking } from '../../common/constants-common';
import { getConfig } from '../config';

export type SendEmailParams = {
  to: string;
  subject: string;
  text: string;
};

const dateLocale = 'en-GB';
const timeZone = 'Europe/Helsinki';

export function sendBookingConfirmationEmail(booking: ApiBooking) {
  const startDate = new Date(booking.start);
  const startDay = startDate.toLocaleString(dateLocale, {
    weekday: 'long',
    month: 'long',
    day: '2-digit',
    year: 'numeric',
    timeZone,
  });
  const startTime = startDate.toLocaleString(dateLocale, {
    hour: '2-digit',
    minute: '2-digit',
    timeZone,
  });
  const endTime = new Date(booking.end).toLocaleString(dateLocale, {
    hour: '2-digit',
    minute: '2-digit',
    timeZone,
  });
  const text = `
Thank you, ${booking.fullName}!

You have reserved a volunteer time for "${
    booking.bookingType.name
  }" on ${startDay}, from ${startTime} to ${endTime}.

PLEASE NOTE: the booking time is in Europe/Helsinki timezone.

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
          name: 'Naisten Linja Volunteer Booking',
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
