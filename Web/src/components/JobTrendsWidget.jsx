import { useEffect, useState } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const COLORS = ["#4F46E5", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(4px)",
          border: "1px solid #e2e8f0",
          borderRadius: "12px",
          padding: "12px 16px",
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
          fontSize: "14px",
        }}
      >
        <p style={{ margin: "0 0 4px 0", fontWeight: 600, color: "#1e293b" }}>{label}</p>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: payload[0].fill }}></div>
          <p style={{ margin: 0, color: "#64748b" }}>
            Employment Rate: <span style={{ color: "#0f172a", fontWeight: 700 }}>{payload[0].value}%</span>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

export default function JobTrendsWidget() {
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    axios
      .get("/api/v1/stats/job-trends")
      .then((res) => {
        setTrends(res.data.data || []);
        setLastUpdated(res.data.lastUpdated || null);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Stats fetch error:", err);
        setError("Market data temporarily unavailable.");
        setLoading(false);
      });
  }, []);

  return (
    <section className="card" style={{ 
      marginBottom: "2rem", 
      border: "1px solid #f1f5f9",
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
      borderRadius: "16px",
      overflow: "hidden"
    }}>
      {/* Header */}
      <div style={{ 
        padding: "1.5rem 1.5rem 0.5rem 1.5rem",
        borderBottom: "none"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h3 style={{ 
              fontSize: "1.125rem", 
              fontWeight: 700, 
              color: "#0f172a", 
              margin: "0 0 4px 0",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}>
              <span style={{ fontSize: "1.25rem" }}>📊</span> Philippine Job Market Trends
            </h3>
            <p style={{ fontSize: "0.875rem", color: "#64748b", margin: 0 }}>
              Employment share by sector • <span style={{ color: "#4F46E5", fontWeight: 500 }}>World Bank Indicators</span>
            </p>
          </div>
          {lastUpdated && (
            <span style={{ 
              fontSize: "0.75rem", 
              padding: "4px 10px", 
              background: "#f1f5f9", 
              color: "#475569", 
              borderRadius: "20px",
              fontWeight: 500
            }}>
              {new Date(lastUpdated).getFullYear()} Data
            </span>
          )}
        </div>
      </div>

      <div style={{ padding: "1.5rem" }}>
        {loading && (
          <div style={{ height: 260, display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>
            <div className="loading-spinner-simple" style={{ textAlign: "center" }}>
              <p style={{ fontSize: "0.875rem" }}>Analyzing market trends...</p>
            </div>
          </div>
        )}

        {error && (
          <div style={{ height: 260, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ 
              padding: "1rem 1.5rem", 
              background: "#fff1f2", 
              borderRadius: "12px", 
              color: "#e11d48",
              fontSize: "0.875rem",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}>
              <span>⚠️</span> {error}
            </div>
          </div>
        )}

        {!loading && !error && trends.length > 0 && (
          <>
            <div style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trends} margin={{ top: 10, right: 10, left: -25, bottom: 20 }}>
                  <defs>
                    {COLORS.map((color, i) => (
                      <linearGradient key={`gradient-${i}`} id={`barGradient-${i}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity={0.9} />
                        <stop offset="100%" stopColor={color} stopOpacity={0.6} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="sector"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#64748b", fontWeight: 500 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#94a3b8" }}
                    domain={[0, 100]}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f8fafc" }} />
                  <Bar dataKey="employmentRate" radius={[6, 6, 0, 0]} barSize={40}>
                    {trends.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={`url(#barGradient-${index % COLORS.length})`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Insight Callout */}
            {(() => {
              const top = [...trends].sort((a, b) => b.employmentRate - a.employmentRate)[0];
              return (
                <div style={{ 
                  marginTop: "1.5rem", 
                  padding: "1rem 1.25rem", 
                  background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
                  borderRadius: "12px",
                  border: "1px solid #bbf7d0",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px"
                }}>
                  <div style={{ 
                    width: "32px", 
                    height: "32px", 
                    background: "#22c55e", 
                    borderRadius: "50%", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    fontSize: "1rem"
                  }}>
                    ✨
                  </div>
                  <p style={{ margin: 0, fontSize: "0.875rem", color: "#166534", lineHeight: 1.5 }}>
                    <strong style={{ color: "#14532d" }}>{top.sector}</strong> is currently the leading employment sector (<strong>{top.employmentRate}%</strong>). 
                    Focusing your internship search here could offer the most opportunities.
                  </p>
                </div>
              );
            })()}
          </>
        )}
      </div>
    </section>
  );
}
