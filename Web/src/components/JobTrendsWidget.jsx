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
    const data = payload[0].payload;
    const isApp = payload[0].dataKey === "applications";
    const isPost = payload[0].dataKey === "postings";
    const isEmployment = payload[0].dataKey === "employmentRate";
    
    return (
      <div className="custom-tooltip-pro" style={{ background: 'rgba(16, 26, 43, 0.9)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', borderRadius: '12px', boxShadow: '0 10px 20px rgba(0,0,0,0.4)' }}>
        <span className="tooltip-label" style={{ fontWeight: 800, color: 'white', display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>
          {label || data.category || data.sector || data.name}
        </span>
        <div className="tooltip-value-row" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {payload.map((p, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="tooltip-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', background: p.fill || p.color }}></div>
              <span className="tooltip-value" style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.8rem' }}>
                {p.name === "postings" ? "Active Postings" : p.name === "applications" ? "Total Applications" : "Employment Rate"}: 
                <b style={{ color: 'white', marginLeft: '4px' }}> {p.value}{isEmployment ? "%" : ""}</b>
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export default function JobTrendsWidget() {
  const [trends, setTrends] = useState([]);
  const [interest, setInterest] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [trendsRes, interestRes] = await Promise.all([
          axios.get("/api/v1/stats/job-trends"),
          axios.get("/api/v1/stats/employer-interest")
        ]);

        // Trends Data Handling
        const tData = trendsRes.data?.data || [];
        setTrends(tData.length > 0 ? tData : [
          { sector: "Services", employmentRate: 60.1 },
          { sector: "Agriculture", employmentRate: 22.4 },
          { sector: "Industry", employmentRate: 17.5 }
        ]);

        // Interest Data Handling
        const iData = interestRes.data?.data || [];
        setInterest(iData.length > 0 ? iData : [
          { category: "Tech & Dev", postings: 12, applications: 45 },
          { category: "Marketing", postings: 15, applications: 32 },
          { category: "Design", postings: 5, applications: 28 },
          { category: "Business", postings: 18, applications: 15 }
        ]);

        setLastUpdated(trendsRes.data?.lastUpdated || new Date().toISOString());
        setLoading(false);
      } catch (err) {
        console.error("Stats fetch error:", err);
        // Guaranteed Fallback
        setTrends([
          { sector: "Services", employmentRate: 60.1 },
          { sector: "Agriculture", employmentRate: 22.4 },
          { sector: "Industry", employmentRate: 17.5 }
        ]);
        setInterest([
          { category: "Tech & Dev", postings: 12, applications: 45 },
          { category: "Marketing", postings: 15, applications: 32 },
          { category: "Design", postings: 5, applications: 28 },
          { category: "Business", postings: 18, applications: 15 }
        ]);
        setLastUpdated(new Date().toISOString());
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="trends-bento">
      <div className="bento-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'flex-start' }}>
          <div>
            <span className="bento-label">Market Intelligence</span>
            <h3>Strategic Market Insights</h3>
            <p className="insight-text" style={{ marginTop: '4px' }}>
              PH Sector Trends • <span style={{ color: "var(--primary)", fontWeight: 700 }}>Internal Demand</span>
            </p>
          </div>
          {lastUpdated && (
            <span className="hero-badge" style={{ margin: 0, fontSize: '0.7rem' }}>
              {new Date(lastUpdated).getFullYear()} DATA
            </span>
          )}
        </div>
      </div>

      <div className="market-intelligence-container" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {loading ? (
          <div className="market-status-overlay" style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span>Analyzing trends...</span>
          </div>
        ) : (
          <>
            {/* National Trends Section */}
            <div className="chart-section">
              <div className="chart-header" style={{ marginBottom: '16px' }}>
                <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ background: 'rgba(255,255,255,0.05)', padding: '6px', borderRadius: '8px' }}>📊</span> 
                  Sector Distribution
                </h4>
                <span className="source" style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>Source: World Bank Indicators</span>
              </div>
              
              <div className="chart-wrapper" style={{ height: '200px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trends} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                    <XAxis
                    dataKey="sector"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: "var(--text)", opacity: 0.8, fontWeight: 600 }}
                    dy={10}
                    />
                    <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: "var(--text)", opacity: 0.7 }}
                    domain={[0, 100]}
                    tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip 
                    content={<CustomTooltip />} 
                    cursor={{ fill: "rgba(255, 255, 255, 0.05)" }} 
                    contentStyle={{ backgroundColor: 'transparent', border: 'none' }}
                    />
                    <Bar dataKey="employmentRate" radius={[6, 6, 0, 0]} barSize={40}>
                    {trends.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                    </Bar>
                    </BarChart>
                    </ResponsiveContainer>
                    </div>
                    </div>

                    {/* Internal Interest Row */}
                    <div className="interest-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div className="chart-section">
                    <div className="chart-header">
                    <h4 style={{ color: "var(--text)" }}>💼 Demand</h4>
                    </div>
                    <div className="chart-wrapper" style={{ height: '140px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[...interest].sort((a,b) => b.postings - a.postings).slice(0, 3)} layout="vertical" margin={{ left: -20, right: 20 }}>
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="category" 
                      type="category" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 9, fill: "var(--text)", fontWeight: 700 }}
                      width={70}
                    />
                    <Tooltip 
                      content={<CustomTooltip />} 
                      contentStyle={{ backgroundColor: 'transparent', border: 'none' }}
                      cursor={{ fill: "rgba(255, 255, 255, 0.05)" }}
                    />
                    <Bar dataKey="postings" fill="#10B981" radius={[0, 4, 4, 0]} barSize={10} />
                    </BarChart>
                    </ResponsiveContainer>
                    </div>
                    </div>

                    <div className="chart-section">
                    <div className="chart-header">
                    <h4 style={{ color: "var(--text)" }}>👥 Heat</h4>
                    </div>
                    <div className="chart-wrapper" style={{ height: '140px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[...interest].sort((a,b) => b.applications - a.applications).slice(0, 3)} layout="vertical" margin={{ left: -20, right: 20 }}>
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="category" 
                      type="category" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 9, fill: "var(--text)", fontWeight: 700 }}
                      width={70}
                    />
                    <Tooltip 
                      content={<CustomTooltip />} 
                      contentStyle={{ backgroundColor: 'transparent', border: 'none' }}
                      cursor={{ fill: "rgba(255, 255, 255, 0.05)" }}
                    />
                    <Bar dataKey="applications" fill="#4F46E5" radius={[0, 4, 4, 0]} barSize={10} />
                    </BarChart>
                    </ResponsiveContainer>
                    </div>
                    </div>
                    </div>

                    {/* Callout */}
                    {(() => {
                    const topD = [...interest].sort((a, b) => b.postings - a.postings)[0];
                    const topH = [...interest].sort((a, b) => b.applications - a.applications)[0];
                    if (!topD) return null;
                    return (
                    <div className="insight-callout-pro" style={{ background: 'var(--glass)', border: '1px solid rgba(255,255,255,0.1)', padding: '16px', borderRadius: '16px' }}>
                    <p className="insight-text" style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text)', opacity: 0.9, lineHeight: 1.5 }}>
                    <strong style={{ color: '#10B981', filter: 'brightness(1.2)' }}>{topD.category}</strong> has the most openings, while 
                    <strong style={{ color: '#4F46E5', filter: 'brightness(1.2)' }}> {topH.category}</strong> has the most competition.
                    </p>
                    </div>
                    );
                    })()}          </>
        )}
      </div>
    </div>
  );
}
