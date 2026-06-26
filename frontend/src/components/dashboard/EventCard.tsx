import { motion } from 'framer-motion';
import { Users, Calendar, Award, CheckCircle2, ChevronRight, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface EventCardProps {
  event: any;
  onJoin: (id: string) => void;
  onClose?: () => void;
  joining: boolean;
}

export default function EventCard({ event, onJoin, onClose, joining }: EventCardProps) {
  const isJoined = event.joined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      className="bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-2xl overflow-hidden shadow-2xl min-w-[320px] max-w-sm pointer-events-auto"
    >
      <div className="h-32 bg-gradient-to-br from-emerald-600/40 to-slate-900 relative">
        <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-sm px-3 py-1 rounded-full border border-slate-700 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span className="text-xs font-semibold text-gray-200 uppercase tracking-wider">{event.type}</span>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-white/50 hover:text-white bg-slate-900/50 hover:bg-slate-800 rounded-full p-1.5 transition-colors"
          >
            <CheckCircle2 className="w-4 h-4 rotate-45" />
          </button>
        )}
      </div>
      
      <div className="p-5 -mt-6">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 shadow-lg mb-4">
          <h3 className="text-xl font-bold text-white mb-2 leading-tight">{event.title}</h3>
          <p className="text-sm text-slate-400 line-clamp-2">{event.description}</p>
        </div>
        
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-3 text-sm text-slate-300">
            <Calendar className="w-4 h-4 text-emerald-400" />
            {new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-300">
            <Users className="w-4 h-4 text-blue-400" />
            {event.participants_count} volunteers attending
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-300">
            <Award className="w-4 h-4 text-yellow-400" />
            Earn {event.points_reward} eco points
          </div>
        </div>

        <div className="flex gap-3">
          <Button 
            variant="ghost" 
            className="flex-1 bg-slate-800 hover:bg-slate-700 border-slate-600 h-11"
          >
            <Share2 className="w-4 h-4 mr-2" /> Share
          </Button>
          
          <Button 
            onClick={() => onJoin(event.id)}
            disabled={isJoined || joining}
            className={`flex-1 h-11 shadow-lg ${
              isJoined 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white'
            }`}
          >
            {joining ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Joining
              </span>
            ) : isJoined ? (
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Joined
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Join Event <ChevronRight className="w-4 h-4" />
              </span>
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
