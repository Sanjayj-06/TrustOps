/**
 * ExplanationPanel.tsx
 * ---------------------
 * Right panel of the TrustOps dashboard.
 * Designed for Evidence-Based Explanations.
 * 
 * Shows:
 *   - Overall Summary
 *   - Recommendation
 *   - Key Strengths
 *   - Potential Risks
 *   - Parameter-wise Evidence (Expandable)
 */

import React, { useState } from "react";
import type { PatchExplanation, ParameterExplanation } from "../types";

interface ExplanationPanelProps {
  patchExplanation: PatchExplanation | null;
}

const STATUS_ICONS = {
  strong:   { icon: "✓", color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  moderate: { icon: "~", color: "text-amber-600 bg-amber-50 border-amber-200" },
  weak:     { icon: "✗", color: "text-red-600 bg-red-50 border-red-200" },
};

export default function ExplanationPanel({ patchExplanation }: ExplanationPanelProps) {
  const [expandedParam, setExpandedParam] = useState<string | null>(null);

  if (!patchExplanation) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center justify-center h-full min-h-[400px]">
        <p className="text-slate-400 text-sm font-medium">Select a patch to view evidence</p>
      </div>
    );
  }

  const { overall, parameters, patch_id } = patchExplanation;

  const toggleParam = (param: string) =>
    setExpandedParam(prev => (prev === param ? null : param));

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden h-full flex flex-col">

      {/* ── Header ── */}
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex-shrink-0 flex justify-between items-center">
        <h3 className="text-xs font-bold text-slate-600 uppercase tracking-widest">
          Evidence Log — {patch_id}
        </h3>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
          overall.recommendation === 'Accept' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
          overall.recommendation === 'Review' ? 'bg-amber-100 text-amber-800 border-amber-300' :
          'bg-red-100 text-red-800 border-red-300'
        }`}>
          {overall.recommendation}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">

        {/* ── Overall Summary ── */}
        <div>
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
            Overall Evaluation
          </h4>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <p className="text-sm text-slate-700 leading-relaxed font-medium">
              {overall.summary}
            </p>
          </div>
        </div>

        {/* ── Key Strengths & Potential Risks (Side by Side) ── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          
          {/* Key Strengths */}
          <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4">
            <h4 className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <span>✓</span> Key Strengths
            </h4>
            {overall.key_strengths && overall.key_strengths.length > 0 && overall.key_strengths[0] !== "No parameters reached the strong threshold." ? (
              <ul className="space-y-2">
                {overall.key_strengths.map((s, i) => (
                  <li key={i} className="text-xs text-emerald-800 font-medium leading-snug pl-2 border-l-2 border-emerald-300">
                    {s}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-emerald-600/70 italic">None highlighted.</p>
            )}
          </div>

          {/* Potential Risks */}
          <div className="bg-red-50/50 border border-red-100 rounded-xl p-4">
            <h4 className="text-[10px] font-bold text-red-600 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <span>✗</span> Potential Risks
            </h4>
            {overall.potential_risks && overall.potential_risks.length > 0 && overall.potential_risks[0] !== "No critical risks identified." ? (
              <ul className="space-y-2">
                {overall.potential_risks.map((r, i) => (
                  <li key={i} className="text-xs text-red-800 font-medium leading-snug pl-2 border-l-2 border-red-300">
                    {r}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-red-600/70 italic">No critical risks identified.</p>
            )}
          </div>

        </div>

        {/* ── Per-Parameter Evidence Log ── */}
        <div>
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
            Detailed Parameter Evidence
          </h4>
          <div className="space-y-2">
            {parameters.map((p: ParameterExplanation) => {
              const style = STATUS_ICONS[p.status];
              const isOpen = expandedParam === p.param;

              return (
                <div
                  key={p.param}
                  className="border border-slate-200 rounded-xl overflow-hidden transition-all"
                >
                  {/* Collapsed row */}
                  <button
                    onClick={() => toggleParam(p.param)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${isOpen ? 'bg-slate-50' : 'bg-white hover:bg-slate-50/50'}`}
                  >
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 border ${style.color}`}>
                      {style.icon}
                    </span>
                    <span className="w-6 text-[11px] font-black text-slate-400 flex-shrink-0">{p.param}</span>
                    <span className="flex-1 text-sm font-bold text-slate-700">{p.label}</span>
                    
                    {/* Status Text (only shown when closed for cleanliness, or always) */}
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${style.color}`}>
                      {p.status}
                    </span>

                    <span className={`text-slate-400 text-xs flex-shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>
                      ▾
                    </span>
                  </button>

                  {/* Expanded Evidence */}
                  {isOpen && (
                    <div className="px-4 pb-4 pt-2 bg-slate-50 border-t border-slate-100">
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* Left: Reason */}
                        <div>
                          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Reason</div>
                          <p className="text-xs text-slate-700 font-medium leading-relaxed">{p.short_reason}</p>
                        </div>
                        
                        {/* Right: Example / Evidence */}
                        <div>
                          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Evidence / Data</div>
                          <p className="text-xs text-slate-600 leading-relaxed bg-white border border-slate-200 p-2 rounded-lg">
                            {p.example}
                          </p>
                        </div>

                      </div>

                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
