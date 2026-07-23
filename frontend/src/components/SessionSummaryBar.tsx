/**
 * SessionSummaryBar.tsx
 * ----------------------
 * Sticky top bar for the TrustOps results dashboard.
 * Designed as an Engineering Operations Portal header.
 * 
 * Shows: Evaluation Session, Bug Name, Generated Patches, Recommended Patch, 
 * Trust Score, Confidence, and Developer Status.
 */

import React from "react";

interface SessionSummaryBarProps {
  filename:         string;
  sessionId:        string;
  patchCount:       number;
  selectedPatch:    string;
  baselinePatch:    string;
  trustScore:       number;
  diverged:         boolean;
  baprTrapTriggered: boolean;
  developerStatus?: string; // e.g., 'Pending Review', 'Accepted', 'Rejected', 'Overridden'
}

export default function SessionSummaryBar({
  filename,
  sessionId,
  patchCount,
  selectedPatch,
  baselinePatch,
  trustScore,
  diverged,
  baprTrapTriggered,
  developerStatus = 'Pending Review'
}: SessionSummaryBarProps) {
  const shortSession = sessionId.slice(0, 8).toUpperCase();
  
  const riskColor =
    trustScore >= 0.70 ? "text-emerald-600" :
    trustScore >= 0.45 ? "text-amber-600"   : "text-red-600";
    
  const confidence = 
    trustScore >= 0.70 ? "High" :
    trustScore >= 0.45 ? "Medium" : "Low";

  const statusColor = 
    developerStatus === 'Accepted' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
    developerStatus === 'Rejected' ? 'bg-red-100 text-red-800 border-red-300' :
    developerStatus === 'Overridden' ? 'bg-amber-100 text-amber-800 border-amber-300' :
    'bg-blue-100 text-blue-800 border-blue-300'; // Pending

  return (
    <div className="bg-white border-b-4 border-b-blue-600 border border-slate-200 shadow-md px-6 py-4">
      <div className="flex flex-wrap items-center justify-between gap-y-4">
        
        {/* Left Side: Session & Bug */}
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Evaluation Session</span>
            <code className="text-slate-800 font-mono text-sm mt-0.5">#{shortSession}</code>
          </div>
          <Divider />
          <div className="flex flex-col">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Bug Name</span>
            <span className="text-slate-900 font-bold text-sm mt-0.5">{filename}</span>
          </div>
          <Divider />
          <div className="flex flex-col">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Developer Status</span>
            <span className={`mt-0.5 px-2 py-0.5 text-xs font-bold rounded border ${statusColor}`}>
              {developerStatus}
            </span>
          </div>
        </div>

        {/* Right Side: TrustOps Results */}
        <div className="flex items-center gap-6 bg-slate-50 px-4 py-2 rounded-lg border border-slate-100">
          <div className="flex flex-col items-center">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Patches</span>
            <span className="text-slate-700 font-black text-sm">{patchCount}</span>
          </div>
          <Divider />
          <div className="flex flex-col items-center">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Recommended</span>
            <span className="text-blue-700 font-black text-sm">{selectedPatch}</span>
          </div>
          <Divider />
          <div className="flex flex-col items-center">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Confidence</span>
            <span className={`font-black text-sm ${riskColor}`}>{confidence}</span>
          </div>
          <Divider />
          <div className="flex flex-col items-center">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Trust Score</span>
            <span className={`font-black text-lg leading-none ${riskColor}`}>{trustScore.toFixed(3)}</span>
          </div>
        </div>

      </div>
    </div>
  );
}

function Divider() {
  return <div className="hidden md:block w-px h-8 bg-slate-200 flex-shrink-0" />;
}
