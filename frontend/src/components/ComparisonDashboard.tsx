/**
 * components/ComparisonDashboard.tsx — Light theme
 */

import React, { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from "recharts";
import { ChartData, AllMetricsRow } from "../types";
import TrustAdvantageChart from "./TrustAdvantageChart";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

interface ComparisonDashboardProps {
  chartData: ChartData;
  baselineSelected?: string;
  trustSelected?: string;
  diverged?: boolean;
  baprTrap?: boolean;
}

const BLUE = "#2563eb";
const INDIGO = "#6366f1";
const RED = "#dc2626";
const AMBER = "#d97706";
const GREEN = "#16a34a";

const PATCH_COLORS: Record<string, string> = {
  P1: "#6366f1",
  P2: "#d97706",
  P3: "#dc2626",
  P4: "#db2777",
  P5: "#7c3aed",
};

const PIE_COLORS = [
  "#2563eb",
  "#6366f1",
  "#d97706",
  "#db2777",
  "#7c3aed",
  "#16a34a",
  "#0891b2",
  "#ea580c",
  "#a855f7",
  "#22c55e",
];

function ChartCard({
  title,
  subtitle,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`card p-5 space-y-3 ${className}`}>
      <div>
        <h4 className="text-sm font-bold text-slate-900">{title}</h4>
        {subtitle && (
          <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
        )}
      </div>
      {children}
    </div>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 shadow-lg rounded-xl px-3 py-2 text-xs space-y-1">
      <p className="font-semibold text-slate-900">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color || p.fill }}>
          {p.name}: {typeof p.value === "number" ? p.value.toFixed(3) : p.value}
        </p>
      ))}
    </div>
  );
}

export default function ComparisonDashboard({
  chartData,
  baselineSelected,
  trustSelected,
  diverged = false,
  baprTrap = false,
}: ComparisonDashboardProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "detailed">(
    "overview",
  );
  const containerRef = React.useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.from(".gsap-chart-card", {
        y: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: "power3.out",
      });
    },
    { scope: containerRef, dependencies: [activeTab] },
  );

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "detailed", label: "Detailed" },
  ] as const;

  const baprId =
    baselineSelected ||
    chartData.all_metrics_comparison.find((r) => (r as any).baselineSelected)
      ?.patchId ||
    "";
  const taprId =
    trustSelected ||
    chartData.all_metrics_comparison.find((r) => r.selected)?.patchId ||
    "";
  const allRows = chartData.all_metrics_comparison as AllMetricsRow[];

  const tickStyle = { fill: "#64748b", fontSize: 11 };

  return (
    <div ref={containerRef} className="space-y-8 animate-fade-in">
      {/* Hero section */}
      <TrustAdvantageChart
        allMetrics={allRows}
        executionTime={chartData.execution_time_comparison}
        baselineSelected={baprId}
        trustSelected={taprId}
        diverged={diverged}
        baprTrap={baprTrap}
      />

      {/* Supporting charts */}
      <div>
        <div className="flex items-center gap-4 mb-4">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-xs text-slate-400 uppercase tracking-wider">
            Supporting Analysis
          </span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        {/* Tab bar */}
        <div className="flex gap-1.5 bg-slate-100 rounded-xl p-1 w-fit mb-5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${
                activeTab === tab.id
                  ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {/* Chart 1: Test pass rate */}
            <ChartCard
              className="gsap-chart-card"
              title="Test Pass Rate"
              subtitle={
                baprTrap && baprId !== taprId
                  ? `Warning: BAPR's higher rate is deceptive — ${baprId} memorises inputs`
                  : "Pass rate of each system's selected patch"
              }
            >
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={chartData.test_success_comparison}
                  barCategoryGap="35%"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="approach"
                    tick={tickStyle}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={tickStyle}
                    domain={[0, 100]}
                    unit="%"
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="passRate"
                    name="Pass Rate (%)"
                    radius={[6, 6, 0, 0]}
                  >
                    {chartData.test_success_comparison.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Chart 2: Trust score distribution */}
            <ChartCard
              className="gsap-chart-card"
              title="Pipeline Selection Distribution"
              subtitle="Weighted 10-dimensional score across all 5 patches"
            >
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={chartData.trust_score_distribution}
                  barCategoryGap="30%"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="patchId"
                    tick={tickStyle}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={tickStyle}
                    domain={[0, 1]}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine
                    y={0.7}
                    stroke={GREEN}
                    strokeDasharray="4 4"
                    label={{ value: "Low Risk ≥0.7", fill: GREEN, fontSize: 9 }}
                  />
                  <Bar
                    dataKey="trustScore"
                    name="Trust Score"
                    radius={[6, 6, 0, 0]}
                  >
                    {chartData.trust_score_distribution.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={(entry as any).isTestGaming ? RED : entry.color}
                        fillOpacity={0.85}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Chart 3: Execution cost analysis */}
            <ChartCard
              className="gsap-chart-card"
              title="Execution Cost Analysis"
              subtitle="Works correctly on unseen inputs"
            >
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={
                    (chartData as any).behavioral_comparison ||
                    chartData.complexity_comparison
                  }
                  barCategoryGap="30%"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="patchId"
                    tick={tickStyle}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={tickStyle}
                    domain={[0, 1]}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="value"
                    name="Behavioral Score"
                    radius={[6, 6, 0, 0]}
                  >
                    {(
                      (chartData as any).behavioral_comparison ||
                      chartData.complexity_comparison
                    ).map((entry: any, i: number) => (
                      <Cell
                        key={i}
                        fill={
                          entry.isTestGaming
                            ? RED
                            : entry.selected
                              ? BLUE
                              : "#94a3b8"
                        }
                        fillOpacity={0.85}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <p className="text-xs text-slate-400 italic">
                Test-gaming patch (P3) ≈ 12% — correct only for the exact test
                inputs
              </p>
            </ChartCard>

            {/* Chart 4: Static analysis safety */}
            <ChartCard
              title="Static Analysis Safety"
              subtitle="pylint quality score — fewer warnings = higher score"
            >
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={chartData.safety_comparison}
                  barCategoryGap="30%"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="patchId"
                    tick={tickStyle}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={tickStyle}
                    domain={[0, 1]}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="value"
                    name="Safety Score"
                    radius={[6, 6, 0, 0]}
                  >
                    {chartData.safety_comparison.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={
                          (entry as any).isTestGaming
                            ? RED
                            : entry.selected
                              ? BLUE
                              : INDIGO
                        }
                        fillOpacity={0.85}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Chart 5: Code complexity */}
            <ChartCard
              title="Code Complexity"
              subtitle="Inverted cyclomatic complexity — higher = simpler code"
            >
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={chartData.complexity_comparison}
                  barCategoryGap="30%"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="patchId"
                    tick={tickStyle}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={tickStyle}
                    domain={[0, 1]}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="value"
                    name="Complexity Score"
                    radius={[6, 6, 0, 0]}
                  >
                    {chartData.complexity_comparison.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={
                          (entry as any).isTestGaming
                            ? RED
                            : entry.selected
                              ? BLUE
                              : AMBER
                        }
                        fillOpacity={0.85}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <p className="text-xs text-slate-400 italic">
                P3 scores lowest — isinstance chains, lookup dicts, nested
                ternaries
              </p>
            </ChartCard>

            {/* Chart 6: Weight distribution */}
            <ChartCard
              title="Trust Parameter Weights"
              subtitle="Expert-defined weight distribution (Σ = 1.0)"
            >
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={chartData.weight_distribution}
                    cx="50%"
                    cy="55%"
                    innerRadius={45}
                    outerRadius={75}
                    dataKey="weight"
                    nameKey="shortName"
                    paddingAngle={2}
                    label={({ shortName, weight }) => `${shortName} ${weight}%`}
                    labelLine={false}
                  >
                    {chartData.weight_distribution.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, _name: string, props: any) => [
                      `${value}%`,
                      props.payload.parameter,
                    ]}
                    contentStyle={{
                      background: "#fff",
                      border: "1px solid #e2e8f0",
                      borderRadius: 8,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        )}

        {activeTab === "detailed" && (
          <div className="space-y-5">
            {/* Extra detail card 1 */}
            <ChartCard
              className="gsap-chart-card"
              title="Top 5 Patches Ranking Analysis"
              subtitle="All 10 trust parameters across all 5 patches — P3 (red) shows the test-gaming failure"
            >
              <ResponsiveContainer width="100%" height={360}>
                <RadarChart data={chartData.radar_data}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis
                    dataKey="parameter"
                    tick={{ fill: "#64748b", fontSize: 10 }}
                  />
                  <PolarRadiusAxis
                    domain={[0, 1]}
                    tick={{ fill: "#94a3b8", fontSize: 9 }}
                  />
                  {["P1", "P2", "P3", "P4", "P5"].map((pid) => (
                    <Radar
                      key={pid}
                      name={pid}
                      dataKey={pid}
                      stroke={PATCH_COLORS[pid]}
                      fill={PATCH_COLORS[pid]}
                      fillOpacity={pid === "P3" ? 0.15 : 0.06}
                      strokeWidth={pid === "P3" ? 2.5 : 1.5}
                    />
                  ))}
                  <Legend
                    formatter={(val) => (
                      <span style={{ color: PATCH_COLORS[val], fontSize: 12 }}>
                        {val}
                        {val === "P3" ? " (test-gaming)" : ""}
                      </span>
                    )}
                  />
                  <Tooltip content={<CustomTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* All parameters grouped bar */}
            <ChartCard
              title="All Parameters per Patch"
              subtitle="Normalized [0,1] values — P3's red bars show why TrustPatch rejected it"
            >
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData.radar_data} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="parameter"
                    tick={{ fill: "#94a3b8", fontSize: 9 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#64748b", fontSize: 10 }}
                    domain={[0, 1]}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    formatter={(val) => (
                      <span
                        style={{
                          color: PATCH_COLORS[val] || "#94a3b8",
                          fontSize: 11,
                        }}
                      >
                        {val}
                        {val === "P3" ? " (BAPR Trap)" : ""}
                      </span>
                    )}
                  />
                  {["P1", "P2", "P3", "P4", "P5"].map((pid) => (
                    <Bar
                      key={pid}
                      dataKey={pid}
                      fill={PATCH_COLORS[pid]}
                      radius={[3, 3, 0, 0]}
                      fillOpacity={0.85}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        )}
      </div>
    </div>
  );
}
