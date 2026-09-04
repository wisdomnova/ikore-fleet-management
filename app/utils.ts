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

export function isBookingInDateRange(bookingDate: string, rangeStart: string, rangeEnd: string): boolean {
  if (!bookingDate) return false;
  const [bStart, bEnd] = bookingDate.includes(" to ") ? bookingDate.split(" to ") : [bookingDate, bookingDate];
  return bStart <= rangeEnd && bEnd >= rangeStart;
}

export function getWeekDates(baseDate: Date = new Date()): { start: string; end: string; dates: string[] } {
  const d = new Date(baseDate);
  const day = d.getDay(); // 0 is Sunday, 1 is Monday...
  const diffToMon = (day === 0 ? -6 : 1) - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMon);
  
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const next = new Date(monday);
    next.setDate(monday.getDate() + i);
    dates.push(next.toISOString().slice(0, 10));
  }
  return {
    start: dates[0],
    end: dates[6],
    dates
  };
}

export const GENERIC_DRIVER_LABELS = [
  "assign any available driver",
  "self-drive (approved staff)",
  "bolt ride (arranged)",
  "hired vehicle with driver",
  "bolt driver",
  "car hire driver"
];

export function isNamedDriver(driverName?: string | null): boolean {
  if (!driverName || !driverName.trim()) return false;
  return !GENERIC_DRIVER_LABELS.includes(driverName.trim().toLowerCase());
}

export function isBookingTimesOverlap(
  dateRange1: { start: string; end: string; startTime: string; endTime: string },
  dateRange2: { start: string; end: string; startTime: string; endTime: string }
): boolean {
  const { start: s1, end: e1, startTime: tS1, endTime: tE1 } = dateRange1;
  const { start: s2, end: e2, startTime: tS2, endTime: tE2 } = dateRange2;

  if (!(s1 <= e2 && s2 <= e1)) return false;

  const overlapDays = getOverlappingDates(s1, e1, s2, e2);
  if (overlapDays.length > 1) return true;
  if (overlapDays.length === 1) {
    const targetDate = overlapDays[0];
    const time1 = getBookingDayTimesForVal(s1, e1, tS1, tE1, targetDate);
    const time2 = getBookingDayTimesForVal(s2, e2, tS2, tE2, targetDate);
    return mins(time1.start) < mins(time2.end) && mins(time2.start) < mins(time1.end);
  }
  return false;
}

export interface ConflictCheckParams {
  bookingId?: number;
  carId?: number | null;
  mode?: string | null;
  driver?: string | null;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  bookings: any[];
  cars?: any[];
}

export interface ConflictCheckResult {
  hasConflict: boolean;
  carInWorkshop?: boolean;
  vehicleConflictBooking?: any;
  driverConflictBooking?: any;
  errorMessage?: string;
}

export function checkBookingConflict(params: ConflictCheckParams): ConflictCheckResult {
  const {
    bookingId,
    carId,
    mode = "Office car",
    driver,
    startDate,
    endDate,
    startTime,
    endTime,
    bookings,
    cars = []
  } = params;

  const targetDateRange = {
    start: startDate,
    end: endDate,
    startTime,
    endTime
  };

  const isOffice = !mode || mode === "Office car";

  // 1. Check if car is in workshop
  if (isOffice && typeof carId === "number") {
    const car = cars.find((c) => c.id === carId);
    if (car?.shop) {
      return {
        hasConflict: true,
        carInWorkshop: true,
        errorMessage: `${car.plate && car.plate !== "TBD" ? car.plate + " - " : ""}${car.name} is currently in the workshop and cannot be booked.`
      };
    }
  }

  // 2. Check Vehicle Conflict (if office car)
  let vehicleConflictBooking: any = null;
  if (isOffice && typeof carId === "number") {
    vehicleConflictBooking = bookings.find((b) => {
      if (bookingId && b.id === bookingId) return false;
      if (b.status === "declined") return false;
      if (b.mode && b.mode !== "Office car") return false;
      if (b.carId !== carId) return false;

      const [s2, e2] = b.date.includes(" to ") ? b.date.split(" to ") : [b.date, b.date];
      return isBookingTimesOverlap(targetDateRange, {
        start: s2,
        end: e2,
        startTime: b.start || "08:00",
        endTime: b.end || "22:00"
      });
    });
  }

  if (vehicleConflictBooking) {
    const targetCar = cars.find((c) => c.id === carId);
    return {
      hasConflict: true,
      vehicleConflictBooking,
      errorMessage: `${targetCar?.plate && targetCar.plate !== "TBD" ? targetCar.plate + " (" + targetCar.name + ")" : targetCar?.name || "Vehicle"} already has an overlapping booking during this time (${vehicleConflictBooking.staff}, ${vehicleConflictBooking.start} - ${vehicleConflictBooking.end}). Choose another vehicle or time.`
    };
  }

  // 3. Check Driver Conflict (if specific named driver)
  let driverConflictBooking: any = null;
  if (isNamedDriver(driver)) {
    const driverNorm = driver!.trim().toLowerCase();
    driverConflictBooking = bookings.find((b) => {
      if (bookingId && b.id === bookingId) return false;
      if (b.status === "declined") return false;
      if (!b.driver || !isNamedDriver(b.driver)) return false;
      if (b.driver.trim().toLowerCase() !== driverNorm) return false;

      const [s2, e2] = b.date.includes(" to ") ? b.date.split(" to ") : [b.date, b.date];
      return isBookingTimesOverlap(targetDateRange, {
        start: s2,
        end: e2,
        startTime: b.start || "08:00",
        endTime: b.end || "22:00"
      });
    });
  }

  if (driverConflictBooking) {
    const clashCar = cars.find((c) => c.id === driverConflictBooking.carId);
    return {
      hasConflict: true,
      driverConflictBooking,
      errorMessage: `Driver "${driver}" is already assigned to a trip for ${driverConflictBooking.staff}${clashCar ? ` on ${clashCar.plate || clashCar.name}` : ""} from ${driverConflictBooking.start} to ${driverConflictBooking.end} on ${driverConflictBooking.date}. Please select another driver or adjust the schedule.`
    };
  }

  return { hasConflict: false };
}

export interface VehicleDocument {
  id: string;
  name: string;
  expiry?: string;
  docNo?: string;
  notes?: string;
}

export function parseVehicleDocuments(papers?: string | null): VehicleDocument[] {
  if (!papers || !papers.trim()) return [];
  const trimmed = papers.trim();
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((d: any, idx: number) => ({
          id: d.id || `doc-${idx}-${Date.now()}`,
          name: d.name || "Document",
          expiry: d.expiry || "",
          docNo: d.docNo || "",
          notes: d.notes || ""
        }));
      }
    } catch (e) {
      // Fall through to legacy parsing
    }
  }

  return [
    {
      id: "doc-legacy-1",
      name: "Vehicle Papers",
      expiry: trimmed.replace(/^Papers renewal:\s*/i, ""),
      docNo: "",
      notes: ""
    }
  ];
}

export function serializeVehicleDocuments(docs: VehicleDocument[]): string | null {
  if (!docs || docs.length === 0) return null;
  return JSON.stringify(docs);
}

export function formatVehiclePapersSummary(papers?: string | null): string {
  if (!papers || !papers.trim()) return "";
  const docs = parseVehicleDocuments(papers);
  if (docs.length === 0) return "";

  if (docs.length === 1) {
    const doc = docs[0];
    if (doc.expiry) {
      const cleanExp = doc.expiry.replace(/^Papers renewal:\s*/i, "").replace(/^Papers renewal\s*-\s*/i, "");
      if (doc.name && doc.name !== "Vehicle Papers") {
        return `${doc.name} - ${cleanExp}`;
      }
      return `Papers renewal - ${cleanExp}`;
    }
    return doc.name || "";
  }

  return docs
    .map((d) => (d.expiry ? `${d.name}: ${d.expiry}` : d.name))
    .filter(Boolean)
    .join(" / ");
}
