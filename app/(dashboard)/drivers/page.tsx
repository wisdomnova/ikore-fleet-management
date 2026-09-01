"use client";

import React, { useState, useMemo } from "react";
import { useFleet, Driver } from "../layout";
import { API_BASE_URL } from "../../config";
import { isBookingOnDate, isBookingInDateRange, getWeekDates } from "../../utils";
import Dropdown from "../../components/Dropdown";
import { motion, AnimatePresence } from "framer-motion";
import {
  IconEdit,
  IconPlus,
  IconX,
  IconCheck,
  IconUser,
  IconSteeringWheel,
  IconAlertTriangle,
  IconCalendar,
  IconFilter,
  IconRoad,
  IconClock,
  IconCar
} from "@tabler/icons-react";

export default function DriversPage() {
  const {
    currentUser,
    cars,
    setCars,
    bookings,
    setBookings,
    fuelLogs,
    drivers,
    setDrivers,
    showToastMsg
  } = useFleet();

  const [mileInputs, setMileInputs] = useState<Record<number, string>>({});

  // Filters State
  const todayISO = new Date().toISOString().slice(0, 10);
  const tNow = new Date();
  const weekInfo = useMemo(() => getWeekDates(tNow), []);

  const isDriver = (name: string) =>
    drivers.some((d) => d.name.toLowerCase() === name.toLowerCase());
  const isAdmin = (name: string) =>
    name === "Godsfavour Nyoyoko" || name === "Divine Wisdom";

  const isAdminUser = currentUser && isAdmin(currentUser.name);
  const isDriverUser = currentUser && isDriver(currentUser.name);

  const [timeFilter, setTimeFilter] = useState<"today" | "this_week" | "upcoming" | "past" | "all">("this_week");
  const [statusFilter, setStatusFilter] = useState<"all" | "approved" | "in_progress" | "completed">("all");
  const [selectedDriverFilter, setSelectedDriverFilter] = useState<string>(
    isDriverUser && currentUser ? currentUser.name : "all"
  );
  const [searchQuery, setSearchQuery] = useState("");

  // Edit Driver Modal
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [editName, setEditName] = useState("");
  const [editCompany, setEditCompany] = useState<"Tractrac" | "Ikore" | "ChananHill">("Tractrac");
  const [editPhone, setEditPhone] = useState("");
  const [editLicence, setEditLicence] = useState("");
  const [editLicExp, setEditLicExp] = useState("");
  const [editYears, setEditYears] = useState<number | "">(5);
  const [editBase, setEditBase] = useState("");
  const [editMsg, setEditMsg] = useState({ text: "", type: "" });
  const [isSavingDriver, setIsSavingDriver] = useState(false);

  // Add Driver Modal
  const [isAddingDriver, setIsAddingDriver] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCompany, setNewCompany] = useState<"Tractrac" | "Ikore" | "ChananHill">("Tractrac");
  const [newPhone, setNewPhone] = useState("");
  const [newLicence, setNewLicence] = useState("");
  const [newLicExp, setNewLicExp] = useState(
    new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().slice(0, 10)
  );
  const [newYears, setNewYears] = useState<number | "">(3);
  const [newBase, setNewBase] = useState("Head office, Utako");

  const isOfficeTrip = (b: any) => !b.mode || b.mode === "Office car";

  const mins = (t: string): number => {
    const [h, m] = (t || "00:00").split(":").map(Number);
    return h * 60 + m;
  };

  const fmtN = (n: number): string => {
    return (n || 0).toLocaleString("en-NG");
  };

  const visibleDrivers = isAdminUser
    ? drivers
    : isDriverUser
    ? drivers.filter((d) => d.name.toLowerCase() === currentUser?.name.toLowerCase())
    : drivers;

  // Next week calculation
  const nextWeekInfo = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return getWeekDates(d);
  }, []);

  // Filter trips for the schedule view
  const filteredTrips = useMemo(() => {
    return bookings.filter((b) => {
      if (b.status === "declined") return false;
      if (!isOfficeTrip(b)) return false;

      // 1. Driver filter
      if (selectedDriverFilter !== "all") {
        if (!b.driver || b.driver.toLowerCase() !== selectedDriverFilter.toLowerCase()) {
          return false;
        }
      } else {
        // In "all drivers" view, only show bookings assigned to a known driver
        const isAssigned = drivers.some((d) => d.name.toLowerCase() === (b.driver || "").toLowerCase());
        if (!isAssigned) return false;
      }

      // 2. Time filter
      const [sDate, eDate] = b.date.includes(" to ") ? b.date.split(" to ") : [b.date, b.date];
      if (timeFilter === "today") {
        if (!isBookingOnDate(b.date, todayISO)) return false;
      } else if (timeFilter === "this_week") {
        if (!isBookingInDateRange(b.date, weekInfo.start, weekInfo.end)) return false;
      } else if (timeFilter === "upcoming") {
        if (eDate < todayISO) return false;
      } else if (timeFilter === "past") {
        if (eDate >= todayISO && !b.endOdo) return false;
      }

      // 3. Status filter
      if (statusFilter === "completed") {
        if (!b.endOdo) return false;
      } else if (statusFilter === "in_progress") {
        if (!b.startOdo || b.endOdo) return false;
      } else if (statusFilter === "approved") {
        if (b.startOdo || b.endOdo || b.status !== "approved") return false;
      }

      // 4. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const car = cars.find((c) => c.id === b.carId);
        const match =
          (b.staff || "").toLowerCase().includes(q) ||
          (b.dest || "").toLowerCase().includes(q) ||
          (b.driver || "").toLowerCase().includes(q) ||
          (b.purpose || "").toLowerCase().includes(q) ||
          (car?.plate || "").toLowerCase().includes(q) ||
          (car?.name || "").toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    }).sort((a, b) => {
      const dateA = a.date.split(" to ")[0];
      const dateB = b.date.split(" to ")[0];
      if (dateA !== dateB) return dateA.localeCompare(dateB);
      return mins(a.start) - mins(b.start);
    });
  }, [bookings, selectedDriverFilter, timeFilter, statusFilter, searchQuery, drivers, todayISO, weekInfo, cars]);

  // Summary statistics for the filtered view
  const stats = useMemo(() => {
    let totalKm = 0;
    let inProgress = 0;
    let completed = 0;
    let upcoming = 0;

    filteredTrips.forEach((t) => {
      if (t.endOdo && t.startOdo) {
        totalKm += Math.max(0, t.endOdo - t.startOdo);
        completed++;
      } else if (t.startOdo && !t.endOdo) {
        inProgress++;
      } else {
        upcoming++;
      }
    });

    return {
      total: filteredTrips.length,
      totalKm,
      inProgress,
      completed,
      upcoming
    };
  }, [filteredTrips]);

  // Actions
  const handleStartTrip = async (bookingId: number, startOdo: number) => {
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

    try {
      const bkRes = await fetch(`${API_BASE_URL}/api/bookings/${bookingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startOdo })
      });
      if (!bkRes.ok) throw new Error("Failed to update booking start odo");
      const updatedBk = await bkRes.json();

      const carRes = await fetch(`${API_BASE_URL}/api/vehicles/${b.carId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ odo: startOdo })
      });
      if (!carRes.ok) throw new Error("Failed to update vehicle odometer");
      const updatedCar = await carRes.json();

      setBookings(bookings.map((x) => (x.id === bookingId ? updatedBk : x)));
      setCars(cars.map((car) => (car.id === b.carId ? updatedCar : car)));
      showToastMsg(`Trip started - ${c.name} at ${fmtN(startOdo)} km`);
    } catch (err) {
      showToastMsg("Failed to start trip on server");
    }
  };

  const handleEndTrip = async (bookingId: number, endOdo: number) => {
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

    try {
      const bkRes = await fetch(`${API_BASE_URL}/api/bookings/${bookingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endOdo })
      });
      if (!bkRes.ok) throw new Error("Failed to update booking end odo");
      const updatedBk = await bkRes.json();

      const carRes = await fetch(`${API_BASE_URL}/api/vehicles/${b.carId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ odo: endOdo })
      });
      if (!carRes.ok) throw new Error("Failed to update vehicle odometer");
      const updatedCar = await carRes.json();

      setBookings(bookings.map((x) => (x.id === bookingId ? updatedBk : x)));
      setCars(cars.map((car) => (car.id === b.carId ? updatedCar : car)));
      showToastMsg(`Trip completed - ${fmtN(endOdo - (b.startOdo || 0))} km recorded`);
    } catch (err) {
      showToastMsg("Failed to complete trip on server");
    }
  };

  // Open Edit Driver Modal
  const handleOpenEdit = (d: Driver) => {
    setEditingDriver(d);
    setEditMsg({ text: "", type: "" });
    setEditName(d.name);
    setEditCompany(d.co);
    setEditPhone(d.phone || "");
    setEditLicence(d.licence || "");
    setEditLicExp(d.licExp || "");
    setEditYears(d.years !== undefined ? d.years : 0);
    setEditBase(d.base || "");
  };

  // Save Driver Edit
  const handleSaveDriver = async () => {
    if (!editingDriver) return;
    setEditMsg({ text: "", type: "" });

    if (!editName.trim()) {
      setEditMsg({ text: "Name cannot be empty", type: "err" });
      return;
    }
    if (!editPhone.trim()) {
      setEditMsg({ text: "Phone number is required", type: "err" });
      return;
    }

    const payload = {
      name: editName.trim(),
      company: editCompany,
      phone: editPhone.trim(),
      licence: editLicence.trim(),
      lic_exp: editLicExp,
      years: Number(editYears) || 0,
      base: editBase.trim()
    };

    setIsSavingDriver(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/drivers/${editingDriver.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson?.error || "Failed to update driver");
      }
      const updated = await response.json();
      setDrivers(drivers.map((d) => (d.id === editingDriver.id ? updated : d)));
      showToastMsg("Driver profile updated successfully");
      setEditingDriver(null);
    } catch (err: any) {
      setEditMsg({ text: err.message || "Failed to save driver profile", type: "err" });
    } finally {
      setIsSavingDriver(false);
    }
  };

  // Add Driver
  const handleAddDriver = async () => {
    setEditMsg({ text: "", type: "" });
    if (!newName.trim() || !newPhone.trim()) {
      setEditMsg({ text: "Name and Phone are required", type: "err" });
      return;
    }

    const payload = {
      name: newName.trim(),
      company: newCompany,
      phone: newPhone.trim(),
      licence: newLicence.trim(),
      lic_exp: newLicExp,
      years: Number(newYears) || 0,
      base: newBase.trim()
    };

    setIsSavingDriver(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/drivers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson?.error || "Failed to create driver");
      }
      const created = await response.json();
      setDrivers([...drivers, created]);
      showToastMsg(`Driver ${created.name} added`);
      setIsAddingDriver(false);
      setNewName("");
      setNewPhone("");
      setNewLicence("");
    } catch (err: any) {
      setEditMsg({ text: err.message || "Failed to add driver", type: "err" });
    } finally {
      setIsSavingDriver(false);
    }
  };

  const driverFilterOptions = [
    { value: "all", label: "All Pool Drivers" },
    ...drivers.map((d) => ({
      value: d.name,
      label: `${d.name} (${d.co === "Tractrac" ? "TracTrac" : d.co === "Ikore" ? "Ikore" : "ChananHill"})`
    }))
  ];

  return (
    <section className="active">
      {/* HEADER SECTION */}
      <div style={{ background: "#F9FAFB", borderRadius: "12px", padding: "24px", marginBottom: "28px" }}>
        <h2 style={{ fontSize: "1.15rem", fontWeight: 600, color: "#111827", margin: "0 0 8px 0" }}>
          Driver Schedules & Trip Assignments
        </h2>
        <p style={{ fontSize: "0.82rem", color: "#6B7280", margin: 0, lineHeight: 1.5 }}>
          View and manage weekly driving assignments, trip tracking, odometer readings, and pool driver profiles.
          Assignments automatically update in real-time when approved.
        </p>
      </div>

      {/* FILTER CONTROLS & STATS BAR */}
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #E5E7EB",
          borderRadius: "14px",
          padding: "20px",
          marginBottom: "28px",
          display: "flex",
          flexDirection: "column",
          gap: "18px"
        }}
      >
        {/* Top row: Filter selectors */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "14px", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
            {/* Time Filter Pills */}
            <div style={{ display: "inline-flex", background: "#F3F4F6", padding: "3px", borderRadius: "8px" }}>
              <button
                type="button"
                onClick={() => setTimeFilter("today")}
                style={{
                  border: "none",
                  background: timeFilter === "today" ? "#FFFFFF" : "transparent",
                  color: timeFilter === "today" ? "#111827" : "#6B7280",
                  fontWeight: timeFilter === "today" ? 600 : 500,
                  padding: "6px 12px",
                  borderRadius: "6px",
                  fontSize: "0.8rem",
                  cursor: "pointer",
                  boxShadow: timeFilter === "today" ? "0 1px 2px rgba(0,0,0,0.06)" : "none"
                }}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setTimeFilter("this_week")}
                style={{
                  border: "none",
                  background: timeFilter === "this_week" ? "#FFFFFF" : "transparent",
                  color: timeFilter === "this_week" ? "#111827" : "#6B7280",
                  fontWeight: timeFilter === "this_week" ? 600 : 500,
                  padding: "6px 12px",
                  borderRadius: "6px",
                  fontSize: "0.8rem",
                  cursor: "pointer",
                  boxShadow: timeFilter === "this_week" ? "0 1px 2px rgba(0,0,0,0.06)" : "none"
                }}
              >
                This Week ({new Date(weekInfo.start).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} - {new Date(weekInfo.end).toLocaleDateString("en-GB", { day: "numeric", month: "short" })})
              </button>
              <button
                type="button"
                onClick={() => setTimeFilter("upcoming")}
                style={{
                  border: "none",
                  background: timeFilter === "upcoming" ? "#FFFFFF" : "transparent",
                  color: timeFilter === "upcoming" ? "#111827" : "#6B7280",
                  fontWeight: timeFilter === "upcoming" ? 600 : 500,
                  padding: "6px 12px",
                  borderRadius: "6px",
                  fontSize: "0.8rem",
                  cursor: "pointer",
                  boxShadow: timeFilter === "upcoming" ? "0 1px 2px rgba(0,0,0,0.06)" : "none"
                }}
              >
                All Upcoming
              </button>
              <button
                type="button"
                onClick={() => setTimeFilter("past")}
                style={{
                  border: "none",
                  background: timeFilter === "past" ? "#FFFFFF" : "transparent",
                  color: timeFilter === "past" ? "#111827" : "#6B7280",
                  fontWeight: timeFilter === "past" ? 600 : 500,
                  padding: "6px 12px",
                  borderRadius: "6px",
                  fontSize: "0.8rem",
                  cursor: "pointer",
                  boxShadow: timeFilter === "past" ? "0 1px 2px rgba(0,0,0,0.06)" : "none"
                }}
              >
                Past / History
              </button>
              <button
                type="button"
                onClick={() => setTimeFilter("all")}
                style={{
                  border: "none",
                  background: timeFilter === "all" ? "#FFFFFF" : "transparent",
                  color: timeFilter === "all" ? "#111827" : "#6B7280",
                  fontWeight: timeFilter === "all" ? 600 : 500,
                  padding: "6px 12px",
                  borderRadius: "6px",
                  fontSize: "0.8rem",
                  cursor: "pointer",
                  boxShadow: timeFilter === "all" ? "0 1px 2px rgba(0,0,0,0.06)" : "none"
                }}
              >
                All
              </button>
            </div>

            {/* Driver Filter dropdown */}
            {(isAdminUser || !isDriverUser) && (
              <div style={{ minWidth: "220px" }}>
                <Dropdown
                  options={driverFilterOptions}
                  value={selectedDriverFilter}
                  onChange={(val) => setSelectedDriverFilter(val)}
                  searchable={false}
                />
              </div>
            )}
          </div>

          {/* Search bar */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input
              type="text"
              placeholder="Search destination, staff, car..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: "8px 12px",
                fontSize: "0.82rem",
                border: "1px solid #D1D5DB",
                borderRadius: "8px",
                outline: "none",
                minWidth: "220px"
              }}
            />
          </div>
        </div>

        {/* Stats Strip */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: "12px",
            borderTop: "1px solid #F3F4F6",
            paddingTop: "14px"
          }}
        >
          <div style={{ background: "#F9FAFB", padding: "10px 14px", borderRadius: "8px" }}>
            <div style={{ fontSize: "0.72rem", color: "#6B7280", fontWeight: 600, textTransform: "uppercase" }}>Total Trips</div>
            <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "#111827", marginTop: "2px" }}>{stats.total}</div>
          </div>
          <div style={{ background: "#F0FDF4", padding: "10px 14px", borderRadius: "8px" }}>
            <div style={{ fontSize: "0.72rem", color: "#16A34A", fontWeight: 600, textTransform: "uppercase" }}>Completed</div>
            <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "#15803D", marginTop: "2px" }}>{stats.completed}</div>
          </div>
          <div style={{ background: "#FEF3C7", padding: "10px 14px", borderRadius: "8px" }}>
            <div style={{ fontSize: "0.72rem", color: "#D97706", fontWeight: 600, textTransform: "uppercase" }}>In Progress</div>
            <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "#B45309", marginTop: "2px" }}>{stats.inProgress}</div>
          </div>
          <div style={{ background: "#EFF6FF", padding: "10px 14px", borderRadius: "8px" }}>
            <div style={{ fontSize: "0.72rem", color: "#2563EB", fontWeight: 600, textTransform: "uppercase" }}>Distance Covered</div>
            <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "#1D4ED8", marginTop: "2px" }}>{fmtN(stats.totalKm)} km</div>
          </div>
        </div>
      </div>

      {/* SCHEDULED TRIPS LIST */}
      <div style={{ marginBottom: "40px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "#111827", margin: 0 }}>
            {timeFilter === "today"
              ? "Trips Scheduled for Today"
              : timeFilter === "this_week"
              ? "Trips Scheduled for This Week"
              : timeFilter === "upcoming"
              ? "All Upcoming Trips"
              : timeFilter === "past"
              ? "Completed & Past Trips"
              : "All Assigned Trips"}
            {selectedDriverFilter !== "all" ? ` — ${selectedDriverFilter}` : ""}
          </h3>
          <span style={{ fontSize: "0.78rem", color: "#6B7280" }}>
            Showing {filteredTrips.length} trip{filteredTrips.length === 1 ? "" : "s"}
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {filteredTrips.map((t) => {
            const c = cars.find((car) => car.id === t.carId);
            const isToday = isBookingOnDate(t.date, todayISO);

            return (
              <div
                key={t.id}
                style={{
                  background: "#FFFFFF",
                  border: isToday ? "1.5px solid var(--ik)" : "1px solid #E5E7EB",
                  borderRadius: "12px",
                  padding: "18px 20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.03)"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 650, fontSize: "0.95rem", color: "#111827" }}>
                        {t.date} · {t.start} – {t.end}
                      </span>
                      {isToday && (
                        <span
                          style={{
                            fontSize: "0.68rem",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            background: "#DCFCE7",
                            color: "#16A34A",
                            padding: "2px 8px",
                            borderRadius: "999px"
                          }}
                        >
                          Today
                        </span>
                      )}
                      <span className={`co-chip ${t.co === "Tractrac" ? "tt" : t.co === "Ikore" ? "ik" : "ch"}`}>
                        {t.co === "Tractrac" ? "TracTrac" : t.co === "Ikore" ? "Ikore" : "ChananHill"}
                      </span>
                    </div>

                    <div style={{ fontSize: "0.85rem", color: "#374151", marginTop: "4px" }}>
                      <strong>{c?.plate && c.plate !== "TBD" ? `${c.plate} - ` : ""}{c?.name || t.mode}</strong> · Destination: <strong>{t.dest}</strong> · For: {t.staff}
                      {t.purpose && <span style={{ color: "#6B7280" }}> ({t.purpose})</span>}
                    </div>

                    <div style={{ fontSize: "0.75rem", color: "#6B7280", marginTop: "3px" }}>
                      Assigned Driver: <strong style={{ color: "#1F2937" }}>{t.driver}</strong> · Approver: {t.manager}
                    </div>
                  </div>

                  <div>
                    {t.endOdo ? (
                      <span className="status-pill free">Completed</span>
                    ) : t.startOdo ? (
                      <span className="status-pill trip">In progress</span>
                    ) : (
                      <span className="status-pill free">Approved</span>
                    )}
                  </div>
                </div>

                {/* Odometer Tracking Section */}
                <div
                  style={{
                    background: "#F9FAFB",
                    borderRadius: "8px",
                    padding: "10px 14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "10px"
                  }}
                >
                  {t.endOdo ? (
                    <div style={{ fontSize: "0.85rem", color: "#16A34A", fontWeight: 600 }}>
                      ✓ {fmtN(t.startOdo || 0)} → {fmtN(t.endOdo)} km ({fmtN(t.endOdo - (t.startOdo || 0))} km covered)
                    </div>
                  ) : t.startOdo ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "0.82rem", color: "#D97706", fontWeight: 600 }}>
                        Started at {fmtN(t.startOdo)} km
                      </span>
                      <input
                        type="number"
                        min={(t.startOdo || 0) + 1}
                        placeholder="Odometer at finish (km)"
                        value={mileInputs[t.id] || ""}
                        style={{
                          padding: "6px 10px",
                          borderRadius: "6px",
                          border: "1px solid #D1D5DB",
                          fontSize: "0.82rem",
                          outline: "none"
                        }}
                        onChange={(e) =>
                          setMileInputs({ ...mileInputs, [t.id]: e.target.value })
                        }
                      />
                      <button
                        type="button"
                        className="btn small"
                        onClick={() => handleEndTrip(t.id, Number(mileInputs[t.id]))}
                      >
                        End trip
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "0.8rem", color: "#6B7280" }}>
                        Vehicle current odo: <strong>{fmtN(c?.odo || 0)} km</strong>
                      </span>
                      <input
                        type="number"
                        min="0"
                        placeholder={`Start km (${fmtN(c?.odo || 0)})`}
                        value={mileInputs[t.id] !== undefined ? mileInputs[t.id] : c?.odo || 0}
                        style={{
                          padding: "6px 10px",
                          borderRadius: "6px",
                          border: "1px solid #D1D5DB",
                          fontSize: "0.82rem",
                          outline: "none"
                        }}
                        onChange={(e) =>
                          setMileInputs({ ...mileInputs, [t.id]: e.target.value })
                        }
                      />
                      <button
                        type="button"
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
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {filteredTrips.length === 0 && (
            <div
              style={{
                padding: "36px",
                background: "#F9FAFB",
                borderRadius: "12px",
                textAlign: "center",
                color: "#6B7280",
                fontSize: "0.88rem"
              }}
            >
              No trips found matching the selected time and driver filters.
            </div>
          )}
        </div>
      </div>

      {/* DRIVER REGISTRY CARDS */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "18px",
          flexWrap: "wrap",
          gap: "12px"
        }}
      >
        <div className="panel" style={{ maxWidth: "760px", margin: 0, flex: 1 }}>
          <h2>Driver Profiles & Contact Registry</h2>
          <p className="desc">
            Driver profiles, contact details, licensing, and experience. Click &ldquo;Edit&rdquo; on any profile to update
            licence records or phone numbers.
          </p>
        </div>
        {isAdminUser && (
          <button
            type="button"
            onClick={() => {
              setIsAddingDriver(true);
              setEditMsg({ text: "", type: "" });
            }}
            style={{
              background: "#1F2937",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "8px",
              padding: "10px 16px",
              fontSize: "0.85rem",
              fontWeight: 500,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <IconPlus size={16} />
            <span>Add Driver</span>
          </button>
        )}
      </div>

      <div className="drv-grid">
        {visibleDrivers.map((d) => {
          const exp = d.licExp ? new Date(d.licExp) : new Date();
          const days = Math.round((exp.getTime() - new Date().getTime()) / 86400000);
          const expCls = days < 60 ? "lic-warn" : "lic-ok";
          const expNote = days < 0 ? " - expired!" : days < 60 ? ` - renew soon (${days} days)` : "";

          // Count this driver's trips this week
          const weekTrips = bookings.filter(
            (b) =>
              b.driver === d.name &&
              isBookingInDateRange(b.date, weekInfo.start, weekInfo.end) &&
              b.status !== "declined" &&
              isOfficeTrip(b)
          );

          const todayTrips = bookings.filter(
            (b) =>
              b.driver === d.name &&
              isBookingOnDate(b.date, todayISO) &&
              b.status === "approved" &&
              isOfficeTrip(b)
          );

          const lastFuel = fuelLogs
            .slice()
            .reverse()
            .find((f) => f.driver === d.name);

          const canEdit = isAdminUser || (currentUser && currentUser.name.toLowerCase() === d.name.toLowerCase());

          return (
            <div className="drv-card" key={d.id || d.name} style={{ position: "relative" }}>
              <div className={`drv-head ${d.co === "Tractrac" ? "tt" : d.co === "Ikore" ? "ik" : "ch"}`}>
                <div className="drv-avatar">{d.name[0]}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h3>{d.name}</h3>
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(d)}
                        title="Edit Driver Profile"
                        style={{
                          background: "rgba(255, 255, 255, 0.85)",
                          border: "1px solid rgba(0, 0, 0, 0.1)",
                          borderRadius: "6px",
                          padding: "4px 8px",
                          fontSize: "0.72rem",
                          fontWeight: 600,
                          color: "#1F2937",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px"
                        }}
                      >
                        <IconEdit size={13} />
                        <span>Edit</span>
                      </button>
                    )}
                  </div>
                  <div className="role">
                    {d.co === "Tractrac" ? "TracTrac" : d.co === "Ikore" ? "Ikore" : "ChananHill"} pool driver · {d.years} yrs experience
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
                  <span className="k">This Week</span>
                  <span className="v" style={{ fontWeight: 600, color: "#1F2937" }}>
                    {weekTrips.length} trip{weekTrips.length === 1 ? "" : "s"} scheduled
                  </span>
                </div>
                <div className="drv-row">
                  <span className="k">Last fuel entry</span>
                  <span className="v">
                    {lastFuel
                      ? `${cars.find((c) => c.id === lastFuel.carId)?.plate}, ${lastFuel.litres} L`
                      : "-"}
                  </span>
                </div>
              </div>
              <div className="drv-today">
                Today:{" "}
                {todayTrips.length > 0 ? (
                  todayTrips.map((t) => (
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

      {/* EDIT DRIVER MODAL */}
      <AnimatePresence>
        {editingDriver && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0, 0, 0, 0.45)",
              backdropFilter: "blur(4px)",
              zIndex: 100,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px"
            }}
            onClick={() => !isSavingDriver && setEditingDriver(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              style={{
                background: "#FFFFFF",
                borderRadius: "16px",
                padding: "28px",
                width: "100%",
                maxWidth: "500px",
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)"
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <div>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "#111827", margin: 0 }}>
                    Edit Driver Profile
                  </h3>
                  <p style={{ fontSize: "0.78rem", color: "#6B7280", margin: "4px 0 0 0" }}>
                    Update contact and licensing details for {editingDriver.name}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => !isSavingDriver && setEditingDriver(null)}
                  style={{
                    background: "#F3F4F6",
                    border: "none",
                    borderRadius: "50%",
                    width: "32px",
                    height: "32px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    color: "#6B7280"
                  }}
                >
                  <IconX size={18} />
                </button>
              </div>

              {editMsg.text && (
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: "8px",
                    fontSize: "0.82rem",
                    marginBottom: "16px",
                    background: editMsg.type === "err" ? "#FEF2F2" : "#F0FDF4",
                    border: `1px solid ${editMsg.type === "err" ? "#FEE2E2" : "#BBF7D0"}`,
                    color: editMsg.type === "err" ? "#991B1B" : "#15803D"
                  }}
                >
                  {editMsg.text}
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 500, color: "#4B5563", marginBottom: "6px" }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      fontSize: "0.85rem",
                      border: "1.5px solid #E5E7EB",
                      borderRadius: "8px",
                      outline: "none"
                    }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 500, color: "#4B5563", marginBottom: "6px" }}>
                      Company
                    </label>
                    <Dropdown
                      options={[
                        { value: "Tractrac", label: "TracTrac" },
                        { value: "Ikore", label: "Ikore" },
                        { value: "ChananHill", label: "ChananHill" }
                      ]}
                      value={editCompany}
                      onChange={(val: any) => setEditCompany(val)}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 500, color: "#4B5563", marginBottom: "6px" }}>
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        fontSize: "0.85rem",
                        border: "1.5px solid #E5E7EB",
                        borderRadius: "8px",
                        outline: "none"
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 500, color: "#4B5563", marginBottom: "6px" }}>
                      Licence Number
                    </label>
                    <input
                      type="text"
                      value={editLicence}
                      onChange={(e) => setEditLicence(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        fontSize: "0.85rem",
                        border: "1.5px solid #E5E7EB",
                        borderRadius: "8px",
                        outline: "none"
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 500, color: "#4B5563", marginBottom: "6px" }}>
                      Licence Expiry
                    </label>
                    <input
                      type="date"
                      value={editLicExp}
                      onChange={(e) => setEditLicExp(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        fontSize: "0.85rem",
                        border: "1.5px solid #E5E7EB",
                        borderRadius: "8px",
                        outline: "none"
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 500, color: "#4B5563", marginBottom: "6px" }}>
                      Experience (Yrs)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={editYears}
                      onChange={(e) => setEditYears(e.target.value === "" ? "" : Number(e.target.value))}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        fontSize: "0.85rem",
                        border: "1.5px solid #E5E7EB",
                        borderRadius: "8px",
                        outline: "none"
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 500, color: "#4B5563", marginBottom: "6px" }}>
                      Base Location
                    </label>
                    <input
                      type="text"
                      value={editBase}
                      onChange={(e) => setEditBase(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        fontSize: "0.85rem",
                        border: "1.5px solid #E5E7EB",
                        borderRadius: "8px",
                        outline: "none"
                      }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
                <button
                  type="button"
                  disabled={isSavingDriver}
                  onClick={() => setEditingDriver(null)}
                  style={{
                    background: "#F3F4F6",
                    border: "none",
                    borderRadius: "8px",
                    padding: "10px 18px",
                    fontSize: "0.85rem",
                    fontWeight: 500,
                    color: "#374151",
                    cursor: "pointer"
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSavingDriver}
                  onClick={handleSaveDriver}
                  style={{
                    background: "#1F2937",
                    border: "none",
                    borderRadius: "8px",
                    padding: "10px 20px",
                    fontSize: "0.85rem",
                    fontWeight: 500,
                    color: "#FFFFFF",
                    cursor: isSavingDriver ? "not-allowed" : "pointer"
                  }}
                >
                  {isSavingDriver ? "Saving..." : "Save Profile"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADD DRIVER MODAL */}
      <AnimatePresence>
        {isAddingDriver && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0, 0, 0, 0.45)",
              backdropFilter: "blur(4px)",
              zIndex: 100,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px"
            }}
            onClick={() => !isSavingDriver && setIsAddingDriver(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              style={{
                background: "#FFFFFF",
                borderRadius: "16px",
                padding: "28px",
                width: "100%",
                maxWidth: "500px",
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)"
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <div>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "#111827", margin: 0 }}>
                    Add New Driver
                  </h3>
                  <p style={{ fontSize: "0.78rem", color: "#6B7280", margin: "4px 0 0 0" }}>
                    Register a new pool driver in the fleet system
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => !isSavingDriver && setIsAddingDriver(false)}
                  style={{
                    background: "#F3F4F6",
                    border: "none",
                    borderRadius: "50%",
                    width: "32px",
                    height: "32px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    color: "#6B7280"
                  }}
                >
                  <IconX size={18} />
                </button>
              </div>

              {editMsg.text && (
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: "8px",
                    fontSize: "0.82rem",
                    marginBottom: "16px",
                    background: editMsg.type === "err" ? "#FEF2F2" : "#F0FDF4",
                    border: `1px solid ${editMsg.type === "err" ? "#FEE2E2" : "#BBF7D0"}`,
                    color: editMsg.type === "err" ? "#991B1B" : "#15803D"
                  }}
                >
                  {editMsg.text}
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 500, color: "#4B5563", marginBottom: "6px" }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Samuel Okon"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      fontSize: "0.85rem",
                      border: "1.5px solid #E5E7EB",
                      borderRadius: "8px",
                      outline: "none"
                    }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 500, color: "#4B5563", marginBottom: "6px" }}>
                      Company
                    </label>
                    <Dropdown
                      options={[
                        { value: "Tractrac", label: "TracTrac" },
                        { value: "Ikore", label: "Ikore" },
                        { value: "ChananHill", label: "ChananHill" }
                      ]}
                      value={newCompany}
                      onChange={(val: any) => setNewCompany(val)}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 500, color: "#4B5563", marginBottom: "6px" }}>
                      Phone Number
                    </label>
                    <input
                      type="text"
                      placeholder="0801 234 5678"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        fontSize: "0.85rem",
                        border: "1.5px solid #E5E7EB",
                        borderRadius: "8px",
                        outline: "none"
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 500, color: "#4B5563", marginBottom: "6px" }}>
                      Licence Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. ABJ 12-34567 BB1"
                      value={newLicence}
                      onChange={(e) => setNewLicence(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        fontSize: "0.85rem",
                        border: "1.5px solid #E5E7EB",
                        borderRadius: "8px",
                        outline: "none"
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 500, color: "#4B5563", marginBottom: "6px" }}>
                      Licence Expiry
                    </label>
                    <input
                      type="date"
                      value={newLicExp}
                      onChange={(e) => setNewLicExp(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        fontSize: "0.85rem",
                        border: "1.5px solid #E5E7EB",
                        borderRadius: "8px",
                        outline: "none"
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 500, color: "#4B5563", marginBottom: "6px" }}>
                      Experience (Yrs)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={newYears}
                      onChange={(e) => setNewYears(e.target.value === "" ? "" : Number(e.target.value))}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        fontSize: "0.85rem",
                        border: "1.5px solid #E5E7EB",
                        borderRadius: "8px",
                        outline: "none"
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 500, color: "#4B5563", marginBottom: "6px" }}>
                      Base Location
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Utako office"
                      value={newBase}
                      onChange={(e) => setNewBase(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        fontSize: "0.85rem",
                        border: "1.5px solid #E5E7EB",
                        borderRadius: "8px",
                        outline: "none"
                      }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
                <button
                  type="button"
                  disabled={isSavingDriver}
                  onClick={() => setIsAddingDriver(false)}
                  style={{
                    background: "#F3F4F6",
                    border: "none",
                    borderRadius: "8px",
                    padding: "10px 18px",
                    fontSize: "0.85rem",
                    fontWeight: 500,
                    color: "#374151",
                    cursor: "pointer"
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSavingDriver}
                  onClick={handleAddDriver}
                  style={{
                    background: "#1F2937",
                    border: "none",
                    borderRadius: "8px",
                    padding: "10px 20px",
                    fontSize: "0.85rem",
                    fontWeight: 500,
                    color: "#FFFFFF",
                    cursor: isSavingDriver ? "not-allowed" : "pointer"
                  }}
                >
                  {isSavingDriver ? "Saving..." : "Add Driver"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}


