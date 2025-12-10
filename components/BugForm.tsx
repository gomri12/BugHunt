import React, { useState } from 'react';
import { BugSeverity, BugStatus } from '../types';
import { addBug, GLOBAL_SESSION_ID } from '../services/db';
import { Plus, Loader2 } from 'lucide-react';

interface BugFormProps {
  username: string;
}

export const BugForm: React.FC<BugFormProps> = ({ username }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    severity: BugSeverity.MEDIUM,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await addBug(GLOBAL_SESSION_ID, {
        sessionId: GLOBAL_SESSION_ID,
        title: formData.title,
        description: formData.description,
        severity: formData.severity,
        status: BugStatus.NEW,
        reporterName: username,
        solverName: undefined,
      });

      // Reset form
      setFormData({
        title: '',
        description: '',
        severity: BugSeverity.MEDIUM,
      });
    } catch (error) {
      console.error("Failed to add bug", error);
      alert("Error adding bug");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl space-y-4 shadow-lg">
      <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
        <Plus className="w-5 h-5 text-neon-pink" />
        Report New Bug
      </h2>
      
      <div className="space-y-1">
        <label className="text-sm font-medium text-neutral-400">Bug Title</label>
        <input
          required
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full bg-neutral-950 border border-neutral-700 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-neon-pink focus:border-transparent outline-none"
          placeholder="e.g. Login button misaligned"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-neutral-400">Severity</label>
        <div className="flex gap-2">
          {Object.values(BugSeverity).map((sev) => (
            <button
              key={sev}
              type="button"
              onClick={() => setFormData({ ...formData, severity: sev })}
              className={`flex-1 py-2 rounded-md text-sm font-bold border transition-all ${
                formData.severity === sev
                  ? 'bg-neutral-100 text-neutral-900 border-white'
                  : 'bg-neutral-950 text-neutral-500 border-neutral-800 hover:border-neutral-600'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-neutral-400">Description</label>
        <textarea
          required
          rows={3}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full bg-neutral-950 border border-neutral-700 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-neon-pink focus:border-transparent outline-none resize-none"
          placeholder="Steps to reproduce..."
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-neon-pink hover:bg-pink-600 text-white font-bold py-3 rounded-md transition-colors flex items-center justify-center gap-2"
      >
        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Submit Bug"}
      </button>
    </form>
  );
};