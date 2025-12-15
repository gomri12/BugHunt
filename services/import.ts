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
 * Map Jira severity to BugHunt severity
 */
const mapSeverity = (jiraSeverity: string): BugSeverity => {
  const severity = (jiraSeverity || '').trim().toUpperCase();
  
  // Map Jira values to BugHunt values
  if (severity === 'BLOCKING' || severity === 'CRITICAL' || severity === 'SECURITY') {
    return BugSeverity.CRITICAL;
  }
  if (severity === 'HIGH') {
    return BugSeverity.HIGH;
  }
  if (severity === 'MEDIUM') {
    return BugSeverity.MEDIUM;
  }
  if (severity === 'LOW') {
    return BugSeverity.LOW;
  }
  
  // Default mapping: if it contains "high" or "blocking", treat as HIGH
  if (severity.includes('HIGH') || severity.includes('BLOCKING')) {
    return BugSeverity.HIGH;
  }
  
  // Default to MEDIUM if unknown
  return BugSeverity.MEDIUM;
};

/**
 * Map Jira status to BugHunt status
 */
const mapStatus = (jiraStatus: string): BugStatus => {
  const status = (jiraStatus || '').trim().toUpperCase();
  
  // Map Jira statuses to BugHunt statuses
  if (status === 'RESOLVED' || status === 'CLOSED' || status === 'DONE') {
    return BugStatus.RESOLVED;
  }
  if (status === 'IN DEVELOPMENT' || status === 'IN PROGRESS' || 
      status === 'ASSIGNED OWNER' || status === 'ASSIGNED MODULE OWNER' ||
      status.includes('DEVELOPMENT') || status.includes('PROGRESS')) {
    return BugStatus.IN_PROGRESS;
  }
  
  // Default to NEW for Open, Pending Info, etc.
  return BugStatus.NEW;
};

/**
 * Detect if CSV is in Jira format or BugHunt format
 */
const isJiraFormat = (headers: string[]): boolean => {
  const headerStr = headers.join(' ').toLowerCase();
  return headerStr.includes('summary') || 
         headerStr.includes('issue key') || 
         headerStr.includes('custom field (severity)') ||
         headerStr.includes('assignee');
};

/**
 * Validate and convert CSV row to Bug object
 * Supports both Jira format and BugHunt format
 */
const parseBugFromRow = (row: string[], headers: string[]): Omit<Bug, 'id' | 'createdAt' | 'updatedAt'> | null => {
  try {
    const isJira = isJiraFormat(headers);
    
    let title = '';
    let description = '';
    let severity: BugSeverity;
    let status: BugStatus;
    let reporterName = '';
    let solverName: string | undefined = undefined;
    
    if (isJira) {
      // Jira format mapping
      const summaryIdx = headers.findIndex(h => h.toLowerCase() === 'summary');
      const severityIdx = headers.findIndex(h => 
        h.toLowerCase().includes('severity') || h.toLowerCase() === 'custom field (severity)'
      );
      const priorityIdx = headers.findIndex(h => h.toLowerCase() === 'priority');
      const statusIdx = headers.findIndex(h => h.toLowerCase() === 'status');
      const reporterIdx = headers.findIndex(h => h.toLowerCase() === 'reporter');
      const assigneeIdx = headers.findIndex(h => h.toLowerCase() === 'assignee');
      const issueKeyIdx = headers.findIndex(h => h.toLowerCase().includes('issue key'));
      
      if (summaryIdx === -1 || statusIdx === -1 || reporterIdx === -1) {
        return null;
      }
      
      title = (row[summaryIdx] || '').trim();
      description = title; // Use summary as description, or could combine with issue key
      
      // If we have issue key, add it to description
      if (issueKeyIdx !== -1 && row[issueKeyIdx]) {
        const issueKey = (row[issueKeyIdx] || '').trim();
        description = issueKey ? `${issueKey}: ${title}` : title;
      }
      
      // Try severity first, then fall back to priority
      let jiraSeverity = severityIdx !== -1 ? (row[severityIdx] || '').trim() : '';
      if (!jiraSeverity && priorityIdx !== -1) {
        jiraSeverity = (row[priorityIdx] || '').trim();
      }
      
      const jiraStatus = (row[statusIdx] || '').trim();
      reporterName = (row[reporterIdx] || '').trim();
      
      // Map severity and status
      severity = mapSeverity(jiraSeverity);
      status = mapStatus(jiraStatus);
      
      // Set solver name if assignee exists and status suggests work is in progress
      if (assigneeIdx !== -1 && row[assigneeIdx]) {
        const assignee = (row[assigneeIdx] || '').trim();
        if (assignee && (status === BugStatus.IN_PROGRESS || status === BugStatus.RESOLVED)) {
          solverName = assignee;
        }
      }
    } else {
      // BugHunt format (original)
      const titleIdx = headers.findIndex(h => h.toLowerCase() === 'title');
      const descIdx = headers.findIndex(h => h.toLowerCase() === 'description');
      const severityIdx = headers.findIndex(h => h.toLowerCase() === 'severity');
      const statusIdx = headers.findIndex(h => h.toLowerCase() === 'status');
      const reporterIdx = headers.findIndex(h => h.toLowerCase() === 'reporter');
      const solverIdx = headers.findIndex(h => h.toLowerCase() === 'solver');
      
      if (titleIdx === -1 || descIdx === -1 || severityIdx === -1 || statusIdx === -1 || reporterIdx === -1) {
        return null;
      }
      
      title = (row[titleIdx] || '').trim();
      description = (row[descIdx] || '').trim();
      const severityStr = (row[severityIdx] || '').trim().toUpperCase();
      const statusStr = (row[statusIdx] || '').trim().toUpperCase();
      reporterName = (row[reporterIdx] || '').trim();
      solverName = row[solverIdx] ? (row[solverIdx] || '').trim() : undefined;
      
      // Validate severity and status for BugHunt format
      if (!Object.values(BugSeverity).includes(severityStr as BugSeverity)) {
        return null;
      }
      if (!Object.values(BugStatus).includes(statusStr as BugStatus)) {
        return null;
      }
      
      severity = severityStr as BugSeverity;
      status = statusStr as BugStatus;
    }
    
    // Validate required fields
    if (!title || !description || !reporterName) {
      return null;
    }
    
    return {
      sessionId: GLOBAL_SESSION_ID,
      title,
      description,
      severity,
      status,
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
          
          // Skip empty rows
          if (!row || row.every(cell => !cell || cell.trim() === '')) {
            continue;
          }
          
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

