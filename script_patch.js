/* PATCH: stable subject colors + default-theme-only dark mode + background sound session behavior */
(function(){
  'use strict';

  const __origLoadSettings = typeof loadSettings === 'function' ? loadSettings : null;
  const __origSyncSettingsControls = typeof syncSettingsControls === 'function' ? syncSettingsControls : null;
  const __origApplyThemeUI = typeof applyThemeUI === 'function' ? applyThemeUI : null;
  const __origApplyBackgroundSound = typeof applyBackgroundSound === 'function' ? applyBackgroundSound : null;
  const __origApplyEffectAudioVolumes = typeof applyEffectAudioVolumes === 'function' ? applyEffectAudioVolumes : null;

  function updateDarkModeSettingVisibility(){
    const row = el('dark-mode-setting');
    const toggle = el('dark-mode-toggle');
    const isDefault = (state.settings.theme || 'default') === 'default';
    if(row) row.style.display = isDefault ? '' : 'none';
    if(toggle) toggle.disabled = !isDefault;
  }

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
    state.settings.bgSoundEnabled = false;
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
    if(__origApplyThemeUI) __origApplyThemeUI();
    if(__origApplyBackgroundSound) __origApplyBackgroundSound();
    if(__origApplyEffectAudioVolumes) __origApplyEffectAudioVolumes();
    updateDarkModeSettingVisibility();
  };

  changeTheme = function(name){
    state.settings.theme = THEMES[name] ? name : 'default';
    saveSettings();
    applySettings();
    if(typeof renderSubjects === 'function') renderSubjects();
    if(typeof renderChecklist === 'function') renderChecklist();
    if(state.currentSubject && el('subject-sections-screen') && el('subject-sections-screen').classList.contains('active') && typeof openSubject === 'function') openSubject(state.currentSubject.id);
    if(state.currentExam && el('exam-screen') && el('exam-screen').classList.contains('active') && typeof renderExam === 'function') renderExam();
    if(typeof updateStatisticsIfOpen === 'function') updateStatisticsIfOpen();
    if(typeof renderMemories === 'function') renderMemories();
  };

  toggleBackgroundSoundEnabled = function(){
    const src = document.activeElement && (document.activeElement.id==='exam-bg-sound-enabled-toggle' || document.activeElement.id==='bg-sound-enabled-toggle') ? document.activeElement : el('bg-sound-enabled-toggle');
    state.settings.bgSoundEnabled = !!(src && src.checked);
    saveSettings();
    applySettings();
  };

  aggregateMemorySeries = function(period, detailed, selectedSubjects){
    const entries = Object.entries(state.questionsFirstSeen || {})
      .map(([qid,info]) => ({ qid, ts:Number(info.ts||0), subjectName:info.subjectName||'غير معروف' }))
      .filter(x => x.ts > 0)
      .sort((a,b) => a.ts - b.ts);

    const now = new Date();
    let labels = [];
    let buckets = [];
    let caption = '';

    function startOfWeek(date){ const d=new Date(date); d.setHours(0,0,0,0); d.setDate(d.getDate()-d.getDay()); return d; }
    function endOfWeek(date){ const d=startOfWeek(date); d.setDate(d.getDate()+6); d.setHours(23,59,59,999); return d; }
    function startOfMonth(date){ const d=new Date(date.getFullYear(), date.getMonth(), 1); d.setHours(0,0,0,0); return d; }
    function endOfMonth(date){ const d=new Date(date.getFullYear(), date.getMonth()+1, 0); d.setHours(23,59,59,999); return d; }
    function startOfYear(date){ const d=new Date(date.getFullYear(),0,1); d.setHours(0,0,0,0); return d; }
    function endOfYear(date){ const d=new Date(date.getFullYear(),11,31); d.setHours(23,59,59,999); return d; }

    if(period === 'weekly'){
      const start = startOfWeek(now), end = endOfWeek(now);
      caption = `من ${start.toLocaleDateString('ar-EG')} إلى ${end.toLocaleDateString('ar-EG')}`;
      for(let i=0;i<7;i++){
        const d = new Date(start);
        d.setDate(start.getDate()+i);
        buckets.push(d.toISOString().slice(0,10));
        labels.push(d.toLocaleDateString('ar-EG',{weekday:'short', day:'numeric'}));
      }
    } else if(period === 'monthly'){
      const start = startOfMonth(now), end = endOfMonth(now);
      caption = `${start.toLocaleDateString('ar-EG')} — ${end.toLocaleDateString('ar-EG')}`;
      for(let i=1;i<=end.getDate();i++){
        const d = new Date(now.getFullYear(), now.getMonth(), i);
        buckets.push(d.toISOString().slice(0,10));
        labels.push(String(i));
      }
    } else {
      const start = startOfYear(now), end = endOfYear(now);
      caption = `${start.toLocaleDateString('ar-EG')} — ${end.toLocaleDateString('ar-EG')}`;
      for(let i=0;i<12;i++){
        const d = new Date(now.getFullYear(), i, 1);
        buckets.push(d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'));
        labels.push(d.toLocaleDateString('ar-EG',{month:'short'}));
      }
    }

    function getBucketKey(ts){
      const d = new Date(ts);
      if(period === 'yearly') return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');
      d.setHours(0,0,0,0);
      return d.toISOString().slice(0,10);
    }
    function inRange(ts){
      const d = new Date(ts);
      if(period==='weekly') return d>=startOfWeek(now) && d<=endOfWeek(now);
      if(period==='monthly') return d>=startOfMonth(now) && d<=endOfMonth(now);
      return d>=startOfYear(now) && d<=endOfYear(now);
    }

    const visibleEntries = entries.filter(e => inRange(e.ts));

    if(!detailed){
      const data = buckets.map(key => visibleEntries.filter(e => getBucketKey(e.ts) === key).length);
      return { labels, series:[{name:'كل المواد', data, color:'#2563eb'}], caption };
    }

    const subjects = (selectedSubjects && selectedSubjects.length)
      ? selectedSubjects.slice()
      : Array.from(new Set(visibleEntries.map(e => e.subjectName))).sort();

    const series = subjects.map(subject => ({
      name: subject,
      color: typeof getSubjectColor === 'function' ? getSubjectColor(subject) : '#2563eb',
      data: buckets.map(key => visibleEntries.filter(e => e.subjectName === subject && getBucketKey(e.ts) === key).length)
    }));

    return { labels, series, caption };
  };

  window.addEventListener('beforeunload', () => {
    try{
      const audio = el('bg-audio');
      if(audio){
        audio.pause();
        audio.currentTime = 0;
      }
    }catch(e){}
  });

  try{ if(typeof applySettings === 'function') applySettings(); }catch(e){}
})();
