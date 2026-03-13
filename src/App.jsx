import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { Analytics } from '@vercel/analytics/react';
import { X, Pencil, Settings, Printer, RefreshCw, Download, Upload, PlusCircle, FilePlus, Plus, ChevronDown, ChevronUp, Minus, Trash2 } from 'lucide-react';
import './App.css';
import { saveState, loadState, clearState, clearAllStorage, exportData, importData, isStorageAvailable, getLastProject } from './utils/storage';

const VISITED_APP_KEY = 'designtimeline-visited-app';

const ROLE_PRESETS = {
  senior: 1.6, // hours per page
  middle: 2.4,
  junior: 3.2,
};
const DEFAULT_COMPLEXITY_OFFSETS = {
  normal: 0.5,
  quite: 1.0,
  more: 2.0,
};

function App() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [projectName, setProjectName] = useState('');

  const [complexityMultipliers, setComplexityMultipliers] = useState(DEFAULT_COMPLEXITY_OFFSETS);

  const [role, setRole] = useState('middle');
  const [hoursPerPage, setHoursPerPage] = useState(ROLE_PRESETS['middle']);
  const [hoursPerDay, setHoursPerDay] = useState(8);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [collapsedMainIds, setCollapsedMainIds] = useState({});
  const [pendingFocusId, setPendingFocusId] = useState(null);
  
  // Onboarding state
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [onboardingExiting, setOnboardingExiting] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [tempProjectName, setTempProjectName] = useState('');
  const [tempRole, setTempRole] = useState('middle');
  const [projectNameError, setProjectNameError] = useState(false);

  // Persistence state
  const [autoSaveStatus, setAutoSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error'
  const [showImportModal, setShowImportModal] = useState(false);
  const [importError, setImportError] = useState('');

  // Load state on mount (check for existing project data)
  useEffect(() => {
    const loadPersistedState = async () => {
      // Check if localStorage is available
      if (!isStorageAvailable()) {
        console.warn('localStorage is not available, persistence disabled');
        return;
      }

      // Try to load last active project
      const lastProject = getLastProject();
      if (lastProject) {
        const savedState = loadState(lastProject);
        if (savedState) {
          // Restore all persisted state
          if (savedState.items) setItems(savedState.items);
          if (savedState.projectName) setProjectName(savedState.projectName);
          if (savedState.role) setRole(savedState.role);
          if (savedState.hoursPerPage !== undefined) setHoursPerPage(savedState.hoursPerPage);
          if (savedState.hoursPerDay !== undefined) setHoursPerDay(savedState.hoursPerDay);
          if (savedState.complexityMultipliers) {
            setComplexityMultipliers({ ...DEFAULT_COMPLEXITY_OFFSETS, ...savedState.complexityMultipliers });
          }
          if (savedState.collapsedMainIds) setCollapsedMainIds(savedState.collapsedMainIds);
          
          // Set temp values for modals
          setTempProjectName(savedState.projectName || '');
          setTempRole(savedState.role || 'middle');
          
          // Hide onboarding if we have a project name
          if (savedState.projectName) {
            setShowOnboarding(false);
          }
          
          setAutoSaveStatus('saved');
        }
      }
    };

    loadPersistedState();
  }, []);

  // Lock body scroll when any modal is open
  const isModalOpen = showEditModal || showImportModal || settingsOpen || resetConfirmOpen;
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isModalOpen]);

  // Auto-save state when items change
  useEffect(() => {
    if (!projectName || showOnboarding) return;
    
    setAutoSaveStatus('saving');
    const timeoutId = setTimeout(() => {
      const stateToSave = {
        items,
        projectName,
        role,
        hoursPerPage,
        hoursPerDay,
        complexityMultipliers,
        collapsedMainIds
      };
      
      const success = saveState(projectName, stateToSave);
      setAutoSaveStatus(success ? 'saved' : 'error');
      
      // Reset status after delay
      if (success) {
        setTimeout(() => setAutoSaveStatus('saved'), 2000);
      }
    }, 500); // Debounce saves
    
    return () => clearTimeout(timeoutId);
  }, [items, projectName, role, hoursPerPage, hoursPerDay, complexityMultipliers, collapsedMainIds, showOnboarding]);

  useEffect(() => {
    if (!pendingFocusId) return;
    const el = document.querySelector(`input[data-item-id="${pendingFocusId}"]`);
    if (el) { el.focus(); el.select?.(); }
    setPendingFocusId(null);
  }, [items, pendingFocusId]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') setSettingsOpen(false);
    }
    if (settingsOpen) {
      window.addEventListener('keydown', onKey);
    }
    return () => window.removeEventListener('keydown', onKey);
  }, [settingsOpen]);

  // Derived
  const pageTimeDays = useMemo(() => Number(hoursPerPage || 0) / Number(hoursPerDay || 8), [hoursPerPage, hoursPerDay]);

  function toggleMainCollapse(mainId) {
    setCollapsedMainIds(prev => ({ ...prev, [mainId]: !prev[mainId] }));
  }
  function isMainCollapsed(mainId) {
    return !!collapsedMainIds[mainId];
  }

  const rowDurations = useMemo(() => {
    return items.map(i => {
      // Complexity values are screen-equivalent offsets to keep zero-screen rows counted.
      const complexityOffset = complexityMultipliers[i.complexity] ?? 0;
      const estScreens = Number(i.estScreens || 0);
      const days = (estScreens + complexityOffset) * pageTimeDays;
      return { id: i.id, days };
    });
  }, [items, complexityMultipliers, pageTimeDays]);

  const totals = useMemo(() => {
    const totalDays = rowDurations.reduce((s, r) => s + r.days, 0);
    const totalHours = totalDays * Number(hoursPerDay || 0);
    return { totalDays, totalHours };
  }, [rowDurations, hoursPerDay]);

  const totalScreens = useMemo(() => {
    return items.reduce((sum, i) => sum + Number(i.estScreens || 0), 0);
  }, [items]);

  // Helper: check if current hoursPerPage matches a given role preset
  function roleMatchesPreset(r) {
    const preset = ROLE_PRESETS[r];
    return Math.abs(Number(hoursPerPage) - Number(preset)) < 1e-6;
  }

  function addItem(type) {
    const id = Math.random().toString(36).slice(2) + Date.now();
    const defaultScreens = type === 'Main' ? 1 : 0; // Spec: Sub Page default 0, Main default 1
    setItems(prev => [
      ...prev,
      { id, type, name: type === 'Main' ? 'Main Page' : 'Sub Page', estScreens: defaultScreens, complexity: 'normal' },
    ]);
    setPendingFocusId(id);
  }

  function addChildAfter(mainId) {
    const id = Math.random().toString(36).slice(2) + Date.now();
    const newItem = { id, type: 'Sub', name: 'Sub Page', estScreens: 0, complexity: 'normal' };
    setItems(prev => {
      const idx = prev.findIndex(i => i.id === mainId);
      if (idx === -1) return [...prev, newItem];
      const before = prev.slice(0, idx + 1);
      const after = prev.slice(idx + 1);
      return [...before, newItem, ...after];
    });
    setCollapsedMainIds(prev => ({ ...prev, [mainId]: false }));
    setPendingFocusId(id);
  }

  function addSubAfter(itemId) {
    const id = Math.random().toString(36).slice(2) + Date.now();
    const newItem = { id, type: 'Sub', name: 'Sub Page', estScreens: 0, complexity: 'normal' };
    setItems(prev => {
      const idx = prev.findIndex(i => i.id === itemId);
      if (idx === -1) return [...prev, newItem];
      const before = prev.slice(0, idx + 1);
      const after = prev.slice(idx + 1);
      // Find parent Main and ensure it is expanded
      let mainId = null;
      for (let j = idx; j >= 0; j--) {
        if (prev[j].type === 'Main') { mainId = prev[j].id; break; }
      }
      if (mainId) {
        setCollapsedMainIds(cm => ({ ...cm, [mainId]: false }));
      }
      return [...before, newItem, ...after];
    });
    setPendingFocusId(id);
  }

  function addMainAfter(itemId) {
    const id = Math.random().toString(36).slice(2) + Date.now();
    const newItem = { id, type: 'Main', name: 'Main Page', estScreens: 1, complexity: 'normal' };
    setItems(prev => {
      const idx = prev.findIndex(i => i.id === itemId);
      if (idx === -1) return [...prev, newItem];
      // Insert after the end of the current Sub group
      let j = idx + 1;
      while (j < prev.length && prev[j].type === 'Sub') j++;
      const before = prev.slice(0, j);
      const after = prev.slice(j);
      return [...before, newItem, ...after];
    });
    setPendingFocusId(id);
  }

  function updateItem(id, patch) {
    setItems(prev => prev.map(i => (i.id === id ? { ...i, ...patch } : i)));
  }

  function handleNameKeyDown(e, item) {
    // Shift+Delete: delete any row (Main or Sub), then focus previous item
    if (e.shiftKey && (e.key === 'Delete' || e.key === 'Backspace')) {
      e.preventDefault();
      const idx = items.findIndex(i => i.id === item.id);
      let focusId = null;
      
      // Find previous item to focus
      if (idx > 0) {
        focusId = items[idx - 1].id;
      }
      
      removeItem(item.id);
      
      // Focus the previous item if exists, otherwise next item
      if (focusId) {
        setPendingFocusId(focusId);
      } else {
        const nextId = items[idx + 1]?.id;
        if (nextId) setPendingFocusId(nextId);
      }
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        // Shift+Enter: create new Main Page (for both Main and Sub items)
        addMainAfter(item.id);
        return;
      }
      if (item.type === 'Main') {
        addChildAfter(item.id);
      } else {
        addSubAfter(item.id);
      }
    }
  }
  
  function handleSelectKeyDown(e, item) {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    if (e.shiftKey && item.type === 'Sub') {
      addMainAfter(item.id);
      return;
    }
    if (item.type === 'Main') {
      addChildAfter(item.id);
    } else {
      addSubAfter(item.id);
    }
  }
  
  function removeItem(id) {
    setItems(prev => {
      const idx = prev.findIndex(i => i.id === id);
      if (idx === -1) return prev;
      const target = prev[idx];
      // If removing a Main, also remove contiguous Sub pages that follow it
      if (target.type === 'Main') {
        let end = idx + 1;
        while (end < prev.length && prev[end].type === 'Sub') {
          end++;
        }
        return [...prev.slice(0, idx), ...prev.slice(end)];
      }
      // Otherwise, remove only the targeted row (Sub)
      return prev.filter(i => i.id !== id);
    });
    // Clean collapse state for removed Main (safe to call for any id)
    setCollapsedMainIds(state => {
      const next = { ...state };
      delete next[id];
      return next;
    });
  }

  function handleRoleChange(newRole) {
    setRole(newRole);
    setHoursPerPage(ROLE_PRESETS[newRole]);
  }

  function handlePrint() {
    const complexityLabel = (v) => (v === 'normal' ? 'Normal' : v === 'quite' ? 'Medium' : v === 'more' ? 'Hard' : v);
    const escapeHtml = (str) => String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

    const rowsHtml = items.map((i) => {
      const r = rowDurations.find((rd) => rd.id === i.id);
      const days = r?.days ?? 0;
      return `<tr>
        <td>${i.type}</td>
        <td>${escapeHtml(i.name)}</td>
        <td style="text-align:right">${Number(i.estScreens || 0)}</td>
        <td>${complexityLabel(i.complexity)}</td>
        <td style="text-align:right">${days.toFixed(2)}</td>
      </tr>`;
    }).join('');

    const projectNameHtml = projectName ? `<div class="project-name">${escapeHtml(projectName)}</div>` : '';

    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${projectName ? `${escapeHtml(projectName)} - Design Timeline` : 'Design Timeline'}</title>
      <style>
        body { font-family: 'IBM Plex Sans', system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; color: #212529; background: #fff; padding: 32px; }
        h1 { margin: 0 0 8px; font-size: 24px; font-weight: 600; color: #212529; }
        .print-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; gap: 24px; }
        .print-title-section { flex: 1; min-width: 200px; }
        .project-name { font-size: 18px; font-weight: 600; color: #212529; margin-top: 4px; }
        .print-summary-box { 
          background: #f8f9fa; 
          border: 1px solid #e9ecef; 
          border-radius: 6px; 
          padding: 12px; 
          min-width: 300px; 
          display: flex; 
          flex-wrap: wrap; 
          gap: 8px; 
          align-items: center; 
        }
        .print-summary-box .label { color: #6c757d; font-weight: 500; font-size: 14px; }
        .print-summary-box .stat { font-weight: 600; color: #212529; font-size: 14px; }
        .print-summary-box .sep { color: #adb5bd; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #e9ecef; padding: 12px; font-size: 13px; }
        th { background: #f8f9fa; text-align: left; font-weight: 600; color: #6c757d; text-transform: uppercase; letter-spacing: 0.5px; font-size: 12px; }
        tfoot td { font-weight: 600; }
        @media print { body { padding: 0; } .no-print { display: none; } }
        @media (max-width: 768px) {
          .print-header { flex-direction: column; gap: 16px; }
          .print-summary-box { min-width: auto; width: 100%; }
        }
      </style>
      </head><body>
        <div class="print-header">
          <div class="print-title-section">
            <h1>Design Timeline</h1>
            ${projectNameHtml}
          </div>
          <div class="print-summary-box">
            <span class="label">Summary</span>
            <span class="stat">${hoursPerPage.toFixed(1)} h/page</span>
            <span class="sep">•</span>
            <span class="stat">${totals.totalHours.toFixed(1)} h</span>
            <span class="sep">•</span>
            <span class="stat">${totals.totalDays.toFixed(1)} d</span>
            <span class="sep">•</span>
            <span class="stat">${totalScreens} Screens</span>
          </div>
        </div>
        <table>
          <thead>
            <tr><th>Type</th><th>Name</th><th>Est. Screen</th><th>Complexity</th><th>Est. Duration (Days)</th></tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </body></html>`;

    const w = window.open('', '_blank');
    if (w) {
      w.document.open();
      w.document.write(html);
      w.document.close();
      w.focus();
      w.print();
    }
  }

  function handleReset() {
    setResetConfirmOpen(true);
  }

  function confirmReset() {
    setItems([]);
    setProjectName('');
    setCollapsedMainIds({});
    setPendingFocusId(null);
    setResetConfirmOpen(false);
    setShowEditModal(false);
    setTempProjectName('');
    setTempRole('middle');
    setOnboardingExiting(false);
    setShowOnboarding(true);
    
    // Clear localStorage for current project
    if (projectName) {
      clearState(projectName);
    }
  }

  function handleBackToLanding() {
    try {
      localStorage.removeItem(VISITED_APP_KEY);
      clearAllStorage();
    } catch {}
    navigate('/', { replace: true });
  }

  // Onboarding handlers
  function handleStartProject() {
    if (!tempProjectName.trim()) {
      setProjectNameError(true);
      return;
    }
    setProjectNameError(false);
    setProjectName(tempProjectName);
    setRole(tempRole);
    setHoursPerPage(ROLE_PRESETS[tempRole]);
    setOnboardingExiting(true);
    setShowOnboarding(false);
  }

  function handleOnboardingAnimationEnd() {
    if (onboardingExiting) {
      setOnboardingExiting(false);
    }
  }

  function handleEditProject() {
    setTempProjectName(projectName);
    setShowEditModal(true);
  }

  function handleSaveEdit() {
    if (tempProjectName.trim()) {
      setProjectName(tempProjectName);
      setShowEditModal(false);
    }
  }

  // Import/Export handlers
  function handleExport() {
    if (!projectName) return;
    
    const url = exportData(projectName);
    if (url) {
      const a = document.createElement('a');
      a.href = url;
      a.download = `design-timeline-${projectName.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }

  function handleFileImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importDataObj = JSON.parse(event.target.result);
        const success = importData(importDataObj);
        
        if (success) {
          // Reload the imported data
          const importedProject = importDataObj.data.projectName;
          const savedState = loadState(importedProject);
          
          if (savedState) {
            if (savedState.items) setItems(savedState.items);
            if (savedState.projectName) setProjectName(savedState.projectName);
            if (savedState.role) {
              setRole(savedState.role);
              setTempRole(savedState.role);
            }
            if (savedState.hoursPerPage !== undefined) setHoursPerPage(savedState.hoursPerPage);
            if (savedState.hoursPerDay !== undefined) setHoursPerDay(savedState.hoursPerDay);
            if (savedState.complexityMultipliers) {
              setComplexityMultipliers({ ...DEFAULT_COMPLEXITY_OFFSETS, ...savedState.complexityMultipliers });
            }
            if (savedState.collapsedMainIds) setCollapsedMainIds(savedState.collapsedMainIds);
            
            setTempProjectName(savedState.projectName || '');
            setShowOnboarding(!savedState.projectName);
            setAutoSaveStatus('saved');
          }
          
          setShowImportModal(false);
          setImportError('');
        } else {
          setImportError('Failed to import data. Please check the file format.');
        }
      } catch (error) {
        setImportError('Invalid file format. Please select a valid backup file.');
      }
    };
    reader.readAsText(file);
    
    // Reset file input
    e.target.value = '';
  }

  let currentMainCollapsed = false;
  
  // Reference for the Add Main Page button
  const addMainPageButtonRef = useRef(null);

  // Handle tab key in project name input
  const handleProjectInputKeyDown = (e) => {
    if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault(); // Prevent default tab behavior
      addMainPageButtonRef.current?.focus();
    }
  };

  return (
    <div className="container">
      {/* Onboarding - Centered Page */}
      {(showOnboarding || onboardingExiting) && (
        <div
          className={`onboarding-container ${onboardingExiting ? 'onboarding-exiting' : ''}`}
          onAnimationEnd={handleOnboardingAnimationEnd}
        >
          <div className="onboarding-card">
            <div className="onboarding-header">
              <h1>Design Timeline Calculator</h1>
            </div>

            <label style={{ display: 'block', marginBottom: '20px' }}>
              <span style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Project Name</span>
              <input
                type="text"
                placeholder="Enter project name..."
                value={tempProjectName}
                onChange={(e) => {
                  setTempProjectName(e.target.value);
                  if (projectNameError) setProjectNameError(false);
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleStartProject()}
                className={projectNameError ? 'error' : ''}
                autoFocus
              />
              {projectNameError && (
                <span className="error-message">Project need to fill before start</span>
              )}
            </label>

            <div className="role-presets-header">
              <h3 style={{ margin: 0 }}>Role presets</h3>
              <p className="hint" style={{ margin: '4px 0 8px 0', fontSize: '13px', color: '#6b7280' }}>This selection and number can change later</p>
            </div>
            <div className="role-grid">
              <label className={tempRole === 'senior' ? 'selected' : ''} onClick={() => setTempRole('senior')}>
                <input type="radio" name="tempRole" checked={tempRole === 'senior'} onChange={() => setTempRole('senior')} />
                <span className="role-emoji" aria-hidden="true">👑</span>
                <div className="role-text">
                  <div className="role-title">Senior</div>
                  <div className="role-subtitle">{ROLE_PRESETS.senior.toFixed(1)} Hour/Page</div>
                </div>
              </label>
              <label className={tempRole === 'middle' ? 'selected' : ''} onClick={() => setTempRole('middle')}>
                <input type="radio" name="tempRole" checked={tempRole === 'middle'} onChange={() => setTempRole('middle')} />
                <span className="role-emoji" aria-hidden="true">🧰</span>
                <div className="role-text">
                  <div className="role-title">Middle</div>
                  <div className="role-subtitle">{ROLE_PRESETS.middle.toFixed(1)} Hour/Page</div>
                </div>
              </label>
              <label className={tempRole === 'junior' ? 'selected' : ''} onClick={() => setTempRole('junior')}>
                <input type="radio" name="tempRole" checked={tempRole === 'junior'} onChange={() => setTempRole('junior')} />
                <span className="role-emoji" aria-hidden="true">🎓</span>
                <div className="role-text">
                  <div className="role-title">Junior</div>
                  <div className="role-subtitle">{ROLE_PRESETS.junior.toFixed(1)} Hour/Page</div>
                </div>
              </label>
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button className="secondary" onClick={handleBackToLanding}>Back to Landing</button>
              <button onClick={handleStartProject}>Start</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Project Name Modal */}
      {showEditModal && createPortal(
        <div className="modal-backdrop" onClick={() => setShowEditModal(false)}>
          <div className="modal modal--compact" onClick={e => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-titlebar">
                <h2>Edit Project Name</h2>
                <button className="icon-button" onClick={() => setShowEditModal(false)} aria-label="Close"><X size={20} /></button>
              </div>

              <label style={{ display: 'block', marginBottom: '20px' }}>
                <span style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Project Name</span>
                <input
                  type="text"
                  placeholder="Enter project name..."
                  value={tempProjectName}
                  onChange={(e) => setTempProjectName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                  autoFocus
                />
              </label>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button className="danger" onClick={() => setShowEditModal(false)}>Cancel</button>
                <button onClick={handleSaveEdit}>Save</button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Import Modal */}
      {showImportModal && createPortal(
        <div className="modal-backdrop" onClick={() => setShowImportModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-titlebar">
                <h2>Import Backup</h2>
                <button className="icon-button" onClick={() => setShowImportModal(false)} aria-label="Close"><X size={20} /></button>
              </div>

              <label style={{ display: 'block', marginBottom: '20px' }}>
                <span style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Select Backup File</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileImport}
                  autoFocus
                />
                {importError && (
                  <span className="error-message" style={{ marginTop: '8px', display: 'block' }}>{importError}</span>
                )}
              </label>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button onClick={() => setShowImportModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Main Content - Only show after onboarding */}
      {!showOnboarding && (
        <div className="main-app-enter">
      <header className="page-header">
        <div className="title">
          <h1>Design Timeline</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="project-name-display">{projectName}</span>
            <button 
              className="icon-button" 
              onClick={handleEditProject}
              aria-label="Edit project name"
              title="Edit project name"
              style={{ height: '32px', width: '32px', padding: 0 }}
            >
              <Pencil size={16} />
            </button>
          </div>
        </div>
        <div className="header-actions">
          <button 
            className="icon-button" 
            onClick={() => setSettingsOpen(true)} 
            aria-label="Settings" 
            title="Settings"
          >
            <Settings size={18} />
          </button>
          <button className="icon-button" onClick={handlePrint} aria-label="Print summary" title="Print summary">
            <Printer size={18} />
          </button>
          <button className="icon-button" onClick={handleReset} aria-label="Reset all data" title="Reset all data">
            <RefreshCw size={18} />
          </button>
        </div>
      </header>

      <section className="summary summary--compact">
        <div className="summary-left">
          <span className="summary-label">Summary</span>
          <span className="summary-stat">{hoursPerPage.toFixed(1)} Hour/page</span>
          <span className="summary-sep" aria-hidden>•</span>
          <span className="summary-stat">{totals.totalHours.toFixed(1)} Hours</span>
          <span className="summary-sep" aria-hidden>•</span>
          <span className="summary-stat">{totals.totalDays.toFixed(1)} Days</span>
          <span className="summary-sep" aria-hidden>•</span>
          <span className="summary-stat">{totalScreens} Screens</span>
        </div>
        <div className="summary-actions">
          <button 
            className="icon-button icon-button--bare" 
            onClick={handleExport} 
            aria-label="Export data" 
            title="Export data as backup"
            disabled={!projectName}
          >
            <Download size={18} />
          </button>
          <button 
            className="icon-button icon-button--bare" 
            onClick={() => setShowImportModal(true)} 
            aria-label="Import data" 
            title="Import from backup"
          >
            <Upload size={18} />
          </button>
        </div>
      </section>

      <section className="items">
        <div className="section-titlebar">
          <h3>Screens / Pages</h3>
          <div className="section-actions">
            <button 
              onClick={() => addItem('Main')} 
              aria-label="Add Main Page" 
              title="Add Main Page"
              ref={addMainPageButtonRef}
            >
              <PlusCircle size={18} style={{ marginRight: '6px' }} />
              New Page
            </button>
          </div>
        </div>

        <div className="table">
          <div className="row header">
            <div>Type</div>
            <div>Name</div>
            <div>Est. Screen</div>
            <div>Complexity</div>
            <div>Est. Duration (Days)</div>
            <div></div>
          </div>
          {items.length === 0 && (
            <div className="empty-state-placeholder">
              <FilePlus size={48} className="placeholder-icon" />
              <p>Add pages to build your timeline</p>
              <span className="placeholder-hint">Click ‘New Page’ to add main or sub pages, then enter the details.</span>
            </div>
          )}
          {items.map((item, idx) => {
            if (item.type === 'Main') {
              currentMainCollapsed = isMainCollapsed(item.id);
            } else if (item.type === 'Sub' && currentMainCollapsed) {
              return null;
            }
            const hasChildren = item.type === 'Main' ? (items[idx + 1]?.type === 'Sub') : false;
            const row = rowDurations.find(r => r.id === item.id);
            return (
              <div className={`row ${item.type.toLowerCase()}`} key={item.id}>
                <div className={`badge ${item.type.toLowerCase()}`} aria-label={item.type === 'Main' ? 'Main Page' : 'Sub Page'}>{item.type === 'Main' ? '📄' : '|'}</div>
                <div className={item.type === 'Sub' ? 'name-cell sub' : 'name-cell'}>
                  <input
                    type="text"
                    value={item.name}
                    onChange={e => updateItem(item.id, { name: e.target.value })}
                    onKeyDown={e => handleNameKeyDown(e, item)}
                    data-item-id={item.id}
                  />
                </div>
                <div>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={Number(item.estScreens ?? 0) === 0 ? '' : item.estScreens}
                    placeholder="0"
                    onChange={e => updateItem(item.id, { estScreens: e.target.value === '' ? 0 : Number(e.target.value) })}
                    onKeyDown={e => handleSelectKeyDown(e, item)}
                    style={{ MozAppearance: 'textfield' }}
                  />
                </div>
                <div>
                  <select
                    value={item.complexity}
                    onChange={e => updateItem(item.id, { complexity: e.target.value })}
                    onKeyDown={e => handleSelectKeyDown(e, item)}
                  >
                    <option value="normal">Normal</option>
                    <option value="quite">Medium</option>
                    <option value="more">Hard</option>
                  </select>
                </div>
                <div>
                  <div className="calc-value">{(row?.days ?? 0).toFixed(2)}</div>
                </div>
                <div>
                  <div className="row-actions">
                    {item.type === 'Main' && (
                      <>
                        <button className="success" onClick={() => addChildAfter(item.id)} aria-label="Add sub page" title="Add Sub Page below">
                          <Plus size={18} />
                        </button>
                        <button
                          className="icon-button"
                          onClick={() => toggleMainCollapse(item.id)}
                          aria-label="Toggle children"
                          title={hasChildren ? (isMainCollapsed(item.id) ? 'Expand children' : 'Collapse children') : 'No children'}
                          disabled={!hasChildren}
                        >
                          {hasChildren ? (isMainCollapsed(item.id) ? <ChevronDown size={18} /> : <ChevronUp size={18} />) : <Minus size={18} />}
                        </button>
                      </>
                    )}
                    <button className="danger" onClick={() => removeItem(item.id)} aria-label="Remove row" title="Remove">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <footer>
        <small>Built to tackle those little challenges that make a big difference for your team.</small>
        <div className="trademark">Created by sinarxrey</div>
      </footer>

      {settingsOpen && createPortal(
        <div className="modal-backdrop" onClick={() => setSettingsOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-titlebar">
                <h2>Settings</h2>
                <button className="icon-button" onClick={() => setSettingsOpen(false)} aria-label="Close"><X size={20} /></button>
              </div>

              <div className="role-presets-header">
                <h3 style={{ margin: 0 }}>Role presets</h3>
              </div>
              <div className="role-grid">
                <label className={role === 'senior' && roleMatchesPreset('senior') ? 'selected' : ''} onClick={() => handleRoleChange('senior')}>
                  <input type="radio" name="role" checked={role === 'senior'} onChange={() => handleRoleChange('senior')} />
                  <span className="role-emoji" aria-hidden="true">👑</span>
                  <div className="role-text">
                    <div className="role-title">Senior</div>
                    <div className="role-subtitle">{ROLE_PRESETS.senior.toFixed(1)} Hour/Page</div>
                  </div>
                </label>
                <label className={role === 'middle' && roleMatchesPreset('middle') ? 'selected' : ''} onClick={() => handleRoleChange('middle')}>
                  <input type="radio" name="role" checked={role === 'middle'} onChange={() => handleRoleChange('middle')} />
                  <span className="role-emoji" aria-hidden="true">🧰</span>
                  <div className="role-text">
                    <div className="role-title">Middle</div>
                    <div className="role-subtitle">{ROLE_PRESETS.middle.toFixed(1)} Hour/Page</div>
                  </div>
                </label>
                <label className={role === 'junior' && roleMatchesPreset('junior') ? 'selected' : ''} onClick={() => handleRoleChange('junior')}>
                  <input type="radio" name="role" checked={role === 'junior'} onChange={() => handleRoleChange('junior')} />
                  <span className="role-emoji" aria-hidden="true">🎓</span>
                  <div className="role-text">
                    <div className="role-title">Junior</div>
                    <div className="role-subtitle">{ROLE_PRESETS.junior.toFixed(1)} Hour/Page</div>
                  </div>
                </label>
              </div>

              <div className="grid" style={{ marginTop: 12 }}>
                <label>
                  Hours per page
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={hoursPerPage}
                    onChange={e => setHoursPerPage(Number(e.target.value))}
                  />
                  <span className="hint" style={{ marginTop: '4px' }}>Time to design one page</span>
                </label>
                <label>
                  Hours per workday
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    value={hoursPerDay}
                    onChange={e => setHoursPerDay(Number(e.target.value))}
                  />
                  <span className="hint" style={{ marginTop: '4px' }}>Office Hour</span>
                </label>
              </div>

              <h3>Complexity base offsets</h3>
              <p className="hint" style={{ margin: '4px 0 8px 0' }}>
                Used in estimation as screen-equivalent effort: <code>(Est. Screen + Complexity) * Page Time</code>
              </p>
              <div className="grid complexities">
                <label>
                  Normal
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={complexityMultipliers.normal}
                    onChange={e => setComplexityMultipliers(m => ({ ...m, normal: Number(e.target.value) }))}
                  />
                  <span className="hint" style={{ marginTop: '4px' }}>Default: 0.5</span>
                </label>
                <label>
                  Medium
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={complexityMultipliers.quite}
                    onChange={e => setComplexityMultipliers(m => ({ ...m, quite: Number(e.target.value) }))}
                  />
                  <span className="hint" style={{ marginTop: '4px' }}>Default: 1.0</span>
                </label>
                <label>
                  Hard
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={complexityMultipliers.more}
                    onChange={e => setComplexityMultipliers(m => ({ ...m, more: Number(e.target.value) }))}
                  />
                  <span className="hint" style={{ marginTop: '4px' }}>Default: 2.0</span>
                </label>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {resetConfirmOpen && createPortal(
        <div className="modal-backdrop" onClick={() => setResetConfirmOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-titlebar">
                <h2>Confirm Reset</h2>
                <button className="icon-button" onClick={() => setResetConfirmOpen(false)} aria-label="Close"><X size={20} /></button>
              </div>
              
              <p style={{ margin: '16px 0', fontSize: '14px', lineHeight: '1.5' }}>
                Are you sure want to reset all input pages?
              </p>
              
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button onClick={() => setResetConfirmOpen(false)}>Cancel</button>
                <button className="danger" onClick={confirmReset}>Reset All</button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
        </div>
      )}
    <SpeedInsights />
    <Analytics />
    </div>
  );
}

export default App;
