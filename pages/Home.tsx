import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createSession } from '../services/db';
import { ArrowRight, Play, Bug } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [eventName, setEventName] = useState('');

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventName.trim()) return;

    const id = uuidv4();
    await createSession({
      id,
      name: eventName,
      startTime: new Date(),
      isActive: true
    });

    navigate(`/session/${id}/control`);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center max-w-2xl mx-auto">
      <div className="mb-8 relative">
        <div className="absolute -inset-4 bg-neon-pink/20 blur-xl rounded-full"></div>
        <Bug className="w-24 h-24 text-white relative z-10" />
      </div>
      
      <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 bg-gradient-to-r from-white via-purple-200 to-neon-pink bg-clip-text text-transparent">
        BugHunt Live
      </h1>
      
      <p className="text-xl text-neutral-400 mb-12 max-w-lg leading-relaxed">
        Gamify your bug bash. Track reports in real-time, compete on leaderboards, and celebrate every fix.
      </p>

      <form onSubmit={handleCreateSession} className="w-full max-w-md bg-neutral-900/50 p-2 rounded-xl border border-neutral-800 flex items-center shadow-2xl">
        <input
          type="text"
          placeholder="Name your event (e.g. 'Q4 Bug Bash')"
          className="flex-1 bg-transparent border-none focus:ring-0 text-white px-4 py-3 placeholder:text-neutral-600 outline-none"
          value={eventName}
          onChange={(e) => setEventName(e.target.value)}
          required
        />
        <button 
          type="submit"
          className="bg-white hover:bg-neutral-200 text-black px-6 py-3 rounded-lg font-bold transition-colors flex items-center gap-2"
        >
          Start <ArrowRight className="w-4 h-4" />
        </button>
      </form>
      
      <div className="mt-12 grid grid-cols-3 gap-8 text-center border-t border-neutral-800 pt-8 w-full">
        <div>
            <div className="text-neon-green font-mono font-bold text-2xl mb-1">Real-time</div>
            <div className="text-xs text-neutral-500 uppercase tracking-widest">Updates</div>
        </div>
        <div>
            <div className="text-neon-pink font-mono font-bold text-2xl mb-1">Instant</div>
            <div className="text-xs text-neutral-500 uppercase tracking-widest">Leaderboards</div>
        </div>
        <div>
            <div className="text-neon-blue font-mono font-bold text-2xl mb-1">Sound</div>
            <div className="text-xs text-neutral-500 uppercase tracking-widest">Effects</div>
        </div>
      </div>
    </div>
  );
};