"use client";

import React, { useState } from "react";
import { useFleet } from "../layout";
import { API_BASE_URL } from "../../config";
import Dropdown from "../../components/Dropdown";

const SERVICE_INTERVAL = 5000;
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

export default function MaintenancePage() {
  const {
    currentUser,
    cars,
    setCars,
    maintLogs,
    setMaintLogs,
    issueLogs,
    setIssueLogs,
    nextIssueId,
    setNextIssueId,
    showToastMsg
  } = useFleet();

  const todayISO = new Date().toISOString().slice(0, 10);

  const [isCar, setIsCar] = useState(1);
  const [isSev, setIsSev] = useState("Low");
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
  const [isIssuePending, setIsIssuePending] = useState(false);
  const [isSvcPending, setIsSvcPending] = useState(false);

  const isAdminUser = currentUser?.name === "Godsfavour Nyoyoko";
  const isDriverUser = currentUser ? ["Peter Agbo", "Ameh Friday", "Louis Ogbuneke"].includes(currentUser.name) : false;

  const carOptions = cars.map((c) => ({
    value: c.id,
    label: `${c.plate !== "TBD" ? c.plate + " - " : ""}${c.name} (${c.co === "Tractrac" ? "TracTrac" : c.co === "Ikore" ? "Ikore" : "ChananHill"})`
  }));

  const severityOptions = [
    { value: "Low", label: "Low - note for next service" },
    { value: "Medium", label: "Medium - needs attention soon" },
    { value: "High", label: "High - unsafe / stop using vehicle" }
  ];

  const categoryOptions = MAINT_CATEGORIES.map((m) => ({
    value: m,
    label: m
  }));

  const fmtN = (n: number): string => {
    return n.toLocaleString("en-NG");
  };

  const handleIssueSubmit = async (e: React.FormEvent) => {
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

    const newIssue = {
      carId: isCar,
      date: todayISO,
      driver: currentUser.name,
      severity: isSev,
      desc: isDesc.trim()
    };

    setIsIssuePending(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/issues`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newIssue)
      });
      if (!response.ok) {
        throw new Error("Failed to log issue on server.");
      }
      const savedIssue = await response.json();
      setIssueLogs([...issueLogs, savedIssue]);

      setIssueMsg({
        text: `Issue logged for ${c.name}. The fleet manager will see it here.`,
        type: "ok"
      });
      setIsDesc("");
      showToastMsg("Issue logged");
    } catch (err: any) {
      setIssueMsg({ text: err.message || "Failed to log issue.", type: "err" });
    } finally {
      setIsIssuePending(false);
    }
  };

  const handleResolveIssue = async (id: number) => {
    if (!currentUser) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/issues/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "Resolved",
          resolvedBy: currentUser.name
        })
      });
      if (!response.ok) throw new Error();
      const updated = await response.json();
      setIssueLogs(
        issueLogs.map((i) => (i.id === id ? updated : i))
      );
      showToastMsg("Issue marked resolved");
    } catch (err) {
      showToastMsg("Failed to resolve issue on server");
    }
  };

  const handleMaintenanceSubmit = async (e: React.FormEvent) => {
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

    const newMaint = {
      carId: svCar,
      date: todayISO,
      type: svType,
      odo: odoNum,
      cost: costNum || 0,
      workshop: svWorkshop.trim(),
      notes: svNotes.trim()
    };

    setIsSvcPending(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/maintenance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMaint)
      });
      if (!response.ok) {
        throw new Error("Failed to save maintenance record on server.");
      }
      const savedMaint = await response.json();
      setMaintLogs([...maintLogs, savedMaint]);
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
    } catch (err: any) {
      setSvcMsg({ text: err.message || "Failed to save maintenance record.", type: "err" });
    } finally {
      setIsSvcPending(false);
    }
  };

  return (
    <section className="active">
      <div className="panel" style={{ maxWidth: "860px", marginBottom: "20px" }}>
        <h2>Maintenance status - all vehicles</h2>
        <p className="desc">
          Routine servicing is due every 5,000 km; status below compares each car's odometer
          against its last routine service. Other repairs - brake pads, tyres, suspension and so
          on - are recorded in the maintenance log and history underneath.
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
                  <span className={`co-chip ${c.co === "Tractrac" ? "tt" : c.co === "Ikore" ? "ik" : "ch"}`}>
                    {c.co === "Tractrac" ? "TracTrac" : c.co === "Ikore" ? "Ikore" : "ChananHill"}
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
          Drivers log faults and observations here - anything from a warning light to unusual noises
          - so the fleet manager can schedule the fix before it becomes a breakdown.
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
              <Dropdown
                options={carOptions}
                value={isCar}
                onChange={(val) => setIsCar(Number(val))}
                placeholder="Select vehicle…"
              />
            </div>
            <div>
              <label htmlFor="isSev">Severity</label>
              <Dropdown
                options={severityOptions}
                value={isSev}
                onChange={(val) => setIsSev(val)}
                placeholder="Select severity…"
              />
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
          <button type="submit" className="btn" id="isSubmit" disabled={isIssuePending}>
            {isIssuePending ? "Logging..." : "Log issue"}
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
        {issueLogs.length === 0 && (
          <div style={{ padding: "40px", textAlign: "center", color: "#6B7280", fontSize: "0.88rem" }}>
            No open or resolved issues reported yet.
          </div>
        )}
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
              <Dropdown
                options={carOptions}
                value={svCar}
                onChange={(val) => setSvCar(Number(val))}
                placeholder="Select vehicle…"
              />
            </div>
            <div>
              <label htmlFor="svType">Maintenance category</label>
              <Dropdown
                options={categoryOptions}
                value={svType}
                onChange={(val) => setSvType(val)}
                placeholder="Select category…"
              />
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
          <button type="submit" className="btn" id="svSubmit" disabled={isSvcPending}>
            {isSvcPending ? "Saving..." : "Save maintenance record"}
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
                    <td>{s.notes || "-"}</td>
                  </tr>
                );
              })}
          </tbody>
        </table>
        {maintLogs.filter((s) => svcFilter === "all" || s.type === svcFilter).length === 0 && (
          <div style={{ padding: "40px", textAlign: "center", color: "#6B7280", fontSize: "0.88rem" }}>
            No maintenance records found.
          </div>
        )}
      </div>
    </section>
  );
}
