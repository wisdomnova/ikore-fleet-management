"use client";

import React, { useState, useEffect } from "react";
import { useFleet } from "./layout";
import { motion, AnimatePresence } from "framer-motion";

const DAY_START = 8;
const DAY_END = 22;

export default function FleetBoardPage() {
  const {
    cars,
    bookings,
    showToastMsg
  } = useFleet();

  const [filter, setFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("day");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedCarId, setSelectedCarId] = useState<number | "all">("all");

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
  
  // Calculate selectedDateISO safely in local time timezone
  const selectedDateISO = new Date(selectedDate.getTime() - selectedDate.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);

  const timelineSpan = (DAY_END - DAY_START) * 60;
  
  const tNow = new Date();
  const nowMinsVal = tNow.getHours() * 60 + tNow.getMinutes();

  const isOfficeTrip = (b: any) => !b.mode || b.mode === "Office car";

  // Auto-select the first vehicle when switching to Week mode and selectedCarId is 'all'
  useEffect(() => {
    if (viewMode === "week" && selectedCarId === "all") {
      if (cars.length > 0) {
        setSelectedCarId(cars[0].id);
      }
    }
  }, [viewMode, selectedCarId, cars]);

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

  // Date helpers
  const formatToISO = (d: Date) => {
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  };

  const getWeekDays = (d: Date) => {
    const dayOfWeek = d.getDay(); // 0 = Sunday, 1 = Monday...
    const diff = d.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust to Monday
    const monday = new Date(d);
    monday.setDate(diff);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const getMonthDays = (d: Date) => {
    const year = d.getFullYear();
    const month = d.getMonth();
    const firstDay = new Date(year, month, 1);
    const startOfWeek = firstDay.getDay(); // 0 = Sunday, 1 = Monday
    const diff = startOfWeek === 0 ? 6 : startOfWeek - 1; // Align to Monday
    
    const startCalendar = new Date(firstDay);
    startCalendar.setDate(firstDay.getDate() - diff);
    
    const days = [];
    for (let i = 0; i < 42; i++) {
      const day = new Date(startCalendar);
      day.setDate(startCalendar.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const getNavLabel = () => {
    if (viewMode === "day") {
      return selectedDate.toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric"
      });
    } else if (viewMode === "week") {
      const week = getWeekDays(selectedDate);
      const start = week[0].toLocaleDateString("en-GB", { day: "numeric", month: "short" });
      const end = week[6].toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
      return `${start} – ${end}`;
    } else {
      return selectedDate.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
    }
  };

  const handlePrev = () => {
    const d = new Date(selectedDate);
    if (viewMode === "day") {
      d.setDate(d.getDate() - 1);
    } else if (viewMode === "week") {
      d.setDate(d.getDate() - 7);
    } else {
      d.setMonth(d.getMonth() - 1);
    }
    setSelectedDate(d);
  };

  const handleNext = () => {
    const d = new Date(selectedDate);
    if (viewMode === "day") {
      d.setDate(d.getDate() + 1);
    } else if (viewMode === "week") {
      d.setDate(d.getDate() + 7);
    } else {
      d.setMonth(d.getMonth() + 1);
    }
    setSelectedDate(d);
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  const activeCar = cars.find((c) => c.id === selectedCarId);
  const isCarInShop = activeCar?.shop;

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

      {/* Date Navigation & View Mode Toggles */}
      <div 
        style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          margin: "24px 0", 
          padding: "16px 20px", 
          background: "#FFFFFF", 
          border: "1.5px solid #E5E7EB", 
          borderRadius: "12px",
          gap: "16px",
          flexWrap: "wrap"
        }}
      >
        {/* Navigation Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button 
            type="button"
            className="chip"
            style={{ padding: "8px 12px", border: "1.5px solid #E5E7EB", background: "#FFFFFF", fontWeight: 500, fontSize: "0.82rem", borderRadius: "8px" }}
            onClick={handlePrev}
          >
            ← Prev
          </button>
          <button 
            type="button"
            className="chip"
            style={{ padding: "8px 12px", border: "1.5px solid #E5E7EB", background: "#FFFFFF", fontWeight: 500, fontSize: "0.82rem", borderRadius: "8px" }}
            onClick={handleToday}
          >
            Today
          </button>
          <button 
            type="button"
            className="chip"
            style={{ padding: "8px 12px", border: "1.5px solid #E5E7EB", background: "#FFFFFF", fontWeight: 500, fontSize: "0.82rem", borderRadius: "8px" }}
            onClick={handleNext}
          >
            Next →
          </button>
          <span style={{ marginLeft: "12px", fontWeight: 600, fontSize: "1rem", color: "#111827" }}>
            {getNavLabel()}
          </span>
        </div>

        {/* View Switcher Tabs */}
        <div style={{ display: "flex", background: "#F3F4F6", borderRadius: "8px", padding: "4px" }}>
          {(["day", "week", "month"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              style={{
                border: "none",
                background: viewMode === mode ? "#FFFFFF" : "transparent",
                color: viewMode === mode ? "#111827" : "#6B7280",
                fontSize: "0.82rem",
                fontWeight: viewMode === mode ? 600 : 500,
                padding: "6px 14px",
                borderRadius: "6px",
                cursor: "pointer",
                boxShadow: viewMode === mode ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                transition: "all 0.15s"
              }}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>

        {/* Vehicle Filter Dropdown */}
        {(viewMode === "week" || viewMode === "month") && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "0.8rem", color: "#4B5563", fontWeight: 600 }}>Vehicle:</span>
            <select
              value={selectedCarId}
              onChange={(e) => setSelectedCarId(e.target.value === "all" ? "all" : Number(e.target.value))}
              style={{
                padding: "8px 12px",
                fontSize: "0.85rem",
                border: "1.5px solid #E5E7EB",
                borderRadius: "8px",
                background: "#FFFFFF",
                fontWeight: 500,
                color: "#111827",
                outline: "none"
              }}
            >
              {viewMode === "month" && <option value="all">All Vehicles</option>}
              {cars.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.plate !== "TBD" ? c.plate + " - " : ""}{c.name} ({c.co === "Tractrac" ? "TracTrac" : c.co === "Ikore" ? "Ikore" : "ChananHill"})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="board-note" style={{ marginBottom: "20px", marginTop: "16px" }}>
        Bookings are coloured by company:
        <span className="key tt"></span>TracTrac
        <span className="key ik"></span>Ikore
        <span className="key ch"></span>ChananHill. Dashed blocks are awaiting approval; the red line marks the current time. To request a new booking, select the "Book a car" tab.
      </div>

      {/* Mode warning if week car is in workshop */}
      {viewMode === "week" && isCarInShop && (
        <div style={{ padding: "12px 16px", borderRadius: "8px", background: "#FEF2F2", border: "1px solid #FEE2E2", color: "#991B1B", fontSize: "0.85rem", marginBottom: "20px", fontWeight: 500 }}>
          ⚠️ Notice: {activeCar?.plate} - {activeCar?.name} is currently registered in the workshop.
        </div>
      )}

      {/* VIEW PANEL RENDERING */}
      <AnimatePresence mode="wait">
        {viewMode === "day" && (
          <motion.div
            key="day"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
          >
            {/* Status Chips (only relevant in Day view) */}
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
                    {getFilteredCars().map((c) => (
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
                    ))}
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
                      const backgroundCells = Array.from({ length: DAY_END - DAY_START }).map((_, i) => (
                        <div className="scheduler-grid-row-cell" key={i} />
                      ));

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
                          .filter((b) => b.carId === c.id && b.date === selectedDateISO && b.status !== "declined" && isOfficeTrip(b))
                          .forEach((b) => {
                            const startMin = mins(b.start);
                            const endMin = mins(b.end);
                            const top = startMin - DAY_START * 60;
                            const height = endMin - startMin;
                            const cls = `${b.co === "Tractrac" ? "tt" : b.co === "Ikore" ? "ik" : "ch"} ${b.status === "pending" ? "pending" : ""}`;
                            
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
                    {selectedDateISO === todayISO && nowMinsVal >= DAY_START * 60 && nowMinsVal <= DAY_END * 60 && (
                      <div
                        className="scheduler-now-line"
                        style={{ top: `${nowMinsVal - DAY_START * 60}px` }}
                      />
                    )}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {viewMode === "week" && (
          <motion.div
            key="week"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
          >
            {selectedCarId === "all" ? (
              <div style={{ padding: "40px", border: "1.5px solid #E5E7EB", borderRadius: "12px", background: "#FAFBFB", color: "#6B7280", textAlign: "center", fontSize: "0.88rem" }}>
                Select a vehicle to display its weekly timeline.
              </div>
            ) : (
              <div className="scheduler-container">
                <div className="scheduler-inner">
                  {/* HEADER ROW (DAYS OF THE WEEK) */}
                  <div className="scheduler-header">
                    <div className="scheduler-time-spacer" />
                    {getWeekDays(selectedDate).map((day) => {
                      const isDayToday = formatToISO(day) === todayISO;
                      return (
                        <div 
                          className="scheduler-vehicle-header" 
                          key={day.getTime()}
                          style={{ 
                            background: isDayToday ? "#EFF6FF" : "transparent",
                            cursor: "pointer"
                          }}
                          onClick={() => {
                            setSelectedDate(day);
                            setViewMode("day");
                          }}
                          title="Click to zoom into this day"
                        >
                          <span 
                            className="v-plate-tag" 
                            style={{ 
                              background: isDayToday ? "#2563EB" : "#E5E7EB", 
                              color: isDayToday ? "#FFFFFF" : "#4B5563",
                              fontWeight: 600
                            }}
                          >
                            {day.toLocaleDateString("en-GB", { weekday: "short" })}
                          </span>
                          <span 
                            className="v-name-title" 
                            style={{ 
                              fontWeight: isDayToday ? 600 : 500, 
                              color: isDayToday ? "#1E40AF" : "#111827",
                              marginTop: "4px"
                            }}
                          >
                            {day.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                          </span>
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

                    {/* Week day columns */}
                    {getWeekDays(selectedDate).map((day, idx) => {
                      const dayISO = formatToISO(day);
                      const backgroundCells = Array.from({ length: DAY_END - DAY_START }).map((_, i) => (
                        <div className="scheduler-grid-row-cell" key={i} />
                      ));

                      let blocks: React.ReactNode[] = [];
                      if (isCarInShop) {
                        blocks.push(
                          <div className="scheduler-booking-card shop" style={{ top: 0, height: "100%" }} key="shop">
                            <span className="card-time">In workshop</span>
                            <span className="card-staff">Not available</span>
                          </div>
                        );
                      } else {
                        bookings
                          .filter((b) => b.carId === selectedCarId && b.date === dayISO && b.status !== "declined" && isOfficeTrip(b))
                          .forEach((b) => {
                            const startMin = mins(b.start);
                            const endMin = mins(b.end);
                            const top = startMin - DAY_START * 60;
                            const height = endMin - startMin;
                            const cls = `${b.co === "Tractrac" ? "tt" : b.co === "Ikore" ? "ik" : "ch"} ${b.status === "pending" ? "pending" : ""}`;
                            
                            blocks.push(
                              <motion.div
                                className={`scheduler-booking-card ${cls}`}
                                style={{ top: `${top}px`, height: `${height}px` }}
                                key={b.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.2 }}
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

                      const isDayToday = dayISO === todayISO;

                      return (
                        <div
                          className="scheduler-vehicle-column"
                          key={dayISO}
                          style={{ background: isDayToday ? "#FAFBFB" : "transparent" }}
                        >
                          {backgroundCells}
                          {blocks}

                          {isDayToday && nowMinsVal >= DAY_START * 60 && nowMinsVal <= DAY_END * 60 && (
                            <div
                              className="scheduler-now-line"
                              style={{ top: `${nowMinsVal - DAY_START * 60}px` }}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {viewMode === "month" && (
          <motion.div
            key="month"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
          >
            <div 
              style={{ 
                display: "grid", 
                gridTemplateColumns: "repeat(7, 1fr)", 
                gap: "8px", 
                background: "#F3F4F6", 
                padding: "8px", 
                borderRadius: "12px", 
                border: "1.5px solid #E5E7EB" 
              }}
            >
              {/* Month Header Days */}
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((dayName) => (
                <div 
                  key={dayName} 
                  style={{ 
                    textAlign: "center", 
                    fontWeight: 600, 
                    fontSize: "0.8rem", 
                    color: "#4B5563", 
                    padding: "10px 0", 
                    textTransform: "uppercase", 
                    letterSpacing: "0.05em" 
                  }}
                >
                  {dayName}
                </div>
              ))}
              
              {/* Month Grid Cells */}
              {getMonthDays(selectedDate).map((day) => {
                const dayISO = formatToISO(day);
                const isCurrentMonth = day.getMonth() === selectedDate.getMonth();
                const isDayToday = dayISO === todayISO;
                
                // Filter bookings for this day
                const dayBookings = bookings.filter(
                  (b) => (selectedCarId === "all" || b.carId === selectedCarId) && b.date === dayISO && b.status !== "declined"
                );
                
                return (
                  <div
                    key={dayISO}
                    onClick={() => {
                      setSelectedDate(day);
                      setViewMode("day");
                    }}
                    style={{
                      background: isDayToday ? "#F0F9FF" : "#FFFFFF",
                      border: isDayToday ? "1.5px solid #0284C7" : "1px solid #E5E7EB",
                      borderRadius: "8px",
                      minHeight: isMobile ? "64px" : "110px",
                      padding: isMobile ? "4px" : "8px",
                      cursor: "pointer",
                      opacity: isCurrentMonth ? 1 : 0.45,
                      transition: "all 0.15s",
                      display: "flex",
                      flexDirection: "column",
                      gap: isMobile ? "2px" : "4px"
                    }}
                    onMouseEnter={(e) => {
                      if (!isMobile) {
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(0,0,0,0.05)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isMobile) {
                        e.currentTarget.style.transform = "none";
                        e.currentTarget.style.boxShadow = "none";
                      }
                    }}
                  >
                    {/* Day Label */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span
                        style={{
                          fontSize: "0.85rem",
                          fontWeight: isDayToday ? 700 : 500,
                          color: isDayToday ? "#0284C7" : "#111827",
                          background: isDayToday ? "#E0F2FE" : "transparent",
                          borderRadius: "50%",
                          width: "22px",
                          height: "22px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}
                      >
                        {day.getDate()}
                      </span>
                      {dayBookings.length > 0 && (
                        <span style={{ fontSize: "0.7rem", color: "#6B7280" }}>
                          {isMobile ? dayBookings.length : `${dayBookings.length} ${dayBookings.length === 1 ? "trip" : "trips"}`}
                        </span>
                      )}
                    </div>
                    
                    {/* Day Bookings List (collapses to dots on mobile) */}
                    {isMobile ? (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "3px", marginTop: "4px", justifyContent: "center" }}>
                        {dayBookings.map((b) => (
                          <span
                            key={b.id}
                            style={{
                              width: "6px",
                              height: "6px",
                              borderRadius: "50%",
                              background: b.co === "Tractrac" ? "var(--tt)" : b.co === "Ikore" ? "var(--ik)" : "var(--ch)",
                              opacity: b.status === "pending" ? 0.5 : 1
                            }}
                          />
                        ))}
                      </div>
                    ) : (
                      <div 
                        style={{ 
                          flex: 1, 
                          display: "flex", 
                          flexDirection: "column", 
                          gap: "3px", 
                          overflowY: "auto", 
                          maxHeight: "75px"
                        }}
                        className="no-scrollbar"
                      >
                        {dayBookings.map((b) => {
                          const bg = b.co === "Tractrac" ? "var(--tt-soft)" : b.co === "Ikore" ? "var(--ik-soft)" : "var(--ch-soft)";
                          const color = b.co === "Tractrac" ? "var(--tt-dark)" : b.co === "Ikore" ? "var(--ik-dark)" : "var(--ch-dark)";
                          const border = b.status === "pending" ? "1px dashed var(--muted)" : "1px solid transparent";
                          const c = cars.find((car) => car.id === b.carId);
                          
                          return (
                            <div
                              key={b.id}
                              title={`${b.start}–${b.end} · ${b.staff} · ${b.dest}`}
                              style={{
                                fontSize: "0.68rem",
                                padding: "2px 6px",
                                borderRadius: "4px",
                                background: bg,
                                color: color,
                                border: border,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                fontWeight: 600
                              }}
                            >
                              {b.start} {b.staff.split(" ")[0]} ({isOfficeTrip(b) ? (c?.plate !== "TBD" ? c?.plate : c?.name.split(" ")[0]) : b.mode})
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
