# Release Notes

User-facing changelog for Project Synapse. 

---

## Version 2.3.1 - November 1, 2025

### 🔧 Bug Fix Release

**Fixed Update Download Issues**
The download getting stuck at 0% is now fixed! This update includes better error handling, timeout detection, and a manual retry system.

### What's Fixed:
- ✅ Downloads no longer hang at 0% (fixed race condition)
- ✅ Automatic detection if download gets stuck (30-second timeout)
- ✅ Retry button appears if something goes wrong
- ✅ Better error messages explaining what happened
- ✅ Enhanced logging to help diagnose issues

### New Features:
- 🔄 **Manual Update Check** - New button in Settings lets you check for updates anytime
- 📊 **Version Display** - Settings now shows your current version
- 🔍 **Better Diagnostics** - Detailed console logs help troubleshoot problems

### 💡 Why This Update Matters:
This fixes the auto-update system so it works reliably. After installing v2.3.1, all future updates will download and install smoothly via delta updates (only downloading the changes, not the full app).

### 📥 How to Get It:
- **From v2.3.1**: The app should detect this update automatically. Click Download when notified.
- **From older versions**: Download and install v2.3.1 manually from GitHub Releases. This is a one-time manual install - future updates will be automatic!

### 🧪 Testing the Fix:
1. Install v2.3.1
2. Go to Settings → Updates
3. Click "Check for Updates Now" to test the system
4. Future releases will download smoothly

---

## Version 2.3.0 - November 1, 2025

### 🐙 What's New

• GitHub card now uses a local skeleton/loader while it fetches data, so the rest of the dashboard stays responsive.
• Optional GitHub Personal Access Token (PAT) enables authenticated requests for higher rate limits and private repos (as permitted).
• Add a project image/banner (URL or file, including base64/data URIs) and a publications field.
• Cleaner layout: tuned sidebar width/padding and improved label spacing; added extra bottom margin to the dashboard cards grid.
• Security fix: CSP updated to allow `img-src 'self' data:` so image previews and embedded images work reliably.

### 🧠 Why it matters

- Faster, non-blocking UI while GitHub data loads.
- Fewer GitHub API rate-limit errors with tokens.
- Richer projects with visuals and publications.
- Better readability and spacing across the app.

### 🔄 How to get the update

- If you're on v2.2.0 or later: just open the app. It will detect v2.3.0 and download a small delta update automatically. You'll see an in-app prompt to install.
- If you're on an older version (≤ 2.1.x): download and install the latest Windows installer from GitHub Releases once. Future updates will be automatic.

---

## Version 2.2.0 - November 1, 2025

### 🚀 What's New

**Automatic Updates**
Never manually download updates again! Project Synapse now checks for updates automatically and downloads them in the background. When a new version is ready, you'll get a notification to install with just one click.

**Smart Delta Updates**
Updates are incredibly efficient now. Instead of downloading the entire 150MB installer, the app only downloads the changes (typically 5-20MB), saving bandwidth and time.

**Beautiful In-App Changelog**
See what's new with our gorgeous changelog viewer. Click the "Updates" button in the sidebar to view release notes with clean formatting and easy navigation between versions.

**Update Notifications**
Stay informed with elegant notifications that show download progress and let you install updates at your convenience.

### 🎯 Technical Improvements

- Auto-update system powered by electron-updater
- Delta differential updates for faster downloads
- GitHub Releases integration for reliable update delivery
- Real-time download progress tracking
- Seamless install-and-restart workflow

### 💡 How It Works

The app checks for updates when you launch it and periodically while running. When an update is available, you'll see a "NEW" badge on the Updates button. Click it to view what's new, then download and install with one click. The next time you use the app, you'll be on the latest version!

---

## Version 2.1.0 - November 1, 2025

### ✨ What's New

**Custom Window Design**
Experience a sleek, branded window frame that perfectly matches Project Synapse's aesthetic. The new custom titlebar replaces the standard system chrome with controls that feel right at home.

**Professional Icon System**
Every icon in the app has been upgraded to crisp, scalable vector graphics. From the sidebar to buttons and menus, the interface now features a consistent, professional look that stays sharp at any size.

**Enhanced Visual Consistency**
All UI elements now share a unified design language, creating a more polished and cohesive experience throughout the application.

### 🎨 Visual Improvements

- All interface icons are now professionally designed SVG graphics
- New branded titlebar with custom window controls
- Window minimize, maximize, and close buttons match the app theme
- Improved button and menu icon clarity
- Better visual hierarchy across all screens

### 🔧 Technical

- Upgraded to use Lucide icon system
- Implemented frameless window with custom controls
- Enhanced CSS styling for icon consistency

---

## Version 2.0.0 - November 1, 2025

### 🎉 Complete Application Launch

Project Synapse has been completely rebuilt from the ground up as a full-featured desktop application!

### ✨ Core Features

**Project Management**
- Add, edit, and delete projects with a beautiful interface
- Organize projects with custom tags
- Search and filter to find projects instantly
- Track project status (Active, Completed, Archived)
- Add rich notes to each project

**Quick Actions**
- Open project folders directly in your file explorer
- Run executables and commands with one click
- Launch projects in VS Code instantly
- Access GitHub repositories quickly

**GitHub Integration**
- Connect your GitHub repositories
- View latest commits automatically
- See releases and download links
- Track open pull requests
- Real-time data from GitHub API

**Data Management**
- All your projects saved automatically
- Export your data as JSON backup
- Import from previous backups
- Persistent settings across sessions

**Beautiful Interface**
- Clean black & white minimalist design
- Smooth animations and transitions
- Professional JetBrains Mono font
- Intuitive navigation

### 🚀 Getting Started

1. Add your first project with the "Add Project" button
2. Fill in project details and browse to select folders
3. Optionally connect GitHub repositories
4. Use quick actions to manage your projects
5. Search and filter to stay organized

### 💾 Your Data is Safe

- Projects stored locally on your computer
- No cloud sync required (your data stays private)
- Easy backup with export/import functionality
- Settings persist between app launches

### 🎨 Design Philosophy

Project Synapse embraces a minimalist aesthetic with a strict black and white color palette. Every element is designed to be functional and beautiful, with no unnecessary distractions.

---

## Future Roadmap

We're constantly working to improve Project Synapse. Here's what's coming:

- Project templates for common workflows
- Keyboard shortcuts for power users
- Project categories and folders
- Time tracking features
- Activity timeline
- And much more!

---

**Thank you for using Project Synapse!** 🚀

Your feedback helps us improve. If you encounter any issues or have suggestions, please open an issue on GitHub.
