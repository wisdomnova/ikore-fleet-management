"use client";

import React, { useState } from "react";
import { useFleet, DRIVER_NAMES } from "../layout";
import { API_BASE_URL } from "../../config";
import Dropdown from "../../components/Dropdown";

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
  const [flLevel, setFlLevel] = useState<number | "">(75);
  const [flOdo, setFlOdo] = useState("");
  const [flStation, setFlStation] = useState("");
  const [fuelMsg, setFuelMsg] = useState({ text: "", type: "" });
  const [isFuelPending, setIsFuelPending] = useState(false);

  const isAdminUser = currentUser?.name === "Godsfavour Nyoyoko";
  const isDriverUser = currentUser ? DRIVER_NAMES.includes(currentUser.name) : false;

  const carOptions = cars.map((c) => ({
    value: c.id,
    label: `${c.plate !== "TBD" ? c.plate + " - " : ""}${c.name} (${c.co === "Tractrac" ? "TracTrac" : c.co === "Ikore" ? "Ikore" : "ChananHill"})`
  }));

  const driverOptions = [
    { value: "Peter Agbo", label: "Peter Agbo" },
    { value: "Ameh Friday", label: "Ameh Friday" },
    { value: "Louis Ogbuneke", label: "Louis Ogbuneke" },
    { value: "Other / self-drive staff", label: "Other / self-drive staff" }
  ];

  const fmtN = (n: number | string): string => {
    return Number(n).toLocaleString("en-NG");
  };

  const handleFuelSubmit = async (e: React.FormEvent) => {
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

    const levelVal = Number(flLevel);
    if (flLevel === "" || isNaN(levelVal) || levelVal < 0 || levelVal > 100) {
      setFuelMsg({ text: "Please enter a valid tank level percentage between 0 and 100.", type: "err" });
      return;
    }

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
      level: levelVal,
      odo: odo || c.odo,
      station
    };

    setIsFuelPending(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/fuel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newLog)
      });

      if (!response.ok) {
        throw new Error("Failed to save fuel entry on server.");
      }

      const savedLog = await response.json();
      setFuelLogs([...fuelLogs, savedLog]);
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
    } catch (err: any) {
      setFuelMsg({ text: err.message || "Failed to save fuel entry.", type: "err" });
    } finally {
      setIsFuelPending(false);
    }
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
              <Dropdown
                options={carOptions}
                value={flCar}
                onChange={(val) => setFlCar(Number(val))}
                placeholder="Select vehicle…"
              />
            </div>
            <div>
              <label htmlFor="flDriver">Driver</label>
              <Dropdown
                options={driverOptions}
                value={flDriver}
                onChange={(val) => setFlDriver(val)}
                placeholder="Select driver…"
              />
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
              <label htmlFor="flLevel">Tank level after filling (%)</label>
              <input
                type="number"
                id="flLevel"
                min="0"
                max="100"
                placeholder="e.g. 75"
                value={flLevel}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "") {
                    setFlLevel("");
                  } else {
                    const num = Number(val);
                    if (num >= 0 && num <= 100) {
                      setFlLevel(num);
                    }
                  }
                }}
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
          <button type="submit" className="btn" id="flSubmit" disabled={isFuelPending}>
            {isFuelPending ? "Saving..." : "Save fuel entry"}
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
