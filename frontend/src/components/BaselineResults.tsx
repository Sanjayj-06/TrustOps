/**
 * components/BaselineResults.tsx — Light theme
 */

import React, { useState } from "react";
import { BaselineResult } from "../types";
const Code2 = (props: any) => null;
const ChevronDown = (props: any) => null;
const ChevronUp = (props: any) => null;
const AlertTriangle = (props: any) => null;
const FlaskConical = (props: any) => null;
const XCircle = (props: any) => null;

import gsap from "gsap";
import { useGSAP } from "@gsap/react";

interface BaselineResultsProps {
  result: BaselineResult;
}

export default function BaselineResults({ result }: BaselineResultsProps) {
  const [showCode, setShowCode] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const passPercent = Math.round((result.pass_rate ?? 0) * 100);
  const isTrap = (result as any).is_test_gaming_patch;

  useGSAP(
    () => {
      gsap.from(".gsap-stat-card", {
        y: 20,
        opacity: 0,
        duration: 0.5,
        stagger: 0.1,
        ease: "power2.out",
      });
    },
    { scope: containerRef },
  );

  return (
    <div
      ref={containerRef}
      className={`p-6 space-y-5 animate-slide-up rounded-2xl border bg-white shadow-sm ${
        isTrap ? "border-red-200" : "border-indigo-200"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Baseline APR</h3>
            <p className="text-xs text-slate-400">
              Traditional test-pass-rate selection
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {isTrap && (
            <span className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded-full border border-red-200 font-semibold">
              TRAPPED
            </span>
          )}
          <span
            className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
              isTrap
                ? "bg-red-50 text-red-600 border-red-200"
                : "bg-indigo-50 text-indigo-700 border-indigo-200"
            }`}
          >
            BAPR
          </span>
        </div>
      </div>

      {/* Test-gaming warning */}
      {isTrap && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
          <p className="text-sm text-red-700 font-semibold">
            BAPR selected a test-gaming patch
          </p>
          <p className="text-xs text-red-500 mt-1">
            {result.selected_patch} passes {passPercent}% of tests by memorising
            test inputs — not by fixing the actual bug.
          </p>
        </div>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="stat-card gsap-stat-card">
          <p className="text-xs text-slate-400 mb-1">Selected Patch</p>
          <p className="text-2xl font-black gradient-text-baseline">
            {result.selected_patch}
          </p>
          <p className="text-xs text-slate-400 mt-1">Highest pass rate</p>
        </div>
        <div className="stat-card gsap-stat-card">
          <p className="text-xs text-slate-400 mb-1">Tests Passed</p>
          <p className="text-2xl font-black text-slate-900">
            {result.passed_tests}
            <span className="text-sm text-slate-400">
              /{result.total_tests}
            </span>
          </p>
          <div className="mt-2">
            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
                style={{ width: `${passPercent}%` }}
              />
            </div>
            <p className="text-xs text-indigo-600 mt-1 font-mono">
              {passPercent}%
            </p>
          </div>
        </div>
        <div className="stat-card gsap-stat-card">
          <p className="text-xs text-slate-400 mb-1">Execution Time</p>
          <p className="text-2xl font-black text-slate-900 font-mono">
            {result.execution_time.toFixed(2)}
          </p>
          <p className="text-xs text-slate-400 mt-1">seconds</p>
        </div>
      </div>

      {/* Selection criterion */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 gsap-stat-card">
        <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">
          Selection Criterion
        </p>
        <div className="flex items-center gap-2 flex-wrap text-sm">
          <span className="text-slate-600">Selected</span>
          <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-mono text-sm border border-indigo-200">
            {result.selected_patch}
          </span>
          <span className="text-slate-600">with highest test pass rate</span>
          <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-mono text-sm">
            {passPercent}%
          </span>
        </div>
        <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          No code quality, security, or complexity analysis performed.
        </p>
      </div>

      {/* Limitations */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Limitations
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {[
            "Ignores code complexity",
            "No security analysis",
            "No behavioral verification",
            "No historical context",
            "No regression analysis",
            "No LLM confidence check",
          ].map((l) => (
            <div
              key={l}
              className="flex items-center gap-2 text-xs text-slate-500"
            >
              <XCircle className="w-3 h-3 text-red-400 flex-shrink-0" />
              {l}
            </div>
          ))}
        </div>
      </div>

      {/* Code toggle */}
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

      {showCode && (
        <pre className="code-block text-xs max-h-48 overflow-auto animate-fade-in">
          {result.patch_code}
        </pre>
      )}
    </div>
  );
}
