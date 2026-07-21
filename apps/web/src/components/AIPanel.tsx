/**
 * AIPanel — Unified AI right-side drawer
 *
 * Merges AI Copilot (operational intelligence) and AI Chat (conversational)
 * into a single slide-in panel accessible from the header on every page.
 */

import React, { useState, useEffect } from 'react';
import { BrainCircuit, MessageSquare, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AICopilot } from './AICopilot';
import { AIChatView } from './AIChatView';

type Tab = 'copilot' | 'chat';

interface AIPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentView?: string;
  onNavigate?: (view: string) => void;
}

export const AIPanel: React.FC<AIPanelProps> = ({ isOpen, onClose, currentView, onNavigate }) => {
  const [activeTab, setActiveTab] = useState<Tab>('copilot');

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop — semi-transparent, only on small screens */}
          <motion.div
            key="ai-panel-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            key="ai-panel"
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 h-full w-full sm:w-[420px] bg-[#0d1117] border-l border-white/10 z-50 flex flex-col shadow-2xl"
          >
            {/* Panel header */}
            <div className="shrink-0 flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-app-panel/60 backdrop-blur-sm">
              {/* Tabs */}
              <div className="flex flex-1 bg-white/5 rounded-xl p-1 gap-1">
                <button
                  onClick={() => setActiveTab('copilot')}
                  className={`flex items-center gap-2 flex-1 justify-center px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'copilot'
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow'
                      : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  <BrainCircuit size={14} />
                  AI Copilot
                </button>
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`flex items-center gap-2 flex-1 justify-center px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'chat'
                      ? 'bg-brand-primary/20 text-brand-primary border border-brand-primary/30 shadow'
                      : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  <MessageSquare size={14} />
                  AI Chat
                </button>
              </div>

              {/* Close button */}
              <button
                onClick={onClose}
                className="shrink-0 p-2 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors"
                title="Yopish (Esc)"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content area — both mounted, tab switches visibility to preserve state */}
            <div className="flex-1 min-h-0 overflow-hidden">
              <div className={`h-full ${activeTab === 'copilot' ? 'block' : 'hidden'}`}>
                <AICopilot
                  currentView={currentView}
                  onNavigate={(v) => {
                    onNavigate?.(v);
                    onClose();
                  }}
                />
              </div>
              <div className={`h-full ${activeTab === 'chat' ? 'block' : 'hidden'}`}>
                <AIChatView />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
