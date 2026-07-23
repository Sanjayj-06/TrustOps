/**
 * TrustOpsDashboard.tsx
 * ----------------------
 * Top-level results dashboard for TrustOps Phase 1.
 * Replaces the old flat results section in App.tsx.
 *
 * Layout:
 *   1. SessionSummaryBar     (sticky top, full width)
 *   2. 3-column grid:
 *        Left:   PatchSelectorPanel    (patch list, clickable)
 *        Center: TrustScoreCenter      (score gauge + contribution table)
 *        Right:  ExplanationPanel      (structured explanation)
 *   3. (Optional) Legacy Charts Section (ComparisonDashboard, PatchRankingTable)
 *   4. HumanReviewPanel      (bottom, full width)
 *
 * State:
 *   - selectedPatchId: which patch is shown in center/right panels
 *   - explanationData: fetched from GET /trustops/explanation/{session_id}
 *
 * The explanation is fetched once when this component mounts with a session ID.
 * Patch selection only re-renders the panels; it does NOT re-fetch.
 */

import React, { useEffect, useState, useCallback } from "react";
import type {
  EvaluationResponse,
  SessionExplanationResponse,
  PatchExplanation,
} from "../types";

import SessionSummaryBar   from "./SessionSummaryBar";
import PatchSelectorPanel  from "./PatchSelectorPanel";
import TrustScoreCenter    from "./TrustScoreCenter";
import ExplanationPanel    from "./ExplanationPanel";
import HumanReviewPanel    from "./HumanReviewPanel";
import KnowledgeBasePreview from "./KnowledgeBasePreview";
import ComparisonDashboard from "./ComparisonDashboard";
import PatchRankingTable   from "./PatchRankingTable";

import { getSessionExplanation } from "../api/trustpatch";
import type { AllMetricsRow } from "../types";

interface TrustOpsDashboardProps {
  evaluation:  EvaluationResponse;
  sessionId:   string;
  filename:    string;
}

export default function TrustOpsDashboard({
  evaluation,
  sessionId,
  filename,
}: TrustOpsDashboardProps) {
  const { patches, baseline, trustpatch, chart_data, diverged, bapr_trap_triggered } = evaluation;

  // ── Patch selector state ──
  const [selectedPatchId, setSelectedPatchId] = useState<string>(trustpatch.selected_patch);

  // ── Explanation state ──
  const [explanationData, setExplanationData]   = useState<SessionExplanationResponse | null>(null);
  const [explanationLoading, setExplanationLoading] = useState(true);
  const [explanationError, setExplanationError]   = useState<string | null>(null);

  // ── Fetch structured explanations from TrustOps API ──
  useEffect(() => {
    let cancelled = false;
    setExplanationLoading(true);
    setExplanationError(null);

    getSessionExplanation(sessionId)
      .then(data => {
        if (!cancelled) {
          setExplanationData(data);
          setExplanationLoading(false);
        }
      })
      .catch(err => {
        if (!cancelled) {
          setExplanationError(
            err?.response?.data?.detail || err?.message || "Failed to load explanation."
          );
          setExplanationLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [sessionId]);

  // ── Derive selected patch explanation ──
  const selectedExplanation: PatchExplanation | null = explanationData
    ? (explanationData.patches.find(p => p.patch_id === selectedPatchId) ?? null)
    : null;

  // ── All patch IDs for override dropdown ──
  const allPatchIds = patches.map(p => p.patch_id);

  // ── Trust score for selected patch ──
  const selectedPatch = patches.find(p => p.patch_id === selectedPatchId);
  const selectedTrustScore = selectedPatch?.trust_score ?? trustpatch.trust_score;

  // ── AllMetricsRows for legacy table ──
  const baselineId = baseline.selected_patch;
  const allMetricsRows: AllMetricsRow[] = (
    chart_data.all_metrics_comparison || []
  ).map(row => ({
    ...row,
    patchId:          row.patchId,
    trustScore:       row.trustScore,
    rank:             row.rank,
    selected:         row.selected,
    baselineScore:    row.baselineScore,
    baselineSelected: row.patchId === baselineId,
    isTestGaming:     (row as any).isTestGaming,
    strategy:         (row as any).strategy,
    T: row.T, S: row.S, C: row.C, H: row.H, A: row.A,
    B: row.B, R: row.R, X: row.X, L: row.L, M: row.M,
  }));

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── 1. Session Summary Bar ── */}
      <SessionSummaryBar
        filename           = {filename}
        sessionId          = {sessionId}
        patchCount         = {patches.length}
        selectedPatch      = {trustpatch.selected_patch}
        baselinePatch      = {baseline.selected_patch}
        trustScore         = {trustpatch.trust_score}
        diverged           = {diverged}
        baprTrapTriggered  = {bapr_trap_triggered}
      />

      {/* ── 2. Explanation loading/error state ── */}
      {explanationLoading && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm px-6 py-4 flex items-center gap-3 text-sm text-slate-500">
          <span className="w-4 h-4 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin flex-shrink-0" />
          Loading structured trust explanations…
        </div>
      )}
      {explanationError && !explanationLoading && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3 text-sm text-amber-700">
          ⚠️ Explanation engine unavailable: {explanationError}.
          The dashboard will still display trust scores from the evaluation.
        </div>
      )}

      {/* ── 3. Three-column main layout ── */}
      <div className="grid grid-cols-1 xl:grid-cols-[220px_1fr_320px] gap-5" style={{ minHeight: "560px" }}>

        {/* LEFT — Patch Selector */}
        <PatchSelectorPanel
          patches          = {patches}
          selectedPatchId  = {selectedPatchId}
          baselinePatchId  = {baseline.selected_patch}
          onSelectPatch    = {setSelectedPatchId}
        />

        {/* CENTER — Trust Score + Parameter Table */}
        <TrustScoreCenter
          patchExplanation = {selectedExplanation}
          totalPatches     = {patches.length}
        />

        {/* RIGHT — Explanation Panel */}
        <ExplanationPanel
          patchExplanation = {selectedExplanation}
        />
      </div>

      {/* ── 4. Module labels ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <ModuleLabel number="3" title="Trust Explanation Engine" color="blue" />
        <ModuleLabel number="4" title="Human-in-the-Loop Decision" color="emerald" />
        <ModuleLabel number="5" title="Trust Knowledge Base" color="slate" />
      </div>

      {/* ── 5. Human Review Panel ── */}
      <HumanReviewPanel
        sessionId       = {sessionId}
        selectedPatchId = {selectedPatchId}
        taprPatchId     = {trustpatch.selected_patch}
        allPatchIds     = {allPatchIds}
        trustScore      = {selectedTrustScore}
      />

      {/* ── 5.5 Knowledge Base Preview ── */}
      <div className="pt-2">
        <KnowledgeBasePreview />
      </div>

      {/* ── 6. Legacy sections (Patch Ranking + Charts) ── */}
      <div className="pt-2">
        <SectionDivider label="Patch Ranking — All Candidates" />
        <PatchRankingTable
          patches          = {allMetricsRows}
          baselineSelected = {baseline.selected_patch}
        />
      </div>

      <div>
        <SectionDivider label="Comparison Dashboard — BAPR vs TrustOps" />
        <ComparisonDashboard
          chartData       = {chart_data}
          baselineSelected= {baseline.selected_patch}
          trustSelected   = {trustpatch.selected_patch}
          diverged        = {diverged}
          baprTrap        = {bapr_trap_triggered}
        />
      </div>
    </div>
  );
}

// ── Internal sub-components ──

function ModuleLabel({
  number, title, color,
}: {
  number: string;
  title: string;
  color: "blue" | "emerald" | "slate";
}) {
  const colors = {
    blue:    "bg-blue-50 border-blue-200 text-blue-700",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-700",
    slate:   "bg-slate-50 border-slate-200 text-slate-600",
  };
  return (
    <div className={`flex items-center gap-2.5 px-4 py-2 rounded-xl border text-xs font-semibold ${colors[color]}`}>
      <span className="font-black text-sm">{number}</span>
      <span className="opacity-30">|</span>
      <span>{title}</span>
    </div>
  );
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-4 my-4">
      <div className="flex-1 h-px bg-slate-200" />
      <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest whitespace-nowrap">
        {label}
      </span>
      <div className="flex-1 h-px bg-slate-200" />
    </div>
  );
}
