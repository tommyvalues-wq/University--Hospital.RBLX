# UHH Secure Backend

This backend handles the parts GitHub Pages cannot do safely:

- Roblox OAuth login
- Staff-only access checks
- HCPC PIN verification
- HCPC staff editing
- Leave of Absence, discharge and speciality-change requests
- Automatic staff profile updates when requests are approved
- Documents, rules, guides, vacancies and information pages
- Hospital news Discord webhook posting
- Website up/down Discord status alerts

## Setup

1. Create a Supabase project.
2. Open Supabase SQL Editor.
3. Paste and run `sql/schema.sql`.
4. Deploy this backend folder to Render, Railway, Fly.io, or a VPS.
5. Add environment variables from `.env.example`.
6. In your website, set `API_BASE` to your backend URL.

## Important security notes

Do not upload your real `.env` file to GitHub.
Do not put Discord bot tokens, Roblox client secrets, Supabase service keys, or webhook URLs into public website JavaScript.

## Testing locally

```bash
npm install
cp .env.example .env
npm run dev
```

Open:

```text
http://localhost:3000/health
```

## Roblox login flow

Create a Roblox OAuth app and use this callback URL:

```text
https://YOUR_BACKEND_URL/auth/roblox/callback
```

Your staff records must contain the Roblox user ID and HCPC PIN before users can log in.

## Discord vacancies channel

A public website cannot read a Discord channel directly. To sync the vacancies channel, use a Discord bot token in this backend and extend the bot to watch channel `1511950462058889326`. The backend already has the vacancies database/API ready.
