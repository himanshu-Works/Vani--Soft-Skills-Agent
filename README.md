# VaniAI

## Project Info

**Deployment URL**: https://vani-ai-phi.vercel.app/

## About

VaniAI is an AI-powered application designed to help users practice and improve their communication skills. It features:
- **Mock Interview**: Practice interviews with AI.
- **Group Discussion**: Participate in AI-moderated group discussions.
- **Presentation Practice**: Hone your presentation skills.
- **Speech Practice**: Improve your speech delivery.

The application leverages powerful AI technologies including Google Gemini for intelligence, AssemblyAI for transcription, and Azure Text-to-Speech for realistic voice interaction.

## Getting Started

### Prerequisites

- Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

### Quick Start

1.  **Clone and Install**
    ```sh
    git clone <YOUR_GIT_URL>
    cd VaniAI
    npm install
    ```

2.  **Setup Environment**
    ```sh
    cp .env.example .env
    ```
    Edit `.env` with your API keys.

3.  **Run Locally**
    ```sh
    npm run dev
    ```

👉 **For detailed setup instructions and troubleshooting, please read [SETUP.md](SETUP.md).**

## Technologies Used

This project is built with:

- **Frontend Framework**: React with Vite
- **Language**: TypeScript
- **UI Components**: shadcn-ui
- **Styling**: Tailwind CSS
- **AI/ML Services**:
  - Google Gemini API
  - AssemblyAI
  - Azure Text-to-Speech
- **Backend/Database**: Supabase
