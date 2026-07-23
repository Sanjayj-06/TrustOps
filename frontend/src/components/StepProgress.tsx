/**
 * components/StepProgress.tsx — Light theme
 */

import React from "react";
import { CheckCircle } from "lucide-react";
const Circle = (props: any) => null;
const Loader = (props: any) => null;
const XCircle = (props: any) => null;

import { PipelineStep, StepStatus } from "../types";

interface StepProgressProps {
  steps: PipelineStep[];
  title?: string;
  color?: "teal" | "indigo";
}

function StatusIcon({ status }: { status: StepStatus }) {
  switch (status) {
    case "done":
      return <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />;
    case "running":
      return (
        <Loader className="w-4 h-4 text-blue-600 flex-shrink-0 animate-spin" />
      );
    case "error":
      return <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />;
    default:
      return <Circle className="w-4 h-4 text-slate-300 flex-shrink-0" />;
  }
}

export default function StepProgress({
  steps,
  title = "Pipeline Progress",
}: StepProgressProps) {
  const doneCount = steps.filter((s) => s.status === "done").length;
  const total = steps.length;
  const progressPct = total > 0 ? (doneCount / total) * 100 : 0;

  return (
    <div className="card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-slate-800">{title}</h4>
        <span className="text-xs font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
          {doneCount}/{total}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-600 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Steps */}
      <div className="space-y-1.5">
        {steps.map((step) => (
          <div key={step.id} className={`step-indicator-${step.status}`}>
            <StatusIcon status={step.status} />
            <div className="flex-1 min-w-0">
              <p
                className={`text-xs font-medium leading-tight ${
                  step.status === "done"
                    ? "text-emerald-700"
                    : step.status === "running"
                      ? "text-blue-700"
                      : step.status === "error"
                        ? "text-red-600"
                        : "text-slate-400"
                }`}
              >
                {step.label}
              </p>
              {step.status === "running" && (
                <p className="text-xs text-slate-400 mt-0.5">
                  {step.description}
                </p>
              )}
            </div>
            {step.status === "running" && (
              <div className="flex gap-0.5">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1 h-1 rounded-full bg-blue-400"
                    style={{
                      animationDelay: `${i * 0.15}s`,
                      animation: "bounce 0.8s infinite",
                    }}
                  />
                ))}
              </div>
            )}
            {step.duration && step.status === "done" && (
              <span className="text-xs text-slate-400 font-mono flex-shrink-0">
                {step.duration.toFixed(2)}s
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export const TRUSTPATCH_STEPS: PipelineStep[] = [
  {
    id: "upload",
    label: "Files Uploaded",
    description: "Buggy code and tests received",
    status: "pending",
  },
  {
    id: "generate",
    label: "Generating 5 Patches",
    description: "P1–P5 from rule-based transformations",
    status: "pending",
  },
  {
    id: "test",
    label: "Running Unit Tests",
    description: "Pytest executed on each patch",
    status: "pending",
  },
  {
    id: "features",
    label: "Extracting Features",
    description: "Computing raw parameter values",
    status: "pending",
  },
  {
    id: "normalize",
    label: "Normalizing Parameters",
    description: "Min-max scaling to [0, 1]",
    status: "pending",
  },
  {
    id: "trust",
    label: "Computing Trust Scores",
    description: "Weighted sum: Trust(P) = Σ(wⱼ × fⱼ)",
    status: "pending",
  },
  {
    id: "rank",
    label: "Ranking Patches",
    description: "Sorting P1–P5 by trust score",
    status: "pending",
  },
  {
    id: "explain",
    label: "Generating Explanation",
    description: "Identifying top contributing factors",
    status: "pending",
  },
  {
    id: "done",
    label: "Evaluation Complete",
    description: "Results ready for display",
    status: "pending",
  },
];
