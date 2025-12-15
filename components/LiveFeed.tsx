import React, { useState, useEffect } from 'react';
import { BugEvent, subscribeToEvents, fetchRecentEvents } from '../services/events';
import { BugSeverity } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { Bug, CheckCircle, AlertTriangle, XCircle, Zap } from 'lucide-react';
import { playGongSound, playGreatSuccessSound } from '../services/sound';
import clsx from 'clsx';

interface LiveFeedProps {
  soundEnabled?: boolean;
}

export const LiveFeed: React.FC<LiveFeedProps> = ({ soundEnabled = true }) => {
  const [events, setEvents] = useState<BugEvent[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Load recent events
    fetchRecentEvents(10).then(setEvents).catch(console.error);

    // Subscribe to new events
    const unsubscribe = subscribeToEvents((newEvent) => {
      setEvents((prev) => [newEvent, ...prev].slice(0, 20));
      
      // Trigger animation
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 500);
      
      // Play sound for important events
      if (soundEnabled) {
        if (newEvent.type === 'bug_fixed' && newEvent.severity === BugSeverity.CRITICAL) {
          playGreatSuccessSound().catch(console.error);
        } else if (newEvent.type === 'bug_fixed') {
          playGreatSuccessSound().catch(console.error);
        }
      }
    });

    return unsubscribe;
  }, [soundEnabled]);

  const getEventIcon = (event: BugEvent) => {
    switch (event.type) {
      case 'bug_opened':
        return <Bug className="w-4 h-4" />;
      case 'bug_fixed':
        return <CheckCircle className="w-4 h-4" />;
      case 'bug_reopened':
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getEventColor = (event: BugEvent) => {
    if (event.type === 'bug_fixed') {
      switch (event.severity) {
        case BugSeverity.CRITICAL:
          return 'text-red-400 bg-red-500/10 border-red-500/20';
        case BugSeverity.HIGH:
          return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
        default:
          return 'text-green-400 bg-green-500/10 border-green-500/20';
      }
    }
    if (event.type === 'bug_opened') {
      switch (event.severity) {
        case BugSeverity.CRITICAL:
          return 'text-red-400 bg-red-500/10 border-red-500/20';
        case BugSeverity.HIGH:
          return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
        default:
          return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      }
    }
    return 'text-neutral-400 bg-neutral-800 border-neutral-700';
  };

  const getEventMessage = (event: BugEvent) => {
    switch (event.type) {
      case 'bug_opened':
        return `New ${event.severity.toLowerCase()} bug opened`;
      case 'bug_fixed':
        return `${event.severity === BugSeverity.CRITICAL ? '🔥 CRITICAL' : event.severity} bug fixed`;
      case 'bug_reopened':
        return 'Bug reopened';
      default:
        return 'Bug updated';
    }
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-5 h-5 text-neon-pink" />
        <h2 className="text-xl font-bold">Live Feed</h2>
      </div>
      
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {events.length === 0 ? (
          <div className="text-center py-8 text-neutral-500 text-sm">
            No events yet. Start hunting bugs!
          </div>
        ) : (
          events.map((event) => (
            <div
              key={event.id}
              className={clsx(
                'flex items-center gap-3 p-3 rounded-lg border transition-all',
                getEventColor(event),
                isAnimating && events[0]?.id === event.id && 'animate-pulse'
              )}
            >
              {getEventIcon(event)}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">
                  {getEventMessage(event)}
                </div>
                <div className="text-xs opacity-70 flex items-center gap-2 mt-1">
                  {event.type === 'bug_fixed' && event.solver && (
                    <span>by <span className="font-bold">{event.solver}</span></span>
                  )}
                  {event.type === 'bug_opened' && (
                    <span>by <span className="font-bold">{event.reporter}</span></span>
                  )}
                  <span>•</span>
                  <span>{formatDistanceToNow(event.createdAt, { addSuffix: true })}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

