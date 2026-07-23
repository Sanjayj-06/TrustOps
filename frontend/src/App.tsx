/**
 * App.tsx
 * --------
 * Main TrustPatch application component — Light theme edition.
 */

import React, { useState, useCallback, useRef, useEffect } from "react";
// forcing a hot reload
import UploadSection from "./components/UploadSection";
import PipelineVisualizer from "./components/PipelineVisualizer";
import StepProgress, { TRUSTPATCH_STEPS } from "./components/StepProgress";
import BaselineResults from "./components/BaselineResults";
import TrustPatchResults from "./components/TrustPatchResults";
import PatchRankingTable from "./components/PatchRankingTable";
import ComparisonDashboard from "./components/ComparisonDashboard";
import ExplainabilityCard from "./components/ExplainabilityCard";
import BAPRFailureAlert from "./components/BAPRFailureAlert";
import AboutSection from "./components/AboutSection";
import ArchitectureSection from "./components/ArchitectureSection";

import psgLogo from "./Images/psgtech.png";
import yrsLogo from "./Images/75yrs.png";
import aiConsortiumLogo from "./Images/aiconsortium.jpg";
import tplogo from "./Images/TP1.png";
import { uploadFiles, evaluateTrustPatch, checkHealth, getVisitorCount } from "./api/trustpatch";
import {
  AppState,
  PipelineStep,
  StepStatus,
  EvaluationResponse,
  AllMetricsRow,
} from "./types";
import { CheckCircle2 } from "lucide-react";
const Activity = (props: { className?: string }) => null;
const BarChart3 = (props: { className?: string }) => null;
const Brain = (props: { className?: string }) => null;
const Shield = (props: { className?: string }) => null;
const Table2 = (props: { className?: string }) => null;
const Upload = (props: { className?: string }) => null;
const Wifi = (props: { className?: string }) => null;
const WifiOff = (props: { className?: string }) => null;
const AlertCircle = (props: { className?: string }) => null;
const TrendingUp = (props: { className?: string }) => null;
const Info = (props: { className?: string }) => null;
// ============================================================
// Constants
// ============================================================

const NAV_SECTIONS = [
  { id: "about", label: "About", icon: Info },
  { id: "architecture", label: "Workflow", icon: Info },
  { id: "upload", label: "Upload", icon: Upload },
  { id: "pipeline", label: "Pipeline", icon: Activity },
  { id: "results", label: "Results", icon: Shield },
  { id: "ranking", label: "Ranking", icon: Table2 },
  { id: "charts", label: "Charts", icon: BarChart3 },
  { id: "explain", label: "Explain", icon: Brain },
] as const;

const STEP_DELAY = 800;

// ============================================================
// Utilities
// ============================================================

function updateStep(
  steps: PipelineStep[],
  id: string,
  status: StepStatus,
  duration?: number,
): PipelineStep[] {
  return steps.map((s) => (s.id === id ? { ...s, status, duration } : s));
}

// ============================================================
// App Component
// ============================================================

export default function App() {
  const [state, setState] = useState<AppState>({
    phase: "upload",
    sessionId: null,
    filename: null,
    testFilename: null,
    evaluation: null,
    error: null,
  });

  const [pipelineSteps, setPipelineSteps] = useState<PipelineStep[]>(
    TRUSTPATCH_STEPS.map((s) => ({ ...s })),
  );
  const [currentPipelineStep, setCurrentPipelineStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [activeSection, setActiveSection] = useState("upload");
  const [visitorCount, setVisitorCount] = useState<number | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    checkHealth().then((ok) => setBackendOnline(ok));
    getVisitorCount().then(c => setVisitorCount(c)).catch(e => console.error(e));
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { threshold: 0.3 },
    );
    Object.values(sectionRefs.current).forEach((el) => {
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [state.phase]);

  const scrollTo = (id: string) => {
    sectionRefs.current[id]?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const animateStep = useCallback((stepId: string, stepIndex: number) => {
    return new Promise<void>((resolve) => {
      setPipelineSteps((prev) => updateStep(prev, stepId, "running"));
      setCurrentPipelineStep(stepIndex);
      setTimeout(() => {
        setPipelineSteps((prev) =>
          updateStep(prev, stepId, "done", Math.random() * 0.5 + 0.1),
        );
        resolve();
      }, STEP_DELAY);
    });
  }, []);

  const handleUpload = useCallback(
    async (buggyFile: File, testFile: File) => {
      setIsLoading(true);
      setState((prev) => ({ ...prev, error: null, phase: "processing" }));
      setPipelineSteps(
        TRUSTPATCH_STEPS.map((s) => ({ ...s, status: "pending" })),
      );
      setCurrentPipelineStep(0);
      
      // Auto-scroll down to the pipeline view
      setTimeout(() => scrollTo("pipeline"), 100);

      try {
        await animateStep("upload", 0);
        const uploadResp = await uploadFiles(buggyFile, testFile);
        const sessionId = uploadResp.session_id;

        setState((prev) => ({
          ...prev,
          sessionId,
          filename: uploadResp.filename,
          testFilename: uploadResp.test_filename,
        }));

        // Start the backend evaluation concurrently with the UI animation
        const evalPromise = evaluateTrustPatch(sessionId);

        const stepIds = [
          "generate",
          "test",
          "features",
          "normalize",
          "trust",
          "rank",
          "explain",
        ];
        for (let i = 0; i < stepIds.length; i++) {
          animateStep(stepIds[i], i + 1);
          // Wait for each step to animate smoothly
          await new Promise((r) => setTimeout(r, STEP_DELAY));
        }

        // Wait for the backend response if it's still processing
        const evalResult: EvaluationResponse = await evalPromise;

        setPipelineSteps((prev) =>
          prev.map((s) => ({ ...s, status: "done" as StepStatus })),
        );
        setCurrentPipelineStep(10);

        setState((prev) => ({
          ...prev,
          phase: "results",
          evaluation: evalResult,
        }));

        setTimeout(() => scrollTo("results"), 300);
      } catch (err: any) {
        const errMsg =
          err?.response?.data?.detail || err?.message || "Evaluation failed";
        setState((prev) => ({ ...prev, error: errMsg, phase: "upload" }));
        setPipelineSteps((prev) =>
          prev.map((s) =>
            s.status === "running"
              ? { ...s, status: "error" as StepStatus }
              : s,
          ),
        );
      } finally {
        setIsLoading(false);
      }
    },
    [animateStep],
  );

  const baselineId = state.evaluation?.baseline.selected_patch;
  const allMetricsRows: AllMetricsRow[] = (
    state.evaluation?.chart_data.all_metrics_comparison || []
  ).map((row) => ({
    ...row,
    patchId: row.patchId,
    trustScore: row.trustScore,
    rank: row.rank,
    selected: row.selected,
    baselineScore: row.baselineScore,
    baselineSelected: row.patchId === baselineId,
    isTestGaming: (row as any).isTestGaming,
    strategy: (row as any).strategy,
    T: row.T,
    S: row.S,
    C: row.C,
    H: row.H,
    A: row.A,
    B: row.B,
    R: row.R,
    X: row.X,
    L: row.L,
    M: row.M,
  }));

  const eval_ = state.evaluation;

  return (
    <div className="min-h-screen bg-dot-grid">
      {/* ── HEADER ── */}
      <header className="sticky top-0 z-50 bg-white/95 border-b border-slate-200 backdrop-blur-sm shadow-sm">
        <div className="max-w-7xl mx-auto px-5 py-3 flex flex-col md:flex-row items-center justify-between gap-3 md:gap-0">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img
              src={tplogo}
              alt="TrustPatch Logo"
              className="w-10 h-10 object-contain"
            />
            <div>
              <h1 className="text-sm font-bold text-slate-900 leading-none">
                TrustPatch
              </h1>
              <p className="text-[11px] text-slate-400 leading-none mt-0.5">
                Trust-Aware APR Framework
              </p>
            </div>
          </div>

          {/* Nav tabs */}
          <nav className={`flex items-center ${state.phase !== "results" ? "justify-center" : "justify-start"} gap-1 bg-slate-100 rounded-xl p-1 overflow-x-auto w-full md:w-auto mt-3 md:mt-0 hide-scrollbar no-scrollbar scroll-smooth`}>
            {NAV_SECTIONS.map(({ id, label, icon: Icon }) => {
              if (
                state.phase !== "results" &&
                id !== "about" &&
                id !== "architecture" &&
                id !== "upload"
              )
                return null;
              return (
                <button
                  key={id}
                  onClick={() => scrollTo(id)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${activeSection === id
                      ? "bg-white text-blue-700 shadow-sm border border-slate-200"
                      : "text-slate-500 hover:text-slate-700"
                    }`}
                >
                  <Icon className="w-3 h-3" />
                  {label}
                </button>
              );
            })}
          </nav>

          {/* Status Indicator */}
          <div className="flex-shrink-0 text-xs font-medium">
            {backendOnline === null ? (
              <span className="text-slate-400 flex items-center gap-1.5">
                <Wifi className="w-3.5 h-3.5" /> Checking connection...
              </span>
            ) : backendOnline ? (
              <span className="text-emerald-600 flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                System Online
              </span>
            ) : (
              <span className="text-red-500 flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                System Offline
              </span>
            )}
          </div>
        </div>
      </header>

      {/* ── HERO BANNER ── */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-5 pt-8 pb-6 flex flex-col items-center text-center">
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 mb-2 w-full">
            
            {/* Mobile: All 4 Logos in one row */}
            <div className="flex md:hidden items-center justify-center gap-3 w-full px-2">
              <img src={psgLogo} alt="PSG Tech" className="h-12 sm:h-14 w-auto object-contain" />
              <img src={yrsLogo} alt="75 Years" className="h-12 sm:h-14 w-auto object-contain" />
              <img src={aiConsortiumLogo} alt="AI Consortium" className="h-14 sm:h-16 w-auto object-contain rounded-md" />
              <img src={tplogo} alt="Trust Patch" className="h-14 sm:h-16 w-auto object-contain" />
            </div>

            {/* Desktop: Left Logos */}
            <div className="hidden md:flex items-center justify-end gap-6 border-r border-slate-200 pr-12 flex-1">
              <img src={psgLogo} alt="PSG Tech" className="h-24 w-auto object-contain" />
              <img src={yrsLogo} alt="75 Years" className="h-24 w-auto object-contain" />
            </div>

            {/* Title */}
            <div className="flex-shrink-0 text-center mt-2 md:mt-0">
              <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight uppercase">
                TRUST <span className="text-blue-600">PATCH</span>
              </h1>
            </div>

            {/* Desktop: Right Logos */}
            <div className="hidden md:flex items-center justify-start gap-6 border-l border-slate-200 pl-12 flex-1">
              <img src={aiConsortiumLogo} alt="AI Consortium" className="h-32 w-auto object-contain rounded-lg" />
              <img src={tplogo} alt="Trust Patch" className="h-32 w-auto object-contain" />
            </div>
          </div>
          <div className="mt-2 space-y-3 px-4">
            <p className="text-slate-700 max-w-5xl text-xl font-medium mx-auto">
              Trust-Aware and Explainable Self-Healing Framework for Reliable
              Software Systems
            </p>
            <p className="text-slate-500 max-w-5xl text-sm mx-auto uppercase tracking-widest font-semibold">
              Baseline APR & Trust-Aware APR System Comparison — Research
              Prototype
            </p>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <main className="max-w-7xl mx-auto px-5 pt-4 pb-10 space-y-10">
        {/* About Section */}
        <div
          ref={(el) => {
            sectionRefs.current["about"] = el;
          }}
        >
          <AboutSection />
        </div>

        {/* Architecture Section */}
        <div
          id="architecture"
          ref={(el) => {
            sectionRefs.current["architecture"] = el;
          }}
        >
          <ArchitectureSection />
        </div>
        {/* Transition to Interactive Tool */}
        <div className="text-center py-8">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            See TrustPatch in Action
          </h2>
          <p className="text-slate-600 mt-3 max-w-2xl mx-auto font-medium leading-relaxed">
            Now that you understand the underlying architecture and trust evaluation pipeline, try it out yourself! Upload a patch file below to see how TrustPatch seamlessly detects test-gaming and recommends reliable fixes in real time.
          </p>
        </div>

        {/* Upload Section */}
        <section
          id="upload"
          ref={(el) => {
            sectionRefs.current["upload"] = el;
          }}
        >
          <UploadSection onUpload={handleUpload} isLoading={isLoading} />
        </section>

        {/* Error Display */}
        {state.error && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">{state.error}</p>
              {!backendOnline && (
                <p className="mt-1 text-xs text-red-500">
                  Ensure the Docker backend is running:{" "}
                  <code className="bg-red-100 px-1 rounded">
                    docker-compose up
                  </code>
                </p>
              )}
            </div>
          </div>
        )}

        {/* Pipeline Section */}
        {(state.phase === "processing" || state.phase === "results") && (
          <section
            id="pipeline"
            ref={(el) => {
              sectionRefs.current["pipeline"] = el;
            }}
            className="space-y-6"
          >
            <SectionHeader
              icon={<Activity className="w-4 h-4 text-blue-600" />}
              title="Pipeline Execution"
            />
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2">
                <PipelineVisualizer
                  currentStep={currentPipelineStep}
                  isRunning={isLoading}
                />
              </div>
              <div>
                <StepProgress
                  steps={pipelineSteps}
                  title="TrustPatch Progress"
                  color="teal"
                />
              </div>
            </div>
          </section>
        )}

        {/* Results Phase */}
        {state.phase === "results" && eval_ && (
          <>
            {/* Results Comparison */}
            <section
              id="results"
              ref={(el) => {
                sectionRefs.current["results"] = el;
              }}
              className="space-y-6"
            >
              <SectionHeader
                icon={<Shield className="w-4 h-4 text-blue-600" />}
                title="Results Comparison"
                subtitle="BAPR vs TrustPatch — side-by-side pipeline outputs"
              />
              {eval_.bapr_trap_triggered && (
                <BAPRFailureAlert
                  explanation={eval_.explanation}
                  baprPatchId={eval_.baseline.selected_patch}
                  taprPatchId={eval_.trustpatch.selected_patch}
                  baprPassRate={eval_.baseline.pass_rate}
                  taprTrustScore={eval_.trustpatch.trust_score}
                  rejectedTrustScore={eval_.explanation.rejected_trust_score}
                />
              )}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <BaselineResults result={eval_.baseline as any} />
                <TrustPatchResults
                  result={eval_.trustpatch as any}
                  explanation={eval_.explanation}
                />
              </div>
              <WinnerBanner
                baseline={eval_.baseline.selected_patch}
                trustpatch={eval_.trustpatch.selected_patch}
                trustScore={eval_.trustpatch.trust_score}
                agreed={
                  eval_.baseline.selected_patch ===
                  eval_.trustpatch.selected_patch
                }
                baprTrap={eval_.bapr_trap_triggered}
                baprPassRate={eval_.baseline.pass_rate}
              />
            </section>

            {/* Patch Ranking */}
            <section
              id="ranking"
              ref={(el) => {
                sectionRefs.current["ranking"] = el;
              }}
              className="space-y-4"
            >
              <SectionHeader
                icon={<Table2 className="w-4 h-4 text-blue-600" />}
                title="Patch Ranking"
                subtitle="All candidates evaluated across 10 trust dimensions"
              />
              <PatchRankingTable
                patches={allMetricsRows}
                baselineSelected={eval_.baseline.selected_patch}
              />
            </section>

            {/* Comparison Charts */}
            <section
              id="charts"
              ref={(el) => {
                sectionRefs.current["charts"] = el;
              }}
              className="space-y-4"
            >
              <SectionHeader
                icon={<BarChart3 className="w-4 h-4 text-blue-600" />}
                title="Comparison Dashboard"
                subtitle="Visual analysis of BAPR vs TrustPatch performance"
              />
              <ComparisonDashboard
                chartData={eval_.chart_data}
                baselineSelected={eval_.baseline.selected_patch}
                trustSelected={eval_.trustpatch.selected_patch}
                diverged={eval_.diverged}
                baprTrap={eval_.bapr_trap_triggered}
              />
            </section>

            {/* Explainability */}
            <section
              id="explain"
              ref={(el) => {
                sectionRefs.current["explain"] = el;
              }}
              className="space-y-4"
            >
              <SectionHeader
                icon={<Brain className="w-4 h-4 text-blue-600" />}
                title="Explainability Engine"
                subtitle="Decision reasoning for TrustPatch's patch selection"
              />
              <ExplainabilityCard
                explanation={eval_.explanation}
                comparisonSummary={eval_.comparison_summary}
                trustScore={eval_.trustpatch.trust_score}
                selectedPatch={eval_.trustpatch.selected_patch}
              />
            </section>

            {/* Run Again */}
            <div className="flex justify-center py-6">
              <button
                onClick={() =>
                  setState((prev) => ({
                    ...prev,
                    phase: "upload",
                    evaluation: null,
                    error: null,
                  }))
                }
                className="btn-primary"
              >
                <Upload className="w-4 h-4" />
                Run Another Evaluation
              </button>
            </div>
          </>
        )}
      </main>

      {/* ── FOOTER ── */}
      <footer className="border-t border-slate-200 bg-white py-6 px-5 relative">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 md:gap-4">
          
          {/* Left: Visitors */}
          <div className="w-full md:w-1/3 flex justify-center md:justify-start">
            {visitorCount !== null && (
              <div className="text-slate-500 text-xs font-medium flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                Visitors: <span className="text-slate-700 font-bold">{visitorCount}</span>
              </div>
            )}
          </div>

          {/* Center: Info */}
          <div className="w-full md:w-1/3 text-center text-xs text-slate-400">
            <p>TrustPatch &mdash; Trust-Aware APR Framework &mdash; Research Prototype</p>
            <p className="mt-2">
              Developed by{" "}
              <a
                href="https://www.linkedin.com/in/sanjayj06/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-600 hover:underline transition-colors font-medium whitespace-nowrap"
              >
                Sanjay Jayakumar
              </a>
            </p>
          </div>

          {/* Right Spacer */}
          <div className="hidden md:block md:w-1/3"></div>
        </div>
      </footer>

      {/* ── SCROLL TO TOP ── */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 z-50 bg-blue-600 hover:bg-blue-700 text-white p-3.5 rounded-full shadow-lg transition-all animate-slide-up focus:outline-none focus:ring-4 focus:ring-blue-300"
          title="Scroll to top"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m18 15-6-6-6 6"/>
          </svg>
        </button>
      )}
    </div>
  );
}

// ============================================================
// Sub-components
// ============================================================

function SectionHeader({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center gap-3 pb-1">
      <div>
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        {subtitle && (
          <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

function WinnerBanner({
  baseline,
  trustpatch,
  trustScore,
  agreed,
  baprTrap,
  baprPassRate,
}: {
  baseline: string;
  trustpatch: string;
  trustScore: number;
  agreed: boolean;
  baprTrap?: boolean;
  baprPassRate?: number;
}) {
  const baprPct = Math.round((baprPassRate ?? 0) * 100);

  if (baprTrap && !agreed) {
    return (
      <div className="rounded-2xl p-5 bg-white border-2 border-red-300 shadow-sm">
        <div className="flex flex-col lg:flex-row items-center justify-between flex-wrap gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
            <div className="text-center">
              <p className="text-xs text-red-500 font-bold uppercase tracking-widest mb-1">
                BAPR Selected
              </p>
              <p className="text-2xl font-black text-red-600">{baseline}</p>
              <p className="text-xs text-red-400 mt-1">
                {baprPct}% pass rate — test-gaming
              </p>
            </div>
            <div className="text-slate-300 font-bold text-xl">&rarr;</div>
            <div className="text-center">
              <p className="text-xs text-blue-600 font-bold uppercase tracking-widest mb-1">
                TrustPatch Selected
              </p>
              <p className="text-2xl font-black text-blue-700">{trustpatch}</p>
              <p className="text-xs text-blue-500 mt-1">
                Trust score {trustScore.toFixed(3)}
              </p>
            </div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 max-w-xs">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <p className="text-sm font-semibold text-slate-900">
                Core Advantage Demonstrated
              </p>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              BAPR's single-criterion selection chose a test-gaming patch.
              TrustPatch's 10-dimensional analysis correctly identified and
              rejected it.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl p-5 bg-white border shadow-sm ${agreed ? "border-emerald-200" : "border-blue-200"
        }`}
    >
      <div className="flex flex-col lg:flex-row items-center justify-between flex-wrap gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
          <div className="text-center">
            <p className="text-xs text-indigo-500 font-semibold uppercase tracking-widest mb-1">
              BAPR Selected
            </p>
            <p className="text-2xl font-black text-indigo-700">{baseline}</p>
          </div>
          <div className="text-slate-300 font-bold text-lg">vs</div>
          <div className="text-center">
            <p className="text-xs text-blue-600 font-semibold uppercase tracking-widest mb-1">
              TrustPatch Selected
            </p>
            <p className="text-2xl font-black text-blue-700">{trustpatch}</p>
          </div>
        </div>
        <div>
          {agreed ? (
            <div className="flex items-center gap-2 text-emerald-700">
              <CheckCircle2 className="w-5 h-5" />
              <div>
                <p className="font-semibold text-sm">Both pipelines agreed</p>
                <p className="text-xs text-slate-500">
                  TrustPatch confirms with trust score {trustScore.toFixed(3)}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-blue-700">
              <TrendingUp className="w-5 h-5" />
              <div>
                <p className="font-semibold text-sm">
                  TrustPatch selected a higher-quality patch
                </p>
                <p className="text-xs text-slate-500">
                  Trust score: {trustScore.toFixed(3)}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
