/**
 * components/BAPRFailureAlert.tsx — Light theme
 * The centrepiece showcase component shown when TrustPatch catches the test-gaming trap.
 */

import React, { useState, useEffect } from "react";
import { CheckCircle } from "lucide-react";
const AlertTriangle = (props: any) => null;
const Shield = (props: any) => null;
const ChevronDown = (props: any) => null;
const ChevronUp = (props: any) => null;
const XCircle = (props: any) => null;
const BarChart2 = (props: any) => null;
const GitBranch = (props: any) => null;
const ShieldAlert = (props: any) => null;
const Bot = (props: any) => null;

import { ExplanationData } from "../types";

interface BAPRFailureAlertProps {
  explanation: ExplanationData;
  baprPatchId: string;
  taprPatchId: string;
  baprPassRate: number;
  taprTrustScore: number;
  rejectedTrustScore?: number;
}

function AnimatedScore({ target, color }: { target: number; color: string }) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const steps = 40;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current = Math.min(current + increment, target);
      setValue(Math.round(current * 1000) / 1000);
      if (current >= target) clearInterval(timer);
    }, 30);
    return () => clearInterval(timer);
  }, [target]);
  return (
    <span className="font-black tabular-nums" style={{ color }}>
      {value.toFixed(3)}
    </span>
  );
}

export default function BAPRFailureAlert({
  explanation,
  baprPatchId,
  taprPatchId,
  baprPassRate,
  taprTrustScore,
  rejectedTrustScore,
}: BAPRFailureAlertProps) {
  const [expanded, setExpanded] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const baprPct = Math.round(baprPassRate * 100);

  return (
    <div className="animate-slide-up mt-8 mb-8">
      <div className="rounded-xl border border-slate-300 bg-white shadow-sm overflow-hidden">
        {/* Minimal Academic Header */}
        <div className="bg-white px-6 py-4 border-b border-slate-200">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <ShieldAlert className="w-6 h-6 text-red-600 flex-shrink-0" />
              <div>
                <h3 className="text-xl font-serif font-bold text-slate-900 tracking-tight">
                  Critical Finding: Baseline System Test-Gaming
                </h3>
                <p className="text-sm text-slate-600 mt-1 font-medium">
                  TrustPatch successfully identified and rejected a patch that memorizes tests but fails on generalized data.
                </p>
              </div>
            </div>
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-slate-400 hover:text-slate-700 transition-colors flex-shrink-0"
            >
              {expanded ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {expanded && (
          <div className="p-5 space-y-5">
            {/* Score comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* BAPR */}
              <div className="bg-white border border-slate-200 rounded-lg p-6 text-center">
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Baseline Selection
                </p>
                <p className="text-4xl font-black text-slate-800 my-4">
                  {baprPatchId}
                </p>
                <div className="space-y-1 mb-6">
                  <p className="text-base font-medium text-slate-700">
                    <span className="text-red-700 font-bold">{baprPct}%</span> test pass rate
                  </p>
                  <p className="text-sm font-medium text-slate-500">
                    Trust score:{" "}
                    {rejectedTrustScore !== undefined ? (
                      <AnimatedScore target={rejectedTrustScore} color="#64748b" />
                    ) : (
                      "—"
                    )}
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 text-red-700 border-t border-red-200 pt-4 w-full justify-center font-semibold">
                  <XCircle className="w-4 h-4" />
                  Test-Gaming Patch Detected
                </div>
              </div>

              {/* TrustPatch */}
              <div className="bg-blue-50/30 border border-blue-200 rounded-lg p-6 text-center">
                <p className="text-sm font-semibold text-blue-800 uppercase tracking-wider mb-2">
                  TrustPatch Selection
                </p>
                <p className="text-4xl font-black text-blue-800 my-4">
                  {taprPatchId}
                </p>
                <div className="space-y-1 mb-6">
                  <p className="text-base font-bold text-slate-800">
                    Trust score: <AnimatedScore target={taprTrustScore} color="#1e40af" />
                  </p>
                  <p className="text-sm font-medium text-slate-500">
                    vs. {rejectedTrustScore !== undefined ? rejectedTrustScore.toFixed(3) : "—"} for {baprPatchId}
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 text-blue-700 border-t border-blue-200 pt-4 w-full justify-center font-semibold">
                  <CheckCircle className="w-4 h-4" />
                  Genuine Algorithm Fix
                </div>
              </div>
            </div>

            {/* Why dangerous */}
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                Why {baprPatchId} is Dangerous — What BAPR Missed
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  {
                    param: "B",
                    label: "Behavioral Consistency",
                    icon: BarChart2,
                    score: explanation.parameter_impact["B"]
                      ? explanation.parameter_impact["B"] / 0.1
                      : 0.12,
                    critical: true,
                    desc: "Fails on ANY input not in the hardcoded table",
                  },
                  {
                    param: "C",
                    label: "Code Complexity",
                    icon: GitBranch,
                    score: explanation.parameter_impact["C"]
                      ? explanation.parameter_impact["C"] / 0.1
                      : 0.12,
                    critical: true,
                    desc: "Dict lookups, isinstance chains, nested ternaries",
                  },
                  {
                    param: "A",
                    label: "Static Analysis",
                    icon: ShieldAlert,
                    score: explanation.parameter_impact["A"]
                      ? explanation.parameter_impact["A"] / 0.1
                      : 0.15,
                    critical: true,
                    desc: "pylint flags magic numbers, dead code, overcomplexity",
                  },
                  {
                    param: "L",
                    label: "LLM Confidence",
                    icon: Bot,
                    score: explanation.parameter_impact["L"]
                      ? explanation.parameter_impact["L"] / 0.1
                      : 0.18,
                    critical: false,
                    desc: "Any LLM would flag hardcoded overrides as anti-pattern",
                  },
                ].map(({ param, label, icon: Icon, score, desc, critical }) => (
                  <div
                    key={param}
                    className={`flex items-start gap-3 p-3 rounded-xl border ${
                      critical
                        ? "bg-red-50 border-red-200"
                        : "bg-amber-50 border-amber-200"
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 flex-shrink-0 mt-0.5 ${critical ? "text-red-500" : "text-amber-600"}`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-xs font-bold ${critical ? "text-red-700" : "text-amber-700"}`}
                        >
                          {label}
                        </span>
                        <span
                          className={`text-xs font-mono font-bold ${critical ? "text-red-600" : "text-amber-600"}`}
                        >
                          {Math.round(score * 100)}%
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 bg-white rounded-full overflow-hidden border border-slate-200">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ${critical ? "bg-red-500" : "bg-amber-500"}`}
                          style={{ width: `${score * 100}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Key message */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Shield className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-slate-900 mb-1">
                    Why This Matters
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    In production, {baprPatchId}'s lookup table would silently
                    return wrong answers for any input not in the developer's
                    test suite. BAPR would ship this as "100% passing."
                    TrustPatch's 10-dimensional analysis caught it through{" "}
                    <span className="text-blue-700 font-semibold">
                      behavioral consistency
                    </span>
                    ,{" "}
                    <span className="text-blue-700 font-semibold">
                      static analysis
                    </span>
                    , and{" "}
                    <span className="text-blue-700 font-semibold">
                      LLM confidence
                    </span>{" "}
                    checks.
                  </p>
                </div>
              </div>
            </div>

            {/* Full trap reason */}
            {explanation.bapr_trap_reason && (
              <div>
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors"
                >
                  {showDetails ? (
                    <ChevronUp className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                  Full technical explanation
                </button>
                {showDetails && (
                  <div className="mt-2 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600 leading-relaxed animate-fade-in">
                    {explanation.bapr_trap_reason}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
