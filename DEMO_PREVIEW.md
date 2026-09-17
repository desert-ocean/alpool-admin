# Local demo-preview

Demo mode is intentionally disabled by default and is active only during a Vite dev run when `VITE_DEMO_MODE=true`.

```powershell
Copy-Item .env.local.example .env.local
npm run dev
```

Open `/leads` for the local list or `/leads/1` for the local lead details. The preview uses fictional in-memory data, does not require login, and does not call the production API. Attachment download buttons show a demo-only notice because no real files are created.

The `DEMO` marker and `LOCAL DEMO / NO API` label identify the preview. Remove `.env.local` or set `VITE_DEMO_MODE=false` to return to the normal auth/API flow.
