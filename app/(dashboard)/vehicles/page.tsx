"use client";

import React, { useState } from "react";
import { useFleet } from "../layout";
import { API_BASE_URL } from "../../config";
import { VehicleDocument, parseVehicleDocuments, serializeVehicleDocuments } from "../../utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  IconFileText,
  IconPlus,
  IconTrash,
  IconCalendar,
  IconAlertTriangle,
  IconCheck,
  IconX,
  IconShieldCheck,
  IconEdit
} from "@tabler/icons-react";

const DOCUMENT_PRESETS = [
  "Vehicle License / Registration",
  "Comprehensive Insurance",
  "Third-Party Insurance",
  "Roadworthiness Certificate",
  "Hackney / State Carriage Permit",
  "Local Govt / Heavy Duty Permit",
  "Tint Permit",
  "Customs Clearance",
  "Other Document"
];

export default function VehiclesPage() {
  const {
    currentUser,
    cars,
    setCars,
    bookings,
    showToastMsg
  } = useFleet();

  const [nvName, setNvName] = useState("");
  const [nvPlate, setNvPlate] = useState("");
  const [nvCo, setNvCo] = useState<"Tractrac" | "Ikore" | "ChananHill">("Tractrac");
  const [nvOdo, setNvOdo] = useState("");
  const [nvDocs, setNvDocs] = useState<VehicleDocument[]>([]);
  const [vehAddMsg, setVehAddMsg] = useState({ text: "", type: "" });
  const [isAddPending, setIsAddPending] = useState(false);

  // Edit State
  const [editFields, setEditFields] = useState<
    Record<
      number,
      {
        name: string;
        plate: string;
        co: "Tractrac" | "Ikore" | "ChananHill";
        odo: number;
        docs: VehicleDocument[];
        shop: boolean;
      }
    >
  >({});

  // Active Document Modal for specific car
  const [docModalCarId, setDocModalCarId] = useState<number | null>(null);

  const isAdminUser =
    currentUser?.name === "Godsfavour Nyoyoko" || currentUser?.name === "Divine Wisdom";

  const getFields = (c: any) => {
    return (
      editFields[c.id] || {
        name: c.name,
        plate: c.plate,
        co: c.co,
        odo: c.odo,
        docs: parseVehicleDocuments(c.papers),
        shop: c.shop
      }
    );
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

  const handleCarSave = async (id: number) => {
    const fields = editFields[id] || getFields(cars.find((c) => c.id === id));
    if (!fields) return;
    if (!fields.name.trim()) {
      showToastMsg("Vehicle name cannot be empty");
      return;
    }
    const updateBody = {
      name: fields.name.trim(),
      plate: fields.plate.trim() || "TBD",
      company: fields.co,
      odo: fields.odo,
      papers: serializeVehicleDocuments(fields.docs),
      shop: fields.shop
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/vehicles/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateBody)
      });
      if (!response.ok) throw new Error();
      const updatedCar = await response.json();
      setCars(cars.map((c) => (c.id === id ? updatedCar : c)));
      showToastMsg(`${fields.name} updated with ${fields.docs.length} documents`);
    } catch (err) {
      showToastMsg(`Failed to save changes for ${fields.name}`);
    }
  };

  const handleCarRemove = async (id: number) => {
    const c = cars.find((car) => car.id === id);
    if (!c) return;
    if (!confirm(`Remove ${c.name} (${c.plate}) from the fleet?`)) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/vehicles/${id}`, {
        method: "DELETE"
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to remove vehicle");
      }
      setCars(cars.filter((car) => car.id !== id));
      showToastMsg(`${c.name} removed from the fleet`);
    } catch (err: any) {
      showToastMsg(err.message || "Failed to remove vehicle on server");
    }
  };

  const handleCarAdd = async (e: React.FormEvent) => {
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
      plate: plateVal,
      name: nvName.trim(),
      company: nvCo,
      fuel: 50,
      odo: odoVal,
      loc: "Head office, Utako",
      locT: "Just added",
      shop: false,
      papers: serializeVehicleDocuments(nvDocs)
    };

    setIsAddPending(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/vehicles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCar)
      });
      if (!response.ok) throw new Error("Failed to add vehicle to server.");
      const savedCar = await response.json();
      setCars([...cars, savedCar]);

      setVehAddMsg({ text: `${nvName} added to the fleet.`, type: "ok" });
      setNvName("");
      setNvPlate("");
      setNvOdo("");
      setNvDocs([]);
      showToastMsg(`${nvName} added with ${nvDocs.length} documents`);
    } catch (err: any) {
      setVehAddMsg({ text: err.message || "Failed to add vehicle.", type: "err" });
    } finally {
      setIsAddPending(false);
    }
  };

  // Helper to add doc to a vehicle
  const addDocToCar = (carId: number) => {
    const current = getFields(cars.find((c) => c.id === carId));
    const newDoc: VehicleDocument = {
      id: Math.random().toString(36).slice(2, 9),
      name: DOCUMENT_PRESETS[0],
      expiry: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().slice(0, 10),
      docNo: "",
      notes: ""
    };
    setField(carId, { docs: [...current.docs, newDoc] });
  };

  const updateCarDoc = (carId: number, docId: string, updates: Partial<VehicleDocument>) => {
    const current = getFields(cars.find((c) => c.id === carId));
    const updatedDocs = current.docs.map((d: VehicleDocument) => (d.id === docId ? { ...d, ...updates } : d));
    setField(carId, { docs: updatedDocs });
  };

  const removeCarDoc = (carId: number, docId: string) => {
    const current = getFields(cars.find((c) => c.id === carId));
    const updatedDocs = current.docs.filter((d: VehicleDocument) => d.id !== docId);
    setField(carId, { docs: updatedDocs });
  };

  // Helper to add doc to new car form
  const addDocToNewCar = () => {
    const newDoc: VehicleDocument = {
      id: Math.random().toString(36).slice(2, 9),
      name: DOCUMENT_PRESETS[0],
      expiry: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().slice(0, 10),
      docNo: "",
      notes: ""
    };
    setNvDocs([...nvDocs, newDoc]);
  };

  const updateNewCarDoc = (docId: string, updates: Partial<VehicleDocument>) => {
    setNvDocs(nvDocs.map((d) => (d.id === docId ? { ...d, ...updates } : d)));
  };

  const removeNewCarDoc = (docId: string) => {
    setNvDocs(nvDocs.filter((d) => d.id !== docId));
  };

  return (
    <section className="active">
      <div className="panel" style={{ maxWidth: "860px", marginBottom: "20px" }}>
        <h2>Manage Vehicles & Document Registry</h2>
        <p className="desc">
          Fleet manager only. Track vehicle plates, company ownership, odometer readings, and
          comprehensive vehicle documents (Vehicle License, Comprehensive Insurance, Roadworthiness,
          Permits, etc.) with automated expiry warnings.
        </p>
      </div>

      <div id="vehList">
        {isAdminUser ? (
          cars.map((c) => {
            const hasBookings = bookings.some((b) => b.carId === c.id && b.status !== "declined");
            const fields = getFields(c);
            const docs: VehicleDocument[] = fields.docs || [];

            // Check expiring docs
            const now = new Date().getTime();
            const expiringDocs = docs.filter((d) => {
              if (!d.expiry) return false;
              const expTime = new Date(d.expiry).getTime();
              const daysLeft = Math.round((expTime - now) / 86400000);
              return daysLeft < 60;
            });

            return (
              <div
                className="appr-card"
                style={{
                  borderLeftColor: c.co === "Tractrac" ? "var(--tt)" : c.co === "Ikore" ? "var(--ik)" : "var(--ch)",
                  maxWidth: "860px",
                  marginBottom: "24px"
                }}
                key={c.id}
              >
                <div className="appr-top">
                  <span className="appr-title">
                    <span className="plate">{c.plate}</span> {c.name}{" "}
                    <span className={`co-chip ${c.co === "Tractrac" ? "tt" : c.co === "Ikore" ? "ik" : "ch"}`}>
                      {c.co === "Tractrac" ? "TracTrac" : c.co === "Ikore" ? "Ikore" : "ChananHill"}
                    </span>
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {expiringDocs.length > 0 && (
                      <span
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: 600,
                          background: "#FEF2F2",
                          color: "#DC2626",
                          padding: "3px 8px",
                          borderRadius: "999px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px"
                        }}
                      >
                        <IconAlertTriangle size={12} />
                        {expiringDocs.length} doc{expiringDocs.length > 1 ? "s" : ""} expiring soon
                      </span>
                    )}
                    {c.shop ? (
                      <span className="status-pill shop">Workshop</span>
                    ) : (
                      <span className="status-pill free">In service</span>
                    )}
                  </div>
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
                      onChange={(e) => setField(c.id, { co: e.target.value as any })}
                    >
                      <option value="Tractrac">TracTrac</option>
                      <option value="Ikore">Ikore</option>
                      <option value="ChananHill">ChananHill</option>
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
                    <label>Status</label>
                    <select
                      value={fields.shop ? "yes" : "no"}
                      onChange={(e) => setField(c.id, { shop: e.target.value === "yes" })}
                    >
                      <option value="no">In service - bookable</option>
                      <option value="yes">In workshop - not bookable</option>
                    </select>
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-end" }}>
                    <button
                      type="button"
                      onClick={() => setDocModalCarId(c.id)}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        background: "#F3F4F6",
                        border: "1px solid #D1D5DB",
                        borderRadius: "8px",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        color: "#374151",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px"
                      }}
                    >
                      <IconFileText size={16} />
                      <span>Manage Vehicle Documents ({docs.length})</span>
                    </button>
                  </div>
                </div>

                {/* Inline Document Preview */}
                {docs.length > 0 && (
                  <div style={{ marginTop: "12px", background: "#F9FAFB", padding: "12px", borderRadius: "8px" }}>
                    <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#4B5563", marginBottom: "6px" }}>
                      Registered Documents:
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                      {docs.map((d) => {
                        const exp = d.expiry ? new Date(d.expiry) : null;
                        const daysLeft = exp ? Math.round((exp.getTime() - now) / 86400000) : 999;
                        const isExpired = daysLeft < 0;
                        const isExpiringSoon = daysLeft >= 0 && daysLeft < 60;

                        return (
                          <div
                            key={d.id}
                            style={{
                              background: "#FFFFFF",
                              border: `1px solid ${isExpired ? "#FCA5A5" : isExpiringSoon ? "#FDE68A" : "#E5E7EB"}`,
                              borderRadius: "6px",
                              padding: "4px 8px",
                              fontSize: "0.75rem",
                              display: "flex",
                              alignItems: "center",
                              gap: "6px"
                            }}
                          >
                            <span style={{ fontWeight: 500, color: "#111827" }}>{d.name}</span>
                            {d.expiry && (
                              <span
                                style={{
                                  fontSize: "0.7rem",
                                  color: isExpired ? "#DC2626" : isExpiringSoon ? "#D97706" : "#6B7280"
                                }}
                              >
                                (Exp: {d.expiry})
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="appr-actions" style={{ gap: "10px", marginTop: "16px" }}>
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
                      Has bookings on record - cannot be removed
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
        <div className="panel" style={{ marginTop: "26px", maxWidth: "860px" }}>
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
                  onChange={(e) => setNvCo(e.target.value as any)}
                >
                  <option value="Tractrac">TracTrac</option>
                  <option value="Ikore">Ikore</option>
                  <option value="ChananHill">ChananHill</option>
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

            {/* Document List for New Vehicle */}
            <div style={{ marginTop: "16px", background: "#F9FAFB", padding: "16px", borderRadius: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#1F2937" }}>
                  Vehicle Documents & Permits ({nvDocs.length})
                </span>
                <button
                  type="button"
                  onClick={addDocToNewCar}
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid #D1D5DB",
                    borderRadius: "6px",
                    padding: "4px 10px",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px"
                  }}
                >
                  <IconPlus size={14} />
                  <span>Add Document</span>
                </button>
              </div>

              {nvDocs.length === 0 && (
                <div style={{ fontSize: "0.8rem", color: "#9CA3AF" }}>
                  No documents added yet. Click &ldquo;Add Document&rdquo; to add insurance, roadworthiness, or vehicle license.
                </div>
              )}

              {nvDocs.map((doc, idx) => (
                <div
                  key={doc.id}
                  style={{
                    background: "#FFFFFF",
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid #E5E7EB",
                    marginBottom: "8px",
                    display: "grid",
                    gridTemplateColumns: "1.5fr 1fr 1fr auto",
                    gap: "8px",
                    alignItems: "center"
                  }}
                >
                  <div>
                    <input
                      type="text"
                      list={`doc-presets-${doc.id}`}
                      value={doc.name}
                      placeholder="Document Name"
                      onChange={(e) => updateNewCarDoc(doc.id, { name: e.target.value })}
                      style={{ width: "100%", padding: "6px 8px", fontSize: "0.8rem", border: "1px solid #D1D5DB", borderRadius: "6px" }}
                    />
                    <datalist id={`doc-presets-${doc.id}`}>
                      {DOCUMENT_PRESETS.map((preset) => (
                        <option key={preset} value={preset} />
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <input
                      type="text"
                      value={doc.docNo || ""}
                      placeholder="Doc / Reg #"
                      onChange={(e) => updateNewCarDoc(doc.id, { docNo: e.target.value })}
                      style={{ width: "100%", padding: "6px 8px", fontSize: "0.8rem", border: "1px solid #D1D5DB", borderRadius: "6px" }}
                    />
                  </div>
                  <div>
                    <input
                      type="date"
                      value={doc.expiry || ""}
                      onChange={(e) => updateNewCarDoc(doc.id, { expiry: e.target.value })}
                      style={{ width: "100%", padding: "6px 8px", fontSize: "0.8rem", border: "1px solid #D1D5DB", borderRadius: "6px" }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeNewCarDoc(doc.id)}
                    style={{ background: "transparent", border: "none", color: "#DC2626", cursor: "pointer", padding: "4px" }}
                  >
                    <IconTrash size={16} />
                  </button>
                </div>
              ))}
            </div>

            <button type="submit" className="btn" id="nvAdd" disabled={isAddPending} style={{ marginTop: "18px" }}>
              {isAddPending ? "Adding..." : "Add vehicle"}
            </button>
          </form>
        </div>
      )}

      {/* DOCUMENT MANAGEMENT MODAL FOR CAR */}
      <AnimatePresence>
        {docModalCarId !== null && (
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
            onClick={() => setDocModalCarId(null)}
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
                maxWidth: "700px",
                maxHeight: "90vh",
                overflowY: "auto",
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)"
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {(() => {
                const targetCar = cars.find((c) => c.id === docModalCarId);
                const fields = targetCar ? getFields(targetCar) : null;
                const carDocs: VehicleDocument[] = fields?.docs || [];

                return (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                      <div>
                        <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "#111827", margin: 0 }}>
                          Vehicle Documents & Registry
                        </h3>
                        <p style={{ fontSize: "0.78rem", color: "#6B7280", margin: "4px 0 0 0" }}>
                          {targetCar?.plate} · {targetCar?.name} ({targetCar?.co})
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setDocModalCarId(null)}
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

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                      <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#374151" }}>
                        Registered Papers ({carDocs.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => addDocToCar(docModalCarId)}
                        style={{
                          background: "#1F2937",
                          color: "#FFFFFF",
                          border: "none",
                          borderRadius: "6px",
                          padding: "6px 12px",
                          fontSize: "0.78rem",
                          fontWeight: 500,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px"
                        }}
                      >
                        <IconPlus size={14} />
                        <span>Add Document</span>
                      </button>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "400px", overflowY: "auto" }}>
                      {carDocs.map((d, index) => {
                        const exp = d.expiry ? new Date(d.expiry) : null;
                        const now = new Date().getTime();
                        const daysLeft = exp ? Math.round((exp.getTime() - now) / 86400000) : 999;
                        const isExpired = daysLeft < 0;
                        const isExpiringSoon = daysLeft >= 0 && daysLeft < 60;

                        return (
                          <div
                            key={d.id}
                            style={{
                              background: "#F9FAFB",
                              borderRadius: "10px",
                              padding: "14px",
                              border: `1px solid ${isExpired ? "#FCA5A5" : isExpiringSoon ? "#FDE68A" : "#E5E7EB"}`
                            }}
                          >
                            <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr auto", gap: "10px", alignItems: "center" }}>
                              <div>
                                <label style={{ display: "block", fontSize: "0.72rem", color: "#6B7280", marginBottom: "3px" }}>
                                  Document Title
                                </label>
                                <input
                                  type="text"
                                  list={`modal-presets-${d.id}`}
                                  value={d.name}
                                  placeholder="e.g. Comprehensive Insurance"
                                  onChange={(e) => updateCarDoc(docModalCarId, d.id, { name: e.target.value })}
                                  style={{
                                    width: "100%",
                                    padding: "8px 10px",
                                    fontSize: "0.82rem",
                                    border: "1px solid #D1D5DB",
                                    borderRadius: "6px",
                                    background: "#FFFFFF"
                                  }}
                                />
                                <datalist id={`modal-presets-${d.id}`}>
                                  {DOCUMENT_PRESETS.map((p) => (
                                    <option key={p} value={p} />
                                  ))}
                                </datalist>
                              </div>
                              <div>
                                <label style={{ display: "block", fontSize: "0.72rem", color: "#6B7280", marginBottom: "3px" }}>
                                  Doc / Policy #
                                </label>
                                <input
                                  type="text"
                                  value={d.docNo || ""}
                                  placeholder="Optional ID"
                                  onChange={(e) => updateCarDoc(docModalCarId, d.id, { docNo: e.target.value })}
                                  style={{
                                    width: "100%",
                                    padding: "8px 10px",
                                    fontSize: "0.82rem",
                                    border: "1px solid #D1D5DB",
                                    borderRadius: "6px",
                                    background: "#FFFFFF"
                                  }}
                                />
                              </div>
                              <div>
                                <label style={{ display: "block", fontSize: "0.72rem", color: "#6B7280", marginBottom: "3px" }}>
                                  Expiry Date
                                </label>
                                <input
                                  type="date"
                                  value={d.expiry || ""}
                                  onChange={(e) => updateCarDoc(docModalCarId, d.id, { expiry: e.target.value })}
                                  style={{
                                    width: "100%",
                                    padding: "8px 10px",
                                    fontSize: "0.82rem",
                                    border: "1px solid #D1D5DB",
                                    borderRadius: "6px",
                                    background: "#FFFFFF"
                                  }}
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => removeCarDoc(docModalCarId, d.id)}
                                title="Remove document"
                                style={{
                                  background: "transparent",
                                  border: "none",
                                  color: "#DC2626",
                                  cursor: "pointer",
                                  padding: "6px",
                                  marginTop: "16px"
                                }}
                              >
                                <IconTrash size={18} />
                              </button>
                            </div>

                            {/* Status Pill */}
                            {d.expiry && (
                              <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
                                <span
                                  style={{
                                    fontSize: "0.7rem",
                                    fontWeight: 600,
                                    padding: "2px 8px",
                                    borderRadius: "999px",
                                    background: isExpired ? "#FEE2E2" : isExpiringSoon ? "#FEF3C7" : "#DCFCE7",
                                    color: isExpired ? "#DC2626" : isExpiringSoon ? "#D97706" : "#16A34A"
                                  }}
                                >
                                  {isExpired
                                    ? `Expired (${Math.abs(daysLeft)} days ago)`
                                    : isExpiringSoon
                                    ? `Renew soon (${daysLeft} days left)`
                                    : "Valid"}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {carDocs.length === 0 && (
                        <div style={{ padding: "30px", background: "#F9FAFB", textAlign: "center", borderRadius: "8px", color: "#6B7280", fontSize: "0.85rem" }}>
                          No documents recorded for this vehicle. Click &ldquo;Add Document&rdquo; above.
                        </div>
                      )}
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
                      <button
                        type="button"
                        onClick={() => setDocModalCarId(null)}
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
                        Close
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleCarSave(docModalCarId);
                          setDocModalCarId(null);
                        }}
                        style={{
                          background: "#1F2937",
                          border: "none",
                          borderRadius: "8px",
                          padding: "10px 20px",
                          fontSize: "0.85rem",
                          fontWeight: 500,
                          color: "#FFFFFF",
                          cursor: "pointer"
                        }}
                      >
                        Save & Apply Changes
                      </button>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}

