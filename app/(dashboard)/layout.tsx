"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { API_BASE_URL } from "../config";
import {
  IconLayoutBoard,
  IconCar,
  IconCircleCheck,
  IconGasStation,
  IconSteeringWheel,
  IconSettings,
  IconList,
  IconUsers,
  IconMapPin,
  IconLogout
} from "@tabler/icons-react";

// ============================== TYPES ==============================
export interface Staff {
  name: string;
  designation: string | null;
  dept: string | null;
  co: "Tractrac" | "Ikore";
  approver: boolean;
  user: string;
}

export interface Car {
  id: number;
  plate: string;
  name: string;
  co: "Tractrac" | "Ikore";
  fuel: number;
  odo: number;
  loc: string;
  locT: string;
  shop: boolean;
  papers?: string;
}

export interface Booking {
  id: number;
  carId: number;
  date: string;
  start: string;
  end: string;
  staff: string;
  dept: string;
  co: "Tractrac" | "Ikore";
  dest: string;
  driver: string;
  purpose: string;
  manager: string;
  status: "approved" | "pending" | "declined";
  mode?: string;
  adjustedBy?: string;
  cost?: number;
  receiptName?: string;
  receiptURL?: string;
  startOdo?: number;
  endOdo?: number;
  decidedAt?: string;
  decidedBy?: string;
}

export interface FuelLog {
  carId: number;
  when: string;
  driver: string;
  litres: number;
  cost: number;
  level: number;
  odo: number;
  station: string;
}

export interface Driver {
  name: string;
  co: "Tractrac" | "Ikore";
  phone: string;
  licence: string;
  licExp: string;
  years: number;
  base: string;
}

export interface MaintenanceLog {
  carId: number;
  date: string;
  type: string;
  odo: number;
  cost: number;
  workshop: string;
  notes: string;
}

export interface IssueLog {
  id: number;
  carId: number;
  date: string;
  driver: string;
  severity: string;
  desc: string;
  status: "Open" | "Resolved";
  resolvedBy?: string;
}

// ============================== CONTEXT ==============================
interface FleetContextType {
  currentUser: Staff | null;
  setCurrentUser: (u: Staff | null) => void;
  cars: Car[];
  setCars: (c: Car[]) => void;
  bookings: Booking[];
  setBookings: (b: Booking[]) => void;
  fuelLogs: FuelLog[];
  setFuelLogs: (f: FuelLog[]) => void;
  maintLogs: MaintenanceLog[];
  setMaintLogs: (m: MaintenanceLog[]) => void;
  issueLogs: IssueLog[];
  setIssueLogs: (i: IssueLog[]) => void;
  nextBookingId: number;
  setNextBookingId: (id: number) => void;
  nextIssueId: number;
  setNextIssueId: (id: number) => void;
  nextCarId: number;
  setNextCarId: (id: number) => void;
  showToastMsg: (msg: string) => void;
}

const FleetContext = createContext<FleetContextType | undefined>(undefined);

export function useFleet() {
  const context = useContext(FleetContext);
  if (!context) {
    throw new Error("useFleet must be used within a FleetProvider");
  }
  return context;
}

const initialCars: Car[] = [
  { id: 1, plate: "TBD", name: "JAC T9", co: "Tractrac", fuel: 82, odo: 24230, loc: "Head office, Utako", locT: "07:42", shop: false },
  { id: 2, plate: "TBD", name: "Toyota Highlander", co: "Tractrac", fuel: 57, odo: 60018, loc: "Garki Area 11", locT: "08:20", shop: false },
  { id: 3, plate: "TBD", name: "Toyota Hiace Bus", co: "Tractrac", fuel: 90, odo: 48122, loc: "Idu Industrial Area", locT: "09:35", shop: false },
  { id: 4, plate: "TBD", name: "Toyota Sienna", co: "Tractrac", fuel: 35, odo: 71880, loc: "Head office, Utako", locT: "07:30", shop: false },
  { id: 5, plate: "YAB 706EZ", name: "Toyota Sienna", co: "Ikore", fuel: 66, odo: 52630, loc: "Ikore office", locT: "08:48", shop: false, papers: "Papers renewal: March 2027" },
];

export const STAFF: Staff[] = [
  { "name": "Godson Ohuruogu", "designation": "MD", "dept": "Office of the CEO", "co": "Tractrac", "approver": true, "user": "godson.ohuruogu" },
  { "name": "Stephen Aguebor", "designation": "Project Lead", "dept": "Programs", "co": "Tractrac", "approver": true, "user": "stephen.aguebor" },
  { "name": "Adedolapo Olupona .E", "designation": "Human Resources Manager", "dept": "Operations", "co": "Tractrac", "approver": false, "user": "adedolapo.e" },
  { "name": "Ojoma Okwute", "designation": "Operations Manager", "dept": "Operations", "co": "Tractrac", "approver": false, "user": "ojoma.okwute" },
  { "name": "John Olanrewaju", "designation": "Engineering Lead", "dept": "Programs", "co": "Tractrac", "approver": false, "user": "john.olanrewaju" },
  { "name": "Monday Isah", "designation": "State Team Lead", "dept": "Programs", "co": "Tractrac", "approver": false, "user": "monday.isah" },
  { "name": "Alero Otis", "designation": "Partnership", "dept": "Partnership", "co": "Tractrac", "approver": false, "user": "alero.otis" },
  { "name": "Isreal Olatunde", "designation": "DevOps Engr", "dept": "IT", "co": "Tractrac", "approver": false, "user": "isreal.olatunde" },
  { "name": "Mercy Edoyugbo", "designation": "Product Manager", "dept": "IT", "co": "Tractrac", "approver": false, "user": "mercy.edoyugbo" },
  { "name": "Magaret Thomas", "designation": "State Ops/Admin", "dept": "Operations", "co": "Tractrac", "approver": false, "user": "magaret.thomas" },
  { "name": "Atuonwu Adanna", "designation": "Communication Manager", "dept": "Communications", "co": "Tractrac", "approver": false, "user": "atuonwu.adanna" },
  { "name": "Monday Enejoh", "designation": "State Mobiliser", "dept": "Programs", "co": "Tractrac", "approver": false, "user": "monday.enejoh" },
  { "name": "Godwin Okokoro Abuename", "designation": "State Results Measurement Officer", "dept": "MERL", "co": "Tractrac", "approver": false, "user": "godwin.abuename" },
  { "name": "Godsfavour Nyoyoko", "designation": "Procurement / Special Duties / Fleet Manager", "dept": "Finance", "co": "Tractrac", "approver": true, "user": "godsfavour.nyoyoko" },
  { "name": "Ashey Matthew Osebi", "designation": "Program Associate/MERL", "dept": "MERL", "co": "Tractrac", "approver": false, "user": "ashey.osebi" },
  { "name": "Akwunte Amali", "designation": "Product Manager", "dept": "IT", "co": "Tractrac", "approver": false, "user": "akwunte.amali" },
  { "name": "Bridget Augustine", "designation": "Programs Associate", "dept": "IT", "co": "Tractrac", "approver": false, "user": "bridget.augustine" },
  { "name": "Isreal Ayeni", "designation": "State Finance Officer", "dept": "Finance", "co": "Tractrac", "approver": false, "user": "isreal.ayeni" },
  { "name": "Ajibola Afolashade", "designation": "Communication Associate", "dept": "Communications", "co": "Tractrac", "approver": false, "user": "ajibola.afolashade" },
  { "name": "Isaiah Ogede", "designation": "Communication Associate", "dept": "Communications", "co": "Tractrac", "approver": false, "user": "isaiah.ogede" },
  { "name": "Jemimah Justus Jennifer", "designation": "GEDSI Manager", "dept": "Programs", "co": "Tractrac", "approver": false, "user": "jemimah.jennifer" },
  { "name": "Betini Akarandut", "designation": "Backend Developer", "dept": "IT", "co": "Tractrac", "approver": false, "user": "betini.akarandut" },
  { "name": "Alice Asabe", "designation": "Office Assistant", "dept": "Operations", "co": "Tractrac", "approver": false, "user": "alice.asabe" },
  { "name": "Ekene Nnolum Bright", "designation": "Finance Lead", "dept": "Finance", "co": "Tractrac", "approver": true, "user": "ekene.bright" },
  { "name": "Emmanuel Olorunshola", "designation": "Flutter Developer", "dept": "IT", "co": "Tractrac", "approver": false, "user": "emmanuel.olorunshola" },
  { "name": "Peter Agbo", "designation": "Driver", "dept": "Operations", "co": "Tractrac", "approver": false, "user": "peter.agbo" },
  { "name": "Saleem Jibril", "designation": "Frontend Developer", "dept": "IT", "co": "Tractrac", "approver": false, "user": "saleem.jibril" },
  { "name": "Thankgod Onugwu", "designation": "Programs Associate Programs", "dept": "Programs", "co": "Tractrac", "approver": false, "user": "thankgod.onugwu" },
  { "name": "Faith Amanata", "designation": "Programs Associate Office of the CEO", "dept": "Office of the CEO /IT", "co": "Tractrac", "approver": false, "user": "faith.amanata" },
  { "name": "Samson Ugbegbor", "designation": "Training and Development Coordinator", "dept": "Programs", "co": "Tractrac", "approver": false, "user": "samson.ugbegbor" },
  { "name": "Salome Augustine", "designation": "State Office Assistant", "dept": "Operations", "co": "Tractrac", "approver": false, "user": "salome.augustine" },
  { "name": "Grace John", "designation": "Finance Assistant", "dept": "Finance", "co": "Tractrac", "approver": false, "user": "grace.john" },
  { "name": "Samuel Olanipekun Adebayo", "designation": "MERL Manager", "dept": "MERL", "co": "Tractrac", "approver": false, "user": "samuel.adebayo" },
  { "name": "Ameh Friday", "designation": "State Driver", "dept": "Operations", "co": "Tractrac", "approver": false, "user": "ameh.friday" },
  { "name": "Larai Tuma Sini", "designation": "Programs Associate", "dept": "Programs", "co": "Tractrac", "approver": false, "user": "larai.sini" },
  { "name": "Adeyinka Adelusi", "designation": "Programs Associate", "dept": "Programs", "co": "Tractrac", "approver": false, "user": "adeyinka.adelusi" },
  { "name": "Magdalene Osagie", "designation": "Programs Associate", "dept": "Programs", "co": "Tractrac", "approver": false, "user": "magdalene.osagie" },
  { "name": "Anthony Attoh", "designation": "Programs Associate", "dept": "Programs", "co": "Tractrac", "approver": false, "user": "anthony.attoh" },
  { "name": "Eunice Ademakinwa", "designation": "Programs Associate", "dept": "Programs", "co": "Tractrac", "approver": false, "user": "eunice.ademakinwa" },
  { "name": "Emmanuel Yahaya", "designation": "Programs Associate", "dept": "Programs", "co": "Tractrac", "approver": false, "user": "emmanuel.yahaya" },
  { "name": "Martha Peter", "designation": "Programs Associate", "dept": "Programs", "co": "Tractrac", "approver": false, "user": "martha.peter" },
  { "name": "Chidinma Ekwonu", "designation": "Programs Associate", "dept": "Programs", "co": "Tractrac", "approver": false, "user": "chidinma.ekwonu" },
  { "name": "Chika Nelson", "designation": "Policy Manager", "dept": "Programs", "co": "Tractrac", "approver": false, "user": "chika.nelson" },
  { "name": "Seun Odu", "designation": "Bespoke Delivery Manager", "dept": "Programs", "co": "Tractrac", "approver": false, "user": "seun.odu" },
  { "name": "Ikenna Nnorom", "designation": "Access to Finance", "dept": "Programs", "co": "Tractrac", "approver": false, "user": "ikenna.nnorom" },
  { "name": "Steve Thomas Onah", "designation": "Programs Associate", "dept": "Programs", "co": "Tractrac", "approver": false, "user": "steve.onah" },
  { "name": "Nelly Elochukwu", "designation": "Content Creator", "dept": "Communications", "co": "Tractrac", "approver": false, "user": "nelly.elochukwu" },
  { "name": "Muhammad Hashiru", "designation": "Kaduna Field Staff", "dept": "Programs", "co": "Tractrac", "approver": false, "user": "muhammad.hashiru" },
  { "name": "Daniel Abujah Yakubu", "designation": "Kaduna Field Staff", "dept": "Programs", "co": "Tractrac", "approver": false, "user": "daniel.yakubu" },
  { "name": "Adamu Abdullahi", "designation": "Kaduna Field Staff", "dept": "Programs", "co": "Tractrac", "approver": false, "user": "adamu.abdullahi" },
  { "name": "Jacob Ishaku", "designation": "Kaduna Field Staff", "dept": "Programs", "co": "Tractrac", "approver": false, "user": "jacob.ishaku" },
  { "name": "Nkechi Ibekwe", "designation": "Finance Manager", "dept": null, "co": "Ikore", "approver": true, "user": "nkechi.ibekwe" },
  { "name": "Gbenga Ariyo", "designation": null, "dept": null, "co": "Ikore", "approver": false, "user": "gbenga.ariyo" },
  { "name": "Theresa Abedo", "designation": null, "dept": null, "co": "Ikore", "approver": false, "user": "theresa.abedo" },
  { "name": "Abdulafeez Sanyaolu", "designation": null, "dept": null, "co": "Ikore", "approver": false, "user": "abdulafeez.sanyaolu" },
  { "name": "Ijeoma Ohuruogu", "designation": null, "dept": null, "co": "Ikore", "approver": false, "user": "ijeoma.ohuruogu" },
  { "name": "Ike Chinazam Ivy", "designation": null, "dept": null, "co": "Ikore", "approver": false, "user": "ike.ivy" },
  { "name": "Onuoha Nkemjika Onuoha", "designation": null, "dept": null, "co": "Ikore", "approver": false, "user": "onuoha.onuoha" },
  { "name": "Favour Jauro", "designation": null, "dept": null, "co": "Ikore", "approver": false, "user": "favour.jauro" },
  { "name": "Adiele Acha Emmanuel", "designation": null, "dept": null, "co": "Ikore", "approver": false, "user": "adiele.emmanuel" },
  { "name": "Umaru Yila Esther", "designation": null, "dept": null, "co": "Ikore", "approver": false, "user": "umaru.esther" },
  { "name": "Kathleen Okany", "designation": null, "dept": null, "co": "Ikore", "approver": true, "user": "kathleen.okany" },
  { "name": "Obiora Nwankwo", "designation": null, "dept": null, "co": "Ikore", "approver": false, "user": "obiora.nwankwo" },
  { "name": "Calista Geoffery", "designation": null, "dept": null, "co": "Ikore", "approver": false, "user": "calista.geoffery" },
  { "name": "Ikhariale Osesunme Verily", "designation": null, "dept": null, "co": "Ikore", "approver": false, "user": "ikhariale.verily" },
  { "name": "Benjamin Moses Oluwashayo", "designation": null, "dept": null, "co": "Ikore", "approver": false, "user": "benjamin.oluwashayo" },
  { "name": "Musa Tanko", "designation": null, "dept": null, "co": "Ikore", "approver": false, "user": "musa.tanko" },
  { "name": "Louis Ogbuneke", "designation": null, "dept": null, "co": "Ikore", "approver": false, "user": "louis.ogbuneke" },
  { "name": "Pelumi John", "designation": null, "dept": null, "co": "Ikore", "approver": false, "user": "pelumi.john" },
  { "name": "Samuel Emenogu", "designation": null, "dept": null, "co": "Ikore", "approver": false, "user": "samuel.emenogu" },
  { "name": "Hauwa Abubakar-kana", "designation": null, "dept": null, "co": "Ikore", "approver": false, "user": "hauwa.abubakarkana" },
  { "name": "Rebecca Adama", "designation": null, "dept": null, "co": "Ikore", "approver": false, "user": "rebecca.adama" },
  { "name": "Adekanye Kolade Oluwakunmi", "designation": null, "dept": null, "co": "Ikore", "approver": false, "user": "adekanye.oluwakunmi" },
  { "name": "Oyeniyi Seun Goodness", "designation": null, "dept": null, "co": "Ikore", "approver": false, "user": "oyeniyi.goodness" },
  { "name": "Rosiji David Ayokunmi", "designation": null, "dept": null, "co": "Ikore", "approver": false, "user": "rosiji.ayokunmi" },
  { "name": "Iro Kelechukwu Samuel", "designation": null, "dept": null, "co": "Ikore", "approver": false, "user": "iro.samuel" },
  { "name": "Toluwanimi Aremo", "designation": null, "dept": null, "co": "Ikore", "approver": false, "user": "toluwanimi.aremo" },
  { "name": "Janet Julius Wasinda", "designation": null, "dept": null, "co": "Ikore", "approver": false, "user": "janet.wasinda" },
  { "name": "Oyeh Oruaroghene Greatness", "designation": null, "dept": null, "co": "Ikore", "approver": false, "user": "oyeh.greatness" },
  { "name": "Adeniyi Adeyewande Christiana", "designation": null, "dept": null, "co": "Ikore", "approver": false, "user": "adeniyi.christiana" },
  { "name": "Evelyn Kattan Titus", "designation": null, "dept": null, "co": "Ikore", "approver": false, "user": "evelyn.titus" },
  { "name": "Patrick Olufemi Popoola", "designation": null, "dept": null, "co": "Ikore", "approver": false, "user": "patrick.popoola" },
  { "name": "Muhammad Kabara Kabir", "designation": null, "dept": null, "co": "Ikore", "approver": false, "user": "muhammad.kabir" },
  { "name": "Musa Mohammed Abubakar", "designation": null, "dept": null, "co": "Ikore", "approver": false, "user": "musa.abubakar" },
  { "name": "Maryam Goma", "designation": null, "dept": null, "co": "Ikore", "approver": false, "user": "maryam.goma" },
  { "name": "Ishaq Adamu Liman", "designation": null, "dept": null, "co": "Ikore", "approver": false, "user": "ishaq.liman" },
  { "name": "Kwarma Afiniki Naphtali", "designation": null, "dept": null, "co": "Ikore", "approver": false, "user": "kwarma.naphtali" },
  { "name": "Mikailu Umar", "designation": null, "dept": null, "co": "Ikore", "approver": false, "user": "mikailu.umar" },
  { "name": "Innocent Simon", "designation": null, "dept": null, "co": "Ikore", "approver": false, "user": "innocent.simon" },
  { "name": "Joel Manaram Kwale", "designation": null, "dept": null, "co": "Ikore", "approver": false, "user": "joel.kwale" },
  { "name": "Ibrahim Usman Liya", "designation": null, "dept": null, "co": "Ikore", "approver": false, "user": "ibrahim.liya" }
];

export const DRIVER_NAMES = ["Peter Agbo", "Ameh Friday", "Louis Ogbuneke"];
const ADMIN_NAME = "Godsfavour Nyoyoko";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [isLoaded, setIsLoaded] = useState(false);
  const [currentUser, setCurrentUser] = useState<Staff | null>(null);
  const [cars, setCars] = useState<Car[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [maintLogs, setMaintLogs] = useState<MaintenanceLog[]>([]);
  const [issueLogs, setIssueLogs] = useState<IssueLog[]>([]);
  const [nextBookingId, setNextBookingId] = useState(9);
  const [nextIssueId, setNextIssueId] = useState(3);
  const [nextCarId, setNextCarId] = useState(6);

  // Today Date details
  const [todayISO, setTodayISO] = useState("");
  const [todayFormatted, setTodayFormatted] = useState("");
  const [clockStr, setClockStr] = useState("—");

  // Toast state
  const [toastMsg, setToastMsg] = useState("");
  const [showToast, setShowToast] = useState(false);

  const showToastMsg = (msg: string) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2600);
  };

  // Sync dates
  useEffect(() => {
    const t = new Date();
    const iso = t.toISOString().slice(0, 10);
    setTodayISO(iso);
    setTodayFormatted(t.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" }));

    const tick = () => {
      setClockStr(new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  // Load from localStorage or seed
  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedUser = localStorage.getItem("fleet_currentUser");
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    } else {
      // If not logged in, redirect to signin
      router.push("/signin");
    }

    // Instantly load cached data to avoid empty screens
    try {
      const storedCars = localStorage.getItem("fleet_cars");
      if (storedCars) setCars(JSON.parse(storedCars));
      else setCars(initialCars);

      const storedBookings = localStorage.getItem("fleet_bookings");
      if (storedBookings) setBookings(JSON.parse(storedBookings));

      const storedFuel = localStorage.getItem("fleet_fuelLogs");
      if (storedFuel) setFuelLogs(JSON.parse(storedFuel));

      const storedMaint = localStorage.getItem("fleet_maintLogs");
      if (storedMaint) setMaintLogs(JSON.parse(storedMaint));

      const storedIssues = localStorage.getItem("fleet_issueLogs");
      if (storedIssues) setIssueLogs(JSON.parse(storedIssues));
    } catch (cacheErr) {
      console.error("Error reading initial cache", cacheErr);
      setCars(initialCars);
    }

    const fetchInitialData = async () => {
      try {
        const [carsRes, bookingsRes, fuelRes, maintRes, issuesRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/vehicles`),
          fetch(`${API_BASE_URL}/api/bookings`),
          fetch(`${API_BASE_URL}/api/fuel`),
          fetch(`${API_BASE_URL}/api/maintenance`),
          fetch(`${API_BASE_URL}/api/issues`)
        ]);
        if (carsRes.ok) {
          const carsData = await carsRes.json();
          setCars(carsData);
        }
        if (bookingsRes.ok) {
          const bookingsData = await bookingsRes.json();
          setBookings(bookingsData);
        }
        if (fuelRes.ok) {
          const fuelData = await fuelRes.json();
          setFuelLogs(fuelData);
        }
        if (maintRes.ok) {
          const maintData = await maintRes.json();
          setMaintLogs(maintData);
        }
        if (issuesRes.ok) {
          const issuesData = await issuesRes.json();
          setIssueLogs(issuesData);
        }
      } catch (err) {
        console.error("Failed to fetch initial data", err);
      }
    };
    fetchInitialData();

    setIsLoaded(true);
  }, [router]);

  // Sync to local storage
  useEffect(() => {
    if (!isLoaded) return;
    if (currentUser) localStorage.setItem("fleet_currentUser", JSON.stringify(currentUser));
    else localStorage.removeItem("fleet_currentUser");
  }, [currentUser, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    if (cars.length > 0) localStorage.setItem("fleet_cars", JSON.stringify(cars));
  }, [cars, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    if (bookings.length > 0) localStorage.setItem("fleet_bookings", JSON.stringify(bookings));
  }, [bookings, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    if (fuelLogs.length > 0) localStorage.setItem("fleet_fuelLogs", JSON.stringify(fuelLogs));
  }, [fuelLogs, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    if (maintLogs.length > 0) localStorage.setItem("fleet_maintLogs", JSON.stringify(maintLogs));
  }, [maintLogs, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    if (issueLogs.length > 0) localStorage.setItem("fleet_issueLogs", JSON.stringify(issueLogs));
  }, [issueLogs, isLoaded]);

  const handleSignOut = () => {
    setCurrentUser(null);
    router.push("/signin");
  };

  const isAdminUser = currentUser?.name === ADMIN_NAME;
  const isDriverUser = currentUser ? DRIVER_NAMES.includes(currentUser.name) : false;

  const pendingApprovals = bookings.filter((b) => b.status === "pending").length;

  return (
    <FleetContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        cars,
        setCars,
        bookings,
        setBookings,
        fuelLogs,
        setFuelLogs,
        maintLogs,
        setMaintLogs,
        issueLogs,
        setIssueLogs,
        nextBookingId,
        setNextBookingId,
        nextIssueId,
        setNextIssueId,
        nextCarId,
        setNextCarId,
        showToastMsg
      }}
    >
      <div className="dashboard-container">
        {/* SIDEBAR */}
        <aside className="sidebar" style={{ background: "#F9FAFB", colorScheme: "light" }}>
          <div>
            <div style={{ padding: "0 12px", marginBottom: "28px" }}>
              <div style={{ fontSize: "0.74rem", fontWeight: 500, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Shared Operations
              </div>
              <div style={{ fontSize: "1.15rem", fontWeight: 500, color: "#1F2937", marginTop: "2px", letterSpacing: "-0.01em" }}>
                Motorpool
              </div>
            </div>

            {/* Navigation links */}
            <nav style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <Link href="/" className={`sidebar-nav-item ${pathname === "/" ? "active" : ""}`}>
                <span className="sidebar-nav-link-content">
                  <IconLayoutBoard size={22} stroke={1.5} />
                  <span>Fleet board</span>
                </span>
              </Link>

              <Link href="/book" className={`sidebar-nav-item ${pathname === "/book" ? "active" : ""}`}>
                <span className="sidebar-nav-link-content">
                  <IconCar size={22} stroke={1.5} />
                  <span>Book a car</span>
                </span>
              </Link>

              {(currentUser?.approver || isAdminUser) && (
                <Link href="/approvals" className={`sidebar-nav-item ${pathname === "/approvals" ? "active" : ""}`}>
                  <span className="sidebar-nav-link-content">
                    <IconCircleCheck size={22} stroke={1.5} />
                    <span>Approvals</span>
                  </span>
                  {pendingApprovals > 0 && (
                    <span className="sidebar-badge">
                      {pendingApprovals}
                    </span>
                  )}
                </Link>
              )}

              {(isDriverUser || isAdminUser) && (
                <Link href="/fuel" className={`sidebar-nav-item ${pathname === "/fuel" ? "active" : ""}`}>
                  <span className="sidebar-nav-link-content">
                    <IconGasStation size={22} stroke={1.5} />
                    <span>Fuel log</span>
                  </span>
                </Link>
              )}

              {(isDriverUser || isAdminUser) && (
                <Link href="/drivers" className={`sidebar-nav-item ${pathname === "/drivers" ? "active" : ""}`}>
                  <span className="sidebar-nav-link-content">
                    <IconSteeringWheel size={22} stroke={1.5} />
                    <span>Drivers</span>
                  </span>
                </Link>
              )}

              {(isDriverUser || isAdminUser) && (
                <Link href="/maintenance" className={`sidebar-nav-item ${pathname === "/maintenance" ? "active" : ""}`}>
                  <span className="sidebar-nav-link-content">
                    <IconSettings size={22} stroke={1.5} />
                    <span>Maintenance</span>
                  </span>
                </Link>
              )}

              {isAdminUser && (
                <Link href="/vehicles" className={`sidebar-nav-item ${pathname === "/vehicles" ? "active" : ""}`}>
                  <span className="sidebar-nav-link-content">
                    <IconList size={22} stroke={1.5} />
                    <span>Vehicles</span>
                  </span>
                </Link>
              )}

              <Link href="/staff" className={`sidebar-nav-item ${pathname === "/staff" ? "active" : ""}`}>
                <span className="sidebar-nav-link-content">
                  <IconUsers size={22} stroke={1.5} />
                  <span>Staff</span>
                </span>
              </Link>

              <Link href="/locations" className={`sidebar-nav-item ${pathname === "/locations" ? "active" : ""}`}>
                <span className="sidebar-nav-link-content">
                  <IconMapPin size={22} stroke={1.5} />
                  <span>Locations</span>
                </span>
              </Link>
            </nav>
          </div>

          {/* Bottom Profile and Sign Out */}
          {currentUser && (
            <div
              style={{
                borderTop: "1.5px solid #F3F4F6",
                paddingTop: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "12px"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "0 8px" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    background: currentUser.co === "Tractrac" ? "var(--tt-soft)" : "var(--ik-soft)",
                    color: currentUser.co === "Tractrac" ? "var(--tt-dark)" : "var(--ik-dark)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.95rem",
                    fontWeight: 500
                  }}
                >
                  {currentUser.name[0]}
                </div>
                <div style={{ overflow: "hidden" }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 500, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {currentUser.name}
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "#6B7280", marginTop: "1px" }}>
                    {currentUser.co === "Tractrac" ? "TracTrac" : "Ikore"}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSignOut}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  background: "transparent",
                  border: "none",
                  borderRadius: "8px",
                  padding: "10px 12px",
                  fontSize: "0.85rem",
                  color: "#6B7280",
                  cursor: "pointer",
                  textAlign: "left",
                  outline: "none",
                  transition: "all 0.15s"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#FEF2F2";
                  e.currentTarget.style.color = "#DC2626";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "#6B7280";
                }}
              >
                <IconLogout size={18} stroke={1.5} />
                <span>Sign out</span>
              </button>
            </div>
          )}
        </aside>

        {/* MAIN CONTENT AREA */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#FFFFFF" }}>
          {/* Header Row */}
          <header
            style={{
              padding: "24px 40px",
              borderBottom: "1.5px solid #F3F4F6",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "#FFFFFF"
            }}
          >
            <div>
              <div style={{ fontSize: "0.78rem", fontWeight: 500, color: "#9CA3AF" }}>
                Booking window 08:00 – 22:00
              </div>
              <h2 style={{ fontSize: "1.3rem", fontWeight: 500, color: "#111827", marginTop: "2px", letterSpacing: "-0.01em" }}>
                {pathname === "/"
                  ? "Fleet board"
                  : pathname === "/book"
                    ? "Book a car"
                    : pathname === "/approvals"
                      ? "Approvals"
                      : pathname === "/fuel"
                        ? "Fuel log"
                        : pathname === "/drivers"
                          ? "Drivers"
                          : pathname === "/maintenance"
                            ? "Maintenance"
                            : pathname === "/vehicles"
                              ? "Vehicles"
                              : pathname === "/staff"
                                ? "Staff directory"
                                : pathname === "/locations"
                                  ? "Locations"
                                  : "Dashboard"}
              </h2>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ background: "#F3F4F6", color: "#4B5563", fontSize: "0.8rem", fontWeight: 500, padding: "6px 12px", borderRadius: "20px" }}>
                {todayFormatted}
              </div>
              <div style={{ background: "#F3F4F6", color: "#4B5563", fontSize: "0.8rem", fontWeight: 500, padding: "6px 12px", borderRadius: "20px" }}>
                {clockStr}
              </div>
            </div>
          </header>

          {/* Child Page Container */}
          <main style={{ flex: 1, padding: "40px", overflowY: "auto" }}>
            {children}
          </main>
        </div>

        <div className={`toast ${showToast ? "show" : ""}`}>{toastMsg}</div>
      </div>
    </FleetContext.Provider>
  );
}
