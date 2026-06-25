import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronRight, Shield, Zap, Globe, BarChart3, Database } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
import { GlassPanel } from '@/components/ui/Card';
import Earth from './Earth';

const LandingPage = () => {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <div className="min-h-screen bg-[#020817] text-slate-50 selection:bg-brand-500/30 overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#020817]/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Logo />
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#demo" className="hover:text-white transition-colors">Platform</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/auth/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
              Sign in
            </Link>
            <Link to="/auth/signup">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center pt-20">
        <motion.div style={{ y, opacity }} className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-brand-900/20 via-[#020817] to-[#020817]"></div>
        </motion.div>

        {/* 3D Canvas Container */}
        <div className="absolute inset-0 z-0">
          <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
            <Suspense fallback={null}>
              <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
              <ambientLight intensity={0.5} />
              <directionalLight position={[10, 10, 5]} intensity={1.5} />
              <Earth />
              <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} maxPolarAngle={Math.PI / 2} minPolarAngle={Math.PI / 2} />
            </Suspense>
          </Canvas>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center h-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 text-brand-400 text-sm font-medium mb-6 border border-brand-500/20">
              <SparklesIcon className="w-4 h-4" />
              <span>The future of carbon intelligence</span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight mb-6 leading-tight">
              Intelligence for a <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-brand-600">sustainable</span> future.
            </h1>
            <p className="text-lg lg:text-xl text-slate-400 mb-8 max-w-lg leading-relaxed">
              ECOSENSE AI transforms your complex environmental data into clear, actionable insights. Build your digital twin and optimize your footprint instantly.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link to="/auth/signup">
                <Button size="lg" className="h-14 px-8 text-base">
                  Start your journey <ChevronRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Button variant="ghost" size="lg" className="h-14 px-8 text-base border border-slate-800">
                View documentation
              </Button>
            </div>
          </motion.div>
          {/* Empty div for grid alignment, Earth is behind */}
          <div className="hidden lg:block"></div>
        </div>
      </section>

      {/* Features Bento Box */}
      <section id="features" className="py-32 relative z-10 bg-[#020817]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-3xl lg:text-5xl font-bold mb-4">Powerful primitives for sustainability.</h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Everything you need to measure, manage, and reduce your carbon footprint, packaged in a beautiful interface.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 auto-rows-[300px]">
            <GlassPanel className="md:col-span-2 flex flex-col justify-between group">
              <div>
                <Database className="w-10 h-10 text-brand-500 mb-4" />
                <h3 className="text-2xl font-bold mb-2">Automated Data Ingestion</h3>
                <p className="text-slate-400 max-w-sm">Connect your utility providers and smart home devices. We handle the rest with seamless, real-time sync.</p>
              </div>
              <div className="h-32 rounded-lg bg-gradient-to-t from-slate-900 to-slate-800/50 border border-white/5 relative overflow-hidden group-hover:border-brand-500/30 transition-colors">
                <div className="absolute bottom-0 w-full h-1/2 bg-brand-500/20 blur-2xl"></div>
              </div>
            </GlassPanel>

            <GlassPanel className="flex flex-col justify-between group">
              <div>
                <Zap className="w-10 h-10 text-amber-500 mb-4" />
                <h3 className="text-xl font-bold mb-2">Real-time Analysis</h3>
                <p className="text-slate-400">Millisecond latency on carbon emission calculations.</p>
              </div>
            </GlassPanel>

            <GlassPanel className="flex flex-col justify-between group">
              <div>
                <Globe className="w-10 h-10 text-blue-500 mb-4" />
                <h3 className="text-xl font-bold mb-2">Global Grid Factors</h3>
                <p className="text-slate-400">Hyper-localized emissions factors based on your exact region.</p>
              </div>
            </GlassPanel>

            <GlassPanel className="md:col-span-2 flex flex-col justify-between group">
              <div>
                <BarChart3 className="w-10 h-10 text-brand-500 mb-4" />
                <h3 className="text-2xl font-bold mb-2">AI-Powered Recommendations</h3>
                <p className="text-slate-400 max-w-sm">Our ML models analyze your behavior patterns to suggest the most impactful reduction strategies.</p>
              </div>
            </GlassPanel>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-24 border-y border-white/5 bg-slate-900/20 relative z-10">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <Shield className="w-12 h-12 text-slate-400 mx-auto mb-6" />
          <h2 className="text-2xl font-bold mb-8">Enterprise-grade security by design</h2>
          <div className="flex flex-wrap justify-center gap-8 opacity-50 grayscale">
            {/* Logos placeholders */}
            <div className="text-xl font-bold tracking-widest">SOC 2 TYPE II</div>
            <div className="text-xl font-bold tracking-widest">GDPR READY</div>
            <div className="text-xl font-bold tracking-widest">ISO 27001</div>
            <div className="text-xl font-bold tracking-widest">HIPAA</div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-32 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-3xl lg:text-5xl font-bold mb-4">Simple, transparent pricing.</h2>
            <p className="text-slate-400 text-lg">Start for free, upgrade when you need more power.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <GlassPanel className="flex flex-col">
              <h3 className="text-xl font-medium text-slate-300 mb-2">Starter</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold">$0</span>
                <span className="text-slate-500">/mo</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex gap-3 text-slate-300"><CheckIcon className="w-5 h-5 text-brand-500 shrink-0" /> Basic Eco Score</li>
                <li className="flex gap-3 text-slate-300"><CheckIcon className="w-5 h-5 text-brand-500 shrink-0" /> Manual data entry</li>
                <li className="flex gap-3 text-slate-300"><CheckIcon className="w-5 h-5 text-brand-500 shrink-0" /> Monthly reports</li>
              </ul>
              <Button variant="secondary" className="w-full">Get Started</Button>
            </GlassPanel>

            <GlassPanel className="flex flex-col border-brand-500/50 relative">
              <div className="absolute -top-4 inset-x-0 flex justify-center">
                <span className="bg-brand-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Most Popular</span>
              </div>
              <h3 className="text-xl font-medium text-brand-400 mb-2">Pro</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold">$19</span>
                <span className="text-slate-500">/mo</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex gap-3 text-slate-300"><CheckIcon className="w-5 h-5 text-brand-500 shrink-0" /> Real-time API integrations</li>
                <li className="flex gap-3 text-slate-300"><CheckIcon className="w-5 h-5 text-brand-500 shrink-0" /> AI Recommendations</li>
                <li className="flex gap-3 text-slate-300"><CheckIcon className="w-5 h-5 text-brand-500 shrink-0" /> Advanced Digital Twin</li>
                <li className="flex gap-3 text-slate-300"><CheckIcon className="w-5 h-5 text-brand-500 shrink-0" /> Export to CSV/PDF</li>
              </ul>
              <Button className="w-full">Start 14-day free trial</Button>
            </GlassPanel>

            <GlassPanel className="flex flex-col lg:mt-0 md:mt-8">
              <h3 className="text-xl font-medium text-slate-300 mb-2">Enterprise</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold">Custom</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex gap-3 text-slate-300"><CheckIcon className="w-5 h-5 text-brand-500 shrink-0" /> Dedicated success manager</li>
                <li className="flex gap-3 text-slate-300"><CheckIcon className="w-5 h-5 text-brand-500 shrink-0" /> Custom integrations</li>
                <li className="flex gap-3 text-slate-300"><CheckIcon className="w-5 h-5 text-brand-500 shrink-0" /> SLA guarantee</li>
                <li className="flex gap-3 text-slate-300"><CheckIcon className="w-5 h-5 text-brand-500 shrink-0" /> Audit logging</li>
              </ul>
              <Button variant="secondary" className="w-full">Contact Sales</Button>
            </GlassPanel>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#020817] py-12 relative z-10">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-8">
          <div className="col-span-2">
            <Logo className="mb-4" />
            <p className="text-slate-500 max-w-xs">Building the intelligence layer for global sustainability.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-slate-400 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Changelog</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-slate-400 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
};

function SparklesIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
    </svg>
  );
}

function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export default LandingPage;
