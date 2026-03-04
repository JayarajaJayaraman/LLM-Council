import { motion, AnimatePresence } from 'motion/react';
import { X, Clock, Trash2, MessageSquare } from 'lucide-react';
import { CouncilSession } from '../types';
import { cn } from '../lib/utils';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: CouncilSession[];
  onSelect: (session: CouncilSession) => void;
  onClear: () => void;
  onDelete: (id: string) => void;
}

export function HistoryModal({ isOpen, onClose, history, onSelect, onClear, onDelete }: HistoryModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-sm dark:bg-black/40"
          />
          <motion.div
            initial={{ opacity: 0, x: 400 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 400 }}
            className="fixed inset-y-0 right-0 z-[70] w-full max-w-md border-l border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950"
          >
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4 dark:border-zinc-900">
                <div className="flex items-center gap-2">
                  <Clock size={18} className="text-zinc-400" />
                  <h2 className="font-serif text-xl font-bold italic">Session History</h2>
                </div>
                <div className="flex items-center gap-2">
                  {history.length > 0 && (
                    <button
                      onClick={() => {
                        if (confirm('Clear all history?')) onClear();
                      }}
                      className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
                      title="Clear All"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="rounded-full p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-900 dark:hover:text-white"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {history.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center text-zinc-500">
                    <Clock size={48} className="mb-4 opacity-10" />
                    <p className="text-sm">No sessions found.</p>
                    <p className="text-xs opacity-60">Your debate history will appear here.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {history.map((session) => (
                      <div
                        key={session.id}
                        className="group relative rounded-2xl border border-zinc-100 bg-zinc-50/50 p-4 transition-all hover:border-zinc-200 dark:border-zinc-900 dark:bg-zinc-900/30"
                      >
                        <div
                          onClick={() => {
                            onSelect(session);
                            onClose();
                          }}
                          className="cursor-pointer space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                              {new Date(session.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className="line-clamp-2 text-sm font-medium leading-relaxed text-zinc-900 dark:text-zinc-100">
                            {session.query}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(session.id);
                          }}
                          className="absolute right-4 top-4 opacity-0 transition-opacity group-hover:opacity-100 text-zinc-400 hover:text-red-500"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
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
