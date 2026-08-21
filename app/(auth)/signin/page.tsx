"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { STAFF } from "../../(dashboard)/layout";
import { API_BASE_URL } from "../../config";
import { motion, AnimatePresence } from "framer-motion";
import { IconLock, IconUser, IconBuildingStore, IconBuildingSkyscraper, IconBuilding, IconArrowRight, IconEye, IconEyeOff } from "@tabler/icons-react";
import Dropdown from "../../components/Dropdown";

const DEFAULT_PW = "fleet123";

export default function SignInPage() {
  const router = useRouter();
  const [pickedCo, setPickedCo] = useState<"Tractrac" | "Ikore" | "ChananHill" | null>(null);
  const [loginStaff, setLoginStaff] = useState("");
  const [loginPw, setLoginPw] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginMsg, setLoginMsg] = useState({ text: "", type: "" });
  const [isPending, setIsPending] = useState(false);
  const [btnHover, setBtnHover] = useState(false);

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Password reset modal states
  const [showPasswordResetModal, setShowPasswordResetModal] = useState(false);
  const [resetPw, setResetPw] = useState("");
  const [confirmResetPw, setConfirmResetPw] = useState("");
  const [showResetPw, setShowResetPw] = useState(false);
  const [showConfirmResetPw, setShowConfirmResetPw] = useState(false);
  const [resetPwMsg, setResetPwMsg] = useState({ text: "", type: "" });
  const [isResetPending, setIsResetPending] = useState(false);
  const [authenticatedUserObj, setAuthenticatedUserObj] = useState<any>(null);

  const handleSignIn = async () => {
    setLoginMsg({ text: "", type: "" });
    if (!pickedCo) {
      setLoginMsg({ text: "Choose your company first.", type: "err" });
      return;
    }
    if (!loginStaff) {
      setLoginMsg({ text: "Select your name from the staff list.", type: "err" });
      return;
    }

    const matched = STAFF.find((s) => s.name === loginStaff);
    if (!matched) return;

    setIsPending(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username: matched.user,
          password: loginPw
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setLoginMsg({ text: data.error || "Wrong password.", type: "err" });
        setIsPending(false);
        return;
      }

      if (loginPw === DEFAULT_PW) {
        setAuthenticatedUserObj(data.user);
        setIsPending(false);
        setShowPasswordResetModal(true);
      } else {
        localStorage.setItem("fleet_currentUser", JSON.stringify(data.user));
        router.push("/");
      }
    } catch (err) {
      setLoginMsg({ text: "Failed to connect to authentication server.", type: "err" });
      setIsPending(false);
    }
  };

  const handlePasswordResetSubmit = async () => {
    setResetPwMsg({ text: "", type: "" });
    if (!resetPw) {
      setResetPwMsg({ text: "Please enter a new password.", type: "err" });
      return;
    }
    if (resetPw.length < 4) {
      setResetPwMsg({ text: "Password must be at least 4 characters long.", type: "err" });
      return;
    }
    if (resetPw !== confirmResetPw) {
      setResetPwMsg({ text: "Passwords do not match.", type: "err" });
      return;
    }
    if (resetPw === DEFAULT_PW) {
      setResetPwMsg({ text: "Please choose a password other than the default password.", type: "err" });
      return;
    }
    if (!authenticatedUserObj) return;

    setIsResetPending(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/update-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username: authenticatedUserObj.user,
          password: resetPw
        })
      });

      if (!response.ok) {
        throw new Error("Failed to save password.");
      }

      localStorage.setItem("fleet_currentUser", JSON.stringify(authenticatedUserObj));
      router.push("/");
    } catch (err) {
      setResetPwMsg({ text: "Failed to update password. Please try again.", type: "err" });
      setIsResetPending(false);
    }
  };

  const currentStep = !pickedCo ? 1 : !loginStaff ? 2 : 3;

  const staffOptions = pickedCo
    ? STAFF.filter((s) => s.co === pickedCo)
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((s) => ({
          value: s.name,
          label: s.name + (s.approver ? " (Approver)" : "")
        }))
    : [];

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        width: "100vw",
        background: "#FFFFFF",
        fontFamily: "'Google Sans Flex', sans-serif"
      }}
    >
      {/* LEFT SPLIT: Mesh Gradient Background & Step Guide */}
      <div
        style={{
          width: "40%",
          minWidth: "360px",
          background: "linear-gradient(135deg, rgba(225,239,231,0.5) 0%, rgba(252,235,219,0.5) 50%, rgba(247,228,222,0.5) 100%)",
          display: isMobile ? "none" : "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "60px 48px",
          borderRight: "1px solid #F3F4F6",
          position: "relative"
        }}
      >
        <div style={{ position: "relative", zIndex: 2 }}>
          <div
            style={{
              fontSize: "0.78rem",
              fontWeight: 500,
              color: "#9CA3AF",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: "8px"
            }}
          >
            Motorpool Setup
          </div>
          <h1
            style={{
              fontSize: "1.8rem",
              fontWeight: 500,
              color: "#1F2937",
              letterSpacing: "-0.02em",
              lineHeight: "1.25",
              marginBottom: "48px"
            }}
          >
            Access your shared fleet dashboard.
          </h1>

          {/* Stepper */}
          <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
            {/* Step 1 */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  background: pickedCo ? "#10B981" : "#FFFFFF",
                  border: pickedCo ? "none" : "1.5px solid #D1D5DB",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: pickedCo ? "#FFFFFF" : "#9CA3AF",
                  fontSize: "0.85rem",
                  fontWeight: 500
                }}
              >
                {pickedCo ? <IconCheck size={16} stroke={2} /> : "1"}
              </div>
              <div>
                <div style={{ fontSize: "0.88rem", fontWeight: 500, color: currentStep === 1 ? "#111827" : "#6B7280" }}>
                  Select Company
                </div>
                <div style={{ fontSize: "0.78rem", color: "#9CA3AF", marginTop: "2px" }}>
                  Choose TracTrac or Ikore
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  background: loginStaff ? "#10B981" : "#FFFFFF",
                  border: loginStaff ? "none" : "1.5px solid #D1D5DB",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: loginStaff ? "#FFFFFF" : "#9CA3AF",
                  fontSize: "0.85rem",
                  fontWeight: 500
                }}
              >
                {loginStaff ? <IconCheck size={16} stroke={2} /> : "2"}
              </div>
              <div>
                <div style={{ fontSize: "0.88rem", fontWeight: 500, color: currentStep === 2 ? "#111827" : "#6B7280" }}>
                  Staff Identity
                </div>
                <div style={{ fontSize: "0.78rem", color: "#9CA3AF", marginTop: "2px" }}>
                  Select your name from list
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  background: "#FFFFFF",
                  border: "1.5px solid #D1D5DB",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#9CA3AF",
                  fontSize: "0.85rem",
                  fontWeight: 500
                }}
              >
                3
              </div>
              <div>
                <div style={{ fontSize: "0.88rem", fontWeight: 500, color: currentStep === 3 ? "#111827" : "#6B7280" }}>
                  Verification
                </div>
                <div style={{ fontSize: "0.78rem", color: "#9CA3AF", marginTop: "2px" }}>
                  Provide password credentials
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SPLIT: Spacious Clean Sign-In Form */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: isMobile ? "40px 24px" : "60px 10%",
          background: "#FFFFFF"
        }}
      >
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          style={{ maxWidth: "420px", width: "100%", margin: isMobile ? "0 auto" : "0" }}
        >
          <h2
            style={{
              fontSize: "1.6rem",
              fontWeight: 500,
              color: "#111827",
              letterSpacing: "-0.02em",
              marginBottom: "8px"
            }}
          >
            Sign in to Motorpool
          </h2>
          <p
            style={{
              fontSize: "0.88rem",
              color: "#6B7280",
              fontWeight: 400,
              lineHeight: "1.4",
              marginBottom: "36px"
            }}
          >
            Shared motorpool and dispatch board. Connect with your staff profile to schedule and manage bookings.
          </p>

          {/* Form */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Company Picker */}
            <div>
              <label
                style={{
                  fontSize: "0.78rem",
                  fontWeight: 500,
                  color: "#4B5563",
                  display: "block",
                  marginBottom: "8px"
                }}
              >
                Choose company
              </label>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: "12px" }}>
                <button
                  type="button"
                  disabled={isPending}
                  style={{
                    border: pickedCo === "Tractrac" ? "1.5px solid var(--tt)" : "1.5px solid #E5E7EB",
                    background: pickedCo === "Tractrac" ? "var(--tt-soft)" : "#FFFFFF",
                    color: pickedCo === "Tractrac" ? "var(--tt-dark)" : "#4B5563",
                    borderRadius: "10px",
                    padding: "16px 12px",
                    fontWeight: 500,
                    fontSize: "0.85rem",
                    cursor: isPending ? "not-allowed" : "pointer",
                    opacity: isPending ? 0.6 : 1,
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    outline: "none",
                    transition: "all 0.2s"
                  }}
                  onClick={() => setPickedCo("Tractrac")}
                >
                  <IconBuildingStore size={18} stroke={1.5} />
                  TracTrac
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  style={{
                    border: pickedCo === "Ikore" ? "1.5px solid var(--ik)" : "1.5px solid #E5E7EB",
                    background: pickedCo === "Ikore" ? "var(--ik-soft)" : "#FFFFFF",
                    color: pickedCo === "Ikore" ? "var(--ik-dark)" : "#4B5563",
                    borderRadius: "10px",
                    padding: "16px 12px",
                    fontWeight: 500,
                    fontSize: "0.85rem",
                    cursor: isPending ? "not-allowed" : "pointer",
                    opacity: isPending ? 0.6 : 1,
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    outline: "none",
                    transition: "all 0.2s"
                  }}
                  onClick={() => setPickedCo("Ikore")}
                >
                  <IconBuildingSkyscraper size={18} stroke={1.5} />
                  Ikore
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  style={{
                    border: pickedCo === "ChananHill" ? "1.5px solid var(--ch)" : "1.5px solid #E5E7EB",
                    background: pickedCo === "ChananHill" ? "var(--ch-soft)" : "#FFFFFF",
                    color: pickedCo === "ChananHill" ? "var(--ch-dark)" : "#4B5563",
                    borderRadius: "10px",
                    padding: "16px 12px",
                    fontWeight: 500,
                    fontSize: "0.85rem",
                    cursor: isPending ? "not-allowed" : "pointer",
                    opacity: isPending ? 0.6 : 1,
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    outline: "none",
                    transition: "all 0.2s"
                  }}
                  onClick={() => setPickedCo("ChananHill")}
                >
                  <IconBuilding size={18} stroke={1.5} />
                  ChananHill
                </button>
              </div>
            </div>

            {/* Staff Custom Dropdown */}
            <div>
              <label
                htmlFor="loginStaff"
                style={{
                  fontSize: "0.78rem",
                  fontWeight: 500,
                  color: "#4B5563",
                  display: "block",
                  marginBottom: "8px"
                }}
              >
                Select staff profile
              </label>
              <Dropdown
                options={staffOptions}
                value={loginStaff}
                onChange={setLoginStaff}
                disabled={isPending || !pickedCo}
                placeholder={pickedCo ? "Select your name…" : "Select your company first…"}
                icon={<IconUser size={18} stroke={1.5} />}
                searchable={true}
              />
            </div>

            {/* Password Input */}
            <div>
              <label
                htmlFor="loginPw"
                style={{
                  fontSize: "0.78rem",
                  fontWeight: 500,
                  color: "#4B5563",
                  display: "block",
                  marginBottom: "8px"
                }}
              >
                Password
              </label>
              <div style={{ position: "relative", width: "100%" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  id="loginPw"
                  placeholder="Enter password"
                  value={loginPw}
                  disabled={isPending}
                  onChange={(e) => setLoginPw(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !isPending) handleSignIn();
                  }}
                  style={{
                    width: "100%",
                    border: "1.5px solid #E5E7EB",
                    borderRadius: "10px",
                    padding: "12px 42px 12px 14px",
                    fontSize: "0.88rem",
                    fontWeight: 400,
                    color: "#111827",
                    outline: "none",
                    background: isPending ? "#F3F4F6" : "#FFFFFF",
                    cursor: isPending ? "not-allowed" : "text"
                  }}
                />
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: isPending ? "not-allowed" : "pointer",
                    color: "#9CA3AF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 0,
                    outline: "none"
                  }}
                >
                  {showPassword ? <IconEyeOff size={18} stroke={1.5} /> : <IconEye size={18} stroke={1.5} />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {loginMsg.text && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{
                    border: loginMsg.type === "err" ? "1px solid #FCA5A5" : "1px solid #6EE7B7",
                    background: loginMsg.type === "err" ? "#FEF2F2" : "#ECFDF5",
                    color: loginMsg.type === "err" ? "#991B1B" : "#065F46",
                    borderRadius: "8px",
                    padding: "10px 12px",
                    fontSize: "0.82rem",
                    fontWeight: 400
                  }}
                >
                  {loginMsg.text}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <button
              type="button"
              disabled={isPending}
              onMouseEnter={() => !isPending && setBtnHover(true)}
              onMouseLeave={() => setBtnHover(false)}
              style={{
                background: isPending ? "#6B7280" : btnHover ? "#374151" : "#111827",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "10px",
                padding: "14px 20px",
                fontWeight: 500,
                fontSize: "0.9rem",
                cursor: isPending ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                outline: "none",
                width: "100%",
                marginTop: "8px",
                transition: "background-color 0.2s"
              }}
              onClick={handleSignIn}
            >
              {isPending ? "Signing in..." : "Continue"} <IconArrowRight size={18} stroke={1.5} />
            </button>
          </div>

          <p
            style={{
              fontSize: "0.76rem",
              fontWeight: 400,
              color: "#9CA3AF",
              marginTop: "28px",
              lineHeight: "1.4",
              textAlign: "center"
            }}
          >
            Default account password: <code style={{ background: "#F3F4F6", padding: "2px 6px", borderRadius: "4px", color: "#4B5563" }}>fleet123</code> (You will be prompted to set your custom password upon first sign-in)
          </p>
        </motion.div>
      </div>

      <AnimatePresence>
        {showPasswordResetModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              background: "rgba(0, 0, 0, 0.4)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{
                width: "90%",
                maxWidth: "400px",
                background: "#FFFFFF",
                borderRadius: "16px",
                padding: "32px",
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
                fontFamily: "'Google Sans Flex', sans-serif"
              }}
            >
              <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "#111827", marginBottom: "8px" }}>
                Set your custom password
              </h3>
              <p style={{ fontSize: "0.82rem", color: "#6B7280", lineHeight: 1.5, marginBottom: "20px" }}>
                You logged in with the default password. Please choose a custom password to secure your account.
              </p>

              {resetPwMsg.text && (
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: "8px",
                    fontSize: "0.8rem",
                    marginBottom: "16px",
                    background: resetPwMsg.type === "err" ? "#FEF2F2" : "#F0FDF4",
                    border: `1px solid ${resetPwMsg.type === "err" ? "#FEE2E2" : "#BBF7D0"}`,
                    color: resetPwMsg.type === "err" ? "#991B1B" : "#15803D"
                  }}
                >
                  {resetPwMsg.text}
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", color: "#4B5563", marginBottom: "6px" }}>
                    New Password
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showResetPw ? "text" : "password"}
                      placeholder="••••••••"
                      value={resetPw}
                      onChange={(e) => setResetPw(e.target.value)}
                      disabled={isResetPending}
                      style={{
                        width: "100%",
                        padding: "11px 42px 11px 14px",
                        fontSize: "0.88rem",
                        border: "1.5px solid #E5E7EB",
                        borderRadius: "10px",
                        color: "#111827",
                        background: "#FFFFFF",
                        outline: "none"
                      }}
                    />
                    <button
                      type="button"
                      disabled={isResetPending}
                      onClick={() => setShowResetPw(!showResetPw)}
                      style={{
                        position: "absolute",
                        right: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        cursor: isResetPending ? "not-allowed" : "pointer",
                        color: "#9CA3AF",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 0,
                        outline: "none"
                      }}
                    >
                      {showResetPw ? <IconEyeOff size={18} stroke={1.5} /> : <IconEye size={18} stroke={1.5} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", color: "#4B5563", marginBottom: "6px" }}>
                    Confirm Password
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showConfirmResetPw ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmResetPw}
                      onChange={(e) => setConfirmResetPw(e.target.value)}
                      disabled={isResetPending}
                      style={{
                        width: "100%",
                        padding: "11px 42px 11px 14px",
                        fontSize: "0.88rem",
                        border: "1.5px solid #E5E7EB",
                        borderRadius: "10px",
                        color: "#111827",
                        background: "#FFFFFF",
                        outline: "none"
                      }}
                    />
                    <button
                      type="button"
                      disabled={isResetPending}
                      onClick={() => setShowConfirmResetPw(!showConfirmResetPw)}
                      style={{
                        position: "absolute",
                        right: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        cursor: isResetPending ? "not-allowed" : "pointer",
                        color: "#9CA3AF",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 0,
                        outline: "none"
                      }}
                    >
                      {showConfirmResetPw ? <IconEyeOff size={18} stroke={1.5} /> : <IconEye size={18} stroke={1.5} />}
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  disabled={isResetPending}
                  onClick={handlePasswordResetSubmit}
                  style={{
                    flex: 1,
                    background: isResetPending ? "#6B7280" : "#111827",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: "10px",
                    padding: "12px",
                    fontSize: "0.88rem",
                    fontWeight: 500,
                    cursor: isResetPending ? "not-allowed" : "pointer",
                    outline: "none"
                  }}
                >
                  {isResetPending ? "Saving..." : "Save Password"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
const IconCheck = ({ size = 24, stroke = 2 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={stroke}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
