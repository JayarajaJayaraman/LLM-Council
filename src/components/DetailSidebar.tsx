import { motion, AnimatePresence } from 'motion/react';
import { X, User, MessageSquare, Send, Inbox, Sparkles, Star } from 'lucide-react';
import { CouncilMember, CouncilResponse, ModelId, CouncilConfig } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { cn } from '../lib/utils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  memberId: ModelId | null;
  response?: CouncilResponse;
  config: CouncilConfig;
}

export function DetailSidebar({ isOpen, onClose, memberId, response, config }: Props) {
  const member = memberId === 'chairman' ? config.chairman : config.members.find(m => m.id === memberId);

  if (!member) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-sm dark:bg-black/40"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 z-[70] h-full w-full max-w-xl border-l border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950"
          >
            <div className="flex h-full flex-col">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-zinc-100 p-6 dark:border-zinc-800">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
                    {memberId === 'chairman' ? <Sparkles size={24} /> : <User size={24} />}
                  </div>
                  <div>
                    <h2 className="font-serif text-xl font-bold italic">{member.name}</h2>
                    <p className="text-xs font-medium uppercase tracking-widest text-zinc-500">{member.role}</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-900 dark:hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-10">
                {/* Initial Opinion */}
                {response && (
                  <section className="space-y-4">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                      <MessageSquare size={14} />
                      Initial Opinion
                    </div>
                    <div className="rounded-2xl border border-zinc-100 bg-zinc-50/50 p-6 dark:border-zinc-800 dark:bg-zinc-900/30">
                      <MarkdownRenderer content={response.content} />
                    </div>
                  </section>
                )}

                {/* Critiques Written */}
                {response && response.critiquesWritten.length > 0 && (
                  <section className="space-y-4">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                      <Send size={14} />
                      Critiques Written (To Peers)
                    </div>
                    <div className="space-y-4">
                      {response.critiquesWritten.map((critique, i) => {
                        const target = config.members.find(m => m.id === critique.toId);
                        return (
                          <div key={i} className="rounded-2xl border border-zinc-100 p-6 dark:border-zinc-800">
                            <div className="mb-3 flex items-center gap-2 text-xs font-bold text-zinc-500">
                              Critique of {target?.name}
                            </div>
                            <MarkdownRenderer content={critique.content} />
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}

                {/* Critiques Received */}
                {response && response.critiquesReceived.length > 0 && (
                  <section className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                        <Inbox size={14} />
                        Critiques Received
                      </div>
                      <div className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                        Panel of Critics
                      </div>
                    </div>
                    <div className="space-y-4">
                      {response.critiquesReceived.map((critique, i) => {
                        const source = config.members.find(m => m.id === critique.fromId);
                        return (
                          <div key={i} className="group relative rounded-2xl border border-zinc-100 bg-zinc-50/30 p-6 transition-all hover:border-amber-200 hover:bg-amber-50/10 dark:border-zinc-800 dark:bg-zinc-900/20 dark:hover:border-amber-900/50">
                            <div className="mb-4 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500 text-white shadow-sm">
                                  <Star size={12} className="fill-current" />
                                </div>
                                <span className="text-xs font-bold text-zinc-900 dark:text-white">
                                  Review by {source?.name}
                                </span>
                              </div>
                              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                                {source?.role}
                              </span>
                            </div>
                            <div className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                              <MarkdownRenderer content={critique.content} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}

                {memberId === 'chairman' && !response && (
                  <div className="flex flex-col items-center justify-center py-20 text-center text-zinc-400">
                    <Sparkles size={48} className="mb-4 opacity-20" />
                    <p>The Chairman is waiting for the council's discussion to conclude.</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
