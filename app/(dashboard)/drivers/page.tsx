"use client";

import React, { useState } from "react";
import { useFleet } from "../layout";
import { API_BASE_URL } from "../../config";

const DRIVERS = [
  {name:"Peter Agbo",     co:"Tractrac" as const, phone:"0805 771 0284", licence:"ABJ 11-40157 BB7", licExp:"2026-09-22", years:5,  base:"Head office, Utako"},
  {name:"Ameh Friday",    co:"Tractrac" as const, phone:"0812 903 5541", licence:"KUJ 07-63920 CC1", licExp:"2028-01-08", years:11, base:"State office"},
  {name:"Louis Ogbuneke", co:"Ikore" as const,    phone:"0803 214 6690", licence:"FKJ 04-88213 AA2", licExp:"2027-03-15", years:8,  base:"Ikore office"},
];

export default function DriversPage() {
  const {
    currentUser,
    cars,
    setCars,
    bookings,
    setBookings,
    fuelLogs,
    showToastMsg
  } = useFleet();

  const [mileInputs, setMileInputs] = useState<Record<number, string>>({});
  
  const todayISO = new Date().toISOString().slice(0, 10);
  const tNow = new Date();

  const isOfficeTrip = (b: any) => !b.mode || b.mode === "Office car";

  const mins = (t: string): number => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };

  const fmtN = (n: number): string => {
    return n.toLocaleString("en-NG");
  };

  const isDriver = (name: string) => ["Peter Agbo", "Ameh Friday", "Louis Ogbuneke"].includes(name);
  const isAdmin = (name: string) => name === "Godsfavour Nyoyoko";

  const handleStartTrip = async (bookingId: number, startOdo: number) => {
    const b = bookings.find((x) => x.id === bookingId);
    if (!b) return;
    const c = cars.find((car) => car.id === b.carId);
    if (!c) return;

    if (!startOdo) {
      showToastMsg("Enter the odometer reading before starting");
      return;
    }
    if (startOdo < c.odo) {
      showToastMsg(`Reading looks lower than the vehicle's last recorded ${fmtN(c.odo)} km`);
      return;
    }

    try {
      // 1. Update Booking start odometer
      const bkRes = await fetch(`${API_BASE_URL}/api/bookings/${bookingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startOdo })
      });
      if (!bkRes.ok) throw new Error("Failed to update booking start odo");
      const updatedBk = await bkRes.json();

      // 2. Update Vehicle current odometer
      const carRes = await fetch(`${API_BASE_URL}/api/vehicles/${b.carId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ odo: startOdo })
      });
      if (!carRes.ok) throw new Error("Failed to update vehicle odometer");
      const updatedCar = await carRes.json();

      setBookings(bookings.map((x) => (x.id === bookingId ? updatedBk : x)));
      setCars(cars.map((car) => (car.id === b.carId ? updatedCar : car)));
      showToastMsg(`Trip started - ${c.name} at ${fmtN(startOdo)} km`);
    } catch (err) {
      showToastMsg("Failed to start trip on server");
    }
  };

  const handleEndTrip = async (bookingId: number, endOdo: number) => {
    const b = bookings.find((x) => x.id === bookingId);
    if (!b) return;
    const c = cars.find((car) => car.id === b.carId);
    if (!c) return;

    if (!endOdo) {
      showToastMsg("Enter the odometer reading before ending the trip");
      return;
    }
    if (b.startOdo && endOdo <= b.startOdo) {
      showToastMsg(`Finish reading must be higher than the start (${fmtN(b.startOdo)} km)`);
      return;
    }

    try {
      // 1. Update Booking end odometer
      const bkRes = await fetch(`${API_BASE_URL}/api/bookings/${bookingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endOdo })
      });
      if (!bkRes.ok) throw new Error("Failed to update booking end odo");
      const updatedBk = await bkRes.json();

      // 2. Update Vehicle current odometer
      const carRes = await fetch(`${API_BASE_URL}/api/vehicles/${b.carId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ odo: endOdo })
      });
      if (!carRes.ok) throw new Error("Failed to update vehicle odometer");
      const updatedCar = await carRes.json();

      setBookings(bookings.map((x) => (x.id === bookingId ? updatedBk : x)));
      setCars(cars.map((car) => (car.id === b.carId ? updatedCar : car)));
      showToastMsg(`Trip completed - ${fmtN(endOdo - (b.startOdo || 0))} km recorded`);
    } catch (err) {
      showToastMsg("Failed to complete trip on server");
    }
  };

  const isAdminUser = currentUser && isAdmin(currentUser.name);
  const isDriverUser = currentUser && isDriver(currentUser.name);
  const visibleDrivers = isAdminUser ? DRIVERS : (isDriverUser ? DRIVERS.filter((d) => d.name === currentUser.name) : []);

  return (
    <section className="active">
      {currentUser && isDriver(currentUser.name) && (
        <div>
          <div
            className="panel"
            style={{ maxWidth: "860px", marginBottom: "14px", borderLeft: "4px solid var(--ik)" }}
          >
            <h2>My trips today - {currentUser.name}</h2>
            <p className="desc" style={{ marginBottom: 0 }}>
              Your approved assignments for{" "}
              {tNow.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
              . Enter the odometer reading when you set off and again when you finish - every trip's
              mileage is recorded against the vehicle.
            </p>
          </div>

          {bookings
            .filter((b) => b.driver === currentUser.name && b.date === todayISO && b.status === "approved" && isOfficeTrip(b))
            .sort((a, b) => mins(a.start) - mins(b.start))
            .map((t) => {
              const c = cars.find((car) => car.id === t.carId);
              return (
                <div
                  className="svc-card svc-ok-card"
                  style={{ alignItems: "flex-start", flexDirection: "column" }}
                  key={t.id}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "12px",
                      flexWrap: "wrap",
                      alignItems: "center",
                      width: "100%"
                    }}
                  >
                    <div className="info">
                      <strong>
                        {t.start}–{t.end} · <span className="plate">{c?.plate}</span> {c?.name}
                      </strong>
                      <br />
                      {t.dest} · for {t.staff}{" "}
                      <span className={`co-chip ${t.co === "Tractrac" ? "tt" : "ik"}`}>
                        {t.co === "Tractrac" ? "TracTrac" : "Ikore"}
                      </span>
                      {t.purpose && ` · ${t.purpose}`}
                    </div>
                    {t.endOdo ? (
                      <span className="status-pill free">Completed</span>
                    ) : t.startOdo ? (
                      <span className="status-pill trip">In progress</span>
                    ) : (
                      <span className="status-pill free">Approved</span>
                    )}
                  </div>

                  <div className="trip-mile">
                    {t.endOdo ? (
                      <span className="done-txt">
                        {fmtN(t.startOdo || 0)} → {fmtN(t.endOdo)} km ·{" "}
                        {fmtN(t.endOdo - (t.startOdo || 0))} km covered
                      </span>
                    ) : t.startOdo ? (
                      <>
                        <span className="start-txt">Started at {fmtN(t.startOdo)} km</span>
                        <input
                          type="number"
                          min={t.startOdo + 1}
                          placeholder="Odometer at finish (km)"
                          value={mileInputs[t.id] || ""}
                          onChange={(e) =>
                            setMileInputs({ ...mileInputs, [t.id]: e.target.value })
                          }
                        />
                        <button
                          className="btn small"
                          onClick={() => handleEndTrip(t.id, Number(mileInputs[t.id]))}
                        >
                          End trip
                        </button>
                      </>
                    ) : (
                      <>
                        <input
                          type="number"
                          min="0"
                          placeholder={`Odometer at start - now ${fmtN(c?.odo || 0)} km`}
                          value={mileInputs[t.id] !== undefined ? mileInputs[t.id] : c?.odo || 0}
                          onChange={(e) =>
                            setMileInputs({ ...mileInputs, [t.id]: e.target.value })
                          }
                        />
                        <button
                          className="btn small approve"
                          onClick={() =>
                            handleStartTrip(
                              t.id,
                              mileInputs[t.id] !== undefined
                                ? Number(mileInputs[t.id])
                                : c?.odo || 0
                            )
                          }
                        >
                          Start trip
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}

          {bookings.filter((b) => b.driver === currentUser.name && b.date === todayISO && b.status === "approved" && isOfficeTrip(b)).length === 0 && (
            <div className="appr-empty">
              No approved trips on your schedule today. Trips appear here once the approver or fleet
              manager approves them.
            </div>
          )}
          <div style={{ height: "22px" }} />
        </div>
      )}

      <div className="panel" style={{ maxWidth: "760px", marginBottom: "20px" }}>
        <h2>Driver profiles</h2>
        <p className="desc">
          Driver contact and licence details are visible to the fleet manager only; each driver sees
          their own profile and daily schedule. Licence expiry dates within 60 days are flagged so
          renewals happen before a driver is grounded.
        </p>
      </div>

      <div className="drv-grid">
        {visibleDrivers.map((d) => {
          const exp = new Date(d.licExp);
          const days = Math.round((exp.getTime() - new Date().getTime()) / 86400000);
          const expCls = days < 60 ? "lic-warn" : "lic-ok";
          const expNote = days < 0 ? " - expired!" : days < 60 ? ` - renew soon (${days} days)` : "";
          const trips = bookings.filter(
            (b) =>
              b.driver === d.name && b.date === todayISO && b.status === "approved" && isOfficeTrip(b)
          );
          const lastFuel = fuelLogs
            .slice()
            .reverse()
            .find((f) => f.driver === d.name);

          return (
            <div className="drv-card" key={d.name}>
              <div className={`drv-head ${d.co === "Tractrac" ? "tt" : "ik"}`}>
                <div className="drv-avatar">{d.name[0]}</div>
                <div>
                  <h3>{d.name}</h3>
                  <div className="role">
                    {d.co === "Tractrac" ? "TracTrac" : "Ikore"} pool driver · {d.years} yrs experience
                  </div>
                </div>
              </div>
              <div className="drv-body">
                <div className="drv-row">
                  <span className="k">Phone</span>
                  <span className="v">{d.phone}</span>
                </div>
                <div className="drv-row">
                  <span className="k">Licence no.</span>
                  <span className="v">{d.licence}</span>
                </div>
                <div className="drv-row">
                  <span className="k">Licence expiry</span>
                  <span className={`v ${expCls}`}>
                    {exp.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    {expNote}
                  </span>
                </div>
                <div className="drv-row">
                  <span className="k">Base</span>
                  <span className="v">{d.base}</span>
                </div>
                <div className="drv-row">
                  <span className="k">Last fuel entry</span>
                  <span className="v">
                    {lastFuel
                      ? `${cars.find((c) => c.id === lastFuel.carId)?.plate}, ${lastFuel.litres} L`
                      : "-"}
                  </span>
                </div>
              </div>
              <div className="drv-today">
                Today:{" "}
                {trips.length > 0 ? (
                  trips.map((t) => (
                    <div key={t.id}>
                      <strong>{cars.find((c) => c.id === t.carId)?.name}</strong> {t.start}–{t.end}{" "}
                      → {t.dest}
                    </div>
                  ))
                ) : (
                  "No approved trips today"
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
