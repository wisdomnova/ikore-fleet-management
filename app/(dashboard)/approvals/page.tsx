"use client";

import React, { useState, useEffect } from "react";
import { useFleet } from "../layout";
import { API_BASE_URL } from "../../config";
import Dropdown from "../../components/Dropdown";
import { motion, AnimatePresence } from "framer-motion";
import { IconEdit, IconTrash, IconX, IconCheck, IconAlertTriangle, IconSteeringWheel } from "@tabler/icons-react";
import { isBookingOnDate, getBookingDayTimes, getBookingDayTimesForVal, getOverlappingDates, mins, checkBookingConflict } from "../../utils";

const DAY_START = 8;
const DAY_END = 22;
const ADMIN_NAME = "Godsfavour Nyoyoko";

export default function ApprovalsPage() {
  const {
    currentUser,
    cars,
    bookings,
    setBookings,
    drivers,
    showToastMsg
  } = useFleet();

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const todayISO = new Date().toISOString().slice(0, 10);

  // Edit Modal State
  const [editingTrip, setEditingTrip] = useState<any | null>(null);
  const [editCarId, setEditCarId] = useState<number | string>(1);
  const [editMode, setEditMode] = useState("Office car");
  const [editStartDate, setEditStartDate] = useState(todayISO);
  const [editEndDate, setEditEndDate] = useState(todayISO);
  const [editStart, setEditStart] = useState("08:00");
  const [editEnd, setEditEnd] = useState("10:00");
  const [editDriver, setEditDriver] = useState("Assign any available driver");
  const [editDest, setEditDest] = useState("");
  const [editPurpose, setEditPurpose] = useState("");
  const [editCost, setEditCost] = useState<number | "">("");
  const [editReceiptName, setEditReceiptName] = useState("");
  const [editReceiptURL, setEditReceiptURL] = useState("");
  const [editMsg, setEditMsg] = useState({ text: "", type: "" });
  const [isEditPending, setIsEditPending] = useState(false);

  // Delete Modal State
  const [deletingTrip, setDeletingTrip] = useState<any | null>(null);
  const [isDeletePending, setIsDeletePending] = useState(false);

  // Card-specific assigned driver draft state
  const [cardDrivers, setCardDrivers] = useState<Record<number, string>>({});

  const modeOptions = [
    { value: "Office car", label: "Office car" },
    { value: "Car hire service", label: "Car hire service" },
    { value: "Bolt", label: "Bolt (ride-hailing)" }
  ];

  const carOptions = cars.map((car) => ({
    value: car.id,
    label: `${car.plate !== "TBD" ? car.plate + " - " : ""}${car.name} (${car.co === "Tractrac" ? "TracTrac" : car.co === "Ikore" ? "Ikore" : "ChananHill"})${car.shop ? " - workshop" : ""}`
  }));

  const driverOptions = [
    { value: "Assign any available driver", label: "Assign any available driver" },
    ...drivers.map((d) => ({
      value: d.name,
      label: `${d.name} (${d.co === "Tractrac" ? "TracTrac" : d.co === "Ikore" ? "Ikore" : "ChananHill"})`
    })),
    { value: "Self-drive (approved staff)", label: "Self-drive (approved staff)" },
    { value: "Bolt ride (arranged)", label: "Bolt ride (arranged)" },
    { value: "Hired vehicle with driver", label: "Hired vehicle with driver" }
  ];

  const isOfficeTrip = (b: any) => !b.mode || b.mode === "Office car";

  const fmtN = (n: number): string => {
    return n.toLocaleString("en-NG");
  };

  // Actions
  const handleApprove = async (id: number) => {
    if (!currentUser) return;
    const b = bookings.find((x) => x.id === id);
    if (!b) return;
    const assignedDriver = cardDrivers[id] || b?.driver || "Assign any available driver";
    const [sDate, eDate] = b.date.includes(" to ") ? b.date.split(" to ") : [b.date, b.date];

    // Conflict check
    const conflict = checkBookingConflict({
      bookingId: id,
      carId: b.carId,
      mode: b.mode,
      driver: assignedDriver,
      startDate: sDate,
      endDate: eDate,
      startTime: b.start || "08:00",
      endTime: b.end || "22:00",
      bookings,
      cars
    });

    if (conflict.hasConflict) {
      showToastMsg(`Cannot approve: ${conflict.errorMessage}`);
      return;
    }

    try {
      const payload: any = {
        status: "approved",
        driver: assignedDriver,
        decidedAt: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
        decidedBy: currentUser.name
      };

      const response = await fetch(`${API_BASE_URL}/api/bookings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        console.error("Approve failed:", response.status, errBody);
        throw new Error(errBody?.error || "Server error");
      }
      const updated = await response.json();
      setBookings(bookings.map((item) => (item.id === id ? updated : item)));
      showToastMsg(`Approved - trip confirmed for ${assignedDriver}`);
    } catch (err: any) {
      showToastMsg(`Failed to approve: ${err?.message || "Unknown error"}`);
    }
  };

  const handleDecline = async (id: number) => {
    if (!currentUser) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/bookings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "declined",
          decidedAt: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
          decidedBy: currentUser.name
        })
      });
      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        console.error("Decline failed:", response.status, errBody);
        throw new Error(errBody?.error || "Server error");
      }
      const updated = await response.json();
      setBookings(bookings.map((b) => (b.id === id ? updated : b)));
      showToastMsg("Declined - slot freed");
    } catch (err: any) {
      showToastMsg(`Failed to decline: ${err?.message || "Unknown error"}`);
    }
  };

  const handleSaveAdjustment = async (id: number, fields: Partial<typeof bookings[0]>) => {
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

    const original = bookings.find((b) => b.id === id);
    if (!original) return;
    const finalCarId = fields.carId !== undefined ? fields.carId : original.carId;
    const finalStart = fields.start !== undefined ? fields.start : original.start;
    const finalEnd = fields.end !== undefined ? fields.end : original.end;
    const finalMode = fields.mode !== undefined ? fields.mode : original.mode;
    const finalDriver = fields.driver !== undefined ? fields.driver : original.driver;
    const [sDate, eDate] = original.date.includes(" to ") ? original.date.split(" to ") : [original.date, original.date];

    const conflict = checkBookingConflict({
      bookingId: id,
      carId: finalCarId,
      mode: finalMode,
      driver: finalDriver,
      startDate: sDate,
      endDate: eDate,
      startTime: finalStart,
      endTime: finalEnd,
      bookings,
      cars
    });

    if (conflict.hasConflict) {
      showToastMsg(conflict.errorMessage || "Adjustment causes a booking conflict");
      return;
    }

    const updatedFields = {
      ...fields,
      adjustedBy: currentUser?.name
    };

    if (fields.mode === "Office car") {
      (updatedFields as any).cost = null;
      (updatedFields as any).receiptName = null;
      (updatedFields as any).receiptURL = null;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/bookings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedFields)
      });
      if (!response.ok) throw new Error();
      const updated = await response.json();
      setBookings(bookings.map((b) => (b.id === id ? updated : b)));

      const c = cars.find((car) => car.id === finalCarId);
      showToastMsg(
        finalMode === "Office car" || !finalMode
          ? `Trip updated - ${c?.name || "Vehicle"} assigned`
          : `Trip moved to ${finalMode} - office car released`
      );
    } catch (err) {
      showToastMsg("Failed to save adjustments");
    }
  };

  // Open Edit Modal
  const handleOpenEditTrip = (b: any) => {
    setEditingTrip(b);
    setEditMsg({ text: "", type: "" });
    setEditCarId(b.carId || 1);
    setEditMode(b.mode || "Office car");
    const [sDate, eDate] = b.date.includes(" to ") ? b.date.split(" to ") : [b.date, b.date];
    setEditStartDate(sDate);
    setEditEndDate(eDate);
    setEditStart(b.start || "08:00");
    setEditEnd(b.end || "10:00");
    setEditDriver(b.driver || "Assign any available driver");
    setEditDest(b.dest || "");
    setEditPurpose(b.purpose || "");
    setEditCost(b.cost !== undefined && b.cost !== null ? b.cost : "");
    setEditReceiptName(b.receiptName || "");
    setEditReceiptURL(b.receiptURL || "");
  };

  // Save Trip Edit
  const handleSaveTripEdit = async () => {
    if (!editingTrip) return;
    setEditMsg({ text: "", type: "" });

    if (!editStartDate || !editEndDate || !editStart || !editEnd) {
      setEditMsg({ text: "Dates and times are required.", type: "err" });
      return;
    }
    if (editEndDate < editStartDate) {
      setEditMsg({ text: "End date cannot be before start date.", type: "err" });
      return;
    }
    if (mins(editStart) < DAY_START * 60 || mins(editEnd) > DAY_END * 60) {
      setEditMsg({ text: "Trips must fall between 08:00 and 22:00.", type: "err" });
      return;
    }
    if (editStartDate === editEndDate && mins(editEnd) <= mins(editStart)) {
      setEditMsg({ text: "End time must be after start time.", type: "err" });
      return;
    }

    const finalCarId = editMode === "Office car" && typeof editCarId === "number" ? editCarId : null;

    const conflict = checkBookingConflict({
      bookingId: editingTrip.id,
      carId: finalCarId,
      mode: editMode,
      driver: editDriver,
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

    const finalDate = editStartDate === editEndDate ? editStartDate : `${editStartDate} to ${editEndDate}`;

    const payload: any = {
      carId: finalCarId,
      mode: editMode,
      date: finalDate,
      start: editStart,
      end: editEnd,
      driver: editDriver,
      dest: editDest.trim() || "None",
      purpose: editPurpose.trim(),
      adjustedBy: currentUser?.name
    };

    if (editMode !== "Office car") {
      payload.cost = editCost === "" ? null : Number(editCost);
      payload.receiptName = editReceiptName || null;
      payload.receiptURL = editReceiptURL || null;
    }

    setIsEditPending(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/bookings/${editingTrip.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error();
      const updated = await response.json();
      setBookings(bookings.map((b) => (b.id === editingTrip.id ? updated : b)));
      showToastMsg("Trip updated successfully");
      setEditingTrip(null);
    } catch (err) {
      setEditMsg({ text: "Failed to update trip on server.", type: "err" });
    } finally {
      setIsEditPending(false);
    }
  };

  // Delete Trip
  const handleDeleteTrip = async (id: number) => {
    setIsDeletePending(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/bookings/${id}`, {
        method: "DELETE"
      });
      if (!response.ok) throw new Error();
      setBookings(bookings.filter((b) => b.id !== id));
      showToastMsg("Trip request removed");
      setDeletingTrip(null);
    } catch (err) {
      showToastMsg("Failed to delete trip");
    } finally {
      setIsDeletePending(false);
    }
  };

  const isAdminUser = currentUser?.name === ADMIN_NAME || currentUser?.name === "Divine Wisdom";
  const mine = (b: any) => currentUser && (isAdminUser || b.manager === currentUser.name);
  
  const pending = bookings.filter((b) => b.status === "pending").filter(mine);
  const activeToday = bookings.filter((b) => isBookingOnDate(b.date, todayISO) && b.status === "approved" && mine(b));
  const decided = bookings.filter((b) => b.status !== "pending" && b.decidedAt && mine(b)).reverse();

  const [currentPage, setCurrentPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const itemsPerPage = 5;

  const currentItems = [
    ...pending.map((b) => ({ ...b, isPending: true })),
    ...activeToday.map((b) => ({ ...b, isPending: false }))
  ];

  const totalCurrentPages = Math.ceil(currentItems.length / itemsPerPage);
  const paginatedCurrent = currentItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const totalHistoryPages = Math.ceil(decided.length / itemsPerPage);
  const paginatedHistory = decided.slice((historyPage - 1) * itemsPerPage, historyPage * itemsPerPage);

  useEffect(() => {
    if (currentPage > totalCurrentPages && totalCurrentPages > 0) {
      setCurrentPage(totalCurrentPages);
    }
  }, [currentItems.length, totalCurrentPages, currentPage]);

  useEffect(() => {
    if (historyPage > totalHistoryPages && totalHistoryPages > 0) {
      setHistoryPage(totalHistoryPages);
    }
  }, [decided.length, totalHistoryPages, historyPage]);

  return (
    <section className="active">
      {/* Header Panel */}
      <div style={{ background: "#F9FAFB", borderRadius: "12px", padding: "28px", marginBottom: "32px" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 500, color: "#111827", marginBottom: "10px" }}>Approvals & Trip Management</h2>
        <p style={{ fontSize: "0.82rem", color: "#6B7280", lineHeight: 1.5, margin: 0 }}>
          {isAdminUser
            ? "As fleet manager you can review, approve, decline, edit, or delete any booking request across both companies, assign drivers, or adjust trip modes."
            : "Review booking requests routed to you as an approver. You can assign drivers, edit trip details, approve/decline, or delete requests anytime."}
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.6fr 1fr", gap: "32px", alignItems: "start" }}>
        {/* Left Column: Pending and Active */}
        <div>
          <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "#111827", marginBottom: "16px" }}>Pending & Active Requests</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {paginatedCurrent.map((b) => {
              const c = cars.find((car) => car.id === b.carId);
              const selectedDriver = cardDrivers[b.id] !== undefined ? cardDrivers[b.id] : b.driver;

              if (b.isPending) {
                return (
                  <div
                    key={b.id}
                    style={{
                      background: "#F9FAFB",
                      borderRadius: "16px",
                      padding: "24px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "16px",
                      border: "1.5px solid #E5E7EB"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div
                          style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "50%",
                            background: b.co === "Tractrac" ? "var(--tt-soft)" : b.co === "Ikore" ? "var(--ik-soft)" : "var(--ch-soft)",
                            color: b.co === "Tractrac" ? "var(--tt-dark)" : b.co === "Ikore" ? "var(--ik-dark)" : "var(--ch-dark)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 600,
                            fontSize: "1rem"
                          }}
                        >
                          {b.staff[0]}
                        </div>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ fontWeight: 600, fontSize: "0.95rem", color: "#111827" }}>{b.staff}</span>
                            <span className={`co-chip ${b.co === "Tractrac" ? "tt" : b.co === "Ikore" ? "ik" : "ch"}`}>
                              {b.co === "Tractrac" ? "TracTrac" : b.co === "Ikore" ? "Ikore" : "ChananHill"}
                            </span>
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "#6B7280", marginTop: "2px" }}>
                            Department: {b.dept || "None"}
                          </div>
                        </div>
                      </div>
                      
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span
                          style={{
                            fontSize: "0.7rem",
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            borderRadius: "999px",
                            padding: "4px 12px",
                            background: "#FEF3C7",
                            color: "#D97706"
                          }}
                        >
                          Pending
                        </span>
                        <button
                          type="button"
                          onClick={() => handleOpenEditTrip(b)}
                          title="Edit request"
                          style={{
                            background: "#FFFFFF",
                            border: "1px solid #E5E7EB",
                            borderRadius: "6px",
                            padding: "4px 8px",
                            fontSize: "0.75rem",
                            fontWeight: 500,
                            color: "#374151",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px"
                          }}
                        >
                          <IconEdit size={13} />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingTrip(b)}
                          title="Delete request"
                          style={{
                            background: "#FEF2F2",
                            border: "1px solid #FEE2E2",
                            borderRadius: "6px",
                            padding: "4px 8px",
                            fontSize: "0.75rem",
                            fontWeight: 500,
                            color: "#DC2626",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px"
                          }}
                        >
                          <IconTrash size={13} />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>

                    {/* Inner Details Panel (white block) */}
                    <div
                      style={{
                        background: "#FFFFFF",
                        borderRadius: "12px",
                        padding: "16px 20px",
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "16px 24px"
                      }}
                    >
                      <div>
                        <div style={{ fontSize: "0.72rem", color: "#9CA3AF", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em" }}>Vehicle / Mode</div>
                        <div style={{ fontSize: "0.88rem", fontWeight: 500, color: "#1F2937", marginTop: "4px" }}>
                          {isOfficeTrip(b) && c ? `${c.plate} - ${c.name}` : b.mode || "Office car"}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: "0.72rem", color: "#9CA3AF", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em" }}>Destination</div>
                        <div style={{ fontSize: "0.88rem", fontWeight: 500, color: "#1F2937", marginTop: "4px" }}>
                          {b.dest || "No destination given"}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: "0.72rem", color: "#9CA3AF", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em" }}>Date & Time</div>
                        <div style={{ fontSize: "0.88rem", fontWeight: 500, color: "#1F2937", marginTop: "4px" }}>
                          {b.date === todayISO ? "Today" : b.date}, {b.start} - {b.end}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: "0.72rem", color: "#9CA3AF", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em" }}>Assigned Driver</div>
                        <div style={{ marginTop: "4px" }}>
                          <Dropdown
                            options={driverOptions}
                            value={selectedDriver}
                            onChange={(val) => {
                              setCardDrivers({ ...cardDrivers, [b.id]: val });
                              handleSaveAdjustment(b.id, { driver: val });
                            }}
                            searchable={false}
                          />
                        </div>
                      </div>
                      {b.purpose && (
                        <div style={{ gridColumn: "span 2" }}>
                          <div style={{ fontSize: "0.72rem", color: "#9CA3AF", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em" }}>Purpose</div>
                          <div style={{ fontSize: "0.88rem", fontWeight: 500, color: "#1F2937", marginTop: "4px" }}>
                            {b.purpose}
                          </div>
                        </div>
                      )}
                      <div style={{ gridColumn: "span 2", paddingTop: "12px", borderTop: "1px solid #F3F4F6", display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#6B7280" }}>
                        <span>Approver: <strong style={{ color: "#374151" }}>{b.manager}</strong></span>
                        {b.adjustedBy && <span style={{ color: "#D97706", fontWeight: 500 }}>Adjusted by fleet manager</span>}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                      <button
                        onClick={() => handleApprove(b.id)}
                        style={{
                          flex: 1,
                          background: "#16A34A",
                          color: "#FFFFFF",
                          border: "none",
                          borderRadius: "8px",
                          padding: "12px",
                          fontWeight: 600,
                          fontSize: "0.85rem",
                          cursor: "pointer",
                          transition: "background 0.2s"
                        }}
                      >
                        Approve request
                      </button>
                      <button
                        onClick={() => handleDecline(b.id)}
                        style={{
                          background: "#F3F4F6",
                          color: "#DC2626",
                          border: "none",
                          borderRadius: "8px",
                          padding: "12px 24px",
                          fontWeight: 600,
                          fontSize: "0.85rem",
                          cursor: "pointer",
                          transition: "background 0.2s"
                        }}
                      >
                        Decline
                      </button>
                    </div>

                    {/* Adjust details drawer */}
                    <details style={{ marginTop: "8px", borderTop: "none" }} className="adj">
                      <summary style={{ fontSize: "0.78rem", fontWeight: 600, color: "#4B5563", textTransform: "uppercase", letterSpacing: "0.05em", cursor: "pointer", padding: "8px 0" }}>
                        Adjust details (vehicle, mode, times)
                      </summary>
                      <div style={{ background: "#FFFFFF", borderRadius: "12px", padding: "16px", marginTop: "8px", display: "flex", flexDirection: "column", gap: "12px" }}>
                        <div className="frow" style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "16px", marginTop: 0 }}>
                          <div>
                            <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#4B5563", marginBottom: "6px", display: "block" }}>Trip mode</label>
                            <Dropdown
                              options={modeOptions}
                              value={b.mode || "Office car"}
                              onChange={(val) => handleSaveAdjustment(b.id, { mode: val })}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#4B5563", marginBottom: "6px", display: "block" }}>Vehicle (office car trips)</label>
                            <Dropdown
                              options={carOptions}
                              value={b.carId}
                              disabled={!!(b.mode && b.mode !== "Office car")}
                              onChange={(val) => handleSaveAdjustment(b.id, { carId: Number(val) })}
                            />
                          </div>
                        </div>
                        <div className="frow" style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "16px", marginTop: 0 }}>
                          <div>
                            <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#4B5563", marginBottom: "6px", display: "block" }}>Timing</label>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                              <input
                                type="time"
                                value={b.start}
                                style={{
                                  border: "none",
                                  background: "#F3F4F6",
                                  borderRadius: "8px",
                                  padding: "10px 12px",
                                  fontSize: "0.85rem",
                                  outline: "none",
                                  color: "#1F2937",
                                  width: "100%"
                                }}
                                onChange={(e) =>
                                  handleSaveAdjustment(b.id, { start: e.target.value })
                                }
                              />
                              <input
                                type="time"
                                value={b.end}
                                style={{
                                  border: "none",
                                  background: "#F3F4F6",
                                  borderRadius: "8px",
                                  padding: "10px 12px",
                                  fontSize: "0.85rem",
                                  outline: "none",
                                  color: "#1F2937",
                                  width: "100%"
                                }}
                                onChange={(e) =>
                                  handleSaveAdjustment(b.id, { end: e.target.value })
                                }
                              />
                            </div>
                          </div>
                          <div>
                            <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#4B5563", marginBottom: "6px", display: "block" }}>Destination</label>
                            <input
                              type="text"
                              value={b.dest || ""}
                              placeholder="Destination"
                              style={{
                                border: "none",
                                background: "#F3F4F6",
                                borderRadius: "8px",
                                padding: "10px 12px",
                                fontSize: "0.85rem",
                                outline: "none",
                                color: "#1F2937",
                                width: "100%"
                              }}
                              onChange={(e) =>
                                handleSaveAdjustment(b.id, { dest: e.target.value })
                              }
                            />
                          </div>
                        </div>
                      </div>
                    </details>
                  </div>
                );
              } else {
                // Approved / Active Card
                return (
                  <div
                    key={b.id}
                    style={{
                      background: "#F9FAFB",
                      borderRadius: "16px",
                      padding: "24px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "16px",
                      border: "1.5px solid #E5E7EB"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div
                          style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "50%",
                            background: b.co === "Tractrac" ? "var(--tt-soft)" : b.co === "Ikore" ? "var(--ik-soft)" : "var(--ch-soft)",
                            color: b.co === "Tractrac" ? "var(--tt-dark)" : b.co === "Ikore" ? "var(--ik-dark)" : "var(--ch-dark)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 600,
                            fontSize: "1rem"
                          }}
                        >
                          {b.staff[0]}
                        </div>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ fontWeight: 600, fontSize: "0.95rem", color: "#111827" }}>{b.staff}</span>
                            <span className={`co-chip ${b.co === "Tractrac" ? "tt" : b.co === "Ikore" ? "ik" : "ch"}`}>
                              {b.co === "Tractrac" ? "TracTrac" : b.co === "Ikore" ? "Ikore" : "ChananHill"}
                            </span>
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "#6B7280", marginTop: "2px" }}>
                            Department: {b.dept || "None"}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span
                          style={{
                            fontSize: "0.7rem",
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            borderRadius: "999px",
                            padding: "4px 12px",
                            background: "#DCFCE7",
                            color: "#16A34A"
                          }}
                        >
                          Approved
                        </span>
                        <button
                          type="button"
                          onClick={() => handleOpenEditTrip(b)}
                          title="Edit approved trip"
                          style={{
                            background: "#FFFFFF",
                            border: "1px solid #E5E7EB",
                            borderRadius: "6px",
                            padding: "4px 8px",
                            fontSize: "0.75rem",
                            fontWeight: 500,
                            color: "#374151",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px"
                          }}
                        >
                          <IconEdit size={13} />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingTrip(b)}
                          title="Delete trip"
                          style={{
                            background: "#FEF2F2",
                            border: "1px solid #FEE2E2",
                            borderRadius: "6px",
                            padding: "4px 8px",
                            fontSize: "0.75rem",
                            fontWeight: 500,
                            color: "#DC2626",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px"
                          }}
                        >
                          <IconTrash size={13} />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>

                    {/* Inner Details Panel */}
                    <div
                      style={{
                        background: "#FFFFFF",
                        borderRadius: "12px",
                        padding: "16px 20px",
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "16px 24px"
                      }}
                    >
                      <div>
                        <div style={{ fontSize: "0.72rem", color: "#9CA3AF", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em" }}>Vehicle / Mode</div>
                        <div style={{ fontSize: "0.88rem", fontWeight: 500, color: "#1F2937", marginTop: "4px" }}>
                          {isOfficeTrip(b) && c ? `${c.plate} - ${c.name}` : b.mode || "Office car"}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: "0.72rem", color: "#9CA3AF", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em" }}>Destination</div>
                        <div style={{ fontSize: "0.88rem", fontWeight: 500, color: "#1F2937", marginTop: "4px" }}>
                          {b.dest || "No destination given"}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: "0.72rem", color: "#9CA3AF", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em" }}>Date & Time</div>
                        <div style={{ fontSize: "0.88rem", fontWeight: 500, color: "#1F2937", marginTop: "4px" }}>
                          {b.date === todayISO ? "Today" : b.date}, {b.start} - {b.end}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: "0.72rem", color: "#9CA3AF", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em" }}>Driver</div>
                        <div style={{ fontSize: "0.88rem", fontWeight: 500, color: "#1F2937", marginTop: "4px" }}>
                          {b.driver}
                        </div>
                      </div>
                      {b.endOdo ? (
                        <div style={{ gridColumn: "span 2" }}>
                          <div style={{ fontSize: "0.72rem", color: "#9CA3AF", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em" }}>Distance Covered</div>
                          <div style={{ fontSize: "0.88rem", fontWeight: 500, color: "#1F2937", marginTop: "4px" }}>
                            {fmtN(b.endOdo - (b.startOdo || 0))} km covered ({fmtN(b.startOdo || 0)} to {fmtN(b.endOdo)} km)
                          </div>
                        </div>
                      ) : b.startOdo ? (
                        <div style={{ gridColumn: "span 2" }}>
                          <div style={{ fontSize: "0.72rem", color: "#9CA3AF", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em" }}>Trip status</div>
                          <div style={{ fontSize: "0.88rem", fontWeight: 500, color: "#D97706", marginTop: "4px" }}>
                            In progress from {fmtN(b.startOdo)} km
                          </div>
                        </div>
                      ) : null}
                      <div style={{ gridColumn: "span 2", paddingTop: "12px", borderTop: "1px solid #F3F4F6", display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#6B7280" }}>
                        <span>Approver: <strong style={{ color: "#374151" }}>{b.manager}</strong></span>
                        {b.adjustedBy && <span style={{ color: "#D97706", fontWeight: 500 }}>Adjusted by fleet manager</span>}
                      </div>
                    </div>
                  </div>
                );
              }
            })}
            
            {currentItems.length === 0 && (
              <div style={{ padding: "40px", background: "#FAFBFB", borderRadius: "12px", textAlign: "center", color: "#6B7280", fontSize: "0.88rem" }}>
                No requests waiting for you. New booking requests naming you as approver will appear here.
              </div>
            )}
          </div>

          {totalCurrentPages > 1 && (
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
                  fontWeight: 600,
                  cursor: currentPage === 1 ? "not-allowed" : "pointer"
                }}
              >
                Previous
              </button>
              <span style={{ fontSize: "0.85rem", color: "#4B5563" }}>
                Page {currentPage} of {totalCurrentPages}
              </span>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalCurrentPages))}
                disabled={currentPage === totalCurrentPages}
                style={{
                  background: currentPage === totalCurrentPages ? "#F3F4F6" : "#E5E7EB",
                  color: currentPage === totalCurrentPages ? "#9CA3AF" : "#1F2937",
                  border: "none",
                  borderRadius: "8px",
                  padding: "8px 16px",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  cursor: currentPage === totalCurrentPages ? "not-allowed" : "pointer"
                }}
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Recent Activity */}
        <div>
          <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "#111827", marginBottom: "16px" }}>Recent Decisions</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {paginatedHistory.map((b) => {
              const c = cars.find((car) => car.id === b.carId);
              return (
                <div
                  key={b.id}
                  style={{
                    background: "#F9FAFB",
                    borderRadius: "16px",
                    padding: "20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                    border: "1px solid #E5E7EB"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                    <span style={{ fontWeight: 600, fontSize: "0.88rem", color: "#111827" }}>{b.staff}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span
                        style={{
                          fontSize: "0.65rem",
                          fontWeight: 650,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          borderRadius: "999px",
                          padding: "2px 10px",
                          background: b.status === "approved" ? "#DCFCE7" : b.status === "declined" ? "#FEE2E2" : "#FEF3C7",
                          color: b.status === "approved" ? "#16A34A" : b.status === "declined" ? "#DC2626" : "#D97706"
                        }}
                      >
                        {b.status}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleOpenEditTrip(b)}
                        title="Edit trip"
                        style={{
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          color: "#4B5563",
                          padding: "2px"
                        }}
                      >
                        <IconEdit size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingTrip(b)}
                        title="Delete trip"
                        style={{
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          color: "#DC2626",
                          padding: "2px"
                        }}
                      >
                        <IconTrash size={14} />
                      </button>
                    </div>
                  </div>

                  <div style={{ fontSize: "0.8rem", color: "#4B5563", lineHeight: 1.4 }}>
                    {c?.plate ? `${c.plate} · ` : ""}{b.dest} ({b.date}) · {b.start} - {b.end} · Driver: {b.driver}
                  </div>

                  <div style={{ fontSize: "0.72rem", color: "#9CA3AF", borderTop: "1px solid #F3F4F6", paddingTop: "8px" }}>
                    Decided by {b.decidedBy || b.manager} at {b.decidedAt}
                  </div>
                </div>
              );
            })}

            {decided.length === 0 && (
              <div style={{ padding: "40px", background: "#FAFBFB", borderRadius: "12px", textAlign: "center", color: "#6B7280", fontSize: "0.88rem" }}>
                No recent decisions.
              </div>
            )}
          </div>

          {totalHistoryPages > 1 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "24px" }}>
              <button
                onClick={() => setHistoryPage((prev) => Math.max(prev - 1, 1))}
                disabled={historyPage === 1}
                style={{
                  background: historyPage === 1 ? "#F3F4F6" : "#E5E7EB",
                  color: historyPage === 1 ? "#9CA3AF" : "#1F2937",
                  border: "none",
                  borderRadius: "8px",
                  padding: "8px 16px",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  cursor: historyPage === 1 ? "not-allowed" : "pointer"
                }}
              >
                Previous
              </button>
              <span style={{ fontSize: "0.85rem", color: "#4B5563" }}>
                Page {historyPage} of {totalHistoryPages}
              </span>
              <button
                onClick={() => setHistoryPage((prev) => Math.min(prev + 1, totalHistoryPages))}
                disabled={historyPage === totalHistoryPages}
                style={{
                  background: historyPage === totalHistoryPages ? "#F3F4F6" : "#E5E7EB",
                  color: historyPage === totalHistoryPages ? "#9CA3AF" : "#1F2937",
                  border: "none",
                  borderRadius: "8px",
                  padding: "8px 16px",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  cursor: historyPage === totalHistoryPages ? "not-allowed" : "pointer"
                }}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* EDIT TRIP MODAL */}
      <AnimatePresence>
        {editingTrip && (
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
            onClick={() => !isEditPending && setEditingTrip(null)}
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
                maxWidth: "600px",
                maxHeight: "90vh",
                overflowY: "auto",
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)"
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <div>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "#111827", margin: 0 }}>
                    Edit Trip Details
                  </h3>
                  <p style={{ fontSize: "0.78rem", color: "#6B7280", margin: "4px 0 0 0" }}>
                    Editing request for {editingTrip.staff} ({editingTrip.status})
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => !isEditPending && setEditingTrip(null)}
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
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "14px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 500, color: "#4B5563", marginBottom: "6px" }}>
                      Trip Mode
                    </label>
                    <Dropdown
                      options={modeOptions}
                      value={editMode}
                      onChange={(val) => setEditMode(val)}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 500, color: "#4B5563", marginBottom: "6px" }}>
                      Vehicle (office car)
                    </label>
                    <Dropdown
                      options={carOptions}
                      value={editCarId}
                      disabled={editMode !== "Office car"}
                      onChange={(val) => setEditCarId(Number(val))}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "14px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 500, color: "#4B5563", marginBottom: "6px" }}>
                      Driver
                    </label>
                    <Dropdown
                      options={driverOptions}
                      value={editDriver}
                      onChange={(val) => setEditDriver(val)}
                    />
                  </div>
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
                </div>

                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "14px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 500, color: "#4B5563", marginBottom: "6px" }}>
                      Start Date
                    </label>
                    <input
                      type="date"
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
                      min={editStartDate}
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

                {editMode !== "Office car" && (
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "14px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 500, color: "#4B5563", marginBottom: "6px" }}>
                        Cost (₦)
                      </label>
                      <input
                        type="number"
                        placeholder="Cost in Naira"
                        value={editCost}
                        onChange={(e) => setEditCost(e.target.value === "" ? "" : Number(e.target.value))}
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
                        Receipt
                      </label>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) {
                            setEditReceiptName(f.name);
                            setEditReceiptURL(URL.createObjectURL(f));
                          }
                        }}
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          fontSize: "0.85rem",
                          border: "1.5px solid #E5E7EB",
                          borderRadius: "8px",
                          outline: "none"
                        }}
                      />
                      {editReceiptName && (
                        <div style={{ fontSize: "0.72rem", color: "#6B7280", marginTop: "4px" }}>On file: {editReceiptName}</div>
                      )}
                    </div>
                  </div>
                )}

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
                  onClick={() => setEditingTrip(null)}
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
                  onClick={handleSaveTripEdit}
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
                  {isEditPending ? "Saving..." : "Save Trip Changes"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {deletingTrip && (
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
            onClick={() => !isDeletePending && setDeletingTrip(null)}
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
                    Delete Trip Request?
                  </h4>
                  <p style={{ fontSize: "0.78rem", color: "#6B7280", margin: "2px 0 0 0" }}>
                    This will permanently remove the booking and release any assigned vehicle slot.
                  </p>
                </div>
              </div>

              <p style={{ fontSize: "0.85rem", color: "#4B5563", lineHeight: 1.5, margin: "0 0 20px 0" }}>
                Are you sure you want to delete the trip for <strong>{deletingTrip.staff}</strong> to{" "}
                <strong>{deletingTrip.dest}</strong> on <strong>{deletingTrip.date}</strong>?
              </p>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  disabled={isDeletePending}
                  onClick={() => setDeletingTrip(null)}
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
                  Keep Trip
                </button>
                <button
                  type="button"
                  disabled={isDeletePending}
                  onClick={() => handleDeleteTrip(deletingTrip.id)}
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
                  {isDeletePending ? "Deleting..." : "Yes, Delete Trip"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}

