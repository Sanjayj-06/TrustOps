import React, { useEffect, useState } from 'react';
import { Database, CheckCircle, XCircle, AlertTriangle, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { getKnowledgeSummary, getKnowledgeEntries } from '../api/trustpatch';
import type { KnowledgeSummary, KnowledgeBaseEntry } from '../types';

export default function KnowledgeBasePage() {
  const [summary, setSummary] = useState<KnowledgeSummary | null>(null);
  const [entries, setEntries] = useState<KnowledgeBaseEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [sumRes, entRes] = await Promise.all([
          getKnowledgeSummary(),
          getKnowledgeEntries(50)
        ]);
        setSummary(sumRes);
        setEntries(entRes.entries || []);
      } catch (err) {
        console.error("Failed to fetch Knowledge Base data", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const renderDecisionBadge = (decision: string) => {
    switch (decision) {
      case 'accept':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-sm">
            <CheckCircle className="w-3.5 h-3.5" /> Accept
          </span>
        );
      case 'reject':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-800 border border-rose-200 shadow-sm">
            <XCircle className="w-3.5 h-3.5" /> Reject
          </span>
        );
      case 'override':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200 shadow-sm">
            <AlertTriangle className="w-3.5 h-3.5" /> Override
          </span>
        );
      default:
        return <span className="text-slate-400 capitalize">{decision}</span>;
    }
  };

  const getMetricColor = (val: number) => {
    if (val >= 0.8) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (val >= 0.5) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-rose-600 bg-rose-50 border-rose-200';
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl shadow-sm border border-blue-200/50">
              <Database className="w-6 h-6" />
            </div>
            Knowledge Base
          </h1>
          <p className="text-slate-500 mt-2 font-medium">
            Historical evaluations, decisions, and trust parameter snapshots.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="font-medium">Loading Knowledge Base data...</p>
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white/60 backdrop-blur-xl border border-white/40 shadow-sm rounded-2xl p-5 hover:bg-white/80 transition-colors">
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Entries</p>
              <p className="text-3xl font-bold text-slate-800 mt-2">{summary?.total_entries || 0}</p>
            </div>
            <div className="bg-emerald-50/60 backdrop-blur-xl border border-emerald-200/40 shadow-sm rounded-2xl p-5 hover:bg-emerald-50/80 transition-colors">
              <p className="text-sm font-semibold text-emerald-600/80 uppercase tracking-wider">Accepts</p>
              <p className="text-3xl font-bold text-emerald-700 mt-2">{summary?.decisions?.accept || 0}</p>
            </div>
            <div className="bg-rose-50/60 backdrop-blur-xl border border-rose-200/40 shadow-sm rounded-2xl p-5 hover:bg-rose-50/80 transition-colors">
              <p className="text-sm font-semibold text-rose-600/80 uppercase tracking-wider">Rejects</p>
              <p className="text-3xl font-bold text-rose-700 mt-2">{summary?.decisions?.reject || 0}</p>
            </div>
            <div className="bg-amber-50/60 backdrop-blur-xl border border-amber-200/40 shadow-sm rounded-2xl p-5 hover:bg-amber-50/80 transition-colors">
              <p className="text-sm font-semibold text-amber-600/80 uppercase tracking-wider">Overrides</p>
              <p className="text-3xl font-bold text-amber-700 mt-2">{summary?.decisions?.override || 0}</p>
            </div>
          </div>

          {/* Data Table */}
          <div className="bg-white/70 backdrop-blur-xl border border-white/60 shadow-lg shadow-slate-200/50 rounded-2xl overflow-hidden">
            {entries.length === 0 ? (
              <div className="p-12 text-center">
                <Database className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-700">No Entries Found</h3>
                <p className="text-slate-500 mt-1">Run a patch evaluation and submit a decision to populate the Knowledge Base.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200">
                      <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Target File</th>
                      <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Patch ID</th>
                      <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Trust Score</th>
                      <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Decision</th>
                      <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Timestamp</th>
                      <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Metrics</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {entries.map((entry) => {
                      const isExpanded = expandedId === entry.id;
                      return (
                        <React.Fragment key={entry.id}>
                          <tr 
                            className={`hover:bg-blue-50/30 transition-colors cursor-pointer ${isExpanded ? 'bg-blue-50/30' : ''}`}
                            onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                          >
                            <td className="py-4 px-6">
                              <span className="font-mono text-sm text-slate-700 font-medium">{entry.bug_filename}</span>
                            </td>
                            <td className="py-4 px-6">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-600">
                                {entry.patch_id}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full ${entry.trust_score >= 0.7 ? 'bg-emerald-500' : entry.trust_score >= 0.4 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                    style={{ width: `${Math.max(0, Math.min(100, entry.trust_score * 100))}%` }}
                                  />
                                </div>
                                <span className="text-sm font-bold text-slate-700">{(entry.trust_score * 100).toFixed(1)}</span>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              {renderDecisionBadge(entry.decision)}
                            </td>
                            <td className="py-4 px-6 text-sm text-slate-500">
                              {new Date(entry.timestamp).toLocaleString()}
                            </td>
                            <td className="py-4 px-6 text-right">
                              <button className="text-slate-400 hover:text-blue-600 p-1 rounded-lg hover:bg-blue-50 transition-colors">
                                {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                              </button>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr className="bg-slate-50/50">
                              <td colSpan={6} className="px-6 py-4 border-b border-slate-200 shadow-inner">
                                <div className="flex flex-col gap-4">
                                  {entry.reason && (
                                    <div className="bg-white border border-slate-200 rounded-lg p-3 text-sm flex gap-3 items-start">
                                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                      <div>
                                        <span className="font-bold text-slate-700">Decision Reason: </span>
                                        <span className="text-slate-600">{entry.reason}</span>
                                      </div>
                                    </div>
                                  )}
                                  <div>
                                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">10-Dimensional Trust Snapshot</h4>
                                    <div className="flex flex-wrap gap-2">
                                      {Object.entries(entry.metrics).map(([key, val]) => (
                                        <div key={key} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border ${getMetricColor(val)}`}>
                                          <span>{key}</span>
                                          <span className="opacity-50">|</span>
                                          <span>{(val * 100).toFixed(0)}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
