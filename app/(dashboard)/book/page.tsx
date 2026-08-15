"use client";

import React, { useState, useEffect } from "react";
import { useFleet, STAFF } from "../layout";
import { API_BASE_URL } from "../../config";
import Dropdown from "../../components/Dropdown";
import { motion } from "framer-motion";

const DAY_START = 8;
const DAY_END = 22;

export default function BookCarPage() {
  const {
    currentUser,
    cars,
    bookings,
    setBookings,
    nextBookingId,
    setNextBookingId,
    showToastMsg
  } = useFleet();

  const todayISO = new Date().toISOString().slice(0, 10);

  const [bkCar, setBkCar] = useState(1);
  const [bkDate, setBkDate] = useState(todayISO);
  const [bkStart, setBkStart] = useState("08:00");
  const [bkEnd, setBkEnd] = useState("10:00");
  const [bkManager, setBkManager] = useState("");
  const [bkDest, setBkDest] = useState("");
  const [bkDriver, setBkDriver] = useState("Assign any available driver");
  const [bkPurpose, setBkPurpose] = useState("");
  const [bookMsg, setBookMsg] = useState({ text: "", type: "" });

  const isDriverUser = currentUser ? ["Peter Agbo", "Ameh Friday", "Louis Ogbuneke"].includes(currentUser.name) : false;
  const isAdminUser = currentUser?.name === "Godsfavour Nyoyoko";

  const mins = (t: string): number => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };

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
        text: `${targetCar?.plate || "Vehicle"} already has a ${clash.status === "pending" ? "pending request" : "booking"} ${clash.start} - ${clash.end} (${clash.staff}, ${clash.co}). Choose another time or vehicle.`,
        type: "err"
      });
      return;
    }

    const newBkFields = {
      carId: bkCar,
      date: bkDate,
      start: bkStart,
      end: bkEnd,
      staff: currentUser.name + (isDriverUser ? " (Driver)" : ""),
      dept: currentUser.dept || "None",
      co: currentUser.co,
      dest: bkDest.trim() || "None",
      driver: bkDriver,
      purpose: bkPurpose.trim(),
      manager: bkManager
    };

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

      setBookMsg({
        text: `Request sent. ${targetCar?.plate || "Vehicle"} is held for you, ${bkStart} - ${bkEnd}, awaiting approval from ${bkManager}.`,
        type: "ok"
      });
      setBkDest("");
      setBkPurpose("");
      showToastMsg("Request sent for approval");
    } catch (err) {
      setBookMsg({ text: "Failed to send request to the server.", type: "err" });
    }
  };

  const vehicleOptions = cars.map((c) => ({
    value: c.id,
    label: `${c.plate !== "TBD" ? c.plate + " - " : ""}${c.name} (${c.co === "Tractrac" ? "TracTrac" : "Ikore"})${c.shop ? " (In workshop)" : ""}`
  }));

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
    { value: "Peter Agbo", label: "Peter Agbo (TracTrac)" },
    { value: "Ameh Friday", label: "Ameh Friday (TracTrac)" },
    { value: "Louis Ogbuneke", label: "Louis Ogbuneke (Ikore)" },
    { value: "Self-drive (approved staff)", label: "Self-drive (approved staff)" }
  ];

  return (
    <section className="active">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "32px", marginBottom: "40px" }}>

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
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
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
                  value={currentUser ? `${currentUser.dept && currentUser.dept !== "-" && currentUser.dept !== "None" ? currentUser.dept + " · " : ""}${currentUser.co === "Tractrac" ? "TracTrac" : "Ikore"}` : ""}
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

            {/* Form Row 2 */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "#4B5563", marginBottom: "6px" }}>
                  Vehicle
                </label>
                <Dropdown
                  options={vehicleOptions}
                  value={bkCar}
                  onChange={(val) => setBkCar(Number(val))}
                  placeholder="Select vehicle..."
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "#4B5563", marginBottom: "6px" }}>
                  Date
                </label>
                <input
                  type="date"
                  min={todayISO}
                  value={bkDate}
                  onChange={(e) => setBkDate(e.target.value)}
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

            {/* Form Row 3 */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
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
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
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
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
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
              style={{
                width: "100%",
                padding: "14px",
                fontSize: "0.9rem",
                fontWeight: 500,
                color: "#FFFFFF",
                background: "#1F2937",
                border: "none",
                borderRadius: "10px",
                cursor: "pointer",
                transition: "background 0.2s ease"
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#374151"}
              onMouseLeave={(e) => e.currentTarget.style.background = "#1F2937"}
            >
              Send request for approval
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
                        <span className={`co-chip ${b.co === "Tractrac" ? "tt" : "ik"}`}>
                          {b.co === "Tractrac" ? "TracTrac" : "Ikore"}
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
                      <td style={{ padding: "16px", fontSize: "0.85rem", color: "#4B5563" }}>{b.manager}</td>
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
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
