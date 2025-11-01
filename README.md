# Project Synapse v2.0

A modern desktop application for managing and organizing your development projects. Built with Electron.

![Project Synapse](https://img.shields.io/badge/version-2.0.0-blue)
![Electron](https://img.shields.io/badge/electron-28.0.0-brightgreen)
![License](https://img.shields.io/badge/license-MIT-green)

## Features

✨ **Project Management**
- Add, edit, and delete projects
- Organize with tags and search
- Store project metadata and notes

🚀 **Quick Actions**
- Open project folders in file explorer
- Run executables and commands directly
- Open projects in VS Code
- Access GitHub repositories

🔗 **GitHub Integration**
- Fetch repository information
- View latest commits and releases
- Track open pull requests
- Direct links to GitHub

💾 **Data Management**
- Local data storage with electron-store
- Export/import functionality
- Persistent settings

🎨 **Clean UI**
- Minimalist black & white design
- Custom frameless window with native controls
- Lucide icon system for crisp, scalable icons
- JetBrains Mono font
- Smooth transitions and interactions

## Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Setup

#### Option 1: Quick Start (Windows)
Double-click **`run.bat`** to automatically install dependencies and start the app!

#### Option 2: Manual Setup
1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the application:**
   ```bash
   npm start
   ```

3. **Development mode (with DevTools):**
   ```bash
   npm run dev
   ```

## Building

Build the application for your platform:

### Windows
**Quick build:** Double-click **`build.bat`**

Or manually:
```bash
npm run build:win
```

### macOS
```bash
npm run build:mac
```

### Linux
```bash
npm run build:linux
```

### All platforms
```bash
npm run build
```

The built application will be available in the `dist` folder.

## Usage

### Adding a Project

1. Click the **"Add Project"** button
2. Fill in project details:
   - **Name**: Your project name (required)
   - **Description**: Brief description of the project
   - **Local Path**: Browse to your project folder
   - **Executable**: Path to executable or command to run
   - **GitHub URL**: Link to your GitHub repository
   - **Tags**: Comma-separated tags for organization
   - **Status**: Active, Completed, or Archived
   - **Notes**: Additional notes in markdown-style format

3. Click **"Create Project"**

### Managing Projects

- **View**: Click on any project card to see detailed information
- **Edit**: Click the edit icon (✏️) in project details
- **Delete**: Click the delete icon (🗑️) and confirm
- **Search**: Use the search bar to filter projects by name or description
- **Filter**: Click tags to filter projects

### GitHub Integration

1. Go to **Settings** (⚙️ icon in sidebar)
2. Add your GitHub Personal Access Token
   - Create token at: https://github.com/settings/tokens
   - Recommended scopes: `repo` (for private repos) or `public_repo`
3. In project details, click **"Fetch GitHub Info"** to load repository data

### Quick Actions

From the project dashboard:
- **Run Project**: Execute the configured command/executable
- **Open Folder**: Open project folder in file explorer
- **View on GitHub**: Open repository in browser
- **VS Code**: Open project in Visual Studio Code

### Data Export/Import

**Export:**
1. Go to Settings → Data Management
2. Click "Export Data"
3. Choose save location
4. A JSON backup file will be created

**Import:**
1. Go to Settings → Data Management
2. Click "Import Data"
3. Select your backup JSON file
4. All data will be replaced with imported data

## File Structure

```
PROJECT SYNAPSE/
├── main.js              # Electron main process
├── preload.js           # Preload script for IPC
├── renderer.html        # Main HTML file
├── renderer.js          # Renderer process (UI logic)
├── package.json         # Node.js dependencies and scripts
├── assets/              # Icons and images
│   ├── icon.png
│   ├── icon.ico (Windows)
│   └── icon.icns (macOS)
└── README.md           # This file
```

## Data Storage

Project data is stored locally using `electron-store`. 

**Default locations:**
- **Windows**: `%APPDATA%/project-synapse/config.json`
- **macOS**: `~/Library/Application Support/project-synapse/config.json`
- **Linux**: `~/.config/project-synapse/config.json`

## Troubleshooting

### Application won't start
- Ensure Node.js is installed: `node --version`
- Delete `node_modules` and reinstall: `npm install`
- Check for error messages in the terminal

### Projects not loading
- Check the data storage location (see above)
- Try exporting data, deleting config, and importing again
- Verify JSON format if manually editing

### GitHub features not working
- Verify your Personal Access Token is valid
- Check internet connection
- GitHub API rate limits may apply (60 requests/hour without token)

### Commands not executing
- Verify executable paths are correct
- Check file permissions
- On macOS/Linux, ensure execute permissions: `chmod +x file`
- Try running commands in a terminal first to verify they work

## Development

### Technologies Used
- **Electron**: Desktop application framework
- **Vanilla JavaScript**: No framework overhead, pure JS
- **Lucide Icons**: Crisp, scalable SVG icon system
- **electron-store**: Persistent data storage
- **GitHub API**: Repository information
- **Custom Window Frame**: Frameless window with native controls

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Acknowledgments

- JetBrains Mono font by JetBrains
- Icon emojis for quick development
- Electron community and documentation

## Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check existing issues for solutions
- Review the troubleshooting section

---

**Built with ❤️ for developers who love organization**
