import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, MapPin, Home, Car, Leaf, Zap, Save, Loader2, CheckCircle, Camera } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { apiClient } from '@/api/client';

const inputCls = "w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition";
const selectCls = `${inputCls} cursor-pointer`;

const Field = ({ label, icon: Icon, children }: { label: string; icon?: any; children: React.ReactNode }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1">
      {Icon && <Icon className="w-3.5 h-3.5" />} {label}
    </label>
    {children}
  </div>
);

export default function Profile() {
  const { user } = useAuthStore();
  const initial = user?.full_name?.charAt(0).toUpperCase() ?? '?';

  const [form, setForm] = useState({
    full_name: user?.full_name ?? '',
    location: '',
    household_size: '2',
    vehicle_type: 'electric',
    diet_pattern: 'vegetarian',
    electricity_usage: 'medium',
  });

  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiClient.put('/onboarding/profile', form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      console.error('Save failed', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">My Profile</h1>
        <p className="text-sm text-slate-400 mt-1">Manage your personal info and eco lifestyle data</p>
      </div>

      {/* Avatar card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-md p-6 flex items-center gap-6"
      >
        <div className="relative group">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-500 to-cyan-500 flex items-center justify-center text-3xl font-bold text-white shadow-lg shadow-brand-500/20">
            {initial}
          </div>
          <div className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center cursor-pointer">
            <Camera className="w-5 h-5 text-white" />
          </div>
        </div>
        <div>
          <p className="text-lg font-semibold text-white">{user?.full_name}</p>
          <p className="text-sm text-slate-400 flex items-center gap-1.5 mt-0.5">
            <Mail className="w-3.5 h-3.5" /> {user?.email}
          </p>
          <span className="mt-2 inline-block text-xs font-medium px-2.5 py-0.5 rounded-full bg-brand-500/15 text-brand-400">
            Eco Member
          </span>
        </div>
      </motion.div>

      {/* Personal Info */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-md p-6"
      >
        <div className="flex items-center gap-3 mb-5 pb-4 border-b border-white/5">
          <div className="w-9 h-9 rounded-xl bg-brand-500/15 flex items-center justify-center">
            <User className="w-5 h-5 text-brand-400" />
          </div>
          <h2 className="text-base font-semibold text-white">Personal Information</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Full Name" icon={User}>
            <input className={inputCls} value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
          </Field>
          <Field label="Location" icon={MapPin}>
            <input className={inputCls} placeholder="City, Country" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
          </Field>
        </div>
      </motion.div>

      {/* Eco Profile */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-md p-6"
      >
        <div className="flex items-center gap-3 mb-5 pb-4 border-b border-white/5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center">
            <Leaf className="w-5 h-5 text-emerald-400" />
          </div>
          <h2 className="text-base font-semibold text-white">Eco Lifestyle</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Household Size" icon={Home}>
            <select className={selectCls} value={form.household_size} onChange={e => setForm(f => ({ ...f, household_size: e.target.value }))}>
              {['1','2','3','4','5+'].map(v => <option key={v} value={v}>{v} {v === '1' ? 'person' : 'people'}</option>)}
            </select>
          </Field>
          <Field label="Vehicle Type" icon={Car}>
            <select className={selectCls} value={form.vehicle_type} onChange={e => setForm(f => ({ ...f, vehicle_type: e.target.value }))}>
              <option value="none">No vehicle</option>
              <option value="electric">Electric</option>
              <option value="hybrid">Hybrid</option>
              <option value="petrol">Petrol</option>
              <option value="diesel">Diesel</option>
            </select>
          </Field>
          <Field label="Diet Pattern" icon={Leaf}>
            <select className={selectCls} value={form.diet_pattern} onChange={e => setForm(f => ({ ...f, diet_pattern: e.target.value }))}>
              <option value="vegan">Vegan</option>
              <option value="vegetarian">Vegetarian</option>
              <option value="flexitarian">Flexitarian</option>
              <option value="omnivore">Omnivore</option>
            </select>
          </Field>
          <Field label="Electricity Usage" icon={Zap}>
            <select className={selectCls} value={form.electricity_usage} onChange={e => setForm(f => ({ ...f, electricity_usage: e.target.value }))}>
              <option value="low">Low (&lt;150 kWh/mo)</option>
              <option value="medium">Medium (150–400 kWh/mo)</option>
              <option value="high">High (&gt;400 kWh/mo)</option>
            </select>
          </Field>
        </div>
      </motion.div>

      {/* Save */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-500 hover:bg-brand-400 disabled:opacity-50 text-white font-medium transition-all shadow-lg shadow-brand-500/20"
        >
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
           : saved  ? <><CheckCircle className="w-4 h-4" /> Saved!</>
           : <><Save className="w-4 h-4" /> Save Profile</>}
        </button>
      </motion.div>
    </div>
  );
}
