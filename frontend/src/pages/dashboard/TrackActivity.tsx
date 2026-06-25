import * as React from 'react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Car, Zap, Droplets, Trash2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { activitiesApi } from '@/api/activities';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { GlassPanel } from '@/components/ui/Card';

const activitySchema = z.object({
  category: z.string(),
  type: z.string().min(1, "Please select an activity type"),
  value: z.number().positive("Value must be greater than 0"),
  unit: z.string(),
});

type ActivityFormValues = z.infer<typeof activitySchema>;

const CATEGORIES = [
  { id: 'transportation', label: 'Transportation', icon: <Car className="w-5 h-5" /> },
  { id: 'electricity', label: 'Electricity', icon: <Zap className="w-5 h-5" /> },
  { id: 'water', label: 'Water', icon: <Droplets className="w-5 h-5" /> },
  { id: 'waste', label: 'Waste', icon: <Trash2 className="w-5 h-5" /> },
];

const TYPES_BY_CATEGORY: Record<string, { id: string, label: string, unit: string }[]> = {
  transportation: [
    { id: 'car_trip', label: 'Car Trip (Gas)', unit: 'miles' },
    { id: 'ev_trip', label: 'EV Trip', unit: 'miles' },
    { id: 'flight', label: 'Flight', unit: 'miles' },
    { id: 'public_transit', label: 'Public Transit', unit: 'miles' },
    { id: 'bike_walk', label: 'Biking / Walking', unit: 'miles' },
  ],
  electricity: [
    { id: 'grid_usage', label: 'Grid Usage', unit: 'kWh' },
    { id: 'renewable_usage', label: 'Renewable Usage', unit: 'kWh' },
  ],
  water: [
    { id: 'usage', label: 'Water Usage', unit: 'gallons' },
    { id: 'saved', label: 'Water Saved (Rainwater/etc)', unit: 'gallons' },
  ],
  waste: [
    { id: 'landfill', label: 'General Waste (Landfill)', unit: 'lbs' },
    { id: 'recycled', label: 'Recycled Waste', unit: 'lbs' },
    { id: 'composted', label: 'Composted Waste', unit: 'lbs' },
  ]
};

export default function TrackActivity() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('transportation');
  const [isSuccess, setIsSuccess] = useState(false);

  const { control, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<ActivityFormValues>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      category: 'transportation',
      type: '',
      value: undefined,
      unit: '',
    },
  });

  const currentTypes = TYPES_BY_CATEGORY[activeTab];

  // When tab changes, reset form with new category
  React.useEffect(() => {
    reset({ category: activeTab, type: '', value: undefined, unit: '' });
  }, [activeTab, reset]);

  const mutation = useMutation({
    mutationFn: activitiesApi.createActivity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        navigate('/dashboard');
      }, 2000);
    }
  });

  const onSubmit = (data: ActivityFormValues) => {
    mutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6 flex flex-col items-center pt-24">
      <div className="w-full max-w-2xl relative">
        <Link to="/dashboard" className="absolute -top-12 left-0 text-sm font-medium text-slate-400 hover:text-white flex items-center transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
        </Link>

        <GlassPanel className="p-8">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-2">Log Activity</h2>
            <p className="text-slate-400">Track your environmental impact in real-time.</p>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-8 p-1 bg-slate-900/50 rounded-lg">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-md text-sm font-medium transition-all relative ${
                  activeTab === cat.id ? 'text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                {activeTab === cat.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-brand-500/20 border border-brand-500/50 rounded-md"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  {cat.icon}
                  <span className="hidden sm:inline">{cat.label}</span>
                </span>
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {isSuccess ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center justify-center py-12 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", bounce: 0.5 }}
                >
                  <CheckCircle2 className="w-20 h-20 text-brand-500 mb-4" />
                </motion.div>
                <h3 className="text-2xl font-bold text-white mb-2">Activity Logged!</h3>
                <p className="text-slate-400">Your Eco Score has been updated.</p>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <div className="space-y-3">
                  <label className="text-sm font-medium text-slate-300">Activity Type</label>
                  <Controller
                    name="type"
                    control={control}
                    render={({ field }) => (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {currentTypes.map(t => (
                          <div
                            key={t.id}
                            onClick={() => {
                              field.onChange(t.id);
                              setValue('unit', t.unit);
                            }}
                            className={`p-4 rounded-lg border cursor-pointer transition-all ${
                              field.value === t.id 
                                ? 'bg-brand-500/20 border-brand-500' 
                                : 'bg-slate-900/50 border-slate-700 hover:border-slate-500'
                            }`}
                          >
                            <span className="text-sm font-medium text-slate-200">{t.label}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  />
                  {errors.type && <p className="text-red-400 text-sm mt-1">{errors.type.message}</p>}
                </div>

                <div className="space-y-3">
                  <Controller
                    name="value"
                    control={control}
                    render={({ field }) => (
                      <Input
                        label={`Value (${watch('unit') || 'Select a type first'})`}
                        type="number"
                        placeholder="e.g. 15.5"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        value={field.value ?? ''}
                        disabled={!watch('type')}
                      />
                    )}
                  />
                  {errors.value && <p className="text-red-400 text-sm mt-1">{errors.value.message}</p>}
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 text-lg"
                  isLoading={mutation.isPending}
                  disabled={!watch('type') || !watch('value')}
                >
                  Log Impact
                </Button>
                {mutation.isError && (
                  <p className="text-red-400 text-sm text-center">Failed to log activity. Please try again.</p>
                )}
              </motion.form>
            )}
          </AnimatePresence>
        </GlassPanel>
      </div>
    </div>
  );
}
