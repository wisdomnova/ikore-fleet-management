"use client";

import React, { useState, useEffect } from "react";

// ============================== TYPES ==============================
interface Staff {
  name: string;
  designation: string | null;
  dept: string | null;
  co: "Tractrac" | "Ikore";
  approver: boolean;
  user: string;
}

interface Car {
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

interface Booking {
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

interface FuelLog {
  carId: number;
  when: string;
  driver: string;
  litres: number;
  cost: number;
  level: number;
  odo: number;
  station: string;
}

interface Driver {
  name: string;
  co: "Tractrac" | "Ikore";
  phone: string;
  licence: string;
  licExp: string;
  years: number;
  base: string;
}

interface MaintenanceLog {
  carId: number;
  date: string;
  type: string;
  odo: number;
  cost: number;
  workshop: string;
  notes: string;
}

interface IssueLog {
  id: number;
  carId: number;
  date: string;
  driver: string;
  severity: string;
  desc: string;
  status: "Open" | "Resolved";
  resolvedBy?: string;
}

// ============================== STATIC SEED DATA ==============================
const STAFF: Staff[] = [
  {"name": "Godson Ohuruogu", "designation": "MD", "dept": "Office of the CEO", "co": "Tractrac", "approver": true, "user": "godson.ohuruogu"},
  {"name": "Stephen Aguebor", "designation": "Project Lead", "dept": "Programs", "co": "Tractrac", "approver": true, "user": "stephen.aguebor"},
  {"name": "Adedolapo Olupona .E", "designation": "Human Resources Manager", "dept": "Operations", "co": "Tractrac", "approver": false, "user": "adedolapo.e"},
  {"name": "Ojoma Okwute", "designation": "Operations Manager", "dept": "Operations", "co": "Tractrac", "approver": false, "user": "ojoma.okwute"},
  {"name": "John Olanrewaju", "designation": "Engineering Lead", "dept": "Programs", "co": "Tractrac", "approver": false, "user": "john.olanrewaju"},
  {"name": "Monday Isah", "designation": "State Team Lead", "dept": "Programs", "co": "Tractrac", "approver": false, "user": "monday.isah"},
  {"name": "Alero Otis", "designation": "Partnership", "dept": "Partnership", "co": "Tractrac", "approver": false, "user": "alero.otis"},
  {"name": "Isreal Olatunde", "designation": "DevOps Engr", "dept": "IT", "co": "Tractrac", "approver": false, "user": "isreal.olatunde"},
  {"name": "Mercy Edoyugbo", "designation": "Product Manager", "dept": "IT", "co": "Tractrac", "approver": false, "user": "mercy.edoyugbo"},
  {"name": "Magaret Thomas", "designation": "State Ops/Admin", "dept": "Operations", "co": "Tractrac", "approver": false, "user": "magaret.thomas"},
  {"name": "Atuonwu Adanna", "designation": "Communication Manager", "dept": "Communications", "co": "Tractrac", "approver": false, "user": "atuonwu.adanna"},
  {"name": "Monday Enejoh", "designation": "State Mobiliser", "dept": "Programs", "co": "Tractrac", "approver": false, "user": "monday.enejoh"},
  {"name": "Godwin Okokoro Abuename", "designation": "State Results Measurement Officer", "dept": "MERL", "co": "Tractrac", "approver": false, "user": "godwin.abuename"},
  {"name": "Godsfavour Nyoyoko", "designation": "Procurement / Special Duties / Fleet Manager", "dept": "Finance", "co": "Tractrac", "approver": true, "user": "godsfavour.nyoyoko"},
  {"name": "Ashey Matthew Osebi", "designation": "Program Associate/MERL", "dept": "MERL", "co": "Tractrac", "approver": false, "user": "ashey.osebi"},
  {"name": "Akwunte Amali", "designation": "Product Manager", "dept": "IT", "co": "Tractrac", "approver": false, "user": "akwunte.amali"},
  {"name": "Bridget Augustine", "designation": "Programs Associate", "dept": "IT", "co": "Tractrac", "approver": false, "user": "bridget.augustine"},
  {"name": "Isreal Ayeni", "designation": "State Finance Officer", "dept": "Finance", "co": "Tractrac", "approver": false, "user": "isreal.ayeni"},
  {"name": "Ajibola Afolashade", "designation": "Communication Associate", "dept": "Communications", "co": "Tractrac", "approver": false, "user": "ajibola.afolashade"},
  {"name": "Isaiah Ogede", "designation": "Communication Associate", "dept": "Communications", "co": "Tractrac", "approver": false, "user": "isaiah.ogede"},
  {"name": "Jemimah Justus Jennifer", "designation": "GEDSI Manager", "dept": "Programs", "co": "Tractrac", "approver": false, "user": "jemimah.jennifer"},
  {"name": "Betini Akarandut", "designation": "Backend Developer", "dept": "IT", "co": "Tractrac", "approver": false, "user": "betini.akarandut"},
  {"name": "Alice Asabe", "designation": "Office Assistant", "dept": "Operations", "co": "Tractrac", "approver": false, "user": "alice.asabe"},
  {"name": "Ekene Nnolum Bright", "designation": "Finance Lead", "dept": "Finance", "co": "Tractrac", "approver": true, "user": "ekene.bright"},
  {"name": "Emmanuel Olorunshola", "designation": "Flutter Developer", "dept": "IT", "co": "Tractrac", "approver": false, "user": "emmanuel.olorunshola"},
  {"name": "Peter Agbo", "designation": "Driver", "dept": "Operations", "co": "Tractrac", "approver": false, "user": "peter.agbo"},
  {"name": "Saleem Jibril", "designation": "Frontend Developer", "dept": "IT", "co": "Tractrac", "approver": false, "user": "saleem.jibril"},
  {"name": "Thankgod Onugwu", "designation": "Programs Associate Programs", "dept": "Programs", "co": "Tractrac", "approver": false, "user": "thankgod.onugwu"},
  {"name": "Faith Amanata", "designation": "Programs Associate Office of the CEO", "dept": "Office of the CEO /IT", "co": "Tractrac", "approver": false, "user": "faith.amanata"},
  {"name": "Samson Ugbegbor", "designation": "Training and Development Coordinator", "dept": "Programs", "co": "Tractrac", "approver": false, "user": "samson.ugbegbor"},
  {"name": "Salome Augustine", "designation": "State Office Assistant", "dept": "Operations", "co": "Tractrac", "approver": false, "user": "salome.augustine"},
  {"name": "Grace John", "designation": "Finance Assistant", "dept": "Finance", "co": "Tractrac", "approver": false, "user": "grace.john"},
  {"name": "Samuel Olanipekun Adebayo", "designation": "MERL Manager", "dept": "MERL", "co": "Tractrac", "approver": false, "user": "samuel.adebayo"},
  {"name": "Ameh Friday", "designation": "State Driver", "dept": "Operations", "co": "Tractrac", "approver": false, "user": "ameh.friday"},
  {"name": "Larai Tuma Sini", "designation": "Programs Associate", "dept": "Programs", "co": "Tractrac", "approver": false, "user": "larai.sini"},
  {"name": "Adeyinka Adelusi", "designation": "Programs Associate", "dept": "Programs", "co": "Tractrac", "approver": false, "user": "adeyinka.adelusi"},
  {"name": "Magdalene Osagie", "designation": "Programs Associate", "dept": "Programs", "co": "Tractrac", "approver": false, "user": "magdalene.osagie"},
  {"name": "Anthony Attoh", "designation": "Programs Associate", "dept": "Programs", "co": "Tractrac", "approver": false, "user": "anthony.attoh"},
  {"name": "Eunice Ademakinwa", "designation": "Programs Associate", "dept": "Programs", "co": "Tractrac", "approver": false, "user": "eunice.ademakinwa"},
  {"name": "Emmanuel Yahaya", "designation": "Programs Associate", "dept": "Programs", "co": "Tractrac", "approver": false, "user": "emmanuel.yahaya"},
  {"name": "Martha Peter", "designation": "Programs Associate", "dept": "Programs", "co": "Tractrac", "approver": false, "user": "martha.peter"},
  {"name": "Chidinma Ekwonu", "designation": "Programs Associate", "dept": "Programs", "co": "Tractrac", "approver": false, "user": "chidinma.ekwonu"},
  {"name": "Chika Nelson", "designation": "Policy Manager", "dept": "Programs", "co": "Tractrac", "approver": false, "user": "chika.nelson"},
  {"name": "Seun Odu", "designation": "Bespoke Delivery Manager", "dept": "Programs", "co": "Tractrac", "approver": false, "user": "seun.odu"},
  {"name": "Ikenna Nnorom", "designation": "Access to Finance", "dept": "Programs", "co": "Tractrac", "approver": false, "user": "ikenna.nnorom"},
  {"name": "Steve Thomas Onah", "designation": "Programs Associate", "dept": "Programs", "co": "Tractrac", "approver": false, "user": "steve.onah"},
  {"name": "Nelly Elochukwu", "designation": "Content Creator", "dept": "Communications", "co": "Tractrac", "approver": false, "user": "nelly.elochukwu"},
  {"name": "Muhammad Hashiru", "designation": "Kaduna Field Staff", "dept": "Programs", "co": "Tractrac", "approver": false, "user": "muhammad.hashiru"},
  {"name": "Daniel Abujah Yakubu", "designation": "Kaduna Field Staff", "dept": "Programs", "co": "Tractrac", "approver": false, "user": "daniel.yakubu"},
  {"name": "Adamu Abdullahi", "designation": "Kaduna Field Staff", "dept": "Programs", "co": "Tractrac", "approver": false, "user": "adamu.abdullahi"},
  {"name": "Jacob Ishaku", "designation": "Kaduna Field Staff", "dept": "Programs", "co": "Tractrac", "approver": false, "user": "jacob.ishaku"},
  {"name": "Nkechi Ibekwe", "designation": "Finance Manager", "dept": null, "co": "Ikore", "approver": true, "user": "nkechi.ibekwe"},
  {"name": "Gbenga Ariyo", "designation": null, "dept": null, "co": "Ikore", "approver": false, "user": "gbenga.ariyo"},
  {"name": "Theresa Abedo", "designation": null, "dept": null, "co": "Ikore", "approver": false, "user": "theresa.abedo"},
  {"name": "Abdulafeez Sanyaolu", "designation": null, "dept": null, "co": "Ikore", "approver": false, "user": "abdulafeez.sanyaolu"},
  {"name": "Ijeoma Ohuruogu", "designation": null, "dept": null, "co": "Ikore", "approver": false, "user": "ijeoma.ohuruogu"},
  {"name": "Ike Chinazam Ivy", "designation": null, "dept": null, "co": "Ikore", "approver": false, "user": "ike.ivy"},
  {"name": "Onuoha Nkemjika Onuoha", "designation": null, "dept": null, "co": "Ikore", "approver": false, "user": "onuoha.onuoha"},
  {"name": "Favour Jauro", "designation": null, "dept": null, "co": "Ikore", "approver": false, "user": "favour.jauro"},
  {"name": "Adiele Acha Emmanuel", "designation": null, "dept": null, "co": "Ikore", "approver": false, "user": "adiele.emmanuel"},
  {"name": "Umaru Yila Esther", "designation": null, "dept": null, "co": "Ikore", "approver": false, "user": "umaru.esther"},
  {"name": "Kathleen Okany", "designation": null, "dept": null, "co": "Ikore", "approver": true, "user": "kathleen.okany"},
  {"name": "Obiora Nwankwo", "designation": null, "dept": null, "co": "Ikore", "approver": false, "user": "obiora.nwankwo"},
  {"name": "Calista Geoffery", "designation": null, "dept": null, "co": "Ikore", "approver": false, "user": "calista.geoffery"},
  {"name": "Ikhariale Osesunme Verily", "designation": null, "dept": null, "co": "Ikore", "approver": false, "user": "ikhariale.verily"},
  {"name": "Benjamin Moses Oluwashayo", "designation": null, "dept": null, "co": "Ikore", "approver": false, "user": "benjamin.oluwashayo"},
  {"name": "Musa Tanko", "designation": null, "dept": null, "co": "Ikore", "approver": false, "user": "musa.tanko"},
  {"name": "Louis Ogbuneke", "designation": null, "dept": null, "co": "Ikore", "approver": false, "user": "louis.ogbuneke"},
  {"name": "Pelumi John", "designation": null, "dept": null, "co": "Ikore", "approver": false, "user": "pelumi.john"},
  {"name": "Samuel Emenogu", "designation": null, "dept": null, "co": "Ikore", "approver": false, "user": "samuel.emenogu"},
  {"name": "Hauwa Abubakar-kana", "designation": null, "dept": null, "co": "Ikore", "approver": false, "user": "hauwa.abubakarkana"},
  {"name": "Rebecca Adama", "designation": null, "dept": null, "co": "Ikore", "approver": false, "user": "rebecca.adama"},
  {"name": "Adekanye Kolade Oluwakunmi", "designation": null, "dept": null, "co": "Ikore", "approver": false, "user": "adekanye.oluwakunmi"},
  {"name": "Oyeniyi Seun Goodness", "designation": null, "dept": null, "co": "Ikore", "approver": false, "user": "oyeniyi.goodness"},
  {"name": "Rosiji David Ayokunmi", "designation": null, "dept": null, "co": "Ikore", "approver": false, "user": "rosiji.ayokunmi"},
  {"name": "Iro Kelechukwu Samuel", "designation": null, "dept": null, "co": "Ikore", "approver": false, "user": "iro.samuel"},
  {"name": "Toluwanimi Aremo", "designation": null, "dept": null, "co": "Ikore", "approver": false, "user": "toluwanimi.aremo"},
  {"name": "Janet Julius Wasinda", "designation": null, "dept": null, "co": "Ikore", "approver": false, "user": "janet.wasinda"},
  {"name": "Oyeh Oruaroghene Greatness", "designation": null, "dept": null, "co": "Ikore", "approver": false, "user": "oyeh.greatness"},
  {"name": "Adeniyi Adeyewande Christiana", "designation": null, "dept": null, "co": "Ikore", "approver": false, "user": "adeniyi.christiana"},
  {"name": "Evelyn Kattan Titus", "designation": null, "dept": null, "co": "Ikore", "approver": false, "user": "evelyn.titus"},
  {"name": "Patrick Olufemi Popoola", "designation": null, "dept": null, "co": "Ikore", "approver": false, "user": "patrick.popoola"},
  {"name": "Muhammad Kabara Kabir", "designation": null, "dept": null, "co": "Ikore", "approver": false, "user": "muhammad.kabir"},
  {"name": "Musa Mohammed Abubakar", "designation": null, "dept": null, "co": "Ikore", "approver": false, "user": "musa.abubakar"},
  {"name": "Maryam Goma", "designation": null, "dept": null, "co": "Ikore", "approver": false, "user": "maryam.goma"},
  {"name": "Ishaq Adamu Liman", "designation": null, "dept": null, "co": "Ikore", "approver": false, "user": "ishaq.liman"},
  {"name": "Kwarma Afiniki Naphtali", "designation": null, "dept": null, "co": "Ikore", "approver": false, "user": "kwarma.naphtali"},
  {"name": "Mikailu Umar", "designation": null, "dept": null, "co": "Ikore", "approver": false, "user": "mikailu.umar"},
  {"name": "Innocent Simon", "designation": null, "dept": null, "co": "Ikore", "approver": false, "user": "innocent.simon"},
  {"name": "Joel Manaram Kwale", "designation": null, "dept": null, "co": "Ikore", "approver": false, "user": "joel.kwale"},
  {"name": "Ibrahim Usman Liya", "designation": null, "dept": null, "co": "Ikore", "approver": false, "user": "ibrahim.liya"}
];

const ADMIN_NAME = "Godsfavour Nyoyoko";
const DRIVER_NAMES = ["Peter Agbo", "Ameh Friday", "Louis Ogbuneke"];
const DEFAULT_PW = "fleet123";
const SERVICE_INTERVAL = 5000;
const DAY_START = 8;
const DAY_END = 22;

const MAINT_CATEGORIES = [
  "Routine servicing",
  "Brake pads change",
  "Tyre replacement",
  "Wheel alignment & balancing",
  "Suspension work",
  "Engine repair",
  "Electrical / battery",
  "Air conditioning",
  "Bodywork / panel beating",
  "Other repair"
];

const initialCars: Car[] = [
  {id:1, plate:"TBD",        name:"JAC T9",            co:"Tractrac", fuel:82, odo:24230, loc:"Head office, Utako",  locT:"07:42", shop:false},
  {id:2, plate:"TBD",        name:"Toyota Highlander", co:"Tractrac", fuel:57, odo:60018, loc:"Garki Area 11",       locT:"08:20", shop:false},
  {id:3, plate:"TBD",        name:"Toyota Hiace Bus",  co:"Tractrac", fuel:90, odo:48122, loc:"Idu Industrial Area", locT:"09:35", shop:false},
  {id:4, plate:"TBD",        name:"Toyota Sienna",     co:"Tractrac", fuel:35, odo:71880, loc:"Head office, Utako",  locT:"07:30", shop:false},
  {id:5, plate:"YAB 706EZ",  name:"Toyota Sienna",     co:"Ikore",    fuel:66, odo:52630, loc:"Ikore office",        locT:"08:48", shop:false, papers:"Papers renewal — March 2027"},
];

const DRIVERS: Driver[] = [
  {name:"Peter Agbo",     co:"Tractrac", phone:"0805 771 0284", licence:"ABJ 11-40157 BB7", licExp:"2026-09-22", years:5,  base:"Head office, Utako"},
  {name:"Ameh Friday",    co:"Tractrac", phone:"0812 903 5541", licence:"KUJ 07-63920 CC1", licExp:"2028-01-08", years:11, base:"State office"},
  {name:"Louis Ogbuneke", co:"Ikore",    phone:"0803 214 6690", licence:"FKJ 04-88213 AA2", licExp:"2027-03-15", years:8,  base:"Ikore office"},
];

const ABUJA_SPOTS = [
  "Head office, Utako",
  "Garki Area 11",
  "Wuse II",
  "Maitama",
  "Idu Industrial Area",
  "Airport Road",
  "Gwagwalada",
  "Kubwa",
  "Central Area",
  "Workshop, Idu"
];

// Helper to convert HH:MM to minutes
const mins = (t: string): number => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

// Nigeria formatting helper
const fmtN = (n: number | string): string => {
  return Number(n).toLocaleString("en-NG");
};

export default function Home() {
  const [todayISO, setTodayISO] = useState("");
  const [todayFormatted, setTodayFormatted] = useState("");

  // DB States
  const [cars, setCars] = useState<Car[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [maintLogs, setMaintLogs] = useState<MaintenanceLog[]>([]);
  const [issueLogs, setIssueLogs] = useState<IssueLog[]>([]);
  const [nextBookingId, setNextBookingId] = useState(9);
  const [nextIssueId, setNextIssueId] = useState(3);
  const [nextCarId, setNextCarId] = useState(6);

  // App UI state
  const [currentUser, setCurrentUser] = useState<Staff | null>(null);
  const [pickedCo, setPickedCo] = useState<"Tractrac" | "Ikore" | null>(null);
  const [loginStaff, setLoginStaff] = useState("");
  const [loginPw, setLoginPw] = useState("");
  const [loginMsg, setLoginMsg] = useState({ text: "", type: "" });

  const [activeTab, setActiveTab] = useState("board");
  const [filter, setFilter] = useState("all");
  const [clockStr, setClockStr] = useState("—");

  // Booking form state
  const [bkCar, setBkCar] = useState(1);
  const [bkDate, setBkDate] = useState("");
  const [bkStart, setBkStart] = useState("");
  const [bkEnd, setBkEnd] = useState("");
  const [bkManager, setBkManager] = useState("");
  const [bkDest, setBkDest] = useState("");
  const [bkDriver, setBkDriver] = useState("Assign any available driver");
  const [bkPurpose, setBkPurpose] = useState("");
  const [bookMsg, setBookMsg] = useState({ text: "", type: "" });

  // Fuel form state
  const [flCar, setFlCar] = useState(1);
  const [flDriver, setFlDriver] = useState("");
  const [flLitres, setFlLitres] = useState("");
  const [flCost, setFlCost] = useState("");
  const [flLevel, setFlLevel] = useState(75);
  const [flOdo, setFlOdo] = useState("");
  const [flStation, setFlStation] = useState("");
  const [fuelMsg, setFuelMsg] = useState({ text: "", type: "" });

  // Maintenance form state
  const [isCar, setIsCar] = useState(1);
  const [isSev, setIsSev] = useState("Low — note for next service");
  const [isDesc, setIsDesc] = useState("");
  const [issueMsg, setIssueMsg] = useState({ text: "", type: "" });

  const [svCar, setSvCar] = useState(1);
  const [svType, setSvType] = useState("Routine servicing");
  const [svOdo, setSvOdo] = useState("");
  const [svCost, setSvCost] = useState("");
  const [svWorkshop, setSvWorkshop] = useState("");
  const [svNotes, setSvNotes] = useState("");
  const [svcMsg, setSvcMsg] = useState({ text: "", type: "" });

  const [svcFilter, setSvcFilter] = useState("all");

  // Vehicle add form state
  const [nvName, setNvName] = useState("");
  const [nvPlate, setNvPlate] = useState("");
  const [nvCo, setNvCo] = useState<"Tractrac" | "Ikore">("Tractrac");
  const [nvOdo, setNvOdo] = useState("");
  const [nvPapers, setNvPapers] = useState("");
  const [vehAddMsg, setVehAddMsg] = useState({ text: "", type: "" });

  // Staff list filters
  const [staffFilter, setStaffFilter] = useState("all");
  const [staffQuery, setStaffQuery] = useState("");

  // Toast
  const [toastMsg, setToastMsg] = useState("");
  const [showToast, setShowToast] = useState(false);

  // Driver dynamic finishing odometer input state
  const [mileInputs, setMileInputs] = useState<Record<number, string>>({});

  // Initialize dates and load localStorage
  useEffect(() => {
    const t = new Date();
    const iso = t.toISOString().slice(0, 10);
    setTodayISO(iso);
    setBkDate(iso);
    setTodayFormatted(t.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" }));

    // Clock
    const tick = () => {
      setClockStr(new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }));
    };
    tick();
    const interval = setInterval(tick, 1000);

    // Initial Data loading from local storage
    if (typeof window !== "undefined") {
      const storedCars = localStorage.getItem("fleet_cars");
      const storedBookings = localStorage.getItem("fleet_bookings");
      const storedFuel = localStorage.getItem("fleet_fuelLogs");
      const storedMaint = localStorage.getItem("fleet_maintLogs");
      const storedIssues = localStorage.getItem("fleet_issueLogs");

      if (storedCars) setCars(JSON.parse(storedCars));
      else setCars(initialCars);

      if (storedBookings) {
        setBookings(JSON.parse(storedBookings));
      } else {
        const initialBookings: Booking[] = [
          {id:1, carId:1, date:iso, start:"09:00", end:"12:30", staff:"Godwin Okokoro Abuename", dept:"MERL", co:"Tractrac", dest:"Gwagwalada", driver:"Peter Agbo", purpose:"Field monitoring visit", manager:"Stephen Aguebor", status:"approved"},
          {id:2, carId:2, date:iso, start:"10:00", end:"11:00", staff:"Atuonwu Adanna", dept:"Communications", co:"Tractrac", dest:"NTA Studios", driver:"Bolt ride (arranged)", purpose:"Media interview", manager:"Godson Ohuruogu", status:"approved", mode:"Bolt", adjustedBy:"Godsfavour Nyoyoko", cost:4500, receiptName:"bolt-receipt-06aug.jpg"},
          {id:3, carId:3, date:iso, start:"08:30", end:"16:00", staff:"Gbenga Ariyo", dept:"—", co:"Ikore", dest:"Nasarawa", driver:"Louis Ogbuneke", purpose:"Cooperative onboarding", manager:"Nkechi Ibekwe", status:"approved"},
          {id:4, carId:2, date:iso, start:"13:00", end:"15:30", staff:"Grace John", dept:"Finance", co:"Tractrac", dest:"CBN, Central Area", driver:"Peter Agbo", purpose:"Bank documentation", manager:"Ekene Nnolum Bright", status:"approved"},
          {id:5, carId:4, date:iso, start:"09:00", end:"18:00", staff:"Isreal Olatunde", dept:"IT", co:"Tractrac", dest:"Idu server site", driver:"Self-drive (approved staff)", purpose:"Server maintenance", manager:"Godsfavour Nyoyoko", status:"approved"},
          {id:6, carId:5, date:iso, start:"14:00", end:"20:00", staff:"Theresa Abedo", dept:"—", co:"Ikore", dest:"Airport pickup", driver:"Louis Ogbuneke", purpose:"Guest pickup", manager:"Kathleen Okany", status:"approved"},
          {id:7, carId:2, date:iso, start:"16:00", end:"18:00", staff:"Isaiah Ogede", dept:"Communications", co:"Tractrac", dest:"Transcorp Hilton", driver:"Ameh Friday", purpose:"Partner event coverage", manager:"Godson Ohuruogu", status:"pending"},
          {id:8, carId:1, date:iso, start:"16:30", end:"19:00", staff:"Favour Jauro", dept:"—", co:"Ikore", dest:"Kuje cooperative site", driver:"Ameh Friday", purpose:"Data collection follow-up", manager:"Nkechi Ibekwe", status:"pending"}
        ];
        setBookings(initialBookings);
      }

      if (storedFuel) setFuelLogs(JSON.parse(storedFuel));
      else setFuelLogs([
        {carId:3, when:"Today 07:55", driver:"Peter Agbo", litres:45, cost:42750, level:90, odo:48122, station:"NNPC, Airport Road"},
        {carId:5, when:"Yesterday 17:40", driver:"Louis Ogbuneke", litres:38, cost:36100, level:66, odo:52630, station:"TotalEnergies, Wuse II"}
      ]);

      if (storedMaint) setMaintLogs(JSON.parse(storedMaint));
      else setMaintLogs([
        {carId:1, date:"2026-07-02", type:"Routine servicing", odo:21000, cost:78000, workshop:"Fleet workshop, Idu", notes:"Full routine service"},
        {carId:2, date:"2026-05-18", type:"Routine servicing", odo:55500, cost:80000, workshop:"Fleet workshop, Idu", notes:"Oil and filters"},
        {carId:2, date:"2026-06-10", type:"Brake pads change", odo:57100, cost:64000, workshop:"Fleet workshop, Idu", notes:"Front pads replaced"},
        {carId:3, date:"2026-07-20", type:"Routine servicing", odo:46800, cost:76500, workshop:"Fleet workshop, Idu", notes:"Routine + coolant top-up"},
        {carId:4, date:"2026-04-28", type:"Tyre replacement", odo:68000, cost:210000, workshop:"Tyre Centre, Wuse", notes:"Four new tyres"},
        {carId:4, date:"2026-04-29", type:"Wheel alignment & balancing", odo:68010, cost:18000, workshop:"Tyre Centre, Wuse", notes:"After tyre change"},
        {carId:5, date:"2026-06-22", type:"Air conditioning", odo:50900, cost:55000, workshop:"AC Specialist, Garki", notes:"Regas and compressor check"},
        {carId:5, date:"2026-07-25", type:"Routine servicing", odo:51800, cost:72000, workshop:"Fleet workshop, Idu", notes:"Routine service"}
      ]);

      if (storedIssues) setIssueLogs(JSON.parse(storedIssues));
      else setIssueLogs([
        {id:1, carId:3, date:"2026-08-04", driver:"Peter Agbo", severity:"Medium", desc:"AC cooling is weak on long trips", status:"Open"},
        {id:2, carId:1, date:"2026-07-28", driver:"Ameh Friday", severity:"Low", desc:"Small windscreen chip, passenger side", status:"Resolved", resolvedBy:"Godsfavour Nyoyoko"}
      ]);
    }

    return () => clearInterval(interval);
  }, []);

  // Sync to local storage
  useEffect(() => {
    if (cars.length > 0) localStorage.setItem("fleet_cars", JSON.stringify(cars));
  }, [cars]);
  useEffect(() => {
    if (bookings.length > 0) localStorage.setItem("fleet_bookings", JSON.stringify(bookings));
  }, [bookings]);
  useEffect(() => {
    if (fuelLogs.length > 0) localStorage.setItem("fleet_fuelLogs", JSON.stringify(fuelLogs));
  }, [fuelLogs]);
  useEffect(() => {
    if (maintLogs.length > 0) localStorage.setItem("fleet_maintLogs", JSON.stringify(maintLogs));
  }, [maintLogs]);
  useEffect(() => {
    if (issueLogs.length > 0) localStorage.setItem("fleet_issueLogs", JSON.stringify(issueLogs));
  }, [issueLogs]);

  // Toast trigger
  const showToastMsg = (msg: string) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2600);
  };

  // Helper check status
  const isAdminUser = currentUser?.name === ADMIN_NAME;
  const isDriverUser = currentUser ? DRIVER_NAMES.includes(currentUser.name) : false;

  const isOfficeTrip = (b: Booking) => !b.mode || b.mode === "Office car";

  const getCarStatus = (c: Car) => {
    if (c.shop) return "shop";
    const t = new Date();
    const n = t.getHours() * 60 + t.getMinutes();
    const onTrip = bookings.some(
      (b) =>
        b.carId === c.id &&
        b.status === "approved" &&
        isOfficeTrip(b) &&
        b.date === todayISO &&
        mins(b.start) <= n &&
        n < mins(b.end)
    );
    return onTrip ? "trip" : "free";
  };

  // Login handler
  const handleSignIn = () => {
    setLoginMsg({ text: "", type: "" });
    if (!pickedCo) {
      setLoginMsg({ text: "Choose your company first.", type: "err" });
      return;
    }
    if (!loginStaff) {
      setLoginMsg({ text: "Select your name from the staff list.", type: "err" });
      return;
    }
    if (loginPw !== DEFAULT_PW) {
      setLoginMsg({ text: "Wrong password. For this demo the password is fleet123.", type: "err" });
      return;
    }

    const matched = STAFF.find((s) => s.name === loginStaff);
    if (matched) {
      setCurrentUser(matched);
      setLoginPw("");
      showToastMsg(`Signed in as ${matched.name}`);

      // Set default approver for user's company
      const apprs = STAFF.filter((s) => (s.co === matched.co && s.approver) || s.name === ADMIN_NAME);
      if (apprs.length > 0) {
        setBkManager(apprs[0].name);
      }
    }
  };

  const handleSignOut = () => {
    setCurrentUser(null);
    setPickedCo(null);
    setLoginStaff("");
    setLoginPw("");
  };

  // Stats
  let freeCount = 0, tripCount = 0, shopCount = 0, lowFuelCount = 0;
  cars.forEach((c) => {
    const s = getCarStatus(c);
    if (s === "free") freeCount++;
    else if (s === "trip") tripCount++;
    else shopCount++;
    if (c.fuel < 25) lowFuelCount++;
  });
  const todaysBookings = bookings.filter((b) => b.date === todayISO && b.status === "approved").length;
  const pendingApprovals = bookings.filter((b) => b.status === "pending").length;

  // Render dispatch board rows
  const getFilteredCars = () => {
    return cars.filter((c) => {
      const s = getCarStatus(c);
      if (filter === "free" && s !== "free") return false;
      if (filter === "trip" && s !== "trip") return false;
      if (filter === "shop" && s !== "shop") return false;
      if (filter === "lowfuel" && c.fuel >= 25) return false;
      return true;
    });
  };

  const timelineSpan = (DAY_END - DAY_START) * 60;
  const tNow = new Date();
  const nowMinsVal = tNow.getHours() * 60 + tNow.getMinutes();

  // Booking submit
  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBookMsg({ text: "", type: "" });
    if (!currentUser) return;

    if (!bkDate || !bkStart || !bkEnd) {
      setBookMsg({ text: "Please fill in the date, start and end time.", type: "err" });
      return;
    }
    if (!bkManager) {
      setBookMsg({ text: "Select the approver for this request.", type: "err" });
      return;
    }
    if (mins(bkStart) < DAY_START * 60 || mins(bkEnd) > DAY_END * 60) {
      setBookMsg({ text: "Bookings must fall between 08:00 and 22:00.", type: "err" });
      return;
    }
    if (mins(bkEnd) <= mins(bkStart)) {
      setBookMsg({ text: "End time must be after the start time.", type: "err" });
      return;
    }

    const clash = bookings.find(
      (b) =>
        b.carId === bkCar &&
        b.date === bkDate &&
        b.status !== "declined" &&
        isOfficeTrip(b) &&
        mins(bkStart) < mins(b.end) &&
        mins(b.start) < mins(bkEnd)
    );

    const targetCar = cars.find((c) => c.id === bkCar);

    if (clash) {
      setBookMsg({
        text: `${targetCar?.plate || "Vehicle"} already has a ${clash.status === "pending" ? "pending request" : "booking"} ${clash.start}–${clash.end} (${clash.staff}, ${clash.co}). Choose another time or vehicle.`,
        type: "err"
      });
      return;
    }

    const newBk: Booking = {
      id: nextBookingId,
      carId: bkCar,
      date: bkDate,
      start: bkStart,
      end: bkEnd,
      staff: currentUser.name + (isDriverUser ? " (Driver)" : ""),
      dept: currentUser.dept || "—",
      co: currentUser.co,
      dest: bkDest.trim() || "—",
      driver: bkDriver,
      purpose: bkPurpose.trim(),
      manager: bkManager,
      status: "pending"
    };

    setBookings([...bookings, newBk]);
    setNextBookingId(nextBookingId + 1);

    setBookMsg({
      text: `Request sent. ${targetCar?.plate || "Vehicle"} is held for you, ${bkStart}–${bkEnd}, awaiting approval from ${bkManager}.`,
      type: "ok"
    });
    setBkDest("");
    setBkPurpose("");
    showToastMsg("Request sent for approval");
  };

  // Adjustments & Approvals Actions
  const handleApprove = (id: number) => {
    if (!currentUser) return;
    setBookings(
      bookings.map((b) =>
        b.id === id
          ? {
              ...b,
              status: "approved",
              decidedAt: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
              decidedBy: currentUser.name
            }
          : b
      )
    );
    showToastMsg("Approved — trip confirmed");
  };

  const handleDecline = (id: number) => {
    if (!currentUser) return;
    setBookings(
      bookings.map((b) =>
        b.id === id
          ? {
              ...b,
              status: "declined",
              decidedAt: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
              decidedBy: currentUser.name
            }
          : b
      )
    );
    showToastMsg("Declined — slot freed");
  };

  const handleSaveAdjustment = (id: number, fields: Partial<Booking>) => {
    if (fields.start && fields.end) {
      if (mins(fields.start) < DAY_START * 60 || mins(fields.end) > DAY_END * 60) {
        showToastMsg("Trips must fall between 08:00 and 22:00");
        return;
      }
      if (mins(fields.end) <= mins(fields.start)) {
        showToastMsg("End time must be after the start time");
        return;
      }
    }

    // Clash validation for adjustment
    const original = bookings.find((b) => b.id === id);
    if (!original) return;
    const finalCarId = fields.carId !== undefined ? fields.carId : original.carId;
    const finalStart = fields.start !== undefined ? fields.start : original.start;
    const finalEnd = fields.end !== undefined ? fields.end : original.end;
    const finalMode = fields.mode !== undefined ? fields.mode : original.mode;

    if (!finalMode || finalMode === "Office car") {
      const clash = bookings.find(
        (x) =>
          x.id !== id &&
          x.carId === finalCarId &&
          x.date === original.date &&
          x.status !== "declined" &&
          isOfficeTrip(x) &&
          mins(finalStart) < mins(x.end) &&
          mins(x.start) < mins(finalEnd)
      );
      if (clash) {
        const c = cars.find((car) => car.id === finalCarId);
        showToastMsg(`${c?.name || "Vehicle"} is taken ${clash.start}–${clash.end} (${clash.staff})`);
        return;
      }
    }

    setBookings(
      bookings.map((b) => {
        if (b.id === id) {
          const updated = {
            ...b,
            ...fields,
            adjustedBy: currentUser?.name
          };
          if (fields.mode && fields.mode !== "Office car") {
            // keep cost and receipt fields if they are in update, else empty
          } else if (fields.mode === "Office car") {
            delete updated.cost;
            delete updated.receiptName;
            delete updated.receiptURL;
          }
          return updated;
        }
        return b;
      })
    );

    const c = cars.find((car) => car.id === finalCarId);
    showToastMsg(
      finalMode === "Office car" || !finalMode
        ? `Trip updated — ${c?.name || "Vehicle"} assigned`
        : `Trip moved to ${finalMode} — office car released`
    );
  };

  // Fuel Submit
  const handleFuelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFuelMsg({ text: "", type: "" });
    if (!currentUser) {
      setFuelMsg({ text: "Please sign in first.", type: "err" });
      return;
    }
    if (!isDriverUser && !isAdminUser) {
      setFuelMsg({ text: "Only drivers and the fleet manager can save fuel entries.", type: "err" });
      return;
    }

    const carId = flCar;
    const driver = flDriver;
    const litres = Number(flLitres);
    const cost = Number(flCost);
    const level = flLevel;
    const odo = Number(flOdo);
    const station = flStation.trim();

    if (!driver || !litres || !station) {
      setFuelMsg({ text: "Please select the driver and enter the litres purchased and the filling station.", type: "err" });
      return;
    }

    const c = cars.find((car) => car.id === carId);
    if (!c) return;

    if (odo && odo < c.odo) {
      setFuelMsg({ text: `Odometer reading looks lower than the last recorded value (${fmtN(c.odo)} km).`, type: "err" });
      return;
    }

    const whenStr = "Today " + new Date().toLocaleString("en-GB", { hour: "2-digit", minute: "2-digit" });
    const newLog: FuelLog = {
      carId,
      when: whenStr,
      driver,
      litres,
      cost: cost || 0,
      level,
      odo: odo || c.odo,
      station
    };

    setFuelLogs([...fuelLogs, newLog]);
    setCars(
      cars.map((car) =>
        car.id === carId
          ? {
              ...car,
              fuel: level,
              odo: odo || car.odo
            }
          : car
      )
    );

    setFuelMsg({ text: `Saved. ${c.plate} now shows ${level}% fuel.`, type: "ok" });
    setFlLitres("");
    setFlCost("");
    setFlOdo("");
    setFlStation("");
    showToastMsg("Fuel entry saved");
  };

  // Driver Trip Actions
  const handleStartTrip = (bookingId: number, startOdo: number) => {
    const b = bookings.find((x) => x.id === bookingId);
    if (!b) return;
    const c = cars.find((car) => car.id === b.carId);
    if (!c) return;

    if (!startOdo) {
      showToastMsg("Enter the odometer reading before starting");
      return;
    }
    if (startOdo < c.odo) {
      showToastMsg(`Reading looks lower than the vehicle's last recorded ${fmtN(c.odo)} km`);
      return;
    }

    setBookings(
      bookings.map((x) =>
        x.id === bookingId
          ? {
              ...x,
              startOdo
            }
          : x
      )
    );
    setCars(
      cars.map((car) =>
        car.id === b.carId
          ? {
              ...car,
              odo: startOdo
            }
          : car
      )
    );
    showToastMsg(`Trip started — ${c.name} at ${fmtN(startOdo)} km`);
  };

  const handleEndTrip = (bookingId: number, endOdo: number) => {
    const b = bookings.find((x) => x.id === bookingId);
    if (!b) return;
    const c = cars.find((car) => car.id === b.carId);
    if (!c) return;

    if (!endOdo) {
      showToastMsg("Enter the odometer reading before ending the trip");
      return;
    }
    if (b.startOdo && endOdo <= b.startOdo) {
      showToastMsg(`Finish reading must be higher than the start (${fmtN(b.startOdo)} km)`);
      return;
    }

    setBookings(
      bookings.map((x) =>
        x.id === bookingId
          ? {
              ...x,
              endOdo
            }
          : x
      )
    );
    setCars(
      cars.map((car) =>
        car.id === b.carId
          ? {
              ...car,
              odo: endOdo
            }
          : car
      )
    );
    showToastMsg(`Trip completed — ${fmtN(endOdo - (b.startOdo || 0))} km recorded`);
  };

  // Issue Logging
  const handleIssueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIssueMsg({ text: "", type: "" });
    if (!currentUser) {
      setIssueMsg({ text: "Please sign in first.", type: "err" });
      return;
    }
    if (!isDriverUser && !isAdminUser) {
      setIssueMsg({ text: "Only drivers and the fleet manager can log vehicle issues.", type: "err" });
      return;
    }
    if (!isDesc.trim()) {
      setIssueMsg({ text: "Please describe the issue.", type: "err" });
      return;
    }

    const c = cars.find((car) => car.id === isCar);
    if (!c) return;

    const newIssue: IssueLog = {
      id: nextIssueId,
      carId: isCar,
      date: todayISO,
      driver: currentUser.name,
      severity: isSev,
      desc: isDesc.trim(),
      status: "Open"
    };

    setIssueLogs([...issueLogs, newIssue]);
    setNextIssueId(nextIssueId + 1);

    setIssueMsg({
      text: `Issue logged for ${c.name}. The fleet manager will see it here.`,
      type: "ok"
    });
    setIsDesc("");
    showToastMsg("Issue logged");
  };

  const handleResolveIssue = (id: number) => {
    if (!currentUser) return;
    setIssueLogs(
      issueLogs.map((i) =>
        i.id === id
          ? {
              ...i,
              status: "Resolved",
              resolvedBy: currentUser.name
            }
          : i
      )
    );
    showToastMsg("Issue marked resolved");
  };

  // Maintenance Submit
  const handleMaintenanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSvcMsg({ text: "", type: "" });
    if (!currentUser) {
      setSvcMsg({ text: "Please sign in first.", type: "err" });
      return;
    }
    if (!isDriverUser && !isAdminUser) {
      setSvcMsg({ text: "Only drivers and the fleet manager can log maintenance work.", type: "err" });
      return;
    }

    const odoNum = Number(svOdo);
    const costNum = Number(svCost);
    if (!odoNum || !svWorkshop.trim()) {
      setSvcMsg({ text: "Please enter the odometer reading at the workshop and the workshop name.", type: "err" });
      return;
    }

    const c = cars.find((car) => car.id === svCar);
    if (!c) return;

    const newMaint: MaintenanceLog = {
      carId: svCar,
      date: todayISO,
      type: svType,
      odo: odoNum,
      cost: costNum || 0,
      workshop: svWorkshop.trim(),
      notes: svNotes.trim()
    };

    setMaintLogs([...maintLogs, newMaint]);
    setCars(
      cars.map((car) =>
        car.id === svCar
          ? {
              ...car,
              odo: odoNum > car.odo ? odoNum : car.odo
            }
          : car
      )
    );

    setSvcMsg({
      text:
        svType === "Routine servicing"
          ? `Saved. ${c.plate}'s next routine service is due at ${fmtN(odoNum + SERVICE_INTERVAL)} km.`
          : `Saved. ${svType} recorded for ${c.plate}.`,
      type: "ok"
    });

    setSvOdo("");
    setSvCost("");
    setSvWorkshop("");
    setSvNotes("");
    showToastMsg("Maintenance record saved");
  };

  // Vehicles save changes / remove / add
  const handleCarSave = (id: number, name: string, plate: string, co: "Tractrac" | "Ikore", odo: number, papers: string, shop: boolean) => {
    if (!name.trim()) {
      showToastMsg("Vehicle name cannot be empty");
      return;
    }
    setCars(
      cars.map((c) =>
        c.id === id
          ? {
              ...c,
              name: name.trim(),
              plate: plate.trim() || "TBD",
              co,
              odo,
              papers: papers.trim() || undefined,
              shop
            }
          : c
      )
    );
    showToastMsg(`${name} updated`);
  };

  const handleCarRemove = (id: number) => {
    const c = cars.find((car) => car.id === id);
    if (!c) return;
    if (!confirm(`Remove ${c.name} (${c.plate}) from the fleet?`)) return;
    setCars(cars.filter((car) => car.id !== id));
    showToastMsg(`${c.name} removed from the fleet`);
  };

  const handleCarAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setVehAddMsg({ text: "", type: "" });
    if (!currentUser || !isAdminUser) {
      setVehAddMsg({ text: "Only the fleet manager can add vehicles.", type: "err" });
      return;
    }
    if (!nvName.trim()) {
      setVehAddMsg({ text: "Enter the vehicle model or name.", type: "err" });
      return;
    }

    const plateVal = nvPlate.trim() || "TBD";
    const odoVal = Number(nvOdo) || 0;

    const newCar: Car = {
      id: nextCarId,
      plate: plateVal,
      name: nvName.trim(),
      co: nvCo,
      fuel: 50,
      odo: odoVal,
      loc: "Head office, Utako",
      locT: "Just added",
      shop: false,
      papers: nvPapers.trim() || undefined
    };

    setCars([...cars, newCar]);
    setNextCarId(nextCarId + 1);

    setVehAddMsg({ text: `${nvName} added to the fleet.`, type: "ok" });
    setNvName("");
    setNvPlate("");
    setNvOdo("");
    setNvPapers("");
    showToastMsg(`${nvName} added`);
  };

  // Staff search list
  const getFilteredStaff = () => {
    return STAFF.filter((s) => {
      if (staffFilter === "tt" && s.co !== "Tractrac") return false;
      if (staffFilter === "ik" && s.co !== "Ikore") return false;
      if (staffFilter === "appr" && !s.approver) return false;
      if (staffFilter === "drv" && !DRIVER_NAMES.includes(s.name)) return false;
      if (staffQuery && !s.name.toLowerCase().includes(staffQuery.toLowerCase())) return false;
      return true;
    });
  };

  // Location update
  const handleLocChange = (carId: number, loc: string) => {
    setCars(
      cars.map((c) =>
        c.id === carId
          ? {
              ...c,
              loc,
              locT: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
            }
          : c
      )
    );
    const targetCar = cars.find((c) => c.id === carId);
    showToastMsg(`${targetCar?.plate || "Vehicle"} location updated`);
  };

  return (
    <div>
      {/* ============ LOGIN OVERLAY ============ */}
      {!currentUser && (
        <div id="loginOverlay">
          <div className="login-card">
            <h2>Fleet Manager sign-in</h2>
            <p className="desc">Shared motorpool for TracTrac and Ikore. Sign in with your staff account to book vehicles.</p>
            <div className="co-pick">
              <button
                className={`co-btn tt ${pickedCo === "Tractrac" ? "sel" : ""}`}
                onClick={() => setPickedCo("Tractrac")}
              >
                TracTrac<small>51 staff</small>
              </button>
              <button
                className={`co-btn ik ${pickedCo === "Ikore" ? "sel" : ""}`}
                onClick={() => setPickedCo("Ikore")}
              >
                Ikore<small>40 staff</small>
              </button>
            </div>
            <div className="frow single">
              <div>
                <label htmlFor="loginStaff">Staff member</label>
                <select
                  id="loginStaff"
                  value={loginStaff}
                  onChange={(e) => setLoginStaff(e.target.value)}
                >
                  <option value="">
                    {pickedCo ? "Select your name…" : "Select your company first…"}
                  </option>
                  {pickedCo &&
                    STAFF.filter((s) => s.co === pickedCo)
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((s) => (
                        <option key={s.user} value={s.name}>
                          {s.name}
                          {s.approver ? " — Approver" : ""}
                        </option>
                      ))}
                </select>
              </div>
            </div>
            <div className="frow single">
              <div>
                <label htmlFor="loginPw">Password</label>
                <input
                  type="password"
                  id="loginPw"
                  placeholder="Enter password"
                  value={loginPw}
                  onChange={(e) => setLoginPw(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSignIn();
                  }}
                />
              </div>
            </div>
            {loginMsg.text && (
              <div className={`msg ${loginMsg.type === "err" ? "err" : "ok"}`}>
                {loginMsg.text}
              </div>
            )}
            <button className="btn" style={{ width: "100%" }} onClick={handleSignIn}>
              Sign in
            </button>
            <p className="login-hint">
              For this demo every account uses the password <code>fleet123</code>. In the live system
              each staff member sets their own password on first sign-in, and accounts come from the
              HR staff list.
            </p>
          </div>
        </div>
      )}

      {/* ============ MAIN HEADER ============ */}
      <header>
        <div className="head-inner">
          <div className="brand">
            <div className="sub">Shared Fleet Operations</div>
            <h1>
              <span className="tt-word">TracTrac</span> &amp; <span className="ik-word">Ikore</span> Motorpool
            </h1>
          </div>
          <div className="head-meta">
            <div className="badge">{todayFormatted}</div>
            <div className="badge">
              Booking window <strong>08:00 – 22:00</strong>
            </div>
            <div className="badge">{clockStr}</div>
            {currentUser && (
              <div className="user-chip">
                <span className="who">
                  {currentUser.name.split(" ").slice(0, 2).join(" ")}
                </span>
                <span className={`co-chip ${currentUser.co === "Tractrac" ? "tt" : "ik"}`}>
                  {currentUser.co === "Tractrac" ? "TracTrac" : "Ikore"}
                </span>
                <button className="signout" onClick={handleSignOut}>
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ============ NAVIGATION TABS ============ */}
      <nav>
        <div className="tabs">
          <button
            className={`tab ${activeTab === "board" ? "active" : ""}`}
            onClick={() => setActiveTab("board")}
          >
            Fleet board
          </button>
          <button
            className={`tab ${activeTab === "book" ? "active" : ""}`}
            onClick={() => setActiveTab("book")}
          >
            Book a car
          </button>
          {(currentUser?.approver || isAdminUser) && (
            <button
              className={`tab ${activeTab === "approvals" ? "active" : ""}`}
              onClick={() => setActiveTab("approvals")}
            >
              Approvals
              {pendingApprovals > 0 && <span className="cnt">{pendingApprovals}</span>}
            </button>
          )}
          {(isDriverUser || isAdminUser) && (
            <button
              className={`tab ${activeTab === "fuel" ? "active" : ""}`}
              onClick={() => setActiveTab("fuel")}
            >
              Fuel log
            </button>
          )}
          {(isDriverUser || isAdminUser) && (
            <button
              className={`tab ${activeTab === "drivers" ? "active" : ""}`}
              onClick={() => setActiveTab("drivers")}
            >
              Drivers
            </button>
          )}
          {(isDriverUser || isAdminUser) && (
            <button
              className={`tab ${activeTab === "maintenance" ? "active" : ""}`}
              onClick={() => setActiveTab("maintenance")}
            >
              Maintenance
            </button>
          )}
          {isAdminUser && (
            <button
              className={`tab ${activeTab === "vehicles" ? "active" : ""}`}
              onClick={() => setActiveTab("vehicles")}
            >
              Vehicles
            </button>
          )}
          <button
            className={`tab ${activeTab === "staff" ? "active" : ""}`}
            onClick={() => setActiveTab("staff")}
          >
            Staff
          </button>
          <button
            className={`tab ${activeTab === "locations" ? "active" : ""}`}
            onClick={() => setActiveTab("locations")}
          >
            Locations
          </button>
        </div>
      </nav>

      {/* ============ MAIN SECTIONS ============ */}
      <main>
        {/* ============ FLEET BOARD ============ */}
        <section className={activeTab === "board" ? "active" : ""}>
          <div className="stats">
            <div className={`stat ${pendingApprovals ? "busy" : ""}`}>
              <div className="num">{pendingApprovals}</div>
              <div className="lbl">Awaiting approval</div>
            </div>
            <div className="stat free">
              <div className="num">{freeCount}</div>
              <div className="lbl">Free now</div>
            </div>
            <div className="stat busy">
              <div className="num">{tripCount}</div>
              <div className="lbl">On trip</div>
            </div>
            <div className="stat shop">
              <div className="num">{shopCount}</div>
              <div className="lbl">In workshop</div>
            </div>
            <div className="stat">
              <div className="num">{todaysBookings}</div>
              <div className="lbl">Bookings today</div>
            </div>
            <div className={`stat ${lowFuelCount ? "shop" : ""}`}>
              <div className="num">{lowFuelCount}</div>
              <div className="lbl">Low fuel (&lt;25%)</div>
            </div>
          </div>

          <div className="filters">
            <button
              className={`chip ${filter === "all" ? "active" : ""}`}
              onClick={() => setFilter("all")}
            >
              All vehicles
            </button>
            <button
              className={`chip ${filter === "free" ? "active" : ""}`}
              onClick={() => setFilter("free")}
            >
              Free now
            </button>
            <button
              className={`chip ${filter === "trip" ? "active" : ""}`}
              onClick={() => setFilter("trip")}
            >
              On trip
            </button>
            <button
              className={`chip ${filter === "shop" ? "active" : ""}`}
              onClick={() => setFilter("shop")}
            >
              In workshop
            </button>
            <button
              className={`chip ${filter === "lowfuel" ? "active" : ""}`}
              onClick={() => setFilter("lowfuel")}
            >
              Low fuel
            </button>
          </div>

          <div className="board-wrap">
            <div className="board">
              <div className="board-head">
                <div className="cars-col">Vehicle</div>
                <div className="hours">
                  {Array.from({ length: DAY_END - DAY_START }).map((_, i) => (
                    <span key={i}>{String(DAY_START + i).padStart(2, "0")}:00</span>
                  ))}
                </div>
              </div>
              <div id="rows">
                {getFilteredCars().map((c) => {
                  const fc = c.fuel < 25 ? "low" : c.fuel < 50 ? "mid" : "";
                  const cStatus = getCarStatus(c);

                  let blocks: React.ReactNode[] = [];
                  if (c.shop) {
                    blocks.push(
                      <div className="block shopblock" style={{ left: 0, right: 0 }} key="shop">
                        <strong>In workshop</strong>Not available for booking
                      </div>
                    );
                  } else {
                    bookings
                      .filter((b) => b.carId === c.id && b.date === todayISO && b.status !== "declined" && isOfficeTrip(b))
                      .forEach((b) => {
                        const l = ((mins(b.start) - DAY_START * 60) / timelineSpan) * 100;
                        const w = ((mins(b.end) - mins(b.start)) / timelineSpan) * 100;
                        const cls = `${b.co === "Tractrac" ? "tt" : "ik"} ${b.status === "pending" ? "pending" : ""}`;
                        const titleText = `${b.start}–${b.end} · ${b.staff} (${b.co === "Tractrac" ? "TracTrac" : "Ikore"}) · ${b.dest}${b.status === "pending" ? " · awaiting approval" : ""}`;
                        blocks.push(
                          <div
                            key={b.id}
                            className={`block ${cls}`}
                            style={{ left: `${l}%`, width: `${w}%` }}
                            title={titleText}
                          >
                            <strong>
                              {b.start}–{b.end}
                              {b.status === "pending" && " ⏳"}
                            </strong>
                            {b.staff} · {b.dest}
                          </div>
                        );
                      });
                  }

                  let nowLine: React.ReactNode = null;
                  if (nowMinsVal >= DAY_START * 60 && nowMinsVal <= DAY_END * 60) {
                    const lNow = ((nowMinsVal - DAY_START * 60) / timelineSpan) * 100;
                    nowLine = <div className="nowline" style={{ left: `${lNow}%` }} />;
                  }

                  return (
                    <div className="vrow" key={c.id}>
                      <div className="vcell">
                        <span className="plate">{c.plate}</span>
                        <span className="vname">
                          {c.name}{" "}
                          <span className={`co-chip ${c.co === "Tractrac" ? "tt" : "ik"}`}>
                            {c.co === "Tractrac" ? "TracTrac" : "Ikore"}
                          </span>
                        </span>
                        <span className="vmeta">
                          Fuel {c.fuel}%{" "}
                          <span className={`fuelbar ${fc}`}>
                            <i style={{ width: `${c.fuel}%` }} />
                          </span>
                        </span>
                        {c.papers && (
                          <span className="vmeta" style={{ color: "var(--amber)", fontWeight: 600 }}>
                            {c.papers}
                          </span>
                        )}
                      </div>
                      <div
                        className="timeline"
                        onClick={(e) => {
                          if (c.shop) return;
                          // If click was on a block, do not trigger booking
                          if ((e.target as HTMLElement).closest(".block")) return;
                          const rect = e.currentTarget.getBoundingClientRect();
                          const frac = (e.clientX - rect.left) / rect.width;
                          let clickedHour = Math.floor(DAY_START + frac * (DAY_END - DAY_START));
                          clickedHour = Math.max(DAY_START, Math.min(DAY_END - 1, clickedHour));

                          setBkCar(c.id);
                          setBkStart(`${String(clickedHour).padStart(2, "0")}:00`);
                          setBkEnd(`${String(Math.min(clickedHour + 2, DAY_END)).padStart(2, "0")}:00`);
                          setActiveTab("book");
                          showToastMsg(`Booking ${c.plate} — set your details`);
                        }}
                      >
                        <div className="gridlines">
                          {Array.from({ length: 14 }).map((_, i) => (
                            <i key={i} />
                          ))}
                        </div>
                        {nowLine}
                        {blocks}
                      </div>
                    </div>
                  );
                })}
                {getFilteredCars().length === 0 && (
                  <div style={{ padding: "24px 16px", color: "var(--muted)", fontSize: ".85rem" }}>
                    No vehicles match this filter right now.
                  </div>
                )}
              </div>
              <div className="board-note">
                Click any empty space on a row to book that vehicle. Bookings are coloured by company:
                <span className="key tt"></span>TracTrac<span className="key ik"></span>Ikore. Dashed
                blocks are awaiting approval; the red line marks the current time.
              </div>
            </div>
          </div>
        </section>

        {/* ============ BOOKING ============ */}
        <section className={activeTab === "book" ? "active" : ""}>
          <div className="panel">
            <h2>Book a car</h2>
            <p className="desc">
              Open to all TracTrac and Ikore staff. Bookings run daily between 08:00 and 22:00 and every
              request goes for approval before the vehicle is released — either to an approver from your
              company or to the fleet manager, who approves requests from both companies. The fleet manager
              may adjust the vehicle, driver, or timing of any trip, and decides whether it runs with
              an office car, a car hire service, or Bolt.
            </p>
            {bookMsg.text && (
              <div className={`msg ${bookMsg.type === "err" ? "err" : "ok"}`}>
                {bookMsg.text}
              </div>
            )}
            <form onSubmit={handleBookingSubmit}>
              <div className="frow">
                <div>
                  <label htmlFor="bkWho">Requested by</label>
                  <input
                    type="text"
                    id="bkWho"
                    value={
                      currentUser
                        ? currentUser.name + (isDriverUser ? " (Driver)" : "")
                        : "Sign in first"
                    }
                    readOnly
                  />
                </div>
                <div>
                  <label htmlFor="bkDeptRO">Department / company</label>
                  <input
                    type="text"
                    id="bkDeptRO"
                    value={
                      currentUser
                        ? `${currentUser.dept && currentUser.dept !== "—" ? currentUser.dept + " · " : ""}${currentUser.co === "Tractrac" ? "TracTrac" : "Ikore"}`
                        : ""
                    }
                    readOnly
                  />
                </div>
              </div>
              <div className="frow">
                <div>
                  <label htmlFor="bkCar">Vehicle</label>
                  <select
                    id="bkCar"
                    value={bkCar}
                    onChange={(e) => setBkCar(Number(e.target.value))}
                  >
                    {cars.map((c) => (
                      <option key={c.id} value={c.id} disabled={c.shop}>
                        {c.plate !== "TBD" ? c.plate + " — " : ""}
                        {c.name} ({c.co === "Tractrac" ? "TracTrac" : "Ikore"})
                        {c.shop ? " — workshop" : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="bkDate">Date</label>
                  <input
                    type="date"
                    id="bkDate"
                    min={todayISO}
                    value={bkDate}
                    onChange={(e) => setBkDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="frow">
                <div>
                  <label htmlFor="bkStart">Start time</label>
                  <input
                    type="time"
                    id="bkStart"
                    min="08:00"
                    max="22:00"
                    step="900"
                    value={bkStart}
                    onChange={(e) => setBkStart(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="bkEnd">End time</label>
                  <input
                    type="time"
                    id="bkEnd"
                    min="08:00"
                    max="22:00"
                    step="900"
                    value={bkEnd}
                    onChange={(e) => setBkEnd(e.target.value)}
                  />
                </div>
              </div>
              <div className="frow">
                <div>
                  <label htmlFor="bkManager">Approver (from your company)</label>
                  <select
                    id="bkManager"
                    value={bkManager}
                    onChange={(e) => setBkManager(e.target.value)}
                  >
                    {currentUser &&
                      STAFF.filter((s) => (s.co === currentUser.co && s.approver) || s.name === ADMIN_NAME).map(
                        (a) => (
                          <option key={a.user} value={a.name}>
                            {a.name === ADMIN_NAME
                              ? `${a.name} — Fleet manager (approves both)`
                              : `${a.name} — ${a.designation || "Approver"}`}
                          </option>
                        )
                      )}
                  </select>
                </div>
                <div>
                  <label htmlFor="bkDest">Destination</label>
                  <input
                    type="text"
                    id="bkDest"
                    placeholder="e.g. Gwagwalada field office"
                    value={bkDest}
                    onChange={(e) => setBkDest(e.target.value)}
                  />
                </div>
              </div>
              <div className="frow">
                <div>
                  <label htmlFor="bkDriver">Driver</label>
                  <select
                    id="bkDriver"
                    value={bkDriver}
                    onChange={(e) => setBkDriver(e.target.value)}
                  >
                    <option value="Assign any available driver">Assign any available driver</option>
                    <option value="Peter Agbo">Peter Agbo (TracTrac)</option>
                    <option value="Ameh Friday">Ameh Friday (TracTrac)</option>
                    <option value="Louis Ogbuneke">Louis Ogbuneke (Ikore)</option>
                    <option value="Self-drive (approved staff)">Self-drive (approved staff)</option>
                  </select>
                </div>
                <div></div>
              </div>
              <div className="frow single">
                <div>
                  <label htmlFor="bkPurpose">Purpose of trip</label>
                  <textarea
                    id="bkPurpose"
                    rows={2}
                    placeholder="e.g. Cooperative onboarding visit"
                    value={bkPurpose}
                    onChange={(e) => setBkPurpose(e.target.value)}
                  />
                </div>
              </div>
              <button type="submit" className="btn" id="bkSubmit">
                Send request for approval
              </button>
            </form>
          </div>

          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Company</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Requested by</th>
                  <th>Destination</th>
                  <th>Approver</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings
                  .slice()
                  .reverse()
                  .map((b) => {
                    const c = cars.find((car) => car.id === b.carId);
                    const costBit = isAdminUser
                      ? `${b.cost ? `₦${fmtN(b.cost)}` : "cost pending"}${b.receiptName ? ` · receipt: ${b.receiptName}` : " · no receipt yet"}`
                      : "arranged by fleet manager";
                    const vehLabel = isOfficeTrip(b)
                      ? c
                        ? `${c.plate} — ${c.name}`
                        : "Unknown vehicle"
                      : `${b.mode} (${costBit})`;

                    const label = { approved: "Approved", pending: "Pending", declined: "Declined" }[b.status];
                    const cls = { approved: "free", pending: "pending", declined: "declined" }[b.status];

                    return (
                      <tr key={b.id}>
                        <td>
                          <span className={isOfficeTrip(b) ? "plate" : ""}>{vehLabel}</span>
                          {b.adjustedBy && (
                            <span style={{ display: "block", color: "var(--muted)", fontSize: ".7rem" }}>
                              adjusted by fleet manager
                            </span>
                          )}
                        </td>
                        <td>
                          <span className={`co-chip ${b.co === "Tractrac" ? "tt" : "ik"}`}>
                            {b.co === "Tractrac" ? "TracTrac" : "Ikore"}
                          </span>
                        </td>
                        <td>{b.date === todayISO ? "Today" : b.date}</td>
                        <td>
                          {b.start}–{b.end}
                          {b.endOdo ? (
                            <span style={{ display: "block", color: "var(--ik-dark)", fontSize: ".72rem", fontWeight: 700 }}>
                              {fmtN(b.endOdo - (b.startOdo || 0))} km covered
                            </span>
                          ) : b.startOdo ? (
                            <span style={{ display: "block", color: "var(--muted)", fontSize: ".72rem" }}>
                              in progress — from {fmtN(b.startOdo)} km
                            </span>
                          ) : null}
                        </td>
                        <td>
                          {b.staff}
                          {b.dept && b.dept !== "—" && (
                            <span style={{ color: "var(--muted)", marginLeft: "4px" }}>
                              · {b.dept}
                            </span>
                          )}
                        </td>
                        <td>{b.dest}</td>
                        <td>{b.manager}</td>
                        <td>
                          <span className={`status-pill ${cls}`}>{label}</span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </section>

        {/* ============ APPROVALS ============ */}
        <section className={activeTab === "approvals" ? "active" : ""}>
          <div className="panel" style={{ maxWidth: "760px", marginBottom: "20px" }}>
            <h2>Approvals</h2>
            <p className="desc" id="apprDesc">
              {isAdminUser
                ? "As fleet manager you can see and decide every pending request across both companies, and you can adjust any trip — change the vehicle, driver, or timing, or move it to a car hire service or Bolt."
                : "Booking requests routed to you as an approver. Pending requests hold their slot on the fleet board (shown dashed) so the time cannot be double-booked while a decision is made."}
            </p>
          </div>

          <div id="apprList">
            {bookings
              .filter((b) => b.status === "pending")
              .filter((b) => isAdminUser || b.manager === currentUser?.name)
              .map((b) => {
                const c = cars.find((car) => car.id === b.carId);
                return (
                  <div className="appr-card" key={b.id}>
                    <div className="appr-top">
                      <span className="appr-title">
                        {b.staff}{" "}
                        <span className={`co-chip ${b.co === "Tractrac" ? "tt" : "ik"}`}>
                          {b.co === "Tractrac" ? "TracTrac" : "Ikore"}
                        </span>{" "}
                        <span style={{ color: "var(--muted)", fontWeight: 400 }}>requests</span>{" "}
                        {isOfficeTrip(b) && c ? `${c.plate} — ${c.name}` : ""}{" "}
                        {!isOfficeTrip(b) && (
                          <span className={`mode-chip ${b.mode === "Bolt" ? "bolt" : "hire"}`}>
                            {b.mode}
                          </span>
                        )}
                      </span>
                      <span className="status-pill pending">Pending</span>
                    </div>
                    <div className="appr-meta">
                      {b.date === todayISO ? "Today" : b.date}, {b.start}–{b.end} ·{" "}
                      {b.dest || "No destination given"} · {b.driver}
                      <br />
                      {b.purpose && `Purpose: ${b.purpose} · `}Department: {b.dept || "—"} · Approver:{" "}
                      <strong>{b.manager}</strong>
                      {b.adjustedBy && " · Adjusted by fleet manager"}
                    </div>
                    <div className="appr-actions">
                      <button className="btn small approve" onClick={() => handleApprove(b.id)}>
                        Approve request
                      </button>
                      <button className="btn small ghost" onClick={() => handleDecline(b.id)}>
                        Decline
                      </button>
                    </div>

                    {/* FLEET MANAGER ADJUSTMENTS */}
                    {isAdminUser && (
                      <details className="adj">
                        <summary>Fleet manager — adjust this trip</summary>
                        <div className="frow">
                          <div>
                            <label>Trip mode</label>
                            <select
                              value={b.mode || "Office car"}
                              onChange={(e) => handleSaveAdjustment(b.id, { mode: e.target.value })}
                            >
                              <option value="Office car">Office car</option>
                              <option value="Car hire service">Car hire service</option>
                              <option value="Bolt">Bolt (ride-hailing)</option>
                            </select>
                          </div>
                          <div>
                            <label>Vehicle (office car trips)</label>
                            <select
                              value={b.carId}
                              disabled={!!(b.mode && b.mode !== "Office car")}
                              onChange={(e) =>
                                handleSaveAdjustment(b.id, { carId: Number(e.target.value) })
                              }
                            >
                              {cars.map((car) => (
                                <option key={car.id} value={car.id} disabled={car.shop}>
                                  {car.plate !== "TBD" ? car.plate + " — " : ""}
                                  {car.name} ({car.co === "Tractrac" ? "TracTrac" : "Ikore"})
                                  {car.shop ? " — workshop" : ""}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="frow">
                          <div>
                            <label>Driver</label>
                            <select
                              value={b.driver}
                              onChange={(e) =>
                                handleSaveAdjustment(b.id, { driver: e.target.value })
                              }
                            >
                              <option value="Assign any available driver">Assign any available driver</option>
                              <option value="Peter Agbo">Peter Agbo</option>
                              <option value="Ameh Friday">Ameh Friday</option>
                              <option value="Louis Ogbuneke">Louis Ogbuneke</option>
                              <option value="Self-drive (approved staff)">Self-drive (approved staff)</option>
                              <option value="Bolt ride (arranged)">Bolt ride (arranged)</option>
                              <option value="Hired vehicle with driver">Hired vehicle with driver</option>
                            </select>
                          </div>
                          <div className="frow" style={{ marginBottom: 0, gap: "10px" }}>
                            <div>
                              <label>Start</label>
                              <input
                                type="time"
                                value={b.start}
                                onChange={(e) =>
                                  handleSaveAdjustment(b.id, { start: e.target.value })
                                }
                              />
                            </div>
                            <div>
                              <label>End</label>
                              <input
                                type="time"
                                value={b.end}
                                onChange={(e) =>
                                  handleSaveAdjustment(b.id, { end: e.target.value })
                                }
                              />
                            </div>
                          </div>
                        </div>
                        <div className="frow">
                          <div>
                            <label>Ride / hire cost (₦)</label>
                            <input
                              type="number"
                              placeholder="e.g. 4500"
                              value={b.cost || ""}
                              onChange={(e) =>
                                handleSaveAdjustment(b.id, { cost: Number(e.target.value) })
                              }
                            />
                          </div>
                          <div>
                            <label>Upload receipt</label>
                            <input
                              type="file"
                              accept="image/*,.pdf"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) {
                                  handleSaveAdjustment(b.id, {
                                    receiptName: f.name,
                                    receiptURL: URL.createObjectURL(f)
                                  });
                                }
                              }}
                            />
                            {b.receiptName && (
                              <span className="adj-note">On file: {b.receiptName}</span>
                            )}
                          </div>
                        </div>
                      </details>
                    )}
                  </div>
                );
              })}

            {/* APPROVED TRIPS OF TODAY FOR ADMIN WORKSHOP ADJUSTMENTS */}
            {isAdminUser &&
              bookings
                .filter((b) => b.date === todayISO && b.status === "approved")
                .map((b) => {
                  const c = cars.find((car) => car.id === b.carId);
                  return (
                    <div className="appr-card" style={{ borderLeftColor: "var(--line)" }} key={b.id}>
                      <div className="appr-top">
                        <span className="appr-title">
                          {b.staff}{" "}
                          <span className={`co-chip ${b.co === "Tractrac" ? "tt" : "ik"}`}>
                            {b.co === "Tractrac" ? "TracTrac" : "Ikore"}
                          </span>{" "}
                          — {isOfficeTrip(b) && c ? `${c.plate}, ` : ""}
                          {b.start}–{b.end}{" "}
                          <span className={`status-pill free`}>Approved</span>
                        </span>
                      </div>
                      <div className="appr-meta">
                        {b.dest} · Driver: {b.driver}
                        {b.adjustedBy && " · Adjusted by fleet manager"}
                        {b.endOdo ? (
                          <span>
                            {" "}
                            · <strong>{fmtN(b.endOdo - (b.startOdo || 0))} km covered</strong> (
                            {fmtN(b.startOdo || 0)} → {fmtN(b.endOdo)} km)
                          </span>
                        ) : b.startOdo ? (
                          ` · In progress from ${fmtN(b.startOdo)} km`
                        ) : null}
                      </div>

                      <details className="adj">
                        <summary>Fleet manager — adjust this trip</summary>
                        <div className="frow">
                          <div>
                            <label>Trip mode</label>
                            <select
                              value={b.mode || "Office car"}
                              onChange={(e) => handleSaveAdjustment(b.id, { mode: e.target.value })}
                            >
                              <option value="Office car">Office car</option>
                              <option value="Car hire service">Car hire service</option>
                              <option value="Bolt">Bolt (ride-hailing)</option>
                            </select>
                          </div>
                          <div>
                            <label>Vehicle (office car trips)</label>
                            <select
                              value={b.carId}
                              disabled={!!(b.mode && b.mode !== "Office car")}
                              onChange={(e) =>
                                handleSaveAdjustment(b.id, { carId: Number(e.target.value) })
                              }
                            >
                              {cars.map((car) => (
                                <option key={car.id} value={car.id} disabled={car.shop}>
                                  {car.plate !== "TBD" ? car.plate + " — " : ""}
                                  {car.name} ({car.co === "Tractrac" ? "TracTrac" : "Ikore"})
                                  {car.shop ? " — workshop" : ""}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="frow">
                          <div>
                            <label>Driver</label>
                            <select
                              value={b.driver}
                              onChange={(e) =>
                                handleSaveAdjustment(b.id, { driver: e.target.value })
                              }
                            >
                              <option value="Assign any available driver">Assign any available driver</option>
                              <option value="Peter Agbo">Peter Agbo</option>
                              <option value="Ameh Friday">Ameh Friday</option>
                              <option value="Louis Ogbuneke">Louis Ogbuneke</option>
                              <option value="Self-drive (approved staff)">Self-drive (approved staff)</option>
                              <option value="Bolt ride (arranged)">Bolt ride (arranged)</option>
                              <option value="Hired vehicle with driver">Hired vehicle with driver</option>
                            </select>
                          </div>
                          <div className="frow" style={{ marginBottom: 0, gap: "10px" }}>
                            <div>
                              <label>Start</label>
                              <input
                                type="time"
                                value={b.start}
                                onChange={(e) =>
                                  handleSaveAdjustment(b.id, { start: e.target.value })
                                }
                              />
                            </div>
                            <div>
                              <label>End</label>
                              <input
                                type="time"
                                value={b.end}
                                onChange={(e) =>
                                  handleSaveAdjustment(b.id, { end: e.target.value })
                                }
                              />
                            </div>
                          </div>
                        </div>
                        <div className="frow">
                          <div>
                            <label>Ride / hire cost (₦)</label>
                            <input
                              type="number"
                              placeholder="e.g. 4500"
                              value={b.cost || ""}
                              onChange={(e) =>
                                handleSaveAdjustment(b.id, { cost: Number(e.target.value) })
                              }
                            />
                          </div>
                          <div>
                            <label>Upload receipt</label>
                            <input
                              type="file"
                              accept="image/*,.pdf"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) {
                                  handleSaveAdjustment(b.id, {
                                    receiptName: f.name,
                                    receiptURL: URL.createObjectURL(f)
                                  });
                                }
                              }}
                            />
                            {b.receiptName && (
                              <span className="adj-note">On file: {b.receiptName}</span>
                            )}
                          </div>
                        </div>
                      </details>
                    </div>
                  );
                })}

            {/* DECIDED APPR LIST */}
            {bookings
              .filter((b) => b.status !== "pending" && b.decidedAt)
              .filter((b) => isAdminUser || b.manager === currentUser?.name)
              .slice(-6)
              .reverse()
              .map((b) => {
                const c = cars.find((car) => car.id === b.carId);
                const label = { approved: "Approved", pending: "Pending", declined: "Declined" }[b.status];
                const cls = { approved: "free", pending: "pending", declined: "declined" }[b.status];

                return (
                  <div className="appr-card done" key={b.id}>
                    <div className="appr-top">
                      <span className="appr-title">
                        {b.staff} — {c?.plate}, {b.start}–{b.end}
                      </span>
                      <span className={`status-pill ${cls}`}>{label}</span>
                    </div>
                    <div className="appr-meta">
                      Decided by {b.decidedBy || b.manager} at {b.decidedAt}
                    </div>
                  </div>
                );
              })}

            {bookings.filter((b) => b.status === "pending").filter((b) => isAdminUser || b.manager === currentUser?.name).length === 0 &&
              bookings.filter((b) => b.status !== "pending" && b.decidedAt).filter((b) => isAdminUser || b.manager === currentUser?.name).length === 0 && (
                <div className="appr-empty">
                  No requests waiting for you. New booking requests naming you as approver will appear here.
                </div>
              )}
          </div>
        </section>

        {/* ============ FUEL LOG ============ */}
        <section className={activeTab === "fuel" ? "active" : ""}>
          <div className="panel">
            <h2>Log a fuel purchase</h2>
            <p className="desc">
              Drivers record every fuel purchase here, including the tank level after filling. Levels
              below 25% are flagged on the fleet board.
            </p>
            {fuelMsg.text && (
              <div className={`msg ${fuelMsg.type === "err" ? "err" : "ok"}`}>
                {fuelMsg.text}
              </div>
            )}
            <form onSubmit={handleFuelSubmit}>
              <div className="frow">
                <div>
                  <label htmlFor="flCar">Vehicle</label>
                  <select
                    id="flCar"
                    value={flCar}
                    onChange={(e) => setFlCar(Number(e.target.value))}
                  >
                    {cars.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.plate !== "TBD" ? c.plate + " — " : ""}
                        {c.name} ({c.co === "Tractrac" ? "TracTrac" : "Ikore"})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="flDriver">Driver</label>
                  <select
                    id="flDriver"
                    value={flDriver}
                    onChange={(e) => setFlDriver(e.target.value)}
                  >
                    <option value="">Select driver…</option>
                    <option value="Peter Agbo">Peter Agbo</option>
                    <option value="Ameh Friday">Ameh Friday</option>
                    <option value="Louis Ogbuneke">Louis Ogbuneke</option>
                    <option value="Other / self-drive staff">Other / self-drive staff</option>
                  </select>
                </div>
              </div>
              <div className="frow">
                <div>
                  <label htmlFor="flLitres">Litres purchased</label>
                  <input
                    type="number"
                    id="flLitres"
                    min="1"
                    max="120"
                    placeholder="e.g. 40"
                    value={flLitres}
                    onChange={(e) => setFlLitres(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="flCost">Amount paid (₦)</label>
                  <input
                    type="number"
                    id="flCost"
                    min="0"
                    placeholder="e.g. 38000"
                    value={flCost}
                    onChange={(e) => setFlCost(e.target.value)}
                  />
                </div>
              </div>
              <div className="frow">
                <div>
                  <label htmlFor="flLevel">
                    Tank level after filling — <span className="range-out">{flLevel}%</span>
                  </label>
                  <input
                    type="range"
                    id="flLevel"
                    min="0"
                    max="100"
                    value={flLevel}
                    onChange={(e) => setFlLevel(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label htmlFor="flOdo">Odometer reading (km)</label>
                  <input
                    type="number"
                    id="flOdo"
                    min="0"
                    placeholder="e.g. 84210"
                    value={flOdo}
                    onChange={(e) => setFlOdo(e.target.value)}
                  />
                </div>
              </div>
              <div className="frow single">
                <div>
                  <label htmlFor="flStation">Filling station / location</label>
                  <input
                    type="text"
                    id="flStation"
                    placeholder="e.g. NNPC, Airport Road"
                    value={flStation}
                    onChange={(e) => setFlStation(e.target.value)}
                  />
                </div>
              </div>
              <button type="submit" className="btn" id="flSubmit">
                Save fuel entry
              </button>
            </form>
          </div>

          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date &amp; time</th>
                  <th>Vehicle</th>
                  <th>Driver</th>
                  <th>Litres</th>
                  {isAdminUser && <th>Cost (₦)</th>}
                  <th>Level after</th>
                  <th>Odometer</th>
                  <th>Station</th>
                </tr>
              </thead>
              <tbody>
                {fuelLogs
                  .slice()
                  .reverse()
                  .map((f, i) => {
                    const c = cars.find((car) => car.id === f.carId);
                    return (
                      <tr key={i}>
                        <td>{f.when}</td>
                        <td>
                          <span className="plate">{c?.plate || "TBD"}</span>
                        </td>
                        <td>{f.driver}</td>
                        <td>{f.litres} L</td>
                        {isAdminUser && <td>₦{fmtN(f.cost)}</td>}
                        <td>{f.level}%</td>
                        <td>{fmtN(f.odo)} km</td>
                        <td>{f.station}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </section>

        {/* ============ DRIVERS ============ */}
        <section className={activeTab === "drivers" ? "active" : ""}>
          {currentUser && DRIVER_NAMES.includes(currentUser.name) && (
            <div>
              <div
                className="panel"
                style={{ maxWidth: "860px", marginBottom: "14px", borderLeft: "4px solid var(--ik)" }}
              >
                <h2>My trips today — {currentUser.name}</h2>
                <p className="desc" style={{ marginBottom: 0 }}>
                  Your approved assignments for{" "}
                  {tNow.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
                  . Enter the odometer reading when you set off and again when you finish — every trip's
                  mileage is recorded against the vehicle.
                </p>
              </div>

              {bookings
                .filter((b) => b.driver === currentUser.name && b.date === todayISO && b.status === "approved" && isOfficeTrip(b))
                .sort((a, b) => mins(a.start) - mins(b.start))
                .map((t) => {
                  const c = cars.find((car) => car.id === t.carId);
                  return (
                    <div
                      className="svc-card svc-ok-card"
                      style={{ alignItems: "flex-start", flexDirection: "column" }}
                      key={t.id}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: "12px",
                          flexWrap: "wrap",
                          alignItems: "center",
                          width: "100%"
                        }}
                      >
                        <div className="info">
                          <strong>
                            {t.start}–{t.end} · <span className="plate">{c?.plate}</span> {c?.name}
                          </strong>
                          <br />
                          {t.dest} · for {t.staff}{" "}
                          <span className={`co-chip ${t.co === "Tractrac" ? "tt" : "ik"}`}>
                            {t.co === "Tractrac" ? "TracTrac" : "Ikore"}
                          </span>
                          {t.purpose && ` · ${t.purpose}`}
                        </div>
                        {t.endOdo ? (
                          <span className="status-pill free">Completed</span>
                        ) : t.startOdo ? (
                          <span className="status-pill trip">In progress</span>
                        ) : (
                          <span className="status-pill free">Approved</span>
                        )}
                      </div>

                      <div className="trip-mile">
                        {t.endOdo ? (
                          <span className="done-txt">
                            {fmtN(t.startOdo || 0)} → {fmtN(t.endOdo)} km ·{" "}
                            {fmtN(t.endOdo - (t.startOdo || 0))} km covered
                          </span>
                        ) : t.startOdo ? (
                          <>
                            <span className="start-txt">Started at {fmtN(t.startOdo)} km</span>
                            <input
                              type="number"
                              min={t.startOdo + 1}
                              placeholder="Odometer at finish (km)"
                              value={mileInputs[t.id] || ""}
                              onChange={(e) =>
                                setMileInputs({ ...mileInputs, [t.id]: e.target.value })
                              }
                            />
                            <button
                              className="btn small"
                              onClick={() => handleEndTrip(t.id, Number(mileInputs[t.id]))}
                            >
                              End trip
                            </button>
                          </>
                        ) : (
                          <>
                            <input
                              type="number"
                              min="0"
                              placeholder={`Odometer at start — now ${fmtN(c?.odo || 0)} km`}
                              value={mileInputs[t.id] !== undefined ? mileInputs[t.id] : c?.odo || 0}
                              onChange={(e) =>
                                setMileInputs({ ...mileInputs, [t.id]: e.target.value })
                              }
                            />
                            <button
                              className="btn small approve"
                              onClick={() =>
                                handleStartTrip(
                                  t.id,
                                  mileInputs[t.id] !== undefined
                                    ? Number(mileInputs[t.id])
                                    : c?.odo || 0
                                )
                              }
                            >
                              Start trip
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}

              {bookings.filter((b) => b.driver === currentUser.name && b.date === todayISO && b.status === "approved" && isOfficeTrip(b)).length === 0 && (
                <div className="appr-empty">
                  No approved trips on your schedule today. Trips appear here once the approver or fleet
                  manager approves them.
                </div>
              )}
              <div style={{ height: "22px" }} />
            </div>
          )}

          <div className="panel" style={{ maxWidth: "760px", marginBottom: "20px" }}>
            <h2>Driver profiles</h2>
            <p className="desc">
              Driver contact and licence details are visible to the fleet manager only; each driver sees
              their own profile and daily schedule. Licence expiry dates within 60 days are flagged so
              renewals happen before a driver is grounded.
            </p>
          </div>

          <div className="drv-grid">
            {DRIVERS.filter((d) => isAdminUser || currentUser?.name === d.name).map((d) => {
              const exp = new Date(d.licExp);
              const days = Math.round((exp.getTime() - new Date().getTime()) / 86400000);
              const expCls = days < 60 ? "lic-warn" : "lic-ok";
              const expNote = days < 0 ? " — expired!" : days < 60 ? ` — renew soon (${days} days)` : "";
              const trips = bookings.filter(
                (b) =>
                  b.driver === d.name && b.date === todayISO && b.status === "approved" && isOfficeTrip(b)
              );
              const lastFuel = fuelLogs
                .slice()
                .reverse()
                .find((f) => f.driver === d.name);

              return (
                <div className="drv-card" key={d.name}>
                  <div className={`drv-head ${d.co === "Tractrac" ? "tt" : "ik"}`}>
                    <div className="drv-avatar">{d.name[0]}</div>
                    <div>
                      <h3>{d.name}</h3>
                      <div className="role">
                        {d.co === "Tractrac" ? "TracTrac" : "Ikore"} pool driver · {d.years} yrs experience
                      </div>
                    </div>
                  </div>
                  <div className="drv-body">
                    <div className="drv-row">
                      <span className="k">Phone</span>
                      <span className="v">{d.phone}</span>
                    </div>
                    <div className="drv-row">
                      <span className="k">Licence no.</span>
                      <span className="v">{d.licence}</span>
                    </div>
                    <div className="drv-row">
                      <span className="k">Licence expiry</span>
                      <span className={`v ${expCls}`}>
                        {exp.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        {expNote}
                      </span>
                    </div>
                    <div className="drv-row">
                      <span className="k">Base</span>
                      <span className="v">{d.base}</span>
                    </div>
                    <div className="drv-row">
                      <span className="k">Last fuel entry</span>
                      <span className="v">
                        {lastFuel
                          ? `${cars.find((c) => c.id === lastFuel.carId)?.plate}, ${lastFuel.litres} L`
                          : "—"}
                      </span>
                    </div>
                  </div>
                  <div className="drv-today">
                    Today:{" "}
                    {trips.length > 0 ? (
                      trips.map((t) => (
                        <div key={t.id}>
                          <strong>{cars.find((c) => c.id === t.carId)?.name}</strong> {t.start}–{t.end}{" "}
                          → {t.dest}
                        </div>
                      ))
                    ) : (
                      "No approved trips today"
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ============ MAINTENANCE ============ */}
        <section className={activeTab === "maintenance" ? "active" : ""}>
          <div className="panel" style={{ maxWidth: "860px", marginBottom: "20px" }}>
            <h2>Maintenance status — all vehicles</h2>
            <p className="desc">
              Routine servicing is due every 5,000 km; status below compares each car's odometer
              against its last routine service. Other repairs — brake pads, tyres, suspension and so
              on — are recorded in the maintenance log and history underneath.
            </p>
          </div>

          <div id="svcStatus">
            {cars
              .map((c) => {
                const recs = maintLogs
                  .filter((s) => s.carId === c.id && s.type === "Routine servicing")
                  .sort((a, b) => b.odo - a.odo);
                const last = recs[0] || null;
                const nextDue = last ? last.odo + SERVICE_INTERVAL : null;
                const remaining = nextDue !== null ? nextDue - c.odo : null;

                let pill, cls, state;
                if (remaining === null) {
                  state = 1;
                  pill = <span className="due-pill soon">No routine service on record</span>;
                  cls = "svc-soon";
                } else if (remaining < 0) {
                  state = 0;
                  pill = <span className="due-pill over">Overdue by {fmtN(-remaining)} km</span>;
                  cls = "svc-due";
                } else if (remaining <= 500) {
                  state = 1;
                  pill = <span className="due-pill soon">Due in {fmtN(remaining)} km</span>;
                  cls = "svc-soon";
                } else {
                  state = 2;
                  pill = <span className="due-pill ok">{fmtN(remaining)} km to next service</span>;
                  cls = "svc-ok-card";
                }

                const otherCount = maintLogs.filter((m) => m.carId === c.id && m.type !== "Routine servicing").length;
                const openIssues = issueLogs.filter((i) => i.carId === c.id && i.status === "Open").length;

                return { c, last, nextDue, pill, cls, state, otherCount, openIssues };
              })
              .sort((a, b) => a.state - b.state)
              .map(({ c, last, nextDue, pill, cls, otherCount, openIssues }) => (
                <div className={`svc-card ${cls}`} key={c.id}>
                  <div className="info">
                    <strong>
                      <span className="plate">{c.plate}</span> {c.name}{" "}
                      <span className={`co-chip ${c.co === "Tractrac" ? "tt" : "ik"}`}>
                        {c.co === "Tractrac" ? "TracTrac" : "Ikore"}
                      </span>
                    </strong>
                    <br />
                    Odometer {fmtN(c.odo)} km ·{" "}
                    {last
                      ? `Last routine service at ${fmtN(last.odo)} km (${new Date(last.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}) · next due ${fmtN(nextDue || 0)} km`
                      : "No routine service on record yet"}
                    {otherCount > 0 && ` · ${otherCount} other repair${otherCount > 1 ? "s" : ""} logged`}
                    {openIssues > 0 && (
                      <span style={{ color: "var(--red)", fontWeight: 700 }}>
                        {" "}
                        · {openIssues} open issue{openIssues > 1 ? "s" : ""}
                      </span>
                    )}
                    {c.papers && (
                      <span style={{ color: "#8a6200", fontWeight: 600 }}> · {c.papers}</span>
                    )}
                  </div>
                  {pill}
                </div>
              ))}
          </div>

          {/* REPORT VEHICLE ISSUE */}
          <div className="panel" style={{ marginTop: "26px" }}>
            <h2>Report a vehicle issue</h2>
            <p className="desc">
              Drivers log faults and observations here — anything from a warning light to unusual noises
              — so the fleet manager can schedule the fix before it becomes a breakdown.
            </p>
            {issueMsg.text && (
              <div className={`msg ${issueMsg.type === "err" ? "err" : "ok"}`}>
                {issueMsg.text}
              </div>
            )}
            <form onSubmit={handleIssueSubmit}>
              <div className="frow">
                <div>
                  <label htmlFor="isCar">Vehicle</label>
                  <select
                    id="isCar"
                    value={isCar}
                    onChange={(e) => setIsCar(Number(e.target.value))}
                  >
                    {cars.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.plate !== "TBD" ? c.plate + " — " : ""}
                        {c.name} ({c.co === "Tractrac" ? "TracTrac" : "Ikore"})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="isSev">Severity</label>
                  <select id="isSev" value={isSev} onChange={(e) => setIsSev(e.target.value)}>
                    <option value="Low — note for next service">Low — note for next service</option>
                    <option value="Medium — needs attention soon">Medium — needs attention soon</option>
                    <option value="High — unsafe / stop using vehicle">High — unsafe / stop using vehicle</option>
                  </select>
                </div>
              </div>
              <div className="frow single">
                <div>
                  <label htmlFor="isDesc">Describe the issue</label>
                  <textarea
                    id="isDesc"
                    rows={2}
                    placeholder="e.g. Grinding noise when braking at low speed"
                    value={isDesc}
                    onChange={(e) => setIsDesc(e.target.value)}
                  />
                </div>
              </div>
              <button type="submit" className="btn" id="isSubmit">
                Log issue
              </button>
            </form>
          </div>

          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Vehicle</th>
                  <th>Reported by</th>
                  <th>Severity</th>
                  <th>Issue</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {issueLogs
                  .slice()
                  .sort(
                    (a, b) =>
                      (a.status === "Open" ? 0 : 1) - (b.status === "Open" ? 0 : 1) ||
                      b.date.localeCompare(a.date)
                  )
                  .map((i) => {
                    const c = cars.find((car) => car.id === i.carId);
                    const isHigh = i.severity.startsWith("High");
                    const isMed = i.severity.startsWith("Medium");
                    const pillCls = isHigh ? "shop" : isMed ? "trip" : "free";

                    return (
                      <tr key={i.id}>
                        <td>
                          {new Date(i.date).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short"
                          })}
                        </td>
                        <td>
                          <span className="plate">{c?.plate}</span>
                          <br />
                          <span style={{ fontSize: ".74rem" }}>{c?.name}</span>
                        </td>
                        <td>{i.driver}</td>
                        <td>
                          <span className={`status-pill ${pillCls}`}>
                            {i.severity.split(" ")[0]}
                          </span>
                        </td>
                        <td>{i.desc}</td>
                        <td>
                          {i.status === "Open" ? (
                            <>
                              <span className="status-pill pending">Open</span>
                              {isAdminUser && (
                                <button
                                  className="btn small approve"
                                  style={{ marginLeft: "6px" }}
                                  onClick={() => handleResolveIssue(i.id)}
                                >
                                  Mark resolved
                                </button>
                              )}
                            </>
                          ) : (
                            <>
                              <span className="status-pill free">Resolved</span>
                              {i.resolvedBy && (
                                <span style={{ display: "block", color: "var(--muted)", fontSize: ".7rem" }}>
                                  by {i.resolvedBy}
                                </span>
                              )}
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {/* LOG MAINTENANCE WORK */}
          <div className="panel" style={{ marginTop: "26px" }}>
            <h2>Log maintenance work</h2>
            <p className="desc">
              Record every workshop job under its category. Logging a routine service automatically
              schedules the next one 5,000 km ahead.
            </p>
            {svcMsg.text && (
              <div className={`msg ${svcMsg.type === "err" ? "err" : "ok"}`}>
                {svcMsg.text}
              </div>
            )}
            <form onSubmit={handleMaintenanceSubmit}>
              <div className="frow">
                <div>
                  <label htmlFor="svCar">Vehicle</label>
                  <select
                    id="svCar"
                    value={svCar}
                    onChange={(e) => setSvCar(Number(e.target.value))}
                  >
                    {cars.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.plate !== "TBD" ? c.plate + " — " : ""}
                        {c.name} ({c.co === "Tractrac" ? "TracTrac" : "Ikore"})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="svType">Maintenance category</label>
                  <select
                    id="svType"
                    value={svType}
                    onChange={(e) => setSvType(e.target.value)}
                  >
                    {MAINT_CATEGORIES.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="frow">
                <div>
                  <label htmlFor="svOdo">Odometer at workshop (km)</label>
                  <input
                    type="number"
                    id="svOdo"
                    placeholder="e.g. 95200"
                    value={svOdo}
                    onChange={(e) => setSvOdo(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="svCost">Cost (₦)</label>
                  <input
                    type="number"
                    id="svCost"
                    placeholder="e.g. 85000"
                    value={svCost}
                    onChange={(e) => setSvCost(e.target.value)}
                  />
                </div>
              </div>
              <div className="frow">
                <div>
                  <label htmlFor="svWorkshop">Workshop</label>
                  <input
                    type="text"
                    id="svWorkshop"
                    placeholder="e.g. Fleet workshop, Idu"
                    value={svWorkshop}
                    onChange={(e) => setSvWorkshop(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="svNotes">Notes</label>
                  <input
                    type="text"
                    id="svNotes"
                    placeholder="e.g. Replaced front brake pads"
                    value={svNotes}
                    onChange={(e) => setSvNotes(e.target.value)}
                  />
                </div>
              </div>
              <button type="submit" className="btn" id="svSubmit">
                Save maintenance record
              </button>
            </form>
          </div>

          {/* FILTERS FOR LOGS */}
          <div className="filters" id="svcFilters" style={{ marginTop: "26px" }}>
            {["all", ...MAINT_CATEGORIES.filter((m) => maintLogs.some((s) => s.type === m))].map((m) => (
              <button
                key={m}
                className={`chip ${svcFilter === m ? "active" : ""}`}
                onClick={() => setSvcFilter(m)}
              >
                {m === "all" ? "All work" : m}
              </button>
            ))}
          </div>

          <div className="tbl-wrap" style={{ marginTop: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Vehicle</th>
                  <th>Category</th>
                  <th>Odometer</th>
                  {isAdminUser && <th>Cost (₦)</th>}
                  <th>Workshop</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {maintLogs
                  .filter((s) => svcFilter === "all" || s.type === svcFilter)
                  .slice()
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((s, idx) => {
                    const c = cars.find((car) => car.id === s.carId);
                    return (
                      <tr key={idx}>
                        <td>
                          {new Date(s.date).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric"
                          })}
                        </td>
                        <td>
                          <span className="plate">{c?.plate}</span>
                        </td>
                        <td>
                          <span className="cat-tag">{s.type}</span>
                        </td>
                        <td>{fmtN(s.odo)} km</td>
                        {isAdminUser && <td>₦{fmtN(s.cost)}</td>}
                        <td>{s.workshop}</td>
                        <td>{s.notes || "—"}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </section>

        {/* ============ VEHICLES ============ */}
        <section className={activeTab === "vehicles" ? "active" : ""}>
          <div className="panel" style={{ maxWidth: "860px", marginBottom: "20px" }}>
            <h2>Manage vehicles</h2>
            <p className="desc">
              Fleet manager only. Edit each vehicle's plate, model, owning company, odometer, and
              document notes, move vehicles in or out of the workshop, or add a new vehicle to the pool.
              Changes apply everywhere immediately — the fleet board, booking form, maintenance, and
              locations.
            </p>
          </div>

          <div id="vehList">
            {isAdminUser ? (
              cars.map((c) => {
                const hasBookings = bookings.some((b) => b.carId === c.id && b.status !== "declined");
                return (
                  <div
                    className="appr-card"
                    style={{ borderLeftColor: c.co === "Tractrac" ? "var(--tt)" : "var(--ik)", maxWidth: "860px" }}
                    key={c.id}
                  >
                    <div className="appr-top">
                      <span className="appr-title">
                        <span className="plate">{c.plate}</span> {c.name}{" "}
                        <span className={`co-chip ${c.co === "Tractrac" ? "tt" : "ik"}`}>
                          {c.co === "Tractrac" ? "TracTrac" : "Ikore"}
                        </span>
                      </span>
                      <span>
                        {c.shop ? (
                          <span className="status-pill shop">Workshop</span>
                        ) : (
                          <span className="status-pill free">In service</span>
                        )}
                      </span>
                    </div>
                    <div className="frow">
                      <div>
                        <label>Vehicle model / name</label>
                        <input
                          type="text"
                          defaultValue={c.name}
                          onBlur={(e) => handleCarSave(c.id, e.target.value, c.plate, c.co, c.odo, c.papers || "", c.shop)}
                        />
                      </div>
                      <div>
                        <label>Plate number</label>
                        <input
                          type="text"
                          defaultValue={c.plate}
                          onBlur={(e) => handleCarSave(c.id, c.name, e.target.value, c.co, c.odo, c.papers || "", c.shop)}
                        />
                      </div>
                    </div>
                    <div className="frow">
                      <div>
                        <label>Owning company</label>
                        <select
                          defaultValue={c.co}
                          onChange={(e) =>
                            handleCarSave(c.id, c.name, c.plate, e.target.value as "Tractrac" | "Ikore", c.odo, c.papers || "", c.shop)
                          }
                        >
                          <option value="Tractrac">TracTrac</option>
                          <option value="Ikore">Ikore</option>
                        </select>
                      </div>
                      <div>
                        <label>Odometer (km)</label>
                        <input
                          type="number"
                          defaultValue={c.odo}
                          onBlur={(e) =>
                            handleCarSave(c.id, c.name, c.plate, c.co, Number(e.target.value), c.papers || "", c.shop)
                          }
                        />
                      </div>
                    </div>
                    <div className="frow">
                      <div>
                        <label>Document note</label>
                        <input
                          type="text"
                          defaultValue={c.papers || ""}
                          placeholder="e.g. Papers renewal — March 2027"
                          onBlur={(e) => handleCarSave(c.id, c.name, c.plate, c.co, c.odo, e.target.value, c.shop)}
                        />
                      </div>
                      <div>
                        <label>Status</label>
                        <select
                          defaultValue={c.shop ? "yes" : "no"}
                          onChange={(e) =>
                            handleCarSave(
                              c.id,
                              c.name,
                              c.plate,
                              c.co,
                              c.odo,
                              c.papers || "",
                              e.target.value === "yes"
                            )
                          }
                        >
                          <option value="no">In service — bookable</option>
                          <option value="yes">In workshop — not bookable</option>
                        </select>
                      </div>
                    </div>
                    <div className="appr-actions">
                      <button
                        className="btn small ghost"
                        disabled={hasBookings}
                        title={hasBookings ? "This vehicle has bookings on record" : ""}
                        onClick={() => handleCarRemove(c.id)}
                      >
                        Remove vehicle
                      </button>
                      {hasBookings && (
                        <span className="adj-note" style={{ margin: 0 }}>
                          Has bookings on record — cannot be removed
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="appr-empty">Only the fleet manager can manage vehicles.</div>
            )}
          </div>

          {/* ADD A VEHICLE */}
          {isAdminUser && (
            <div className="panel" style={{ marginTop: "26px" }}>
              <h2>Add a vehicle</h2>
              {vehAddMsg.text && (
                <div className={`msg ${vehAddMsg.type === "err" ? "err" : "ok"}`}>
                  {vehAddMsg.text}
                </div>
              )}
              <form onSubmit={handleCarAdd}>
                <div className="frow">
                  <div>
                    <label htmlFor="nvName">Vehicle model / name</label>
                    <input
                      type="text"
                      id="nvName"
                      placeholder="e.g. Toyota Hilux"
                      value={nvName}
                      onChange={(e) => setNvName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="nvPlate">Plate number</label>
                    <input
                      type="text"
                      id="nvPlate"
                      placeholder="e.g. ABJ 123 XY (or TBD)"
                      value={nvPlate}
                      onChange={(e) => setNvPlate(e.target.value)}
                    />
                  </div>
                </div>
                <div className="frow">
                  <div>
                    <label htmlFor="nvCo">Owning company</label>
                    <select
                      id="nvCo"
                      value={nvCo}
                      onChange={(e) => setNvCo(e.target.value as "Tractrac" | "Ikore")}
                    >
                      <option value="Tractrac">TracTrac</option>
                      <option value="Ikore">Ikore</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="nvOdo">Current odometer (km)</label>
                    <input
                      type="number"
                      id="nvOdo"
                      placeholder="e.g. 12000"
                      value={nvOdo}
                      onChange={(e) => setNvOdo(e.target.value)}
                    />
                  </div>
                </div>
                <div className="frow single">
                  <div>
                    <label htmlFor="nvPapers">Document note (optional)</label>
                    <input
                      type="text"
                      id="nvPapers"
                      placeholder="e.g. Papers renewal — March 2027"
                      value={nvPapers}
                      onChange={(e) => setNvPapers(e.target.value)}
                    />
                  </div>
                </div>
                <button type="submit" className="btn" id="nvAdd">
                  Add vehicle
                </button>
              </form>
            </div>
          )}
        </section>

        {/* ============ STAFF ============ */}
        <section className={activeTab === "staff" ? "active" : ""}>
          <div className="panel" style={{ maxWidth: "860px", marginBottom: "20px" }}>
            <h2>Staff directory</h2>
            <p className="desc" id="staffDesc">
              {isAdminUser
                ? "All TracTrac and Ikore staff loaded from the HR staff list. As fleet manager you can see each account's login details; in the live system passwords are set by staff and stored securely."
                : "All TracTrac and Ikore staff loaded from the HR staff list. Everyone here can sign in and book vehicles; approvers are marked, and the fleet manager approves requests from both companies."}
            </p>
          </div>
          <div className="staff-tools">
            <div className="filters" style={{ marginBottom: 0 }} id="staffFilters">
              <button
                className={`chip ${staffFilter === "all" ? "active" : ""}`}
                onClick={() => setStaffFilter("all")}
              >
                All ({STAFF.length})
              </button>
              <button
                className={`chip ${staffFilter === "tt" ? "active" : ""}`}
                onClick={() => setStaffFilter("tt")}
              >
                TracTrac
              </button>
              <button
                className={`chip ${staffFilter === "ik" ? "active" : ""}`}
                onClick={() => setStaffFilter("ik")}
              >
                Ikore
              </button>
              <button
                className={`chip ${staffFilter === "appr" ? "active" : ""}`}
                onClick={() => setStaffFilter("appr")}
              >
                Approvers
              </button>
              <button
                className={`chip ${staffFilter === "drv" ? "active" : ""}`}
                onClick={() => setStaffFilter("drv")}
              >
                Drivers
              </button>
            </div>
            <input
              type="search"
              id="staffSearch"
              placeholder="Search by name…"
              value={staffQuery}
              onChange={(e) => setStaffQuery(e.target.value)}
            />
          </div>
          <div className="tbl-wrap" style={{ marginTop: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Company</th>
                  <th>Designation</th>
                  <th>Department</th>
                  {isAdminUser && <th>Login (username / password)</th>}
                </tr>
              </thead>
              <tbody>
                {getFilteredStaff().map((s) => (
                  <tr key={s.user}>
                    <td>
                      <span className={`co-dot ${s.co === "Tractrac" ? "tt" : "ik"}`}></span>
                      {s.name}
                      {s.approver && <span className="role-badge appr">Approver</span>}
                      {DRIVER_NAMES.includes(s.name) && <span className="role-badge drv">Driver</span>}
                      {s.name === ADMIN_NAME && <span className="role-badge adm">Fleet manager</span>}
                    </td>
                    <td>
                      <span className={`co-chip ${s.co === "Tractrac" ? "tt" : "ik"}`}>
                        {s.co === "Tractrac" ? "TracTrac" : "Ikore"}
                      </span>
                    </td>
                    <td>{s.designation || "—"}</td>
                    <td>{s.dept || "—"}</td>
                    {isAdminUser && (
                      <td>
                        <span className="cred">{s.user}</span> /{" "}
                        <span className="cred">{DEFAULT_PW}</span>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ============ LOCATIONS ============ */}
        <section className={activeTab === "locations" ? "active" : ""}>
          <div className="loc-grid">
            {cars.map((c) => {
              const status = getCarStatus(c);
              const pill =
                status === "free" ? (
                  <span className="status-pill free">Free</span>
                ) : status === "trip" ? (
                  <span className="status-pill trip">On trip</span>
                ) : (
                  <span className="status-pill shop">Workshop</span>
                );

              return (
                <div className="loc-card" key={c.id}>
                  <div className="top">
                    <span className="plate">{c.plate}</span>
                    {pill}
                  </div>
                  <div className="loc-place">{c.loc}</div>
                  <div className="loc-time">
                    Last check-in: {c.locT} · {c.name}{" "}
                    <span className={`co-chip ${c.co === "Tractrac" ? "tt" : "ik"}`}>
                      {c.co === "Tractrac" ? "TracTrac" : "Ikore"}
                    </span>{" "}
                    · Fuel {c.fuel}%
                    {c.papers && (
                      <>
                        <br />
                        <span style={{ color: "#8a6200", fontWeight: 600 }}>{c.papers}</span>
                      </>
                    )}
                  </div>
                  <label htmlFor={`loc-${c.id}`}>Driver check-in — update location</label>
                  <select
                    id={`loc-${c.id}`}
                    value={c.loc}
                    onChange={(e) => handleLocChange(c.id, e.target.value)}
                  >
                    {ABUJA_SPOTS.map((spot) => (
                      <option key={spot} value={spot}>
                        {spot}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
          <p className="loc-note">
            Locations shown here are the last check-in reported by the driver. For live, automatic
            positions, this screen would connect to GPS trackers fitted in each vehicle — the layout
            is ready to display live coordinates when that integration is added.
          </p>
        </section>
      </main>

      {/* ============ TOAST ============ */}
      <div className={`toast ${showToast ? "show" : ""}`}>{toastMsg}</div>
    </div>
  );
}
