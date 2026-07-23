/**
 * PatchSelectorPanel.tsx
 * -----------------------
 * Left panel of the TrustOps dashboard.
 * Lists all candidate patches as clickable cards.
 */

import React from "react";
import type { PatchInfo } from "../types";

interface PatchSelectorPanelProps {
  patches:           PatchInfo[];
  selectedPatchId:   string;       // Which patch is currently inspected
  baselinePatchId:   string;       // Which BAPR selected
  onSelectPatch:     (id: string) => void;
}

const RANK_COLORS = [
  "bg-blue-600",
  "bg-indigo-500",
  "bg-slate-400",
  "bg-slate-400",
  "bg-slate-400",
];

function trustColor(score: number) {
  if (score >= 0.70) return "text-emerald-700 font-black";
  if (score >= 0.45) return "text-amber-700 font-bold";
  return "text-red-700 font-bold";
}

export default function PatchSelectorPanel({
  patches,
  selectedPatchId,
  baselinePatchId,
  onSelectPatch,
}: PatchSelectorPanelProps) {
  const sorted = [...patches].sort((a, b) => a.rank - b.rank);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex-shrink-0">
        <h3 className="text-xs font-bold text-slate-600 uppercase tracking-widest">
          Candidate Patches
        </h3>
        <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">Select to view evidence</p>
      </div>

      {/* Patch list */}
      <div className="p-4 space-y-3 overflow-y-auto flex-1">
        {sorted.map((patch, idx) => {
          const isInspected  = patch.patch_id === selectedPatchId;
          const isRecommended= patch.rank === 1;
          const isBaseline   = patch.patch_id === baselinePatchId;
          const isTestGaming = patch.is_test_gaming ?? false;
          const rankIdx      = Math.min(idx, RANK_COLORS.length - 1);

          let borderClass = "border-slate-200 hover:border-slate-300";
          let bgClass = "bg-white hover:bg-slate-50";

          if (isInspected) {
            borderClass = "border-blue-500 shadow-md ring-1 ring-blue-500";
            bgClass = "bg-blue-50/30";
          } else if (isRecommended) {
            borderClass = "border-emerald-200 hover:border-emerald-300";
          } else if (isTestGaming) {
            borderClass = "border-red-200 hover:border-red-300";
          }

          return (
            <button
              key={patch.patch_id}
              onClick={() => onSelectPatch(patch.patch_id)}
              className={`w-full text-left rounded-xl border-2 p-3 transition-all duration-150 ${borderClass} ${bgClass}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 ${RANK_COLORS[rankIdx]}`}>
                    {patch.rank}
                  </span>
                  <span className="text-sm font-bold text-slate-800">{patch.patch_id}</span>
                </div>
                <div className="flex gap-1.5 flex-wrap justify-end">
                  {isRecommended && (
                    <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200 uppercase tracking-wider">
                      Recommended
                    </span>
                  )}
                  {isInspected && !isRecommended && (
                    <span className="text-[9px] font-bold bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200 uppercase tracking-wider">
                      Inspecting
                    </span>
                  )}
                  {isTestGaming && (
                    <span className="text-[9px] font-bold bg-red-50 text-red-700 px-1.5 py-0.5 rounded border border-red-200 uppercase tracking-wider">
                      Risk
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-medium truncate pr-2">
                  {patch.strategy || `Patch Strategy Unknown`}
                </span>
                <span className={`text-sm tabular-nums ${trustColor(patch.trust_score)}`}>
                  {patch.trust_score.toFixed(3)}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
