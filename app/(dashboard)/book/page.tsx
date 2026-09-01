"use client";

import React, { useState, useEffect } from "react";
import { useFleet, STAFF } from "../layout";
import { API_BASE_URL } from "../../config";
import Dropdown from "../../components/Dropdown";
import { motion, AnimatePresence } from "framer-motion";
import { IconEdit, IconTrash, IconX, IconCheck, IconAlertTriangle } from "@tabler/icons-react";
import { isBookingOnDate, getBookingDayTimes, getBookingDayTimesForVal, getOverlappingDates, mins, checkBookingConflict } from "../../utils";

const DAY_START = 8;
const DAY_END = 22;

export default function BookCarPage() {
  const {
    currentUser,
    cars,
    bookings,
    setBookings,
    drivers,
    nextBookingId,
    setNextBookingId,
    showToastMsg
  } = useFleet();

  const todayISO = new Date().toISOString().slice(0, 10);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const totalPages = Math.ceil(bookings.length / itemsPerPage);
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [bookings.length, totalPages, currentPage]);

  const [bkCar, setBkCar] = useState<number | string>(1);
  const [bkStartDate, setBkStartDate] = useState(todayISO);
  const [bkEndDate, setBkEndDate] = useState(todayISO);
  const [bkStart, setBkStart] = useState("08:00");
  const [bkEnd, setBkEnd] = useState("10:00");
  const [bkManager, setBkManager] = useState("");
  const [bkDest, setBkDest] = useState("");
  const [bkDriver, setBkDriver] = useState("Assign any available driver");
  const [bkPurpose, setBkPurpose] = useState("");
  const [bkPassengers, setBkPassengers] = useState<number | "">(1);
  const [bkPassengerNames, setBkPassengerNames] = useState("");
  const [bookMsg, setBookMsg] = useState({ text: "", type: "" });
  const [isBookPending, setIsBookPending] = useState(false);

  // Edit booking state
  const [editingBooking, setEditingBooking] = useState<any | null>(null);
  const [editCar, setEditCar] = useState<number | string>(1);
  const [editStartDate, setEditStartDate] = useState(todayISO);
  const [editEndDate, setEditEndDate] = useState(todayISO);
  const [editStart, setEditStart] = useState("08:00");
  const [editEnd, setEditEnd] = useState("10:00");
  const [editManager, setEditManager] = useState("");
  const [editDest, setEditDest] = useState("");
  const [editDriver, setEditDriver] = useState("Assign any available driver");
  const [editPurpose, setEditPurpose] = useState("");
  const [editMsg, setEditMsg] = useState({ text: "", type: "" });
  const [isEditPending, setIsEditPending] = useState(false);

  // Delete booking state
  const [deletingBooking, setDeletingBooking] = useState<any | null>(null);
  const [isDeletePending, setIsDeletePending] = useState(false);

  const getCarCapacity = (name: string): number => {
    const lower = name.toLowerCase();
    if (lower.includes("hiace") || lower.includes("bus")) return 15;
    if (lower.includes("sienna") || lower.includes("highlander")) return 7;
    return 5;
  };

  const getRecommendation = () => {
    const passVal = Number(bkPassengers) || 1;
    if (passVal > 7) {
      return {
        text: "Toyota Hiace Bus (15 seats) is recommended for larger groups.",
        carName: "Toyota Hiace Bus"
      };
    } else if (passVal > 5) {
      return {
        text: "Toyota Sienna or Toyota Highlander (7 seats) is recommended.",
        carName: "Sienna / Highlander"
      };
    } else {
      return {
        text: "Any vehicle (JAC T9, Toyota Sienna, or Toyota Highlander) is suitable.",
        carName: "Any"
      };
    }
  };

  const selectedCar = typeof bkCar === "number" ? cars.find((c) => c.id === bkCar) : null;
  const selectedCarCapacity = selectedCar ? getCarCapacity(selectedCar.name) : 5;
  const isOverCapacity = (Number(bkPassengers) || 1) > selectedCarCapacity;

  const isDriverUser = currentUser ? ["Peter Agbo", "Ameh Friday", "Louis Ogbuneke"].includes(currentUser.name) : false;
  const isAdminUser = currentUser?.name === "Godsfavour Nyoyoko";



  const fmtN = (n: number): string => {
    return n.toLocaleString("en-NG");
  };

  const isOfficeTrip = (b: any) => !b.mode || b.mode === "Office car";

  useEffect(() => {
    if (currentUser) {
      const apprs = STAFF.filter((s) => (s.co === currentUser.co && s.approver) || s.name === "Godsfavour Nyoyoko");
      if (apprs.length > 0) {
        setBkManager(apprs[0].name);
      }
    }
  }, [currentUser]);

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookMsg({ text: "", type: "" });
    if (!currentUser) return;

    if (!bkStartDate || !bkEndDate || !bkStart || !bkEnd) {
      setBookMsg({ text: "Please fill in the start date, end date, start time, and end time.", type: "err" });
      return;
    }
    if (bkEndDate < bkStartDate) {
      setBookMsg({ text: "End date cannot be before the start date.", type: "err" });
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
    if (bkStartDate === bkEndDate && mins(bkEnd) <= mins(bkStart)) {
      setBookMsg({ text: "End time must be after the start time for a single day booking.", type: "err" });
      return;
    }

    const isThirdParty = bkCar === "bolt" || bkCar === "car_hire";
    const targetCar = typeof bkCar === "number" ? cars.find((c) => c.id === bkCar) : null;
    const finalCarId = typeof bkCar === "number" ? bkCar : null;
    const finalMode = bkCar === "bolt" ? "Bolt" : bkCar === "car_hire" ? "Car hire" : "Office car";
    const finalDriver = bkCar === "bolt" ? "Bolt Driver" : bkCar === "car_hire" ? "Car Hire Driver" : bkDriver;

    const conflict = checkBookingConflict({
      carId: finalCarId,
      mode: finalMode,
      driver: finalDriver,
      startDate: bkStartDate,
      endDate: bkEndDate,
      startTime: bkStart,
      endTime: bkEnd,
      bookings,
      cars
    });

    if (conflict.hasConflict) {
      setBookMsg({
        text: conflict.errorMessage || "Schedule conflict detected.",
        type: "err"
      });
      return;
    }

    const numPass = Number(bkPassengers) || 1;
    if (numPass < 1) {
      setBookMsg({ text: "Number of persons going must be at least 1.", type: "err" });
      return;
    }

    const finalDate = bkStartDate === bkEndDate ? bkStartDate : `${bkStartDate} to ${bkEndDate}`;
    const passLabel = numPass > 1 ? ` (${numPass} persons)` : " (1 person)";
    const passNamesSuffix = numPass > 1 && bkPassengerNames.trim() ? ` (With: ${bkPassengerNames.trim()})` : "";
    const finalPurpose = bkPurpose.trim() + passLabel + passNamesSuffix;

    const newBkFields = {
      carId: finalCarId,
      mode: finalMode,
      date: finalDate,
      start: bkStart,
      end: bkEnd,
      staff: currentUser.name + (isDriverUser ? " (Driver)" : ""),
      dept: currentUser.dept || "None",
      co: currentUser.co,
      dest: bkDest.trim() || "None",
      driver: finalDriver,
      purpose: finalPurpose,
      manager: bkManager
    };

    setIsBookPending(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(newBkFields)
      });

      if (!response.ok) {
        throw new Error("Failed to create booking.");
      }

      const createdBooking = await response.json();
      setBookings([...bookings, createdBooking]);

      const labelVeh = bkCar === "bolt" ? "Bolt ride request" : bkCar === "car_hire" ? "Car hire request" : (targetCar?.plate || "Vehicle");
      setBookMsg({
        text: `Request sent. ${labelVeh} is held for you, ${finalDate} (${bkStart} - ${bkEnd}), awaiting approval from ${bkManager}.`,
        type: "ok"
      });
      setBkDest("");
      setBkPurpose("");
      setBkPassengers(1);
      setBkPassengerNames("");
      showToastMsg("Request sent for approval");
    } catch (err) {
      setBookMsg({ text: "Failed to send request to the server.", type: "err" });
    } finally {
      setIsBookPending(false);
    }
  };

  const vehicleOptions = [
    ...cars.map((c) => ({
      value: c.id,
      label: `${c.plate !== "TBD" ? c.plate + " - " : ""}${c.name} (${c.co === "Tractrac" ? "TracTrac" : c.co === "Ikore" ? "Ikore" : "ChananHill"})${c.shop ? " (In workshop)" : ""}`
    })),
    { value: "bolt", label: "Bolt (Ride-hailing service)" },
    { value: "car_hire", label: "Car Hire (Rent-a-car service)" }
  ];

  const approverOptions = currentUser
    ? STAFF.filter((s) => (s.co === currentUser.co && s.approver) || s.name === "Godsfavour Nyoyoko").map((a) => ({
      value: a.name,
      label: a.name === "Godsfavour Nyoyoko"
        ? `${a.name} - Fleet manager (approves both)`
        : `${a.name} - ${a.designation || "Approver"}`
    }))
    : [];

  const driverOptions = [
    { value: "Assign any available driver", label: "Assign any available driver" },
    ...drivers.map((d) => ({
      value: d.name,
      label: `${d.name} (${d.co === "Tractrac" ? "TracTrac" : d.co === "Ikore" ? "Ikore" : "ChananHill"})`
    })),
    { value: "Self-drive (approved staff)", label: "Self-drive (approved staff)" }
  ];

  const handleOpenEdit = (b: any) => {
    setEditingBooking(b);
    setEditMsg({ text: "", type: "" });
    if (b.mode === "Bolt") setEditCar("bolt");
    else if (b.mode === "Car hire") setEditCar("car_hire");
    else setEditCar(b.carId || 1);

    const [sDate, eDate] = b.date.includes(" to ") ? b.date.split(" to ") : [b.date, b.date];
    setEditStartDate(sDate);
    setEditEndDate(eDate);
    setEditStart(b.start || "08:00");
    setEditEnd(b.end || "10:00");
    setEditManager(b.manager || "");
    setEditDest(b.dest || "");
    setEditDriver(b.driver || "Assign any available driver");
    setEditPurpose(b.purpose || "");
  };

  const handleSaveEdit = async () => {
    if (!editingBooking) return;
    setEditMsg({ text: "", type: "" });

    if (!editStartDate || !editEndDate || !editStart || !editEnd) {
      setEditMsg({ text: "Please fill in the start date, end date, start time, and end time.", type: "err" });
      return;
    }
    if (editEndDate < editStartDate) {
      setEditMsg({ text: "End date cannot be before the start date.", type: "err" });
      return;
    }
    if (!editManager) {
      setEditMsg({ text: "Select the approver for this request.", type: "err" });
      return;
    }
    if (mins(editStart) < DAY_START * 60 || mins(editEnd) > DAY_END * 60) {
      setEditMsg({ text: "Bookings must fall between 08:00 and 22:00.", type: "err" });
      return;
    }
    if (editStartDate === editEndDate && mins(editEnd) <= mins(editStart)) {
      setEditMsg({ text: "End time must be after start time.", type: "err" });
      return;
    }

    const finalDate = editStartDate === editEndDate ? editStartDate : `${editStartDate} to ${editEndDate}`;
    const finalCarId = typeof editCar === "number" ? editCar : null;
    const finalMode = editCar === "bolt" ? "Bolt" : editCar === "car_hire" ? "Car hire" : "Office car";
    const finalDriver = editCar === "bolt" ? "Bolt Driver" : editCar === "car_hire" ? "Car Hire Driver" : editDriver;

    const conflict = checkBookingConflict({
      bookingId: editingBooking.id,
      carId: finalCarId,
      mode: finalMode,
      driver: finalDriver,
      startDate: editStartDate,
      endDate: editEndDate,
      startTime: editStart,
      endTime: editEnd,
      bookings,
      cars
    });

    if (conflict.hasConflict) {
      setEditMsg({
        text: conflict.errorMessage || "Schedule conflict detected.",
        type: "err"
      });
      return;
    }

    const updatePayload = {
      carId: finalCarId,
      mode: finalMode,
      date: finalDate,
      start: editStart,
      end: editEnd,
      dest: editDest.trim() || "None",
      driver: finalDriver,
      purpose: editPurpose.trim(),
      manager: editManager
    };

    setIsEditPending(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/bookings/${editingBooking.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatePayload)
      });
      if (!response.ok) throw new Error();
      const updated = await response.json();
      setBookings(bookings.map((b) => (b.id === editingBooking.id ? updated : b)));
      showToastMsg("Booking request updated");
      setEditingBooking(null);
    } catch (err) {
      setEditMsg({ text: "Failed to update booking on server.", type: "err" });
    } finally {
      setIsEditPending(false);
    }
  };

  const handleDeleteBooking = async (id: number) => {
    setIsDeletePending(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/bookings/${id}`, {
        method: "DELETE"
      });
      if (!response.ok) throw new Error();
      setBookings(bookings.filter((b) => b.id !== id));
      showToastMsg("Booking request canceled and deleted");
      setDeletingBooking(null);
    } catch (err) {
      showToastMsg("Failed to delete booking request");
    } finally {
      setIsDeletePending(false);
    }
  };

  return (
    <section className="active">
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 340px", gap: "32px", marginBottom: "40px" }}>

        {/* LEFT COLUMN: The Booking Form */}
        <div style={{ background: "#FFFFFF", border: "1.5px solid #E5E7EB", borderRadius: "12px", padding: "28px" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 500, color: "#111827", marginBottom: "20px" }}>
            Book a vehicle
          </h3>

          {bookMsg.text && (
            <div
              style={{
                padding: "12px 16px",
                borderRadius: "8px",
                fontSize: "0.85rem",
                marginBottom: "20px",
                background: bookMsg.type === "err" ? "#FEF2F2" : "#F0FDF4",
                border: `1px solid ${bookMsg.type === "err" ? "#FEE2E2" : "#BBF7D0"}`,
                color: bookMsg.type === "err" ? "#991B1B" : "#15803D"
              }}
            >
              {bookMsg.text}
            </div>
          )}

          <form onSubmit={handleBookingSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

            {/* Form Row 1 */}
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "20px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "#4B5563", marginBottom: "6px" }}>
                  Requested by
                </label>
                <input
                  type="text"
                  value={currentUser ? currentUser.name + (isDriverUser ? " (Driver)" : "") : "Sign in first"}
                  readOnly
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    fontSize: "0.88rem",
                    border: "1.5px solid #E5E7EB",
                    borderRadius: "10px",
                    background: "#F9FAFB",
                    color: "#9CA3AF",
                    outline: "none"
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "#4B5563", marginBottom: "6px" }}>
                  Department / company
                </label>
                <input
                  type="text"
                  value={currentUser ? `${currentUser.dept && currentUser.dept !== "-" && currentUser.dept !== "None" ? currentUser.dept + " · " : ""}${currentUser.co === "Tractrac" ? "TracTrac" : currentUser.co === "Ikore" ? "Ikore" : "ChananHill"}` : ""}
                  readOnly
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    fontSize: "0.88rem",
                    border: "1.5px solid #E5E7EB",
                    borderRadius: "10px",
                    background: "#F9FAFB",
                    color: "#9CA3AF",
                    outline: "none"
                  }}
                />
              </div>
            </div>

            {/* Form Row 2: Vehicle & Persons */}
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : (Number(bkPassengers) || 1) > 1 ? "1.2fr 1fr 1.5fr" : "1.2fr 1fr", gap: "20px", alignItems: "end" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "#4B5563", marginBottom: "6px" }}>
                  Vehicle
                </label>
                <Dropdown
                  options={vehicleOptions}
                  value={bkCar}
                  onChange={(val) => setBkCar(val === "bolt" || val === "car_hire" ? val : Number(val))}
                  placeholder="Select vehicle..."
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "#4B5563", marginBottom: "6px" }}>
                  Number of persons going
                </label>
                <input
                  type="number"
                  min="1"
                  max="15"
                  value={bkPassengers}
                  onChange={(e) => {
                    const val = e.target.value;
                    setBkPassengers(val === "" ? "" : Number(val));
                  }}
                  style={{
                    width: "100%",
                    padding: "11px 14px",
                    fontSize: "0.88rem",
                    border: "1.5px solid #E5E7EB",
                    borderRadius: "10px",
                    background: "#FFFFFF",
                    color: "#111827",
                    outline: "none"
                  }}
                />
              </div>
              {(Number(bkPassengers) || 1) > 1 && (
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", color: "#4B5563", marginBottom: "6px" }}>
                    Names of other passengers (comma-separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. John Doe, Jane Smith"
                    value={bkPassengerNames}
                    onChange={(e) => setBkPassengerNames(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "11px 14px",
                      fontSize: "0.88rem",
                      border: "1.5px solid #E5E7EB",
                      borderRadius: "10px",
                      background: "#FFFFFF",
                      color: "#111827",
                      outline: "none"
                    }}
                  />
                </div>
              )}
            </div>

            {/* Recommendation & Warning Alerts */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ 
                fontSize: "0.8rem", 
                padding: "10px 14px", 
                borderRadius: "8px", 
                background: "#F0F9FF", 
                border: "1px solid #BAE6FD", 
                color: "#0369A1",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}>
                <span style={{ fontSize: "1.1rem" }}>💡</span>
                <span><strong>Recommendation:</strong> {getRecommendation().text}</span>
              </div>

              {isOverCapacity && (
                <div style={{ 
                  fontSize: "0.8rem", 
                  padding: "10px 14px", 
                  borderRadius: "8px", 
                  background: "#FFFBEB", 
                  border: "1px solid #FDE68A", 
                  color: "#B45309",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}>
                  <span style={{ fontSize: "1.1rem" }}>⚠️</span>
                  <span><strong>Warning:</strong> Selected vehicle ({selectedCar?.name}) may be too small for {bkPassengers} passengers (Capacity: {selectedCarCapacity} seats).</span>
                </div>
              )}
            </div>

            {/* Form Row 3: Date & Times */}
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr 1fr", gap: "20px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "#4B5563", marginBottom: "6px" }}>
                  Start date
                </label>
                <input
                  type="date"
                  min={todayISO}
                  value={bkStartDate}
                  onChange={(e) => {
                    setBkStartDate(e.target.value);
                    if (bkEndDate < e.target.value) {
                      setBkEndDate(e.target.value);
                    }
                  }}
                  style={{
                    width: "100%",
                    padding: "11px 14px",
                    fontSize: "0.88rem",
                    border: "1.5px solid #E5E7EB",
                    borderRadius: "10px",
                    background: "#FFFFFF",
                    color: "#111827",
                    outline: "none"
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "#4B5563", marginBottom: "6px" }}>
                  End date
                </label>
                <input
                  type="date"
                  min={bkStartDate || todayISO}
                  value={bkEndDate}
                  onChange={(e) => setBkEndDate(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "11px 14px",
                    fontSize: "0.88rem",
                    border: "1.5px solid #E5E7EB",
                    borderRadius: "10px",
                    background: "#FFFFFF",
                    color: "#111827",
                    outline: "none"
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "#4B5563", marginBottom: "6px" }}>
                  Start time
                </label>
                <input
                  type="time"
                  min="08:00"
                  max="22:00"
                  step="900"
                  value={bkStart}
                  onChange={(e) => setBkStart(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "11px 14px",
                    fontSize: "0.88rem",
                    border: "1.5px solid #E5E7EB",
                    borderRadius: "10px",
                    background: "#FFFFFF",
                    color: "#111827",
                    outline: "none"
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "#4B5563", marginBottom: "6px" }}>
                  End time
                </label>
                <input
                  type="time"
                  min="08:00"
                  max="22:00"
                  step="900"
                  value={bkEnd}
                  onChange={(e) => setBkEnd(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "11px 14px",
                    fontSize: "0.88rem",
                    border: "1.5px solid #E5E7EB",
                    borderRadius: "10px",
                    background: "#FFFFFF",
                    color: "#111827",
                    outline: "none"
                  }}
                />
              </div>
            </div>

            {/* Form Row 4 */}
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "20px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "#4B5563", marginBottom: "6px" }}>
                  Approver (from your company)
                </label>
                <Dropdown
                  options={approverOptions}
                  value={bkManager}
                  onChange={(val) => setBkManager(val)}
                  placeholder="Select approver..."
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "#4B5563", marginBottom: "6px" }}>
                  Destination
                </label>
                <input
                  type="text"
                  placeholder="e.g. Gwagwalada field office"
                  value={bkDest}
                  onChange={(e) => setBkDest(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    fontSize: "0.88rem",
                    border: "1.5px solid #E5E7EB",
                    borderRadius: "10px",
                    background: "#FFFFFF",
                    color: "#111827",
                    outline: "none"
                  }}
                />
              </div>
            </div>

            {/* Form Row 5 */}
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "20px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "#4B5563", marginBottom: "6px" }}>
                  Driver
                </label>
                <Dropdown
                  options={driverOptions}
                  value={bkDriver}
                  onChange={(val) => setBkDriver(val)}
                  placeholder="Select driver..."
                  searchable={false}
                />
              </div>
              <div />
            </div>

            {/* Form Row 6 */}
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", color: "#4B5563", marginBottom: "6px" }}>
                Purpose of trip
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Cooperative onboarding visit"
                value={bkPurpose}
                onChange={(e) => setBkPurpose(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  fontSize: "0.88rem",
                  border: "1.5px solid #E5E7EB",
                  borderRadius: "10px",
                  background: "#FFFFFF",
                  color: "#111827",
                  outline: "none",
                  resize: "vertical"
                }}
              />
            </div>

            <button
              type="submit"
              disabled={isBookPending}
              style={{
                width: "100%",
                padding: "14px",
                fontSize: "0.9rem",
                fontWeight: 500,
                color: "#FFFFFF",
                background: isBookPending ? "#9CA3AF" : "#1F2937",
                border: "none",
                borderRadius: "10px",
                cursor: isBookPending ? "not-allowed" : "pointer",
                transition: "background 0.2s ease"
              }}
              onMouseEnter={(e) => !isBookPending && (e.currentTarget.style.background = "#374151")}
              onMouseLeave={(e) => !isBookPending && (e.currentTarget.style.background = "#1F2937")}
            >
              {isBookPending ? "Sending request..." : "Send request for approval"}
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: Instructions Panel */}
        <div style={{ background: "#F9FAFB", border: "1.5px solid #E5E7EB", borderRadius: "12px", padding: "24px", alignSelf: "start" }}>
          <h4 style={{ fontSize: "0.88rem", fontWeight: 500, color: "#111827", marginBottom: "12px" }}>
            Booking policy & instructions
          </h4>
          <p style={{ fontSize: "0.78rem", color: "#4B5563", lineHeight: 1.6 }}>
            Open to all TracTrac and Ikore staff. Bookings run daily between 08:00 and 22:00 and every
            request goes for approval before the vehicle is released - either to an approver from your
            company or to the fleet manager, who approves requests from both companies.
          </p>
          <hr style={{ border: "none", borderTop: "1px solid #E5E7EB", margin: "16px 0" }} />
          <p style={{ fontSize: "0.78rem", color: "#4B5563", lineHeight: 1.6 }}>
            The fleet manager may adjust the vehicle, driver, or timing of any trip, and decides whether it runs with
            an office car, a car hire service, or Bolt.
          </p>
        </div>
      </div>

      {/* TABLE SECTION: Booking Log */}
      <div style={{ background: "#FFFFFF", border: "1.5px solid #E5E7EB", borderRadius: "12px", padding: "24px", overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h4 style={{ fontSize: "1rem", fontWeight: 500, color: "#111827" }}>
            Recent Booking Requests
          </h4>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1.5px solid #E5E7EB", background: "#FAFBFB" }}>
                <th style={{ padding: "14px 16px", fontSize: "0.78rem", fontWeight: 500, color: "#6B7280" }}>Vehicle</th>
                <th style={{ padding: "14px 16px", fontSize: "0.78rem", fontWeight: 500, color: "#6B7280" }}>Company</th>
                <th style={{ padding: "14px 16px", fontSize: "0.78rem", fontWeight: 500, color: "#6B7280" }}>Date</th>
                <th style={{ padding: "14px 16px", fontSize: "0.78rem", fontWeight: 500, color: "#6B7280" }}>Time</th>
                <th style={{ padding: "14px 16px", fontSize: "0.78rem", fontWeight: 500, color: "#6B7280" }}>Requested by</th>
                <th style={{ padding: "14px 16px", fontSize: "0.78rem", fontWeight: 500, color: "#6B7280" }}>Destination</th>
                <th style={{ padding: "14px 16px", fontSize: "0.78rem", fontWeight: 500, color: "#6B7280" }}>Approver</th>
                <th style={{ padding: "14px 16px", fontSize: "0.78rem", fontWeight: 500, color: "#6B7280" }}>Status</th>
                <th style={{ padding: "14px 16px", fontSize: "0.78rem", fontWeight: 500, color: "#6B7280", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const reversed = bookings.slice().reverse();
                const paginated = reversed.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
                return paginated.map((b) => {
                  const c = cars.find((car) => car.id === b.carId);
                  const costBit = isAdminUser
                    ? `${b.cost ? `₦${fmtN(b.cost)}` : "cost pending"}${b.receiptName ? ` · receipt: ${b.receiptName}` : " · no receipt yet"}`
                    : "arranged by fleet manager";
                  const vehLabel = isOfficeTrip(b)
                    ? c
                      ? `${c.plate} - ${c.name}`
                      : "Unknown vehicle"
                    : `${b.mode} (${costBit})`;

                  const label = { approved: "Approved", pending: "Pending", declined: "Declined" }[b.status];

                  // Beautiful pastel status badges
                  const badgeStyles = {
                    approved: { background: "#F0FDF4", color: "#15803D", border: "1px solid #BBF7D0" },
                    pending: { background: "#FFF9C4", color: "#F57F17", border: "1.5px dashed #FFF59D" },
                    declined: { background: "#FEF2F2", color: "#991B1B", border: "1px solid #FEE2E2" }
                  }[b.status];

                  const canManage = b.status === "pending" && (currentUser?.name === b.staff || b.staff.startsWith(currentUser?.name || "") || isAdminUser);

                  return (
                    <tr
                      key={b.id}
                      style={{ borderBottom: "1px solid #F3F4F6", transition: "background 0.15s ease" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#FAFBFB")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <td style={{ padding: "16px", fontSize: "0.85rem", color: "#111827" }}>
                        {isOfficeTrip(b) ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span className="plate">{c ? c.plate : "TBD"}</span>
                            <span>{c ? c.name : "Unknown vehicle"}</span>
                          </div>
                        ) : (
                          <span style={{ color: "#4B5563" }}>{vehLabel}</span>
                        )}
                        {b.adjustedBy && (
                          <span style={{ display: "block", color: "#9CA3AF", fontSize: "0.72rem", marginTop: "2px" }}>
                            adjusted by fleet manager
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "16px", fontSize: "0.85rem" }}>
                        <span className={`co-chip ${b.co === "Tractrac" ? "tt" : b.co === "Ikore" ? "ik" : "ch"}`}>
                          {b.co === "Tractrac" ? "TracTrac" : b.co === "Ikore" ? "Ikore" : "ChananHill"}
                        </span>
                      </td>
                      <td style={{ padding: "16px", fontSize: "0.85rem", color: "#4B5563" }}>
                        {b.date === todayISO ? "Today" : b.date}
                      </td>
                      <td style={{ padding: "16px", fontSize: "0.85rem", color: "#111827" }}>
                        <span>{b.start} - {b.end}</span>
                        {b.endOdo ? (
                          <span style={{ display: "block", color: "#15803D", fontSize: "0.72rem", fontWeight: 500, marginTop: "2px" }}>
                            {fmtN(b.endOdo - (b.startOdo || 0))} km covered
                          </span>
                        ) : b.startOdo ? (
                          <span style={{ display: "block", color: "#6B7280", fontSize: "0.72rem", marginTop: "2px" }}>
                            in progress - from {fmtN(b.startOdo)} km
                          </span>
                        ) : null}
                      </td>
                      <td style={{ padding: "16px", fontSize: "0.85rem", color: "#111827" }}>
                        {b.staff}
                        {b.dept && b.dept !== "-" && b.dept !== "None" && (
                          <span style={{ color: "#6B7280", fontSize: "0.78rem" }}>
                            {" · "}{b.dept}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "16px", fontSize: "0.85rem", color: "#4B5563" }}>{b.dest}</td>
                      <td style={{ padding: "16px", fontSize: "0.85rem", color: "#4B5563" }}>
                        {b.status === "pending" ? b.manager : (b.decidedBy || b.manager)}
                      </td>
                      <td style={{ padding: "16px" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "4px 10px",
                            borderRadius: "20px",
                            fontSize: "0.76rem",
                            fontWeight: 500,
                            ...badgeStyles
                          }}
                        >
                          {label}
                        </span>
                      </td>
                      <td style={{ padding: "16px", textAlign: "right" }}>
                        {canManage ? (
                          <div style={{ display: "inline-flex", gap: "6px", alignItems: "center" }}>
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(b)}
                              title="Edit booking request"
                              style={{
                                background: "#F3F4F6",
                                border: "1px solid #E5E7EB",
                                borderRadius: "6px",
                                padding: "6px 10px",
                                fontSize: "0.78rem",
                                fontWeight: 500,
                                color: "#374151",
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px"
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = "#E5E7EB")}
                              onMouseLeave={(e) => (e.currentTarget.style.background = "#F3F4F6")}
                            >
                              <IconEdit size={14} />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingBooking(b)}
                              title="Cancel and delete booking request"
                              style={{
                                background: "#FEF2F2",
                                border: "1px solid #FEE2E2",
                                borderRadius: "6px",
                                padding: "6px 10px",
                                fontSize: "0.78rem",
                                fontWeight: 500,
                                color: "#DC2626",
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px"
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = "#FEE2E2")}
                              onMouseLeave={(e) => (e.currentTarget.style.background = "#FEF2F2")}
                            >
                              <IconTrash size={14} />
                              <span>Delete</span>
                            </button>
                          </div>
                        ) : (
                          <span style={{ color: "#9CA3AF", fontSize: "0.75rem" }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
        {bookings.length === 0 && (
          <div style={{ padding: "40px", textAlign: "center", color: "#6B7280", fontSize: "0.88rem" }}>
            No booking requests found.
          </div>
        )}

        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "24px" }}>
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              style={{
                background: currentPage === 1 ? "#F3F4F6" : "#E5E7EB",
                color: currentPage === 1 ? "#9CA3AF" : "#1F2937",
                border: "none",
                borderRadius: "8px",
                padding: "8px 16px",
                fontSize: "0.85rem",
                fontWeight: 650,
                cursor: currentPage === 1 ? "not-allowed" : "pointer"
              }}
            >
              Previous
            </button>
            <span style={{ fontSize: "0.85rem", color: "#4B5563" }}>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              style={{
                background: currentPage === totalPages ? "#F3F4F6" : "#E5E7EB",
                color: currentPage === totalPages ? "#9CA3AF" : "#1F2937",
                border: "none",
                borderRadius: "8px",
                padding: "8px 16px",
                fontSize: "0.85rem",
                fontWeight: 650,
                cursor: currentPage === totalPages ? "not-allowed" : "pointer"
              }}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* EDIT BOOKING MODAL */}
      <AnimatePresence>
        {editingBooking && (
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
            onClick={() => !isEditPending && setEditingBooking(null)}
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
                maxWidth: "580px",
                maxHeight: "90vh",
                overflowY: "auto",
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <div>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "#111827", margin: 0 }}>
                    Edit Booking Request
                  </h3>
                  <p style={{ fontSize: "0.78rem", color: "#6B7280", margin: "4px 0 0 0" }}>
                    Modify your trip details before approval.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => !isEditPending && setEditingBooking(null)}
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

              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 500, color: "#4B5563", marginBottom: "6px" }}>
                    Vehicle / Mode
                  </label>
                  <Dropdown
                    options={vehicleOptions}
                    value={editCar}
                    onChange={(val) => setEditCar(val === "bolt" || val === "car_hire" ? val : Number(val))}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "14px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 500, color: "#4B5563", marginBottom: "6px" }}>
                      Start Date
                    </label>
                    <input
                      type="date"
                      min={todayISO}
                      value={editStartDate}
                      onChange={(e) => {
                        setEditStartDate(e.target.value);
                        if (editEndDate < e.target.value) setEditEndDate(e.target.value);
                      }}
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
                      End Date
                    </label>
                    <input
                      type="date"
                      min={editStartDate || todayISO}
                      value={editEndDate}
                      onChange={(e) => setEditEndDate(e.target.value)}
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

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 500, color: "#4B5563", marginBottom: "6px" }}>
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={editStart}
                      onChange={(e) => setEditStart(e.target.value)}
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
                      End Time
                    </label>
                    <input
                      type="time"
                      value={editEnd}
                      onChange={(e) => setEditEnd(e.target.value)}
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

                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "14px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 500, color: "#4B5563", marginBottom: "6px" }}>
                      Destination
                    </label>
                    <input
                      type="text"
                      value={editDest}
                      onChange={(e) => setEditDest(e.target.value)}
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
                      Driver
                    </label>
                    <Dropdown
                      options={driverOptions}
                      value={editDriver}
                      onChange={(val) => setEditDriver(val)}
                      searchable={false}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 500, color: "#4B5563", marginBottom: "6px" }}>
                    Approver
                  </label>
                  <Dropdown
                    options={approverOptions}
                    value={editManager}
                    onChange={(val) => setEditManager(val)}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 500, color: "#4B5563", marginBottom: "6px" }}>
                    Purpose of Trip
                  </label>
                  <textarea
                    rows={2}
                    value={editPurpose}
                    onChange={(e) => setEditPurpose(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      fontSize: "0.85rem",
                      border: "1.5px solid #E5E7EB",
                      borderRadius: "8px",
                      outline: "none",
                      resize: "vertical"
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
                <button
                  type="button"
                  disabled={isEditPending}
                  onClick={() => setEditingBooking(null)}
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
                  disabled={isEditPending}
                  onClick={handleSaveEdit}
                  style={{
                    background: "#1F2937",
                    border: "none",
                    borderRadius: "8px",
                    padding: "10px 20px",
                    fontSize: "0.85rem",
                    fontWeight: 500,
                    color: "#FFFFFF",
                    cursor: isEditPending ? "not-allowed" : "pointer"
                  }}
                >
                  {isEditPending ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {deletingBooking && (
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
            onClick={() => !isDeletePending && setDeletingBooking(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              style={{
                background: "#FFFFFF",
                borderRadius: "16px",
                padding: "24px",
                width: "100%",
                maxWidth: "440px",
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)"
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    background: "#FEE2E2",
                    color: "#DC2626",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <IconAlertTriangle size={20} />
                </div>
                <div>
                  <h4 style={{ fontSize: "1rem", fontWeight: 600, color: "#111827", margin: 0 }}>
                    Cancel Booking Request?
                  </h4>
                  <p style={{ fontSize: "0.78rem", color: "#6B7280", margin: "2px 0 0 0" }}>
                    This action cannot be undone.
                  </p>
                </div>
              </div>

              <p style={{ fontSize: "0.85rem", color: "#4B5563", lineHeight: 1.5, margin: "0 0 20px 0" }}>
                Are you sure you want to delete your booking for <strong>{deletingBooking.dest || "trip"}</strong> on{" "}
                <strong>{deletingBooking.date} ({deletingBooking.start} - {deletingBooking.end})</strong>?
              </p>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  disabled={isDeletePending}
                  onClick={() => setDeletingBooking(null)}
                  style={{
                    background: "#F3F4F6",
                    border: "none",
                    borderRadius: "8px",
                    padding: "9px 16px",
                    fontSize: "0.85rem",
                    fontWeight: 500,
                    color: "#374151",
                    cursor: "pointer"
                  }}
                >
                  Keep Request
                </button>
                <button
                  type="button"
                  disabled={isDeletePending}
                  onClick={() => handleDeleteBooking(deletingBooking.id)}
                  style={{
                    background: "#DC2626",
                    border: "none",
                    borderRadius: "8px",
                    padding: "9px 18px",
                    fontSize: "0.85rem",
                    fontWeight: 500,
                    color: "#FFFFFF",
                    cursor: isDeletePending ? "not-allowed" : "pointer"
                  }}
                >
                  {isDeletePending ? "Deleting..." : "Yes, Delete Request"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
