import { Bug } from '../types';

export const exportBugsToCSV = (bugs: Bug[], sessionName: string = 'session') => {
  if (!bugs || bugs.length === 0) {
    alert("No bugs to export.");
    return;
  }

  const headers = [
    'ID',
    'Title',
    'Description',
    'Severity',
    'Status',
    'Reporter',
    'Solver',
    'Created At',
    'Updated At'
  ];

  const rows = bugs.map(bug => [
    bug.id,
    `"${(bug.title || '').replace(/"/g, '""')}"`, // Escape quotes
    `"${(bug.description || '').replace(/"/g, '""')}"`,
    bug.severity,
    bug.status,
    bug.reporterName,
    bug.solverName || '',
    bug.createdAt ? new Date(bug.createdAt).toLocaleString() : '',
    bug.updatedAt ? new Date(bug.updatedAt).toLocaleString() : ''
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(r => r.join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  const cleanName = sessionName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const timestamp = new Date().toISOString().slice(0, 10);
  
  link.href = url;
  link.setAttribute('download', `bughunt_${cleanName}_${timestamp}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};