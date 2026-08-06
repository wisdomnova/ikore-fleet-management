"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconChevronDown, IconCheck, IconSearch } from "@tabler/icons-react";

interface DropdownOption {
  value: string | number;
  label: string;
}

interface DropdownProps {
  options: DropdownOption[];
  value: string | number;
  onChange: (value: any) => void;
  placeholder?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  searchable?: boolean;
}

export default function Dropdown({
  options,
  value,
  onChange,
  placeholder = "Select...",
  disabled = false,
  icon,
  searchable = true
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset search when opening/closing
  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      // Focus search input on next tick
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      ref={dropdownRef}
      style={{
        position: "relative",
        width: "100%",
        fontFamily: "inherit"
      }}
    >
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#FFFFFF",
          border: "1.5px solid #E5E7EB",
          borderRadius: "10px",
          padding: "12px 14px",
          fontSize: "0.88rem",
          color: selectedOption ? "#111827" : "#9CA3AF",
          cursor: disabled ? "not-allowed" : "pointer",
          outline: "none",
          textAlign: "left",
          transition: "all 0.2s ease",
          opacity: disabled ? 0.6 : 1
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {icon && <span style={{ display: "flex", color: "#6B7280" }}>{icon}</span>}
          <span>{selectedOption ? selectedOption.label : placeholder}</span>
        </div>
        <IconChevronDown
          size={18}
          stroke={1.5}
          style={{
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
            color: "#9CA3AF"
          }}
        />
      </button>

      {/* Options Dropdown Menu */}
      <AnimatePresence>
        {isOpen && !disabled && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 4 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              zIndex: 50,
              background: "#FFFFFF",
              border: "1px solid #E5E7EB",
              borderRadius: "10px",
              marginTop: "4px",
              maxHeight: "280px",
              overflowY: "auto",
              padding: "6px",
              boxShadow: "none" // Clean and flat as requested
            }}
          >
            {/* Search Input */}
            {searchable && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "4px 8px",
                  borderBottom: "1.5px solid #F3F4F6",
                  marginBottom: "6px"
                }}
              >
                <IconSearch size={16} style={{ color: "#9CA3AF" }} />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: "100%",
                    border: "none",
                    outline: "none",
                    fontSize: "0.85rem",
                    padding: "6px 0",
                    background: "transparent",
                    color: "#111827"
                  }}
                />
              </div>
            )}

            {/* Options List */}
            <div style={{ maxHeight: "200px", overflowY: "auto" }}>
              {filteredOptions.length === 0 ? (
                <div style={{ padding: "10px 12px", fontSize: "0.85rem", color: "#9CA3AF" }}>
                  No match found
                </div>
              ) : (
                filteredOptions.map((opt) => {
                  const isSelected = opt.value === value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        onChange(opt.value);
                        setIsOpen(false);
                      }}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 12px",
                        fontSize: "0.88rem",
                        color: isSelected ? "var(--tt-dark)" : "#374151",
                        background: isSelected ? "var(--tt-soft)" : "transparent",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        textAlign: "left",
                        outline: "none"
                      }}
                    >
                      <span>{opt.label}</span>
                      {isSelected && <IconCheck size={16} stroke={2} style={{ color: "var(--tt)" }} />}
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
