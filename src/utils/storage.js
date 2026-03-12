/**
 * Storage utilities for Design Timeline persistence
 * Uses localStorage with versioning for data migration support
 */

const STORAGE_PREFIX = 'designtimeline:';
const CURRENT_VERSION = 1;
const METADATA_KEY = `${STORAGE_PREFIX}metadata`;

/**
 * Generate storage key for a project
 * @param {string} projectName - Project name
 * @returns {string} Storage key
 */
function getProjectKey(projectName) {
  return `${STORAGE_PREFIX}project:${projectName || 'default'}`;
}

/**
 * Save state to localStorage
 * @param {string} projectName - Current project name
 * @param {Object} state - State object to save
 * @returns {boolean} Success status
 */
export function saveState(projectName, state) {
  try {
    const data = {
      version: CURRENT_VERSION,
      timestamp: Date.now(),
      projectName,
      state
    };
    
    const key = getProjectKey(projectName);
    localStorage.setItem(key, JSON.stringify(data));
    
    // Update metadata with last active project
    const metadata = {
      lastProject: projectName,
      lastSaved: Date.now(),
      version: CURRENT_VERSION
    };
    localStorage.setItem(METADATA_KEY, JSON.stringify(metadata));
    
    return true;
  } catch (error) {
    console.error('Failed to save state:', error);
    return false;
  }
}

/**
 * Load state from localStorage
 * @param {string} projectName - Project name to load
 * @returns {Object|null} Loaded state or null if not found
 */
export function loadState(projectName) {
  try {
    const key = getProjectKey(projectName);
    const data = localStorage.getItem(key);
    
    if (!data) return null;
    
    const parsed = JSON.parse(data);
    
    // Validate data structure
    if (!parsed.state || !parsed.version) {
      console.warn('Invalid data structure, clearing corrupted data');
      localStorage.removeItem(key);
      return null;
    }
    
    // Handle version migrations in the future
    if (parsed.version !== CURRENT_VERSION) {
      console.log(`Migrating from version ${parsed.version} to ${CURRENT_VERSION}`);
      return migrateData(parsed);
    }
    
    return parsed.state;
  } catch (error) {
    console.error('Failed to load state:', error);
    return null;
  }
}

/**
 * Clear state for a specific project
 * @param {string} projectName - Project name to clear
 * @returns {boolean} Success status
 */
export function clearState(projectName) {
  try {
    const key = getProjectKey(projectName);
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('Failed to clear state:', error);
    return false;
  }
}

/**
 * Clear all Design Timeline storage (metadata and all projects)
 * @returns {boolean} Success status
 */
export function clearAllStorage() {
  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    return true;
  } catch (error) {
    console.error('Failed to clear all storage:', error);
    return false;
  }
}

/**
 * Export all data to JSON file
 * @param {string} projectName - Current project name
 * @returns {string} Download URL
 */
export function exportData(projectName) {
  try {
    const key = getProjectKey(projectName);
    const data = localStorage.getItem(key);
    
    if (!data) {
      throw new Error('No data to export');
    }
    
    const exportObj = {
      exportDate: new Date().toISOString(),
      version: CURRENT_VERSION,
      data: JSON.parse(data)
    };
    
    const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    return url;
  } catch (error) {
    console.error('Failed to export data:', error);
    return null;
  }
}

/**
 * Import data from JSON file
 * @param {Object} importData - Parsed JSON data
 * @returns {boolean} Success status
 */
export function importData(importData) {
  try {
    // Validate import data structure
    if (!importData.data || !importData.data.projectName) {
      throw new Error('Invalid import data structure');
    }
    
    const { projectName, state } = importData.data;
    const key = getProjectKey(projectName);
    
    localStorage.setItem(key, JSON.stringify(importData.data));
    
    // Update metadata
    const metadata = {
      lastProject: projectName,
      lastSaved: Date.now(),
      version: CURRENT_VERSION
    };
    localStorage.setItem(METADATA_KEY, JSON.stringify(metadata));
    
    return true;
  } catch (error) {
    console.error('Failed to import data:', error);
    return false;
  }
}

/**
 * Get list of all saved projects
 * @returns {Array<string>} Array of project names
 */
export function getAllProjects() {
  try {
    const projects = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`${STORAGE_PREFIX}project:`)) {
        const projectName = key.replace(`${STORAGE_PREFIX}project:`, '');
        projects.push(projectName);
      }
    }
    return projects;
  } catch (error) {
    console.error('Failed to get projects:', error);
    return [];
  }
}

/**
 * Get last active project
 * @returns {string|null} Last project name or null
 */
export function getLastProject() {
  try {
    const metadata = localStorage.getItem(METADATA_KEY);
    if (!metadata) return null;
    
    const parsed = JSON.parse(metadata);
    return parsed.lastProject || null;
  } catch (error) {
    console.error('Failed to get last project:', error);
    return null;
  }
}

/**
 * Migrate data from old version to current version
 * @param {Object} data - Data to migrate
 * @returns {Object} Migrated data
 */
function migrateData(data) {
  // Future migration logic will go here
  // For now, just return the data as-is
  return data;
}

/**
 * Check if localStorage is available
 * @returns {boolean} Availability status
 */
export function isStorageAvailable() {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (error) {
    return false;
  }
}
