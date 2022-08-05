import sgMail from '@sendgrid/mail';

import { ApiBooking } from '../../common/constants-common';
import { getConfig } from '../config';
import { getUsers } from '../models/users';
import { getAllBookings } from './bookingControllers';

export type SendEmailParams = {
  to: string | Array<string>;
  subject: string;
  text: string;
  from: {
    name: string;
    email: string;
  };
};

const dateLocale = 'en-GB';
const timeZone = 'Europe/Helsinki';

function getBookingTimeComponents(booking: ApiBooking) {
  const date = new Date(booking.start);
  const startDay = date.toLocaleString(dateLocale, {
    weekday: 'long',
    month: 'long',
    day: '2-digit',
    year: 'numeric',
    timeZone,
  });
  const startTime = date.toLocaleString(dateLocale, {
    hour: '2-digit',
    minute: '2-digit',
    timeZone,
  });
  const endTime = new Date(booking.end).toLocaleString(dateLocale, {
    hour: '2-digit',
    minute: '2-digit',
    timeZone,
  });
  return {
    startDay,
    startTime,
    endTime,
  };
}

export async function sendBookingConfirmationEmail(booking: ApiBooking) {
  const { sendGridFromEmailAddress } = getConfig();
  if (!sendGridFromEmailAddress) {
    console.log('No From email adress was set');
    return;
  }
  const { startDay, startTime, endTime } = getBookingTimeComponents(booking);
  const text = `
Thank you, ${booking.fullName}!

You have reserved a volunteer time for "${booking.bookingType.name
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
    from: {
      name: 'Naisten Linja Booking Notifcation',
      email: sendGridFromEmailAddress,
    },
    text,
  });
}

/**
 * Send reminder email to volunteers about their bookings.
 *
 * This function is supposed to be run **exactly once** every day,
 * at the time when the emails need to be sent.
 *
 * If same volunteer has multiple bookings for the same day, they will
 * get multiple notifications sent at the same time.
 */
export async function sendBookingRemindersToVolunteers(): Promise<boolean[] | undefined> {
  const { sendGridFromEmailAddress } = getConfig();
  if (!sendGridFromEmailAddress) {
    console.log('No From email adress was set');
    return;
  }

  console.log(`Starting to send booking reminders at ${new Date().toISOString()}`);

  const bookings = await getAllBookings()
  if (!bookings) {
    console.log("Failed to fetch bookings");
    return;
  }

  // Find which bookings we want to send a reminder for
  const bookingsToRemindAbout = bookings
    .filter(booking => {
      const bookingReminderDaysBefore: number | null = 3; // remind 3 days before booking
      if (bookingReminderDaysBefore === null) return false; // user does not want a reminder

      const slotDay = new Date(booking.start);
      const today = new Date();

      // Always use the beginning of the day slot for comparison.
      slotDay.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      const bookingDaysInAdvance = (slotDay.getTime() - today.getTime()) / (1000 * 3600 * 24);

      const daysToTargetSendingTime = Math.abs(bookingDaysInAdvance - bookingReminderDaysBefore);
      return daysToTargetSendingTime < 0.5; // should take rounding errors and leap days/seconds into account
    });

  console.log(`Found ${bookingsToRemindAbout.length} bookings to remind about.`)

  const results = bookingsToRemindAbout.map(booking => {
    const { startDay, startTime, endTime } = getBookingTimeComponents(booking);
    const text = `
Hello, ${booking.fullName}!

This is a reminder of your reserved volunteer time for "${booking.bookingType.name
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
      subject: `Reminder of your volunteer reservation for ${booking.bookingType.name} on ${startDay}`,
      from: {
        name: 'Naisten Linja Booking Notifcation',
        email: sendGridFromEmailAddress,
      },
      text,
    });
  });

  return Promise.all(results);
}

export async function sendNewBookingNotificationToStaffs(booking: ApiBooking) {
  const { sendGridFromEmailAddress } = getConfig();
  if (!sendGridFromEmailAddress) {
    console.log('No From email adress was set');
    return;
  }

  const users = await getUsers();
  if (!users) {
    return;
  }
  const slotDay = new Date(booking.start);
  const today = new Date();

  // Always use the beginning of the day slot for comparison.
  slotDay.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const bookingDaysInAdvance = (slotDay.getTime() - today.getTime()) / (1000 * 3600 * 24);

  // Get a list of staff emails that has new booking notification settings set, and the amount of
  // booking days in advanced is within the staf user's range setting
  const staffEmails = users
    .filter(
      ({ role, newBookingNotificationDaysThreshold }) =>
        role === 'staff' &&
        newBookingNotificationDaysThreshold &&
        newBookingNotificationDaysThreshold >= bookingDaysInAdvance,
    )
    .map(({ email }) => email);

  const { startDay, startTime, endTime } = getBookingTimeComponents(booking);
  const text = `
A new booking was made for user ${booking.fullName} (${booking.user.email}) with the follow details:

Booking: ${booking.bookingType.name}
Date: ${startDay}
Time: ${startTime} - ${endTime}
Email: ${booking.email}
Phone: ${booking.phone}
Working location: ${booking.workingRemotely ? 'Remotely' : 'From the office'}
${booking.bookingNote ? 'Booking note:\n' + booking.bookingNote : ''}
  `;

  return sendEmail({
    to: staffEmails,
    subject: `New reservation made for slot ${startTime} - ${endTime} on ${startDay} for ${booking.bookingType.name}`,
    from: {
      name: 'New Booking Notifcation',
      email: sendGridFromEmailAddress,
    },
    text,
  });
}

export async function sendEmail(messageData: SendEmailParams): Promise<boolean> {
  const { sendGridApiKey } = getConfig();
  if (!sendGridApiKey) {
    console.log('No SendGridApi key was provided');
  } else {
    sgMail.setApiKey(sendGridApiKey);
    try {
      const result = await sgMail.send(messageData);
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
