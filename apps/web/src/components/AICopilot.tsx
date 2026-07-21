/**
 * Enterprise AI Copilot — Operational Intelligence Panel
 *
 * NOT a chatbot. This is an operational intelligence platform that:
 * - Observes system state and visual inputs
 * - Reasons across all subsystems
 * - Proposes and executes authorized actions
 * - Explains every decision with a full reasoning chain
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  BrainCircuit, Send, Image as ImageIcon, X, ChevronDown, ChevronRight,
  Loader2, Zap, Shield, Eye, Search, FileText, Bell, Activity,
  CheckCircle2, AlertTriangle, ArrowRight, Sparkles, Cpu, Radio,
  Camera, Database, Network, Lock, Play, RefreshCw, Copy, Check,
  Info, AlertCircle, Terminal, TrendingUp, Users, Map
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// ─── Types ────────────────────────────────────────────────────────────────────

type ReasoningStep = 'Observe' | 'Understand' | 'Reason' | 'Plan' | 'Verify' | 'Execute' | 'Explain' | 'Learn';

interface ReasoningTrace {
  step: ReasoningStep;
  summary: string;
  sources?: string[];
}

type ActionRisk = 'none' | 'low' | 'medium' | 'high' | 'critical';

interface ProposedAction {
  id: string;
  label: string;
  description: string;
  type: string;
  params: Record<string, unknown>;
  risk: ActionRisk;
  requiresConfirmation: boolean;
  permissionsRequired: string[];
}

interface CopilotResponse {
  answer: string;
  reasoning: ReasoningTrace[];
  sourcesUsed: string[];
  proposedActions: ProposedAction[];
  confidence: number;
  uncertainty?: string;
  agentsInvoked: string[];
  processingMs: number;
}

interface ConversationTurn {
  id: string;
  role: 'user' | 'copilot';
  text: string;
  imagePreview?: string;
  response?: CopilotResponse;
  timestamp: Date;
}

interface CopilotMeta {
  aiEnabled: boolean;
  userRole: string;
  userName: string;
  agents: Array<{ name: string; status: 'active' | 'limited' | 'offline' }>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STEP_ICONS: Record<ReasoningStep, React.ReactNode> = {
  Observe:     <Eye       className="w-3.5 h-3.5" />,
  Understand:  <BrainCircuit className="w-3.5 h-3.5" />,
  Reason:      <Cpu       className="w-3.5 h-3.5" />,
  Plan:        <FileText  className="w-3.5 h-3.5" />,
  Verify:      <Shield    className="w-3.5 h-3.5" />,
  Execute:     <Zap       className="w-3.5 h-3.5" />,
  Explain:     <Terminal  className="w-3.5 h-3.5" />,
  Learn:       <TrendingUp className="w-3.5 h-3.5" />,
};

const RISK_COLORS: Record<ActionRisk, string> = {
  none:     'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
  low:      'text-blue-400 border-blue-500/30 bg-blue-500/10',
  medium:   'text-yellow-400 border-yellow-500/30 bg-yellow-500/10',
  high:     'text-orange-400 border-orange-500/30 bg-orange-500/10',
  critical: 'text-red-400 border-red-500/30 bg-red-500/10',
};

const SOURCE_ICONS: Record<string, React.ReactNode> = {
  cameras:       <Camera     className="w-3 h-3" />,
  alerts:        <Bell       className="w-3 h-3" />,
  alarms:        <Bell       className="w-3 h-3" />,
  system_health: <Activity   className="w-3 h-3" />,
  database:      <Database   className="w-3 h-3" />,
  network:       <Network    className="w-3 h-3" />,
  operator_input:<Users      className="w-3 h-3" />,
  rule_engine:   <Shield     className="w-3 h-3" />,
  system_context:<Cpu        className="w-3 h-3" />,
  visual:        <Eye        className="w-3 h-3" />,
  map:           <Map        className="w-3 h-3" />,
};

const QUICK_PROMPTS = [
  { label: "Tizim holati", query: "Tizim holati qanday? Barcha komponentlar ishlayaptimi?", icon: <Activity className="w-3.5 h-3.5" /> },
  { label: "Faol alarmlar", query: "Hozir qanday faol alarmlar bor? Eng muhimini ko'rsat.", icon: <Bell className="w-3.5 h-3.5" /> },
  { label: "Shubhali faoliyat", query: "Oxirgi soatda shubhali faoliyat aniqlangan kameral bormi?", icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  { label: "Xavfsizlik tahlili", query: "Umumiy xavfsizlik holati haqida brifing ber.", icon: <Shield className="w-3.5 h-3.5" /> },
  { label: "Kamera tekshiruv", query: "Qaysi kameralar oflayn yoki muammo bor?", icon: <Camera className="w-3.5 h-3.5" /> },
  { label: "Hisobot tayyorla", query: "Bugungi xavfsizlik hisobotini tayyorla.", icon: <FileText className="w-3.5 h-3.5" /> },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

const ConfidenceMeter: React.FC<{ value: number }> = ({ value }) => {
  const pct = Math.round(value * 100);
  const color = pct >= 80 ? 'bg-emerald-500' : pct >= 55 ? 'bg-yellow-500' : 'bg-orange-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] text-white/40 tabular-nums">{pct}%</span>
    </div>
  );
};

const ReasoningChain: React.FC<{ traces: ReasoningTrace[] }> = ({ traces }) => {
  const [expanded, setExpanded] = useState(false);
  if (!traces.length) return null;

  return (
    <div className="mt-3">
      <button
        onClick={() => setExpanded(v => !v)}
        className="flex items-center gap-1.5 text-[11px] text-white/40 hover:text-white/60 transition-colors"
      >
        {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        Muhokama zanjiri ({traces.length} qadam)
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-2 pl-3 border-l border-white/10 space-y-2">
              {traces.map((trace, i) => (
                <div key={i} className="text-[11px]">
                  <div className="flex items-center gap-1.5 text-white/50 font-medium">
                    <span className="text-cyan-400/70">{STEP_ICONS[trace.step]}</span>
                    <span className="text-cyan-400/70 uppercase tracking-wide text-[10px]">{trace.step}</span>
                  </div>
                  <p className="text-white/60 mt-0.5 leading-relaxed">{trace.summary}</p>
                  {trace.sources && trace.sources.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {trace.sources.map(src => (
                        <span key={src} className="flex items-center gap-1 px-1.5 py-0.5 bg-white/5 rounded text-[10px] text-white/30">
                          {SOURCE_ICONS[src] ?? <Database className="w-3 h-3" />}
                          {src}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ActionCard: React.FC<{
  action: ProposedAction;
  onExecute: (action: ProposedAction) => void;
  executing: boolean;
}> = ({ action, onExecute, executing }) => {
  const [confirming, setConfirming] = useState(false);

  const handleClick = () => {
    if (action.requiresConfirmation && !confirming) {
      setConfirming(true);
      return;
    }
    onExecute(action);
    setConfirming(false);
  };

  return (
    <div className={`border rounded-lg p-3 ${RISK_COLORS[action.risk]}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold">{action.label}</span>
            {action.risk !== 'none' && (
              <span className="text-[9px] uppercase tracking-wide opacity-60 font-medium">
                {action.risk}
              </span>
            )}
          </div>
          <p className="text-[10px] opacity-60 mt-0.5 leading-relaxed">{action.description}</p>
        </div>
        <button
          onClick={handleClick}
          disabled={executing}
          className={`shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all
            ${confirming
              ? 'bg-orange-500 text-white animate-pulse'
              : 'bg-white/10 hover:bg-white/20 text-current'
            } disabled:opacity-40`}
        >
          {executing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
          {confirming ? 'Tasdiqlash?' : 'Bajar'}
        </button>
      </div>
      {confirming && (
        <div className="mt-1.5 flex gap-2">
          <button
            onClick={() => { onExecute(action); setConfirming(false); }}
            className="text-[10px] text-orange-300 hover:text-orange-200"
          >
            Ha, bajar
          </button>
          <button
            onClick={() => setConfirming(false)}
            className="text-[10px] text-white/30 hover:text-white/50"
          >
            Bekor qilish
          </button>
        </div>
      )}
    </div>
  );
};

const CopilotMessage: React.FC<{
  turn: ConversationTurn;
  onAction: (action: ProposedAction) => Promise<void>;
  executingActionId: string | null;
}> = ({ turn, onAction, executingActionId }) => {
  const [copied, setCopied] = useState(false);

  const copyText = () => {
    navigator.clipboard.writeText(turn.response?.answer ?? turn.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (turn.role === 'user') {
    return (
      <div className="flex justify-end gap-2">
        <div className="max-w-[80%]">
          {turn.imagePreview && (
            <img src={turn.imagePreview} alt="upload" className="rounded-lg mb-1 max-h-32 object-cover" />
          )}
          <div className="bg-cyan-500/20 border border-cyan-500/30 rounded-2xl rounded-tr-sm px-3 py-2">
            <p className="text-[13px] text-white/90 leading-relaxed">{turn.text}</p>
          </div>
          <p className="text-[10px] text-white/20 text-right mt-1">
            {turn.timestamp.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>
    );
  }

  const r = turn.response;

  return (
    <div className="flex gap-2">
      <div className="shrink-0 w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center mt-0.5">
        <BrainCircuit className="w-4 h-4 text-cyan-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[10px] text-cyan-400 font-medium">SENTINEL COPILOT</span>
          {r && (
            <>
              <span className="text-[10px] text-white/20">·</span>
              <span className="text-[10px] text-white/30">{r.processingMs}ms</span>
              {r.agentsInvoked.length > 0 && (
                <>
                  <span className="text-[10px] text-white/20">·</span>
                  <span className="text-[10px] text-white/30">{r.agentsInvoked.length} agent</span>
                </>
              )}
            </>
          )}
        </div>

        {/* Main answer */}
        <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm px-3.5 py-3">
          <p className="text-[13px] text-white/90 leading-relaxed whitespace-pre-wrap">{r?.answer ?? turn.text}</p>

          {r && (
            <>
              {/* Confidence */}
              <div className="mt-3 pt-2.5 border-t border-white/10">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-white/30 uppercase tracking-wide">Ishonch darajasi</span>
                  <button onClick={copyText} className="text-white/20 hover:text-white/50 transition-colors">
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
                <ConfidenceMeter value={r.confidence} />
              </div>

              {/* Uncertainty notice */}
              {r.uncertainty && (
                <div className="mt-2 flex items-start gap-1.5 text-[11px] text-yellow-400/70">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{r.uncertainty}</span>
                </div>
              )}

              {/* Sources */}
              {r.sourcesUsed.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1">
                  {r.sourcesUsed.map(src => (
                    <span key={src} className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/5 text-[10px] text-white/30">
                      {SOURCE_ICONS[src] ?? <Database className="w-3 h-3" />}
                      {src}
                    </span>
                  ))}
                </div>
              )}

              {/* Reasoning chain */}
              {r.reasoning.length > 0 && <ReasoningChain traces={r.reasoning} />}
            </>
          )}
        </div>

        {/* Proposed actions */}
        {r && r.proposedActions.length > 0 && (
          <div className="mt-2 space-y-1.5">
            <p className="text-[10px] text-white/30 uppercase tracking-wide px-0.5">Tavsiya qilingan amallar</p>
            {r.proposedActions.map(action => (
              <ActionCard
                key={action.id}
                action={action}
                onExecute={onAction}
                executing={executingActionId === action.id}
              />
            ))}
          </div>
        )}

        <p className="text-[10px] text-white/20 mt-1">
          {turn.timestamp.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
};

// ─── Agent Status Bar ─────────────────────────────────────────────────────────

const AgentStatusBar: React.FC<{ meta: CopilotMeta | null }> = ({ meta }) => {
  if (!meta) return null;
  return (
    <div className="flex items-center gap-3 px-4 py-2 border-b border-white/5 bg-white/2 overflow-x-auto scrollbar-hide">
      {meta.agents.map(agent => (
        <div key={agent.name} className="flex items-center gap-1.5 shrink-0">
          <span className={`w-1.5 h-1.5 rounded-full ${
            agent.status === 'active' ? 'bg-emerald-400' :
            agent.status === 'limited' ? 'bg-yellow-400' : 'bg-red-400'
          }`} />
          <span className="text-[10px] text-white/30 whitespace-nowrap">{agent.name}</span>
        </div>
      ))}
      {!meta.aiEnabled && (
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 shrink-0">
          <AlertTriangle className="w-3 h-3 text-yellow-400" />
          <span className="text-[10px] text-yellow-400">GEMINI_API_KEY sozlanmagan</span>
        </div>
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

interface AICopilotProps {
  currentView?: string;
  activeCameraId?: string;
  activeAlarmId?: string;
  onNavigate?: (view: string) => void;
}

export const AICopilot: React.FC<AICopilotProps> = ({
  currentView,
  activeCameraId,
  activeAlarmId,
  onNavigate,
}) => {
  const [conversation, setConversation] = useState<ConversationTurn[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [attachedImage, setAttachedImage] = useState<{ data: string; mimeType: string; preview: string } | null>(null);
  const [executingActionId, setExecutingActionId] = useState<string | null>(null);
  const [meta, setMeta] = useState<CopilotMeta | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ success: boolean; message: string } | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch copilot meta on mount
  useEffect(() => {
    fetch('/api/copilot/context', {
      headers: { Authorization: `Bearer ${localStorage.getItem('sentinel_token') ?? ''}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setMeta(data); })
      .catch(() => {});
  }, []);

  // Welcome message
  useEffect(() => {
    const welcome: ConversationTurn = {
      id: 'welcome',
      role: 'copilot',
      text: '',
      timestamp: new Date(),
      response: {
        answer: `Assalomu alaykum. Men Sentinel Enterprise AI Copilot — operatsion razvedka platformasi.\n\nMen tizimning barcha quyi tizimlarini kuzataman, tahlil qilaman va vakolatli amallarni bajaraman.\n\nQuyidagi imkoniyatlardan foydalanishingiz mumkin:\n• Kamera va tasvir tahlili\n• Alarm boshqaruvi\n• Shaxs tekshiruvi va kuzatish\n• Tizim holati monitoringi\n• Hisobot yaratish\n• Tasvirni yuklash va tahlil\n\nBugun sizga qanday yordam bera olaman?`,
        reasoning: [],
        sourcesUsed: [],
        proposedActions: [],
        confidence: 1,
        agentsInvoked: [],
        processingMs: 0,
      },
    };
    setConversation([welcome]);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation, isProcessing]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      const dataUrl = evt.target?.result as string;
      setAttachedImage({
        data: dataUrl,
        mimeType: file.type,
        preview: dataUrl,
      });
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const sendQuery = useCallback(async (queryText?: string) => {
    const text = (queryText ?? input).trim();
    if ((!text && !attachedImage) || isProcessing) return;

    const userTurn: ConversationTurn = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: text || '(Tasvir yuklandi)',
      imagePreview: attachedImage?.preview,
      timestamp: new Date(),
    };

    setConversation(prev => [...prev, userTurn]);
    setInput('');
    const img = attachedImage;
    setAttachedImage(null);
    setIsProcessing(true);

    const history = conversation
      .filter(t => t.id !== 'welcome')
      .slice(-6)
      .map(t => ({ role: t.role, text: t.response?.answer ?? t.text }));

    try {
      const token = localStorage.getItem('sentinel_token') ?? '';
      const res = await fetch('/api/copilot/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          query: text || 'Ushbu tasvirni tahlil qil.',
          imageData: img?.data,
          imageMimeType: img?.mimeType,
          conversationHistory: history,
          currentView,
          activeCameraId,
          activeAlarmId,
        }),
      });

      const data: CopilotResponse = await res.json();

      const copilotTurn: ConversationTurn = {
        id: `copilot-${Date.now()}`,
        role: 'copilot',
        text: '',
        timestamp: new Date(),
        response: data,
      };

      setConversation(prev => [...prev, copilotTurn]);

      // Handle auto-navigation actions
      const navAction = data.proposedActions.find(a => a.type === 'NAVIGATE_TO_VIEW' && !a.requiresConfirmation);
      if (navAction && onNavigate) {
        onNavigate(navAction.params.view as string);
      }
    } catch (err) {
      const errTurn: ConversationTurn = {
        id: `err-${Date.now()}`,
        role: 'copilot',
        text: '',
        timestamp: new Date(),
        response: {
          answer: 'So\'rovni qayta ishlashda xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.',
          reasoning: [],
          sourcesUsed: [],
          proposedActions: [],
          confidence: 0,
          agentsInvoked: [],
          processingMs: 0,
        },
      };
      setConversation(prev => [...prev, errTurn]);
    } finally {
      setIsProcessing(false);
    }
  }, [input, attachedImage, isProcessing, conversation, currentView, activeCameraId, activeAlarmId, onNavigate]);

  const handleAction = async (action: ProposedAction) => {
    setExecutingActionId(action.id);
    setActionFeedback(null);
    try {
      const token = localStorage.getItem('sentinel_token') ?? '';
      const res = await fetch('/api/copilot/execute-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ actionType: action.type, params: action.params }),
      });
      const data = await res.json();
      setActionFeedback({ success: data.success, message: data.message });

      if (data.success && action.type === 'NAVIGATE_TO_VIEW' && data.data?.view && onNavigate) {
        onNavigate(data.data.view as string);
      }
    } catch {
      setActionFeedback({ success: false, message: 'Amal bajarishda tarmoq xatosi.' });
    } finally {
      setExecutingActionId(null);
      setTimeout(() => setActionFeedback(null), 4000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendQuery();
    }
  };

  return (
    <div className="flex flex-col h-full bg-app-bg text-white overflow-hidden">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-white/10 bg-app-panel/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
            <BrainCircuit className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white/90 leading-none">AI Copilot</h1>
            <p className="text-[10px] text-white/40 mt-0.5">Operatsion razvedka platformasi</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {meta?.aiEnabled ? (
            <span className="flex items-center gap-1.5 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-full">
              <Radio className="w-3 h-3" />
              Gemini AI faol
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-[10px] text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-2 py-1 rounded-full">
              <Cpu className="w-3 h-3" />
              Qoidalar rejimi
            </span>
          )}
          <button
            onClick={() => setConversation(prev => [prev[0]])}
            className="text-white/20 hover:text-white/50 transition-colors p-1.5 rounded-lg hover:bg-white/5"
            title="Suhbatni tozalash"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Agent status bar */}
      <AgentStatusBar meta={meta} />

      {/* Action feedback toast */}
      <AnimatePresence>
        {actionFeedback && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`mx-4 mt-2 shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium
              ${actionFeedback.success
                ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                : 'bg-red-500/15 border border-red-500/30 text-red-300'
              }`}
          >
            {actionFeedback.success
              ? <CheckCircle2 className="w-4 h-4 shrink-0" />
              : <AlertTriangle className="w-4 h-4 shrink-0" />
            }
            {actionFeedback.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick prompts — shown only when conversation is minimal */}
      {conversation.length <= 1 && (
        <div className="shrink-0 px-4 pt-3 pb-0">
          <p className="text-[10px] text-white/25 uppercase tracking-wide mb-2">Tezkor so'rovlar</p>
          <div className="grid grid-cols-2 gap-1.5">
            {QUICK_PROMPTS.map(qp => (
              <button
                key={qp.label}
                onClick={() => sendQuery(qp.query)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/15 text-left transition-all"
              >
                <span className="text-cyan-400/70 shrink-0">{qp.icon}</span>
                <span className="text-[11px] text-white/60 leading-tight">{qp.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Conversation */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5 min-h-0">
        {conversation.map(turn => (
          <CopilotMessage
            key={turn.id}
            turn={turn}
            onAction={handleAction}
            executingActionId={executingActionId}
          />
        ))}

        {/* Typing indicator */}
        <AnimatePresence>
          {isProcessing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex gap-2 items-center"
            >
              <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
                <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
              </div>
              <div className="flex gap-1.5 px-3 py-2 bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm">
                <div className="flex gap-1 items-center">
                  <span className="text-[11px] text-white/40">Tahlil qilinmoqda</span>
                  <span className="flex gap-1 ml-2">
                    {[0, 1, 2].map(i => (
                      <span
                        key={i}
                        className="w-1 h-1 rounded-full bg-cyan-400/60 animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="shrink-0 px-4 pb-4 pt-2 border-t border-white/10 bg-app-panel/30">
        {/* Image attachment preview */}
        {attachedImage && (
          <div className="mb-2 relative inline-block">
            <img src={attachedImage.preview} alt="attachment" className="h-16 rounded-lg object-cover border border-white/20" />
            <button
              onClick={() => setAttachedImage(null)}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center"
            >
              <X className="w-3 h-3 text-white" />
            </button>
          </div>
        )}

        <div className="flex items-end gap-2 bg-white/5 border border-white/10 rounded-2xl px-3 py-2 focus-within:border-cyan-500/40 transition-colors">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="shrink-0 text-white/25 hover:text-cyan-400 transition-colors mb-0.5"
            title="Tasvir yuklash"
          >
            <ImageIcon className="w-5 h-5" />
          </button>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Savol yoki buyruq kiriting… (Shift+Enter qatorni o'zgartiradi)"
            rows={1}
            style={{ resize: 'none', minHeight: '24px', maxHeight: '120px' }}
            className="flex-1 bg-transparent text-[13px] text-white/90 placeholder-white/20 outline-none leading-relaxed"
            onInput={e => {
              const el = e.currentTarget;
              el.style.height = 'auto';
              el.style.height = Math.min(el.scrollHeight, 120) + 'px';
            }}
          />
          <button
            onClick={() => sendQuery()}
            disabled={(!input.trim() && !attachedImage) || isProcessing}
            className="shrink-0 w-7 h-7 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all"
          >
            {isProcessing ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Send className="w-4 h-4 text-white" />}
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />

        <p className="text-[10px] text-white/15 mt-1.5 text-center">
          Hech qachon soxta kuzatuvlarni ixtiro qilmaydi · Har bir qaror asoslangan
        </p>
      </div>
    </div>
  );
};
