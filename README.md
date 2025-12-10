# BugHunt Live

A real-time bug tracking dashboard for group bug hunts and bashes.

## 🚀 Deployment to GitHub Pages

This project is set up to be deployed easily to GitHub Pages.

### Prerequisites
- Node.js installed
- A GitHub repository created for this project

### Steps

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Paths**
   - Open `package.json` and change the `homepage` field:
     ```json
     "homepage": "https://<YOUR_GITHUB_USERNAME>.github.io/<YOUR_REPO_NAME>"
     ```
   - Open `vite.config.ts` and change the `base` field:
     ```ts
     base: '/<YOUR_REPO_NAME>/',
     ```

3. **Deploy**
   Run the deploy script. This will build the project and push the `dist` folder to a `gh-pages` branch on your remote repository.
   ```bash
   npm run deploy
   ```

4. **GitHub Settings**
   - Go to your repository on GitHub.
   - Go to **Settings** > **Pages**.
   - Ensure the "Source" is set to the `gh-pages` branch.

## 🛠 Local Development

To run the app locally:

```bash
npm run dev
```

## Features
- Real-time updates across tabs using BroadcastChannel.
- Local persistence using Dexie.js (IndexedDB).
- Admin panel for managing data (Reset functionality).
- Leaderboards and stats.
