import React, { useState } from 'react';
import { useField, FieldArray } from 'formik';

import { BookingTypeDateRange } from '../../../common/constants-common';
import BookingTypeDateRangePicker from './BookingTypeDateRangePicker/BookingTypeDateRangePicker';
import { BookingTypeBadgeDateRange } from './BookingTypeBadgeDateRange';

export const BookingTypeDateRangesField = () => {
  const [{ value: dateRanges }] = useField<Array<BookingTypeDateRange>>('dateRanges');
  const [editRangeIndex, setEditRangeIndex] = useState<number | null>(null);

  const hasOnlyDateRangeAlways =
    dateRanges.length === 1 && dateRanges[0].start === null && dateRanges[0].end === null;

  return (
    <>
      <FieldArray
        name="dateRanges"
        render={(arrayHelpers) => (
          <>
            {dateRanges.length === 0 ? (
              <p className="font-size-xs color-error">
                No date ranges selected, this booking type is never available.
              </p>
            ) : (
              <ul className="list-unstyled">
                {dateRanges.map((range, idx) => (
                  <li className="display-inline-block margin-right-xxs" key={`exception.${idx}`}>
                    <BookingTypeBadgeDateRange
                      range={range}
                      onEdit={() => setEditRangeIndex(idx)}
                      onDelete={() => arrayHelpers.remove(idx)}
                    />
                  </li>
                ))}
                <BookingTypeDateRangePicker
                  currentRange={editRangeIndex !== null ? dateRanges[editRangeIndex] : null}
                  onChange={(newValue) => {
                    if (editRangeIndex !== null) {
                      arrayHelpers.replace(editRangeIndex, newValue);
                    }
                  }}
                  onClose={() => {
                    setEditRangeIndex(null);
                  }}
                  title={'Select range of dates when this booking type needs to be active'}
                />
              </ul>
            )}
            {!hasOnlyDateRangeAlways && (
              <div>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    const prevLength = dateRanges.length;
                    arrayHelpers.push({ start: null, end: null });
                    setEditRangeIndex(prevLength);
                  }}
                  className="button-xxs success"
                >
                  Add date range
                </button>
              </div>
            )}
          </>
        )}
      />
    </>
  );
};
