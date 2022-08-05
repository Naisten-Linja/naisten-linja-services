import sgMail from '@sendgrid/mail';

import { ApiBooking, UserRole } from '../../common/constants-common';
import { getConfig } from '../config';
import { getUsers } from '../models/users';

export type SendDynamicEmailParams = {
  to: string | Array<string>;
  from: {
    name: string;
    email: string;
  };
  templateId: string;
  dynamicTemplateData: {
    reminder: boolean;
    recipientRole: UserRole;
    startDay: string;
    startTime: string;
    endTime: string;
    booking: ApiBooking;
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
  const { sendGridFromEmailAddress, sendGridBookingTemplateId } = getConfig();
  if (!sendGridFromEmailAddress) {
    console.log('No From email adress was set');
    return;
  }
  if (!sendGridBookingTemplateId) {
    console.log('No booking template was set');
    return;
  }
  const { startDay, startTime, endTime } = getBookingTimeComponents(booking);

  return sendEmailWithDynamicTemplate({
    to: booking.email,
    from: {
      name: 'Naisten Linja Booking Notifcation',
      email: sendGridFromEmailAddress,
    },
    templateId: sendGridBookingTemplateId,
    dynamicTemplateData: {
      reminder: false,
      recipientRole: UserRole.volunteer,
      startDay,
      startTime,
      endTime,
      booking
    },
  });
}

export async function sendNewBookingNotificationToStaffs(booking: ApiBooking) {
  const { sendGridFromEmailAddress, sendGridBookingTemplateId } = getConfig();
  if (!sendGridFromEmailAddress) {
    console.log('No From email adress was set');
    return;
  }
  if (!sendGridBookingTemplateId) {
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

  return sendEmailWithDynamicTemplate({
    to: staffEmails,
    from: {
      name: 'New Booking Notifcation',
      email: sendGridFromEmailAddress,
    },
    templateId: sendGridBookingTemplateId,
    dynamicTemplateData: {
      reminder: false,
      recipientRole: UserRole.staff,
      startDay,
      startTime,
      endTime,
      booking
    },
  });
}

export async function sendEmailWithDynamicTemplate(messageData: SendDynamicEmailParams): Promise<boolean> {
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