"use client";

import React, { useState } from "react";
import { useFleet } from "./layout";
import { motion } from "framer-motion";

const DAY_START = 8;
const DAY_END = 22;

export default function FleetBoardPage() {
  const {
    cars,
    bookings,
    showToastMsg
  } = useFleet();

  const [filter, setFilter] = useState("all");

  const todayISO = new Date().toISOString().slice(0, 10);
  const timelineSpan = (DAY_END - DAY_START) * 60;
  
  const tNow = new Date();
  const nowMinsVal = tNow.getHours() * 60 + tNow.getMinutes();

  const isOfficeTrip = (b: any) => !b.mode || b.mode === "Office car";

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

  const getFilteredCars = () => {
    return cars.filter((c) => {
      const s = getCarStatus(c);
      if (filter === "free" && s !== "free") return false;
      if (filter === "trip" && s !== "trip") return false;
      if (filter === "shop" && s !== "shop") return false;
      if (filter === "lowfuel" && c.fuel >= 25) return false;
      return true;
    });
  };

  // Stats calculation
  let freeCount = 0, tripCount = 0, shopCount = 0, lowFuelCount = 0;
  cars.forEach((c) => {
    const s = getCarStatus(c);
    if (s === "free") freeCount++;
    else if (s === "trip") tripCount++;
    else shopCount++;
    if (c.fuel < 25) lowFuelCount++;
  });
  const todaysBookings = bookings.filter((b) => b.date === todayISO && b.status === "approved").length;
  const pendingApprovals = bookings.filter((b) => b.status === "pending").length;

  const mins = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };

  return (
    <section className="active">
      <motion.div
        className="stats"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className={`stat ${pendingApprovals ? "busy" : ""}`}>
          <div className="num">{pendingApprovals}</div>
          <div className="lbl">Awaiting approval</div>
        </div>
        <div className="stat free">
          <div className="num">{freeCount}</div>
          <div className="lbl">Free now</div>
        </div>
        <div className="stat busy">
          <div className="num">{tripCount}</div>
          <div className="lbl">On trip</div>
        </div>
        <div className="stat shop">
          <div className="num">{shopCount}</div>
          <div className="lbl">In workshop</div>
        </div>
        <div className="stat">
          <div className="num">{todaysBookings}</div>
          <div className="lbl">Bookings today</div>
        </div>
        <div className={`stat ${lowFuelCount ? "shop" : ""}`}>
          <div className="num">{lowFuelCount}</div>
          <div className="lbl">Low fuel (&lt;25%)</div>
        </div>
      </motion.div>

      <div className="board-note" style={{ marginBottom: "20px", marginTop: "16px" }}>
        Bookings are coloured by company:
        <span className="key tt"></span>TracTrac
        <span className="key ik"></span>Ikore. Dashed blocks are awaiting approval; the red line marks the current time. To request a new booking, select the "Book a car" tab.
      </div>

      <div className="filters">
        <button
          className={`chip ${filter === "all" ? "active" : ""}`}
          onClick={() => setFilter("all")}
        >
          All vehicles
        </button>
        <button
          className={`chip ${filter === "free" ? "active" : ""}`}
          onClick={() => setFilter("free")}
        >
          Free now
        </button>
        <button
          className={`chip ${filter === "trip" ? "active" : ""}`}
          onClick={() => setFilter("trip")}
        >
          On trip
        </button>
        <button
          className={`chip ${filter === "shop" ? "active" : ""}`}
          onClick={() => setFilter("shop")}
        >
          In workshop
        </button>
        <button
          className={`chip ${filter === "lowfuel" ? "active" : ""}`}
          onClick={() => setFilter("lowfuel")}
        >
          Low fuel
        </button>
      </div>

      {getFilteredCars().length === 0 ? (
        <div style={{ padding: "40px", border: "1.5px solid #E5E7EB", borderRadius: "12px", background: "#FAFBFB", color: "#6B7280", textAlign: "center", fontSize: "0.88rem" }}>
          No vehicles match this filter right now.
        </div>
      ) : (
        <div className="scheduler-container">
          <div className="scheduler-inner">
            {/* HEADER ROW */}
            <div className="scheduler-header">
              <div className="scheduler-time-spacer" />
              {getFilteredCars().map((c) => {
                const fc = c.fuel < 25 ? "low" : c.fuel < 50 ? "mid" : "high";
                return (
                  <div className="scheduler-vehicle-header" key={c.id}>
                    <span className="v-plate-tag">{c.plate}</span>
                    <span className="v-name-title">{c.name}</span>
                    <div className="v-meta-info" style={{ gap: "2px" }}>
                      <span style={{ fontSize: "0.74rem", color: "#6B7280" }}>Fuel {c.fuel}%</span>
                      {c.papers && (
                        <span style={{ color: "var(--amber)", fontSize: "0.72rem", fontWeight: 500 }}>
                          {c.papers}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* GRID BODY */}
            <div className="scheduler-grid" style={{ height: `${(DAY_END - DAY_START) * 60}px` }}>
              {/* Left time column */}
              <div className="scheduler-time-column">
                {Array.from({ length: DAY_END - DAY_START }).map((_, i) => {
                  const hour = DAY_START + i;
                  return (
                    <div className="scheduler-time-cell" key={hour}>
                      {String(hour).padStart(2, "0")}:00
                    </div>
                  );
                })}
              </div>

              {/* Vehicle columns */}
              {getFilteredCars().map((c, idx) => {
                // Background cell lines
                const backgroundCells = Array.from({ length: DAY_END - DAY_START }).map((_, i) => (
                  <div className="scheduler-grid-row-cell" key={i} />
                ));

                // Event blocks
                let blocks: React.ReactNode[] = [];
                if (c.shop) {
                  blocks.push(
                    <div className="scheduler-booking-card shop" style={{ top: 0, height: "100%" }} key="shop">
                      <span className="card-time">In workshop</span>
                      <span className="card-staff">Not available for booking</span>
                    </div>
                  );
                } else {
                  bookings
                    .filter((b) => b.carId === c.id && b.date === todayISO && b.status !== "declined" && isOfficeTrip(b))
                    .forEach((b) => {
                      const startMin = mins(b.start);
                      const endMin = mins(b.end);
                      const top = startMin - DAY_START * 60; // 1px per minute!
                      const height = endMin - startMin; // 1px per minute!
                      const cls = `${b.co === "Tractrac" ? "tt" : "ik"} ${b.status === "pending" ? "pending" : ""}`;
                      
                      blocks.push(
                        <motion.div
                          className={`scheduler-booking-card ${cls}`}
                          style={{ top: `${top}px`, height: `${height}px` }}
                          key={b.id}
                          initial={{ opacity: 0, scale: 0.95, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          transition={{ duration: 0.25, delay: idx * 0.03 }}
                          title={`${b.start} - ${b.end} · ${b.staff} · ${b.dest}`}
                        >
                          <span className="card-time">
                            {b.start} - {b.end}
                            {b.status === "pending" && " (pending)"}
                          </span>
                          <span className="card-staff">{b.staff}</span>
                          <span className="card-dest">{b.dest}</span>
                        </motion.div>
                      );
                    });
                }

                return (
                  <div
                    className="scheduler-vehicle-column"
                    key={c.id}
                    onClick={() => {
                      if (c.shop) return;
                      showToastMsg(`To book ${c.plate}, navigate to the "Book a car" tab.`);
                    }}
                  >
                    {backgroundCells}
                    {blocks}
                  </div>
                );
              })}

              {/* Red current time indicator line spanning across columns */}
              {nowMinsVal >= DAY_START * 60 && nowMinsVal <= DAY_END * 60 && (
                <div
                  className="scheduler-now-line"
                  style={{ top: `${nowMinsVal - DAY_START * 60}px` }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
