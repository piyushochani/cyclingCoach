"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { api } from "../../../lib/api";

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

const todayStr = () => {
  const d = new Date();
  return d.toISOString().split("T")[0];
};

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [date, setDate] = useState(todayStr);
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [cost, setCost] = useState("");
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/expenses")
      .then((data) => setExpenses(data || []))
      .catch((err) => console.error("Failed to load expenses:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!itemName.trim()) {
      setError("Item name is required");
      return;
    }
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty < 1) {
      setError("Quantity must be at least 1");
      return;
    }
    const cst = parseFloat(cost);
    if (isNaN(cst) || cst <= 0) {
      setError("Cost must be a positive number");
      return;
    }

    const body = { date, itemName: itemName.trim(), quantity: qty, cost: cst };

    try {
      if (editId) {
        const updated = await api.put(`/expenses/${editId}`, body);
        setExpenses((prev) => prev.map((exp) => (exp._id === editId ? updated : exp)));
        setEditId(null);
      } else {
        const created = await api.post("/expenses", body);
        setExpenses((prev) => [created, ...prev]);
      }
      setItemName("");
      setQuantity(1);
      setCost("");
      setDate(todayStr);
    } catch (err) {
      setError("Failed to save expense");
    }
  };

  const handleEdit = (exp) => {
    const d = new Date(exp.date);
    setDate(isNaN(d) ? todayStr() : d.toISOString().split("T")[0]);
    setItemName(exp.itemName);
    setQuantity(exp.quantity);
    setCost(String(exp.cost));
    setEditId(exp._id);
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/expenses/${id}`);
      setExpenses((prev) => prev.filter((e) => e._id !== id));
      if (editId === id) {
        setEditId(null);
        setItemName("");
        setQuantity(1);
        setCost("");
        setDate(todayStr);
      }
    } catch {
      setError("Failed to delete expense");
    }
  };

  const monthlyData = useMemo(() => {
    const grouped = {};
    expenses.forEach((exp) => {
      const d = new Date(exp.date);
      if (isNaN(d)) return;
      const year = d.getFullYear();
      const month = d.getMonth();
      const key = `${year}-${month}`;
      if (!grouped[key]) grouped[key] = { year, month, items: [], total: 0 };
      grouped[key].items.push(exp);
      grouped[key].total += exp.quantity * exp.cost;
    });

    const months = Array.from({ length: 12 }, (_, i) => {
      const key = `${viewYear}-${i}`;
      return grouped[key] || { year: viewYear, month: i, items: [], total: 0 };
    });

    const yearTotal = months.reduce((sum, m) => sum + m.total, 0);

    return { months, yearTotal };
  }, [expenses, viewYear]);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const formatCurrency = (val) =>
    val.toLocaleString("en-US", { style: "currency", currency: "USD" });

  const formatDate = (raw) => {
    const d = new Date(raw);
    if (isNaN(d)) return "\u2014";
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  };

  const sortedExpenses = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="min-h-screen bg-black">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute left-[62%] top-[-8%] h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(255,76,0,0.06)_0%,transparent_70%)]" />
        <div className="absolute bottom-[-10%] left-[-5%] h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle,rgba(255,76,0,0.04)_0%,transparent_72%)]" />
      </div>

      <motion.main
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="relative z-[1] mx-auto max-w-[1320px] px-4 pb-10 pt-[44px] md:px-6 md:pt-[52px] xl:px-8"
      >
        <div className="mb-8 border-b border-white/10 pb-6">
          <p className="font-dmSans text-[10px] uppercase tracking-[0.18em] text-[#FF5500]/80">
            Finance
          </p>
          <h1 className="mt-2 font-barlowCondensed text-5xl uppercase leading-none tracking-wide text-white md:text-6xl">
            YOUR <span className="text-[#FF5500]">EXPENSES</span>
          </h1>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            background: "#0D0D0D",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 12,
            padding: "1.5rem",
            marginBottom: "2rem",
          }}
        >
          <form onSubmit={handleSubmit}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                gap: 12,
                alignItems: "end",
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.38)",
                    marginBottom: 6,
                  }}
                >
                  Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  style={{
                    width: "100%",
                    background: "#080808",
                    color: "#fff",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 10,
                    padding: "10px 14px",
                    fontSize: 14,
                    outline: "none",
                    fontFamily: "'DM Sans', sans-serif",
                    colorScheme: "dark",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.38)",
                    marginBottom: 6,
                  }}
                >
                  Item
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cycling shoes"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  style={{
                    width: "100%",
                    background: "#080808",
                    color: "#fff",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 10,
                    padding: "10px 14px",
                    fontSize: 14,
                    outline: "none",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.38)",
                    marginBottom: 6,
                  }}
                >
                  Qty
                </label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  style={{
                    width: "100%",
                    background: "#080808",
                    color: "#fff",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 10,
                    padding: "10px 14px",
                    fontSize: 14,
                    outline: "none",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.38)",
                    marginBottom: 6,
                  }}
                >
                  Cost ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  style={{
                    width: "100%",
                    background: "#080808",
                    color: "#fff",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 10,
                    padding: "10px 14px",
                    fontSize: 14,
                    outline: "none",
                  }}
                />
              </div>

              <div>
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    width: "100%",
                    padding: "10px 18px",
                    borderRadius: 10,
                    background: "#FF5500",
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    border: "none",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  {editId ? "Update" : "Add Expense"}
                </motion.button>
              </div>
            </div>

            {error && (
              <p style={{ margin: "10px 0 0", fontSize: 12, color: "#E74C3C" }}>{error}</p>
            )}

            {editId && (
              <p style={{ margin: "10px 0 0", fontSize: 12, color: "rgba(255,255,255,0.38)" }}>
                Editing expense \u2014{" "}
                <button
                  type="button"
                  onClick={() => {
                    setEditId(null);
                    setItemName("");
                    setQuantity(1);
                    setCost("");
                    setDate(todayStr);
                    setError("");
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#FF5500",
                    cursor: "pointer",
                    fontSize: 12,
                    textDecoration: "underline",
                    padding: 0,
                  }}
                >
                  cancel
                </button>
              </p>
            )}
          </form>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          style={{
            background: "#0D0D0D",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 12,
            padding: "1.5rem",
            marginBottom: "2rem",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 20,
              marginBottom: "1.5rem",
            }}
          >
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setViewYear((y) => y - 1)}
              style={{
                background: "none",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 8,
                color: "#fff",
                fontSize: 18,
                padding: "6px 12px",
                cursor: "pointer",
                lineHeight: 1,
              }}
            >
              {"\u25C0"}
            </motion.button>

            <span
              style={{
                fontFamily: "'Bebas Neue', 'Impact', sans-serif",
                fontSize: "2rem",
                letterSpacing: "0.04em",
                color: "#FF5500",
                minWidth: 120,
                textAlign: "center",
              }}
            >
              {viewYear}
            </span>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setViewYear((y) => y + 1)}
              style={{
                background: "none",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 8,
                color: "#fff",
                fontSize: 18,
                padding: "6px 12px",
                cursor: "pointer",
                lineHeight: 1,
              }}
            >
              {"\u25B6"}
            </motion.button>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr>
                  {["Month", "Items", "Total"].map((h) => (
                    <th
                      key={h}
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: "#fff",
                        padding: "10px 12px",
                        textAlign: h === "Month" ? "left" : "right",
                        borderBottom: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {monthlyData.months.map((m) => (
                  <tr key={m.month}>
                    <td
                      style={{
                        padding: "12px 12px",
                        color: "#fff",
                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                      }}
                    >
                      {monthNames[m.month]}
                    </td>
                    <td
                      style={{
                        padding: "12px 12px",
                        textAlign: "right",
                        color: "#fff",
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 14,
                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                      }}
                    >
                      {m.items.length}
                    </td>
                    <td
                      style={{
                        padding: "12px 12px",
                        textAlign: "right",
                        color: m.total > 0 ? "#FF5500" : "rgba(255,255,255,0.3)",
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 13,
                        fontWeight: 700,
                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                      }}
                    >
                      {m.total > 0 ? formatCurrency(m.total) : "\u2014"}
                    </td>
                  </tr>
                ))}
                <tr>
                  <td
                    style={{
                      padding: "12px 12px",
                      fontFamily: "'Bebas Neue', 'Impact', sans-serif",
                      fontSize: "1.2rem",
                      letterSpacing: "0.04em",
                      color: "#fff",
                      borderTop: "2px solid #FF5500",
                    }}
                  >
                    Total
                  </td>
                  <td
                    style={{
                      padding: "12px 12px",
                      textAlign: "right",
                      borderTop: "2px solid #FF5500",
                    }}
                  />
                  <td
                    style={{
                      padding: "12px 12px",
                      textAlign: "right",
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 14,
                      fontWeight: 700,
                      color: "#FF5500",
                      borderTop: "2px solid #FF5500",
                    }}
                  >
                    {formatCurrency(monthlyData.yearTotal)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "1rem",
            }}
          >
            <h2
              style={{
                fontFamily: "'Bebas Neue', 'Impact', sans-serif",
                fontSize: "1.8rem",
                fontWeight: 400,
                letterSpacing: "0.04em",
                margin: 0,
                color: "#fff",
              }}
            >
              All <span style={{ color: "#FF5500" }}>Expenses</span>
            </h2>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.28)" }}>
              {sortedExpenses.length} item{sortedExpenses.length !== 1 ? "s" : ""}
            </span>
          </div>

          {loading ? (
            <div
              style={{
                padding: "2.5rem 16px",
                fontSize: 13,
                color: "rgba(255,255,255,0.2)",
                textAlign: "center",
              }}
            >
              Loading...
            </div>
          ) : (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(120px, 1.2fr) minmax(0, 1.8fr) 70px 100px 120px 60px",
                  gap: 12,
                  padding: "8px 16px",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                  background: "#0D0D0D",
                  borderTopLeftRadius: 12,
                  borderTopRightRadius: 12,
                }}
              >
                {["Date", "Item", "Qty", "Cost", "Total", ""].map((h) => (
                  <span
                    key={h}
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "#fff",
                      textAlign: h === "Qty" || h === "Cost" || h === "Total" ? "right" : "left",
                    }}
                  >
                    {h}
                  </span>
                ))}
              </div>

              {sortedExpenses.length === 0 ? (
                <div
                  style={{
                    padding: "2.5rem 16px",
                    fontSize: 13,
                    color: "rgba(255,255,255,0.2)",
                    textAlign: "center",
                    background: "#0D0D0D",
                    borderBottomLeftRadius: 12,
                    borderBottomRightRadius: 12,
                  }}
                >
                  No expenses yet. Add one above.
                </div>
              ) : (
                <motion.div
                  variants={stagger}
                  initial="hidden"
                  animate="show"
                  style={{
                    background: "#0D0D0D",
                    borderBottomLeftRadius: 12,
                    borderBottomRightRadius: 12,
                    overflow: "hidden",
                  }}
                >
                  {sortedExpenses.map((exp, index) => (
                    <motion.div
                      key={exp._id}
                      variants={fadeUp}
                      initial="hidden"
                      animate="show"
                      style={{
                        display: "grid",
                        gridTemplateColumns: "minmax(120px, 1.2fr) minmax(0, 1.8fr) 70px 100px 120px 60px",
                        gap: 12,
                        alignItems: "center",
                        padding: "12px 16px",
                        borderBottom: index < sortedExpenses.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                        transition: "background 0.14s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.025)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <span style={{ fontSize: 14, color: "#fff" }}>
                        {formatDate(exp.date)}
                      </span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>
                        {exp.itemName}
                      </span>
                      <span
                        style={{
                          fontSize: 14,
                          color: "#fff",
                          fontFamily: "'JetBrains Mono', monospace",
                          textAlign: "right",
                        }}
                      >
                        {exp.quantity}
                      </span>
                      <span
                        style={{
                          fontSize: 14,
                          color: "#fff",
                          fontFamily: "'JetBrains Mono', monospace",
                          textAlign: "right",
                        }}
                      >
                        {formatCurrency(exp.cost)}
                      </span>
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: "#FF5500",
                          fontFamily: "'JetBrains Mono', monospace",
                          textAlign: "right",
                        }}
                      >
                        {formatCurrency(exp.quantity * exp.cost)}
                      </span>
                      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                        <button
                          onClick={() => handleEdit(exp)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#fff",
                            cursor: "pointer",
                            fontSize: 14,
                            padding: 0,
                            transition: "color 0.14s ease",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = "#FF5500")}
                          onMouseLeave={(e) => (e.currentTarget.style.color = "#fff")}
                        >
                          {"\u270E"}
                        </button>
                        <button
                          onClick={() => handleDelete(exp._id)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#fff",
                            cursor: "pointer",
                            fontSize: 14,
                            padding: 0,
                            transition: "color 0.14s ease",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = "#E74C3C")}
                          onMouseLeave={(e) => (e.currentTarget.style.color = "#fff")}
                        >
                          {"\u2715"}
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </>
          )}
        </motion.div>
      </motion.main>
    </div>
  );
}
