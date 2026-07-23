/**
 * components/PatchRankingTable.tsx — Light theme
 */

import React, { useState } from "react";
import { AllMetricsRow, PARAM_LABELS, WEIGHTS } from "../types";
const ChevronUp = (props: any) => null;
const ChevronDown = (props: any) => null;

interface PatchRankingTableProps {
  patches: AllMetricsRow[];
  baselineSelected: string;
}

const PARAMS = ["T", "S", "C", "H", "A", "B", "R", "X", "L", "M"] as const;

function MetricCell({ value }: { value: number }) {
  const cls =
    value >= 0.65 ? "metric-high" : value >= 0.35 ? "metric-mid" : "metric-low";
  const bg =
    value >= 0.65
      ? "bg-emerald-50"
      : value >= 0.35
        ? "bg-amber-50"
        : "bg-red-50";
  return (
    <td className={`px-2 py-3 text-center text-xs font-mono ${bg}`}>
      <span className={cls}>{value.toFixed(2)}</span>
    </td>
  );
}

export default function PatchRankingTable({
  patches,
  baselineSelected,
}: PatchRankingTableProps) {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"rank" | string>("rank");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const handleSort = (col: string) => {
    if (sortBy === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(col);
      setSortDir("desc");
    }
  };

  const sorted = [...patches].sort((a, b) => {
    const av =
      sortBy === "rank"
        ? a.rank
        : sortBy === "trustScore"
          ? a.trustScore
          : ((a as any)[sortBy] ?? 0);
    const bv =
      sortBy === "rank"
        ? b.rank
        : sortBy === "trustScore"
          ? b.trustScore
          : ((b as any)[sortBy] ?? 0);
    return sortDir === "asc" ? av - bv : bv - av;
  });

  const SortIcon = ({ col }: { col: string }) => (
    <span
      className={`ml-1 text-xs ${sortBy === col ? "text-blue-600" : "text-slate-300"}`}
    >
      {sortBy === col ? (
        sortDir === "asc" ? (
          <ChevronUp className="w-3 h-3 inline" />
        ) : (
          <ChevronDown className="w-3 h-3 inline" />
        )
      ) : (
        "⇅"
      )}
    </span>
  );

  const rankBadge = (rank: number) => {
    const style: Record<number, string> = {
      1: "bg-blue-100 text-blue-700 border-blue-300",
      2: "bg-slate-100 text-slate-600 border-slate-300",
      3: "bg-amber-50 text-amber-700 border-amber-200",
    };
    return (
      <span
        className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold border ${
          style[rank] || "bg-white text-slate-400 border-slate-200"
        }`}
      >
        {rank}
      </span>
    );
  };

  return (
    <div className="card p-5 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Patch Ranking Table
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            All 5 patches ranked by trust score — click headers to sort
          </p>
        </div>
        <div className="flex gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-blue-100 border border-blue-300" />
            TrustPatch selected
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-indigo-100 border border-indigo-300" />
            Baseline selected
          </span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th
                className="px-3 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-800 whitespace-nowrap"
                onClick={() => handleSort("rank")}
              >
                Rank <SortIcon col="rank" />
              </th>
              <th className="px-3 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                Patch
              </th>
              <th
                className="px-3 py-3 text-center text-xs font-bold text-blue-700 uppercase tracking-wider cursor-pointer hover:text-blue-900 whitespace-nowrap"
                onClick={() => handleSort("trustScore")}
              >
                Trust Score <SortIcon col="trustScore" />
              </th>
              {PARAMS.map((p) => (
                <th
                  key={p}
                  className="px-2 py-3 text-center text-xs font-bold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-700 whitespace-nowrap"
                  onClick={() => handleSort(p)}
                  title={PARAM_LABELS[p]}
                >
                  {p}{" "}
                  <span className="font-normal text-slate-300">
                    ({(WEIGHTS[p] * 100).toFixed(0)}%)
                  </span>
                  <SortIcon col={p} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sorted.map((patch) => {
              const isTrustSelected = patch.selected;
              const isBaselineSelected = patch.patchId === baselineSelected;
              const isTestGaming = (patch as any).isTestGaming;

              return (
                <tr
                  key={patch.patchId}
                  onMouseEnter={() => setHoveredRow(patch.patchId)}
                  onMouseLeave={() => setHoveredRow(null)}
                  className={`
                    transition-all duration-100 cursor-default
                    ${
                      isTrustSelected
                        ? "bg-blue-50 border-l-2 border-l-blue-500"
                        : isBaselineSelected && isTestGaming
                          ? "bg-red-50 border-l-2 border-l-red-400"
                          : isBaselineSelected
                            ? "bg-indigo-50 border-l-2 border-l-indigo-400"
                            : hoveredRow === patch.patchId
                              ? "bg-slate-50"
                              : "bg-white"
                    }
                  `}
                >
                  <td className="px-3 py-3 text-center">
                    {rankBadge(patch.rank)}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`font-bold text-sm ${
                          isTrustSelected
                            ? "text-blue-700"
                            : isBaselineSelected
                              ? "text-red-600"
                              : "text-slate-700"
                        }`}
                      >
                        {patch.patchId}
                      </span>
                      <div className="flex gap-1">
                        {isTrustSelected && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full border border-blue-200">
                            TAPR
                          </span>
                        )}
                        {isBaselineSelected && isTestGaming && (
                          <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full border border-red-200">
                            TRAP
                          </span>
                        )}
                        {isBaselineSelected && !isTestGaming && (
                          <span className="text-xs bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full border border-indigo-200">
                            BAPR
                          </span>
                        )}
                      </div>
                    </div>
                    {(patch as any).isTestGaming && (
                      <p className="text-xs text-red-500 mt-0.5">
                        Test-gaming anti-pattern
                      </p>
                    )}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span
                        className={`text-sm font-black ${isTrustSelected ? "text-blue-700" : "text-slate-700"}`}
                      >
                        {patch.trustScore.toFixed(3)}
                      </span>
                      <div className="w-14 h-1 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${isTrustSelected ? "bg-blue-500" : "bg-slate-400"}`}
                          style={{ width: `${patch.trustScore * 100}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  {PARAMS.map((p) => (
                    <MetricCell key={p} value={patch[p]} />
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-slate-400">
        <span className="flex items-center gap-1">
          <span className="text-emerald-600 font-bold">■</span> High (≥ 0.65)
        </span>
        <span className="flex items-center gap-1">
          <span className="text-amber-600 font-bold">■</span> Medium (0.35–0.65)
        </span>
        <span className="flex items-center gap-1">
          <span className="text-red-500 font-bold">■</span> Low (&lt; 0.35)
        </span>
        <span className="ml-auto">
          Weights shown in parentheses — normalized to [0,1]
        </span>
      </div>
    </div>
  );
}
