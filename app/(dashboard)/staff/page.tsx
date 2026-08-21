"use client";

import React, { useState } from "react";
import { useFleet, STAFF, DRIVER_NAMES } from "../layout";
import { IconSearch } from "@tabler/icons-react";

export default function StaffPage() {
  const { currentUser } = useFleet();

  const [staffFilter, setStaffFilter] = useState("all");
  const [staffQuery, setStaffQuery] = useState("");

  const isAdminUser = currentUser?.name === "Godsfavour Nyoyoko";

  const getFilteredStaff = () => {
    return STAFF.filter((s) => {
      if (staffFilter === "tt" && s.co !== "Tractrac") return false;
      if (staffFilter === "ik" && s.co !== "Ikore") return false;
      if (staffFilter === "ch" && s.co !== "ChananHill") return false;
      if (staffFilter === "appr" && !s.approver) return false;
      if (staffFilter === "drv" && !DRIVER_NAMES.includes(s.name)) return false;
      if (staffQuery && !s.name.toLowerCase().includes(staffQuery.toLowerCase())) return false;
      return true;
    });
  };

  return (
    <section className="active">
      <div style={{ background: "#FFFFFF", border: "1.5px solid #E5E7EB", borderRadius: "12px", padding: "28px", marginBottom: "32px" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 500, color: "#111827", marginBottom: "10px" }}>Staff directory</h2>
        <p style={{ fontSize: "0.82rem", color: "#6B7280", lineHeight: 1.5, margin: 0 }}>
          {isAdminUser
            ? "All TracTrac, Ikore and ChananHill staff loaded from the HR staff list. As fleet manager you can see each account's login details; in the live system passwords are set by staff and stored securely."
            : "All TracTrac, Ikore and ChananHill staff loaded from the HR staff list. Everyone here can sign in and book vehicles; approvers are marked, and the fleet manager approves requests from all companies."}
        </p>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "20px", marginBottom: "20px", flexWrap: "wrap" }}>
        {/* FILTERS */}
        <div className="filters" style={{ margin: 0 }}>
          <button
            className={`chip ${staffFilter === "all" ? "active" : ""}`}
            onClick={() => setStaffFilter("all")}
          >
            All ({STAFF.length})
          </button>
          <button
            className={`chip ${staffFilter === "tt" ? "active" : ""}`}
            onClick={() => setStaffFilter("tt")}
          >
            TracTrac
          </button>
          <button
            className={`chip ${staffFilter === "ik" ? "active" : ""}`}
            onClick={() => setStaffFilter("ik")}
          >
            Ikore
          </button>
          <button
            className={`chip ${staffFilter === "ch" ? "active" : ""}`}
            onClick={() => setStaffFilter("ch")}
          >
            ChananHill
          </button>
          <button
            className={`chip ${staffFilter === "appr" ? "active" : ""}`}
            onClick={() => setStaffFilter("appr")}
          >
            Approvers
          </button>
          <button
            className={`chip ${staffFilter === "drv" ? "active" : ""}`}
            onClick={() => setStaffFilter("drv")}
          >
            Drivers
          </button>
        </div>

        {/* SEARCH BAR */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#FFFFFF", border: "1.5px solid #E5E7EB", borderRadius: "10px", padding: "10px 14px", width: "320px" }}>
          <IconSearch size={16} style={{ color: "#9CA3AF" }} />
          <input
            type="search"
            placeholder="Search by name..."
            value={staffQuery}
            onChange={(e) => setStaffQuery(e.target.value)}
            style={{
              width: "100%",
              border: "none",
              outline: "none",
              fontSize: "0.85rem",
              background: "transparent",
              color: "#111827"
            }}
          />
        </div>
      </div>

      {/* TABLE */}
      <div style={{ background: "#FFFFFF", border: "1.5px solid #E5E7EB", borderRadius: "12px", padding: "24px", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1.5px solid #E5E7EB", background: "#FAFBFB" }}>
                <th style={{ padding: "14px 16px", fontSize: "0.78rem", fontWeight: 500, color: "#6B7280" }}>Name</th>
                <th style={{ padding: "14px 16px", fontSize: "0.78rem", fontWeight: 500, color: "#6B7280" }}>Company</th>
                <th style={{ padding: "14px 16px", fontSize: "0.78rem", fontWeight: 500, color: "#6B7280" }}>Designation</th>
                <th style={{ padding: "14px 16px", fontSize: "0.78rem", fontWeight: 500, color: "#6B7280" }}>Department</th>
                {isAdminUser && <th style={{ padding: "14px 16px", fontSize: "0.78rem", fontWeight: 500, color: "#6B7280" }}>Login (username / password)</th>}
              </tr>
            </thead>
            <tbody>
              {getFilteredStaff().map((s) => (
                <tr
                  key={s.user}
                  style={{ borderBottom: "1px solid #F3F4F6", transition: "background 0.15s ease" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#FAFBFB")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <td style={{ padding: "16px", fontSize: "0.85rem", color: "#111827" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span className={`co-dot ${s.co === "Tractrac" ? "tt" : "ik"}`} style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: s.co === "Tractrac" ? "#C2410C" : "#15803D" }}></span>
                      <span style={{ fontWeight: 400 }}>{s.name}</span>
                      {s.approver && (
                        <span
                          style={{
                            fontSize: "0.68rem",
                            fontWeight: 500,
                            padding: "2px 8px",
                            borderRadius: "12px",
                            background: "#FFF9C4",
                            color: "#F57F17",
                            border: "1px solid #FFF59D"
                          }}
                        >
                          Approver
                        </span>
                      )}
                      {DRIVER_NAMES.includes(s.name) && (
                        <span
                          style={{
                            fontSize: "0.68rem",
                            fontWeight: 500,
                            padding: "2px 8px",
                            borderRadius: "12px",
                            background: "#E0F2FE",
                            color: "#0369A1",
                            border: "1px solid #BAE6FD"
                          }}
                        >
                          Driver
                        </span>
                      )}
                      {s.name === "Godsfavour Nyoyoko" && (
                        <span
                          style={{
                            fontSize: "0.68rem",
                            fontWeight: 500,
                            padding: "2px 8px",
                            borderRadius: "12px",
                            background: "#F3F4F6",
                            color: "#374151",
                            border: "1px solid #E5E7EB"
                          }}
                        >
                          Fleet manager
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: "16px", fontSize: "0.85rem" }}>
                    <span className={`co-chip ${s.co === "Tractrac" ? "tt" : "ik"}`}>
                      {s.co === "Tractrac" ? "TracTrac" : "Ikore"}
                    </span>
                  </td>
                  <td style={{ padding: "16px", fontSize: "0.85rem", color: "#4B5563" }}>{s.designation || "-"}</td>
                  <td style={{ padding: "16px", fontSize: "0.85rem", color: "#4B5563" }}>{s.dept || "-"}</td>
                  {isAdminUser && (
                    <td style={{ padding: "16px", fontSize: "0.85rem", fontFamily: "var(--font-mono)", color: "#1F2937" }}>
                      <span>{s.user}</span>
                      <span style={{ color: "#9CA3AF", margin: "0 6px" }}>/</span>
                      <span>fleet123</span>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
