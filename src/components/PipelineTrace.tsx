import { motion } from 'motion/react';
import { ModelId, MemberStatus, CouncilMember, CouncilConfig } from '../types';
import { cn } from '../lib/utils';
import { Loader2, CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { getProviderIcon } from '../lib/icons';

interface Props {
  memberStatuses: Record<ModelId, MemberStatus>;
  config: CouncilConfig;
}

export function PipelineTrace({ memberStatuses, config }: Props) {
  const allMembers = [...config.members.filter(m => m.enabled), config.chairman];

  return (
    <div className="w-full space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Execution Trace</h3>
        <div className="flex gap-4">
          <StatusLegend icon={<Circle size={12} />} label="Idle" />
          <StatusLegend icon={<Loader2 size={12} className="animate-spin" />} label="Active" />
          <StatusLegend icon={<CheckCircle2 size={12} className="text-emerald-500" />} label="Done" />
        </div>
      </div>

      <div className="relative space-y-6">
        {/* Vertical line connecting nodes */}
        <div className="absolute left-[19px] top-2 bottom-2 w-[2px] bg-zinc-100 dark:bg-zinc-800" />

        {allMembers.map((member, index) => {
          const status = memberStatuses[member.id] || 'idle';
          return (
            <motion.div 
              key={member.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative flex items-center gap-4 pl-10"
            >
              {/* Node Icon */}
              <div className={cn(
                "absolute left-0 z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-500",
                status === 'idle' ? "border-zinc-100 bg-white text-zinc-300 dark:border-zinc-800 dark:bg-zinc-900" :
                status === 'generating' || status === 'reviewing' ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900 scale-110 shadow-lg" :
                status === 'complete' ? "border-emerald-500 bg-emerald-50 text-emerald-500 dark:bg-emerald-900/20" :
                "border-red-500 bg-red-50 text-red-500 dark:bg-red-900/20"
              )}>
                {status === 'idle' && getProviderIcon(member.provider, 16)}
                {(status === 'generating' || status === 'reviewing') && <Loader2 size={16} className="animate-spin" />}
                {status === 'complete' && <CheckCircle2 size={16} />}
                {status === 'error' && <AlertCircle size={16} />}
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className={cn(
                    "text-sm font-semibold transition-colors duration-500",
                    status === 'idle' ? "text-zinc-400" : "text-zinc-900 dark:text-zinc-100"
                  )}>
                    {member.name}
                  </span>
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-widest",
                    status === 'generating' ? "text-amber-500 animate-pulse" :
                    status === 'reviewing' ? "text-blue-500 animate-pulse" :
                    status === 'complete' ? "text-emerald-500" :
                    "text-zinc-400"
                  )}>
                    {status === 'generating' ? 'Generating Opinion...' :
                     status === 'reviewing' ? 'Reviewing Peers...' :
                     status === 'complete' ? 'Task Complete' :
                     status === 'error' ? 'Error' : 'Waiting...'}
                  </span>
                </div>
                <div className="h-1.5 w-full mt-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: status === 'complete' ? '100%' : (status === 'generating' || status === 'reviewing' ? '60%' : '0%') }}
                    className={cn(
                      "h-full transition-all duration-1000",
                      status === 'complete' ? "bg-emerald-500" : "bg-zinc-900 dark:bg-white"
                    )}
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function StatusLegend({ icon, label }: { icon: React.ReactNode, label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
      {icon}
      {label}
    </div>
  );
}
