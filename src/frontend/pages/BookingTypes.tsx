import React, { useState, useEffect, useCallback } from 'react';
import { RouteComponentProps } from '@reach/router';

import { ApiBookingType, weekDays } from '../../common/constants-common';
import { useRequest } from '../http';
import { useNotifications } from '../NotificationsContext';
import { BookingTypeForm } from './BookingTypeForm';
import { format } from 'date-fns';

export const BookingTypes: React.FunctionComponent<RouteComponentProps> = () => {
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);
  const [bookingTypes, setBookingTypes] = useState<Array<ApiBookingType>>([]);
  const [editStates, setEditStates] = useState<Record<string, boolean>>({});
  const { getRequest } = useRequest();
  const { addNotification } = useNotifications();

  const fetchBookingTypes = useCallback(async () => {
    try {
      const bookingTypesResult = await getRequest<{ data: Array<ApiBookingType> }>(
        '/api/booking-types',
        { useJwt: true },
      );
      const result = bookingTypesResult.data.data;
      setBookingTypes(result);
      setEditStates(
        result.reduce(
          (acc, bookingType) => ({
            ...acc,
            [bookingType.uuid]: false,
          }),
          {},
        ),
      );
    } catch (err) {
      console.log(err);
      addNotification({ type: 'error', message: 'Unable to get all booking types' });
    }
  }, [addNotification, setBookingTypes, getRequest]);

  useEffect(() => {
    if (!isCreatingNew) {
      fetchBookingTypes();
    }
  }, [fetchBookingTypes, isCreatingNew]);

  const editCallback = useCallback(
    (bookingType: ApiBookingType) => async () => {
      await fetchBookingTypes();
      setEditStates({ ...editStates, [bookingType.uuid]: false });
    },
    [fetchBookingTypes, setEditStates, editStates],
  );

  if (isCreatingNew) {
    return (
      <div className="container">
        <h1>New booking type</h1>
        <BookingTypeForm
          onSubmitCallback={() => setIsCreatingNew(false)}
          onCancelCallback={() => setIsCreatingNew(false)}
        />
      </div>
    );
  }

  return (
    <div className="container">
      <h1>Booking types</h1>
      <button
        className="button button-info button-m margin-bottom-l"
        onClick={() => setIsCreatingNew(true)}
      >
        Create a new booking type
      </button>
      {bookingTypes.map((bookingType) => {
        const isEditing = editStates[bookingType.uuid];
        const { rules, uuid, name, exceptions, additionalInformation } = bookingType;
        return (
          <div className="margin-bottom-l" key={uuid}>
            {isEditing ? (
              <BookingTypeForm
                bookingType={bookingType}
                onSubmitCallback={editCallback(bookingType)}
                onCancelCallback={editCallback(bookingType)}
              />
            ) : (
              <table className="table-responsive ">
                <thead>
                  <tr>
                    <td>
                      <button
                        className="button button-xxs button-info width-100"
                        onClick={() =>
                          setEditStates({
                            ...editStates,
                            [uuid]: !isEditing,
                          })
                        }
                      >
                        Edit
                      </button>
                    </td>
                    <td className="font-weight-bold font-size-xl">{name}</td>
                  </tr>
                  {additionalInformation && (
                    <tr>
                      <th className="font-weight-semibold font-size-s" style={{ width: '7rem' }}>
                        Additional information
                      </th>
                      <td className="font-weight-semibold font-size-s">
                        <div
                          key="additional-information"
                          className="display-inline-block border-radius background-success-100 padding-xxs font-size-xs font-weight-semibold"
                        >
                          {additionalInformation}
                        </div>
                      </td>
                    </tr>
                  )}
                  <tr>
                    <th className="font-weight-semibold font-size-s" style={{ width: '7rem' }}>
                      Exceptions
                    </th>
                    <td className="font-weight-semibold font-size-s">
                      <ul className="list-unstyled">
                        {exceptions.map((exceptionDateString, idx) => (
                          <li
                            className="display-inline-block margin-right-xxs"
                            key={`exception.${idx}`}
                          >
                            <div
                              key={`exception-${idx}`}
                              className="border-radius background-error-50 padding-xxs font-size-xxs font-weight-semibold"
                            >
                              {format(new Date(exceptionDateString), 'dd.MM.yyyy')}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                  <tr>
                    <th className="font-weight-semibold" style={{ width: '7rem' }}>
                      Week day
                    </th>
                    <th className="font-weight-semibold">Slots</th>
                  </tr>
                </thead>
                <tbody>
                  {rules.map(({ slots = [] }, idx) => (
                    <tr key={idx}>
                      <th> {weekDays[idx]}</th>
                      <td key={idx}>
                        {slots.length > 0
                          ? slots.map((slot, idx) => (
                              <div
                                key={`slot-${idx}`}
                                className="display-inline-block border-radius background-info-100 padding-xxs margin-xxs font-size-xs font-weight-semibold"
                              >
                                {`${slot.start} - ${slot.end}; available seats: ${slot.seats}`}
                              </div>
                            ))
                          : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        );
      })}
    </div>
  );
};
