import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Settings2, 
  Plus, 
  Trash2, 
  Search, 
  Thermometer, 
  UserPlus, 
  Save, 
  Sparkles, 
  Database, 
  Users, 
  Network, 
  Globe, 
  Key, 
  Terminal, 
  Download, 
  Upload, 
  RotateCcw,
  Shield,
  Activity,
  AlertTriangle,
  Info
} from 'lucide-react';
import { CouncilConfig, CouncilMember, ProviderType, SearchProvider, SearchQueryProcessing } from '../types';
import { DEFAULT_CONFIG } from '../constants';
import { useState } from 'react';
import { cn } from '../lib/utils';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: CouncilConfig;
  onSave: (config: CouncilConfig) => void;
}

type TabId = 'sources' | 'keys' | 'council' | 'prompts' | 'search' | 'backup';

export function SettingsModal({ isOpen, onClose, config, onSave }: SettingsModalProps) {
  const [localConfig, setLocalConfig] = useState<CouncilConfig>(config);
  const [activeTab, setActiveTab] = useState<TabId>('council');
  const [promptStage, setPromptStage] = useState<1 | 2 | 3>(1);

  const handleUpdateMember = (id: string, updates: Partial<CouncilMember>) => {
    setLocalConfig(prev => ({
      ...prev,
      members: prev.members.map(m => m.id === id ? { ...m, ...updates } : m)
    }));
  };

  const handleUpdateChairman = (updates: Partial<CouncilMember>) => {
    setLocalConfig(prev => ({
      ...prev,
      chairman: { ...prev.chairman, ...updates }
    }));
  };

  const handleAddMember = (role: string = 'Specialist') => {
    const newId = `member-${Date.now()}`;
    let systemInstruction = 'You are a specialist in...';
    
    if (role === 'Analyst') {
      systemInstruction = 'You are a logical analyst. Focus on data, evidence, and objective reasoning. Deconstruct arguments and identify flaws.';
    } else if (role === 'Creative') {
      systemInstruction = 'You are a creative thinker. Explore unconventional ideas, lateral possibilities, and imaginative solutions. Think outside the box.';
    } else if (role === 'Critic') {
      systemInstruction = 'You are a constructive critic. Challenge assumptions, play devil\'s advocate, and ensure all angles are rigorously tested.';
    }

    const newMember: CouncilMember = {
      id: newId,
      name: `New ${role}`,
      role: role,
      model: 'gpt-4o',
      provider: 'openai',
      systemInstruction: systemInstruction,
      enabled: true,
      isLocal: false
    };
    setLocalConfig(prev => ({
      ...prev,
      members: [...prev.members, newMember]
    }));
  };

  const handleRemoveMember = (id: string) => {
    setLocalConfig(prev => ({
      ...prev,
      members: prev.members.filter(m => m.id !== id)
    }));
  };

  const toggleProvider = (provider: ProviderType) => {
    setLocalConfig(prev => ({
      ...prev,
      availableProviders: {
        ...prev.availableProviders,
        [provider]: !prev.availableProviders[provider]
      }
    }));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-4 top-[5%] z-[70] mx-auto flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-zinc-200/50 bg-white/80 shadow-2xl backdrop-blur-xl dark:border-zinc-800/50 dark:bg-zinc-950/80"
          >
            <div className="mesh-bg opacity-10" />
            <div className="relative flex h-full min-h-0">
              {/* Sidebar Tabs */}
              <div className="w-64 flex-shrink-0 border-r border-zinc-200/50 bg-zinc-100/30 p-6 dark:border-zinc-800/50 dark:bg-zinc-900/30">
                <div className="mb-8 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/20">
                    <Settings2 size={20} />
                  </div>
                  <h2 className="font-serif text-2xl font-bold italic tracking-tight">Settings</h2>
                </div>

                <nav className="space-y-1">
                  {[
                    { id: 'keys', label: 'LLM API Keys', icon: Key },
                    { id: 'sources', label: 'Available Sources', icon: Database },
                    { id: 'council', label: 'Council Config', icon: Users },
                    { id: 'prompts', label: 'System Prompts', icon: Terminal },
                    { id: 'search', label: 'Search Providers', icon: Search },
                    { id: 'backup', label: 'Backup & Reset', icon: RotateCcw },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as TabId)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-xs font-bold uppercase tracking-widest transition-all",
                        activeTab === tab.id
                          ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/20"
                          : "text-zinc-500 hover:bg-zinc-200/50 hover:text-zinc-900 dark:hover:bg-zinc-800/50 dark:hover:text-white"
                      )}
                    >
                      <tab.icon size={16} />
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Main Content Area */}
              <div className="flex flex-1 flex-col min-w-0">
                <div className="flex-1 overflow-y-auto p-10 [scrollbar-gutter:stable]">
                  {activeTab === 'sources' && (
                    <div className="max-w-2xl space-y-8">
                      <div>
                        <h3 className="text-xl font-bold">Available Model Sources</h3>
                        <p className="mt-2 text-sm text-zinc-500">Toggle which providers are available for the search generator, council members, and chairman.</p>
                        <p className="mt-1 text-[10px] italic text-zinc-400">Note: Non-chat models (embeddings, image generation, speech, OCR, etc.) are automatically filtered out.</p>
                      </div>

                      <div className="rounded-2xl border border-zinc-200/50 bg-white/50 p-8 shadow-sm backdrop-blur-sm dark:border-zinc-800/50 dark:bg-zinc-900/30">
                        <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                          <SourceToggle label="OpenRouter (Cloud)" enabled={localConfig.availableProviders.openrouter} onToggle={() => toggleProvider('openrouter')} />
                          <SourceToggle label="Local (Ollama)" enabled={localConfig.availableProviders.ollama} onToggle={() => toggleProvider('ollama')} />
                          <SourceToggle label="Groq (Fast Inference)" enabled={localConfig.availableProviders.groq} onToggle={() => toggleProvider('groq')} />
                          <SourceToggle label="Requesty" enabled={localConfig.availableProviders.custom} onToggle={() => toggleProvider('custom')} />
                        </div>
                        
                        <div className="my-8 h-[1px] bg-zinc-200/50 dark:bg-zinc-800/50" />
                        
                        <div className="space-y-6">
                          <div className="flex items-center gap-2">
                            <SourceToggle label="Direct Connections" enabled={true} onToggle={() => {}} readOnly />
                          </div>
                          <div className="grid grid-cols-3 gap-6">
                            <SourceToggle label="OpenAI" enabled={localConfig.availableProviders.openai} onToggle={() => toggleProvider('openai')} small />
                            <SourceToggle label="Anthropic" enabled={localConfig.availableProviders.anthropic} onToggle={() => toggleProvider('anthropic')} small />
                            <SourceToggle label="Google" enabled={localConfig.availableProviders.google} onToggle={() => toggleProvider('google')} small />
                            <SourceToggle label="Mistral" enabled={localConfig.availableProviders.mistral} onToggle={() => toggleProvider('mistral')} small />
                            <SourceToggle label="DeepSeek" enabled={localConfig.availableProviders.deepseek} onToggle={() => toggleProvider('deepseek')} small />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'council' && (
                    <div className="space-y-10">
                      <div className="space-y-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <h3 className="text-xl font-bold">Council Configuration</h3>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mr-2">Add Member:</span>
                            <button
                              onClick={() => handleAddMember('Analyst')}
                              className="flex items-center gap-1 rounded-lg bg-blue-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-blue-600 transition-all hover:bg-blue-500 hover:text-white dark:bg-blue-500/20 dark:text-blue-400"
                            >
                              <Plus size={12} />
                              Analyst
                            </button>
                            <button
                              onClick={() => handleAddMember('Creative')}
                              className="flex items-center gap-1 rounded-lg bg-purple-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-purple-600 transition-all hover:bg-purple-500 hover:text-white dark:bg-purple-500/20 dark:text-purple-400"
                            >
                              <Plus size={12} />
                              Creative
                            </button>
                            <button
                              onClick={() => handleAddMember('Critic')}
                              className="flex items-center gap-1 rounded-lg bg-amber-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-amber-600 transition-all hover:bg-amber-500 hover:text-white dark:bg-amber-500/20 dark:text-amber-400"
                            >
                              <Plus size={12} />
                              Critic
                            </button>
                            <button
                              onClick={() => {
                                const el = document.getElementById('chairman-section');
                                el?.scrollIntoView({ behavior: 'smooth' });
                              }}
                              className="flex items-center gap-1 rounded-lg bg-indigo-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-indigo-600 transition-all hover:bg-indigo-500 hover:text-white dark:bg-indigo-500/20 dark:text-indigo-400"
                            >
                              <Shield size={12} />
                              Chairman
                            </button>
                          </div>
                        </div>

                        <div className="space-y-6">
                          <div className="space-y-4">
                            <TemperatureSlider 
                              label="Council Heat" 
                              value={localConfig.councilTemperature} 
                              onChange={(v) => setLocalConfig(prev => ({ ...prev, councilTemperature: v }))} 
                            />
                            
                            <div className="flex items-start gap-3 rounded-xl bg-amber-50 p-4 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
                              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                              <p className="text-xs leading-relaxed">
                                <strong>Warning:</strong> Some selected models (e.g. GPT-5.1, o1) enforce fixed temperature and will ignore this setting.
                              </p>
                            </div>

                            <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                              <Info size={12} />
                              Stage 2 (Peer Ranking) has its own temperature setting. 
                              <button onClick={() => { setActiveTab('prompts'); setPromptStage(2); }} className="ml-1 font-bold text-zinc-500 underline hover:text-zinc-900 dark:hover:text-white">
                                Configure in System Prompts → Stage 2
                              </button>
                            </div>
                          </div>

                          <div className="grid gap-6 md:grid-cols-2">
                            {localConfig.members.map((member) => (
                              <div key={member.id} className="group relative rounded-2xl border border-zinc-200/50 bg-white/50 p-6 shadow-sm backdrop-blur-sm transition-all hover:border-indigo-500/50 hover:shadow-md dark:border-zinc-800/50 dark:bg-zinc-900/30">
                                <div className="mb-4 flex items-center justify-between">
                                  <div className="flex-1">
                                    <input
                                      value={member.name}
                                      onChange={(e) => handleUpdateMember(member.id, { name: e.target.value })}
                                      className="w-full bg-transparent font-serif text-lg font-bold italic outline-none focus:text-indigo-600 dark:focus:text-indigo-400"
                                    />
                                    <div className="flex items-center gap-2">
                                      <span className={cn(
                                        "text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded",
                                        member.role === 'Analyst' ? "bg-blue-500/10 text-blue-500" :
                                        member.role === 'Creative' ? "bg-purple-500/10 text-purple-500" :
                                        member.role === 'Critic' ? "bg-amber-500/10 text-amber-500" :
                                        "bg-zinc-500/10 text-zinc-500"
                                      )}>
                                        {member.role}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <div className="flex rounded-lg bg-zinc-100 p-1 dark:bg-zinc-900">
                                      <button
                                        onClick={() => handleUpdateMember(member.id, { isLocal: false })}
                                        className={cn(
                                          "rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest transition-all",
                                          !member.isLocal ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-white" : "text-zinc-400"
                                        )}
                                      >
                                        Remote
                                      </button>
                                      <button
                                        onClick={() => handleUpdateMember(member.id, { isLocal: true })}
                                        className={cn(
                                          "rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest transition-all",
                                          member.isLocal ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-white" : "text-zinc-400"
                                        )}
                                      >
                                        Local
                                      </button>
                                    </div>
                                    <Switch enabled={member.enabled || false} onToggle={() => handleUpdateMember(member.id, { enabled: !member.enabled })} />
                                    <button onClick={() => handleRemoveMember(member.id)} className="text-zinc-400 hover:text-red-500 transition-colors">
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                </div>
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                      <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Provider</label>
                                      <select
                                        value={member.provider}
                                        onChange={(e) => handleUpdateMember(member.id, { provider: e.target.value as any })}
                                        className="w-full rounded-lg border border-zinc-200 bg-white p-2 text-xs outline-none dark:border-zinc-800 dark:bg-zinc-950"
                                      >
                                        {Object.entries(localConfig.availableProviders).map(([p, enabled]) => enabled && (
                                          <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                                        ))}
                                      </select>
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Model</label>
                                      <input
                                        value={member.model}
                                        onChange={(e) => handleUpdateMember(member.id, { model: e.target.value })}
                                        className="w-full rounded-lg border border-zinc-200 bg-white p-2 text-xs outline-none dark:border-zinc-800 dark:bg-zinc-950"
                                      />
                                    </div>
                                  </div>
                                  
                                  {member.isLocal && (
                                    <div className="space-y-1">
                                      <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Local Base URL</label>
                                      <div className="relative">
                                        <Terminal size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                                        <input
                                          value={member.baseUrl || ''}
                                          onChange={(e) => handleUpdateMember(member.id, { baseUrl: e.target.value })}
                                          className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-9 pr-3 text-xs outline-none focus:border-indigo-500 dark:border-zinc-800 dark:bg-zinc-950"
                                          placeholder="http://localhost:11434"
                                        />
                                      </div>
                                    </div>
                                  )}

                                  <textarea
                                    value={member.systemInstruction}
                                    onChange={(e) => handleUpdateMember(member.id, { systemInstruction: e.target.value })}
                                    className="w-full min-h-[80px] rounded-lg border border-zinc-200 bg-white p-3 text-xs outline-none focus:border-zinc-900 dark:border-zinc-800 dark:bg-zinc-950"
                                    placeholder="System Instruction"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div id="chairman-section" className="space-y-6 pt-10 border-t border-zinc-200/50 dark:border-zinc-800/50">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xl font-bold">Chairman Model</h3>
                        </div>

                        <div className="rounded-2xl border border-zinc-200/50 bg-white/50 p-6 shadow-sm backdrop-blur-sm dark:border-zinc-800/50 dark:bg-zinc-900/30">
                          <div className="mb-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/20">
                                <Shield size={20} />
                              </div>
                              <div>
                                <h4 className="font-serif text-lg font-bold italic">The Chairman</h4>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Final Synthesis Authority</p>
                              </div>
                            </div>
                            <div className="flex rounded-lg bg-zinc-100 p-1 dark:bg-zinc-900">
                              <button
                                onClick={() => handleUpdateChairman({ isLocal: false })}
                                className={cn(
                                  "rounded-md px-3 py-1 text-[10px] font-bold uppercase tracking-widest transition-all",
                                  !localConfig.chairman.isLocal ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-white" : "text-zinc-400"
                                )}
                              >
                                Remote
                              </button>
                              <button
                                onClick={() => handleUpdateChairman({ isLocal: true })}
                                className={cn(
                                  "rounded-md px-3 py-1 text-[10px] font-bold uppercase tracking-widest transition-all",
                                  localConfig.chairman.isLocal ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-white" : "text-zinc-400"
                                )}
                              >
                                Local
                              </button>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-6 mb-6">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Provider</label>
                              <select
                                value={localConfig.chairman.provider}
                                onChange={(e) => handleUpdateChairman({ provider: e.target.value as any })}
                                className="w-full rounded-lg border border-zinc-200 bg-white p-2 text-xs outline-none dark:border-zinc-800 dark:bg-zinc-950"
                              >
                                {Object.entries(localConfig.availableProviders).map(([p, enabled]) => enabled && (
                                  <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                                ))}
                              </select>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Model</label>
                              <input
                                value={localConfig.chairman.model}
                                onChange={(e) => handleUpdateChairman({ model: e.target.value })}
                                className="w-full rounded-lg border border-zinc-200 bg-white p-2 text-xs outline-none dark:border-zinc-800 dark:bg-zinc-950"
                              />
                            </div>
                          </div>

                          {localConfig.chairman.isLocal && (
                            <div className="space-y-1 mb-6">
                              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Local Base URL</label>
                              <div className="relative">
                                <Terminal size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                                <input
                                  value={localConfig.chairman.baseUrl || ''}
                                  onChange={(e) => handleUpdateChairman({ baseUrl: e.target.value })}
                                  className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-9 pr-3 text-xs outline-none focus:border-indigo-500 dark:border-zinc-800 dark:bg-zinc-950"
                                  placeholder="http://localhost:11434"
                                />
                              </div>
                            </div>
                          )}

                          <TemperatureSlider 
                            label="Chairman Heat" 
                            value={localConfig.chairmanTemperature} 
                            onChange={(v) => setLocalConfig(prev => ({ ...prev, chairmanTemperature: v }))} 
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'prompts' && (
                    <div className="space-y-8">
                      <div>
                        <h3 className="text-xl font-bold">System Prompts</h3>
                        <p className="mt-2 text-sm text-zinc-500">Customize the instructions given to the models at each stage.</p>
                      </div>

                      <div className="flex gap-4">
                        {[1, 2, 3].map((s) => (
                          <button
                            key={s}
                            onClick={() => setPromptStage(s as any)}
                            className={cn(
                              "rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all",
                              promptStage === s
                                ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                                : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-400"
                            )}
                          >
                            Stage {s}
                          </button>
                        ))}
                      </div>

                      <div className="space-y-6">
                        <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
                          Stage {promptStage}: {promptStage === 1 ? 'Initial Opinions' : promptStage === 2 ? 'Peer Ranking' : 'Synthesis'}
                        </h4>

                        {promptStage === 2 && (
                          <div className="rounded-2xl border border-zinc-100 bg-zinc-50/50 p-6 dark:border-zinc-900 dark:bg-zinc-900/30">
                            <TemperatureSlider 
                              label="Stage 2 Heat" 
                              value={localConfig.reviewTemperature} 
                              onChange={(v) => setLocalConfig(prev => ({ ...prev, reviewTemperature: v }))} 
                            />
                            <p className="mt-4 text-[10px] text-zinc-400 italic">Lower temperature recommended for consistent, parseable ranking output.</p>
                          </div>
                        )}

                        <div className="space-y-4">
                          <div className="flex flex-wrap gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Variables:</span>
                            {['{user_query}', '{responses_text}', '{search_context_block}'].map(v => (
                              <span key={v} className="rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-mono text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">{v}</span>
                            ))}
                          </div>
                          <textarea
                            value={promptStage === 1 ? localConfig.stage1Prompt : promptStage === 2 ? localConfig.stage2Prompt : localConfig.stage3Prompt}
                            onChange={(e) => setLocalConfig(prev => ({
                              ...prev,
                              [promptStage === 1 ? 'stage1Prompt' : promptStage === 2 ? 'stage2Prompt' : 'stage3Prompt']: e.target.value
                            }))}
                            className="w-full min-h-[300px] rounded-2xl border border-zinc-200 bg-white p-6 font-mono text-sm outline-none focus:border-zinc-900 dark:border-zinc-800 dark:bg-zinc-950"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'search' && (
                    <div className="max-w-2xl space-y-10">
                      <div className="space-y-6">
                        <h3 className="text-xl font-bold">Web Search Provider</h3>
                        <div className="grid gap-3">
                          <SearchProviderOption 
                            id="duckduckgo" 
                            label="DuckDuckGo" 
                            description="News search. Fast and free." 
                            selected={localConfig.searchProvider === 'duckduckgo'} 
                            onSelect={() => setLocalConfig(prev => ({ ...prev, searchProvider: 'duckduckgo' }))}
                          />
                          <SearchProviderOption 
                            id="tavily" 
                            label="Tavily" 
                            description="Purpose-built for LLMs. Returns rich, relevant content. Requires API key." 
                            selected={localConfig.searchProvider === 'tavily'} 
                            onSelect={() => setLocalConfig(prev => ({ ...prev, searchProvider: 'tavily' }))}
                          />
                          <SearchProviderOption 
                            id="brave" 
                            label="Brave Search" 
                            description="Privacy-focused search. 2,000 free queries/month. Requires API key." 
                            selected={localConfig.searchProvider === 'brave'} 
                            onSelect={() => setLocalConfig(prev => ({ ...prev, searchProvider: 'brave' }))}
                          />
                        </div>
                      </div>

                      <div className="rounded-2xl border border-zinc-200/50 bg-white/50 p-8 shadow-sm backdrop-blur-sm dark:border-zinc-800/50 dark:bg-zinc-900/30">
                        <div className="mb-6 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-bold">Full Article Fetch (Jina AI)</p>
                            <p className="text-xs text-zinc-500">Uses Jina AI to read the full text of the top search results. <span className="font-bold">Set to 0 to disable.</span></p>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <input
                            type="range"
                            min="0"
                            max="10"
                            step="1"
                            value={localConfig.maxArticlesToFetch}
                            onChange={(e) => setLocalConfig(prev => ({ ...prev, maxArticlesToFetch: parseInt(e.target.value), fetchFullArticles: parseInt(e.target.value) > 0 }))}
                            className="w-full accent-indigo-600 dark:accent-indigo-400"
                          />
                          <div className="flex justify-end text-xs font-bold text-indigo-600 dark:text-indigo-400">
                            {localConfig.maxArticlesToFetch} results
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <h3 className="text-xl font-bold">Search Query Processing</h3>
                        <p className="text-sm text-zinc-500">Choose how your prompt is sent to the search engine.</p>
                        <div className="space-y-3">
                          <SearchProviderOption 
                            id="direct" 
                            label="Direct (Recommended)" 
                            description="Send your exact query to the search engine. Best for modern semantic search engines like Tavily and Brave." 
                            selected={localConfig.searchQueryProcessing === 'direct'} 
                            onSelect={() => setLocalConfig(prev => ({ ...prev, searchQueryProcessing: 'direct' }))}
                          />
                          <SearchProviderOption 
                            id="yake" 
                            label="Smart Keywords (Yake)" 
                            description="Extract key terms from your prompt before searching. Useful if you paste very long prompts that confuse the search engine." 
                            selected={localConfig.searchQueryProcessing === 'yake'} 
                            onSelect={() => setLocalConfig(prev => ({ ...prev, searchQueryProcessing: 'yake' }))}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'keys' && (
                    <div className="max-w-2xl space-y-10">
                      <div>
                        <h3 className="text-xl font-bold">LLM Provider API Keys</h3>
                        <p className="mt-2 text-sm text-zinc-500">Enter your API keys for the providers you wish to use.</p>
                      </div>

                      <div className="grid gap-6">
                        {[
                          { id: 'google', label: 'Google AI Studio', url: 'https://aistudio.google.com/apikey', color: 'from-blue-500 to-blue-600' },
                          { id: 'openai', label: 'OpenAI', url: 'https://platform.openai.com/api-keys', color: 'from-emerald-500 to-emerald-600' },
                          { id: 'anthropic', label: 'Anthropic', url: 'https://console.anthropic.com/', color: 'from-orange-500 to-orange-600' },
                          { id: 'openrouter', label: 'OpenRouter', url: 'https://openrouter.ai/keys', color: 'from-indigo-500 to-indigo-600' },
                          { id: 'groq', label: 'Groq', url: 'https://console.groq.com/keys', color: 'from-orange-400 to-orange-500' },
                          { id: 'mistral', label: 'Mistral', url: 'https://console.mistral.ai/api-keys', color: 'from-yellow-400 to-yellow-500' },
                          { id: 'deepseek', label: 'DeepSeek', url: 'https://platform.deepseek.com/', color: 'from-blue-400 to-blue-500' },
                        ].map((provider) => (
                          <div key={provider.id} className="group relative rounded-2xl border border-zinc-200/50 bg-white/50 p-6 shadow-sm backdrop-blur-sm transition-all hover:border-indigo-500/50 dark:border-zinc-800/50 dark:bg-zinc-900/30">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <div className={cn("h-2 w-2 rounded-full bg-gradient-to-r", provider.color)} />
                                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{provider.label}</label>
                              </div>
                              <a href={provider.url} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-indigo-500 hover:text-indigo-600 transition-colors">Get Key ↗</a>
                            </div>
                            <div className="relative">
                              <Key size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                              <input
                                type="password"
                                value={localConfig.llmApiKeys[provider.id as ProviderType] || ''}
                                onChange={(e) => setLocalConfig(prev => ({
                                  ...prev,
                                  llmApiKeys: { ...prev.llmApiKeys, [provider.id]: e.target.value }
                                }))}
                                className="w-full rounded-xl border border-zinc-200 bg-white/50 py-3 pl-10 pr-4 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 dark:border-zinc-800 dark:bg-zinc-950/50"
                                placeholder={`Enter ${provider.label} API Key`}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === 'backup' && (
                    <div className="max-w-2xl space-y-12">
                      <div className="space-y-6">
                        <h3 className="text-xl font-bold">Backup & Reset</h3>
                        <p className="text-sm text-zinc-500">Save or restore your council configuration (models, prompts, settings). <br /><span className="italic">Note: API keys are NOT exported for security.</span></p>
                        
                        <div className="flex gap-4">
                          <button
                            onClick={() => {
                              const input = document.createElement('input');
                              input.type = 'file';
                              input.accept = '.json';
                              input.onchange = (e: any) => {
                                const file = e.target.files[0];
                                const reader = new FileReader();
                                reader.onload = (re) => {
                                  try {
                                    const config = JSON.parse(re.target?.result as string);
                                    setLocalConfig(config);
                                  } catch (err) {
                                    alert('Invalid config file');
                                  }
                                };
                                reader.readAsText(file);
                              };
                              input.click();
                            }}
                            className="flex items-center gap-2 rounded-xl border border-zinc-200 px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
                          >
                            <Upload size={14} />
                            Import Config
                          </button>
                          <button
                            onClick={() => {
                              const data = JSON.stringify(localConfig, null, 2);
                              const blob = new Blob([data], { type: 'application/json' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `council-config-${Date.now()}.json`;
                              a.click();
                            }}
                            className="flex items-center gap-2 rounded-xl border border-zinc-200 px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
                          >
                            <Download size={14} />
                            Export Config
                          </button>
                        </div>
                      </div>

                      <div className="space-y-6 pt-10 border-t border-zinc-100 dark:border-zinc-900">
                        <h3 className="text-lg font-bold text-red-500">Danger Zone</h3>
                        <p className="text-sm text-zinc-500">Reset all settings to their default values. This will clear your council selection and custom prompts. API keys will be preserved.</p>
                        <button
                          onClick={() => {
                            if (confirm('Reset all settings to default?')) {
                              setLocalConfig(DEFAULT_CONFIG);
                            }
                          }}
                          className="rounded-xl bg-red-500 px-6 py-3 text-xs font-bold uppercase tracking-widest text-white transition-transform hover:scale-105 active:scale-95"
                        >
                          Reset to Defaults
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="relative flex items-center justify-end gap-4 border-t border-zinc-200/50 px-8 py-6 dark:border-zinc-800/50">
                  <button
                    onClick={onClose}
                    className="text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      onSave(localConfig);
                      onClose();
                    }}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-4 text-xs font-bold uppercase tracking-widest text-white shadow-lg shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95"
                  >
                    <Save size={16} />
                    Apply Configuration
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function SourceToggle({ label, enabled, onToggle, readOnly = false, small = false }: { label: string, enabled: boolean, onToggle: () => void, readOnly?: boolean, small?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={cn("font-bold text-zinc-900 dark:text-white", small ? "text-xs" : "text-sm")}>{label}</span>
      <Switch enabled={enabled} onToggle={onToggle} readOnly={readOnly} />
    </div>
  );
}

function Switch({ enabled, onToggle, readOnly = false }: { enabled: boolean, onToggle: () => void, readOnly?: boolean }) {
  return (
    <button
      onClick={onToggle}
      disabled={readOnly}
      className={cn(
        "relative h-6 w-11 rounded-full transition-colors",
        enabled ? "bg-zinc-900 dark:bg-white" : "bg-zinc-200 dark:bg-zinc-800",
        readOnly && "opacity-50 cursor-not-allowed"
      )}
    >
      <div className={cn(
        "absolute top-1 h-4 w-4 rounded-full bg-white transition-all dark:bg-zinc-900 shadow-sm",
        enabled ? "left-6" : "left-1"
      )} />
    </button>
  );
}

function TemperatureSlider({ label, value, onChange }: { label: string, value: number, onChange: (v: number) => void }) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-zinc-400">
        <span>{label}</span>
        <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-zinc-900 dark:bg-zinc-800 dark:text-white">{value.toFixed(1)}</span>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-lg">❄️</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full accent-zinc-900 dark:accent-white"
        />
        <span className="text-lg">🔥</span>
      </div>
    </div>
  );
}

function SearchProviderOption({ id, label, description, selected, onSelect }: { id: string, label: string, description: string, selected: boolean, onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "flex w-full items-start gap-4 rounded-2xl border p-5 text-left transition-all",
        selected 
          ? "border-zinc-900 bg-zinc-900/5 ring-1 ring-zinc-900 dark:border-white dark:bg-white/5 dark:ring-white" 
          : "border-zinc-100 bg-white hover:border-zinc-200 dark:border-zinc-900 dark:bg-zinc-950"
      )}
    >
      <div className={cn(
        "mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
        selected ? "border-zinc-900 bg-zinc-900 dark:border-white dark:bg-white" : "border-zinc-300"
      )}>
        {selected && <div className="h-1.5 w-1.5 rounded-full bg-white dark:bg-zinc-900" />}
      </div>
      <div>
        <p className="text-sm font-bold text-zinc-900 dark:text-white">{label}</p>
        <p className="text-xs text-zinc-500">{description}</p>
      </div>
    </button>
  );
}
