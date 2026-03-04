import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Users, 
  MessageSquare, 
  CheckCircle2, 
  Loader2, 
  ChevronRight,
  Sparkles,
  RefreshCcw,
  History,
  Activity,
  Network,
  Settings,
  Copy,
  Download,
  Check,
  Globe,
  Zap
} from 'lucide-react';
import { 
  getFirstOpinions, 
  getReviews, 
  getFinalResponse 
} from './services/llmService';
import { DEFAULT_CONFIG } from './constants';
import { CouncilResponse, ModelId, MemberStatus, CouncilConfig, CouncilSession } from './types';
import { CouncilMemberCard } from './components/CouncilMemberCard';
import { MarkdownRenderer } from './components/MarkdownRenderer';
import { PipelineTrace } from './components/PipelineTrace';
import { CouncilFlow } from './components/CouncilFlow';
import { DetailSidebar } from './components/DetailSidebar';
import { SettingsModal } from './components/SettingsModal';
import { HistoryModal } from './components/HistoryModal';
import { cn } from './lib/utils';

type Stage = 'idle' | 'stage1' | 'stage2' | 'stage3' | 'complete';

export default function App() {
  const [query, setQuery] = useState('');
  const [stage, setStage] = useState<Stage>('idle');
  const [opinions, setOpinions] = useState<CouncilResponse[]>([]);
  const [finalResponse, setFinalResponse] = useState<string>('');
  const [activeMemberId, setActiveMemberId] = useState<ModelId | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<ModelId | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [config, setConfig] = useState<CouncilConfig>(DEFAULT_CONFIG);
  const [error, setError] = useState<string | null>(null);
  const [memberStatuses, setMemberStatuses] = useState<Record<ModelId, MemberStatus>>({});
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [history, setHistory] = useState<CouncilSession[]>([]);
  
  useEffect(() => {
    const savedHistory = localStorage.getItem('council_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (err) {
        console.error('Failed to load history:', err);
      }
    }
  }, []);

  const saveToHistory = (session: CouncilSession) => {
    const newHistory = [session, ...history].slice(0, 50);
    setHistory(newHistory);
    localStorage.setItem('council_history', JSON.stringify(newHistory));
  };

  const handleSelectHistory = (session: CouncilSession) => {
    setQuery(session.query);
    setOpinions(session.opinions);
    setFinalResponse(session.finalResponse);
    setStage('complete');
  };

  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem('council_history');
  };

  const handleDeleteHistory = (id: string) => {
    const newHistory = history.filter(s => s.id !== id);
    setHistory(newHistory);
    localStorage.setItem('council_history', JSON.stringify(newHistory));
  };
  
  useEffect(() => {
    const initialStatuses: Record<ModelId, MemberStatus> = { chairman: 'idle' };
    config.members.forEach(m => {
      initialStatuses[m.id] = 'idle';
    });
    setMemberStatuses(initialStatuses);
  }, [config]);

  const scrollRef = useRef<HTMLDivElement>(null);

  const updateMemberStatus = (id: ModelId, status: MemberStatus) => {
    setMemberStatuses(prev => ({ ...prev, [id]: status }));
  };

  const handleNodeClick = (id: ModelId) => {
    setSelectedMemberId(id);
    setIsSidebarOpen(true);
  };

  const handleRenameMember = (id: ModelId, newName: string) => {
    setConfig(prev => ({
      ...prev,
      members: prev.members.map(m => m.id === id ? { ...m, name: newName } : m),
      chairman: prev.chairman.id === id ? { ...prev.chairman, name: newName } : prev.chairman
    }));
  };

  const handleStop = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setStage('idle');
      setError('Generation stopped by user.');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(finalResponse);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([finalResponse], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `council-verdict-${Date.now()}.md`;
    a.click();
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim() || stage !== 'idle') return;

    const controller = new AbortController();
    setAbortController(controller);

    setError(null);
    setStage('stage1');
    setOpinions([]);
    setFinalResponse('');
    setActiveMemberId(null);
    
    const initialStatuses: Record<ModelId, MemberStatus> = { chairman: 'idle' };
    config.members.forEach(m => {
      initialStatuses[m.id] = 'idle';
    });
    setMemberStatuses(initialStatuses);

    try {
      // Stage 1: First Opinions
      const firstOpinions = await getFirstOpinions(query, config, updateMemberStatus, controller.signal);
      setOpinions(firstOpinions);
      setActiveMemberId(firstOpinions[0].modelId);
      
      if (config.executionMode === 'chat') {
        setStage('complete');
        saveToHistory({
          id: Date.now().toString(),
          query,
          opinions: firstOpinions,
          finalResponse: firstOpinions[0]?.content || '',
          timestamp: Date.now(),
          config
        });
        return;
      }

      // Stage 2: Review
      setStage('stage2');
      const reviewedOpinions = await getReviews(query, firstOpinions, config, updateMemberStatus, controller.signal);
      setOpinions(reviewedOpinions);

      if (config.executionMode === 'ranking') {
        setStage('complete');
        saveToHistory({
          id: Date.now().toString(),
          query,
          opinions: reviewedOpinions,
          finalResponse: reviewedOpinions[0]?.content || '',
          timestamp: Date.now(),
          config
        });
        return;
      }

      // Stage 3: Final Response
      setStage('stage3');
      const final = await getFinalResponse(query, reviewedOpinions, config, updateMemberStatus, controller.signal);
      setFinalResponse(final);
      setStage('complete');

      // Save to history
      saveToHistory({
        id: Date.now().toString(),
        query,
        opinions: reviewedOpinions,
        finalResponse: final,
        timestamp: Date.now(),
        config
      });
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Generation aborted');
      } else {
        console.error(err);
        setError(err.message || 'An unexpected error occurred. Please try again.');
        setStage('idle');
      }
    } finally {
      setAbortController(null);
    }
  };

  const reset = () => {
    setQuery('');
    setStage('idle');
    setOpinions([]);
    setFinalResponse('');
    setActiveMemberId(null);
    setSelectedMemberId(null);
    setIsSidebarOpen(false);
    setError(null);

    const initialStatuses: Record<ModelId, MemberStatus> = { chairman: 'idle' };
    config.members.forEach(m => {
      initialStatuses[m.id] = 'idle';
    });
    setMemberStatuses(initialStatuses);
  };

  useEffect(() => {
    if (stage === 'complete' && scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [stage]);

  return (
    <div className="min-h-screen bg-transparent text-zinc-900 selection:bg-indigo-100 dark:text-zinc-100 dark:selection:bg-indigo-900/30">
      <div className="mesh-bg" />
      
      {/* Detail Sidebar */}
      <DetailSidebar 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        memberId={selectedMemberId}
        response={opinions.find(o => o.modelId === selectedMemberId)}
        config={config}
      />

      {/* History Modal */}
      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelect={handleSelectHistory}
        onClear={handleClearHistory}
        onDelete={handleDeleteHistory}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        onSave={setConfig}
      />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-zinc-200/50 bg-white/60 backdrop-blur-xl dark:border-zinc-800/50 dark:bg-zinc-950/60">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white shadow-lg shadow-indigo-500/20">
              <Users size={20} />
            </div>
            <h1 className="font-serif text-2xl font-bold italic tracking-tight">
              LLM <span className="gradient-text">Council</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Quick Settings */}
            <div className="hidden md:flex items-center gap-2 rounded-xl bg-zinc-100/50 p-1 dark:bg-zinc-900/50 border border-zinc-200/50 dark:border-zinc-800/50">
              <button
                onClick={() => setConfig(prev => ({ ...prev, useWebSearch: !prev.useWebSearch }))}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all",
                  config.useWebSearch 
                    ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-white" 
                    : "text-zinc-400 hover:text-zinc-600"
                )}
              >
                <Globe size={12} />
                Search
              </button>
              <div className="h-4 w-[1px] bg-zinc-200 dark:bg-zinc-800" />
              <select
                value={config.executionMode}
                onChange={(e) => setConfig(prev => ({ ...prev, executionMode: e.target.value as any }))}
                className="bg-transparent text-[10px] font-bold uppercase tracking-widest text-zinc-500 outline-none cursor-pointer hover:text-zinc-900 dark:hover:text-white"
              >
                <option value="chat">Chat</option>
                <option value="ranking">Ranking</option>
                <option value="full">Full</option>
              </select>
            </div>

            <div className="h-4 w-[1px] bg-zinc-200 dark:bg-zinc-800" />
            
            <button 
              onClick={() => setIsHistoryOpen(true)}
              className="flex items-center gap-2 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
            >
              <History size={14} />
              History
            </button>
            <div className="h-4 w-[1px] bg-zinc-200 dark:bg-zinc-800" />
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-2 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
            >
              <Settings size={14} />
              Settings
            </button>
            <div className="h-4 w-[1px] bg-zinc-200 dark:bg-zinc-800" />
            {stage !== 'idle' && stage !== 'complete' && (
              <button 
                onClick={handleStop}
                className="flex items-center gap-2 text-xs font-medium text-red-500 hover:text-red-600"
              >
                <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                Stop Generation
              </button>
            )}
            {stage !== 'idle' && (
              <button 
                onClick={reset}
                className="flex items-center gap-2 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
              >
                <RefreshCcw size={14} />
                New Session
              </button>
            )}
            <div className="h-4 w-[1px] bg-zinc-200 dark:bg-zinc-800" />
            <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              <Sparkles size={12} className="text-amber-500" />
              Gemini Powered
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12">
        {/* Hero / Input Section */}
        <AnimatePresence mode="wait">
          {stage === 'idle' ? (
            <motion.div
              key="hero"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <h2 className="mb-6 font-serif text-5xl font-light leading-tight tracking-tight md:text-7xl">
                The <span className="gradient-text font-bold">Council</span> <br />
                <span className="italic text-zinc-400">is in session.</span>
              </h2>
              <p className="mb-12 max-w-lg text-zinc-500 text-lg">
                Submit your hardest questions. A panel of specialized models will debate, 
                peer-review, and synthesize a definitive answer.
              </p>

              <form onSubmit={handleSearch} className="relative w-full max-w-2xl group">
                <div className="absolute -inset-1 rounded-[22px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-20 blur-lg transition duration-1000 group-hover:opacity-40 group-hover:duration-200" />
                <div className="relative">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ask the council anything..."
                    className="h-18 w-full rounded-2xl border border-zinc-200 bg-white/80 px-8 pr-16 text-xl shadow-xl backdrop-blur-sm transition-all focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 dark:border-zinc-800 dark:bg-zinc-900/80 dark:focus:border-indigo-400"
                  />
                  <button
                    type="submit"
                    disabled={!query.trim()}
                    className="absolute right-3 top-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                  >
                    <ChevronRight size={24} />
                  </button>
                </div>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="discussion"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-12"
            >
              {/* User Query Display */}
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900/50">
                <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                  <History size={12} />
                  Your Question
                </div>
                <p className="text-xl font-medium leading-relaxed">{query}</p>
              </div>

              {/* Visual Flow Section */}
              <div className="rounded-3xl border border-zinc-200 bg-zinc-50/50 p-8 dark:border-zinc-800 dark:bg-zinc-900/30">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
                    <Network size={14} />
                    Live Execution Flow
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                    Click nodes to inspect data
                  </div>
                </div>
                <CouncilFlow 
                  stage={stage} 
                  memberStatuses={memberStatuses} 
                  opinions={opinions}
                  config={config}
                  onNodeClick={handleNodeClick}
                />
              </div>

              <div className="grid gap-8 lg:grid-cols-[1fr_350px]">
                <div className="space-y-12">
                  {/* Council Members Grid */}
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {config.members.filter(m => m.enabled).map((member) => (
                      <CouncilMemberCard
                        key={member.id}
                        member={member}
                        response={opinions.find(o => o.modelId === member.id)}
                        isActive={activeMemberId === member.id}
                        onClick={() => handleNodeClick(member.id)}
                        onRename={handleRenameMember}
                      />
                    ))}
                  </div>
                </div>

                {/* Sidebar with Pipeline Trace */}
                <aside className="space-y-8">
                  <div className="sticky top-24 space-y-8">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                        <Activity size={12} />
                        Pipeline Status
                      </div>
                      <div className="grid grid-cols-1 gap-3">
                        <StageIndicator 
                          label="1. Opinions" 
                          status={stage === 'stage1' ? 'loading' : 'complete'} 
                        />
                        <StageIndicator 
                          label="2. Review" 
                          status={stage === 'stage2' ? 'loading' : (stage === 'stage1' ? 'pending' : 'complete')} 
                        />
                        <StageIndicator 
                          label="3. Synthesis" 
                          status={stage === 'stage3' ? 'loading' : (stage === 'complete' ? 'complete' : 'pending')} 
                        />
                      </div>
                    </div>

                    <PipelineTrace memberStatuses={memberStatuses} config={config} />
                  </div>
                </aside>
              </div>

              {/* Error Message */}
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400">
                  {error}
                </div>
              )}

              {/* Final Response Section */}
              <AnimatePresence>
                {stage === 'complete' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6 pt-12 border-t border-zinc-200 dark:border-zinc-800"
                    ref={scrollRef}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
                          <Sparkles size={24} />
                        </div>
                        <div>
                          <h2 className="font-serif text-2xl font-bold italic">The Council's Verdict</h2>
                          <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Synthesized by {config.chairman.name}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleCopy}
                          className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-widest text-zinc-500 transition-all hover:border-zinc-900 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-100 dark:hover:text-white"
                        >
                          {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                          {copied ? 'Copied' : 'Copy'}
                        </button>
                        <button
                          onClick={handleDownload}
                          className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-widest text-zinc-500 transition-all hover:border-zinc-900 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-100 dark:hover:text-white"
                        >
                          <Download size={14} />
                          Markdown
                        </button>
                      </div>
                    </div>

                    <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
                      <MarkdownRenderer content={finalResponse} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function StageIndicator({ label, status }: { label: string, status: 'pending' | 'loading' | 'complete' }) {
  return (
    <div className={cn(
      "flex items-center justify-between rounded-2xl border p-4 transition-all duration-500 shadow-sm",
      status === 'loading' ? "border-indigo-500 bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : 
      status === 'complete' ? "border-emerald-200 bg-emerald-50/50 text-zinc-900 dark:border-emerald-900/30 dark:bg-emerald-900/10 dark:text-zinc-100" :
      "border-zinc-200 bg-white/50 text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900/30"
    )}>
      <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
      {status === 'loading' ? (
        <Loader2 size={16} className="animate-spin" />
      ) : status === 'complete' ? (
        <CheckCircle2 size={16} className="text-emerald-500" />
      ) : null}
    </div>
  );
}
