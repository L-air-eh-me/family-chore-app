# Family Chore App

This project is a mobile-friendly chore tracker for a large family. Version 1 is designed to be easier for kids to use than Google Forms and faster for parents to review at a glance.

## Planned V1

- Kid checklist view
- Parent dashboard
- Instant save on each chore
- Final "Done for parent review" button
- Google Sheets as the editable backend

## Core Behavior

### Kid Flow

- Select name
- Enter PIN
- View only today's chores
- Check off chores one at a time
- Save each change immediately
- Watch progress update live
- Tap `Done for parent review` when finished

### Parent Flow

- View all children on one screen
- See completion percentage for each child
- See who has not started, is in progress, or has submitted
- See missing chores quickly
- Optionally run a daily reset
- Continue editing recurring chores in Google Sheets

## Why This Beats A Form

Unlike a Google Form that only captures a final submission, this app is designed to:

- save each chore instantly
- preserve a final review step

That gives parents visibility into who has not started, who is halfway done, and who says they are finished.

## Planned Stack

- Next.js
- TypeScript
- Tailwind CSS
- Google Sheets API
- Vercel for optional deployment

## Product Principles

- Kid flow should be fast, obvious, and low-friction
- Parent view should show the whole family quickly
- Data should remain editable in Google Sheets
- Version 1 should stay simple and maintainable

## Features

- Kid login with name selection and simple PIN
- Today-only task list
- Instant save on each chore check or note change
- Live progress bar
- Final `Done for parent review` button
- Parent dashboard with all 8 kids on one screen
- Color-coded statuses:
  - Not started
  - In progress
  - Done
  - Submitted for review
- Missing chores called out clearly
- Mock-data mode for local development
- Google Sheets integration path for production

## Project Structure

```text
family-chore-app/
├── .env.example
├── AGENTS.md
├── README.md
├── next.config.js
├── package.json
├── postcss.config.mjs
├── tsconfig.json
└── src/
    ├── app/
    ├── components/
    ├── data/
    └── lib/
```

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Copy the environment file:

```bash
cp .env.example .env.local
```

3. Start in mock-data mode:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000)

## Sample Kids

Mock mode includes 8 children with sample PINs:

- Ava: `1234`
- Noah: `2345`
- Mia: `3456`
- Eli: `4567`
- Lily: `5678`
- Owen: `6789`
- Ruby: `7890`
- Jack: `8901`

## Google Sheets Tabs

Use one spreadsheet with these tabs:

- `Kids`
- `ChoreTemplates`
- `DailyProgress`
- `OneTimeTasks`

Recommended columns:

### Kids

```text
kid_id | name | pin | active
```

### ChoreTemplates

```text
template_id | kid_id | title | category | day_of_week | required
```

### DailyProgress

Recommended stable version:

```text
date | kid_id | task_id | chore_title | status | started_at | completed | completed_at | duration_seconds | submitted | note
```

### OneTimeTasks

Recommended stable version:

```text
task_id | date | kid_id | title | category | required
```

## How Google Sheets Integration Works

The app now reads and writes directly to your Google Sheet through the Google Sheets API.

Update `.env.local` like this:

```bash
GOOGLE_CLIENT_EMAIL=service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEET_ID=your_spreadsheet_id
```

Share the spreadsheet with the service account email as an editor.

## Development Notes

- Kids load from the `Kids` tab.
- Chores load from `ChoreTemplates` and matching `OneTimeTasks`.
- Each chore update saves immediately to `DailyProgress`.
- Final submit marks chores as submitted for parent review.
- Parent dashboard refreshes manually and also polls for updates.
- Recurring chores stay editable in Google Sheets instead of the app UI.

## Deployment To Vercel Hobby

1. Push the project to GitHub.
2. Create a free Hobby account at [vercel.com](https://vercel.com).
3. Click `Add New Project`.
4. Import the GitHub repository that contains this app.
5. If Vercel asks for the root directory, choose `family-chore-app`.
6. Add these environment variables in the Vercel project settings:

```bash
GOOGLE_CLIENT_EMAIL=service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEET_ID=your_spreadsheet_id
```

7. Share your Google Sheet with the service account email as an editor.
8. Deploy.

After deployment, test:

- `/kid`
- `/parent`
- direct kid links such as `/kid?name=Ryan`

Important:

- `.env.local` should not be committed
- when you change env vars in Vercel, redeploy so the new values are used
- the Hobby plan should be enough for normal family use
