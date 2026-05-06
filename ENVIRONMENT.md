# Environment setup

1. Copy `.env.example` to `.env.local`:
   - On Windows (PowerShell): `Copy-Item .env.example .env.local`
   - On macOS/Linux: `cp .env.example .env.local`

2. Fill real secret values in `.env.local`. Keep `.env.local` out of version control.

3. Key notes:
   - `CLOUDINARY_URL` can be the consolidated URL or set individual Cloudinary keys.
   - `MAILGUN_API_KEY` and `MAILGUN_DOMAIN` are required for sending OTPs.
   - `OTP_TTL_SECONDS` defaults to `60` (1 minute) and can be adjusted.

4. `.gitignore` already ignores `.env*` to prevent accidental commits.

5. After setting env vars, restart the dev server so Next.js picks them up.
