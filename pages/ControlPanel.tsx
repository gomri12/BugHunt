import React, { useState, useEffect } from 'react';
import { useBugs, GLOBAL_SESSION_ID, clearDatabase, onUpdate } from '../services/db';
import { BugForm } from '../components/BugForm';
import { BugList } from '../components/BugList';
import { exportBugsToCSV } from '../services/export';
import { importBugsFromCSV } from '../services/import';
import { playGongSound } from '../services/sound';
import confetti from 'canvas-confetti';
import { User, LogOut, Download, Upload, ArrowRight, Bug, Trash2, Lock, AlertTriangle, Loader2 } from 'lucide-react';

export const ControlPanel: React.FC = () => {
  const [username, setUsername] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; errors: string[] } | null>(null);

  const { bugs, error: bugsError } = useBugs(GLOBAL_SESSION_ID);
  
  useEffect(() => {
    const stored = localStorage.getItem('bughunt_username');
    if (stored) setUsername(stored);
  }, []);

  // Celebrate when bugs are added (from other tabs or users)
  useEffect(() => {
    if (!username) return; // Only celebrate if user is logged in
    
    const unsub = onUpdate((data) => {
      if (data.type === 'BUG_NEW') {
        playGongSound().catch(err => console.error('Gong sound error:', err));
        if (typeof confetti !== 'undefined') {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#ff00ff', '#00ff9d', '#00ccff', '#ffffff', '#764abc'],
            startVelocity: 30,
            gravity: 0.8,
            ticks: 200,
            shapes: ['circle', 'square'],
          });
        }
      }
    });
    return unsub;
  }, [username]);

  const isAdminUser = nameInput.trim() === 'Omri Glam';

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const name = nameInput.trim();
    if (!name) return;

    if (name === 'Omri Glam') {
        if (passwordInput === 'zubur11398') {
            localStorage.setItem('bughunt_username', name);
            setUsername(name);
            setLoginError('');
        } else {
            setLoginError('Incorrect Admin Password');
            return;
        }
    } else {
        localStorage.setItem('bughunt_username', name);
        setUsername(name);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('bughunt_username');
    setUsername(null);
    setNameInput('');
    setPasswordInput('');
    setLoginError('');
  };

  const handleExport = () => {
    if (bugs) {
        exportBugsToCSV(bugs, 'Global Session');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset file input
    e.target.value = '';

    if (!file.name.endsWith('.csv')) {
      alert('Please select a CSV file');
      return;
    }

    setIsImporting(true);
    setImportResult(null);

    try {
      const result = await importBugsFromCSV(file);
      setImportResult(result);
      
      if (result.success > 0) {
        alert(`Successfully imported ${result.success} bug(s)${result.errors.length > 0 ? `\n\nErrors: ${result.errors.length}` : ''}`);
      } else {
        alert(`Import failed:\n${result.errors.join('\n')}`);
      }
    } catch (error: any) {
      console.error('Import error:', error);
      alert(`Import failed: ${error.message || 'Unknown error'}`);
    } finally {
      setIsImporting(false);
    }
  };

  const handleClearData = async () => {
    setIsResetting(true);
    try {
        await clearDatabase(GLOBAL_SESSION_ID);
        // Give a small delay so user sees the loading state
        setTimeout(() => {
            setShowResetConfirm(false);
            setIsResetting(false);
            // Force reload to ensure clean state
            window.location.reload(); 
        }, 1000);
    } catch (e) {
        console.error("Reset failed", e);
        setIsResetting(false);
        alert("Failed to reset database");
    }
  };

  // Login View
  if (!username) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] animate-in fade-in duration-500 max-w-lg mx-auto px-4">
             <div className="mb-8 relative">
                <div className="absolute -inset-4 bg-neon-pink/20 blur-xl rounded-full"></div>
                <Bug className="w-20 h-20 text-white relative z-10" />
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4 bg-gradient-to-r from-white via-purple-200 to-neon-pink bg-clip-text text-transparent text-center">
                BugHunt Live
            </h1>
            <p className="text-neutral-400 mb-8 text-center leading-relaxed">
                Join the session to report bugs, track progress, and climb the leaderboard.
            </p>

            <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-2xl shadow-2xl w-full">
                <div className="mx-auto w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mb-6">
                    {isAdminUser ? <Lock className="w-8 h-8 text-neon-pink" /> : <User className="w-8 h-8 text-neon-pink" />}
                </div>
                <h2 className="text-xl font-bold text-white mb-2 text-center">
                    {isAdminUser ? 'Admin Access' : 'Who are you?'}
                </h2>
                
                <form onSubmit={handleLogin} className="space-y-4">
                    <input 
                        autoFocus
                        type="text" 
                        placeholder="Enter your name"
                        className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-neon-pink outline-none text-lg text-center"
                        value={nameInput}
                        onChange={(e) => {
                            setNameInput(e.target.value);
                            setLoginError('');
                        }}
                    />
                    
                    {isAdminUser && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                             <input 
                                type="password" 
                                placeholder="Admin Password"
                                className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-red-500 outline-none text-lg text-center"
                                value={passwordInput}
                                onChange={(e) => setPasswordInput(e.target.value)}
                            />
                        </div>
                    )}

                    {loginError && (
                        <p className="text-red-500 text-sm text-center font-medium animate-pulse">{loginError}</p>
                    )}

                    <button 
                        type="submit"
                        disabled={!nameInput.trim()}
                        className="w-full bg-white hover:bg-neutral-200 text-black font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        {isAdminUser ? 'Unlock & Join' : 'Join the Hunt'} <ArrowRight className="w-4 h-4" />
                    </button>
                </form>
            </div>
        </div>
    );
  }

  // Logged In View
  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1">My Dashboard</h1>
            <p className="text-neutral-400">
                Logged in as <span className="text-white font-semibold">{username}</span>
            </p>
        </div>
        <div className="flex items-center gap-2">
            <button 
                onClick={handleLogout}
                className="px-4 py-2 border border-neutral-700 hover:bg-neutral-800 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 text-neutral-400 hover:text-white"
            >
                <LogOut className="w-4 h-4" /> Logout
            </button>
        </div>
      </div>

      {username === 'Omri Glam' && (
          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                  <h3 className="text-red-400 font-bold flex items-center gap-2">
                      <Lock className="w-4 h-4" /> Admin Panel
                  </h3>
                  <p className="text-xs text-red-400/70">Restricted actions for event organizer.</p>
              </div>
              <div className="flex gap-2 items-center">
                 <button 
                    onClick={handleExport}
                    className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                    <Download className="w-4 h-4" /> Export CSV
                </button>
                
                <label className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer">
                    {isImporting ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" /> Importing...
                        </>
                    ) : (
                        <>
                            <Upload className="w-4 h-4" /> Import CSV
                        </>
                    )}
                    <input
                        type="file"
                        accept=".csv"
                        onChange={handleImport}
                        disabled={isImporting}
                        className="hidden"
                    />
                </label>
                
                {!showResetConfirm ? (
                    <button 
                        onClick={() => setShowResetConfirm(true)}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                        <Trash2 className="w-4 h-4" /> Reset Database
                    </button>
                ) : (
                    <div className="flex items-center gap-2 bg-neutral-900 p-1 rounded-lg border border-red-500/30">
                        <span className="text-xs text-red-400 font-bold px-2 flex items-center gap-1">
                             <AlertTriangle className="w-3 h-3" /> Sure?
                        </span>
                        <button 
                            onClick={handleClearData}
                            disabled={isResetting}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-bold transition-colors flex items-center gap-2"
                        >
                            {isResetting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Yes, Delete All"}
                        </button>
                        <button 
                            onClick={() => setShowResetConfirm(false)}
                            disabled={isResetting}
                            className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-md text-sm transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                )}
              </div>
          </div>
      )}

      <div className="grid gap-8">
        <section>
          <BugForm username={username} />
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
             <h2 className="text-xl font-bold">Recent Activity</h2>
          </div>
          <BugList username={username} />
        </section>
      </div>
    </div>
  );
};