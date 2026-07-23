/**
 * components/TrustPatchResults.tsx — Light theme
 */

import React, { useState } from "react";
import { TrustPatchResult, ExplanationData, PARAM_LABELS } from "../types";
import { CheckCircle } from "lucide-react";
const Code2 = (props: any) => null;
const ChevronDown = (props: any) => null;
const ChevronUp = (props: any) => null;
const Shield = (props: any) => null;
const Brain = (props: any) => null;
const XCircle = (props: any) => null;
const AlertTriangle = (props: any) => null;

import gsap from "gsap";
import { useGSAP } from "@gsap/react";

interface TrustPatchResultsProps {
  result: TrustPatchResult;
  explanation: ExplanationData;
}

function TrustGauge({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color =
    score >= 0.7 ? "#16a34a" : score >= 0.45 ? "#d97706" : "#dc2626";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-28 h-14 overflow-hidden">
        <svg viewBox="0 0 120 60" className="w-full h-full">
          <path
            d="M 10 60 A 50 50 0 0 1 110 60"
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="10"
            strokeLinecap="round"
          />
          <path
            d="M 10 60 A 50 50 0 0 1 110 60"
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${score * 157} 157`}
          />
          <line
            x1="60"
            y1="60"
            x2={60 + 36 * Math.cos(Math.PI * (1 - score))}
            y2={60 - 36 * Math.sin(Math.PI * (1 - score))}
            stroke="#334155"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="60" cy="60" r="3.5" fill="#334155" />
        </svg>
      </div>
      <div className="text-center">
        <p className="text-3xl font-black" style={{ color }}>
          {pct}%
        </p>
        <p className="text-xs text-slate-400">Trust Score</p>
      </div>
    </div>
  );
}

export default function TrustPatchResults({
  result,
  explanation,
}: TrustPatchResultsProps) {
  const [showCode, setShowCode] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.from(".gsap-tapr-card", {
        y: 20,
        opacity: 0,
        duration: 0.5,
        stagger: 0.1,
        ease: "power2.out",
      });
    },
    { scope: containerRef },
  );

  const riskStyle = {
    Low: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Medium: "bg-amber-50 text-amber-700 border-amber-200",
    High: "bg-red-50 text-red-600 border-red-200",
  };

  const recStyle = {
    Accept: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Review: "bg-amber-50 text-amber-700 border-amber-200",
    Reject: "bg-red-50 text-red-600 border-red-200",
  };

  return (
    <div
      ref={containerRef}
      className="p-6 space-y-5 animate-slide-up rounded-2xl border-2 border-blue-200 bg-white shadow-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              TrustPatch Result
            </h3>
            <p className="text-xs text-slate-400">
              10-dimensional trust-aware selection
            </p>
          </div>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full font-semibold border bg-blue-50 text-blue-700 border-blue-200">
          TAPR
        </span>
      </div>

      {/* Main metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="stat-card flex flex-col items-center gap-3 gsap-tapr-card">
          <TrustGauge score={result.trust_score} />
          <div className="flex gap-2">
            <span
              className={`score-badge border text-xs ${riskStyle[result.risk]}`}
            >
              {result.risk === "Low" ? (
                <CheckCircle className="w-3 h-3" />
              ) : result.risk === "Medium" ? (
                <AlertTriangle className="w-3 h-3" />
              ) : (
                <XCircle className="w-3 h-3" />
              )}
              {result.risk} Risk
            </span>
            <span
              className={`score-badge border text-xs ${recStyle[result.recommendation]}`}
            >
              {result.recommendation === "Accept" ? (
                <CheckCircle className="w-3 h-3" />
              ) : result.recommendation === "Review" ? (
                <AlertTriangle className="w-3 h-3" />
              ) : (
                <XCircle className="w-3 h-3" />
              )}
              {result.recommendation}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="stat-card gsap-tapr-card">
            <p className="text-xs text-slate-400 mb-1">Selected Patch</p>
            <p className="text-2xl font-black gradient-text-trust">
              {result.selected_patch}
            </p>
            <p className="text-xs text-slate-400 mt-1">Highest trust score</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="stat-card text-center gsap-tapr-card">
              <p className="text-xs text-slate-400">Tests</p>
              <p className="text-base font-bold text-slate-900">
                {result.passed_tests}/{result.total_tests}
              </p>
            </div>
            <div className="stat-card text-center gsap-tapr-card">
              <p className="text-xs text-slate-400">Time</p>
              <p className="text-base font-bold text-slate-900 font-mono">
                {result.execution_time.toFixed(2)}s
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Top factors */}
      <div className="gsap-tapr-card">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
          <Brain className="w-3.5 h-3.5" />
          Top Contributing Trust Factors
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {result.top_factors.slice(0, 3).map((param, i) => (
            <div
              key={param}
              className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center"
            >
              <div className="text-xs font-bold text-slate-400 mb-0.5">
                #{i + 1}
              </div>
              <p className="text-sm font-black text-blue-700">{param}</p>
              <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                {PARAM_LABELS[param as keyof typeof PARAM_LABELS] || param}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Trust formula */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 gsap-tapr-card">
        <p className="text-xs text-blue-600 font-semibold mb-1.5">
          Trust Formula Applied
        </p>
        <p className="text-sm text-blue-800 font-mono">
          Trust({result.selected_patch}) = Σ(w<sub>j</sub> × f<sub>j</sub>) ={" "}
          <strong className="text-blue-900 font-black">
            {result.trust_score.toFixed(4)}
          </strong>
        </p>
      </div>

      {/* Advantages */}
      <div className="gsap-tapr-card">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Advantages over BAPR
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {[
            "Considers code complexity",
            "Security static analysis",
            "Behavioral verification",
            "Historical success data",
            "Regression risk analysis",
            "LLM confidence scoring",
          ].map((l) => (
            <div
              key={l}
              className="flex items-center gap-2 text-xs text-emerald-700"
            >
              <CheckCircle className="w-3 h-3 text-emerald-500 flex-shrink-0" />
              {l}
            </div>
          ))}
        </div>
      </div>

      {/* Code toggle */}
      <div className="gsap-tapr-card">
        <button
          onClick={() => setShowCode(!showCode)}
          className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-600 transition-colors"
        >
          <Code2 className="w-4 h-4" />
          {showCode ? "Hide" : "View"} selected patch code
          {showCode ? (
            <ChevronUp className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )}
        </button>
      </div>

      {showCode && (
        <pre className="code-block text-xs max-h-48 overflow-auto animate-fade-in">
          {result.patch_code}
        </pre>
      )}
    </div>
  );
}
