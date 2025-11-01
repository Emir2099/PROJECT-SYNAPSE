// Project Synapse - Renderer Process

// State management
let state = {
  projects: [],
  currentView: 'grid',
  selectedProject: null,
  searchTerm: '',
  activeTags: new Set(),
  settings: {},
  githubCache: {},
  githubLoading: {},
  updateAvailable: false,
  updateInfo: null,
  downloadProgress: 0,
  releases: null,
  currentVersion: null
};

// Utility functions
const timeAgo = (dateString) => {
  const now = new Date();
  const past = new Date(dateString);
  const seconds = Math.floor((now - past) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";
  return Math.floor(seconds) + " seconds ago";
};

const escapeHtml = (text) => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

const getProjectInitials = (name) => {
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const getProjectAvatar = (project, size = 'md') => {
  const sizes = {
    sm: { width: '40px', height: '40px', fontSize: '1rem' },
    md: { width: '64px', height: '64px', fontSize: '1.5rem' },
    lg: { width: '120px', height: '120px', fontSize: '3rem' }
  };
  const s = sizes[size];
  
  if (project.image) {
    return `<div style="width: ${s.width}; height: ${s.height}; border-radius: 8px; overflow: hidden; flex-shrink: 0; background: white;">
      <img src="${escapeHtml(project.image)}" alt="${escapeHtml(project.name)}" style="width: 100%; height: 100%; object-fit: cover;">
    </div>`;
  }
  
  const initials = getProjectInitials(project.name);
  return `<div style="width: ${s.width}; height: ${s.height}; border-radius: 8px; background: linear-gradient(135deg, #ffffff 0%, #e0e0e0 100%); display: flex; align-items: center; justify-content: center; font-weight: bold; color: black; font-size: ${s.fontSize}; flex-shrink: 0;">
    ${initials}
  </div>`;
};

// Initialize app
async function init() {
  await loadProjects();
  await loadSettings();
  await loadCurrentVersion();
  setupTitlebar();
  setupUpdateListeners();
  render();
}

// Setup custom titlebar
function setupTitlebar() {
  const titlebar = document.createElement('div');
  titlebar.className = 'titlebar';
  titlebar.innerHTML = `
    <div class="titlebar-title">
      ${createIcon('layers', 'lucide-sm')}
      <span>Project Synapse</span>
    </div>
    <div class="titlebar-controls">
      <button class="titlebar-button" onclick="minimizeWindow()" title="Minimize">
        ${createIcon('minus')}
      </button>
      <button class="titlebar-button" onclick="maximizeWindow()" title="Maximize">
        ${createIcon('maximize')}
      </button>
      <button class="titlebar-button close" onclick="closeWindow()" title="Close">
        ${createIcon('x')}
      </button>
    </div>
  `;
  
  const root = document.getElementById('root');
  root.parentElement.insertBefore(titlebar, root);
}

// Window control functions
async function minimizeWindow() {
  await window.electronAPI.windowMinimize();
}

async function maximizeWindow() {
  await window.electronAPI.windowMaximize();
}

async function closeWindow() {
  await window.electronAPI.windowClose();
}

// Load projects from electron store
async function loadProjects() {
  const result = await window.electronAPI.getProjects();
  if (result.success) {
    state.projects = result.data;
  } else {
    console.error('Error loading projects:', result.error);
    alert('Error loading projects: ' + result.error);
  }
}

// Load settings
async function loadSettings() {
  const result = await window.electronAPI.getSettings();
  if (result.success) {
    state.settings = result.data;
  }
}

// Get all unique tags
function getAllTags() {
  const tags = new Set();
  state.projects.forEach(p => {
    if (p.tags && Array.isArray(p.tags)) {
      p.tags.forEach(t => tags.add(t));
    }
  });
  return Array.from(tags).sort();
}

// Filter projects
function getFilteredProjects() {
  return state.projects.filter(project => {
    const searchMatch =
      project.name.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
      (project.description && project.description.toLowerCase().includes(state.searchTerm.toLowerCase()));
    
    const tagsMatch =
      state.activeTags.size === 0 ||
      (project.tags && Array.from(state.activeTags).every(tag => project.tags.includes(tag)));
      
    return searchMatch && tagsMatch;
  });
}

// Render functions
function render() {
  const root = document.getElementById('root');
  
  switch (state.currentView) {
    case 'project':
      root.innerHTML = renderApp(renderProjectDashboard());
      break;
    case 'settings':
      root.innerHTML = renderApp(renderSettings());
      break;
    case 'help':
      root.innerHTML = renderApp(renderHelp());
      break;
    case 'add-project':
      root.innerHTML = renderApp(renderAddProject());
      break;
    case 'edit-project':
      root.innerHTML = renderApp(renderEditProject());
      break;
    case 'grid':
    default:
      root.innerHTML = renderApp(renderProjectGrid());
  }
  
  attachEventListeners();
}

function renderApp(content) {
  return `
    <div class="app-container">
      <div class="content-wrapper">
        ${renderSidebar()}
        <main class="main-content">
          ${content}
        </main>
      </div>
    </div>
  `;
}

function renderSidebar() {
  const isProjectsActive = state.currentView === 'grid' || state.currentView === 'project';
  const isSettingsActive = state.currentView === 'settings';
  const isHelpActive = state.currentView === 'help';
  
  return `
    <nav class="sidebar">
      <div class="p-2 mb-4">
        ${createIcon('layers', 'lucide-xl')}
      </div>
      <button class="sidebar-icon ${isProjectsActive ? 'active' : ''}" onclick="navigateTo('grid')">
        ${createIcon('grid-3x3', 'lucide-lg')}
        <span class="sidebar-icon-text">Projects</span>
      </button>
      <button class="sidebar-icon ${isHelpActive ? 'active' : ''}" onclick="navigateTo('help')">
        ${createIcon('help-circle', 'lucide-lg')}
        <span class="sidebar-icon-text">Help</span>
      </button>
      <button class="sidebar-icon ${isSettingsActive ? 'active' : ''}" onclick="navigateTo('settings')">
        ${createIcon('settings', 'lucide-lg')}
        <span class="sidebar-icon-text">Settings</span>
      </button>
      <div style="flex: 1;"></div>
      <button class="sidebar-icon" onclick="viewChangelog()" style="position: relative; margin-bottom: 2rem;" title="Release Notes">
        ${createIcon('file', 'lucide-lg')}
        <span class="sidebar-icon-text">Updates</span>
        ${state.updateAvailable ? '<span class="update-badge" style="top: 4px; right: 4px;">NEW</span>' : ''}
      </button>
    </nav>
  `;
}

function renderProjectGrid() {
  const filteredProjects = getFilteredProjects();
  const allTags = getAllTags();
  
  return `
    <div class="p-10" style="max-width: 1400px; margin: 0 auto;">
      <div class="flex justify-between items-center mb-10">
        <h1 class="text-4xl font-bold">Project Synapse</h1>
        <button class="btn btn-primary" onclick="navigateTo('add-project')">
          ${createIcon('plus', 'lucide-sm')} Add Project
        </button>
      </div>
      
      <div style="position: relative; margin-bottom: 1.5rem;">
        <input
          type="text"
          placeholder="Find projects..."
          class="input"
          style="padding-left: 3rem;"
          value="${escapeHtml(state.searchTerm)}"
          oninput="handleSearch(this.value)"
        />
        <div style="position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: var(--syn-gray);">
          ${createIcon('search')}
        </div>
      </div>

      ${allTags.length > 0 ? `
        <div class="mb-8">
          <h2 style="font-size: 0.875rem; font-weight: 600; text-transform: uppercase; color: var(--syn-gray); margin-bottom: 0.75rem;">
            Filter by Tag
          </h2>
          <div class="flex flex-wrap gap-2">
            ${allTags.map(tag => `
              <button
                class="tag ${state.activeTags.has(tag) ? 'active' : ''}"
                style="border: 2px solid ${state.activeTags.has(tag) ? 'var(--syn-white)' : 'var(--syn-border)'}; cursor: pointer;"
                onclick="toggleTag('${escapeHtml(tag)}')"
              >
                ${escapeHtml(tag)}
              </button>
            `).join('')}
            ${state.activeTags.size > 0 ? `
              <button
                style="padding: 0.25rem 0.75rem; font-size: 0.875rem; color: var(--syn-gray); background: none; border: none; cursor: pointer; display: flex; align-items: center; gap: 0.25rem;"
                onclick="clearTags()"
              >
                ${createIcon('x', 'lucide-sm')} Clear
              </button>
            ` : ''}
          </div>
        </div>
      ` : ''}

      ${filteredProjects.length === 0 ? `
        <div class="text-center text-gray mt-4">
          <div style="margin-bottom: 1rem; display: flex; justify-content: center; color: var(--syn-gray);">
            ${createIcon('search', 'lucide-xl')}
          </div>
          <p>No projects found. ${state.projects.length === 0 ? 'Add your first project to get started!' : 'Try adjusting your filters.'}</p>
        </div>
      ` : `
        <div class="grid grid-cols-3">
          ${filteredProjects.map(project => renderProjectCard(project)).join('')}
        </div>
      `}
    </div>
  `;
}

function renderProjectCard(project) {
  const displayTags = project.tags ? project.tags.slice(0, 3) : [];
  const extraTags = project.tags ? project.tags.length - 3 : 0;
  
  return `
    <div class="card cursor-pointer" onclick="selectProject('${project.id}')">
      <div class="flex items-center gap-4 mb-4">
        ${getProjectAvatar(project, 'sm')}
        <h2 class="text-xl font-bold" style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(project.name)}</h2>
      </div>
      <p class="text-gray" style="font-size: 0.875rem; margin-bottom: 1rem; height: 4rem; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical;">
        ${escapeHtml(project.description || '')}
      </p>
      <div class="flex flex-wrap gap-2">
        ${displayTags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
        ${extraTags > 0 ? `<span class="tag">+${extraTags}</span>` : ''}
      </div>
    </div>
  `;
}

function renderProjectDashboard() {
  const project = state.selectedProject;
  if (!project) return '<div class="loading">Project not found</div>';
  
  const githubInfo = state.githubCache[project.githubRepo];
  const isGithubLoading = project.githubRepo ? !!state.githubLoading[project.githubRepo] : false;
  
  return `
    <div class="p-10" style="max-width: 1200px; margin: 0 auto;">
      <div style="display: inline-flex; align-items: center; gap: 0.5rem; color: var(--syn-gray); cursor: pointer; margin-bottom: 1.5rem; font-size: 0.875rem;" onclick="navigateTo('grid')">
        ${createIcon('arrow-left', 'lucide-sm')} Back to projects
      </div>
      
      <div class="flex justify-between items-start" style="margin-bottom: 1rem;">
        <div style="flex: 1;">
          <h1 style="font-size: 3rem; font-weight: bold; margin-bottom: 0.75rem;">${escapeHtml(project.name)}</h1>
          <div class="flex flex-wrap gap-2">
            ${(project.tags || []).map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
          </div>
        </div>
        <div class="flex gap-2" style="flex-shrink: 0;">
          <button class="btn btn-secondary" style="padding: 0.5rem 0.75rem; height: 40px; display: flex; align-items: center; justify-content: center;" onclick="editProject('${project.id}')">
            ${createIcon('edit', 'lucide-sm')}
          </button>
          <button class="btn btn-secondary" style="padding: 0.5rem 0.75rem; height: 40px; display: flex; align-items: center; justify-content: center;" onclick="deleteProject('${project.id}')">
            ${createIcon('trash', 'lucide-sm')}
          </button>
        </div>
      </div>

      <div class="flex flex-wrap gap-4 mb-8">
        ${project.executablePath ? `
          <button class="btn btn-primary" onclick="runCommand('${escapeHtml(project.executablePath)}')">
            ${createIcon('play', 'lucide-sm')} Run Project
          </button>
        ` : ''}
        ${project.localPath ? `
          <button class="btn btn-secondary" onclick="openFolder('${escapeHtml(project.localPath)}')">
            ${createIcon('folder', 'lucide-sm')} Open Folder
          </button>
        ` : ''}
        ${project.githubRepo ? `
          <button class="btn btn-secondary" onclick="openExternalLink('${escapeHtml(project.githubRepo)}')">
            ${createIcon('github', 'lucide-sm')} View on GitHub
          </button>
        ` : ''}
        ${project.localPath ? `
          <button class="btn btn-secondary" onclick="runCommand('code &quot;${escapeHtml(project.localPath)}&quot;')">
            ${createIcon('code', 'lucide-sm')} VS Code
          </button>
        ` : ''}
      </div>
      
      <!-- Large Project Banner -->
      <div style="position: relative; border-radius: 12px; overflow: hidden; margin-bottom: 2rem; min-height: 280px; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%); border: 2px solid var(--syn-border);">
        ${project.image ? `
          <img src="${escapeHtml(project.image)}" alt="${escapeHtml(project.name)}" style="width: 100%; height: 100%; object-fit: cover;">
        ` : `
          <div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; opacity: 0.15; font-size: 8rem; font-weight: bold; color: white; user-select: none; overflow: hidden;">
            ${escapeHtml(project.name)}
          </div>
        `}
      </div>
      
      <p class="text-gray" style="font-size: 1.125rem; margin-bottom: 2.5rem; max-width: 900px;">
        ${escapeHtml(project.description || '')}
      </p>
      
      <div class="grid" style="grid-template-columns: repeat(2, 1fr); gap: 2rem; margin-bottom: 3rem;">
        <div class="card">
          <h3 class="text-2xl font-bold mb-4">Local Status</h3>
          <div class="space-y-3">
            ${project.localPath ? `
              <p class="text-gray" style="word-wrap: break-word; overflow-wrap: break-word;">
                <span class="font-bold text-white">Folder Path:</span><br>
                <a onclick="openFolder('${escapeHtml(project.localPath)}')" class="cursor-pointer" style="text-decoration: underline; word-break: break-all;" title="${escapeHtml(project.localPath)}">
                  ${escapeHtml(project.localPath).length > 50 ? '...' + escapeHtml(project.localPath).substring(project.localPath.length - 47) : escapeHtml(project.localPath)}
                </a>
              </p>
            ` : ''}
            ${project.executablePath ? `
              <p class="text-gray" style="word-wrap: break-word; overflow-wrap: break-word;">
                <span class="font-bold text-white">Executable:</span><br>
                <a onclick="runCommand('${escapeHtml(project.executablePath)}')" class="cursor-pointer" style="text-decoration: underline; word-break: break-all;" title="${escapeHtml(project.executablePath)}">
                  ${escapeHtml(project.executablePath).length > 50 ? '...' + escapeHtml(project.executablePath).substring(project.executablePath.length - 47) : escapeHtml(project.executablePath)}
                </a>
              </p>
            ` : ''}
          </div>
        </div>

        <div class="card">
          <h3 class="text-2xl font-bold mb-4">GitHub Repo</h3>
          <div class="space-y-3">
            ${project.githubRepo ? `
              <p class="text-gray" style="word-wrap: break-word; overflow-wrap: break-word;">
                <a onclick="openExternalLink('${escapeHtml(project.githubRepo)}')" class="text-white cursor-pointer" style="text-decoration: underline; display: inline-flex; align-items: center; gap: 0.5rem; word-break: break-all;">
                  ${escapeHtml(project.githubRepo.replace('https://github.com/', ''))} ${createIcon('external-link', 'lucide-sm')}
                </a>
              </p>
              ${isGithubLoading ? `
                <div class="gh-skeleton">
                  <div class="skeleton-line" style="width: 70%;"></div>
                  <div class="skeleton-line" style="width: 55%;"></div>
                  <div class="skeleton-badge" style="width: 60%;"></div>
                </div>
              ` : githubInfo ? `
                ${githubInfo.lastCommit ? `
                  <p class="text-gray" style="word-wrap: break-word; overflow-wrap: break-word;">
                    <span class="font-bold text-white">Last Commit:</span><br>
                    <span style="display: block; margin-top: 0.25rem;">${escapeHtml(githubInfo.lastCommit.message)} (${timeAgo(githubInfo.lastCommit.date)})</span>
                  </p>
                ` : ''}
                ${githubInfo.releases && githubInfo.releases.length > 0 ? `
                  <div>
                    <h4 class="font-bold text-white mb-1" style="font-size: 0.875rem;">Latest Release:</h4>
                    <a onclick="openExternalLink('${escapeHtml(githubInfo.releases[0].downloadUrl)}')" class="text-gray cursor-pointer flex items-center gap-2" style="text-decoration: underline;">
                      ${createIcon('download', 'lucide-sm')} ${escapeHtml(githubInfo.releases[0].name)} (${escapeHtml(githubInfo.releases[0].tag)})
                    </a>
                  </div>
                ` : ''}
              ` : `
                <button class="btn btn-secondary" onclick="fetchGitHubInfo('${project.id}', '${escapeHtml(project.githubRepo)}')">
                  ${createIcon('refresh-cw', 'lucide-sm')} Fetch GitHub Info
                </button>
              `}
            ` : '<p class="text-gray">No GitHub repository linked</p>'}
          </div>
        </div>

        <div class="card">
          <h3 class="text-2xl font-bold mb-4">Publications</h3>
          <div class="space-y-3">
            ${project.publications ? `
              <p class="text-gray" style="word-wrap: break-word; overflow-wrap: break-word;">
                ${escapeHtml(project.publications)}
              </p>
            ` : '<p class="text-gray">No publications listed</p>'}
          </div>
        </div>
        
        <div class="card">
          <h3 class="text-2xl font-bold mb-4">Project Notes</h3>
          <div class="text-gray" style="white-space: pre-line; word-break: break-word; overflow-wrap: anywhere; max-width: 100%; line-height: 1.6; letter-spacing: normal; word-spacing: normal;">
            ${project.notes ? escapeHtml(project.notes) : '## Next Steps\n\n- Add project details\n- Configure settings'}
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderSettings() {
  return `
    <div class="p-10" style="max-width: 900px; margin: 0 auto;">
      <h1 class="text-4xl font-bold mb-10">Settings</h1>
      
      <div style="display: flex; flex-direction: column; gap: 1.5rem;">
        <div class="card">
          <h3 class="text-2xl font-bold mb-4">Appearance</h3>
          <p class="text-gray">Theme is locked to Black & White.</p>
        </div>
        
        <div class="card">
          <h3 class="text-2xl font-bold mb-4">GitHub Integration</h3>
          <p class="text-gray mb-4">Set your GitHub Personal Access Token to enable syncing repositories and releases.</p>
          <label class="form-label">GitHub PAT</label>
          <input 
            type="password"
            class="input"
            placeholder="ghp_..."
            value="${escapeHtml(state.settings.githubToken || '')}"
            onchange="saveGithubToken(this.value)"
          />
          <p class="text-gray" style="font-size: 0.75rem; margin-top: 0.5rem;">
            Create a token at <a onclick="openExternalLink('https://github.com/settings/tokens')" class="text-white cursor-pointer" style="text-decoration: underline;">github.com/settings/tokens</a>
          </p>
        </div>
        
        <div class="card">
          <h3 class="text-2xl font-bold mb-4">Updates</h3>
          <p class="text-gray mb-4">Current version: ${state.currentVersion || 'Unknown'}</p>
          <button class="btn btn-primary" onclick="manualCheckForUpdates()">
            ${createIcon('refresh-cw', 'lucide-sm')} Check for Updates Now
          </button>
          <p class="text-gray" style="font-size: 0.75rem; margin-top: 0.5rem;">
            The app checks automatically on startup. Use this if you want to check manually.
          </p>
        </div>
        
        <div class="card style="margin-bottom: 4rem;">
          <h3 class="text-2xl font-bold mb-4">Data Management</h3>
          <p class="text-gray mb-4">Your project database is stored locally. You can export or import it here.</p>
          <div class="flex gap-4">
            <button class="btn btn-secondary" style="flex: 1;" onclick="exportData()">
              ${createIcon('download', 'lucide-sm')} Export Data
            </button>
            <button class="btn btn-secondary" style="flex: 1;" onclick="importData()">
              ${createIcon('upload', 'lucide-sm')} Import Data
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderHelp() {
  return `
    <div class="p-10" style="max-width: 1000px; margin: 0 auto;">
      <h1 class="text-4xl font-bold mb-10">Help & User Guide</h1>
      
      <div class="help-section">
        <h2 class="help-title">📦 Adding a New Project</h2>
        <div class="help-content">
          <p class="help-intro">Create a new project to track your work.</p>
          <ol class="help-steps">
            <li>Click the <strong>+ Add Project</strong> button on the Projects grid</li>
            <li>Fill in the project details:
              <ul>
                <li><strong>Project Name</strong> (required) - Give your project a descriptive name</li>
                <li><strong>Project Image</strong> (optional) - Paste an image URL or click "Choose File" to select an image from your computer</li>
                <li><strong>Description</strong> (optional) - Describe what your project is about</li>
                <li><strong>Local Folder Path</strong> (optional) - Click "Browse" to select your project's folder on your computer</li>
                <li><strong>Executable Path / Command</strong> (optional) - Click "Browse" to select an .exe file, or type a command like <code>npm start</code></li>
                <li><strong>GitHub Repository URL</strong> (optional) - Paste your GitHub repo URL (e.g., https://github.com/username/repo)</li>
                <li><strong>Tags</strong> (optional) - Add comma-separated tags like: python, ai, research</li>
                <li><strong>Status</strong> - Choose Active, Completed, or Archived</li>
                <li><strong>Publications</strong> (optional) - List any papers or publications related to this project</li>
                <li><strong>Notes</strong> (optional) - Add any notes or documentation</li>
              </ul>
            </li>
            <li>Click <strong>Create Project</strong> to save</li>
          </ol>
        </div>
      </div>

      <div class="help-section">
        <h2 class="help-title">✏️ Editing a Project</h2>
        <div class="help-content">
          <p class="help-intro">Update project information at any time.</p>
          <ol class="help-steps">
            <li>Click on a project card to view its details</li>
            <li>Click the <strong>Edit Project</strong> button in the Actions card</li>
            <li>Modify any fields you want to change</li>
            <li>Click <strong>Update Project</strong> to save your changes</li>
            <li>Or click <strong>Cancel</strong> to discard changes</li>
          </ol>
        </div>
      </div>

      <div class="help-section">
        <h2 class="help-title">🗑️ Deleting a Project</h2>
        <div class="help-content">
          <p class="help-intro">Remove projects you no longer need.</p>
          <ol class="help-steps">
            <li>Click on a project card to view its details</li>
            <li>Click the <strong>Delete Project</strong> button in the Actions card</li>
            <li>Confirm the deletion in the popup dialog</li>
            <li><em>Note: This only removes the project from Synapse—your actual files remain untouched</em></li>
          </ol>
        </div>
      </div>

      <div class="help-section">
        <h2 class="help-title">🔍 Searching & Filtering</h2>
        <div class="help-content">
          <p class="help-intro">Find projects quickly using search and tags.</p>
          <ol class="help-steps">
            <li><strong>Search by name</strong>: Type in the search bar at the top—results filter automatically</li>
            <li><strong>Filter by tags</strong>: Click any tag below the search bar to show only projects with that tag</li>
            <li><strong>Multiple tags</strong>: Click multiple tags to narrow down results further</li>
            <li><strong>Clear filters</strong>: Click the <strong>Clear All</strong> button to reset tag filters</li>
          </ol>
        </div>
      </div>

      <div class="help-section">
        <h2 class="help-title">▶️ Running a Project</h2>
        <div class="help-content">
          <p class="help-intro">Launch your project's executable or command.</p>
          <ol class="help-steps">
            <li>Click on a project to open its dashboard</li>
            <li>In the <strong>Actions</strong> card, click <strong>Run Project</strong></li>
            <li>The command or executable you configured will run</li>
            <li><em>Note: If you didn't set an executable path/command, this button won't appear</em></li>
          </ol>
          <p class="help-note"><strong>Tip:</strong> You can set executable paths to .exe files, .bat files, or shell commands</p>
        </div>
      </div>

      <div class="help-section">
        <h2 class="help-title">📁 Opening Project Folder</h2>
        <div class="help-content">
          <p class="help-intro">Quickly access your project's files in File Explorer.</p>
          <ol class="help-steps">
            <li>Click on a project to open its dashboard</li>
            <li>In the <strong>Actions</strong> card, click <strong>Open Folder</strong></li>
            <li>Your file explorer will open to the folder you configured</li>
            <li><em>Note: You must set a Local Folder Path in the project settings for this to work</em></li>
          </ol>
        </div>
      </div>

      <div class="help-section">
        <h2 class="help-title">💻 Opening in VS Code</h2>
        <div class="help-content">
          <p class="help-intro">Launch your project directly in Visual Studio Code.</p>
          <ol class="help-steps">
            <li>Click on a project to open its dashboard</li>
            <li>In the <strong>Actions</strong> card, click <strong>Open in VS Code</strong></li>
            <li>VS Code will open with your project folder</li>
            <li><em>Requirements: VS Code must be installed and the <code>code</code> command available in your PATH</em></li>
          </ol>
        </div>
      </div>

      <div class="help-section">
        <h2 class="help-title">🐙 GitHub Integration</h2>
        <div class="help-content">
          <p class="help-intro">Fetch live data from your GitHub repositories.</p>
          <ol class="help-steps">
            <li><strong>Basic setup</strong>: Add a GitHub Repository URL when creating/editing a project</li>
            <li><strong>For better rate limits</strong> (optional):
              <ul>
                <li>Go to Settings from the sidebar</li>
                <li>Under GitHub Integration, paste your Personal Access Token (PAT)</li>
                <li>Create a token at <a onclick="openExternalLink('https://github.com/settings/tokens')" class="help-link">github.com/settings/tokens</a></li>
                <li>The token needs <code>repo</code> scope for private repos, or no scopes for public repos</li>
              </ul>
            </li>
            <li><strong>View GitHub data</strong>:
              <ul>
                <li>Open a project with a GitHub URL</li>
                <li>In the <strong>GitHub Repo</strong> card, click <strong>Fetch GitHub Info</strong></li>
                <li>The card will show: latest commit, open issues, pull requests, stars, and latest release</li>
              </ul>
            </li>
            <li><strong>Visit on GitHub</strong>: Click the <strong>View on GitHub</strong> button to open the repo in your browser</li>
          </ol>
          <p class="help-note"><strong>Note:</strong> Without a token, you're limited to 60 API requests per hour. With a token, you get 5,000 per hour.</p>
        </div>
      </div>

      <div class="help-section">
        <h2 class="help-title">💾 Export & Import Data</h2>
        <div class="help-content">
          <p class="help-intro">Backup your projects or transfer them to another computer.</p>
          <h3 class="help-subtitle">Exporting</h3>
          <ol class="help-steps">
            <li>Go to <strong>Settings</strong> from the sidebar</li>
            <li>Scroll to <strong>Data Management</strong></li>
            <li>Click <strong>Export Data</strong></li>
            <li>Choose where to save the JSON file</li>
            <li>Your projects are now backed up!</li>
          </ol>
          <h3 class="help-subtitle">Importing</h3>
          <ol class="help-steps">
            <li>Go to <strong>Settings</strong> from the sidebar</li>
            <li>Scroll to <strong>Data Management</strong></li>
            <li>Click <strong>Import Data</strong></li>
            <li>Select a previously exported JSON file</li>
            <li>Your projects will be restored</li>
          </ol>
          <p class="help-note"><strong>Warning:</strong> Importing will replace all current projects. Export first if you want to keep them!</p>
        </div>
      </div>

      <div class="help-section">
        <h2 class="help-title">🔄 Updates</h2>
        <div class="help-content">
          <p class="help-intro">Keep Project Synapse up to date with the latest features.</p>
          <ol class="help-steps">
            <li><strong>Automatic checks</strong>: The app checks for updates when you launch it</li>
            <li><strong>Update notification</strong>: If an update is available, you'll see a "NEW" badge on the Updates button in the sidebar</li>
            <li><strong>View changelog</strong>: Click the <strong>Updates</strong> button to see what's new</li>
            <li><strong>Download update</strong>: Click <strong>Download Update</strong> in the modal</li>
            <li><strong>Install</strong>: After download completes, click <strong>Restart and Install</strong></li>
            <li><strong>Manual check</strong>: Go to Settings and click <strong>Check for Updates Now</strong> anytime</li>
          </ol>
          <p class="help-note"><strong>Note:</strong> Updates are differential (only changed files), so downloads are typically 5-20MB instead of the full 150MB.</p>
        </div>
      </div>

      <div class="help-section">
        <h2 class="help-title">⌨️ Tips & Shortcuts</h2>
        <div class="help-content">
          <ul class="help-tips">
            <li><strong>Quick navigation</strong>: Use the sidebar to switch between Projects, Help, and Settings</li>
            <li><strong>Status indicators</strong>: Projects show colored status badges (Active=green, Completed=blue, Archived=gray)</li>
            <li><strong>Image previews</strong>: When adding an image, you'll see a live preview as you paste or select</li>
            <li><strong>Tags are auto-created</strong>: Just type them in comma-separated format—they'll appear as filter chips automatically</li>
            <li><strong>GitHub fetching</strong>: The first fetch might take a moment, but data is cached for speed</li>
            <li><strong>Multiple actions</strong>: You can run, open folder, and edit from the same project dashboard</li>
          </ul>
        </div>
      </div>

      <div class="help-section">
        <h2 class="help-title">🆘 Troubleshooting</h2>
        <div class="help-content">
          <h3 class="help-subtitle">Updates stuck at 0%?</h3>
          <ul class="help-tips">
            <li>Wait 30 seconds—the app will detect the stuck download and offer a retry button</li>
            <li>Check your internet connection</li>
            <li>Try the <strong>Check for Updates Now</strong> button in Settings</li>
            <li>As a last resort, download the latest installer manually from GitHub Releases</li>
          </ul>
          
          <h3 class="help-subtitle">"Open in VS Code" not working?</h3>
          <ul class="help-tips">
            <li>Make sure VS Code is installed</li>
            <li>During VS Code installation, check "Add to PATH"</li>
            <li>Restart your computer after installing VS Code</li>
          </ul>
          
          <h3 class="help-subtitle">GitHub API rate limit?</h3>
          <ul class="help-tips">
            <li>Without a token: 60 requests/hour</li>
            <li>With a token: 5,000 requests/hour</li>
            <li>Add your GitHub PAT in Settings to increase limits</li>
          </ul>
          
          <h3 class="help-subtitle">Project won't run?</h3>
          <ul class="help-tips">
            <li>Check that the executable path is correct</li>
            <li>Make sure the file exists and has the right permissions</li>
            <li>For commands like <code>npm start</code>, ensure Node.js/npm is installed</li>
            <li>Check the DevTools console (Ctrl+Shift+I) for error messages</li>
          </ul>
        </div>
      </div>

      <div class="help-section">
        <h2 class="help-title">📝 Data Storage</h2>
        <div class="help-content">
          <p class="help-intro">Understanding where your data lives.</p>
          <ul class="help-tips">
            <li><strong>Local storage</strong>: All project data is stored locally on your computer using electron-store</li>
            <li><strong>No cloud</strong>: Nothing is sent to any server (except GitHub API calls when you fetch repo data)</li>
            <li><strong>Privacy</strong>: Your projects, notes, and settings stay on your machine</li>
            <li><strong>Backup recommendation</strong>: Use the Export Data feature regularly to create backups</li>
          </ul>
        </div>
      </div>

      <div class="help-footer">
        <p>Still need help? Check the <a onclick="openExternalLink('https://github.com/Emir2099/PROJECT-SYNAPSE')" class="help-link">GitHub repository</a> for issues and discussions.</p>
        <p style="margin-top: 1rem; color: var(--syn-gray); font-size: 0.875rem;">Project Synapse v${state.currentVersion}</p>
      </div>
    </div>
  `;
}

function renderAddProject() {
  return renderProjectForm(null);
}

function renderEditProject() {
  return renderProjectForm(state.selectedProject);
}

function renderProjectForm(project) {
  const isEdit = !!project;
  
  return `
    <div class="p-10" style="max-width: 800px; margin: 0 auto;">
      <button class="btn btn-secondary mb-6" onclick="navigateTo(${isEdit ? "'project'" : "'grid'"})">
        ${createIcon('arrow-left', 'lucide-sm')} Back
      </button>
      
      <h1 class="text-4xl font-bold mb-10">${isEdit ? 'Edit' : 'Add'} Project</h1>
      
      <form id="projectForm" onsubmit="saveProject(event)">
        ${isEdit ? `<input type="hidden" name="id" value="${project.id}">` : ''}
        
        <div class="form-group">
          <label class="form-label">Project Name *</label>
          <input type="text" name="name" class="input" required value="${escapeHtml(project?.name || '')}">
        </div>
        
        <div class="form-group">
          <label class="form-label">Project Image (optional)</label>
          <div style="display: flex; align-items: center; gap: 1rem;">
            <div id="imagePreview" style="width: 64px; height: 64px; border-radius: 8px; overflow: hidden; border: 2px solid var(--syn-border); display: flex; align-items: center; justify-content: center; background: #1a1a1a;">
              ${project?.image ? `<img src="${escapeHtml(project.image)}" style="width: 100%; height: 100%; object-fit: cover;">` : `<span style="color: var(--syn-gray); font-size: 0.75rem;">No image</span>`}
            </div>
            <div style="flex: 1;">
              <input type="text" name="image" id="imageInput" class="input" placeholder="Paste image URL or select file" value="${escapeHtml(project?.image || '')}" oninput="previewImage(this.value)">
              <input type="file" id="imageFile" accept="image/*" style="display: none;" onchange="handleImageFile(this)">
              <button type="button" class="btn btn-secondary" style="margin-top: 0.5rem;" onclick="document.getElementById('imageFile').click()">
                ${createIcon('upload', 'lucide-sm')} Choose File
              </button>
            </div>
          </div>
        </div>
        
        <div class="form-group">
          <label class="form-label">Description</label>
          <textarea name="description" class="input">${escapeHtml(project?.description || '')}</textarea>
        </div>
        
          <div class="form-group">
          <label class="form-label">Local Folder Path</label>
          <div class="flex gap-2">
            <input type="text" name="localPath" class="input" value="${escapeHtml(project?.localPath || '')}">
            <button type="button" class="btn btn-secondary" onclick="selectFolder('localPath')">
              ${createIcon('folder', 'lucide-sm')} Browse
            </button>
          </div>
        </div>
        
        <div class="form-group">
          <label class="form-label">Executable Path / Command</label>
          <div class="flex gap-2">
            <input type="text" name="executablePath" class="input" value="${escapeHtml(project?.executablePath || '')}">
            <button type="button" class="btn btn-secondary" onclick="selectFile('executablePath')">
              ${createIcon('file', 'lucide-sm')} Browse
            </button>
          </div>
        </div>        <div class="form-group">
          <label class="form-label">GitHub Repository URL</label>
          <input type="url" name="githubRepo" class="input" placeholder="https://github.com/username/repo" value="${escapeHtml(project?.githubRepo || '')}">
        </div>
        
        <div class="form-group">
          <label class="form-label">Tags (comma-separated)</label>
          <input type="text" name="tags" class="input" placeholder="python, ai, research" value="${project?.tags ? project.tags.join(', ') : ''}">
        </div>
        
        <div class="form-group">
          <label class="form-label">Status</label>
          <select name="status" class="input">
            <option value="active" ${project?.status === 'active' ? 'selected' : ''}>Active</option>
            <option value="completed" ${project?.status === 'completed' ? 'selected' : ''}>Completed</option>
            <option value="archived" ${project?.status === 'archived' ? 'selected' : ''}>Archived</option>
          </select>
        </div>
        
        <div class="form-group">
          <label class="form-label">Publications</label>
          <textarea name="publications" class="input" rows="4" placeholder="List your publications, papers, or related work">${escapeHtml(project?.publications || '')}</textarea>
        </div>
        
        <div class="form-group">
          <label class="form-label">Notes</label>
          <textarea name="notes" class="input" rows="6">${escapeHtml(project?.notes || '')}</textarea>
        </div>
        
        <div class="flex gap-4" style="margin-bottom: 3rem;">
          <button type="submit" class="btn btn-primary" style="flex: 1;">
            ${createIcon('save', 'lucide-sm')} ${isEdit ? 'Update' : 'Create'} Project
          </button>
          <button type="button" class="btn btn-secondary" onclick="navigateTo(${isEdit ? "'project'" : "'grid'"})">
            ${createIcon('x', 'lucide-sm')} Cancel
          </button>
        </div>
      </form>
    </div>
  `;
}

// Event handlers
function navigateTo(view) {
  state.currentView = view;
  if (view === 'grid') {
    state.selectedProject = null;
  }
  render();
}

function handleSearch(value) {
  state.searchTerm = value;
  render();
}

function toggleTag(tag) {
  if (state.activeTags.has(tag)) {
    state.activeTags.delete(tag);
  } else {
    state.activeTags.add(tag);
  }
  render();
}

function clearTags() {
  state.activeTags.clear();
  render();
}

async function selectProject(projectId) {
  state.selectedProject = state.projects.find(p => p.id === projectId);
  state.currentView = 'project';
  
  // Fetch GitHub info if available and not cached
  if (state.selectedProject.githubRepo && !state.githubCache[state.selectedProject.githubRepo]) {
    // mark loading for this repo
    state.githubLoading[state.selectedProject.githubRepo] = true;
    // render to show skeleton state immediately
    render();
    fetchGitHubInfo(projectId, state.selectedProject.githubRepo);
  }
  
  render();
}

function editProject(projectId) {
  state.selectedProject = state.projects.find(p => p.id === projectId);
  state.currentView = 'edit-project';
  render();
}

async function deleteProject(projectId) {
  if (!confirm('Are you sure you want to delete this project?')) {
    return;
  }
  
  const result = await window.electronAPI.deleteProject(projectId);
  if (result.success) {
    await loadProjects();
    navigateTo('grid');
  } else {
    alert('Error deleting project: ' + result.error);
  }
}

async function saveProject(event) {
  event.preventDefault();
  
  const formData = new FormData(event.target);
  const project = {
    id: formData.get('id') || undefined,
    name: formData.get('name'),
    description: formData.get('description'),
    image: formData.get('image') || undefined,
    localPath: formData.get('localPath'),
    executablePath: formData.get('executablePath'),
    githubRepo: formData.get('githubRepo'),
    status: formData.get('status'),
    publications: formData.get('publications'),
    notes: formData.get('notes'),
    tags: formData.get('tags') ? formData.get('tags').split(',').map(t => t.trim()).filter(t => t) : []
  };
  
  const result = await window.electronAPI.saveProject(project);
  if (result.success) {
    await loadProjects();
    navigateTo('grid');
  } else {
    alert('Error saving project: ' + result.error);
  }
}

async function selectFolder(inputName) {
  const result = await window.electronAPI.selectFolder();
  if (result.success && result.path) {
    document.querySelector(`input[name="${inputName}"]`).value = result.path;
  }
}

async function selectFile(inputName) {
  const result = await window.electronAPI.selectFile();
  if (result.success && result.path) {
    document.querySelector(`input[name="${inputName}"]`).value = result.path;
  }
}

function previewImage(url) {
  const preview = document.getElementById('imagePreview');
  if (url && url.trim()) {
    preview.innerHTML = `<img src="${escapeHtml(url)}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.parentElement.innerHTML='<span style=\\'color: var(--syn-gray); font-size: 0.75rem;\\'>Invalid</span>'">`;
  } else {
    preview.innerHTML = '<span style="color: var(--syn-gray); font-size: 0.75rem;">No image</span>';
  }
}

function handleImageFile(input) {
  const file = input.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const dataUrl = e.target.result;
      document.getElementById('imageInput').value = dataUrl;
      previewImage(dataUrl);
    };
    reader.readAsDataURL(file);
  }
}

async function openFolder(path) {
  const result = await window.electronAPI.openFolder(path);
  if (!result.success) {
    alert('Error opening folder: ' + result.error);
  }
}

async function runCommand(command) {
  const result = await window.electronAPI.runCommand(command);
  if (!result.success) {
    alert('Error running command: ' + result.error);
  }
}

async function openExternalLink(url) {
  const result = await window.electronAPI.openExternalLink(url);
  if (!result.success) {
    alert('Error opening link: ' + result.error);
  }
}

async function fetchGitHubInfo(projectId, repoUrl) {
  // set loading for this repo
  state.githubLoading[repoUrl] = true;
  // re-render the current view to show skeleton in the card only
  render();

  const result = await window.electronAPI.fetchGithubInfo(repoUrl);
  if (result.success) {
    state.githubCache[repoUrl] = result.data;
    state.githubLoading[repoUrl] = false;
    // If we're still viewing this project, re-render
    if (state.selectedProject && state.selectedProject.id === projectId) {
      render();
    }
  } else {
    console.error('Error fetching GitHub info:', result.error);
    state.githubLoading[repoUrl] = false;
    // Re-render to remove skeleton and show the fetch button again
    if (state.selectedProject && state.selectedProject.id === projectId) {
      render();
    }
  }
}

async function saveGithubToken(token) {
  state.settings.githubToken = token;
  const result = await window.electronAPI.saveSettings(state.settings);
  if (!result.success) {
    alert('Error saving settings: ' + result.error);
  }
}

async function exportData() {
  const result = await window.electronAPI.exportData();
  if (result.success && !result.canceled) {
    alert('Data exported successfully to:\n' + result.path);
  } else if (result.error) {
    alert('Error exporting data: ' + result.error);
  }
}

async function importData() {
  if (!confirm('Importing will replace all current data. Continue?')) {
    return;
  }
  
  const result = await window.electronAPI.importData();
  if (result.success && !result.canceled) {
    await loadProjects();
    await loadSettings();
    navigateTo('grid');
    alert('Data imported successfully!');
  } else if (result.error) {
    alert('Error importing data: ' + result.error);
  }
}

async function manualCheckForUpdates() {
  const notification = document.createElement('div');
  notification.className = 'update-notification';
  notification.id = 'checking-updates';
  notification.innerHTML = `
    <h3>Checking for Updates...</h3>
    <p class="text-gray">Please wait...</p>
  `;
  document.body.appendChild(notification);
  
  try {
    const result = await window.electronAPI.checkForUpdates();
    const existing = document.getElementById('checking-updates');
    if (existing) existing.remove();
    
    if (result.success) {
      // Update available notification will be shown by the event listener
      console.log('Update check completed:', result.updateInfo);
    } else {
      alert('No updates available. You are on the latest version!');
    }
  } catch (error) {
    const existing = document.getElementById('checking-updates');
    if (existing) existing.remove();
    alert('Error checking for updates: ' + error.message);
  }
}

function attachEventListeners() {
  // Event listeners are attached via onclick attributes in the HTML
  // This function is for any additional listeners if needed
}

// ===== AUTO-UPDATE SYSTEM =====

async function loadCurrentVersion() {
  const version = await window.electronAPI.getCurrentVersion();
  state.currentVersion = version;
}

function setupUpdateListeners() {
  // Listen for update available
  window.electronAPI.onUpdateAvailable((data) => {
    state.updateAvailable = true;
    state.updateInfo = data;
    showUpdateNotification(data);
  });
  
  // Listen for download progress
  window.electronAPI.onUpdateDownloadProgress((data) => {
    state.downloadProgress = data.percent;
    updateDownloadProgress(data);
  });
  
  // Listen for update downloaded
  window.electronAPI.onUpdateDownloaded((data) => {
    showInstallNotification(data);
  });
  
  // Listen for errors
  window.electronAPI.onUpdateError((error) => {
    console.error('Update error:', error);
  });
}

function showUpdateNotification(data) {
  const notification = document.createElement('div');
  notification.className = 'update-notification';
  notification.id = 'update-notification';
  notification.innerHTML = `
    <h3>🎉 Update Available!</h3>
    <p>Version ${data.version} is ready to download</p>
    <div class="update-actions">
      <button class="btn btn-primary" onclick="downloadUpdate()">
        ${createIcon('download', 'lucide-sm')} Download
      </button>
      <button class="btn btn-secondary" onclick="viewChangelog()">
        ${createIcon('file', 'lucide-sm')} What's New
      </button>
      <button class="btn btn-secondary" onclick="dismissUpdate()">
        Later
      </button>
    </div>
  `;
  document.body.appendChild(notification);
  
  // Update sidebar badge
  updateSidebarBadge();
}

async function downloadUpdate() {
  dismissUpdate();
  
  const notification = document.createElement('div');
  notification.className = 'update-notification';
  notification.id = 'download-progress';
  notification.innerHTML = `
    <h3>Downloading Update...</h3>
    <p>This won't take long</p>
    <div class="progress-bar">
      <div class="progress-fill" id="progress-fill" style="width: 0%"></div>
    </div>
    <p id="progress-text" class="text-gray" style="font-size: 0.75rem;">0% - Initializing download...</p>
    <div id="download-actions" style="margin-top: 1rem; display: none;">
      <button class="btn btn-secondary" onclick="retryDownload()" style="font-size: 0.875rem;">
        ${createIcon('refresh-cw', 'lucide-sm')} Retry Download
      </button>
      <button class="btn btn-secondary" onclick="dismissUpdate()" style="font-size: 0.875rem; margin-left: 0.5rem;">
        Cancel
      </button>
    </div>
  `;
  document.body.appendChild(notification);
  
  // Monitor for stuck downloads
  let lastProgressTime = Date.now();
  let hasReceivedProgress = false;
  
  window._updateProgressTimestamp = () => { 
    lastProgressTime = Date.now();
    hasReceivedProgress = true;
  };
  
  const progressCheckInterval = setInterval(() => {
    const timeSinceLastProgress = Date.now() - lastProgressTime;
    const progressText = document.getElementById('progress-text');
    const actionsDiv = document.getElementById('download-actions');
    
    if (timeSinceLastProgress > 30000 && !hasReceivedProgress) {
      clearInterval(progressCheckInterval);
      if (progressText) {
        progressText.textContent = '⚠️ Download appears stuck. This might mean:\n• No v2.3.0 release on GitHub yet\n• Network/firewall blocking connection\n• GitHub API rate limit';
        progressText.style.color = '#ff9800';
        progressText.style.whiteSpace = 'pre-line';
      }
      if (actionsDiv) {
        actionsDiv.style.display = 'flex';
        actionsDiv.style.gap = '0.5rem';
      }
    }
  }, 5000);
  
  try {
    const result = await window.electronAPI.downloadUpdate();
    if (!result.success && result.error) {
      throw new Error(result.error);
    }
  } catch (error) {
    clearInterval(progressCheckInterval);
    const progressText = document.getElementById('progress-text');
    const actionsDiv = document.getElementById('download-actions');
    if (progressText) {
      progressText.textContent = '❌ Download error: ' + error.message;
      progressText.style.color = '#f44336';
    }
    if (actionsDiv) {
      actionsDiv.style.display = 'flex';
      actionsDiv.style.gap = '0.5rem';
    }
  }
}

function retryDownload() {
  const existing = document.getElementById('download-progress');
  if (existing) existing.remove();
  downloadUpdate();
}

function updateDownloadProgress(data) {
  const progressFill = document.getElementById('progress-fill');
  const progressText = document.getElementById('progress-text');
  
  // Update timestamp for stuck detection
  if (window._updateProgressTimestamp) {
    window._updateProgressTimestamp();
  }
  
  if (progressFill && progressText) {
    const percent = Math.round(data.percent);
    progressFill.style.width = percent + '%';
    progressText.textContent = `${percent}% - ${formatBytes(data.transferred)} / ${formatBytes(data.total)}`;
    progressText.style.color = 'var(--syn-gray)'; // Reset color on progress
  }
}

function showInstallNotification(data) {
  const existing = document.getElementById('download-progress');
  if (existing) existing.remove();
  
  const notification = document.createElement('div');
  notification.className = 'update-notification';
  notification.id = 'install-notification';
  notification.innerHTML = `
    <h3>✅ Update Downloaded!</h3>
    <p>Version ${data.version} is ready to install</p>
    <div class="update-actions">
      <button class="btn btn-primary" onclick="installUpdate()">
        ${createIcon('refresh-cw', 'lucide-sm')} Restart & Install
      </button>
      <button class="btn btn-secondary" onclick="dismissUpdate()">
        Later
      </button>
    </div>
  `;
  document.body.appendChild(notification);
}

function installUpdate() {
  window.electronAPI.installUpdate();
}

function dismissUpdate() {
  const notifications = [
    document.getElementById('update-notification'),
    document.getElementById('download-progress'),
    document.getElementById('install-notification')
  ];
  notifications.forEach(n => n && n.remove());
}

function updateSidebarBadge() {
  // This will be rendered in the sidebar if update is available
  render();
}

async function viewChangelog() {
  if (!state.releases) {
    const result = await window.electronAPI.getReleases();
    if (result.success) {
      state.releases = parseReleases(result.content);
    }
  }
  
  showChangelogModal();
}

function parseReleases(markdown) {
  const releases = [];
  const lines = markdown.split('\n');
  let currentRelease = null;
  let currentSection = null;
  
  for (let line of lines) {
    // Version header: ## Version 2.1.0 - November 1, 2025
    if (line.startsWith('## Version ')) {
      if (currentRelease) releases.push(currentRelease);
      const match = line.match(/## Version ([\d.]+) - (.+)/);
      if (match) {
        currentRelease = {
          version: match[1],
          date: match[2],
          sections: []
        };
        currentSection = null;
      }
    }
    // Section header: ### ✨ What's New
    else if (line.startsWith('### ') && currentRelease) {
      const title = line.replace('### ', '').trim();
      currentSection = { title, items: [] };
      currentRelease.sections.push(currentSection);
    }
    // Section items
    else if (line.startsWith('**') && currentSection) {
      const text = line.replace(/\*\*/g, '').trim();
      if (text) currentSection.items.push({ type: 'bold', text });
    }
    else if (line.startsWith('- ') && currentSection) {
      const text = line.replace('- ', '').trim();
      if (text) currentSection.items.push({ type: 'list', text });
    }
    else if (line.trim() && !line.startsWith('#') && !line.startsWith('---') && currentSection && line.length > 10) {
      currentSection.items.push({ type: 'text', text: line.trim() });
    }
  }
  
  if (currentRelease) releases.push(currentRelease);
  return releases;
}

function showChangelogModal() {
  const modal = document.createElement('div');
  modal.className = 'changelog-modal';
  modal.onclick = (e) => {
    if (e.target === modal) hideChangelogModal();
  };
  
  modal.innerHTML = `
    <div class="changelog-content" onclick="event.stopPropagation()">
      <div class="changelog-header">
        <h2>Release Notes</h2>
        <button class="changelog-close" onclick="hideChangelogModal()">
          ${createIcon('x', 'lucide-lg')}
        </button>
      </div>
      <div class="changelog-body">
        ${renderReleases()}
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
}

function hideChangelogModal() {
  const modal = document.querySelector('.changelog-modal');
  if (modal) modal.remove();
}

function renderReleases() {
  if (!state.releases || state.releases.length === 0) {
    return '<p class="text-gray">No release notes available.</p>';
  }
  
  return state.releases.map(release => `
    <div class="release-version">
      <div class="release-header">
        <span class="version-tag">v${release.version}</span>
        <span class="version-date">${release.date}</span>
        ${release.version === state.currentVersion ? '<span class="tag" style="background: var(--syn-white); color: var(--syn-black);">Current</span>' : ''}
      </div>
      ${release.sections.map(section => `
        <div class="release-section">
          <h4>${section.title}</h4>
          ${section.items.map(item => {
            if (item.type === 'bold') {
              return `<p style="color: var(--syn-white); font-weight: 600; margin: 0.75rem 0;">${item.text}</p>`;
            } else if (item.type === 'list') {
              return `<ul><li>${item.text}</li></ul>`;
            } else {
              return `<p style="color: var(--syn-gray); margin: 0.5rem 0;">${item.text}</p>`;
            }
          }).join('')}
        </div>
      `).join('')}
    </div>
  `).join('');
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Start the app
window.addEventListener('DOMContentLoaded', init);
