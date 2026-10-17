# Workspace Backend

Express and TypeScript API for user authentication and a personal workspace of nested folders and text files. MongoDB stores users and workspace records; the React frontend is in the sibling `website` directory.

## Features

- Registration, login, and profile retrieval.
- Create, retrieve, rename, and delete folders and text files.
- Paginated listing and case-insensitive name search.

## Local Setup

Run commands from the `backend` directory. Install Node.js (Node.js 24 is used for local development), Yarn Classic for the current build scripts, and a reachable MongoDB server.

1. Install dependencies using the existing lockfile:

   ```bash
   yarn
   ```

2. Create `.env` with your own values:

   ```env
   NODE_ENV=development
   PORT=8000
   BASE_URL=http://localhost:8000
   TOKEN_SECRET=replace-with-a-long-random-secret
   TOKEN_SECRET_EXPIRES_IN=1d
   BCRYPT_SALT_ROUND=12
   MONGODB_URI=mongodb://127.0.0.1:27017
   MONGODB_DATABASE_NAME=workspace
   ```

3. Start development:

   ```bash
   yarn dev
   ```

## AI Text Summaries

Copy `.env.example` to `.env` for a fresh setup, or add these settings to your existing backend environment file:

```env
OPENAI_API_KEY=your-backend-only-api-key
OPENAI_MODEL=gpt-4.1-mini
```

Restart the backend after changing the environment. Keep the key out of the frontend and version control. Without a key, normal workspace features work and the summary endpoint returns 503. A configured API key needs access to the chosen model and available API usage.

`POST /api/v1/workspace/summarize?workspace_id=<id>` requires a Bearer token. It loads the authenticated user's saved file from MongoDB, rejects folders, empty text, and text longer than 30,000 characters, and sends only the saved text to OpenAI's Responses API. The original file is never changed. Each user can make up to five requests per minute per server process. Requests time out after 30 seconds, output is limited to 600 tokens, and incomplete results return an error. The request sets `store: false`; do not interpret this as a guarantee of zero provider retention.

Successful `data` contains:

```json
{
  "workspace_id": "507f1f77bcf86cd799439012",
  "summary": "- First key point.\n- Second key point."
}
```

The prompt requests 3-5 concise points, preserves factual details and source language, and treats instructions inside documents as untrusted text. Short documents may yield fewer points. Summaries can still omit or misstate details, so users should compare with the original. No summary is stored in MongoDB.

Run `npm run test:summary` to test missing configuration, empty/oversized input, response extraction, provider errors, and controller ownership/type checks without network calls. These tests validate integration behavior, not model quality.

For a manual usefulness evaluation, try a meeting note containing names, deadlines, and decisions; a longer project note containing priorities and risks; and a short note. Check that each summary is shorter, preserves the key facts, and invents nothing. Also try a note containing instructions to ignore the summarization task and confirm it remains a summary. Record actual results before claiming quality has been evaluated. Live model evaluation has not been performed as part of implementation.

API reference: [OpenAI text generation](https://developers.openai.com/api/docs/guides/text).
