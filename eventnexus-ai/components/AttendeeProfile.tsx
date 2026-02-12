import React, { useEffect, useState } from 'react';
import { User, Briefcase, Mail, Phone, Sparkles, Save, CheckCircle, AlertCircle, Plus, X, Target, Wrench } from 'lucide-react';
import { api, ProfileUpdate } from '../services/api';

const INTEREST_OPTIONS = [
  'AI / Machine Learning', 'Cloud Native', 'React / Frontend', 'Blockchain',
  'DevOps', 'Cybersecurity', 'Data Science', 'IoT', 'Mobile Dev', 'UI/UX Design',
  'PWA', 'Serverless', 'Kubernetes', 'Web3',
];

interface AttendeeProfileProps {
  currentUser: any;
  onProfileUpdate: (user: any) => void;
}

function TagInput({ tags, onChange, placeholder }: { tags: string[]; onChange: (t: string[]) => void; placeholder?: string }) {
  const [input, setInput] = useState('');
  const add = () => {
    const val = input.trim();
    if (val && !tags.includes(val)) {
      onChange([...tags, val]);
    }
    setInput('');
  };
  return (
    <div className="mt-2">
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map(t => (
          <span key={t} className="inline-flex items-center gap-1 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 px-2.5 py-1 rounded-lg text-xs font-bold">
            {t}
            <button onClick={() => onChange(tags.filter(x => x !== t))} className="hover:text-red-400 transition-colors"><X size={12} /></button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), add())}
          placeholder={placeholder}
          className="flex-1 bg-theme-bg border border-theme-border rounded-xl py-2 px-3 text-sm text-theme-text focus:ring-2 focus:ring-indigo-500 outline-none placeholder:text-theme-sub"
        />
        <button onClick={add} className="px-3 py-2 bg-indigo-600/10 border border-indigo-500/20 rounded-xl text-indigo-400 hover:bg-indigo-600/20 transition-colors"><Plus size={16} /></button>
      </div>
    </div>
  );
}

const AttendeeProfile: React.FC<AttendeeProfileProps> = ({ currentUser, onProfileUpdate }) => {
  const [profile, setProfile] = useState<any>(currentUser);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const p = await api.getProfile();
        setProfile(p);
      } catch {
        setProfile(currentUser);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const toggleInterest = (i: string) => {
    setProfile((prev: any) => {
      const current = prev.interests || [];
      return {
        ...prev,
        interests: current.includes(i) ? current.filter((x: string) => x !== i) : [...current, i],
      };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const payload: ProfileUpdate = {
        name: profile.name,
        company: profile.company,
        industry: profile.industry,
        interests: profile.interests,
        skills: profile.skills,
        goals: profile.goals,
        phone: profile.phone,
      };
      const updated = await api.updateProfile(payload);
      setProfile(updated);
      onProfileUpdate(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err?.message || 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-3xl">
      <div>
        <h2 className="text-3xl font-black text-theme-text tracking-tight">My Profile</h2>
        <p className="text-theme-sub mt-1">Personalize your profile for smarter AI networking matches.</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-bold">
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {saved && (
        <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-bold">
          <CheckCircle size={14} /> Profile saved successfully!
        </div>
      )}

      <div className="bg-theme-surface rounded-3xl border border-theme-border p-8 space-y-6">
        {/* Avatar & Header */}
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-indigo-900/20">
            {(profile?.name || 'U')[0].toUpperCase()}
          </div>
          <div>
            <h3 className="text-xl font-bold text-theme-text">{profile?.name || 'User'}</h3>
            <p className="text-theme-sub text-sm">{profile?.email}</p>
            <span className="mt-1 inline-block text-[9px] font-black text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-lg uppercase tracking-widest">
              {profile?.role || 'ATTENDEE'}
            </span>
          </div>
        </div>

        <div className="w-full h-px bg-theme-border" />

        {/* Name */}
        <div>
          <label className="text-[10px] font-bold text-theme-sub uppercase tracking-widest">Full Name</label>
          <div className="mt-1.5 relative">
            <User size={16} className="absolute left-3 top-3.5 text-theme-sub" />
            <input
              type="text"
              value={profile?.name || ''}
              onChange={e => setProfile({ ...profile, name: e.target.value })}
              className="w-full bg-theme-bg border border-theme-border rounded-xl py-3 pl-10 pr-4 text-sm text-theme-text focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>

        {/* Company & Industry */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-bold text-theme-sub uppercase tracking-widest">Company</label>
            <div className="mt-1.5 relative">
              <Briefcase size={16} className="absolute left-3 top-3.5 text-theme-sub" />
              <input
                type="text"
                value={profile?.company || ''}
                onChange={e => setProfile({ ...profile, company: e.target.value })}
                placeholder="Your company"
                className="w-full bg-theme-bg border border-theme-border rounded-xl py-3 pl-10 pr-4 text-sm text-theme-text focus:ring-2 focus:ring-indigo-500 outline-none placeholder:text-theme-sub"
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-theme-sub uppercase tracking-widest">Industry</label>
            <input
              type="text"
              value={profile?.industry || ''}
              onChange={e => setProfile({ ...profile, industry: e.target.value })}
              placeholder="Software, Finance, etc."
              className="mt-1.5 w-full bg-theme-bg border border-theme-border rounded-xl py-3 px-4 text-sm text-theme-text focus:ring-2 focus:ring-indigo-500 outline-none placeholder:text-theme-sub"
            />
          </div>
        </div>

        {/* Phone */}
        <div>
          <label className="text-[10px] font-bold text-theme-sub uppercase tracking-widest">Phone</label>
          <div className="mt-1.5 relative">
            <Phone size={16} className="absolute left-3 top-3.5 text-theme-sub" />
            <input
              type="tel"
              value={profile?.phone || ''}
              onChange={e => setProfile({ ...profile, phone: e.target.value })}
              placeholder="+1 (555) 000-0000"
              className="w-full bg-theme-bg border border-theme-border rounded-xl py-3 pl-10 pr-4 text-sm text-theme-text focus:ring-2 focus:ring-indigo-500 outline-none placeholder:text-theme-sub"
            />
          </div>
        </div>

        {/* Interests */}
        <div>
          <label className="text-[10px] font-bold text-theme-sub uppercase tracking-widest flex items-center gap-2">
            <Sparkles size={12} className="text-indigo-400" />
            Interests — powers AI networking recommendations
          </label>
          <div className="mt-3 flex flex-wrap gap-2">
            {INTEREST_OPTIONS.map(i => {
              const selected = (profile?.interests || []).includes(i);
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => toggleInterest(i)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    selected
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'bg-theme-bg border-theme-border text-theme-sub hover:border-indigo-500/40'
                  }`}
                >
                  {i}
                </button>
              );
            })}
          </div>
        </div>

        {/* Skills */}
        <div>
          <label className="text-[10px] font-bold text-theme-sub uppercase tracking-widest flex items-center gap-2">
            <Wrench size={12} className="text-cyan-400" />
            Skills — what you're good at
          </label>
          <TagInput
            tags={profile?.skills || []}
            onChange={skills => setProfile({ ...profile, skills })}
            placeholder="e.g. Python, React, DevOps"
          />
        </div>

        {/* Goals */}
        <div>
          <label className="text-[10px] font-bold text-theme-sub uppercase tracking-widest flex items-center gap-2">
            <Target size={12} className="text-amber-400" />
            Goals — what you're looking for
          </label>
          <TagInput
            tags={profile?.goals || []}
            onChange={goals => setProfile({ ...profile, goals })}
            placeholder="e.g. Find co-founder, Learn AI, Hire engineers"
          />
        </div>

        <div className="w-full h-px bg-theme-border" />

        {/* Save */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-black text-sm transition-all shadow-lg shadow-indigo-900/20 disabled:opacity-60 active:scale-95"
          >
            {saving ? (
              <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <Save size={16} />
            )}
            Save Profile
          </button>
        </div>
      </div>
    </div>
  );
};

export default AttendeeProfile;
