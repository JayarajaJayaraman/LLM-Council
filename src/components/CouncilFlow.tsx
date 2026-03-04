import { motion } from 'motion/react';
import { ModelId, MemberStatus, CouncilResponse, CouncilConfig } from '../types';
import { cn } from '../lib/utils';
import { User, Sparkles, RefreshCcw, CheckCircle2, Database, Zap, ArrowRight } from 'lucide-react';
import { getProviderIcon } from '../lib/icons';

interface Props {
  stage: 'idle' | 'stage1' | 'stage2' | 'stage3' | 'complete';
  memberStatuses: Record<ModelId, MemberStatus>;
  opinions: CouncilResponse[];
  config: CouncilConfig;
  onNodeClick: (id: ModelId) => void;
}

export function CouncilFlow({ stage, memberStatuses, opinions, config, onNodeClick }: Props) {
  const isStage1 = stage === 'stage1';
  const isStage2 = stage === 'stage2';
  const isStage3 = stage === 'stage3';
  const isComplete = stage === 'complete';

  const enabledMembers = config.members.filter(m => m.enabled);
  const nodeSpacing = 140;
  const startY = 120;
  const canvasHeight = Math.max(550, enabledMembers.length * nodeSpacing + 100);

  const isChatOnly = config.executionMode === 'chat';
  const isRankingOnly = config.executionMode === 'ranking';

  return (
    <div className="w-full overflow-x-auto py-4">
      <div 
        className="min-w-[1000px] relative mx-auto rounded-3xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 overflow-hidden shadow-inner"
        style={{ height: `${canvasHeight}px` }}
      >
        {/* Grid Background */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

        {/* SVG Layer for Connections */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
          <defs>
            <linearGradient id="activeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0" />
              <stop offset="50%" stopColor="#8b5cf6" stopOpacity="1" />
              <stop offset="100%" stopColor="#ec4899" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#60a5fa" />
            </linearGradient>
            <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#a78bfa" />
            </linearGradient>
            <linearGradient id="emeraldGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#34d399" />
            </linearGradient>
          </defs>

          {/* Stage 1 to Stage 2 Connections */}
          {!isChatOnly && enabledMembers.map((_, i) => (
            <CurvedPath 
              key={`s1-s2-${i}`}
              start={{ x: 300, y: startY + i * nodeSpacing }}
              end={{ x: 420, y: startY + i * nodeSpacing }}
              active={isStage1 || isStage2 || isStage3 || isComplete}
              animating={isStage1}
              color={isStage1 ? "text-indigo-500" : "text-zinc-200 dark:text-zinc-800"}
            />
          ))}

          {/* Stage 2 Cross-Review Connections */}
          {isStage2 && !isChatOnly && enabledMembers.map((reviewer, i) => {
            const peers = enabledMembers.filter(m => m.id !== reviewer.id);
            return peers.map((peer, j) => {
              const peerIndex = enabledMembers.findIndex(m => m.id === peer.id);
              return (
                <CurvedPath 
                  key={`review-${i}-${j}`}
                  start={{ x: 580, y: startY + i * nodeSpacing }} 
                  end={{ x: 420, y: startY + peerIndex * nodeSpacing }} 
                  active 
                  animating 
                  color={i % 2 === 0 ? "text-blue-400" : "text-purple-400"} 
                />
              );
            });
          })}

          {/* Stage 2 to Stage 3 Connections */}
          {!isChatOnly && !isRankingOnly && enabledMembers.map((_, i) => (
            <CurvedPath 
              key={`s2-s3-${i}`}
              start={{ x: 580, y: startY + i * nodeSpacing }}
              end={{ x: 750, y: canvasHeight / 2 }}
              active={isStage2 || isStage3 || isComplete}
              animating={isStage2}
              color={isStage2 ? "text-purple-500" : "text-zinc-200 dark:text-zinc-800"}
            />
          ))}
        </svg>

        {/* Nodes Layer */}
        <div className="absolute inset-0 flex justify-between px-10" style={{ zIndex: 10 }}>
          
          {/* Column 1: First Opinions */}
          <div className="flex flex-col justify-center gap-[40px] w-72">
            <div className="mb-2 flex items-center gap-2 px-2">
              <div className="flex h-5 w-5 items-center justify-center rounded bg-zinc-100 text-[10px] font-bold dark:bg-zinc-800">1</div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">First Opinions</span>
            </div>
            {enabledMembers.map((member) => (
              <WorkflowNode 
                key={member.id}
                member={member}
                status={memberStatuses[member.id]}
                response={opinions.find(o => o.modelId === member.id)}
                isActive={isStage1 && memberStatuses[member.id] === 'generating'}
                onClick={() => onNodeClick(member.id)}
                type="opinion"
              />
            ))}
          </div>

          {/* Column 2: Peer Review */}
          {!isChatOnly && (
            <div className="flex flex-col justify-center gap-[40px] w-64">
              <div className="mb-2 flex items-center gap-2 px-2">
                <div className="flex h-5 w-5 items-center justify-center rounded bg-zinc-100 text-[10px] font-bold dark:bg-zinc-800">2</div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Peer Review</span>
              </div>
              {enabledMembers.map((member) => (
                <WorkflowNode 
                  key={`${member.id}-review`}
                  member={member}
                  status={memberStatuses[member.id]}
                  isActive={isStage2 && memberStatuses[member.id] === 'reviewing'}
                  onClick={() => onNodeClick(member.id)}
                  type="review"
                />
              ))}
            </div>
          )}

          {/* Column 3: Synthesis */}
          {!isChatOnly && !isRankingOnly && (
            <div className="flex flex-col justify-center w-64">
              <div className="mb-2 flex items-center gap-2 px-2">
                <div className="flex h-5 w-5 items-center justify-center rounded bg-zinc-100 text-[10px] font-bold dark:bg-zinc-800">3</div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Synthesis</span>
              </div>
              <WorkflowNode 
                member={config.chairman}
                status={memberStatuses['chairman']}
                isActive={isStage3}
                onClick={() => onNodeClick('chairman')}
                type="synthesis"
                large
              />
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function WorkflowNode({ member, status, response, isActive, onClick, type, large }: { 
  member: any, 
  status: MemberStatus, 
  response?: CouncilResponse,
  isActive: boolean, 
  onClick: () => void,
  type: 'opinion' | 'review' | 'synthesis',
  large?: boolean
}) {
  const isComplete = status === 'complete';
  const isWorking = status === 'generating' || status === 'reviewing';

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "group relative flex flex-col gap-2 rounded-2xl border p-4 transition-all duration-500 cursor-pointer shadow-sm",
        isActive ? "border-transparent bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-xl shadow-indigo-500/20 scale-105 z-20" :
        isComplete ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/30 dark:bg-emerald-900/10" :
        "border-zinc-200 bg-white/80 backdrop-blur-sm hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950/80"
      )}
    >
      {/* Port Indicators */}
      <div className={cn(
        "absolute -left-1.5 top-1/2 -translate-y-1/2 h-3 w-3 rounded-full border-2 transition-colors",
        isActive ? "border-white bg-indigo-600" : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
      )} />
      <div className={cn(
        "absolute -right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 rounded-full border-2 transition-colors",
        isActive ? "border-white bg-indigo-600" : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
      )} />

      <div className="flex items-center gap-3">
        <div className={cn(
          "flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-500 shadow-sm",
          isActive ? "bg-white/20 rotate-12" : isComplete ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-zinc-100 dark:bg-zinc-900"
        )}>
          {isWorking ? (
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
              <RefreshCcw size={14} />
            </motion.div>
          ) : type === 'synthesis' ? (
            <Sparkles size={16} className={cn(isComplete ? "text-emerald-600" : "")} />
          ) : (
            getProviderIcon(member.provider, 14)
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold truncate tracking-tight">{member.name}</span>
            {isComplete && <CheckCircle2 size={10} className="text-emerald-500 flex-shrink-0" />}
          </div>
          <div className={cn(
            "text-[9px] uppercase tracking-widest font-bold opacity-50",
            isActive && "animate-pulse"
          )}>
            {isActive ? 'Active' : isComplete ? 'Done' : 'Idle'}
          </div>
        </div>
      </div>

      {/* Response Snippet for Stage 1 */}
      {type === 'opinion' && response && (
        <div className={cn(
          "mt-1 rounded-lg p-2 text-[10px] leading-relaxed line-clamp-2",
          isActive ? "bg-white/10 text-white/80" : "bg-zinc-50 text-zinc-500 dark:bg-zinc-900/50"
        )}>
          {response.content}
        </div>
      )}
    </motion.div>
  );
}

function CurvedPath({ start, end, active, animating, color = "text-zinc-200 dark:text-zinc-800" }: { 
  start: { x: number, y: number }, 
  end: { x: number, y: number },
  active: boolean,
  animating?: boolean,
  color?: string
}) {
  const midX = (start.x + end.x) / 2;
  const path = `M ${start.x} ${start.y} C ${midX} ${start.y}, ${midX} ${end.y}, ${end.x} ${end.y}`;

  return (
    <g className={cn("transition-opacity duration-500", active ? "opacity-100" : "opacity-10")}>
      <path
        d={path}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className={color}
      />
      {animating && (
        <motion.circle
          r="3"
          fill="currentColor"
          className={cn(color === "text-zinc-200 dark:text-zinc-800" ? "text-blue-500" : color)}
        >
          <animateMotion
            dur="2s"
            repeatCount="indefinite"
            path={path}
          />
        </motion.circle>
      )}
    </g>
  );
}
