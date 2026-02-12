
import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import VenueEditor from './components/VenueEditor';
import AINetworking from './components/AINetworking';
import Badges from './components/Badges';
import EventEngagement from './components/EventEngagement';
import Settings from './components/Settings';
import AIAssistant from './components/AIAssistant';
import AuthScreen from './components/AuthScreen';
import AttendeeProfile from './components/AttendeeProfile';
import { UserRole } from './types';
import { authStore } from './services/api';
import { 
  Search, 
  ChevronDown, 
  Mic, 
  Camera, 
  Cpu,
  Zap,
  User,
  ShieldCheck,
  Check,
  LogOut
} from 'lucide-react';

const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [role, setRole] = useState<UserRole>(UserRole.ATTENDEE);
  const [searchQuery, setSearchQuery] = useState('');
  const [isGestureMode, setIsGestureMode] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(authStore.isLoggedIn());
  const [currentUser, setCurrentUser] = useState<any>(authStore.getUser());
  
  const roleDropdownRef = useRef<HTMLDivElement>(null);

  // Listen for forced logout (401 from API)
  useEffect(() => {
    const handleLogout = () => {
      setIsAuthenticated(false);
      setCurrentUser(null);
    };
    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, []);

  // Sync role from user profile
  useEffect(() => {
    if (currentUser?.role) {
      setRole(currentUser.role === 'ORGANIZER' ? UserRole.ORGANIZER : UserRole.ATTENDEE);
    }
  }, [currentUser]);

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light-mode');
    } else {
      document.documentElement.classList.remove('light-mode');
    }
  }, [theme]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(event.target as Node)) {
        setIsRoleDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAuth = (user: any) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    setRole(user.role === 'ORGANIZER' ? UserRole.ORGANIZER : UserRole.ATTENDEE);
  };

  const handleLogout = () => {
    authStore.clear();
    setIsAuthenticated(false);
    setCurrentUser(null);
    setCurrentTab('dashboard');
  };

  const handleVoiceCommand = () => {
    alert("Voice command system initialized. Listening...");
  };

  // ── Auth Gate ──────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return <AuthScreen onAuth={handleAuth} />;
  }

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return <Dashboard onTabChange={setCurrentTab} />;
      case 'events':
      case 'sessions':
        return <EventEngagement userRole={role} />;
      case 'venue':
        return <VenueEditor />;
      case 'networking':
        return <AINetworking currentUser={currentUser} onTabChange={setCurrentTab} />;
      case 'badges':
        return <Badges />;
      case 'assistant':
        return <AIAssistant />;
      case 'profile':
        return (
          <AttendeeProfile
            currentUser={currentUser}
            onProfileUpdate={(u) => {
              setCurrentUser(u);
              authStore.setAuth(authStore.getToken()!, u);
            }}
          />
        );
      case 'settings':
        return <Settings theme={theme} onThemeChange={setTheme} />;
      default:
        return (
          <div className="flex flex-col items-center justify-center min-h-[600px] text-center p-8 bg-theme-surface rounded-3xl border border-dashed border-theme-border">
            <div className="w-20 h-20 bg-theme-border rounded-full flex items-center justify-center text-slate-600 mb-6">
              <Zap size={40} />
            </div>
            <h3 className="text-2xl font-bold text-theme-text mb-2">Coming Soon</h3>
            <p className="text-theme-sub max-w-md">We're working hard to bring the {currentTab} module to EventNexus. Stay tuned for updates!</p>
          </div>
        );
    }
  };

  const RoleOption = ({ targetRole, label, description, icon: Icon }: any) => (
    <button
      onClick={() => {
        setRole(targetRole);
        setIsRoleDropdownOpen(false);
      }}
      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
        role === targetRole 
          ? 'bg-indigo-600/10 text-indigo-500' 
          : 'text-theme-sub hover:bg-theme-bg hover:text-theme-text'
      }`}
    >
      <div className={`p-2 rounded-lg ${role === targetRole ? 'bg-indigo-600 text-white' : 'bg-theme-border text-theme-sub'}`}>
        <Icon size={16} />
      </div>
      <div className="flex-1 text-left">
        <p className="text-xs font-black uppercase tracking-widest">{label}</p>
        <p className="text-[10px] opacity-60 font-medium">{description}</p>
      </div>
      {role === targetRole && <Check size={14} className="text-indigo-500" />}
    </button>
  );

  return (
    <div className={`flex h-screen bg-theme-bg text-theme-text overflow-hidden`}>
      <Sidebar 
        currentTab={currentTab} 
        onTabChange={setCurrentTab} 
        userRole={role} 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
      />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 lg:h-20 bg-theme-surface border-b border-theme-border flex items-center justify-between px-4 lg:px-8 shrink-0">
          <div className="flex items-center gap-4 flex-1">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 hover:bg-theme-border rounded-lg">
              <Cpu size={20} className="text-indigo-400" />
            </button>
            
            <div className="hidden md:flex items-center flex-1 max-w-md relative">
              <Search className="absolute left-3 text-theme-sub" size={18} />
              <input 
                type="text" 
                placeholder="Search attendees, sessions, or booths..."
                className="w-full bg-theme-border border border-theme-border rounded-xl py-2 pl-10 pr-4 text-sm text-theme-text focus:ring-2 focus:ring-indigo-500 transition-all outline-none placeholder:text-theme-sub"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 lg:gap-4">
             <div className="flex items-center gap-1">
               <button 
                onClick={handleVoiceCommand}
                className="p-2.5 text-theme-sub hover:text-indigo-400 hover:bg-theme-border rounded-xl transition-all relative group"
                title="Voice Navigation"
               >
                 <Mic size={20} />
                 <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-theme-surface"></span>
               </button>
               <button 
                onClick={() => setIsGestureMode(!isGestureMode)}
                className={`p-2.5 rounded-xl transition-all relative ${isGestureMode ? 'bg-indigo-600 text-white' : 'text-theme-sub hover:text-indigo-400 hover:bg-theme-border'}`}
                title="Gesture Mode"
               >
                 <Camera size={20} />
                 {isGestureMode && <span className="absolute -bottom-1 -right-1 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span></span>}
               </button>
             </div>

            <div className="h-8 w-[1px] bg-theme-border mx-2"></div>

            {/* User Info + Profile Link */}
            <button
              onClick={() => setCurrentTab('profile')}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-theme-border transition-all"
              title="My Profile"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-xs font-black">
                {(currentUser?.name || 'U')[0].toUpperCase()}
              </div>
              <span className="text-xs font-bold text-theme-text max-w-[100px] truncate">{currentUser?.name || 'User'}</span>
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="p-2.5 text-theme-sub hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
              title="Logout"
            >
              <LogOut size={18} />
            </button>

            {/* Custom Role Dropdown */}
            <div className="relative" ref={roleDropdownRef}>
              <button 
                onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                className={`flex items-center gap-3 pl-3 pr-2 py-1.5 rounded-xl transition-all border ${
                  isRoleDropdownOpen 
                    ? 'bg-indigo-600/10 border-indigo-500/30' 
                    : 'bg-theme-bg border-theme-border hover:border-theme-sub2'
                }`}
              >
                <div className="flex flex-col items-end hidden sm:flex">
                  <span className="text-[9px] font-black text-theme-sub uppercase tracking-[0.2em] leading-none mb-1">Active Persona</span>
                  <span className="text-xs font-bold text-indigo-500">{role === UserRole.ORGANIZER ? 'Organizer' : 'Attendee'}</span>
                </div>
                <div className={`p-1.5 rounded-lg ${role === UserRole.ORGANIZER ? 'bg-indigo-600 text-white' : 'bg-emerald-600 text-white'}`}>
                  {role === UserRole.ORGANIZER ? <ShieldCheck size={16} /> : <User size={16} />}
                </div>
                <ChevronDown size={14} className={`text-theme-sub transition-transform duration-200 ${isRoleDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isRoleDropdownOpen && (
                <div className="absolute right-0 mt-3 w-64 bg-theme-surface border border-theme-border rounded-2xl shadow-2xl p-2 z-[100] animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                  <div className="px-3 py-2 border-b border-theme-border mb-2">
                    <p className="text-[10px] font-black text-theme-sub uppercase tracking-[0.2em]">Switch Workspace</p>
                  </div>
                  <div className="space-y-1">
                    <RoleOption 
                      targetRole={UserRole.ORGANIZER} 
                      label="Organizer" 
                      description="Manage events, venues & analytics"
                      icon={ShieldCheck}
                    />
                    <RoleOption 
                      targetRole={UserRole.ATTENDEE} 
                      label="Attendee" 
                      description="Engage with sessions & networking"
                      icon={User}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar relative bg-theme-bg">
          {isGestureMode && (
            <div className="fixed bottom-8 right-8 z-50 bg-theme-surface p-4 rounded-2xl border border-theme-border shadow-2xl animate-in fade-in slide-in-from-bottom-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-600/20 rounded-xl flex items-center justify-center text-indigo-400">
                  <Camera size={24} />
                </div>
                <div>
                  <p className="text-sm font-bold text-theme-text">Gesture Control Active</p>
                  <p className="text-[10px] text-theme-sub">Swipe hand left/right to navigate</p>
                </div>
                <button onClick={() => setIsGestureMode(false)} className="ml-2 text-theme-sub hover:text-red-400">
                  <ChevronDown size={18} />
                </button>
              </div>
            </div>
          )}

          {renderContent()}

          {/* Persistent AI FAB (Assistant) */}
          <button
            onClick={() => setCurrentTab('assistant')}
            className="fixed bottom-8 right-8 z-40 bg-indigo-600 text-white p-4 rounded-full shadow-2xl shadow-indigo-900/40 hover:scale-110 transition-transform active:scale-95 flex items-center justify-center group"
            title="AI Assistant"
          >
            <Zap size={24} fill="white" className="group-hover:animate-pulse" />
          </button>
        </div>
      </main>
    </div>
  );
};

export default App;
