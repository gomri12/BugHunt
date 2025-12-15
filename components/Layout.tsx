import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bug as BugIcon, Monitor, Settings, Gamepad2 } from 'lucide-react';
import clsx from 'clsx';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const isDashboard = location.pathname === '/dashboard';
  const isGamified = location.pathname === '/gamified';

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans">
      <header className="border-b border-neutral-800 bg-neutral-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="bg-neon-pink/20 p-2 rounded-lg">
              <BugIcon className="w-6 h-6 text-neon-pink" />
            </div>
            <span className="font-bold text-xl tracking-tight">Bug<span className="text-neon-pink">Hunt</span></span>
          </Link>
          
          <nav className="flex items-center gap-4">
            {!isGamified && (
              <Link 
                to="/gamified"
                className={clsx(
                    "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                    "text-neutral-400 hover:text-white hover:bg-neutral-800"
                )}
              >
                <Gamepad2 className="w-4 h-4" />
                Gamified
              </Link>
            )}
            <Link 
              to={isDashboard ? "/" : "/dashboard"}
              className={clsx(
                  "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  "text-neutral-400 hover:text-white hover:bg-neutral-800"
              )}
            >
              {isDashboard ? <Settings className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
              {isDashboard ? "My Dashboard" : "Live View"}
            </Link>
          </nav>
        </div>
      </header>
      
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8">
        {children}
      </main>

      <footer className="py-6 text-center text-neutral-600 text-sm">
        <p>© {new Date().getFullYear()} BugHunt Live. Built for fast-paced bug bashes.</p>
      </footer>
    </div>
  );
};