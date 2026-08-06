"use client";

import React, { useState } from "react";
import { useFleet, DRIVER_NAMES } from "../layout";

export default function FuelLogPage() {
  const {
    currentUser,
    cars,
    setCars,
    fuelLogs,
    setFuelLogs,
    showToastMsg
  } = useFleet();

  const [flCar, setFlCar] = useState(1);
  const [flDriver, setFlDriver] = useState("");
  const [flLitres, setFlLitres] = useState("");
  const [flCost, setFlCost] = useState("");
  const [flLevel, setFlLevel] = useState(75);
  const [flOdo, setFlOdo] = useState("");
  const [flStation, setFlStation] = useState("");
  const [fuelMsg, setFuelMsg] = useState({ text: "", type: "" });

  const isAdminUser = currentUser?.name === "Godsfavour Nyoyoko";
  const isDriverUser = currentUser ? DRIVER_NAMES.includes(currentUser.name) : false;

  const fmtN = (n: number | string): string => {
    return Number(n).toLocaleString("en-NG");
  };

  const handleFuelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFuelMsg({ text: "", type: "" });
    if (!currentUser) {
      setFuelMsg({ text: "Please sign in first.", type: "err" });
      return;
    }
    if (!isDriverUser && !isAdminUser) {
      setFuelMsg({ text: "Only drivers and the fleet manager can save fuel entries.", type: "err" });
      return;
    }

    const litres = Number(flLitres);
    const cost = Number(flCost);
    const odo = Number(flOdo);
    const station = flStation.trim();

    if (!flDriver || !litres || !station) {
      setFuelMsg({ text: "Please select the driver and enter the litres purchased and the filling station.", type: "err" });
      return;
    }

    const c = cars.find((car) => car.id === flCar);
    if (!c) return;

    if (odo && odo < c.odo) {
      setFuelMsg({ text: `Odometer reading looks lower than the last recorded value (${fmtN(c.odo)} km).`, type: "err" });
      return;
    }

    const whenStr = "Today " + new Date().toLocaleString("en-GB", { hour: "2-digit", minute: "2-digit" });
    const newLog = {
      carId: flCar,
      when: whenStr,
      driver: flDriver,
      litres,
      cost: cost || 0,
      level: flLevel,
      odo: odo || c.odo,
      station
    };

    setFuelLogs([...fuelLogs, newLog]);
    setCars(
      cars.map((car) =>
        car.id === flCar
          ? {
              ...car,
              fuel: flLevel,
              odo: odo || car.odo
            }
          : car
      )
    );

    setFuelMsg({ text: `Saved. ${c.plate} now shows ${flLevel}% fuel.`, type: "ok" });
    setFlLitres("");
    setFlCost("");
    setFlOdo("");
    setFlStation("");
    showToastMsg("Fuel entry saved");
  };

  return (
    <section className="active">
      <div className="panel">
        <h2>Log a fuel purchase</h2>
        <p className="desc">
          Drivers record every fuel purchase here, including the tank level after filling. Levels
          below 25% are flagged on the fleet board.
        </p>
        {fuelMsg.text && (
          <div className={`msg ${fuelMsg.type === "err" ? "err" : "ok"}`}>
            {fuelMsg.text}
          </div>
        )}
        <form onSubmit={handleFuelSubmit}>
          <div className="frow">
            <div>
              <label htmlFor="flCar">Vehicle</label>
              <select
                id="flCar"
                value={flCar}
                onChange={(e) => setFlCar(Number(e.target.value))}
              >
                {cars.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.plate !== "TBD" ? c.plate + " — " : ""}
                    {c.name} ({c.co === "Tractrac" ? "TracTrac" : "Ikore"})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="flDriver">Driver</label>
              <select
                id="flDriver"
                value={flDriver}
                onChange={(e) => setFlDriver(e.target.value)}
              >
                <option value="">Select driver…</option>
                <option value="Peter Agbo">Peter Agbo</option>
                <option value="Ameh Friday">Ameh Friday</option>
                <option value="Louis Ogbuneke">Louis Ogbuneke</option>
                <option value="Other / self-drive staff">Other / self-drive staff</option>
              </select>
            </div>
          </div>
          <div className="frow">
            <div>
              <label htmlFor="flLitres">Litres purchased</label>
              <input
                type="number"
                id="flLitres"
                min="1"
                max="120"
                placeholder="e.g. 40"
                value={flLitres}
                onChange={(e) => setFlLitres(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="flCost">Amount paid (₦)</label>
              <input
                type="number"
                id="flCost"
                min="0"
                placeholder="e.g. 38000"
                value={flCost}
                onChange={(e) => setFlCost(e.target.value)}
              />
            </div>
          </div>
          <div className="frow">
            <div>
              <label htmlFor="flLevel">
                Tank level after filling — <span className="range-out">{flLevel}%</span>
              </label>
              <input
                type="range"
                id="flLevel"
                min="0"
                max="100"
                value={flLevel}
                onChange={(e) => setFlLevel(Number(e.target.value))}
              />
            </div>
            <div>
              <label htmlFor="flOdo">Odometer reading (km)</label>
              <input
                type="number"
                id="flOdo"
                min="0"
                placeholder="e.g. 84210"
                value={flOdo}
                onChange={(e) => setFlOdo(e.target.value)}
              />
            </div>
          </div>
          <div className="frow single">
            <div>
              <label htmlFor="flStation">Filling station / location</label>
              <input
                type="text"
                id="flStation"
                placeholder="e.g. NNPC, Airport Road"
                value={flStation}
                onChange={(e) => setFlStation(e.target.value)}
              />
            </div>
          </div>
          <button type="submit" className="btn" id="flSubmit">
            Save fuel entry
          </button>
        </form>
      </div>

      <div className="tbl-wrap">
        <table>
          <thead>
            <tr>
              <th>Date &amp; time</th>
              <th>Vehicle</th>
              <th>Driver</th>
              <th>Litres</th>
              {isAdminUser && <th>Cost (₦)</th>}
              <th>Level after</th>
              <th>Odometer</th>
              <th>Station</th>
            </tr>
          </thead>
          <tbody>
            {fuelLogs
              .slice()
              .reverse()
              .map((f, i) => {
                const c = cars.find((car) => car.id === f.carId);
                return (
                  <tr key={i}>
                    <td>{f.when}</td>
                    <td>
                      <span className="plate">{c?.plate || "TBD"}</span>
                    </td>
                    <td>{f.driver}</td>
                    <td>{f.litres} L</td>
                    {isAdminUser && <td>₦{fmtN(f.cost)}</td>}
                    <td>{f.level}%</td>
                    <td>{fmtN(f.odo)} km</td>
                    <td>{f.station}</td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
