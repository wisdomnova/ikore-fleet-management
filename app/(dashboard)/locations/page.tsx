"use client";

import React from "react";
import { useFleet } from "../layout";
import { API_BASE_URL } from "../../config";
import Dropdown from "../../components/Dropdown";

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

export default function LocationsPage() {
  const {
    cars,
    setCars,
    bookings,
    showToastMsg
  } = useFleet();

  const todayISO = new Date().toISOString().slice(0, 10);
  const tNow = new Date();
  const nowMinsVal = tNow.getHours() * 60 + tNow.getMinutes();

  const isOfficeTrip = (b: any) => !b.mode || b.mode === "Office car";

  const handleCheckIn = async (carId: number, loc: string, fuel: number) => {
    const locT = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    
    // Optimistic update
    setCars(
      cars.map((c) =>
        c.id === carId
          ? {
              ...c,
              loc,
              locT,
              fuel
            }
          : c
      )
    );

    try {
      const response = await fetch(`${API_BASE_URL}/api/vehicles/${carId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loc, locT, fuel })
      });
      if (!response.ok) throw new Error();
      const updatedCar = await response.json();
      setCars(cars.map((c) => (c.id === carId ? updatedCar : c)));
      showToastMsg(`Check-in saved for ${updatedCar.plate}`);
    } catch (err) {
      showToastMsg("Failed to save check-in on server");
    }
  };

  const getCarStatus = (c: any) => {
    if (c.shop) return "shop";
    const onTrip = bookings.some(
      (b) =>
        b.carId === c.id &&
        b.status === "approved" &&
        isOfficeTrip(b) &&
        b.date === todayISO &&
        ((b.start.split(":").map(Number)[0] * 60 + b.start.split(":").map(Number)[1]) <= nowMinsVal) &&
        (nowMinsVal < (b.end.split(":").map(Number)[0] * 60 + b.end.split(":").map(Number)[1]))
    );
    return onTrip ? "trip" : "free";
  };

  return (
    <section className="active">
      {/* Header Panel */}
      <div style={{ background: "#FFFFFF", border: "1.5px solid #E5E7EB", borderRadius: "12px", padding: "28px", marginBottom: "32px" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 500, color: "#111827", marginBottom: "10px" }}>Vehicle locations</h2>
        <p style={{ fontSize: "0.82rem", color: "#6B7280", lineHeight: 1.5, margin: 0 }}>
          Locations shown here represent the last reported check-in from drivers. In the live system, 
          this screen connects to GPS hardware trackers to display live geographical coordinates and route updates.
        </p>
      </div>

      {/* Grid of Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px", marginBottom: "40px" }}>
        {cars.map((c) => {
          const status = getCarStatus(c);
          
          const badgeStyles = {
            free: { background: "#F0FDF4", color: "#15803D", border: "1px solid #BBF7D0", text: "Free" },
            trip: { background: "#FFF9C4", color: "#F57F17", border: "1.5px dashed #FFF59D", text: "On trip" },
            shop: { background: "#FEF2F2", color: "#991B1B", border: "1px solid #FEE2E2", text: "Workshop" }
          }[status];

          const locationOptions = ABUJA_SPOTS.map((spot) => ({
            value: spot,
            label: spot
          }));

          return (
            <div 
              key={c.id} 
              style={{ 
                background: "#FFFFFF", 
                border: "1.5px solid #E5E7EB", 
                borderRadius: "12px", 
                padding: "20px", 
                display: "flex", 
                flexDirection: "column", 
                justifyContent: "space-between",
                gap: "24px"
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                  <span className="plate">{c.plate}</span>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "4px 10px",
                      borderRadius: "20px",
                      fontSize: "0.74rem",
                      fontWeight: 500,
                      ...badgeStyles
                    }}
                  >
                    {badgeStyles.text}
                  </span>
                </div>

                <div style={{ fontSize: "1rem", fontWeight: 500, color: "#111827", marginBottom: "8px" }}>
                  {c.loc}
                </div>

                <div style={{ fontSize: "0.78rem", color: "#6B7280", lineHeight: 1.6 }}>
                  <div>
                    Last check-in: {c.locT}
                  </div>
                  <div>
                    {c.name} · <span className={`co-chip ${c.co === "Tractrac" ? "tt" : "ik"}`}>{c.co === "Tractrac" ? "TracTrac" : "Ikore"}</span> · Fuel {c.fuel}%
                  </div>
                  {c.papers && (
                    <div style={{ color: "#D97706", fontWeight: 500, marginTop: "4px" }}>
                      {c.papers.replace("—", "-")}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", color: "#4B5563", marginBottom: "6px" }}>
                    Driver check-in - update location
                  </label>
                  <Dropdown
                    options={locationOptions}
                    value={c.loc}
                    onChange={(val) => handleCheckIn(c.id, val, c.fuel)}
                    placeholder="Select location..."
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", color: "#4B5563", marginBottom: "6px" }}>
                    Driver check-in - update fuel percentage: <strong style={{ color: c.fuel < 25 ? "var(--red)" : "inherit" }}>{c.fuel}%</strong>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={c.fuel}
                    onChange={(e) => handleCheckIn(c.id, c.loc, Number(e.target.value))}
                    style={{ width: "100%", accentColor: c.fuel < 25 ? "var(--red)" : "var(--tt)" }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
