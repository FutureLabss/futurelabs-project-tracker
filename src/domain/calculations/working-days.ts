import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { Availability } from "../../entities/availability.entity";

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.extend(customParseFormat);

/**
 * Checks if a given date string is a working day (Mon-Fri).
 */
export function isWorkingDay(dateStr: string): boolean {
  const day = dayjs(dateStr).day();
  return day !== 0 && day !== 6; // 0 = Sunday, 6 = Saturday
}

/**
 * Calculates the number of working days (Mon-Fri) between two dates inclusive of start and end.
 * If fromDate > toDate, returns negative count.
 */
export function getWorkingDaysBetween(
  fromDateStr: string,
  toDateStr: string,
): number {
  const from = dayjs(fromDateStr).startOf("day");
  const to = dayjs(toDateStr).startOf("day");

  if (from.isSame(to, "day")) {
    return isWorkingDay(fromDateStr) ? 1 : 0;
  }

  const isReverse = from.isAfter(to);
  const start = isReverse ? to : from;
  const end = isReverse ? from : to;

  let current = start.clone();
  let count = 0;

  while (current.isSameOrBefore(end, "day")) {
    if (isWorkingDay(current.format("YYYY-MM-DD"))) {
      count++;
    }
    current = current.add(1, "day");
  }

  return isReverse ? -count : count;
}

/**
 * Calculates working days elapsed between a past date and the simulated date.
 * Excludes weekends.
 */
export function getWorkingDaysElapsed(
  sinceDateStr: string,
  simulatedDateStr: string,
): number {
  const since = dayjs(sinceDateStr).startOf("day");
  const sim = dayjs(simulatedDateStr).startOf("day");

  if (sim.isBefore(since)) {
    return 0;
  }

  let current = since.clone();
  let count = 0;

  while (current.isBefore(sim, "day")) {
    if (isWorkingDay(current.format("YYYY-MM-DD"))) {
      count++;
    }
    current = current.add(1, "day");
  }

  return count;
}

/**
 * Calculates working days on leave for a specific person between two dates.
 */
export function getLeaveDaysInInterval(
  personId: string,
  fromDateStr: string,
  toDateStr: string,
  availabilities: Availability[],
): number {
  const userLeaves = availabilities.filter((a) => a.personId === personId);
  if (userLeaves.length === 0) return 0;

  const start = dayjs(fromDateStr).startOf("day");
  const end = dayjs(toDateStr).startOf("day");

  let leaveWorkingDays = 0;
  let current = start.clone();

  while (current.isSameOrBefore(end, "day")) {
    const curStr = current.format("YYYY-MM-DD");
    if (isWorkingDay(curStr)) {
      const onLeave = userLeaves.some((l) => {
        const lFrom = dayjs(l.fromDate).startOf("day");
        const lTo = dayjs(l.toDate).startOf("day");
        return current.isSameOrAfter(lFrom) && current.isSameOrBefore(lTo);
      });
      if (onLeave) {
        leaveWorkingDays++;
      }
    }
    current = current.add(1, "day");
  }

  return leaveWorkingDays;
}
