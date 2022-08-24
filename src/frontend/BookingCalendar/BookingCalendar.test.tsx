import moment from "moment-timezone";
import { isDateInActiveDateRanges } from "./BookingCalendar";

describe('isDateInActiveDateRanges', () => {
    it('returns false if no active ranges', () => {
        expect(isDateInActiveDateRanges(
            moment("2022-08-22"),
            [],
        )).toBe(false);
    });

    it('returns true if always active', () => {
        expect(isDateInActiveDateRanges(
            moment("2022-08-22"),
            [{ start: null, end: null }],
        )).toBe(true);
    });

    it('returns true if exactly that day is active', () => {
        expect(isDateInActiveDateRanges(
            moment("2022-08-22"),
            [{ start: "2022-08-22", end: "2022-08-22" }],
        )).toBe(true);
    });

    it('returns true if day is inside range going to either eternity', () => {
        expect(isDateInActiveDateRanges(
            moment("2022-08-22"),
            [{ start: null, end: "2022-08-25" }],
        )).toBe(true);
        expect(isDateInActiveDateRanges(
            moment("2022-08-22"),
            [{ start: "2022-08-20", end: null }],
        )).toBe(true);
    });

    it('returns false if we have all possible range types but nothing matches', () => {
        expect(isDateInActiveDateRanges(
            moment("2022-08-22"),
            [
                { start: null, end: "2022-08-10" },
                { start: "2022-08-12", end: "2022-08-13" },
                { start: "2022-08-21", end: "2022-08-21" },
                { start: "2022-08-23", end: null },
            ],
        )).toBe(false);
    });
});