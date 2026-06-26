import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pencil, Save, X, CheckCircle, Zap } from 'lucide-react';
import { adminApi } from '@/api/admin';
import type { EmissionFactor } from '@/api/admin';

const CATEGORY_COLORS: Record<string, string> = {
  transportation: 'bg-violet-500/10 text-violet-400',
  electricity: 'bg-amber-500/10 text-amber-400',
  water: 'bg-sky-500/10 text-sky-400',
  waste: 'bg-rose-500/10 text-rose-400',
  food: 'bg-brand-500/10 text-brand-400',
};

export default function AdminEmissionFactors() {
  const [factors, setFactors] = useState<EmissionFactor[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editUnit, setEditUnit] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const load = async () => {
    setLoading(true);
    try { setFactors(await adminApi.getEmissionFactors()); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const startEdit = (f: EmissionFactor) => {
    setEditId(f.id);
    setEditValue(String(f.factor_value));
    setEditUnit(f.unit);
  };

  const saveEdit = async () => {
    if (!editId) return;
    await adminApi.updateEmissionFactor(editId, { factor_value: parseFloat(editValue), unit: editUnit });
    showToast('Emission factor updated');
    setEditId(null);
    load();
  };

  // Group by category
  const grouped = factors.reduce<Record<string, EmissionFactor[]>>((acc, f) => {
    (acc[f.category] = acc[f.category] || []).push(f);
    return acc;
  }, {});

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white">Emission Factors</h1>
        <p className="text-slate-500 text-sm mt-1">Manage CO₂ emission coefficients used for carbon calculations</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category} className="bg-[#0d1117]/80 backdrop-blur-sm border border-white/5 rounded-2xl overflow-hidden">
              {/* Category Header */}
              <div className="flex items-center gap-3 px-5 py-3 border-b border-white/5 bg-white/[0.02]">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${CATEGORY_COLORS[category] || 'bg-slate-700/50 text-slate-400'}`}>
                  <Zap className="w-3 h-3" />
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </span>
                <span className="text-xs text-slate-600">{items.length} factors</span>
              </div>

              {/* Factors Table */}
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.04]">
                    <th className="text-left px-5 py-2.5 text-xs font-medium text-slate-600">Type</th>
                    <th className="text-left px-5 py-2.5 text-xs font-medium text-slate-600">Factor Value</th>
                    <th className="text-left px-5 py-2.5 text-xs font-medium text-slate-600">Unit</th>
                    <th className="text-left px-5 py-2.5 text-xs font-medium text-slate-600">Last Updated</th>
                    <th className="text-right px-5 py-2.5 text-xs font-medium text-slate-600">Edit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {items.map(f => (
                    <tr key={f.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3 font-medium text-slate-300 text-xs">{f.type.replace(/_/g, ' ')}</td>
                      <td className="px-5 py-3">
                        {editId === f.id ? (
                          <input
                            type="number"
                            step="0.0001"
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            className="w-28 bg-white/5 border border-brand-500/50 rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
                          />
                        ) : (
                          <span className="text-white font-mono text-xs">{f.factor_value}</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        {editId === f.id ? (
                          <input
                            value={editUnit}
                            onChange={e => setEditUnit(e.target.value)}
                            className="w-24 bg-white/5 border border-brand-500/50 rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
                          />
                        ) : (
                          <span className="text-slate-400 text-xs">{f.unit}</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-slate-600 text-xs">
                        {new Date(f.updated_at).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {editId === f.id ? (
                            <>
                              <button onClick={saveEdit} className="p-1.5 rounded-lg text-brand-400 hover:bg-brand-500/10 transition-all">
                                <Save className="w-4 h-4" />
                              </button>
                              <button onClick={() => setEditId(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-white/5 transition-all">
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <button onClick={() => startEdit(f)} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all">
                              <Pencil className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-white/10 text-white text-sm px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3"
          >
            <CheckCircle className="w-4 h-4 text-brand-400" />{toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
