import React, { useState } from 'react';
import { Bug, BugSeverity, BugStatus } from '../types';
import { Search, X, Filter } from 'lucide-react';

interface BugSearchProps {
  bugs: Bug[];
  onFilteredBugsChange: (filteredBugs: Bug[]) => void;
}

export const BugSearch: React.FC<BugSearchProps> = ({ bugs, onFilteredBugsChange }) => {
  const [searchText, setSearchText] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<BugSeverity | 'ALL'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<BugStatus | 'ALL'>('ALL');
  const [reporterFilter, setReporterFilter] = useState('');
  const [solverFilter, setSolverFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Get unique reporters and solvers for filter dropdowns
  const uniqueReporters = Array.from(new Set(bugs.map(b => b.reporterName).filter(Boolean))).sort();
  const uniqueSolvers = Array.from(new Set(bugs.map(b => b.solverName).filter(Boolean))).sort();

  // Apply filters and initialize
  React.useEffect(() => {
    let filtered = [...bugs];

    // Text search (title and description)
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(bug =>
        bug.title.toLowerCase().includes(searchLower) ||
        bug.description.toLowerCase().includes(searchLower)
      );
    }

    // Severity filter
    if (selectedSeverity !== 'ALL') {
      filtered = filtered.filter(bug => bug.severity === selectedSeverity);
    }

    // Status filter
    if (selectedStatus !== 'ALL') {
      filtered = filtered.filter(bug => bug.status === selectedStatus);
    }

    // Reporter filter
    if (reporterFilter) {
      filtered = filtered.filter(bug => 
        bug.reporterName.toLowerCase().includes(reporterFilter.toLowerCase())
      );
    }

    // Solver filter
    if (solverFilter) {
      filtered = filtered.filter(bug => 
        bug.solverName?.toLowerCase().includes(solverFilter.toLowerCase())
      );
    }

    onFilteredBugsChange(filtered);
  }, [searchText, selectedSeverity, selectedStatus, reporterFilter, solverFilter, bugs, onFilteredBugsChange]);

  const clearFilters = () => {
    setSearchText('');
    setSelectedSeverity('ALL');
    setSelectedStatus('ALL');
    setReporterFilter('');
    setSolverFilter('');
  };

  const hasActiveFilters = searchText || selectedSeverity !== 'ALL' || selectedStatus !== 'ALL' || reporterFilter || solverFilter;

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 mb-6">
      {/* Main Search Bar */}
      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-500" />
          <input
            type="text"
            placeholder="Search bugs by title or description..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-700 rounded-lg pl-10 pr-10 py-2 text-white placeholder-neutral-500 focus:ring-2 focus:ring-neon-pink focus:border-transparent outline-none"
          />
          {searchText && (
            <button
              onClick={() => setSearchText('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
            showFilters || hasActiveFilters
              ? 'bg-neon-pink/20 text-neon-pink border border-neon-pink/50'
              : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
          }`}
        >
          <Filter className="w-4 h-4" />
          Filters
          {hasActiveFilters && (
            <span className="bg-neon-pink text-white text-xs px-1.5 py-0.5 rounded-full">
              {[
                selectedSeverity !== 'ALL' ? 1 : 0,
                selectedStatus !== 'ALL' ? 1 : 0,
                reporterFilter ? 1 : 0,
                solverFilter ? 1 : 0
              ].reduce((a, b) => a + b, 0)}
            </span>
          )}
        </button>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-neutral-800 animate-in fade-in slide-in-from-top-2">
          {/* Severity Filter */}
          <div>
            <label className="text-xs font-bold text-neutral-400 uppercase mb-2 block">Severity</label>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value as BugSeverity | 'ALL')}
              className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-neon-pink focus:border-transparent outline-none"
            >
              <option value="ALL">All Severities</option>
              {Object.values(BugSeverity).map(severity => (
                <option key={severity} value={severity}>{severity}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="text-xs font-bold text-neutral-400 uppercase mb-2 block">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as BugStatus | 'ALL')}
              className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-neon-pink focus:border-transparent outline-none"
            >
              <option value="ALL">All Statuses</option>
              {Object.values(BugStatus).map(status => (
                <option key={status} value={status}>{status.replace('_', ' ')}</option>
              ))}
            </select>
          </div>

          {/* Reporter Filter */}
          <div>
            <label className="text-xs font-bold text-neutral-400 uppercase mb-2 block">Reporter</label>
            <input
              type="text"
              placeholder="Filter by reporter..."
              value={reporterFilter}
              onChange={(e) => setReporterFilter(e.target.value)}
              list="reporters-list"
              className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm placeholder-neutral-500 focus:ring-2 focus:ring-neon-pink focus:border-transparent outline-none"
            />
            <datalist id="reporters-list">
              {uniqueReporters.map(reporter => (
                <option key={reporter} value={reporter} />
              ))}
            </datalist>
          </div>

          {/* Solver Filter */}
          <div>
            <label className="text-xs font-bold text-neutral-400 uppercase mb-2 block">Solver</label>
            <input
              type="text"
              placeholder="Filter by solver..."
              value={solverFilter}
              onChange={(e) => setSolverFilter(e.target.value)}
              list="solvers-list"
              className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm placeholder-neutral-500 focus:ring-2 focus:ring-neon-pink focus:border-transparent outline-none"
            />
            <datalist id="solvers-list">
              {uniqueSolvers.map(solver => (
                <option key={solver} value={solver} />
              ))}
            </datalist>
          </div>
        </div>
      )}
    </div>
  );
};

