import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarDays, MapPin, Users, Pencil, Trash2, CheckCircle, XCircle, Save, X } from 'lucide-react';
import { adminApi } from '@/api/admin';
import type { AdminEvent } from '@/api/admin';

const EVENT_TYPE_COLORS: Record<string, string> = {
  recycling: 'bg-emerald-500/10 text-emerald-400',
  plantation: 'bg-green-500/10 text-green-400',
  ngo: 'bg-blue-500/10 text-blue-400',
  community: 'bg-purple-500/10 text-purple-400',
};

export default function AdminEvents() {
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<AdminEvent>>({});
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const load = async () => {
    setLoading(true);
    try { setEvents(await adminApi.getEvents()); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const startEdit = (event: AdminEvent) => {
    setEditId(event.id);
    setEditData({ title: event.title, description: event.description, location: event.location, max_participants: event.max_participants, is_active: event.is_active });
  };

  const saveEdit = async () => {
    if (!editId) return;
    await adminApi.updateEvent(editId, editData);
    showToast('Event updated');
    setEditId(null);
    load();
  };

  const deleteEvent = async (id: string) => {
    if (!confirm('Delete this event?')) return;
    await adminApi.deleteEvent(id);
    showToast('Event deleted');
    load();
  };

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white">Events Management</h1>
        <p className="text-slate-500 text-sm mt-1">{events.length} community events</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-20 text-slate-500">No events found</div>
      ) : (
        <div className="space-y-3">
          {events.map(event => (
            <motion.div
              key={event.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#0d1117]/80 backdrop-blur-sm border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all"
            >
              {editId === event.id ? (
                /* Inline Edit Form */
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Title</label>
                      <input
                        value={editData.title || ''}
                        onChange={e => setEditData(d => ({ ...d, title: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500/50"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Location</label>
                      <input
                        value={editData.location || ''}
                        onChange={e => setEditData(d => ({ ...d, location: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500/50"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Max Participants</label>
                      <input
                        type="number"
                        value={editData.max_participants || ''}
                        onChange={e => setEditData(d => ({ ...d, max_participants: parseInt(e.target.value) }))}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500/50"
                      />
                    </div>
                    <div className="flex items-end gap-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editData.is_active ?? true}
                          onChange={e => setEditData(d => ({ ...d, is_active: e.target.checked }))}
                          className="w-4 h-4 rounded accent-brand-500"
                        />
                        <span className="text-sm text-slate-300">Active</span>
                      </label>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={saveEdit} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-500 hover:bg-brand-400 text-white text-sm font-medium transition-all">
                      <Save className="w-4 h-4" /> Save
                    </button>
                    <button onClick={() => setEditId(null)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-sm transition-all">
                      <X className="w-4 h-4" /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                /* Read View */
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap mb-2">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${EVENT_TYPE_COLORS[event.event_type] || 'bg-slate-700 text-slate-400'}`}>
                        {event.event_type}
                      </span>
                      <span className={`inline-flex items-center gap-1 text-xs ${event.is_active ? 'text-emerald-400' : 'text-red-400'}`}>
                        {event.is_active ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {event.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <h3 className="font-semibold text-white">{event.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{event.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {event.location}</span>
                      <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" /> {new Date(event.event_date).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {event.current_participants}/{event.max_participants}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => startEdit(event)} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteEvent(event.id)} className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
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
