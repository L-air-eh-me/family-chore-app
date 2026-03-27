# Family Chore App

## Purpose

Build a small mobile-friendly family chore app that is simpler for children to use than Google Forms and easier for parents to review at a glance.

Version 1 should prioritize speed, clarity, and low-maintenance operation for a busy family with many children.

## Product Direction

- Primary users:
  - Kids completing daily chores on a phone or tablet
  - Parents reviewing completion status quickly
- Target family size:
  - Up to 8 children
- Core UX goals:
  - Fewer taps than a form
  - Large, obvious actions for kids
  - Fast parent overview without opening each child individually
  - Instant save on each chore action
  - Final "Done for parent review" action for each child

## Version 1 Scope

- Landing page with clear entry points for kids and parents
- Kid checklist flow
- Parent dashboard
- Instant persistence for chore updates
- Daily progress tracking
- Reset flow for a new day
- Google Sheets as the editable backend

## App Behavior

### Kid View

Each child should be able to:

- Select their name
- Enter a simple PIN
- See only today's chores
- Check chores off one at a time
- Save progress instantly after each action
- See a progress bar
- Tap a final "Done for parent review" button

### Parent Dashboard

Parents should be able to:

- See all 8 kids on one screen
- See each child's completion percentage
- See who has submitted for review
- See who has not started
- See who is in progress
- See who is finished
- See missing chores at a glance
- Optionally trigger a daily reset

Recurring chore editing should continue to happen in Google Sheets rather than inside the app.

## Key Workflow Improvement

The app must improve on a Google Form by supporting both:

- instant save for each chore interaction
- one final "Done for review" submission state

This enables parents to distinguish between:

- not started
- partially complete
- submitted as finished

That visibility is one of the main product wins for version 1.

## Technical Stack

- Next.js
- TypeScript
- Tailwind CSS
- Google Sheets API
- Optional deployment target: Vercel

## Implementation Priorities

- Optimize for mobile-first use
- Keep the interface simpler than Google Forms
- Favor glanceable parent summaries over dense admin tooling
- Use straightforward data structures that map cleanly to Google Sheets
- Prefer server routes that keep Google credentials off the client
- Keep components simple, legible, and easy to maintain

## Suggested App Structure

- `/kid`
  - Kid selection
  - Daily chore checklist
  - Progress indicator
  - Submit for parent review
- `/parent`
  - Family overview
  - Per-child completion status
  - Not started / in progress / ready for review / complete states
  - Daily reset action

## Data Expectations

The app should be designed around Google Sheets being the source of truth for:

- kids
- chores
- daily progress
- review status
- one-time tasks

Keep the sheet integration easy for non-developers to update.

## Coding Guidance

- Use TypeScript types for all shared data shapes
- Keep API route behavior explicit and predictable
- Build reusable UI components for kid and parent flows
- Prefer utility-first styling with Tailwind CSS
- Avoid overengineering version 1
- Ship the simplest working path first
