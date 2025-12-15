import { Bug, BugSeverity, BugStatus } from '../types';
import { addBug, GLOBAL_SESSION_ID } from './db';

/**
 * Parse CSV content into an array of objects
 * Handles quoted fields and escaped quotes (RFC 4180 compliant)
 */
const parseCSV = (csvContent: string): string[][] => {
  const rows: string[][] = [];
  const lines = csvContent.split('\n').filter(line => line.trim());
  
  for (const line of lines) {
    const row: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote (double quote) - add single quote to field
          current += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote state (start or end of quoted field)
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // End of field (only if not inside quotes)
        row.push(current);
        current = '';
      } else {
        // Regular character - add to current field
        current += char;
      }
    }
    
    // Add the last field
    row.push(current);
    rows.push(row);
  }
  
  return rows;
};

/**
 * Validate and convert CSV row to Bug object
 */
const parseBugFromRow = (row: string[], headers: string[]): Omit<Bug, 'id' | 'createdAt' | 'updatedAt'> | null => {
  try {
    // Find column indices
    const titleIdx = headers.findIndex(h => h.toLowerCase() === 'title');
    const descIdx = headers.findIndex(h => h.toLowerCase() === 'description');
    const severityIdx = headers.findIndex(h => h.toLowerCase() === 'severity');
    const statusIdx = headers.findIndex(h => h.toLowerCase() === 'status');
    const reporterIdx = headers.findIndex(h => h.toLowerCase() === 'reporter');
    const solverIdx = headers.findIndex(h => h.toLowerCase() === 'solver');
    
    // Required fields
    if (titleIdx === -1 || descIdx === -1 || severityIdx === -1 || statusIdx === -1 || reporterIdx === -1) {
      return null;
    }
    
    const title = (row[titleIdx] || '').trim();
    const description = (row[descIdx] || '').trim();
    const severityStr = (row[severityIdx] || '').trim().toUpperCase();
    const statusStr = (row[statusIdx] || '').trim().toUpperCase();
    const reporterName = (row[reporterIdx] || '').trim();
    const solverName = row[solverIdx] ? (row[solverIdx] || '').trim() : undefined;
    
    // Validate required fields
    if (!title || !description || !reporterName) {
      return null;
    }
    
    // Validate severity
    if (!Object.values(BugSeverity).includes(severityStr as BugSeverity)) {
      return null;
    }
    
    // Validate status
    if (!Object.values(BugStatus).includes(statusStr as BugStatus)) {
      return null;
    }
    
    return {
      sessionId: GLOBAL_SESSION_ID,
      title,
      description,
      severity: severityStr as BugSeverity,
      status: statusStr as BugStatus,
      reporterName,
      solverName: solverName || undefined,
    };
  } catch (error) {
    console.error('Error parsing bug row:', error);
    return null;
  }
};

/**
 * Import bugs from CSV file
 */
export const importBugsFromCSV = async (file: File): Promise<{ success: number; errors: string[] }> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      const csvContent = e.target?.result as string;
      if (!csvContent) {
        resolve({ success: 0, errors: ['Failed to read file'] });
        return;
      }
      
      try {
        const rows = parseCSV(csvContent);
        if (rows.length < 2) {
          resolve({ success: 0, errors: ['CSV file must have at least a header row and one data row'] });
          return;
        }
        
        const headers = rows[0].map(h => h.replace(/^"|"$/g, '').trim());
        const dataRows = rows.slice(1);
        
        const errors: string[] = [];
        let successCount = 0;
        
        // Import bugs sequentially to avoid overwhelming the database
        for (let i = 0; i < dataRows.length; i++) {
          const row = dataRows[i];
          const bug = parseBugFromRow(row, headers);
          
          if (!bug) {
            errors.push(`Row ${i + 2}: Invalid or missing required fields`);
            continue;
          }
          
          try {
            await addBug(GLOBAL_SESSION_ID, bug);
            successCount++;
          } catch (error: any) {
            errors.push(`Row ${i + 2}: ${error.message || 'Failed to import bug'}`);
          }
        }
        
        resolve({ success: successCount, errors });
      } catch (error: any) {
        resolve({ success: 0, errors: [`Parse error: ${error.message || 'Unknown error'}`] });
      }
    };
    
    reader.onerror = () => {
      resolve({ success: 0, errors: ['Failed to read file'] });
    };
    
    reader.readAsText(file);
  });
};

