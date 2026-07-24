/**
 * HumanReviewPanel.tsx
 * ---------------------
 * Bottom section of the TrustOps dashboard — Module 4: Human-in-the-Loop.
 * 
 * Two-Step Flow:
 *   1. Agreement: "Do you agree with TrustOps' recommendation?" (Yes / No / Partially)
 *   2. Decision: Accept / Reject / Override
 *
 * Flow:
 *   Accept  → directly submits decision to POST /trustops/decision/submit
 *   Reject  → opens DecisionModal to collect reason + comment
 *   Override→ opens DecisionModal to collect reason + override patch + comment
 *
 * After a successful submission:
 *   - Shows a success confirmation card
 *   - Displays the decision made, with KB entry ID
 *   - Prevents re-submission (decisions are immutable per session in Phase 1)
 */

import React, { useState } from "react";
import DecisionModal from "./DecisionModal";
import { submitDecision } from "../api/trustpatch";
import type { DecisionResponse, HumanDecision } from "../types";

interface HumanReviewPanelProps {
  sessionId:         string;
  selectedPatchId:   string;    // The patch being reviewed
  taprPatchId:       string;    // TrustPatch recommended patch
  allPatchIds:       string[];  // All patch IDs for override dropdown
  trustScore:        number;
}

type ModalType = "reject" | "override" | null;

export default function HumanReviewPanel({
  sessionId,
  selectedPatchId,
  taprPatchId,
  allPatchIds,
  trustScore,
}: HumanReviewPanelProps) {
  const [agreement, setAgreement]       = useState<string | null>(null);
  const [modalOpen, setModalOpen]       = useState<ModalType>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted]       = useState<HumanDecision | null>(null);
  const [kbEntryId, setKbEntryId]       = useState<number | null>(null);
  const [error, setError]               = useState<string | null>(null);

  const handleAccept = async () => {
    if (!agreement) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const resp: DecisionResponse = await submitDecision({
        session_id: sessionId,
        patch_id:   selectedPatchId,
        agreement:  agreement,
        decision:   "accept",
      });
      setSubmitted({
        session_id: sessionId,
        patch_id:   selectedPatchId,
        agreement:  agreement,
        decision:   "accept",
      });
      setKbEntryId(resp.knowledge_base_entry_id);
    } catch (e: any) {
      setError(e?.response?.data?.detail || e?.message || "Submission failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalSubmit = async (
    reason: string,
    comment: string,
    overridePatchId?: string,
  ) => {
    if (!agreement) return;
    setIsSubmitting(true);
    setError(null);
    const dec = modalOpen as "reject" | "override";
    try {
      const resp: DecisionResponse = await submitDecision({
        session_id:        sessionId,
        patch_id:          selectedPatchId,
        agreement:         agreement,
        decision:          dec,
        override_patch_id: overridePatchId,
        reason,
        comment,
      });
      setSubmitted({
        session_id:        sessionId,
        patch_id:          selectedPatchId,
        agreement:         agreement,
        decision:          dec,
        override_patch_id: overridePatchId,
        reason,
        comment,
      });
      setKbEntryId(resp.knowledge_base_entry_id);
      setModalOpen(null);
    } catch (e: any) {
      setError(e?.response?.data?.detail || e?.message || "Submission failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Submitted state ──
  if (submitted) {
    const decLabel    = submitted.decision.charAt(0).toUpperCase() + submitted.decision.slice(1);
    const decColors: Record<string, string> = {
      accept:   "border-emerald-300 bg-emerald-50",
      reject:   "border-red-300 bg-red-50",
      override: "border-amber-300 bg-amber-50",
    };
    const textColors: Record<string, string> = {
      accept:   "text-emerald-700",
      reject:   "text-red-700",
      override: "text-amber-700",
    };
    const icons: Record<string, string> = {
      accept: "✓", reject: "✗", override: "↔",
    };

    return (
      <div className={`rounded-2xl border-2 p-6 ${decColors[submitted.decision]}`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold flex-shrink-0 ${textColors[submitted.decision]} bg-white border-2 border-current`}>
            {icons[submitted.decision]}
          </div>
          <div className="flex-1">
            <h3 className={`text-lg font-black ${textColors[submitted.decision]}`}>
              Decision Recorded: {decLabel}
            </h3>
            <div className="text-sm text-slate-600 mt-1 space-y-0.5">
              <p>Agreement: <strong>{submitted.agreement}</strong></p>
              <p>Patch: <strong>{submitted.patch_id}</strong>
                {submitted.override_patch_id && ` → Override to ${submitted.override_patch_id}`}
              </p>
              {submitted.reason && <p>Reason: <strong>{submitted.reason}</strong></p>}
              {submitted.comment && <p>Comment: {submitted.comment}</p>}
            </div>
          </div>
          {kbEntryId && (
            <div className="text-right flex-shrink-0">
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Knowledge Base</div>
              <div className="text-slate-700 font-bold text-sm mt-0.5">Entry #{kbEntryId} saved</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Decision buttons ──
  return (
    <>
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <span className="text-blue-700 font-bold text-sm">4</span>
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">Human-in-the-Loop Review</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Reviewing <strong>{selectedPatchId}</strong> — Trust Score:{" "}
              <strong className={
                trustScore >= 0.70 ? "text-emerald-600" :
                trustScore >= 0.45 ? "text-amber-600"   : "text-red-600"
              }>{trustScore.toFixed(3)}</strong>
            </p>
          </div>
        </div>

        {/* Step 1: Agreement */}
        <div className="mb-6">
          <p className="text-sm font-semibold text-slate-800 mb-3">
            Step 1: Do you agree with the TrustOps recommendation?
          </p>
          <div className="flex flex-wrap gap-2">
            {['Yes', 'No', 'Partially'].map((opt) => (
              <button
                key={opt}
                onClick={() => setAgreement(opt)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                  agreement === opt
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Decision (Only visible if agreement is selected) */}
        {agreement && (
          <div className="pt-5 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-300">
            <p className="text-sm font-semibold text-slate-800 mb-3">
              Step 2: Finalize your decision for the Knowledge Base
            </p>
            <div className="flex flex-wrap gap-3">
              {/* Accept */}
              <button
                onClick={handleAccept}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-700 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="text-base">✓</span>
                Accept
              </button>

              {/* Reject */}
              <button
                onClick={() => setModalOpen("reject")}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white bg-red-600 hover:bg-red-700 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="text-base">✗</span>
                Reject
              </button>

              {/* Override */}
              <button
                onClick={() => setModalOpen("override")}
                disabled={isSubmitting || allPatchIds.length < 2}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white bg-amber-500 hover:bg-amber-600 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="text-base">↔</span>
                Override
              </button>

              {isSubmitting && (
                <span className="flex items-center text-sm text-slate-500 gap-2 ml-4">
                  <span className="w-4 h-4 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin" />
                  Saving...
                </span>
              )}
            </div>
            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                <p className="font-semibold">{error}</p>
                {(error.includes('Not Found') || error.includes('404') || error.includes('Network Error')) && (
                  <p className="text-xs text-red-500 mt-1">
                    The backend may be running a stale image. Try: <code className="bg-red-100 px-1 rounded">docker compose up --build -d</code>
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Decision flow label */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-3 text-xs text-slate-400">
          <span>Decision</span>
          <span>→</span>
          <span>Trust Knowledge Base</span>
          <span>→</span>
          <span className="text-slate-300">Pattern Learner (Phase 2)</span>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <DecisionModal
          decision={modalOpen}
          patchId={selectedPatchId}
          allPatchIds={allPatchIds}
          onSubmit={handleModalSubmit}
          onCancel={() => setModalOpen(null)}
          isSubmitting={isSubmitting}
        />
      )}
    </>
  );
}
