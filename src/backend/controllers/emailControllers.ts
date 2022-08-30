import sgMail from '@sendgrid/mail';

import { ApiBooking } from '../../common/constants-common';
import { getConfig } from '../config';
import { getLetterCustomerEmailByUuid } from '../models/letters';
import { getUsers } from '../models/users';
import { getAllBookings } from './bookingControllers';

export type SendDynamicEmailParams<TDynamicTemplate> = {
  to: string | Array<string>;
  from: {
    name: string;
    email: string;
  };
  templateId: string;
  dynamicTemplateData: TDynamicTemplate;
};

type BookingDynamicTemplate = {
  startDay: string;
  startTime: string;
  endTime: string;
  booking: ApiBooking;
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
  const {
    sendGridFromEmailName,
    sendGridFromEmailAddress,
    sendGridVolunteerBookingConfirmationTemplate,
  } = getConfig();
  if (!sendGridFromEmailName) {
    console.log('No From email name was set');
    return;
  }
  if (!sendGridFromEmailAddress) {
    console.log('No From email address was set');
    return;
  }
  if (!sendGridVolunteerBookingConfirmationTemplate) {
    console.log('No booking template was set');
    return;
  }
  const { startDay, startTime, endTime } = getBookingTimeComponents(booking);

  return sendEmailWithDynamicTemplate<BookingDynamicTemplate>({
    to: booking.email,
    from: {
      name: sendGridFromEmailName,
      email: sendGridFromEmailAddress,
    },
    templateId: sendGridVolunteerBookingConfirmationTemplate,
    dynamicTemplateData: {
      startDay,
      startTime,
      endTime,
      booking,
    },
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
export async function sendBookingRemindersToVolunteers(
  bookingReminderDaysBefore: number,
): Promise<boolean[] | undefined> {
  const {
    sendGridFromEmailName,
    sendGridFromEmailAddress,
    sendGridVolunteerBookingReminderTemplate,
  } = getConfig();
  if (!sendGridFromEmailName) {
    console.log('No From email name was set');
    return;
  }
  if (!sendGridFromEmailAddress) {
    console.log('No From email address was set');
    return;
  }
  if (!sendGridVolunteerBookingReminderTemplate) {
    console.log('No booking template was set');
    return;
  }

  console.log(`Starting to send booking reminders at ${new Date().toISOString()}`);

  const bookings = await getAllBookings();
  if (!bookings) {
    console.log('Failed to fetch bookings');
    return;
  }

  // Find which bookings we want to send a reminder for
  const bookingsToRemindAbout = bookings.filter((booking) => {
    const slotDay = new Date(booking.start);
    const today = new Date();

    // Always use the beginning of the day slot for comparison.
    slotDay.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const bookingDaysInAdvance = (slotDay.getTime() - today.getTime()) / (1000 * 3600 * 24);

    const daysToTargetSendingTime = Math.abs(bookingDaysInAdvance - bookingReminderDaysBefore);
    return daysToTargetSendingTime < 0.5; // should take rounding errors and leap days/seconds into account
  });

  console.log(`Found ${bookingsToRemindAbout.length} bookings to remind about.`);

  const results = bookingsToRemindAbout.map((booking) => {
    const { startDay, startTime, endTime } = getBookingTimeComponents(booking);

    return sendEmailWithDynamicTemplate<BookingDynamicTemplate>({
      to: booking.email,
      from: {
        name: sendGridFromEmailName,
        email: sendGridFromEmailAddress,
      },
      templateId: sendGridVolunteerBookingReminderTemplate,
      dynamicTemplateData: {
        startDay,
        startTime,
        endTime,
        booking,
      },
    });
  });

  return Promise.all(results);
}

export async function sendNewBookingNotificationToStaffs(booking: ApiBooking) {
  const {
    sendGridFromEmailName,
    sendGridFromEmailAddress,
    sendGridStaffBookingConfirmationTemplate,
  } = getConfig();
  if (!sendGridFromEmailName) {
    console.log('No From email name was set');
    return;
  }
  if (!sendGridFromEmailAddress) {
    console.log('No From email address was set');
    return;
  }
  if (!sendGridStaffBookingConfirmationTemplate) {
    console.log('No booking template was set');
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

  return sendEmailWithDynamicTemplate<BookingDynamicTemplate>({
    to: staffEmails,
    from: {
      name: sendGridFromEmailName,
      email: sendGridFromEmailAddress,
    },
    templateId: sendGridStaffBookingConfirmationTemplate,
    dynamicTemplateData: {
      startDay,
      startTime,
      endTime,
      booking,
    },
  });
}

/**
 * Send a notification to the original sender of a letter.
 *
 * This method does NOT check if there is a published reply, it must only be called if there is.
 *
 * But it DOES check whether the customer has given their email address. If not, will return undefined.
 *
 * @param letterUuid
 * @returns True if sent successfully, false if an error occured while sending, undefined if didn't even try to send.
 */
export async function sendReplyNotificationToCustomer(letterUuid: string): Promise<
  | { sent: true }
  | {
      sent: false;
      reason: 'no from email' | 'no notification template' | 'no customer email' | 'sendgrid error';
    }
> {
  const {
    sendGridFromEmailNameForCustomers,
    sendGridFromEmailAddress,
    sendGridCustomerReplyNotificationTemplate,
  } = getConfig();
  if (!sendGridFromEmailNameForCustomers) {
    console.log('No From email name (for customers) was set');
    return { sent: false, reason: 'no from email' };
  }
  if (!sendGridFromEmailAddress) {
    console.log('No From email adress was set');
    return { sent: false, reason: 'no from email' };
  }
  if (!sendGridCustomerReplyNotificationTemplate) {
    console.log('No notification template was set');
    return { sent: false, reason: 'no notification template' };
  }

  const customerEmail = await getLetterCustomerEmailByUuid(letterUuid);
  if (!customerEmail) {
    return { sent: false, reason: 'no customer email' };
  }

  const success = await sendEmailWithDynamicTemplate<Record<string, never>>({
    to: customerEmail,
    from: {
      name: sendGridFromEmailNameForCustomers,
      email: sendGridFromEmailAddress,
    },
    templateId: sendGridCustomerReplyNotificationTemplate,
    dynamicTemplateData: {},
  });

  if (success) {
    return { sent: true };
  } else {
    return { sent: false, reason: 'sendgrid error' };
  }
}

export async function sendEmailWithDynamicTemplate<T extends Record<string, unknown>>(
  messageData: SendDynamicEmailParams<T>,
): Promise<boolean> {
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
      console.error(err);
      console.log('Failed to send email');
      return false;
    }
  }
  return false;
}
