import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate, NavLink } from "react-router-dom";
import { Download, ChevronDown, LogOut, Moon, Calendar } from "lucide-react";
import { supabase } from "../../supabaseClient";
import { useLoading } from "../../context/LoadingContext";
import lpuLogo from "../../assets/lpul-logo.png";
import "./AdminTickets.css";
import "./AdminAnalytics.css";

function getStatusValue(ticket) {
  return (
    ticket?.Status ??
    ticket?.status ??
    ticket?.state ??
    ticket?.State ??
    ""
  );
}

function isClosed(ticket) {
  if (!ticket) return false;
  if (ticket.closed_at) return true;
  const s = String(getStatusValue(ticket)).toLowerCase();
  return s.includes("closed") || s.includes("resolved") || s.includes("done");
}

function escapeCsv(value) {
  const next = String(value ?? "");
  if (next.includes(",") || next.includes('"') || next.includes("\n")) {
    return `"${next.replaceAll('"', '""')}"`;
  }
  return next;
}

function PieChart({ closedCount, openCount }) {
  const total = Math.max(closedCount + openCount, 1);
  const closedAngle = (closedCount / total) * 360;
  const openAngle = 360 - closedAngle;
  return (
    <div className="analytics-pie-wrap">
      <div
        className="analytics-pie"
        style={{
          background: `conic-gradient(#336be3 0deg ${closedAngle}deg, #e6bc23 ${closedAngle}deg ${
            closedAngle + openAngle
          }deg)`,
        }}
      >
        <div className="analytics-pie-inner">{closedCount + openCount}</div>
      </div>
      <div className="analytics-legend">
        <div><span className="dot closed" /> Closed: {closedCount}</div>
        <div><span className="dot open" /> Open: {openCount}</div>
      </div>
    </div>
  );
}

function buildLinePath(series, xFor, yFor) {
  if (!series.length) return "";
  return series
    .map((point, i) => `${i === 0 ? "M" : "L"} ${xFor(point.x)} ${yFor(point.y)}`)
    .join(" ");
}

function DepartmentLineChart({ chartData }) {
  const width = 740;
  const height = 360;
  const pad = { top: 24, right: 24, bottom: 56, left: 56 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  const { departments, maxY, seriesAll, seriesOpen, seriesClosed } = chartData;
  const xMax = Math.max(1, departments.length);
  const yMax = Math.max(1, maxY);
  const xFor = (v) => pad.left + (v / xMax) * plotW;
  const yFor = (v) => pad.top + plotH - (v / yMax) * plotH;
  const yTicks = [0, 1, 2, 3, 4, 5].map((t) => Math.round((yMax * t) / 5));

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="analytics-line-svg" role="img" aria-label="Department ticket trend">
      {[...new Set(yTicks)].map((tick) => (
        <g key={tick}>
          <line x1={pad.left} y1={yFor(tick)} x2={width - pad.right} y2={yFor(tick)} className="grid-line" />
          <text x={pad.left - 8} y={yFor(tick) + 4} textAnchor="end" className="axis-label y-axis-label">
            {tick}
          </text>
        </g>
      ))}

      {departments.map((dept, idx) => (
        <text
          key={dept}
          x={xFor(idx + 1)}
          y={height - 14}
          textAnchor={idx === 0 ? "start" : idx === departments.length - 1 ? "end" : "middle"}
          className="axis-label x-axis-label"
        >
          {dept}
        </text>
      ))}

      <path d={buildLinePath(seriesAll, xFor, yFor)} className="line-path line-blue" />
      <path d={buildLinePath(seriesOpen, xFor, yFor)} className="line-path line-cyan" />
      <path d={buildLinePath(seriesClosed, xFor, yFor)} className="line-path line-yellow" />

      <line x1={pad.left} y1={height - pad.bottom} x2={width - pad.right} y2={height - pad.bottom} className="axis-line" />
      <line x1={pad.left} y1={pad.top} x2={pad.left} y2={height - pad.bottom} className="axis-line" />
    </svg>
  );
}

export default function AdminAnalytics() {
  const { showLoading, hideLoading } = useLoading();
  const [tickets, setTickets] = useState([]);
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  const role = localStorage.getItem("userRole");
  const isAdmin = role === "admin";

  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("adminDarkMode") === "true",
  );

  useEffect(() => {
    const root = document.querySelector(".admin-shell");
    if (!root) return;
    root.classList.toggle("admin-dark", darkMode);
    localStorage.setItem("adminDarkMode", String(darkMode));
  }, [darkMode]);

  useEffect(() => {
    const onDocClick = (e) => {
      if (!menuOpen) return;
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [menuOpen]);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        showLoading();
        setError("");
        const { data, error: supaError } = await supabase
          .from("Tickets")
          .select("*")
          .order("id", { ascending: false });

        if (supaError) {
          setError(supaError.message || "Failed to load analytics");
          setTickets([]);
          return;
        }
        setTickets(data || []);
      } catch (e) {
        setError(e?.message || "Failed to load analytics");
      } finally {
        hideLoading();
      }
    };
    if (isLoggedIn && isAdmin) fetchTickets();
  }, [hideLoading, isAdmin, isLoggedIn, showLoading]);

  const { closedCount, openCount, lineChartData } = useMemo(() => {
    const closed = tickets.filter((t) => isClosed(t)).length;
    const open = tickets.length - closed;

    const fixedOrder = ["CAS", "CBA", "CITHM", "COECS", "LPU-SC", "Highschool"];
    const inData = [...new Set(tickets.map((t) => (t.Department || "").trim()).filter(Boolean))];
    const departments = [...new Set([...fixedOrder, ...inData])];

    const countByDepartment = (list) => {
      const map = new Map(departments.map((d) => [d, 0]));
      list.forEach((t) => {
        const key = (t.Department || "Highschool").trim() || "Highschool";
        map.set(key, (map.get(key) || 0) + 1);
      });
      return departments.map((dept, i) => ({ x: i + 1, y: map.get(dept) || 0 }));
    };

    const openTickets = tickets.filter((t) => !isClosed(t));
    const closedTickets = tickets.filter((t) => isClosed(t));
    const allCounts = countByDepartment(tickets);
    const openCounts = countByDepartment(openTickets);
    const closedCounts = countByDepartment(closedTickets);
    const maxY = Math.max(
      1,
      ...allCounts.map((p) => p.y),
      ...openCounts.map((p) => p.y),
      ...closedCounts.map((p) => p.y),
    );

    return {
      closedCount: closed,
      openCount: open,
      lineChartData: {
        departments,
        maxY,
        // Force start at zero for all lines, then plot per-department ticket counts.
        seriesAll: [{ x: 0, y: 0 }, ...allCounts],
        seriesOpen: [{ x: 0, y: 0 }, ...openCounts],
        seriesClosed: [{ x: 0, y: 0 }, ...closedCounts],
      },
    };
  }, [tickets]);

  const onExportCsv = () => {
    const headers = [
      "id",
      "summary",
      "description",
      "department",
      "type",
      "category",
      "site",
      "status",
      "created_at",
      "closed_at",
    ];
    const rows = tickets.map((t) => [
      t.id,
      t.Summary,
      t.Description,
      t.Department,
      t.Type,
      t.Category,
      t.Site,
      t.status || t.Status || "Open",
      t.created_at,
      t.closed_at,
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCsv).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `tickets-export-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const onLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userId");
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userRole");
    window.location.href = "/";
  };

  if (!isLoggedIn) return <Navigate to="/" replace />;
  if (!isAdmin) return <Navigate to="/Tickets" replace />;

  return (
    <div className="admin-page analytics-page">
      <header className="analytics-topbar">
        <div className="analytics-topbar-inner">
          <div className="analytics-brand" aria-label="LPU MIS Help Desk">
            <img src={lpuLogo} alt="LPU" className="analytics-brand-logo" />
            <span className="analytics-brand-text">MIS HELP DESK</span>
          </div>

          <nav className="analytics-nav-links" aria-label="Admin navigation">
            <NavLink
              to="/admin/tickets"
              className={({ isActive }) => `analytics-nav-link ${isActive ? "active" : ""}`}
            >
              Home
            </NavLink>
            <NavLink
              to="/admin/analytics"
              className={({ isActive }) => `analytics-nav-link ${isActive ? "active" : ""}`}
            >
              Analytics
            </NavLink>
          </nav>

          <div className="analytics-actions">
            <button type="button" className="analytics-export-btn" onClick={onExportCsv}>
              <Download size={16} />
              Export CSV
            </button>

            <div className="admin-menu" ref={menuRef}>
              <button
                type="button"
                className="analytics-menu-btn"
                onClick={() => setMenuOpen((v) => !v)}
              >
                <span>Admin</span>
                <ChevronDown size={16} />
              </button>

              {menuOpen && (
                <div className="admin-menu-pop">
                  <button type="button" onClick={onLogout}>
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDarkMode((v) => !v)}
                  >
                    <Moon size={16} />
                    <span>Dark Mode</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <section className="admin-content analytics-content-wrap">
        <h2 className="analytics-title">Tickets Analysis</h2>
        {error ? (
          <div className="admin-error">{error}</div>
        ) : (
          <div className="analytics-grid">
            <article className="analytics-card">
              <div className="analytics-card-head">
                <h3>Total Tickets</h3>
                <button type="button" className="fake-date-input" aria-label="Date filter">
                  MM/DD/YY
                  <Calendar size={12} />
                </button>
              </div>
              <PieChart closedCount={closedCount} openCount={openCount} />
            </article>
            <article className="analytics-card">
              <div className="analytics-card-head">
                <h3>Tickets by Department</h3>
                <button type="button" className="fake-date-input" aria-label="Date filter">
                  MM/DD/YY
                  <Calendar size={12} />
                </button>
              </div>
              <DepartmentLineChart chartData={lineChartData} />
            </article>
          </div>
        )}
      </section>
    </div>
  );
}

