import { useState } from 'react';
import { motion } from 'motion/react';
import { CouncilMember, CouncilResponse, ModelId } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { cn } from '../lib/utils';
import { User, MessageSquare, Star, MessageCircle, ShieldCheck, Edit2, Check } from 'lucide-react';
import { getProviderIcon, getProviderColor, getProviderBg } from '../lib/icons';

interface Props {
  member: CouncilMember;
  response?: CouncilResponse;
  isActive: boolean;
  onClick: () => void;
  onRename?: (id: ModelId, newName: string) => void;
}

export function CouncilMemberCard({ member, response, isActive, onClick, onRename }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(member.name);
  const critiqueCount = response?.critiquesReceived.length || 0;
  const writtenCount = response?.critiquesWritten.length || 0;
  const providerColor = getProviderColor(member.provider);
  const providerBg = getProviderBg(member.provider);

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim() && onRename) {
      onRename(member.id, newName.trim());
    }
    setIsEditing(false);
  };

  return (
    <motion.div
      layout
      onClick={isEditing ? undefined : onClick}
      className={cn(
        "group relative cursor-pointer rounded-2xl border p-5 transition-all duration-500",
        isActive 
          ? "border-transparent bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white shadow-2xl shadow-indigo-500/30 scale-[1.02] z-10" 
          : "border-zinc-200 bg-white/80 backdrop-blur-sm hover:border-indigo-300 hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-950/80 dark:hover:border-indigo-700"
      )}
    >
      {/* Background Glow for Active */}
      {isActive && (
        <div className="absolute -inset-2 rounded-3xl bg-indigo-500/20 blur-2xl -z-10 animate-pulse" />
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={cn(
            "flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-500 shadow-sm shrink-0",
            isActive ? "bg-white/20 rotate-6" : cn("bg-zinc-100 dark:bg-zinc-900", providerBg)
          )}>
            <User size={24} className={cn(isActive ? "text-white" : providerColor)} />
          </div>
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <form onSubmit={handleRenameSubmit} className="flex items-center gap-1">
                <input
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onBlur={handleRenameSubmit}
                  className={cn(
                    "w-full bg-transparent text-sm font-bold tracking-tight outline-none border-b border-white/30",
                    isActive ? "text-white" : "text-zinc-900 dark:text-white"
                  )}
                />
                <button type="submit" className="shrink-0">
                  <Check size={14} className={isActive ? "text-white" : "text-emerald-500"} />
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-2 group/name">
                <h3 className="text-sm font-bold tracking-tight truncate">{member.name}</h3>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditing(true);
                  }}
                  className="opacity-0 group-hover/name:opacity-100 transition-opacity"
                >
                  <Edit2 size={12} className={isActive ? "text-white/70" : "text-zinc-400"} />
                </button>
              </div>
            )}
            <p className={cn("text-[10px] font-bold uppercase tracking-widest opacity-60", isActive && "text-white/70")}>
              {member.role}
            </p>
          </div>
        </div>
        
        <div className={cn(
          "flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-500 shadow-sm shrink-0 ml-2",
          isActive ? "border-white/30 bg-white/20" : cn("border-zinc-100 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900", providerBg)
        )}>
          <div className={cn(isActive ? "text-white" : providerColor)}>
            {getProviderIcon(member.provider, 20)}
          </div>
        </div>
      </div>

      {/* Model Info */}
      <div className="mb-4 flex items-center gap-2">
        <div className={cn(
          "rounded-md px-2 py-1 text-[9px] font-bold uppercase tracking-wider",
          isActive ? "bg-white/10 text-white" : "bg-zinc-100 text-zinc-500 dark:bg-zinc-900"
        )}>
          {member.model}
        </div>
        {response && (
          <div className={cn(
            "flex items-center gap-1 rounded-md px-2 py-1 text-[9px] font-bold uppercase tracking-wider",
            isActive ? "bg-emerald-500/20 text-emerald-400" : "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"
          )}>
            <ShieldCheck size={10} />
            Verified
          </div>
        )}
      </div>

      {/* Response Preview */}
      {response ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-3">
              {critiqueCount > 0 && (
                <div className="flex items-center gap-1 text-[10px] font-bold text-amber-500">
                  <Star size={10} className="fill-current" />
                  {critiqueCount} Reviews
                </div>
              )}
              {writtenCount > 0 && (
                <div className="flex items-center gap-1 text-[10px] font-bold text-blue-500">
                  <MessageCircle size={10} />
                  {writtenCount} Written
                </div>
              )}
            </div>
            <div className={cn(
              "text-[10px] font-bold uppercase tracking-widest opacity-0 transition-opacity group-hover:opacity-100",
              isActive ? "text-white" : "text-zinc-900 dark:text-white"
            )}>
              Details →
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="flex h-20 items-center justify-center rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-300 dark:text-zinc-700">
            {isActive ? 'Processing...' : 'Awaiting Input'}
          </p>
        </div>
      )}
    </motion.div>
  );
}
