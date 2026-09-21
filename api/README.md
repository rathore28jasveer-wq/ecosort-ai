# EcoSort AI Secure AI Backend

Architecture: GitHub Pages frontend → Vercel serverless API → OpenAI Responses API.

## Deploy
1. Import this repository into Vercel.
2. Add Environment Variable `OPENAI_API_KEY` with your API key.
3. Optional: add `OPENAI_MODEL` = `gpt-5.6-luna`.
4. Deploy.
5. Your endpoint will be `https://YOUR-VERCEL-DOMAIN.vercel.app/api/analyze`.
6. Set that URL in `index.html` as `ECOSORT_API_URL`.

## Security
Never put the API key in `index.html`, GitHub Pages, or any client-side JavaScript. Keep it only in Vercel Environment Variables.
