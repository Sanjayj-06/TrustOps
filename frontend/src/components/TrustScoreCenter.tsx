/**
 * TrustScoreCenter.tsx
 * ---------------------
 * Center panel of the TrustOps dashboard.
 * Designed for the Operations Portal.
 * Shows:
 *   - Large trust score display with horizontal gauge
 *   - Confidence badge and recommendation label
 *   - Full parameter contribution table (Raw vs Normalized)
 *
 * Fallback: when the explanation engine is unavailable, renders a basic
 * trust-score view using the evaluation data that is always present.
 */

import React from "react";
import type { PatchExplanation, ParameterExplanation, PatchInfo } from "../types";
import { PARAM_LABELS, WEIGHTS } from "../types";

interface TrustScoreCenterProps {
  patchExplanation: PatchExplanation | null;
  totalPatches:     number;
  /** Fallback: always-available patch data from the evaluation response */
  selectedPatch?:   PatchInfo | null;
}

const STATUS_COLORS = {
  strong:   { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  moderate: { bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200" },
  weak:     { bg: "bg-red-50",     text: "text-red-700",     border: "border-red-200" },
};

const CONFIDENCE_STYLES = {
  High:   "bg-emerald-100 text-emerald-800 border-emerald-300",
  Medium: "bg-amber-100 text-amber-800 border-amber-300",
  Low:    "bg-red-100 text-red-800 border-red-300",
};

const RECOMMENDATION_STYLES = {
  Accept: "bg-emerald-600 text-white border-emerald-700",
  Review: "bg-amber-500 text-white border-amber-600",
  Reject: "bg-red-600 text-white border-red-700",
};

/** Derive confidence from trust score (mirrors backend logic). */
function deriveConfidence(score: number): 'High' | 'Medium' | 'Low' {
  if (score >= 0.70) return 'High';
  if (score >= 0.45) return 'Medium';
  return 'Low';
}

/** Derive recommendation from trust score. */
function deriveRecommendation(score: number): 'Accept' | 'Review' | 'Reject' {
  if (score >= 0.70) return 'Accept';
  if (score >= 0.45) return 'Review';
  return 'Reject';
}

/** Derive parameter status from normalized score. */
function deriveStatus(score: number): 'strong' | 'moderate' | 'weak' {
  if (score >= 0.70) return 'strong';
  if (score >= 0.40) return 'moderate';
  return 'weak';
}

export default function TrustScoreCenter({
  patchExplanation,
  totalPatches,
  selectedPatch,
}: TrustScoreCenterProps) {

  // ── Full explanation available — rich view ──
  if (patchExplanation) {
    const { overall, parameters, trust_score, rank, patch_id } = patchExplanation;
    const pct = Math.round(trust_score * 100);

    return (
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden h-full flex flex-col">
        {/* ── Top Section: Trust Score & Horizontal Gauge ── */}
        <div className="px-6 pt-6 pb-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Trust Score</h2>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-5xl font-black text-slate-900 tabular-nums leading-none">
                    {trust_score.toFixed(3)}
                  </span>
                  <span className="text-sm font-semibold text-slate-400">/ 1.00</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded border ${CONFIDENCE_STYLES[overall.confidence]}`}>
                    {overall.confidence} Confidence
                  </span>
                  <span className={`text-xs font-bold px-3 py-1 rounded border ${RECOMMENDATION_STYLES[overall.recommendation]}`}>
                    {overall.recommendation}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Ranked <strong className="text-slate-800">#{rank}</strong> of {totalPatches} patches
                </div>
              </div>
            </div>

            {/* Horizontal Progress Bar */}
            <div className="mt-2">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 px-1">
                <span>High Risk</span>
                <span>Medium Risk</span>
                <span>Low Risk</span>
              </div>
              <div className="relative h-3 w-full rounded-full bg-slate-200 overflow-hidden flex">
                <div className="h-full bg-red-400" style={{ width: '45%' }} />
                <div className="h-full bg-amber-400" style={{ width: '25%' }} />
                <div className="h-full bg-emerald-400" style={{ width: '30%' }} />
                <div
                  className="absolute top-0 bottom-0 w-1 bg-slate-900"
                  style={{ left: `${pct}%`, transform: 'translateX(-50%)' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Parameter Contribution Table ── */}
        <div className="flex-1 overflow-auto">
          <div className="px-5 pt-4 pb-2">
            <h4 className="text-xs font-bold text-slate-600 uppercase tracking-widest">
              Parameter Contributions
            </h4>
          </div>
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-5 py-2.5 font-bold text-slate-500 uppercase tracking-wider">Parameter</th>
                <th className="px-3 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-right">Raw</th>
                <th className="px-3 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-right">Norm</th>
                <th className="px-3 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-right">Weight</th>
                <th className="px-3 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-right">Contrib</th>
                <th className="px-5 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {parameters.map((p: ParameterExplanation) => {
                const c = STATUS_COLORS[p.status];
                return (
                  <tr key={p.param} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800">{p.label}</span>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider">Metric: {p.param}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-slate-600">{p.raw_score.toFixed(3)}</td>
                    <td className="px-3 py-3 text-right font-mono text-slate-800 font-semibold">{p.normalized_score.toFixed(3)}</td>
                    <td className="px-3 py-3 text-right font-mono text-slate-500">{(p.weight * 100).toFixed(0)}%</td>
                    <td className="px-3 py-3 text-right font-mono font-bold text-blue-700">{p.contribution.toFixed(3)}</td>
                    <td className="px-5 py-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider ${c.bg} ${c.text} ${c.border}`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ── Fallback: no explanation but we have evaluation data ──
  if (selectedPatch) {
    const { trust_score, rank, patch_id, metrics } = selectedPatch;
    const pct = Math.round(trust_score * 100);
    const confidence = deriveConfidence(trust_score);
    const recommendation = deriveRecommendation(trust_score);

    // Build parameter rows from evaluation metrics
    const paramKeys = Object.keys(WEIGHTS) as (keyof typeof WEIGHTS)[];
    const paramRows = paramKeys.map((key) => {
      const value = metrics?.[key] ?? 0;
      const weight = WEIGHTS[key];
      const contribution = value * weight;
      const status = deriveStatus(value);
      return { param: key, label: PARAM_LABELS[key], value, weight, contribution, status };
    });

    return (
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden h-full flex flex-col">
        {/* ── Top Section: Trust Score & Horizontal Gauge ── */}
        <div className="px-6 pt-6 pb-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Trust Score</h2>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-5xl font-black text-slate-900 tabular-nums leading-none">
                    {trust_score.toFixed(3)}
                  </span>
                  <span className="text-sm font-semibold text-slate-400">/ 1.00</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded border ${CONFIDENCE_STYLES[confidence]}`}>
                    {confidence} Confidence
                  </span>
                  <span className={`text-xs font-bold px-3 py-1 rounded border ${RECOMMENDATION_STYLES[recommendation]}`}>
                    {recommendation}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Ranked <strong className="text-slate-800">#{rank}</strong> of {totalPatches} patches
                </div>
              </div>
            </div>

            {/* Horizontal Progress Bar */}
            <div className="mt-2">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 px-1">
                <span>High Risk</span>
                <span>Medium Risk</span>
                <span>Low Risk</span>
              </div>
              <div className="relative h-3 w-full rounded-full bg-slate-200 overflow-hidden flex">
                <div className="h-full bg-red-400" style={{ width: '45%' }} />
                <div className="h-full bg-amber-400" style={{ width: '25%' }} />
                <div className="h-full bg-emerald-400" style={{ width: '30%' }} />
                <div
                  className="absolute top-0 bottom-0 w-1 bg-slate-900"
                  style={{ left: `${pct}%`, transform: 'translateX(-50%)' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Parameter Table (from evaluation metrics) ── */}
        <div className="flex-1 overflow-auto">
          <div className="px-5 pt-4 pb-2 flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-600 uppercase tracking-widest">
              Parameter Scores
            </h4>
            <span className="text-[10px] text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              From Evaluation Data
            </span>
          </div>
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-5 py-2.5 font-bold text-slate-500 uppercase tracking-wider">Parameter</th>
                <th className="px-3 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-right">Score</th>
                <th className="px-3 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-right">Weight</th>
                <th className="px-3 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-right">Contrib</th>
                <th className="px-5 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paramRows.map((p) => {
                const c = STATUS_COLORS[p.status];
                return (
                  <tr key={p.param} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800">{p.label}</span>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider">Metric: {p.param}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-slate-800 font-semibold">{p.value.toFixed(3)}</td>
                    <td className="px-3 py-3 text-right font-mono text-slate-500">{(p.weight * 100).toFixed(0)}%</td>
                    <td className="px-3 py-3 text-right font-mono font-bold text-blue-700">{p.contribution.toFixed(3)}</td>
                    <td className="px-5 py-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider ${c.bg} ${c.text} ${c.border}`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ── Nothing selected at all (shouldn't happen) ──
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center justify-center h-full min-h-[400px]">
      <p className="text-slate-400 text-sm">Select a patch to view details</p>
    </div>
  );
}
