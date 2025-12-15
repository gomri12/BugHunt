# Gamified Dashboard Setup Guide

## Overview

The gamified dashboard adds a fun, competitive element to bug hunting with:
- **Live Feed**: Real-time ticker showing bug events
- **Boss Counter**: Big animated counter for critical bugs (with "Boss Fight Mode" when ≤3 remain)
- **Leaderboard**: Scoring system with Today/This Hunt/All-time tabs
- **Feature Heatmap**: See which features have the most bugs
- **Team Progress**: Progress bars and stats
- **Achievements & Streaks**: Track accomplishments and fix streaks

## Setup Steps

### 1. Run Database Migration

Execute the SQL in `supabase-gamification.sql` in your Supabase SQL Editor:

```sql
-- This creates:
-- - bug_events table (tracks all events)
-- - v_leaderboard view (scoring calculations)
-- - v_feature_heatmap view (feature statistics)
-- - v_streaks view (fix streaks)
```

### 2. Access the Dashboard

Navigate to `/gamified` in your app, or click the "Gamified" link in the header.

## Scoring System

### Base Points by Severity
- **Critical**: 50 points
- **High**: 25 points
- **Medium**: 10 points
- **Low**: 5 points

### Reporter Points (on bug_triaged)
- 40% of base points
- +5 if includes reproduction steps
- +5 if includes logs/screenshots

### Solver Points (on bug_fixed)
- 100% of base points
- +10 if fix includes tests or RCA notes

### Penalties
- **Reopened within 48h**: -50% of base points (solver loses points)
- **Duplicate/Invalid**: Reporter gets 0 points

### Streaks
- +10 bonus for every 3 consecutive fixes without a reopen
- "Critical chain": +15 extra per additional critical in a row

## Features

### Boss Counter
- Shows critical bugs remaining
- **Boss Fight Mode**: Activates when ≤3 critical bugs remain
  - Red/purple theme
  - "FINAL 3" banner
  - Shaking animations
- Confetti when all critical bugs are fixed!

### Live Feed
- Real-time updates via Supabase Realtime
- Shows: "New bug opened", "Bug fixed", "Reopened"
- Sound effects for important events
- Color-coded by severity

### Leaderboard
- Three time periods: Today, This Hunt, All-time
- Shows total score, positive/negative points, event count
- Top 3 get special icons (🥇🥈🥉)

### Feature Heatmap
- Visual representation of bug density by feature
- Shows: opened count, fixed count, critical/high counts
- Color-coded heat levels (red = hot, yellow = warm)

### Team Progress
- Goal progress bar (target: 0 critical bugs)
- Stats: Critical left, High left, Total open, Fixed today
- Resolution rate percentage

### Achievements
- First Fix
- Critical Slayer
- No Reopen Streak
- Cleanup Crew

## Event Tracking

Events are automatically recorded when:
- **bug_opened**: New bug is created
- **bug_fixed**: Bug status changes to RESOLVED
- **bug_reopened**: Resolved bug is reopened

The system tracks:
- Who reported/fixed
- Severity
- Feature area (if set)
- Metadata (repro steps, logs, tests, RCA)

## Customization

### Adding Features to Bugs

To track features, you can:
1. Add a `feature` field to bug creation forms
2. Or extract from bug title/description
3. Or set manually in the database

### Mini Challenges

Currently shows placeholder challenges. To implement:
1. Create a `challenges` table
2. Rotate challenges every 15 minutes
3. Track completion in `bug_events.meta`

### Boss Fight Mode

When critical bugs ≤ 3:
- Theme changes to red/purple
- Streak bonuses are doubled
- Special animations and sounds

## Technical Notes

- Events are stored in `bug_events` table
- Views compute scores in real-time
- Realtime subscriptions update UI automatically
- All scoring happens server-side via SQL views

## Troubleshooting

**No events showing?**
- Check that `bug_events` table exists
- Verify RLS policies allow reads
- Check browser console for errors

**Leaderboard not updating?**
- Refresh the page
- Check that events are being recorded
- Verify `v_leaderboard` view exists

**Boss Counter not animating?**
- Ensure bugs are being tracked correctly
- Check that critical bugs exist
- Verify realtime subscriptions are working

