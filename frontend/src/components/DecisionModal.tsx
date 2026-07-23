/**
 * DecisionModal.tsx
 * ------------------
 * Modal dialog for Reject and Override human decisions.
 * Displayed when a developer clicks Reject or Override in the HumanReviewPanel.
 *
 * Contains:
 *   - Decision type header (Reject / Override)
 *   - Predefined reason dropdown (6 options from architecture)
 *   - Optional free-text comment textarea
 *   - For Override: patch selector dropdown (which patch to use instead)
 *   - Cancel and Submit buttons
 */

import React, { useState } from "react";
import type { DecisionType } from "../types";
import { DECISION_REASONS } from "../types";

interface DecisionModalProps {
  decision:      "reject" | "override";
  patchId:       string;              // Currently selected patch
  allPatchIds:   string[];            // For override: other available patches
  onSubmit:      (reason: string, comment: string, overridePatchId?: string) => void;
  onCancel:      () => void;
  isSubmitting:  boolean;
}

export default function DecisionModal({
  decision,
  patchId,
  allPatchIds,
  onSubmit,
  onCancel,
  isSubmitting,
}: DecisionModalProps) {
  const [reason, setReason]                 = useState<string>("");
  const [comment, setComment]               = useState<string>("");
  const [overridePatchId, setOverridePatchId] = useState<string>(
    allPatchIds.find(id => id !== patchId) || ""
  );

  const isOverride = decision === "override";
  const canSubmit  = reason !== "" && (!isOverride || overridePatchId !== "");

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit(reason, comment, isOverride ? overridePatchId : undefined);
  };

  // Other patches for override selection
  const otherPatches = allPatchIds.filter(id => id !== patchId);

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onCancel}
    >
      {/* Modal card */}
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md mx-4 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`px-6 py-4 border-b border-slate-100 ${
          isOverride ? "bg-amber-50" : "bg-red-50"
        }`}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{isOverride ? "🔄" : "✗"}</span>
            <div>
              <h2 className="font-bold text-slate-900 text-base">
                {isOverride ? "Override Selection" : "Reject Patch"}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {isOverride
                  ? `Select a different patch to use instead of ${patchId}`
                  : `Provide a reason for rejecting ${patchId}`}
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">

          {/* Override: patch selector */}
          {isOverride && (
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Select Override Patch <span className="text-red-500">*</span>
              </label>
              <select
                value={overridePatchId}
                onChange={e => setOverridePatchId(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all"
              >
                <option value="" disabled>Choose a patch…</option>
                {otherPatches.map(id => (
                  <option key={id} value={id}>{id}</option>
                ))}
              </select>
            </div>
          )}

          {/* Reason dropdown */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Reason <span className="text-red-500">*</span>
            </label>
            <select
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all"
            >
              <option value="" disabled>Select a reason…</option>
              {DECISION_REASONS.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Comment textarea */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Additional Comments <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={3}
              placeholder="Describe the specific issue you identified…"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 bg-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            className={`px-5 py-2 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              isOverride
                ? "bg-amber-500 hover:bg-amber-600"
                : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {isSubmitting
              ? "Submitting…"
              : isOverride ? "Confirm Override" : "Confirm Rejection"
            }
          </button>
        </div>
      </div>
    </div>
  );
}
