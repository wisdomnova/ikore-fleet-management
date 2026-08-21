"use client";

import React from "react";
import { useFleet, DRIVER_NAMES } from "../layout";
import { API_BASE_URL } from "../../config";
import Dropdown from "../../components/Dropdown";

const DAY_START = 8;
const DAY_END = 22;
const ADMIN_NAME = "Godsfavour Nyoyoko";

export default function ApprovalsPage() {
  const {
    currentUser,
    cars,
    bookings,
    setBookings,
    showToastMsg
  } = useFleet();

  const [isMobile, setIsMobile] = React.useState(false);
  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const todayISO = new Date().toISOString().slice(0, 10);

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
    ...DRIVER_NAMES.map((d) => ({ value: d, label: d })),
    { value: "Self-drive (approved staff)", label: "Self-drive (approved staff)" },
    { value: "Bolt ride (arranged)", label: "Bolt ride (arranged)" },
    { value: "Hired vehicle with driver", label: "Hired vehicle with driver" }
  ];

  const isOfficeTrip = (b: any) => !b.mode || b.mode === "Office car";

  const mins = (t: string): number => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };

  const fmtN = (n: number): string => {
    return n.toLocaleString("en-NG");
  };

  // Actions
  const handleApprove = async (id: number) => {
    if (!currentUser) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/bookings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "approved",
          decidedAt: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
          decidedBy: currentUser.name
        })
      });
      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        console.error("Approve failed:", response.status, errBody);
        throw new Error(errBody?.error || "Server error");
      }
      const updated = await response.json();
      setBookings(bookings.map((b) => (b.id === id ? updated : b)));
      showToastMsg("Approved - trip confirmed");
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
        showToastMsg(`${c?.name || "Vehicle"} is taken ${clash.start} - ${clash.end} (${clash.staff})`);
        return;
      }
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

  const isAdminUser = currentUser?.name === ADMIN_NAME || currentUser?.name === "Divine Wisdom";
  const mine = (b: any) => currentUser && (isAdminUser || b.manager === currentUser.name);
  const pending = bookings.filter((b) => b.status === "pending").filter(mine);
  const decided = bookings.filter((b) => b.status !== "pending" && b.decidedAt && mine(b)).slice(-6).reverse();

  return (
    <section className="active">
      {/* Header Panel */}
      <div style={{ background: "#F9FAFB", borderRadius: "12px", padding: "28px", marginBottom: "32px" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 500, color: "#111827", marginBottom: "10px" }}>Approvals</h2>
        <p style={{ fontSize: "0.82rem", color: "#6B7280", lineHeight: 1.5, margin: 0 }}>
          {isAdminUser
            ? "As fleet manager you can see and decide every pending request across both companies, and you can adjust any trip: change the vehicle, driver, or timing, or move it to a car hire service or Bolt."
            : "Booking requests routed to you as an approver. Pending requests hold their slot on the fleet board (shown dashed) so the time cannot be double-booked while a decision is made."}
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.6fr 1fr", gap: "32px", alignItems: "start" }}>
        {/* Left Column: Pending and Active */}
        <div>
          <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "#111827", marginBottom: "16px" }}>Pending Requests</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {pending.map((b) => {
              const c = cars.find((car) => car.id === b.carId);
              return (
                <div
                  key={b.id}
                  style={{
                    background: "#F9FAFB",
                    borderRadius: "16px",
                    padding: "24px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px"
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
                      <div style={{ fontSize: "0.72rem", color: "#9CA3AF", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em" }}>Driver</div>
                      <div style={{ fontSize: "0.88rem", fontWeight: 500, color: "#1F2937", marginTop: "4px" }}>
                        {b.driver}
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

                  {isAdminUser && (
                    <details style={{ marginTop: "12px", borderTop: "none" }} className="adj">
                      <summary style={{ fontSize: "0.78rem", fontWeight: 600, color: "#4B5563", textTransform: "uppercase", letterSpacing: "0.05em", cursor: "pointer", padding: "8px 0" }}>
                        Fleet manager - adjust this trip
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
                            <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#4B5563", marginBottom: "6px", display: "block" }}>Driver</label>
                            <Dropdown
                              options={driverOptions}
                              value={b.driver}
                              onChange={(val) => handleSaveAdjustment(b.id, { driver: val })}
                            />
                          </div>
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
                        </div>
                        <div className="frow" style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "16px", marginTop: 0 }}>
                          <div>
                            <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#4B5563", marginBottom: "6px", display: "block" }}>Ride / hire cost (₦)</label>
                            <input
                              type="number"
                              placeholder="e.g. 4500"
                              value={b.cost || ""}
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
                                handleSaveAdjustment(b.id, { cost: Number(e.target.value) })
                              }
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#4B5563", marginBottom: "6px", display: "block" }}>Upload receipt</label>
                            <input
                              type="file"
                              accept="image/*,.pdf"
                              style={{
                                border: "none",
                                background: "#F3F4F6",
                                borderRadius: "8px",
                                padding: "8px 12px",
                                fontSize: "0.85rem",
                                outline: "none",
                                color: "#1F2937",
                                width: "100%"
                              }}
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
                              <div style={{ fontSize: "0.72rem", color: "#6B7280", marginTop: "4px" }}>On file: {b.receiptName}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </details>
                  )}
                </div>
              );
            })}
            
            {pending.length === 0 && (
              <div style={{ padding: "40px", background: "#FAFBFB", borderRadius: "12px", textAlign: "center", color: "#6B7280", fontSize: "0.88rem" }}>
                No requests waiting for you. New booking requests naming you as approver will appear here.
              </div>
            )}
          </div>

          {/* Active Today section */}
          {isAdminUser && bookings.filter((b) => b.date === todayISO && b.status === "approved").length > 0 && (
            <div style={{ marginTop: "40px" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "#111827", marginBottom: "16px" }}>Active Today</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {bookings
                  .filter((b) => b.date === todayISO && b.status === "approved")
                  .map((b) => {
                    const c = cars.find((car) => car.id === b.carId);
                    return (
                      <div
                        key={b.id}
                        style={{
                          background: "#F9FAFB",
                          borderRadius: "16px",
                          padding: "24px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "16px"
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

                        <details style={{ borderTop: "none" }} className="adj">
                          <summary style={{ fontSize: "0.78rem", fontWeight: 600, color: "#4B5563", textTransform: "uppercase", letterSpacing: "0.05em", cursor: "pointer", padding: "8px 0" }}>
                            Fleet manager - adjust this trip
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
                                <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#4B5563", marginBottom: "6px", display: "block" }}>Driver</label>
                                <Dropdown
                                  options={driverOptions}
                                  value={b.driver}
                                  onChange={(val) => handleSaveAdjustment(b.id, { driver: val })}
                                />
                              </div>
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
                            </div>
                            <div className="frow" style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "16px", marginTop: 0 }}>
                              <div>
                                <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#4B5563", marginBottom: "6px", display: "block" }}>Ride / hire cost (₦)</label>
                                <input
                                  type="number"
                                  placeholder="e.g. 4500"
                                  value={b.cost || ""}
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
                                    handleSaveAdjustment(b.id, { cost: Number(e.target.value) })
                                  }
                                />
                              </div>
                              <div>
                                <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#4B5563", marginBottom: "6px", display: "block" }}>Upload receipt</label>
                                <input
                                  type="file"
                                  accept="image/*,.pdf"
                                  style={{
                                    border: "none",
                                    background: "#F3F4F6",
                                    borderRadius: "8px",
                                    padding: "8px 12px",
                                    fontSize: "0.85rem",
                                    outline: "none",
                                    color: "#1F2937",
                                    width: "100%"
                                  }}
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
                                  <div style={{ fontSize: "0.72rem", color: "#6B7280", marginTop: "4px" }}>On file: {b.receiptName}</div>
                                )}
                              </div>
                            </div>
                          </div>
                        </details>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Recent Activity */}
        <div>
          <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "#111827", marginBottom: "16px" }}>Recent Activity</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {decided.map((b) => {
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
                    opacity: 0.9
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                    <span style={{ fontWeight: 600, fontSize: "0.88rem", color: "#111827" }}>{b.staff}</span>
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
                  </div>

                  <div style={{ fontSize: "0.8rem", color: "#4B5563", lineHeight: 1.4 }}>
                    {c?.plate ? `${c.plate} · ` : ""}{b.start} - {b.end}
                  </div>

                  <div style={{ fontSize: "0.72rem", color: "#9CA3AF", borderTop: "1px solid #F3F4F6", paddingTop: "8px" }}>
                    Decided by {b.decidedBy || b.manager} at {b.decidedAt}
                  </div>
                </div>
              );
            })}

            {decided.length === 0 && (
              <div style={{ padding: "40px", background: "#FAFBFB", borderRadius: "12px", textAlign: "center", color: "#6B7280", fontSize: "0.88rem" }}>
                No recent activity.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
