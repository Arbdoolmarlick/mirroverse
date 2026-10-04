import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { performanceData } from "@/lib/mirro-data";

const tooltipStyle = {
  backgroundColor: "var(--bg)",
  borderColor: "var(--border)",
  color: "var(--text-primary)",
  borderRadius: "4px",
  fontFamily: "DM Mono",
  fontSize: "11px",
  padding: "4px 8px",
  boxShadow: "none",
};

export function PerformanceChart({ range = "30D" }: { range?: "7D" | "30D" | "90D" }) {
  const points = range === "7D" ? performanceData.slice(0, 7) : performanceData;

  return (
    <div className="h-[180px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <XAxis
            dataKey="day"
            tick={{ fontFamily: "DM Mono", fontSize: 10, fill: "var(--text-muted)" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[6, 13]}
            tickFormatter={(v) => `${v}%`}
            tick={{ fontFamily: "DM Mono", fontSize: 10, fill: "var(--text-muted)" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value: unknown, name: unknown) => [
              `${value}%`,
              String(name) === "farmer" ? "Farmer APY" : "Baseline",
            ]}
          />
          <Area
            type="monotone"
            dataKey="farmer"
            name="farmer"
            stroke="var(--accent)"
            strokeWidth={1.5}
            fill="transparent"
          />
          <Area
            type="monotone"
            dataKey="baseline"
            name="baseline"
            stroke="var(--border)"
            strokeWidth={1}
            strokeDasharray="4 4"
            fill="transparent"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PortfolioChart({
  range = "30D",
  currentValue,
}: {
  range?: "1D" | "7D" | "30D" | "All";
  currentValue?: number;
}) {
  if (currentValue === undefined || currentValue === null || currentValue <= 0) {
    return (
      <div className="h-[140px] w-full flex flex-col items-center justify-center text-center font-mono text-xs text-ink-faint border border-dashed border-line-soft rounded-lg bg-canvas/30">
        <span>No performance history to display yet.</span>
        <span className="text-[11px] text-ink-soft mt-1">
          Deposit into a pool or mirror a farmer to track yield compounding.
        </span>
      </div>
    );
  }

  const val = currentValue;
  const numDays = range === "1D" ? 24 : range === "7D" ? 7 : range === "30D" ? 30 : 60;
  const points = Array.from({ length: numDays }, (_, i) => {
    const fraction = i / (numDays - 1 || 1);
    const growth = (fraction - 1) * (val * 0.02);
    return {
      day: range === "1D" ? `${i}h` : i + 1,
      value: +(val + growth).toFixed(2),
    };
  });

  const minVal = Math.floor(Math.min(...points.map((p) => p.value)) * 0.98);
  const maxVal = Math.ceil(Math.max(...points.map((p) => p.value)) * 1.02);

  return (
    <div className="h-[140px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
          <XAxis
            dataKey="day"
            tick={{ fontFamily: "DM Mono", fontSize: 10, fill: "var(--text-muted)" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[minVal, maxVal]}
            tickFormatter={(v) => `$${v >= 1000 ? (v / 1000).toFixed(1) + "k" : v.toFixed(0)}`}
            tick={{ fontFamily: "DM Mono", fontSize: 10, fill: "var(--text-muted)" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(v: unknown) => [
              `$${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              "Portfolio Value",
            ]}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="var(--accent)"
            strokeWidth={1.5}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
