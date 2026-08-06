"use client";

import React, { useState } from "react";
import { useFleet } from "../layout";

export default function VehiclesPage() {
  const {
    currentUser,
    cars,
    setCars,
    bookings,
    nextCarId,
    setNextCarId,
    showToastMsg
  } = useFleet();

  const [nvName, setNvName] = useState("");
  const [nvPlate, setNvPlate] = useState("");
  const [nvCo, setNvCo] = useState<"Tractrac" | "Ikore">("Tractrac");
  const [nvOdo, setNvOdo] = useState("");
  const [nvPapers, setNvPapers] = useState("");
  const [vehAddMsg, setVehAddMsg] = useState({ text: "", type: "" });

  const [editFields, setEditFields] = useState<Record<number, { name: string; plate: string; co: "Tractrac" | "Ikore"; odo: number; papers: string; shop: boolean }>>({});

  const isAdminUser = currentUser?.name === "Godsfavour Nyoyoko";

  const handleCarSave = (id: number) => {
    const fields = editFields[id];
    if (!fields) return;
    if (!fields.name.trim()) {
      showToastMsg("Vehicle name cannot be empty");
      return;
    }
    setCars(
      cars.map((c) =>
        c.id === id
          ? {
              ...c,
              name: fields.name.trim(),
              plate: fields.plate.trim() || "TBD",
              co: fields.co,
              odo: fields.odo,
              papers: fields.papers.trim() || undefined,
              shop: fields.shop
            }
          : c
      )
    );
    showToastMsg(`${fields.name} updated`);
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

    const newCar = {
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

  const getFields = (c: any) => {
    return editFields[c.id] || {
      name: c.name,
      plate: c.plate,
      co: c.co,
      odo: c.odo,
      papers: c.papers || "",
      shop: c.shop
    };
  };

  const setField = (id: number, updates: any) => {
    const current = getFields(cars.find((c) => c.id === id));
    setEditFields({
      ...editFields,
      [id]: {
        ...current,
        ...updates
      }
    });
  };

  return (
    <section className="active">
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
            const fields = getFields(c);
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
                      value={fields.name}
                      onChange={(e) => setField(c.id, { name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label>Plate number</label>
                    <input
                      type="text"
                      value={fields.plate}
                      onChange={(e) => setField(c.id, { plate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="frow">
                  <div>
                    <label>Owning company</label>
                    <select
                      value={fields.co}
                      onChange={(e) => setField(c.id, { co: e.target.value })}
                    >
                      <option value="Tractrac">TracTrac</option>
                      <option value="Ikore">Ikore</option>
                    </select>
                  </div>
                  <div>
                    <label>Odometer (km)</label>
                    <input
                      type="number"
                      value={fields.odo}
                      onChange={(e) => setField(c.id, { odo: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="frow">
                  <div>
                    <label>Document note</label>
                    <input
                      type="text"
                      value={fields.papers}
                      placeholder="e.g. Papers renewal — March 2027"
                      onChange={(e) => setField(c.id, { papers: e.target.value })}
                    />
                  </div>
                  <div>
                    <label>Status</label>
                    <select
                      value={fields.shop ? "yes" : "no"}
                      onChange={(e) => setField(c.id, { shop: e.target.value === "yes" })}
                    >
                      <option value="no">In service — bookable</option>
                      <option value="yes">In workshop — not bookable</option>
                    </select>
                  </div>
                </div>
                <div className="appr-actions" style={{ gap: "10px", marginTop: "10px" }}>
                  <button className="btn small approve" onClick={() => handleCarSave(c.id)}>
                    Save changes
                  </button>
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
  );
}
