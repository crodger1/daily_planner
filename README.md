# Daily Planner

A structured daily planner combining time-block scheduling with the **Ivy Lee Method** — built with React and persistent local storage.

## What It Does

Helps job seekers (and anyone with a full plate) structure their days with intention, track progress over time, and stay accountable with a buddy.

### Features

- **Today's 6** — Six ranked tasks drawn from key life buckets (job search, networking, caregiving, home/freelance, wellness, wildcard). Complete the top 3; the rest carry over.
- **Daily Structure** — Time-block schedule with a weekly job search focus rotation.
- **Buddy Check-In** — End-of-day accountability form to fill out before a 10-minute check-in call.
- **History** — Automatically archives each day's tasks and check-in notes. Browse past days anytime.
- **Persistent Storage** — Everything saves automatically between sessions using the Claude artifact storage API.

## The Ivy Lee Method

Each evening, write down 6 tasks for tomorrow ranked by importance. Work through them strictly in order. Whatever isn't done carries over to tomorrow's list. The daily "win condition" is completing tasks 1–3.

## Daily Rhythm

| Time | Block |
|------|-------|
| 9:00 – 10:30am | Morning Ramp — ease in, light admin |
| 10:30am – 1:00pm | Peak Focus Block — job search (protected) |
| 1:00 – 2:00pm | Midday Break — lunch, walk, no screens |
| 2:00 – 5:00pm | Afternoon Block — freelance, skills, caregiving, home |
| ~5:00pm | Buddy Check-In — 10 min accountability call |

## Getting Started

```bash
npm install
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173).

## Stack

- React 18
- Vite
- Claude artifact persistent storage API (`window.storage`)

> **Note:** The `window.storage` API is specific to the Claude.ai artifact environment. If running outside Claude, you'll want to swap it for `localStorage` or another persistence layer.

## Task Buckets

| Bucket | Purpose |
|--------|---------|
| 🔍 Job Search | Applications, tailoring materials |
| 🤝 Networking | Outreach, informational interviews |
| 📋 Caregiving / Legal / Estate | Family, legal, administrative tasks |
| 🔨 Home / Freelance / Skills | Maintenance, freelance work, learning |
| 💪 Wellness | Exercise, rest, mental health |
| 🃏 Wildcard / Overflow | Anything that doesn't fit above |
