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

  const todayISO = new Date().toISOString().slice(0, 10);

  const modeOptions = [
    { value: "Office car", label: "Office car" },
    { value: "Car hire service", label: "Car hire service" },
    { value: "Bolt", label: "Bolt (ride-hailing)" }
  ];

  const carOptions = cars.map((car) => ({
    value: car.id,
    label: `${car.plate !== "TBD" ? car.plate + " - " : ""}${car.name} (${car.co === "Tractrac" ? "TracTrac" : "Ikore"})${car.shop ? " - workshop" : ""}`
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
        showToastMsg(`${c?.name || "Vehicle"} is taken ${clash.start}–${clash.end} (${clash.staff})`);
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
      <div style={{ background: "#FFFFFF", border: "1.5px solid #E5E7EB", borderRadius: "12px", padding: "28px", marginBottom: "32px" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 400, color: "#111827", marginBottom: "10px" }}>Approvals</h2>
        <p style={{ fontSize: "0.82rem", color: "#6B7280", lineHeight: 1.5, margin: 0 }}>
          {isAdminUser
            ? "As fleet manager you can see and decide every pending request across both companies, and you can adjust any trip - change the vehicle, driver, or timing, or move it to a car hire service or Bolt."
            : "Booking requests routed to you as an approver. Pending requests hold their slot on the fleet board (shown dashed) so the time cannot be double-booked while a decision is made."}
        </p>
      </div>

      <div id="apprList">
        {pending.map((b) => {
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
                  {isOfficeTrip(b) && c ? `${c.plate} - ${c.name}` : ""}{" "}
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
                {b.purpose && `Purpose: ${b.purpose} · `}Department: {b.dept || "-"} · Approver:{" "}
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

              {isAdminUser && (
                <details className="adj">
                  <summary>Fleet manager - adjust this trip</summary>
                  <div className="frow">
                    <div>
                      <label>Trip mode</label>
                      <Dropdown
                        options={modeOptions}
                        value={b.mode || "Office car"}
                        onChange={(val) => handleSaveAdjustment(b.id, { mode: val })}
                      />
                    </div>
                    <div>
                      <label>Vehicle (office car trips)</label>
                      <Dropdown
                        options={carOptions}
                        value={b.carId}
                        disabled={!!(b.mode && b.mode !== "Office car")}
                        onChange={(val) => handleSaveAdjustment(b.id, { carId: Number(val) })}
                      />
                    </div>
                  </div>
                  <div className="frow">
                    <div>
                      <label>Driver</label>
                      <Dropdown
                        options={driverOptions}
                        value={b.driver}
                        onChange={(val) => handleSaveAdjustment(b.id, { driver: val })}
                      />
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

        {isAdminUser &&
          bookings
            .filter((b) => b.date === todayISO && b.status === "approved")
            .map((b) => {
              const c = cars.find((car) => car.id === b.carId);
              return (
                <div className="appr-card" style={{ borderLeftColor: "var(--line)" }} key={b.id}>
                  <div className="appr-top">
                    <span className="appr-title">
                      {b.staff} - {isOfficeTrip(b) && c ? `${c.plate}, ` : ""}
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
                    <summary>Fleet manager - adjust this trip</summary>
                    <div className="frow">
                      <div>
                        <label>Trip mode</label>
                        <Dropdown
                          options={modeOptions}
                          value={b.mode || "Office car"}
                          onChange={(val) => handleSaveAdjustment(b.id, { mode: val })}
                        />
                      </div>
                      <div>
                        <label>Vehicle (office car trips)</label>
                        <Dropdown
                          options={carOptions}
                          value={b.carId}
                          disabled={!!(b.mode && b.mode !== "Office car")}
                          onChange={(val) => handleSaveAdjustment(b.id, { carId: Number(val) })}
                        />
                      </div>
                    </div>
                    <div className="frow">
                      <div>
                        <label>Driver</label>
                        <Dropdown
                          options={driverOptions}
                          value={b.driver}
                          onChange={(val) => handleSaveAdjustment(b.id, { driver: val })}
                        />
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

        {decided.map((b) => {
          const c = cars.find((car) => car.id === b.carId);
          const label = { approved: "Approved", pending: "Pending", declined: "Declined" }[b.status];
          const cls = { approved: "free", pending: "pending", declined: "declined" }[b.status];

          return (
            <div className="appr-card done" key={b.id}>
              <div className="appr-top">
                <span className="appr-title">
                  {b.staff} - {c?.plate}, {b.start}–{b.end}
                </span>
                <span className={`status-pill ${cls}`}>{label}</span>
              </div>
              <div className="appr-meta">
                Decided by {b.decidedBy || b.manager} at {b.decidedAt}
              </div>
            </div>
          );
        })}

        {pending.length === 0 && decided.length === 0 && (
          <div className="appr-empty">
            No requests waiting for you. New booking requests naming you as approver will appear here.
          </div>
        )}
      </div>
    </section>
  );
}
