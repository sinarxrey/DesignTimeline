import { useState, useMemo, useEffect, useRef } from 'react';
import './App.css';
import 'iconify-icon';

const ROLE_PRESETS = {
  senior: 0.2, // days per page
  middle: 0.3,
  junior: 0.4,
};

function App() {
  const [items, setItems] = useState([]);
  const [projectName, setProjectName] = useState('');

  const [complexityMultipliers, setComplexityMultipliers] = useState({
    normal: 0.5,
    quite: 1,
    more: 2,
  });

  const [role, setRole] = useState('middle');
  const [pageTimeDays, setPageTimeDays] = useState(ROLE_PRESETS['middle']);
  const [hoursPerDay, setHoursPerDay] = useState(8);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [collapsedMainIds, setCollapsedMainIds] = useState({});
  const [pendingFocusId, setPendingFocusId] = useState(null);

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
  const hoursPerPage = useMemo(() => pageTimeDays * Number(hoursPerDay || 0), [pageTimeDays, hoursPerDay]);

  function toggleMainCollapse(mainId) {
    setCollapsedMainIds(prev => ({ ...prev, [mainId]: !prev[mainId] }));
  }
  function isMainCollapsed(mainId) {
    return !!collapsedMainIds[mainId];
  }

  const rowDurations = useMemo(() => {
    return items.map(i => {
      const mult = complexityMultipliers[i.complexity] ?? 1;
      const days = (Number(i.estScreens || 0) + Number(mult || 0)) * Number(pageTimeDays || 0);
      return { id: i.id, days };
    });
  }, [items, complexityMultipliers, pageTimeDays]);

  const totals = useMemo(() => {
    const totalDays = rowDurations.reduce((s, r) => s + r.days, 0);
    const totalHours = totalDays * Number(hoursPerDay || 0);
    return { totalDays, totalHours };
  }, [rowDurations, hoursPerDay]);

  // Helper: check if current pageTimeDays matches a given role preset
  function roleMatchesPreset(r) {
    const preset = ROLE_PRESETS[r];
    return Math.abs(Number(pageTimeDays) - Number(preset)) < 1e-6;
  }

  function addItem(type) {
    const id = Math.random().toString(36).slice(2) + Date.now();
    const defaultScreens = type === 'Main' ? 1 : 0; // Spec: Sub Page default 0, Main default 1
    setItems(prev => [
      ...prev,
      { id, type, name: type === 'Main' ? 'Main Page' : 'Sub Page', estScreens: defaultScreens, complexity: 'normal' },
    ]);
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
    // Shift+Delete: delete only Sub rows, then focus previous Sub (fallback previous Main)
    if (e.shiftKey && (e.key === 'Delete' || e.key === 'Backspace')) {
      if (item.type === 'Sub') {
        e.preventDefault();
        const idx = items.findIndex(i => i.id === item.id);
        let focusId = null;
        let parentMainId = null;
        // Find previous Sub above
        for (let j = idx - 1; j >= 0; j--) {
          if (items[j].type === 'Sub') {
            focusId = items[j].id;
            // Find its parent Main to ensure expanded
            for (let k = j; k >= 0; k--) {
              if (items[k].type === 'Main') { parentMainId = items[k].id; break; }
            }
            break;
          }
        }
        // Fallback to nearest previous Main
        if (!focusId) {
          for (let j = idx - 1; j >= 0; j--) {
            if (items[j].type === 'Main') { focusId = items[j].id; break; }
          }
        }
        // Ensure parent of focus Sub is expanded
        if (parentMainId) {
          setCollapsedMainIds(cm => ({ ...cm, [parentMainId]: false }));
        }
        removeItem(item.id);
        if (focusId) {
          setPendingFocusId(focusId);
        } else {
          const nextId = items[idx + 1]?.id;
          if (nextId) setPendingFocusId(nextId);
        }
      }
      return;
    }

    if (e.key === 'Enter') {
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
    setPageTimeDays(ROLE_PRESETS[newRole]);
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

    const roleLabel = role[0].toUpperCase() + role.slice(1);

    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${projectName ? `${escapeHtml(projectName)} - Design Timeline` : 'Design Timeline'}</title>
      <style>
        body { font-family: 'IBM Plex Sans', system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; color: #111; background: #fff; padding: 24px; }
        h1 { margin: 0 0 12px; font-size: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        th, td { border: 1px solid #ddd; padding: 8px; font-size: 12px; }
        th { background: #f5f5f5; text-align: left; }
        tfoot td { font-weight: 600; }
        .summary { margin-top: 16px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
        .card { border: 1px solid #ddd; border-radius: 8px; padding: 12px; background: #fff; }
        .label { color: #555; font-size: 12px; margin-bottom: 4px; }
        .value { font-size: 16px; font-weight: 700; }
        @media print { body { padding: 0; } }
      </style>
      </head><body>
        <div class="print-title">Design Timeline${projectName ? `<br>${escapeHtml(projectName)}` : ''}</div>
        <table>
          <thead>
            <tr><th>Type</th><th>Name</th><th>Est. Screen</th><th>Complexity</th><th>Est. Duration (Days)</th></tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
        <div class="summary">
          <div class="card">
            <div class="label">Est. Page Time</div>
            <div class="value">${hoursPerPage.toFixed(1)} Hour / Page</div>
          </div>
          <div class="card">
            <div class="label">Your Role</div>
            <div class="value">${escapeHtml(roleLabel)}</div>
          </div>
          <div class="card">
            <div class="label">Total hours</div>
            <div class="value">${totals.totalHours.toFixed(2)} h</div>
          </div>
          <div class="card">
            <div class="label">Total days</div>
            <div class="value">${totals.totalDays.toFixed(2)} d</div>
          </div>
        </div>
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
      <header className="page-header">
        <div className="title">
          <h1>Design Timeline</h1>
          <input
            type="text"
            placeholder="Enter project name..."
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="project-name-input"
            aria-label="Project name"
            autoFocus
            onKeyDown={handleProjectInputKeyDown}
          />
        </div>
        <div className="header-actions">
          <button 
            className="icon-button" 
            onClick={() => setSettingsOpen(true)} 
            aria-label="Settings" 
            title="Settings"
          >
            <iconify-icon icon="ri:settings-3-line" width="18" height="18"></iconify-icon>
          </button>
          <button className="icon-button" onClick={handlePrint} aria-label="Print summary" title="Print summary">
            <iconify-icon icon="ri:printer-line" width="18" height="18"></iconify-icon>
          </button>
          <button className="icon-button" onClick={handleReset} aria-label="Reset all data" title="Reset all data">
            <iconify-icon icon="ri:refresh-line" width="18" height="18"></iconify-icon>
          </button>
        </div>
      </header>

      <section className="items">
        <div className="section-titlebar">
          <h3>Screens / Pages</h3>
          <div className="section-actions">
            <button 
              onClick={() => addItem('Main')} 
              aria-label="Add Main Page" 
              title="Add Main Page"
              ref={addMainPageButtonRef}
            >+ 📄</button>
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
                    value={item.estScreens}
                    onChange={e => updateItem(item.id, { estScreens: Number(e.target.value) })}
                    onKeyDown={e => handleSelectKeyDown(e, item)}
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
                  <div className="calc-value">{(row?.days ?? 0).toFixed(1)}</div>
                </div>
                <div>
                  <div className="row-actions">
                    {item.type === 'Main' && (
                      <>
                        <button className="success" onClick={() => addChildAfter(item.id)} aria-label="Add sub page" title="Add Sub Page below">
                          <iconify-icon icon="ri:add-line" width="18" height="18"></iconify-icon>
                        </button>
                        <button
                          className="icon-button"
                          onClick={() => toggleMainCollapse(item.id)}
                          aria-label="Toggle children"
                          title={hasChildren ? (isMainCollapsed(item.id) ? 'Expand children' : 'Collapse children') : 'No children'}
                          disabled={!hasChildren}
                        >
                          <iconify-icon icon={hasChildren ? (isMainCollapsed(item.id) ? 'ri:arrow-down-s-line' : 'ri:arrow-up-s-line') : 'ri:subtract-line'} width="18" height="18"></iconify-icon>
                        </button>
                      </>
                    )}
                    <button className="danger" onClick={() => removeItem(item.id)} aria-label="Remove row" title="Remove">
                      <iconify-icon icon="ri:delete-bin-line" width="18" height="18"></iconify-icon>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="summary">
        <h3>Results</h3>
        <div className="cards">
          <div className="card">
            <div className="label">Est. Page Time</div>
            <div className="value">
              {hoursPerPage.toFixed(1)} Hour / Page
            </div>
          </div>
          <div className="card">
            <div className="label">Total hours</div>
            <div className="value">{totals.totalHours.toFixed(1)}</div>
          </div>
          <div className="card">
            <div className="label">Total days</div>
            <div className="value">{totals.totalDays.toFixed(1)}</div>
          </div>
        </div>
      </section>

      <footer>
        <small>Built to tackle those little challenges that make a big difference for your team.</small>
        <div className="trademark">Created by sinarxrey</div>
      </footer>

      {settingsOpen && (
        <div className="modal-backdrop" onClick={() => setSettingsOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <section className="settings">
              <div className="modal-titlebar">
                <h2>Settings</h2>
                <button className="icon-button" onClick={() => setSettingsOpen(false)}>Close</button>
              </div>

              <h3>Role presets</h3>
              <div className="role-grid">
                <label className={role === 'senior' && roleMatchesPreset('senior') ? 'selected' : ''} onClick={() => handleRoleChange('senior')}>
                  <input type="radio" name="role" checked={role === 'senior'} onChange={() => handleRoleChange('senior')} />
                  <span className="role-emoji" aria-hidden="true">👑</span>
                  <div className="role-text">
                    <div className="role-title">Senior</div>
                    <div className="role-subtitle">{(ROLE_PRESETS.senior * hoursPerDay).toFixed(1)} Hour/Page</div>
                  </div>
                </label>
                <label className={role === 'middle' && roleMatchesPreset('middle') ? 'selected' : ''} onClick={() => handleRoleChange('middle')}>
                  <input type="radio" name="role" checked={role === 'middle'} onChange={() => handleRoleChange('middle')} />
                  <span className="role-emoji" aria-hidden="true">🧰</span>
                  <div className="role-text">
                    <div className="role-title">Middle</div>
                    <div className="role-subtitle">{(ROLE_PRESETS.middle * hoursPerDay).toFixed(1)} Hour/Page</div>
                  </div>
                </label>
                <label className={role === 'junior' && roleMatchesPreset('junior') ? 'selected' : ''} onClick={() => handleRoleChange('junior')}>
                  <input type="radio" name="role" checked={role === 'junior'} onChange={() => handleRoleChange('junior')} />
                  <span className="role-emoji" aria-hidden="true">🎓</span>
                  <div className="role-text">
                    <div className="role-title">Junior</div>
                    <div className="role-subtitle">{(ROLE_PRESETS.junior * hoursPerDay).toFixed(1)} Hour/Page</div>
                  </div>
                </label>
              </div>

              <div className="grid" style={{ marginTop: 12 }}>
                <label>
                  Page time (days per page)
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    value={pageTimeDays}
                    onChange={e => setPageTimeDays(Number(e.target.value))}
                  />
                  <span className="hint">Derived hours per page: {hoursPerPage.toFixed(1)} h</span>
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
                </label>
              </div>

              <h3>Complexity multipliers</h3>
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
                </label>
              </div>
            </section>
          </div>
        </div>
      )}

      {resetConfirmOpen && (
        <div className="modal-backdrop" onClick={() => setResetConfirmOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <section className="settings">
              <div className="modal-titlebar">
                <h2>Confirm Reset</h2>
                <button className="icon-button" onClick={() => setResetConfirmOpen(false)}>Close</button>
              </div>
              
              <p style={{ margin: '16px 0', fontSize: '14px', lineHeight: '1.5' }}>
                Are you sure want to reset all input pages?
              </p>
              
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button onClick={() => setResetConfirmOpen(false)}>Cancel</button>
                <button className="danger" onClick={confirmReset}>Reset All</button>
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
