/**
 * components/TrustAdvantageChart.tsx — Light theme
 * Hero chart — BAPR-selected vs TrustPatch-selected patch
 * across all 10 trust dimensions.
 */

import React, { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Cell,
} from "recharts";
import { AllMetricsRow, ExecutionTimeChartData } from "../types";
import { CheckCircle } from "lucide-react";
const BarChart2 = (props: any) => null;
const Scale = (props: any) => null;
const AlertTriangle = (props: any) => null;
const Zap = (props: any) => null;
const Lightbulb = (props: any) => null;

import gsap from "gsap";
import { useGSAP } from "@gsap/react";

interface TrustAdvantageChartProps {
  allMetrics: AllMetricsRow[];
  executionTime: ExecutionTimeChartData[];
  baselineSelected: string;
  trustSelected: string;
  diverged: boolean;
  baprTrap: boolean;
}

const PARAM_LABELS: Record<string, string> = {
  T: "Test Pass Rate",
  S: "Semantic Sim.",
  C: "Complexity",
  H: "Historical",
  A: "Static Analysis",
  B: "Behavioral",
  R: "Regression",
  X: "Contextual",
  L: "LLM Confidence",
  M: "Multi-Patch",
};
const PARAMS = ["T", "S", "C", "H", "A", "B", "R", "X", "L", "M"];

const QualityTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 shadow-lg rounded-xl p-3 text-xs">
      <p className="font-bold text-slate-900 mb-2">
        {PARAM_LABELS[label] || label}
      </p>
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex justify-between gap-4">
          <span style={{ color: entry.color }}>{entry.name}</span>
          <span className="font-mono text-slate-900">
            {(entry.value * 100).toFixed(1)}%
          </span>
        </div>
      ))}
    </div>
  );
};

export default function TrustAdvantageChart({
  allMetrics,
  executionTime,
  baselineSelected,
  trustSelected,
  diverged,
  baprTrap,
}: TrustAdvantageChartProps) {
  const [chartMode, setChartMode] = useState<"bar" | "radar">("bar");
  const containerRef = React.useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.from(".gsap-animate-up", {
        y: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: "power3.out",
      });
    },
    { scope: containerRef },
  );

  const baprPatch = allMetrics.find((r) => r.patchId === baselineSelected);
  const taprPatch = allMetrics.find((r) => r.patchId === trustSelected);
  if (!baprPatch || !taprPatch) return null;

  const qualityData = PARAMS.map((param) => ({
    param,
    BAPR: (baprPatch[param as keyof AllMetricsRow] as number) ?? 0,
    TAPR: (taprPatch[param as keyof AllMetricsRow] as number) ?? 0,
  }));

  const radarData = PARAMS.map((param) => ({
    subject: param,
    BAPR: Math.round(
      ((baprPatch[param as keyof AllMetricsRow] as number) ?? 0) * 100,
    ),
    TAPR: Math.round(
      ((taprPatch[param as keyof AllMetricsRow] as number) ?? 0) * 100,
    ),
  }));

  const baprTime =
    executionTime.find((e) => e.approach.includes("BAPR"))?.time ?? 0;
  const taprTime =
    executionTime.find((e) => e.approach.includes("Trust"))?.time ?? 0;
  const extraSecs = Math.max(0, taprTime - baprTime);
  const baprAvg =
    PARAMS.reduce(
      (s, p) => s + ((baprPatch[p as keyof AllMetricsRow] as number) ?? 0),
      0,
    ) / PARAMS.length;
  const taprAvg =
    PARAMS.reduce(
      (s, p) => s + ((taprPatch[p as keyof AllMetricsRow] as number) ?? 0),
      0,
    ) / PARAMS.length;
  const qualityGain = ((taprAvg - baprAvg) * 100).toFixed(1);

  const baprFailedDims = PARAMS.filter(
    (p) => ((baprPatch[p as keyof AllMetricsRow] as number) ?? 0) < 0.35,
  );

  const tickStyle = { fill: "#64748b", fontSize: 10 };

  return (
    <div ref={containerRef} className="space-y-5">
      {/* Hero quality profile card */}
      <div className="card p-6 gsap-animate-up">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <span className="inline-flex items-center gap-1.5 tag-blue text-xs mb-3">
              TrustPatch Superiority Analysis
            </span>
            <h3 className="text-xl font-bold text-slate-900">
              Quality Profile: BAPR ({baselineSelected}) vs TrustPatch (
              {trustSelected})
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              {baprTrap && diverged
                ? `BAPR selected ${baselineSelected} (test-gaming patch) — it scores under 20% on 6 of 10 dimensions. TrustPatch selected ${trustSelected} — consistently high across all 10.`
                : `Side-by-side quality profile across all 10 trust dimensions.`}
            </p>
          </div>
        </div>

        {/* Stat boxes */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <StatBox
            label="BAPR Coverage"
            value="1 / 10"
            sub="criteria checked"
            color="red"
            iconType="bar"
          />
          <StatBox
            label="TrustPatch Coverage"
            value="10 / 10"
            sub="criteria checked"
            color="blue"
            iconType="bar"
          />
          <StatBox
            label={`BAPR Quality`}
            value={`${(baprAvg * 100).toFixed(0)}%`}
            sub={`avg, ${baselineSelected}`}
            color={baprAvg < 0.5 ? "red" : "slate"}
            iconType="scale"
          />
          <StatBox
            label={`TrustPatch Quality`}
            value={`${(taprAvg * 100).toFixed(0)}%`}
            sub={`avg, ${trustSelected}`}
            color="blue"
            iconType="check"
          />
        </div>

        {/* Chart toggle */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs text-slate-400">View:</span>
          {(["bar", "radar"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setChartMode(mode)}
              className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${
                chartMode === mode
                  ? "bg-blue-50 border-blue-300 text-blue-700"
                  : "border-slate-200 text-slate-500 hover:border-slate-300 bg-white"
              }`}
            >
              {mode === "bar" ? "Bar Chart" : "Radar Chart"}
            </button>
          ))}
        </div>

        {/* Chart */}
        {chartMode === "bar" ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={qualityData} barCategoryGap="20%" barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="param"
                  tick={tickStyle}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 1]}
                  tickFormatter={(v) => `${Math.round(v * 100)}%`}
                  tick={tickStyle}
                  axisLine={false}
                  tickLine={false}
                  width={38}
                />
                <Tooltip content={<QualityTooltip />} />
                <Legend
                  formatter={(value) => (
                    <span
                      className="text-xs"
                      style={{
                        color:
                          value === "BAPR"
                            ? baprTrap
                              ? "#dc2626"
                              : "#6366f1"
                            : "#2563eb",
                      }}
                    >
                      {value === "BAPR"
                        ? `BAPR \u2192 ${baselineSelected}${baprTrap ? " (test-gaming)" : ""}`
                        : `TrustPatch \u2192 ${trustSelected}`}
                    </span>
                  )}
                />
                <Bar dataKey="BAPR" name="BAPR" radius={[4, 4, 0, 0]}>
                  {qualityData.map((entry) => (
                    <Cell
                      key={entry.param}
                      fill={
                        baprTrap && entry.BAPR < 0.35
                          ? "#dc2626"
                          : baprTrap
                            ? "#f97316"
                            : "#6366f1"
                      }
                      fillOpacity={baprTrap && entry.BAPR < 0.35 ? 1 : 0.75}
                    />
                  ))}
                </Bar>
                <Bar dataKey="TAPR" name="TrustPatch" radius={[4, 4, 0, 0]}>
                  {qualityData.map((entry) => (
                    <Cell key={entry.param} fill="#2563eb" fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: "#64748b", fontSize: 11 }}
                />
                <PolarRadiusAxis
                  domain={[0, 100]}
                  tick={{ fill: "#94a3b8", fontSize: 9 }}
                />
                <Radar
                  name={`BAPR \u2192 ${baselineSelected}`}
                  dataKey="BAPR"
                  stroke={baprTrap ? "#dc2626" : "#6366f1"}
                  fill={baprTrap ? "#dc2626" : "#6366f1"}
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
                <Radar
                  name={`TrustPatch \u2192 ${trustSelected}`}
                  dataKey="TAPR"
                  stroke="#2563eb"
                  fill="#2563eb"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
                <Legend />
                <Tooltip formatter={(v: any) => `${v}%`} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Failed dimensions */}
        {baprTrap && baprFailedDims.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2 items-center">
            <span className="text-xs text-slate-500">
              {baselineSelected} fails on:
            </span>
            {baprFailedDims.map((p) => (
              <span
                key={p}
                className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full border border-red-200"
              >
                {PARAM_LABELS[p] || p}
              </span>
            ))}
            <span className="text-xs text-slate-400">
              ({baprFailedDims.length}/{PARAMS.length} dimensions)
            </span>
          </div>
        )}
      </div>

      {/* Execution time reframe */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-1">
          <Zap className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-bold text-slate-900">
            Analysis Depth vs Execution Time
          </span>
          <span className="text-xs text-slate-400">
            — extra time = extra safety
          </span>
        </div>
        <p className="text-xs text-slate-500 mb-5">
          TrustPatch takes more time because it does{" "}
          <strong className="text-slate-800">10×</strong> more analysis. The
          question isn't "which is faster?" — it's "is the extra analysis worth
          it?"
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* BAPR */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">
              BAPR
            </p>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-2xl font-black text-slate-900">
                {baprTime.toFixed(2)}s
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-3">Total pipeline time</p>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Dimensions checked</span>
                <span className="font-bold text-red-500">1 of 10</span>
              </div>
              <div className="h-1.5 bg-slate-200 rounded-full">
                <div
                  className="h-full bg-indigo-400 rounded-full"
                  style={{ width: "10%" }}
                />
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Quality score</span>
                <span className="font-bold text-red-500">
                  {(baprAvg * 100).toFixed(0)}%
                </span>
              </div>
              <div className="h-1.5 bg-slate-200 rounded-full">
                <div
                  className="h-full bg-red-500 rounded-full"
                  style={{ width: `${baprAvg * 100}%` }}
                />
              </div>
            </div>
            {baprTrap && (
              <div className="mt-3 flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-lg p-2">
                <AlertTriangle className="w-3 h-3 text-red-500" />
                <p className="text-xs text-red-600">
                  Selected test-gaming patch
                </p>
              </div>
            )}
          </div>

          {/* Versus column */}
          <div className="flex flex-col items-center justify-center gap-4 py-2">
            <div className="text-center">
              <p className="text-xs text-slate-400 mb-1">Extra time</p>
              <p className="text-2xl font-black text-slate-900">
                +{extraSecs.toFixed(2)}s
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-400 mb-1">Quality gained</p>
              <p
                className={`text-2xl font-black ${parseFloat(qualityGain) > 0 ? "text-blue-600" : "text-slate-400"}`}
              >
                +{qualityGain}%
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-center">
              <p className="text-xs text-blue-700 font-bold">ROI</p>
              <p className="text-xs text-slate-600 mt-0.5">
                {extraSecs > 0
                  ? `${(parseFloat(qualityGain) / extraSecs).toFixed(0)}% quality/sec`
                  : "Instant"}
              </p>
            </div>
          </div>

          {/* TrustPatch */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-2">
              TrustPatch
            </p>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-2xl font-black text-slate-900">
                {taprTime.toFixed(2)}s
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-3">Total pipeline time</p>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Dimensions checked</span>
                <span className="font-bold text-blue-600">10 of 10</span>
              </div>
              <div className="h-1.5 bg-blue-100 rounded-full">
                <div className="h-full bg-blue-600 rounded-full w-full" />
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Quality score</span>
                <span className="font-bold text-blue-600">
                  {(taprAvg * 100).toFixed(0)}%
                </span>
              </div>
              <div className="h-1.5 bg-blue-100 rounded-full">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${taprAvg * 100}%` }}
                />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-lg p-2">
              <CheckCircle className="w-3 h-3 text-emerald-600" />
              <p className="text-xs text-emerald-700">Selected genuine fix</p>
            </div>
          </div>
        </div>

        {/* Key insight */}
        <div className="mt-4 bg-slate-50 border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <p className="text-sm font-bold text-slate-900">
              Why execution time is not a disadvantage
            </p>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            BAPR's speed comes from{" "}
            <span className="text-red-600 font-semibold">
              checking only 1 of 10 quality dimensions
            </span>
            . TrustPatch's extra {extraSecs.toFixed(2)}s evaluates 9 additional
            dimensions — and in this case,
            {baprTrap ? (
              <span className="text-blue-700 font-semibold">
                {" "}
                those 9 dimensions revealed that BAPR's choice was a test-gaming
                patch that would fail on any real-world input. The extra time
                prevented a dangerous patch from shipping.
              </span>
            ) : (
              <span className="text-blue-700 font-semibold">
                {" "}
                produced a quantified, auditable trust score that you can
                present to stakeholders — not just a binary "tests pass"
                verdict.
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Coverage comparison */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 gsap-animate-up">
        <CoverageCard
          title="BAPR Criteria"
          count={1}
          total={10}
          color="red"
          criteria={["Test Pass Rate"]}
          missing={[
            "Semantic Similarity",
            "Code Complexity",
            "Historical Success",
            "Static Analysis",
            "Behavioral Consistency",
            "Regression Risk",
            "Contextual Importance",
            "LLM Confidence",
            "Multi-Patch Consensus",
          ]}
        />
        <CoverageCard
          title="TrustPatch Criteria"
          count={10}
          total={10}
          color="blue"
          criteria={[
            "Test Pass Rate",
            "Semantic Similarity",
            "Code Complexity",
            "Historical Success",
            "Static Analysis",
            "Behavioral Consistency",
            "Regression Risk",
            "Contextual Importance",
            "LLM Confidence",
            "Multi-Patch Consensus",
          ]}
          missing={[]}
        />
      </div>
    </div>
  );
}

// ── Helper components ───────────────────────────────────────────

function StatBox({
  label,
  value,
  sub,
  color,
  iconType,
}: {
  label: string;
  value: string;
  sub: string;
  color: "red" | "blue" | "slate";
  iconType: "bar" | "scale" | "check";
}) {
  const styles = {
    red: "bg-red-50 border-red-200 text-red-600",
    blue: "bg-blue-50 border-blue-200 text-blue-700",
    slate: "bg-slate-100 border-slate-300 text-slate-600",
  };
  const iconColor =
    color === "blue"
      ? "text-blue-600"
      : color === "red"
        ? "text-red-500"
        : "text-slate-500";
  return (
    <div className={`rounded-xl p-3 border text-center ${styles[color]}`}>
      <div className="flex justify-center mb-1.5">
        {iconType === "bar" && <BarChart2 className={`w-4 h-4 ${iconColor}`} />}
        {iconType === "scale" && <Scale className={`w-4 h-4 ${iconColor}`} />}
        {iconType === "check" && (
          <CheckCircle className={`w-4 h-4 ${iconColor}`} />
        )}
      </div>
      <p className="text-xl font-black text-slate-900">{value}</p>
      <p className="text-xs font-semibold mt-0.5">{label}</p>
      <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
    </div>
  );
}

function CoverageCard({
  title,
  count,
  total,
  color,
  criteria,
  missing,
}: {
  title: string;
  count: number;
  total: number;
  color: "red" | "blue";
  criteria: string[];
  missing: string[];
}) {
  const isGood = color === "blue";
  return (
    <div
      className={`rounded-xl p-4 border ${
        isGood ? "bg-blue-50 border-blue-200" : "bg-red-50 border-red-200"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <p
          className={`text-sm font-bold ${isGood ? "text-blue-700" : "text-red-600"}`}
        >
          {title}
        </p>
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-bold border ${
            isGood
              ? "bg-blue-100 text-blue-700 border-blue-300"
              : "bg-red-100 text-red-600 border-red-300"
          }`}
        >
          {count}/{total} dimensions
        </span>
      </div>
      <div className="space-y-1.5">
        {criteria.map((c) => (
          <div
            key={c}
            className="flex items-center gap-1.5 text-xs text-slate-700"
          >
            <CheckCircle className="w-3 h-3 text-emerald-500 flex-shrink-0" />{" "}
            {c}
          </div>
        ))}
        {missing.map((c) => (
          <div
            key={c}
            className="flex items-center gap-1.5 text-xs text-slate-400 line-through opacity-60"
          >
            <span className="w-3 h-3 rounded-full border border-slate-300 flex-shrink-0" />{" "}
            {c}
          </div>
        ))}
      </div>
    </div>
  );
}
