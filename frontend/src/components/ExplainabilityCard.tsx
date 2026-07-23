/**
 * components/ExplainabilityCard.tsx — Light theme
 */

import React, { useState } from "react";
import { ExplanationData, PARAM_LABELS } from "../types";
import { CheckCircle } from "lucide-react";
const Brain = (props: any) => null;
const ChevronDown = (props: any) => null;
const ChevronUp = (props: any) => null;
const Code2 = (props: any) => null;
const ArrowLeftRight = (props: any) => null;

interface ExplainabilityCardProps {
  explanation: ExplanationData;
  comparisonSummary: string;
  trustScore: number;
  selectedPatch: string;
}

// Utility to strip emojis if they are returned by a cached backend response
const cleanText = (text: string) => {
  return text
    .replace(
      /[\u{1F300}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}\u{1F1E6}-\u{1F1FF}←]/gu,
      "",
    )
    .trim();
};

export default function ExplainabilityCard({
  explanation,
  comparisonSummary,
  trustScore,
  selectedPatch,
}: ExplainabilityCardProps) {
  const [showApi, setShowApi] = useState(false);
  const [showComparison, setShowComparison] = useState(true);

  const apiResponse = {
    trust_score: trustScore,
    risk: explanation.risk_level,
    recommendation: explanation.recommendation,
    explanation: explanation.summary,
    top_factors: explanation.top_factors,
  };

  const riskStyle: Record<string, string> = {
    Low: "text-emerald-700",
    Medium: "text-amber-700",
    High: "text-red-600",
  };

  return (
    <div className="card p-6 space-y-5 animate-slide-up">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Explainability Engine
          </h3>
          <p className="text-xs text-slate-500">
            Algorithmic Decision Rationale
          </p>
        </div>
        <div className="ml-auto">
          <span
            className={`text-sm font-semibold ${riskStyle[explanation.risk_level] || "text-slate-600"}`}
          >
            {explanation.risk_level} Risk
          </span>
        </div>
      </div>

      {/* Summary Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-sm text-blue-800 font-medium leading-relaxed">
          {cleanText(explanation.summary)}
        </p>
      </div>

      {/* Reasons */}
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
          Evaluation Matrix ({selectedPatch})
        </p>
        <div className="space-y-2">
          {explanation.bullets.map((bullet, i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl animate-fade-in"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-slate-700">{cleanText(bullet)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Parameter impact */}
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
          Parameter Influence Distribution
        </p>
        <div className="space-y-2">
          {Object.entries(explanation.parameter_impact)
            .slice(0, 5)
            .map(([param, contribution]) => {
              const label =
                PARAM_LABELS[param as keyof typeof PARAM_LABELS] || param;
              const maxContrib = 0.2;
              const barWidth = Math.min((contribution / maxContrib) * 100, 100);
              return (
                <div key={param} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-slate-700">
                      {param}
                    </span>
                    <span className="text-slate-400">{label}</span>
                    <span className="text-blue-600 font-mono font-semibold">
                      {(contribution * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Comparison toggle */}
      <div>
        <button
          onClick={() => setShowComparison(!showComparison)}
          className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-700 transition-colors mb-2"
        >
          <ArrowLeftRight className="w-3 h-3" />
          BAPR vs TrustPatch Comparison
          {showComparison ? (
            <ChevronUp className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )}
        </button>
        {showComparison && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-600 leading-relaxed whitespace-pre-line animate-fade-in">
            {cleanText(comparisonSummary)}
          </div>
        )}
      </div>

      {/* API response */}
      <div>
        <button
          onClick={() => setShowApi(!showApi)}
          className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-600 transition-colors"
        >
          <Code2 className="w-4 h-4" />
          API Response Preview (POST /trustpatch/evaluate)
          {showApi ? (
            <ChevronUp className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )}
        </button>
        {showApi && (
          <pre className="code-block text-xs mt-2 animate-fade-in">
            {JSON.stringify(apiResponse, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
