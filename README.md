# PrepLedger

A local-first tracker for daily LeetCode practice, 14-day Python project sprints, and internship applications. All data stays in your browser, with JSON export/import for backup. No login or server needed.

**Live demo:** https://prepledger.ai.studio/


## Screenshots
<img width="2786" height="1576" alt="image" src="https://github.com/user-attachments/assets/6eba22a5-b8af-4b41-b7b6-db26d5c862b6" />

<img width="2808" height="1570" alt="image" src="https://github.com/user-attachments/assets/6195ead8-02fb-445f-a7f6-e53f517750ae" />


## Features
- **Dashboard banner:** streak status, backup reminder, revisit reminders, follow-up nudges, and deadline countdowns
- **Streaks:** current streak, longest streak, and missed-day tally, calculated from the log by local date
- **LeetCode log:** problem number or link, difficulty, topic, solve timer, reflection notes, search and filters, 12-week heatmap, and topic coverage chart
- **Daily checklist:** based on the day of the week, with an optional gym and running tracker
- **Python sprints:** fixed 14-day cycles, Mark Complete, and unfinished sprints saved to history
- **Internship tracker:** status pills (Applied, In Progress, Offer, Declined), dates, deadlines, next step, links, and notes
- **Recruiter contacts** and a **behavioral story bank** for interview prep
- **Backup:** full JSON export and import, plus a sample-data demo mode

## Built with
- TypeScript and React, built with Vite.
- Browser localStorage for data storage
- Generated with Google AI Studio

## How this was built
I built this with Google AI Studio's Build mode. I didn't hand-write the code. I wrote the feature specs, set the rules (for example, a day only counts as missed after it ends, and streaks are calculated from the log instead of stored), reviewed the results, and iterated on them with prompts. [Add one sentence on what you tested, like "I tested streak edge cases by backfilling and editing past days."]

## Run locally
```bash
npm install
npm run dev
```


No API key is needed. 

## Data and privacy
Everything is stored in your browser's localStorage and never sent anywhere. Clearing your browser data deletes it, so use Export JSON regularly.

## What I learned
-  I originally had a current streak and a missed-day counter, but counters break when you edit or backfill a past day. I had the app store each problem by local date (YYYY-MM-DD) and calculate the streaks from that log, so everything stays correct after an edit. I also set the rule that a day only counts as missed after it ends.
- I chose localStorage over a cloud database because it needs no login or backend. The tradeoff is that clearing the browser deletes your data, so I added JSON export and import, a "last export" reminder in the banner, and a sample-data mode that asks for confirmation before it touches real data.
- I wrote the feature specs and edge cases, then iterated with prompts. A passing build only proves the code compiles, not that the logic is right,
