
import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Logo } from '@/components/ui/Logo';

const AuthLayout = () => {
  return (
    <div className="flex min-h-screen bg-slate-950">
      {/* Left side: Animated Brand Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-slate-900 flex-col justify-between p-12">
        {/* Abstract background elements */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-brand-900/40 via-slate-900/10 to-slate-950"></div>
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute -top-1/4 -right-1/4 w-[800px] h-[800px] rounded-full bg-brand-500/10 blur-[120px]"
          />
          <motion.div 
            animate={{ 
              scale: [1, 1.5, 1],
              opacity: [0.2, 0.4, 0.2]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear", delay: 2 }}
            className="absolute -bottom-1/4 -left-1/4 w-[600px] h-[600px] rounded-full bg-emerald-600/10 blur-[100px]"
          />
        </div>

        {/* Content */}
        <div className="relative z-10">
          <Logo />
        </div>
        
        <div className="relative z-10 max-w-xl">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-5xl font-bold text-white leading-tight mb-6"
          >
            Empower your ecosystem with <span className="text-brand-400">intelligent insights</span>.
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-lg text-slate-400"
          >
            Join the premium SaaS platform that transforms your raw data into actionable intelligence with state-of-the-art AI.
          </motion.p>
        </div>
        
        <div className="relative z-10 text-sm text-slate-500">
          &copy; {new Date().getFullYear()} Ecosense AI. All rights reserved.
        </div>
      </div>

      {/* Right side: Form Area */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 relative">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 flex justify-center">
            <Logo />
          </div>
          
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
