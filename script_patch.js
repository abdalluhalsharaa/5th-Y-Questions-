/* PATCH: stable subject colors + default-theme-only dark mode + background sound session behavior */
(function(){
  'use strict';

  const __origSaveSettings = typeof saveSettings === 'function' ? saveSettings : null;
  const __origLoadSettings = typeof loadSettings === 'function' ? loadSettings : null;
  const __origApplySettings = typeof applySettings === 'function' ? applySettings : null;
  const __origChangeTheme = typeof changeTheme === 'function' ? changeTheme : null;
  const __origSyncSettingsControls = typeof syncSettingsControls === 'function' ? syncSettingsControls : null;
  const __origToggleBackgroundSoundEnabled = typeof toggleBackgroundSoundEnabled === 'function' ? toggleBackgroundSoundEnabled : null;

  function updateDarkModeSettingVisibility(){
    const row = el('dark-mode-setting');
    const toggle = el('dark-mode-toggle');
    const isDefault = (state.settings.theme || 'default') === 'default';
    if(row) row.style.display = isDefault ? '' : 'none';
    if(toggle) toggle.disabled = !isDefault;
  }

  // Do not persist background-sound enabled state across reload/new sessions.
  saveSettings = function(){
    const payload = Object.assign({}, state.settings, { bgSoundEnabled: false });
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(payload));
  };

  loadSettings = function(){
    if(__origLoadSettings){
      __origLoadSettings();
    } else {
      state.settings = Object.assign({}, DEFAULT_SETTINGS);
    }
    // Always off on fresh load/new session until user enables manually.
    state.settings.bgSoundEnabled = false;
    if((state.settings.theme || 'default') !== 'default'){
      // Keep the stored darkMode preference, but only apply in default theme.
    }
  };

  syncSettingsControls = function(){
    if(__origSyncSettingsControls) __origSyncSettingsControls();
    const a = el('bg-sound-enabled-toggle');
    const b = el('exam-bg-sound-enabled-toggle');
    if(a) a.checked = !!state.settings.bgSoundEnabled;
    if(b) b.checked = !!state.settings.bgSoundEnabled;
    updateDarkModeSettingVisibility();
  };

  applySettings = function(){
    state.settings = Object.assign({}, DEFAULT_SETTINGS, state.settings || {});
    const darkAllowed = (state.settings.theme || 'default') === 'default';
    document.documentElement.setAttribute('data-dark', String(darkAllowed && !!state.settings.darkMode));
    document.documentElement.setAttribute('data-theme', state.settings.theme || 'default');
    document.documentElement.setAttribute('data-animations', String(state.settings.animations !== false));
    if(typeof syncSettingsControls === 'function') syncSettingsControls();
    if(typeof applyThemeUI === 'function') applyThemeUI();
    if(typeof applyBackgroundSound === 'function') applyBackgroundSound();
    if(typeof applyEffectAudioVolumes === 'function') applyEffectAudioVolumes();
    updateDarkModeSettingVisibility();
  };

  changeTheme = function(name){
    state.settings.theme = THEMES[name] ? name : 'default';
    saveSettings();
    applySettings();
    if(typeof renderSubjects === 'function') renderSubjects();
    if(state.currentSubject && el('subject-sections-screen') && el('subject-sections-screen').classList.contains('active') && typeof openSubject === 'function') openSubject(state.currentSubject.id);
    if(state.currentExam && el('exam-screen') && el('exam-screen').classList.contains('active') && typeof renderExam === 'function') renderExam();
    if(typeof updateStatisticsIfOpen === 'function') updateStatisticsIfOpen();
    if(typeof renderMemories === 'function') renderMemories();
  };

  toggleBackgroundSoundEnabled = function(){
    const src = document.activeElement && (document.activeElement.id==='exam-bg-sound-enabled-toggle' || document.activeElement.id==='bg-sound-enabled-toggle') ? document.activeElement : el('bg-sound-enabled-toggle');
    state.settings.bgSoundEnabled = !!(src && src.checked);
    // Save other settings only; enabled state must not survive reload/new session.
    saveSettings();
    applySettings();
  };

  // Stable subject colors in memories chart regardless of selection order.
  aggregateMemorySeries = function(period, detailed, selectedSubjects){
    const entries = Object.entries(state.questionsFirstSeen || {})
      .map(([qid,info]) => ({ qid, ts:Number(info.ts||0), subjectName:info.subjectName||'غير معروف' }))
      .filter(x => x.ts > 0)
      .sort((a,b) => a.ts - b.ts);

    const now = new Date();
    let labels = [];
    let buckets = [];

    if(period === 'weekly'){
      for(let i=6;i>=0;i--){
        const d = new Date(now);
        d.setHours(0,0,0,0);
        d.setDate(now.getDate()-i);
        buckets.push(d.toISOString().slice(0,10));
        labels.push(d.toLocaleDateString('ar-EG',{weekday:'short', day:'numeric'}));
      }
    } else if(period === 'monthly'){
      for(let i=29;i>=0;i--){
        const d = new Date(now);
        d.setHours(0,0,0,0);
        d.setDate(now.getDate()-i);
        buckets.push(d.toISOString().slice(0,10));
        labels.push(d.toLocaleDateString('ar-EG',{month:'numeric', day:'numeric'}));
      }
    } else {
      for(let i=11;i>=0;i--){
        const d = new Date(now.getFullYear(), now.getMonth()-i, 1);
        buckets.push(d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'));
        labels.push(d.toLocaleDateString('ar-EG',{month:'short', year:'2-digit'}));
      }
    }

    function getBucketKey(ts){
      const d = new Date(ts);
      if(period === 'yearly') return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');
      d.setHours(0,0,0,0);
      return d.toISOString().slice(0,10);
    }

    if(!detailed){
      const data = buckets.map(key => entries.filter(e => getBucketKey(e.ts) === key).length);
      return { labels, series:[{name:'كل المواد', data, color:'#2563eb'}] };
    }

    const subjects = (selectedSubjects && selectedSubjects.length)
      ? selectedSubjects.slice()
      : Array.from(new Set(entries.map(e => e.subjectName))).sort();

    const series = subjects.map(subject => ({
      name: subject,
      color: typeof getSubjectColor === 'function' ? getSubjectColor(subject) : '#2563eb',
      data: buckets.map(key => entries.filter(e => e.subjectName === subject && getBucketKey(e.ts) === key).length)
    }));

    return { labels, series };
  };

  // Stop any playing background audio when leaving/reloading; next load starts disabled.
  window.addEventListener('beforeunload', () => {
    try{
      const audio = el('bg-audio');
      if(audio){
        audio.pause();
        audio.currentTime = 0;
      }
    }catch(e){}
  });

  // If patch loads after original settings were already applied, re-apply them safely.
  try{
    if(typeof applySettings === 'function') applySettings();
  }catch(e){}
})();
