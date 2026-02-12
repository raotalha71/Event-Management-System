
import React, { useState, useEffect, useCallback } from 'react';
import { Network, Sparkles, MessageSquare, UserPlus, RefreshCw, CheckCircle2, X, Send, Users, Zap, UserCheck } from 'lucide-react';
import { api } from '../services/api';

const MOCK_ATTENDEES = [
  { id: 'm1', name: 'Sarah Chen', company: 'AI Solutions', industry: 'Data Science', interests: ['Machine Learning', 'AI Ethics'], skills: ['Python', 'TensorFlow'], goals: ['Research'] },
  { id: 'm2', name: 'Michael Brown', company: 'WebScale', industry: 'Cloud Infrastructure', interests: ['Kubernetes', 'Serverless'], skills: ['DevOps', 'AWS'], goals: ['Scaling'] },
  { id: 'm3', name: 'Emily White', company: 'DesignCo', industry: 'Product Design', interests: ['UI/UX', 'Accessibility'], skills: ['Figma', 'CSS'], goals: ['Inclusivity'] },
  { id: 'm4', name: 'David Lee', company: 'FinTech Hub', industry: 'Finance', interests: ['Blockchain', 'Security'], skills: ['Solidity', 'Rust'], goals: ['DeFi'] },
  { id: 'm5', name: 'Lisa Ray', company: 'GreenEnergy', industry: 'Sustainability', interests: ['IoT', 'Renewable Energy'], skills: ['Embedded', 'C++'], goals: ['CleanTech'] },
];

const NODE_COLORS = [
  'from-violet-500 to-fuchsia-500',
  'from-cyan-500 to-blue-500',
  'from-emerald-500 to-teal-500',
  'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-500',
  'from-sky-500 to-indigo-500',
];

interface AINetworkingProps {
  currentUser?: any;
  onTabChange?: (tab: string) => void;
}

const AINetworking: React.FC<AINetworkingProps> = ({ currentUser, onTabChange }) => {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [connectedIds, setConnectedIds] = useState<Set<string>>(new Set());
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [connectionCount, setConnectionCount] = useState(0);
  const [messageTarget, setMessageTarget] = useState<any | null>(null);
  const [messageText, setMessageText] = useState('');
  const [messageSent, setMessageSent] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Load existing connections on mount
  const loadConnections = useCallback(async () => {
    try {
      const conns = await api.getMyConnections();
      const ids = new Set<string>(conns.map((c: any) => c.peer?.id).filter(Boolean));
      setConnectedIds(ids);
      setConnectionCount(conns.length);
    } catch {
      // silent — connections endpoint may not have data yet
    }
  }, []);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      let attendees = MOCK_ATTENDEES;
      try {
        const dbAttendees = await api.getAttendees();
        if (dbAttendees.length > 1) attendees = dbAttendees;
      } catch {}

      const user = currentUser || { name: 'User', interests: [] };
      const results = await api.getNetworkingRecommendations(user, attendees, 5);
      setRecommendations(results);
    } catch (error) {
      console.warn('AI backend unreachable; falling back to empty recommendations.', error);
      setRecommendations([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRecommendations();
    loadConnections();
  }, []);

  const handleConnect = async (rec: any) => {
    const matchId = rec.match?.id;
    if (!matchId) {
      showToast('Cannot connect — user ID missing.');
      return;
    }
    if (connectedIds.has(matchId)) return;

    setConnectingId(matchId);
    try {
      await api.sendConnectionRequest(matchId);
      setConnectedIds(prev => new Set(prev).add(matchId));
      setConnectionCount(prev => prev + 1);
      showToast(`Connected with ${rec.name}!`);
    } catch (err: any) {
      if (err.message?.includes('Already connected') || err.message?.includes('already pending')) {
        setConnectedIds(prev => new Set(prev).add(matchId));
        showToast('Already connected!');
      } else {
        showToast(`Failed: ${err.message}`);
      }
    }
    setConnectingId(null);
  };

  const handleMessage = (rec: any) => {
    setMessageTarget(rec);
    setMessageText(rec.starter || '');
    setMessageSent(false);
  };

  const sendMessage = () => {
    if (!messageText.trim()) return;
    setMessageSent(true);
    showToast(`Message sent to ${messageTarget?.name}!`);
    setTimeout(() => {
      setMessageTarget(null);
      setMessageText('');
      setMessageSent(false);
    }, 1500);
  };

  // ── Dynamic graph nodes from recommendations ──
  const graphNodes = recommendations.slice(0, 6);
  const nodeCount = graphNodes.length || 1;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 animate-in slide-in-from-top-4 fade-in bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl font-bold text-sm flex items-center gap-2">
          <CheckCircle2 size={18} />
          {toast}
        </div>
      )}

      {/* Message Modal */}
      {messageTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-theme-surface border border-theme-border rounded-3xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-lg text-theme-text">Message {messageTarget.name}</h3>
              <button onClick={() => setMessageTarget(null)} className="p-1.5 hover:bg-theme-border rounded-xl transition-colors">
                <X size={18} className="text-theme-sub" />
              </button>
            </div>
            {messageSent ? (
              <div className="text-center py-8">
                <CheckCircle2 size={48} className="mx-auto text-emerald-500 mb-3" />
                <p className="font-bold text-theme-text">Message Sent!</p>
              </div>
            ) : (
              <>
                <p className="text-xs text-theme-sub mb-3">AI-suggested conversation starter pre-filled below:</p>
                <textarea
                  value={messageText}
                  onChange={e => setMessageText(e.target.value)}
                  placeholder="Write a message..."
                  className="w-full bg-theme-bg border border-theme-border rounded-xl p-3 text-sm text-theme-text focus:border-indigo-500 outline-none resize-none mb-3"
                  rows={4}
                />
                <button
                  onClick={sendMessage}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold transition-all active:scale-95 shadow-lg"
                >
                  <Send size={16} />
                  Send Message
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-theme-text flex items-center gap-3 tracking-tight">
            AI Networking Assistant
            <Sparkles className="text-amber-500 animate-pulse" size={28} />
          </h2>
          <p className="text-theme-sub mt-1">Smart matching based on your profile and professional interests.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5 rounded-xl">
            <UserCheck size={16} className="text-emerald-500" />
            <span className="text-xs font-bold text-emerald-500">{connectionCount} Connections</span>
          </div>
          <button 
            onClick={fetchRecommendations}
            disabled={loading}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-5 py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-900/20 active:scale-95"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            <span>Refresh Matches</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ── Recommendations List ── */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="font-bold text-xl text-theme-text">Matches Recommended for You</h3>
          
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-theme-surface p-6 rounded-3xl border border-theme-border animate-pulse">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 bg-theme-border rounded-2xl"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-theme-border rounded w-1/4"></div>
                      <div className="h-3 bg-theme-border rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-theme-border rounded w-full"></div>
                    <div className="h-3 bg-theme-border rounded w-3/4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : recommendations.length > 0 ? (
            <div className="space-y-4">
              {recommendations.map((rec, idx) => {
                const matchId = rec.match?.id;
                const isConnected = matchId && connectedIds.has(matchId);
                const isConnecting = matchId && connectingId === matchId;
                const scorePct = Math.round((rec.score ?? 0) * 100);
                const company = rec.match?.company;
                const industry = rec.match?.industry;

                return (
                  <div key={idx} className="bg-theme-surface p-6 rounded-3xl border border-theme-border shadow-sm hover:shadow-indigo-500/5 transition-all group">
                    <div className="flex flex-col md:flex-row md:items-start gap-6">
                      <div className="flex-shrink-0 relative">
                        <div className={`w-16 h-16 bg-gradient-to-br ${NODE_COLORS[idx % NODE_COLORS.length]} rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-lg`}>
                          {rec.name?.[0] || '?'}
                        </div>
                        {isConnected && (
                          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-theme-surface">
                            <CheckCircle2 size={12} className="text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-3">
                              <h4 className="text-lg font-bold text-theme-text">{rec.name}</h4>
                              <div className={`px-2 py-0.5 rounded-lg text-[10px] font-black tracking-wider ${
                                scorePct >= 70 ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                                scorePct >= 40 ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                                'bg-theme-border text-theme-sub border border-theme-border'
                              }`}>
                                {scorePct}% MATCH
                              </div>
                            </div>
                            {(company || industry) && (
                              <p className="text-xs text-theme-sub mt-0.5">{[company, industry].filter(Boolean).join(' · ')}</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleConnect(rec)}
                              disabled={!!isConnected || !!isConnecting}
                              className={`p-2.5 rounded-xl transition-all border ${
                                isConnected
                                  ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 cursor-default'
                                  : 'text-theme-sub hover:text-indigo-400 hover:bg-indigo-600/10 border-transparent hover:border-indigo-500/20'
                              }`}
                              title={isConnected ? 'Connected' : 'Connect'}
                            >
                              {isConnecting ? (
                                <RefreshCw size={20} className="animate-spin" />
                              ) : isConnected ? (
                                <UserCheck size={20} />
                              ) : (
                                <UserPlus size={20} />
                              )}
                            </button>
                            <button
                              onClick={() => handleMessage(rec)}
                              className="p-2.5 text-theme-sub hover:text-indigo-400 hover:bg-indigo-600/10 rounded-xl transition-all border border-transparent hover:border-indigo-500/20"
                              title="Send message"
                            >
                              <MessageSquare size={20} />
                            </button>
                          </div>
                        </div>

                        {/* Match score bar */}
                        <div className="w-full bg-theme-bg rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${
                              scorePct >= 70 ? 'bg-emerald-500' : scorePct >= 40 ? 'bg-amber-500' : 'bg-indigo-500'
                            }`}
                            style={{ width: `${scorePct}%` }}
                          />
                        </div>

                        <div className="p-4 bg-indigo-600/5 rounded-2xl border border-indigo-500/10">
                          <p className="text-[10px] font-bold text-indigo-400 mb-1.5 uppercase tracking-widest">AI Reasoning</p>
                          <p className="text-theme-sub text-sm leading-relaxed">{rec.reason}</p>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-theme-sub bg-theme-bg p-3.5 rounded-xl border border-theme-border">
                          <span className="font-black text-indigo-400 uppercase text-[9px] tracking-widest">Starter:</span>
                          <span className="italic">"{rec.starter}"</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-theme-surface border-2 border-dashed border-theme-border rounded-3xl p-12 text-center">
              <Network className="mx-auto text-theme-sub opacity-30 mb-4" size={48} />
              <p className="text-theme-sub font-bold">Click "Refresh Matches" to find your network peers.</p>
              <p className="text-theme-sub text-xs mt-2 opacity-70">Make sure you have interests set in your profile for better matching.</p>
            </div>
          )}
        </div>

        {/* ── Sidebar ── */}
        <div className="space-y-6">
          {/* Profile card */}
          <div className="bg-indigo-600 p-6 rounded-3xl text-white shadow-2xl shadow-indigo-900/40 border border-indigo-500/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
               <Network size={80} />
            </div>
            <h3 className="font-black text-xl mb-1 relative z-10">My Networking Profile</h3>
            <p className="text-indigo-100 text-xs mb-6 relative z-10 opacity-70 uppercase tracking-widest font-bold">Interests Matching Active</p>
            <div className="space-y-4 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-xl border border-white/20 flex items-center justify-center font-black">{(currentUser?.name || 'U')[0].toUpperCase()}{(currentUser?.name || 'User').split(' ')[1]?.[0]?.toUpperCase() || ''}</div>
                <div>
                  <p className="font-bold">{currentUser?.name || 'User'}</p>
                  <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest opacity-80">{currentUser?.company || 'My Company'}</p>
                </div>
              </div>
              <div className="pt-4 border-t border-white/10">
                <p className="text-[9px] font-bold text-indigo-100 uppercase tracking-[0.2em] mb-3">Interests</p>
                <div className="flex flex-wrap gap-1.5">
                  {(currentUser?.interests || []).length > 0 ? (currentUser.interests.map((interest: string) => (
                    <span key={interest} className="text-[9px] font-bold bg-white/10 border border-white/10 px-2.5 py-1 rounded-lg">{interest}</span>
                  ))) : (
                    <span className="text-[9px] italic text-indigo-200 opacity-60">No interests set — update your profile</span>
                  )}
                </div>
              </div>
              {(currentUser?.skills?.length > 0 || currentUser?.goals?.length > 0) && (
                <div className="pt-3 border-t border-white/10 space-y-2">
                  {currentUser.skills?.length > 0 && (
                    <div>
                      <p className="text-[9px] font-bold text-indigo-100 uppercase tracking-[0.2em] mb-1.5">Skills</p>
                      <div className="flex flex-wrap gap-1.5">
                        {currentUser.skills.map((s: string) => (
                          <span key={s} className="text-[9px] font-bold bg-white/10 border border-white/10 px-2.5 py-1 rounded-lg">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {currentUser.goals?.length > 0 && (
                    <div>
                      <p className="text-[9px] font-bold text-indigo-100 uppercase tracking-[0.2em] mb-1.5">Goals</p>
                      <div className="flex flex-wrap gap-1.5">
                        {currentUser.goals.map((g: string) => (
                          <span key={g} className="text-[9px] font-bold bg-white/10 border border-white/10 px-2.5 py-1 rounded-lg">{g}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              <button 
                onClick={() => onTabChange?.('profile')}
                className="w-full mt-4 flex items-center justify-center gap-2 py-3 bg-white text-indigo-600 font-black rounded-xl text-xs uppercase tracking-widest transition-transform hover:scale-[1.02] active:scale-95 shadow-xl"
              >
                Update Preferences
              </button>
            </div>
          </div>

          {/* Dynamic Network Graph */}
          <div className="bg-theme-surface p-6 rounded-3xl border border-theme-border shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-theme-text">Network Graph</h3>
              <span className="text-[9px] font-black text-theme-sub uppercase tracking-widest">{graphNodes.length} nodes</span>
            </div>
            <div className="aspect-square bg-theme-bg rounded-2xl relative flex items-center justify-center overflow-hidden border border-theme-border">
              {/* Connection lines (SVG) */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {graphNodes.map((rec, i) => {
                  const deg = (360 / nodeCount) * i - 90;
                  const rad = (deg * Math.PI) / 180;
                  const x2 = 50 + 33 * Math.cos(rad);
                  const y2 = 50 + 33 * Math.sin(rad);
                  const matchId = rec.match?.id;
                  const connected = matchId && connectedIds.has(matchId);
                  const scorePct = Math.round((rec.score ?? 0) * 100);
                  return (
                    <line
                      key={i}
                      x1="50%"
                      y1="50%"
                      x2={`${x2}%`}
                      y2={`${y2}%`}
                      stroke={connected ? '#10B981' : '#6366f1'}
                      strokeWidth={Math.max(1, scorePct / 25)}
                      opacity={connected ? 0.7 : 0.25}
                      strokeDasharray={connected ? 'none' : '4 3'}
                    />
                  );
                })}
              </svg>

              {/* Center ME node */}
              <div className="w-14 h-14 bg-indigo-600 rounded-full flex items-center justify-center text-white z-10 shadow-2xl border-4 border-theme-surface font-black text-[10px] tracking-wide">
                ME
              </div>

              {/* Dynamic peer nodes */}
              {graphNodes.map((rec, i) => {
                const deg = (360 / nodeCount) * i - 90;
                const matchId = rec.match?.id;
                const connected = matchId && connectedIds.has(matchId);
                const scorePct = Math.round((rec.score ?? 0) * 100);
                return (
                  <div
                    key={i}
                    className={`absolute w-10 h-10 rounded-xl flex items-center justify-center text-white text-[10px] font-black transition-all duration-300 hover:scale-125 cursor-pointer shadow-lg ${
                      connected ? 'ring-2 ring-emerald-400 ring-offset-1 ring-offset-transparent' : ''
                    }`}
                    style={{
                      transform: `rotate(${deg}deg) translate(75px) rotate(-${deg}deg)`,
                      background: connected
                        ? 'linear-gradient(135deg, #10B981, #059669)'
                        : `linear-gradient(135deg, ${['#8B5CF6','#06B6D4','#F59E0B','#EF4444','#EC4899','#3B82F6'][i % 6]}, ${['#6D28D9','#0891B2','#D97706','#DC2626','#DB2777','#2563EB'][i % 6]})`,
                    }}
                    title={`${rec.name} — ${scorePct}% match${connected ? ' ✓ Connected' : ''}`}
                  >
                    {rec.name?.[0] || '?'}
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex items-center justify-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                <span className="text-[9px] font-bold text-theme-sub uppercase tracking-widest">Connected</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-500"></div>
                <span className="text-[9px] font-bold text-theme-sub uppercase tracking-widest">Suggested</span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-theme-surface p-5 rounded-3xl border border-theme-border shadow-sm">
            <h3 className="font-bold text-sm text-theme-text mb-3">Network Stats</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-theme-bg rounded-xl p-3 border border-theme-border text-center">
                <Users size={18} className="mx-auto text-indigo-400 mb-1" />
                <p className="text-lg font-black text-theme-text">{connectionCount}</p>
                <p className="text-[9px] text-theme-sub font-bold uppercase tracking-widest">Friends</p>
              </div>
              <div className="bg-theme-bg rounded-xl p-3 border border-theme-border text-center">
                <Zap size={18} className="mx-auto text-amber-400 mb-1" />
                <p className="text-lg font-black text-theme-text">{recommendations.length}</p>
                <p className="text-[9px] text-theme-sub font-bold uppercase tracking-widest">Matches</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AINetworking;
