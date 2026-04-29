# VaniAI Setup & Troubleshooting Guide

This guide provides complete instructions for setting up VaniAI locally, configuring environment variables, and troubleshooting common issues.

## Quick Start

1.  **Clone and Install**
    ```bash
    git clone <YOUR_GIT_URL>
    cd VaniAI
    npm install
    ```

2.  **Environment Setup**
    ```bash
    cp .env.example .env
    ```
    Edit `.env` and add your API keys (see [API Configuration](#api-configuration) below).

3.  **Run Locally**
    ```bash
    npm run dev
    ```

## API Configuration

VaniAI requires several API keys to function fully.

### 1. Google Gemini API (Required)
*Used for: Mock Interview, Group Discussion, Presentation Practice, Speech Practice*

1.  Get a key from [Google AI Studio](https://makersuite.google.com/app/apikey).
2.  Add to `.env`:
    ```env
    VITE_GEMINI_API_KEY=your_key_here
    # Optional: Specify model (default: auto-detects)
    # VITE_GEMINI_MODEL=gemini-pro
    ```

### 2. AssemblyAI API (Required)
*Used for: Audio transcription*

1.  Get a key from [AssemblyAI](https://www.assemblyai.com/dashboard).
2.  Add to `.env`:
    ```env
    VITE_ASSEMBLY_API_KEY=your_key_here
    ```

### 3. Azure Text-to-Speech (Required)
*Used for: Voice feedback*

1.  Create a Speech resource in [Azure Portal](https://portal.azure.com/).
2.  Add to `.env`:
    ```env
    VITE_AZURE_API_KEY=your_key_here
    VITE_AZURE_REGION=your_region (e.g., centralindia, eastus)
    ```

### 4. Supabase (Required)
*Used for: Auth, Database*

1.  Create a project at [Supabase](https://supabase.com/).
2.  Add to `.env`:
    ```env
    VITE_SUPABASE_URL=your_project_url
    VITE_SUPABASE_ANON_KEY=your_anon_key
    ```
3.  **Database Setup**: Run the migration SQL found in `supabase/migrations/` in the Supabase SQL Editor.

## Troubleshooting

### Common Issues

#### "All API versions and models failed" or Gemini Errors
-   **Check API Key**: Ensure `VITE_GEMINI_API_KEY` is correct, has no quotes, and no extra spaces.
-   **Model Name**: If `gemini-1.5-flash-latest` fails, try setting `VITE_GEMINI_MODEL=gemini-pro` in `.env`.
-   **Restart Server**: Always restart `npm run dev` after changing `.env`.

#### Audio/Transcription Issues
-   **AssemblyAI**: Verify `VITE_ASSEMBLY_API_KEY`. Check quota.
-   **Azure**: Verify `VITE_AZURE_API_KEY` and `VITE_AZURE_REGION`. The region must match exactly (e.g., `centralindia`).

#### Blank Page
-   Check browser console (F12) for errors.
-   Verify all required `.env` variables are present.

### Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_GEMINI_API_KEY` | Yes | Google AI Studio Key |
| `VITE_GEMINI_MODEL` | No | Specific model to use |
| `VITE_ASSEMBLY_API_KEY` | Yes | AssemblyAI Key |
| `VITE_AZURE_API_KEY` | Yes | Azure Speech Key |
| `VITE_AZURE_REGION` | Yes | Azure Region |
| `VITE_SUPABASE_URL` | Yes | Supabase Project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase Anon Key |
