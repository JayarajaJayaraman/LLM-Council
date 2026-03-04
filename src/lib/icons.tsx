import { 
  SiOpenai, 
  SiAnthropic, 
  SiGoogle
} from 'react-icons/si';
import { Cpu, Zap, Terminal, Brain, Bot } from 'lucide-react';
import { ProviderType } from '../types';

export function getProviderIcon(provider: ProviderType, size: number = 16) {
  switch (provider) {
    case 'openai':
      return <SiOpenai size={size} />;
    case 'anthropic':
      return <SiAnthropic size={size} />;
    case 'google':
      return <SiGoogle size={size} />;
    case 'mistral':
      return <Brain size={size} />;
    case 'deepseek':
      return <Bot size={size} />;
    case 'groq':
      return <Zap size={size} />;
    case 'ollama':
      return <Terminal size={size} />;
    case 'openrouter':
      return <Cpu size={size} />;
    default:
      return <Cpu size={size} />;
  }
}

export function getProviderColor(provider: ProviderType) {
  switch (provider) {
    case 'openai':
      return 'text-[#10a37f]';
    case 'anthropic':
      return 'text-[#d97757]';
    case 'google':
      return 'text-[#4285f4]';
    case 'mistral':
      return 'text-[#f5d142]';
    case 'deepseek':
      return 'text-[#60a5fa]';
    case 'groq':
      return 'text-orange-500';
    case 'ollama':
      return 'text-zinc-500';
    default:
      return 'text-zinc-400';
  }
}

export function getProviderBg(provider: ProviderType) {
  switch (provider) {
    case 'openai':
      return 'bg-[#10a37f]/10';
    case 'anthropic':
      return 'bg-[#d97757]/10';
    case 'google':
      return 'bg-[#4285f4]/10';
    case 'mistral':
      return 'bg-[#f5d142]/10';
    case 'deepseek':
      return 'bg-[#60a5fa]/10';
    case 'groq':
      return 'bg-orange-500/10';
    case 'ollama':
      return 'bg-zinc-500/10';
    default:
      return 'bg-zinc-400/10';
  }
}
