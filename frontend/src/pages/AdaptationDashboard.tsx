import React, { useState, useEffect } from "react";
import { Database, FileText, CheckCircle, Brain, TrendingUp, AlertTriangle } from "lucide-react";
import { 
  getAnalyticsSummary, 
  getPatterns, 
  getEvolution, 
  getRecommendation,
  AnalyticsSummaryResponse,
  PatternDiscoveryResponse,
  TrustEvolutionTimeline,
  AdaptationRecommendationResponse
} from "../api/trustops_phase3";

const DEMO_SESSION_ID = "DEMO-SESSION-12345"; 

export default function AdaptationDashboard() {
  const [summary, setSummary] = useState<AnalyticsSummaryResponse | null>(null);
  const [patterns, setPatterns] = useState<PatternDiscoveryResponse | null>(null);
  const [evolution, setEvolution] = useState<TrustEvolutionTimeline | null>(null);
  const [rec, setRec] = useState<AdaptationRecommendationResponse | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [sumRes, patRes, evoRes, recRes] = await Promise.all([
          getAnalyticsSummary(),
          getPatterns(),
          getEvolution(DEMO_SESSION_ID).catch(() => null),
          getRecommendation(DEMO_SESSION_ID).catch(() => null)
        ]);
        setSummary(sumRes);
        setPatterns(patRes);
        setEvolution(evoRes);
        setRec(recRes);
      } catch (e) {
        console.error("Failed to load adaptation data", e);
      }
    }
    loadData();
  }, []);

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Trust Adaptation Engine</h1>
        <p className="text-slate-500 mt-1">Autonomous trust weight evolution based on historical validations and runtime metrics.</p>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <SummaryCard icon={Database} label="KB Size" value={summary?.knowledge_base_size || 0} />
        <SummaryCard icon={FileText} label="Evaluations" value={summary?.evaluations || 0} />
        <SummaryCard icon={CheckCircle} label="Successes" value={summary?.successful_repairs || 0} />
        <SummaryCard icon={TrendingUp} label="Avg Trust" value={summary?.average_trust.toFixed(2) || "0.0"} />
        <SummaryCard icon={Brain} label="Runtime" value={summary?.average_runtime_trust || "N/A"} />
        <SummaryCard icon={CheckCircle} label="Accept Rate" value={`${(summary?.average_acceptance_rate || 0) * 100}%`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pattern Discovery Panel */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-6">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-3">Pattern Discovery Engine</h2>
          
          <div className="space-y-5">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Most Common Bug Types</p>
              <div className="flex flex-wrap gap-2">
                {patterns?.most_common_bug_types.map((b, idx) => (
                  <span key={idx} className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-bold">{b.type} ({b.count})</span>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2">Successful Parameter Patterns</p>
              <ul className="space-y-1">
                {patterns?.successful_parameter_combinations.map((p, idx) => (
                  <li key={idx} className="text-sm text-slate-700 flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> {p}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-xs font-bold text-red-600 uppercase tracking-wider mb-2">Failed Parameter Patterns</p>
              <ul className="space-y-1">
                {patterns?.failed_parameter_combinations.map((p, idx) => (
                  <li key={idx} className="text-sm text-slate-700 flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-500" /> {p}
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-2">Frequent Runtime Issues</p>
              <ul className="space-y-1">
                {patterns?.frequent_runtime_issues.map((p, idx) => (
                  <li key={idx} className="text-sm text-slate-700 flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> {p}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Trust Evolution Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-white shadow-sm">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-3 mb-5">Trust Evolution (Session {DEMO_SESSION_ID.substring(0,8)})</h2>
            
            <div className="flex justify-between items-center relative">
              <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-700 -z-10"></div>
              
              <EvolutionNode label="Initial" value={evolution?.development_trust.toFixed(2) || "-"} active={true} />
              <EvolutionNode label="Validation" value={evolution?.developer_validation || "-"} active={!!evolution?.developer_validation} />
              <EvolutionNode label="Runtime" value={evolution?.runtime_trust || "-"} active={!!evolution?.runtime_trust} />
              <EvolutionNode label="Adapted" value={evolution?.adapted_trust_recommended.toFixed(2) || "-"} active={true} highlight={true} />
            </div>
          </div>

          {/* Adaptation Recommendation */}
          <div className="bg-white border border-blue-200 rounded-xl shadow-sm overflow-hidden">
            <div className="bg-blue-50 px-6 py-4 border-b border-blue-100 flex justify-between items-center">
              <div>
                <h2 className="text-sm font-bold text-blue-800 uppercase tracking-widest">Adaptation Recommendation</h2>
                <p className="text-xs text-blue-600 mt-0.5">Proposed Weight Delta for Future Evaluations</p>
              </div>
              <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded">Confidence: {rec?.confidence || "-"}</span>
            </div>
            
            <div className="p-6">
              <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded border border-slate-100 mb-5">
                <span className="font-bold text-slate-800">Reasoning: </span> 
                {rec?.reason || "Pending sufficient knowledge base entries."}
              </p>

              {rec && (
                <div className="space-y-2 mb-6">
                  <div className="flex text-xs font-bold text-slate-400 uppercase tracking-widest">
                    <div className="w-20">Param</div>
                    <div className="w-24 text-right">Current</div>
                    <div className="flex-1 text-center">Delta</div>
                    <div className="w-24 text-right">Recommended</div>
                  </div>
                  
                  {Object.keys(rec.current_weights).map(k => {
                    const curr = rec.current_weights[k];
                    const recom = rec.recommended_weights[k];
                    const diff = recom - curr;
                    if (diff === 0) return null; // Only show changes
                    
                    return (
                      <div key={k} className="flex items-center text-sm font-medium border-t border-slate-100 pt-2">
                        <div className="w-20 font-bold">{k}</div>
                        <div className="w-24 text-right text-slate-500">{curr.toFixed(3)}</div>
                        <div className={`flex-1 text-center font-bold ${diff > 0 ? "text-emerald-500" : "text-red-500"}`}>
                          {diff > 0 ? "+" : ""}{diff.toFixed(3)}
                        </div>
                        <div className="w-24 text-right font-black text-blue-600">{recom.toFixed(3)}</div>
                      </div>
                    )
                  })}
                </div>
              )}

              <div className="flex gap-3">
                <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg text-sm transition-colors shadow-sm">
                  Approve Adaptation
                </button>
                <button className="flex-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold py-2 rounded-lg text-sm transition-colors shadow-sm">
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value }: { icon: any, label: string, value: string | number }) {
  return (
    <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm text-center flex flex-col items-center justify-center">
      <Icon className="w-5 h-5 text-blue-500 mb-2" />
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</span>
      <span className="text-xl font-black text-slate-900 mt-0.5">{value}</span>
    </div>
  );
}

function EvolutionNode({ label, value, active, highlight = false }: { label: string, value: string, active: boolean, highlight?: boolean }) {
  return (
    <div className="flex flex-col items-center bg-slate-900 z-10 px-2">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm border-2 ${
        highlight ? "border-blue-500 bg-blue-500/20 text-blue-400" : 
        active ? "border-emerald-500 bg-emerald-500/20 text-emerald-400" : "border-slate-700 bg-slate-800 text-slate-500"
      }`}>
        {value}
      </div>
      <span className={`text-[10px] font-bold uppercase tracking-widest mt-2 ${active ? "text-slate-300" : "text-slate-600"}`}>{label}</span>
    </div>
  );
}
