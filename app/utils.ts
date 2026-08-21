export function mins(t: string): number {
  if (!t) return 0;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export function getOverlappingDates(s1: string, e1: string, s2: string, e2: string): string[] {
  const start = s1 > s2 ? s1 : s2;
  const end = e1 < e2 ? e1 : e2;
  if (start > end) return [];
  
  const dates: string[] = [];
  let current = new Date(start);
  const stop = new Date(end);
  while (current <= stop) {
    dates.push(current.toISOString().slice(0, 10));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

export function getBookingDayTimesForVal(start: string, end: string, startT: string, endT: string, targetDate: string) {
  const defaultStart = "08:00";
  const defaultEnd = "22:00";
  if (start === end) {
    return { start: startT || defaultStart, end: endT || defaultEnd };
  }
  if (targetDate === start) {
    return { start: startT || defaultStart, end: defaultEnd };
  }
  if (targetDate === end) {
    return { start: defaultStart, end: endT || defaultEnd };
  }
  return { start: defaultStart, end: defaultEnd };
}

export function getBookingDayTimes(b: any, targetDate: string) {
  if (!b.date.includes(" to ")) {
    return { start: b.start || "08:00", end: b.end || "22:00" };
  }
  const [start, end] = b.date.split(" to ");
  return getBookingDayTimesForVal(start, end, b.start, b.end, targetDate);
}

export function isBookingOnDate(bookingDate: string, targetDate: string) {
  if (!bookingDate) return false;
  if (bookingDate.includes(" to ")) {
    const [start, end] = bookingDate.split(" to ");
    return targetDate >= start && targetDate <= end;
  }
  return bookingDate === targetDate;
}
