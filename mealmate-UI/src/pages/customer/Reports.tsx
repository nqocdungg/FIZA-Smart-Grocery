import React, { useEffect, useMemo, useRef, useState } from "react";
import "./Reports.css";
import jsPDF from "jspdf";

import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import { useAuth } from "@/context/AuthContext";
import {
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import {
  fetchCategories,
  fetchReportOverview,
  type CategoryOption,
  type ReportOverview,
  type ReportPoint,
  type TrendItem
} from "@/features/reports/api/reportApi";

const timeTabs = [
  { label: "7 ngày", days: 7 },
  { label: "30 ngày", days: 30 },
  { label: "3 tháng", days: 90 },
  { label: "1 năm", days: 365 },
  { label: "Tùy chọn", days: 30 }
];

const weekdayLabels = ["T.2", "T.3", "Hôm nay", "T.5", "T.6", "T.7", "CN"];

const formatPercent = (value: number) => {
  const rounded = Math.round(value);
  if (rounded === 0) {
    return "0%";
  }
  return `${rounded > 0 ? "+" : ""}${rounded}%`;
};

const formatAbsolutePercent = (value: number) => `${Math.abs(Math.round(value))}%`;
const formatFullDate = (date: string) => {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return date;
  }
  return parsed.toLocaleDateString("vi-VN");
};

const formatShortDate = (date: string) => {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return date;
  }
  return parsed.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
};

const buildChartData = (series: ReportPoint[]) =>
  series.map((point) => ({
    date: formatShortDate(point.date),
    value: point.value
  }));

const TimeRangeTabs: React.FC<{
  activeLabel: string;
  onSelect: (label: string) => void;
}> = ({ activeLabel, onSelect }) => {
  return (
    <div className="user-reports-tabs">
      {timeTabs.map((tab) => (
        <button
          key={tab.label}
          className={tab.label === activeLabel ? "active" : ""}
          type="button"
          onClick={() => onSelect(tab.label)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

const CategorySelect: React.FC<{
  categories: CategoryOption[];
  selectedId: number | null;
  onChange: (value: number | null) => void;
}> = ({ categories, selectedId, onChange }) => {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedLabel =
    selectedId == null
      ? "Tất cả danh mục"
      : categories.find((category) => category.id === selectedId)?.name ?? "Tất cả danh mục";

  return (
    <div className={`user-reports-select ${open ? "open" : ""}`} ref={wrapperRef}>
      <button type="button" className="user-reports-select-trigger" onClick={() => setOpen((prev) => !prev)}>
        <span className="user-reports-select-label">{selectedLabel}</span>
      </button>
      <span className="caret" />
      {open && (
        <div className="user-reports-select-menu">
          <button
            type="button"
            className={`user-reports-option ${selectedId == null ? "active" : ""}`}
            onClick={() => {
              onChange(null);
              setOpen(false);
            }}
          >
            Tất cả danh mục
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              className={`user-reports-option ${selectedId === category.id ? "active" : ""}`}
              onClick={() => {
                onChange(category.id);
                setOpen(false);
              }}
            >
              {category.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const PrimaryButton: React.FC<{ label: string; onClick?: () => void }> = ({ label, onClick }) => {
  return (
    <button className="user-reports-primary" type="button" onClick={onClick}>
      <span className="export-icon" />
      {label}
    </button>
  );
};

const SummaryCard: React.FC<{
  purchasedCount: number;
  changePercent: number;
  series: ReportPoint[];
}> = ({ purchasedCount, changePercent, series }) => {
  const chartData = useMemo(() => buildChartData(series), [series]);
  const isUp = changePercent > 0;
  const isDown = changePercent < 0;

  return (
    <div className="user-reports-card">
      <div className="user-reports-card-header">
        <div>
          <div className="user-reports-label">Thực phẩm đã mua</div>
          <div className="user-reports-value">
            <span>{purchasedCount}</span>
            <small>mục</small>
          </div>
        </div>
        <div className={`user-reports-chip ${isUp ? "up" : isDown ? "down" : ""}`}>
          <span className="trend-icon" />
          <span>{formatPercent(changePercent)}</span>
        </div>
      </div>
      <div className="user-reports-line-chart">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 16, right: 8, left: 8, bottom: 0 }}>
            <XAxis dataKey="date" hide />
            <YAxis hide />
           <Tooltip
              cursor={false}
              formatter={(value: any) => [`${value ?? 0} mục`, ""]}
              labelFormatter={() => ""}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#006B55"
              strokeWidth={2.6}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const TrendCard: React.FC<{ items: TrendItem[] }> = ({ items }) => {
  const chartItems = items.length
    ? items
    : [{ categoryId: null, label: "Chưa có dữ liệu", count: 1, percent: 100, color: "#E4E7ED" }];

  return (
    <div className="user-reports-card">
      <div className="user-reports-card-title">Xu hướng tiêu thụ</div>
      <div className="user-reports-trend">
        <div className="user-reports-donut">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartItems}
                dataKey="count"
                nameKey="label"
                innerRadius={38}
                outerRadius={58}
                paddingAngle={2}
                stroke="none"
              >
                {chartItems.map((item, index) => (
                  <Cell key={`${item.label}-${index}`} fill={item.color || "#006B55"} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <span className="donut-core" />
        </div>
        <div className="user-reports-legend">
          {items.map((item) => (
            <div className="legend-row" key={`${item.label}-${item.categoryId ?? "none"}`}>
              <div className="legend-left">
                <span className="legend-dot" style={{ background: item.color || "#006B55" }} />
                <span>{item.label}</span>
              </div>
              <strong>{`${Math.round(item.percent)}%`}</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const WasteCard: React.FC<{
  expiredCount: number;
  purchasedCount: number;
  changePercent: number;
  note: string;
}> = ({ expiredCount, purchasedCount, changePercent, note }) => {
  const prefix = changePercent > 0 ? "Tăng" : changePercent < 0 ? "Giảm" : "Không đổi";
  const wasteRate = purchasedCount > 0 ? Math.round((expiredCount / purchasedCount) * 100) : 0;
  const riskClass = wasteRate >= 20 ? "high" : wasteRate >= 10 ? "medium" : "low";

  return (
    <div className="user-reports-card waste">
      <div className="user-reports-card-header">
        <div className="user-reports-card-title">Lãng phí</div>
        <div className="waste-icon" />
      </div>
      <div className="waste-body">
        <div className="waste-count">
          <span className="waste-number">{String(expiredCount).padStart(2, "0")}</span>
          <span className="waste-label">sản phẩm đã hết hạn</span>
        </div>
        <div className="waste-bar">
          <div className={`waste-bar-fill ${riskClass}`} style={{ width: `${wasteRate}%` }} />
        </div>
        <p className="waste-note">
          {prefix} <span>{formatAbsolutePercent(changePercent)}</span> so với kỳ trước. {note}
        </p>
      </div>
    </div>
  );
};

const DetailChart: React.FC<{
  purchaseSeries: ReportPoint[];
  usedSeries: ReportPoint[];
  expiredSeries: ReportPoint[];
}> = ({ purchaseSeries, usedSeries, expiredSeries }) => {
  const [activeTab, setActiveTab] = useState<"purchase" | "used" | "expired">("purchase");
  const currentSeries = useMemo(() => {
    if (activeTab === "used") {
      return usedSeries;
    }
    if (activeTab === "expired") {
      return expiredSeries;
    }
    return purchaseSeries;
  }, [activeTab, expiredSeries, purchaseSeries, usedSeries]);

  const chartData = useMemo(() => buildChartData(currentSeries), [currentSeries]);

  return (
    <div className="user-reports-detail">
      <div className="detail-header">
        <div>
          <h2>Phân tích chi tiết</h2>
          <p>Chu kỳ nhập và xuất thực phẩm định kỳ</p>
        </div>
        <div className="detail-tabs">
          <button
            className={activeTab === "purchase" ? "active" : ""}
            type="button"
            onClick={() => setActiveTab("purchase")}
          >
            Mua vào
          </button>
          <button
            className={activeTab === "used" ? "active" : ""}
            type="button"
            onClick={() => setActiveTab("used")}
          >
            Tiêu thụ
          </button>
          <button
            className={activeTab === "expired" ? "active" : ""}
            type="button"
            onClick={() => setActiveTab("expired")}
          >
            Hết hạn
          </button>
        </div>
      </div>
      <div className="detail-chart">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 12, right: 16, left: 0, bottom: 0 }}>
            <XAxis dataKey="date" hide />
            <YAxis hide />
            <Tooltip
              formatter={(value: any) => [`${value ?? 0} mục`, ""]}
              labelFormatter={(label: string) => label}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#006B55"
              strokeWidth={2.6}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="detail-weekdays">
        {weekdayLabels.map((label) => (
          <span key={label} className={label === "Hôm nay" ? "active" : ""}>
            {label}
          </span>
        ))}
      </div>
    </div>
  );
};

const Reports: React.FC = () => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [selectedTab, setSelectedTab] = useState(timeTabs[1].label);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [report, setReport] = useState<ReportOverview | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { from, to } = useMemo(() => {
    const tabConfig = timeTabs.find((tab) => tab.label === selectedTab) || timeTabs[1];
    const today = new Date();
    const toDate = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
    const fromDate = new Date(toDate);
    fromDate.setUTCDate(fromDate.getUTCDate() - (tabConfig.days - 1));

    return {
      from: fromDate.toISOString().slice(0, 10),
      to: toDate.toISOString().slice(0, 10)
    };
  }, [selectedTab]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await fetchCategories();
        setCategories(data);
      } catch {
        setCategories([]);
      }
    };
    loadCategories();
  }, []);

  useEffect(() => {
    if (!user?.userId) {
      return;
    }

    const loadReport = async () => {
      setIsLoading(true);
      try {
        const data = await fetchReportOverview({
          from,
          to,
          userId: user.userId,
          categoryId: selectedCategoryId ?? undefined
        });
        setReport(data);
      } catch {
        setReport(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadReport();
  }, [from, selectedCategoryId, to, user?.userId]);

  const trendItems = report?.trend.items ?? [];
  const summary = report?.summary;
  const waste = report?.waste;
  const detail = report?.detail;
  const exportPdfReport = () => {
    if (!report) return;
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const left = 40;
    const right = pageWidth - 40;
    let y = 36;

    doc.setFillColor(0, 107, 85);
    doc.roundedRect(left, y, right - left, 74, 12, 12, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("BAO CAO THUC PHAM GIA DINH", left + 16, y + 30);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(`Ky bao cao: ${formatFullDate(report.from)} - ${formatFullDate(report.to)}`, left + 16, y + 50);
    doc.text(`Danh muc: ${selectedCategoryId == null ? "Tat ca" : "Da loc"}`, left + 16, y + 66);
    y += 92;

    const cardW = (right - left - 12) / 2;
    const cards = [
      { t: "Thuc pham mua vao", v: `${report.summary.purchasedCount} muc` },
      { t: "Bien dong mua vao", v: formatPercent(report.summary.changePercent) },
      { t: "Thuc pham het han", v: `${report.waste.expiredCount} muc` },
      { t: "Bien dong lang phi", v: formatPercent(report.waste.changePercent) }
    ];
    doc.setTextColor(23, 29, 26);
    cards.forEach((c, i) => {
      const row = Math.floor(i / 2);
      const col = i % 2;
      const x = left + col * (cardW + 12);
      const cy = y + row * 62;
      doc.setFillColor(245, 249, 248);
      doc.roundedRect(x, cy, cardW, 52, 10, 10, "F");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(c.t, x + 12, cy + 20);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text(c.v, x + 12, cy + 38);
    });
    y += 136;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Xu huong tieu thu", left, y);
    y += 16;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const trendRows = report.trend.items.length ? report.trend.items : [{ label: "Chua co du lieu", count: 0, percent: 0 }];
    trendRows.slice(0, 5).forEach((item, i) => {
      doc.text(`${i + 1}. ${item.label}`, left, y);
      doc.text(`${item.count} muc`, left + 250, y, { align: "right" });
      doc.text(`${Math.round(item.percent)}%`, right, y, { align: "right" });
      y += 14;
    });
    y += 12;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Chi tiet theo ngay", left, y);
    y += 14;

    const drawHeader = () => {
      doc.setFillColor(230, 255, 250);
      doc.rect(left, y, right - left, 22, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(0, 107, 85);
      doc.text("Ngay", left + 8, y + 15);
      doc.text("Mua vao", left + 180, y + 15, { align: "right" });
      doc.text("Tieu thu (USED)", left + 320, y + 15, { align: "right" });
      doc.text("Het han (EXPIRED)", right - 8, y + 15, { align: "right" });
      y += 22;
      doc.setTextColor(23, 29, 26);
      doc.setFont("helvetica", "normal");
    };
    drawHeader();

    report.detail.purchaseSeries.forEach((point, idx) => {
      if (y > 780) {
        doc.addPage();
        y = 36;
        drawHeader();
      }
      if (idx % 2 === 0) {
        doc.setFillColor(248, 250, 251);
        doc.rect(left, y, right - left, 20, "F");
      }
      doc.setFontSize(10);
      doc.text(formatFullDate(point.date), left + 8, y + 14);
      doc.text(String(point.value), left + 180, y + 14, { align: "right" });
      doc.text(String(report.detail.usedSeries[idx]?.value ?? 0), left + 320, y + 14, { align: "right" });
      doc.text(String(report.detail.expiredSeries[idx]?.value ?? 0), right - 8, y + 14, { align: "right" });
      y += 20;
    });

    doc.save(`bao-cao-thuc-pham-${report.from}-${report.to}.pdf`);
  };

  return (
    <div className="user-reports">
      <div className="user-reports-layout">
        <Sidebar />
        <div className="user-reports-page">
          <Topbar title="Báo cáo thống kê" showSearch={false} />

          <div className="user-reports-content">
            <div className="user-reports-toolbar">
              <TimeRangeTabs activeLabel={selectedTab} onSelect={setSelectedTab} />
              <div className="user-reports-actions">
                <CategorySelect
                  categories={categories}
                  selectedId={selectedCategoryId}
                  onChange={setSelectedCategoryId}
                />
                <PrimaryButton label="Xuất báo cáo" onClick={exportPdfReport} />
              </div>
            </div>

            <div className="user-reports-summary">
              <SummaryCard
                purchasedCount={summary?.purchasedCount ?? 0}
                changePercent={summary?.changePercent ?? 0}
                series={summary?.series ?? []}
              />
              <TrendCard items={trendItems} />
              <WasteCard
                expiredCount={waste?.expiredCount ?? 0}
                purchasedCount={summary?.purchasedCount ?? 0}
                changePercent={waste?.changePercent ?? 0}
                note={waste?.note ?? ""}
              />
            </div>

            <DetailChart
              purchaseSeries={detail?.purchaseSeries ?? []}
              usedSeries={detail?.usedSeries ?? []}
              expiredSeries={detail?.expiredSeries ?? []}
            />
            {isLoading && <div className="user-reports-loading">Đang tải dữ liệu...</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
