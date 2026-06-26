import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { GlassPanel } from '@/components/ui/Card';
import { CheckCircle2, ChevronRight, Sparkles } from 'lucide-react';

const onboardingSchema = z.object({
  household_size: z.string().min(1, "Please select an option"),
  location: z.string().min(1, "Please select an option"),
  vehicle_type: z.string().min(1, "Please select an option"),
  diet_pattern: z.string().min(1, "Please select an option"),
  electricity_usage: z.string().min(1, "Please select an option"),
});

type OnboardingFormValues = z.infer<typeof onboardingSchema>;

const STEPS = [
  { id: 'household', title: 'Household Size', field: 'household_size' },
  { id: 'location', title: 'Location', field: 'location' },
  { id: 'vehicle', title: 'Vehicle Ownership', field: 'vehicle_type' },
  { id: 'diet', title: 'Diet Pattern', field: 'diet_pattern' },
  { id: 'electricity', title: 'Electricity Habits', field: 'electricity_usage' },
  { id: 'generating', title: 'Generating Score', field: 'generating' },
];

const OPTIONS = {
  household_size: ['1', '2', '3', '4', '5+'],
  location: ['North America', 'Europe', 'Asia', 'South America', 'Africa', 'Oceania'],
  vehicle_type: ['No Vehicle (Public Transit/Bike)', 'EV', 'Hybrid', 'Gas (Efficient)', 'Gas (Heavy/SUV)'],
  diet_pattern: ['Vegan', 'Vegetarian', 'Omnivore', 'Heavy Meat'],
  electricity_usage: ['Low', 'Average', 'High', '100% Renewable'],
};

export default function OnboardingWizard() {
  const navigate = useNavigate();
  const { setOnboardingDraft, clearOnboardingDraft, setUser, onboardingDraft } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  // DEMO MODE: Auto-skip disabled — always show onboarding even if already completed
  // useEffect(() => {
  //   if (user?.has_completed_onboarding) {
  //     navigate('/dashboard', { replace: true });
  //   }
  // }, [user, navigate]);

  const { control, handleSubmit, watch, formState: { errors } } = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      household_size: onboardingDraft?.household_size || '',
      location: onboardingDraft?.location || '',
      vehicle_type: onboardingDraft?.vehicle_type || '',
      diet_pattern: onboardingDraft?.diet_pattern || '',
      electricity_usage: onboardingDraft?.electricity_usage || '',
    },
  });

  // Watch fields to save to draft
  const formValues = watch();
  
  useEffect(() => {
    if (currentStep < 5) {
      setOnboardingDraft(formValues);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(formValues), currentStep]);

  const onNext = async () => {
    if (currentStep < STEPS.length - 2) {
      setCurrentStep(prev => prev + 1);
    } else if (currentStep === STEPS.length - 2) {
      // Last input step, proceed to generation
      setCurrentStep(prev => prev + 1);
      handleSubmit(onSubmit)();
    } else if (currentStep === STEPS.length - 1) {
      // Final step -> Dashboard
      navigate('/dashboard');
    }
  };

  const onSubmit = async (data: OnboardingFormValues) => {
    setIsSubmitting(true);
    try {
      const result = await authApi.submitOnboarding(data);
      setScore(result.eco_score);
      // Update user in store to reflect onboarding completed
      const user = await authApi.getMe();
      setUser(user);
      clearOnboardingDraft();
    } catch (err) {
      console.error("Failed to submit onboarding", err);
      // Revert step if failed
      setCurrentStep(prev => prev - 1);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentField = STEPS[currentStep].field as keyof typeof OPTIONS;
  const currentOptions = OPTIONS[currentField] || [];

  return (
    <div className="min-h-screen bg-transparent flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-2xl relative">
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 w-full h-1 bg-slate-800 rounded-full overflow-hidden -mt-12">
          <motion.div 
            className="h-full bg-brand-500"
            initial={{ width: 0 }}
            animate={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          />
        </div>

        <GlassPanel className="min-h-[400px] flex flex-col">
          <AnimatePresence mode="wait">
            {currentStep < 5 ? (
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="flex-1 flex flex-col"
              >
                <div className="mb-8">
                  <span className="text-sm font-medium text-brand-400 mb-2 block">Step {currentStep + 1} of 5</span>
                  <h2 className="text-3xl font-bold text-white">{STEPS[currentStep].title}</h2>
                </div>

                <div className="flex-1 space-y-3">
                  <Controller
                    name={currentField}
                    control={control}
                    render={({ field }) => (
                      <>
                        {currentOptions.map((option) => (
                          <div 
                            key={option}
                            onClick={() => {
                              field.onChange(option);
                              // Auto-advance after small delay for Stripe-like feel
                              setTimeout(() => onNext(), 300);
                            }}
                            className={`p-4 rounded-xl border cursor-pointer transition-all ${
                              field.value === option 
                                ? 'bg-brand-500/20 border-brand-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]' 
                                : 'bg-slate-900/50 border-slate-700 hover:border-brand-500/50 hover:bg-slate-800/50'
                            } flex items-center justify-between`}
                          >
                            <span className="text-slate-100 font-medium">{option}</span>
                            {field.value === option && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                              >
                                <CheckCircle2 className="w-5 h-5 text-brand-500" />
                              </motion.div>
                            )}
                          </div>
                        ))}
                      </>
                    )}
                  />
                  {errors[currentField] && (
                    <p className="text-red-400 text-sm mt-2">{errors[currentField]?.message}</p>
                  )}
                </div>

                <div className="mt-8 flex justify-between">
                  <Button 
                    variant="ghost" 
                    onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
                    disabled={currentStep === 0}
                  >
                    Back
                  </Button>
                  <Button onClick={() => onNext()}>
                    Continue <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="generating"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex-1 flex flex-col items-center justify-center text-center py-12"
              >
                {isSubmitting ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="w-24 h-24 rounded-full border-b-2 border-l-2 border-brand-500 mb-8"
                    />
                    <h2 className="text-2xl font-bold text-white mb-2">Analyzing your profile...</h2>
                    <p className="text-slate-400">Our AI is crunching the numbers to generate your initial Eco Score.</p>
                  </>
                ) : (
                  <>
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", bounce: 0.5 }}
                      className="w-32 h-32 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.4)] mb-8 relative"
                    >
                      <Sparkles className="absolute top-0 right-0 w-8 h-8 text-yellow-300 transform translate-x-1/2 -translate-y-1/2" />
                      <span className="text-5xl font-bold text-white">{score}</span>
                    </motion.div>
                    <h2 className="text-3xl font-bold text-white mb-4">Your Eco Score is ready!</h2>
                    <p className="text-slate-400 max-w-sm mb-8">
                      Based on your lifestyle, you're starting with a score of {score}. Let's see how we can improve it together.
                    </p>
                    <Button size="lg" className="w-full" onClick={() => onNext()}>
                      Go to Dashboard <ChevronRight className="w-5 h-5 ml-2" />
                    </Button>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </GlassPanel>
      </div>
    </div>
  );
}
