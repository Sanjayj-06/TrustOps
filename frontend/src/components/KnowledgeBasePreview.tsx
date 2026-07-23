/**
 * KnowledgeBasePreview.tsx
 * -------------------------
 * Previews recent Knowledge Base entries.
 * Fetches data from /trustops/knowledge/summary.
 */

import React, { useEffect, useState } from 'react';
import { getKnowledgeSummary } from '../api/trustpatch';
import type { KnowledgeSummary } from '../types';

export default function KnowledgeBasePreview() {
  const [data, setData] = useState<KnowledgeSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getKnowledgeSummary().then((res) => {
      if (active) {
        setData(res);
        setLoading(false);
      }
    }).catch(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center justify-center text-slate-400 text-sm h-32">
        <span className="w-4 h-4 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin mr-2" />
        Loading Knowledge Base Preview...
      </div>
    );
  }

  if (!data || !data.recent_entries || data.recent_entries.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center justify-center text-slate-400 text-sm h-32">
        No recent entries in Knowledge Base.
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
        <h3 className="font-bold text-slate-700 text-sm">Knowledge Base Preview</h3>
        <span className="text-xs font-semibold text-slate-400">Total Entries: {data.total_entries}</span>
      </div>
      <table className="w-full text-xs text-left">
        <thead>
          <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider">
            <th className="px-5 py-3 font-bold">Session ID</th>
            <th className="px-5 py-3 font-bold">Bug</th>
            <th className="px-5 py-3 font-bold text-right">Trust Score</th>
            <th className="px-5 py-3 font-bold text-center">Decision</th>
            <th className="px-5 py-3 font-bold text-center">Agreement</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {data.recent_entries.map((entry: any) => {
            const shortSession = entry.session_id.slice(0, 8).toUpperCase();
            const decColors: Record<string, string> = {
              accept: 'bg-emerald-50 text-emerald-700 border-emerald-200',
              reject: 'bg-red-50 text-red-700 border-red-200',
              override: 'bg-amber-50 text-amber-700 border-amber-200',
            };
            const decClass = entry.decision ? decColors[entry.decision] : 'bg-slate-50 text-slate-500 border-slate-200';
            
            return (
              <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-3 font-mono text-slate-600">#{shortSession}</td>
                <td className="px-5 py-3 font-medium text-slate-800">{entry.bug_filename}</td>
                <td className="px-5 py-3 text-right font-black text-slate-700">{entry.trust_score.toFixed(3)}</td>
                <td className="px-5 py-3 text-center">
                  <span className={`inline-block px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider ${decClass}`}>
                    {entry.decision || 'Unknown'}
                  </span>
                </td>
                <td className="px-5 py-3 text-center font-medium text-slate-600">
                  {entry.agreement || '-'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
