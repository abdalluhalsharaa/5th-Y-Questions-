/* PATCH V4: requested 9 follow-up changes only */
(function(){
  'use strict';

  const GROUP_PREFS_KEY = 'medical-app-group-prefs-v2';

  function normalizeSectionType(sectionType){
    const s = String(sectionType || '').toLowerCase();
    if(s === 'lecture' || s === 'lectures') return 'lectures';
    if(s === 'year' || s === 'years') return 'years';
    if(s === 'ai') return 'ai';
    return s || 'custom';
  }
  function getGroupOrderKey(subjectName, sectionType){
    return `${subjectName || 'unknown'}::${normalizeSectionType(sectionType)}`;
  }
  function shouldEnhanceSelectionScreen(){
    return state.browseMode === 'all';
  }

  if(!state.groupPreferences) state.groupPreferences = {};
  try{ state.groupPreferences = JSON.parse(localStorage.getItem(GROUP_PREFS_KEY) || '{}') || {}; }catch(e){ state.groupPreferences = {}; }
  if(!state.historyDeleteState) state.historyDeleteState = { baseScope:'all', ids:[] };

  function saveGroupPreferences(){
    try{ localStorage.setItem(GROUP_PREFS_KEY, JSON.stringify(state.groupPreferences || {})); }catch(e){}
  }

  function getOriginalOrderIds(subjectName, sectionType){
    const subject = (state.subjects || []).find(s => s.name === subjectName || s.id === subjectName);
    if(!subject) return [];
    const normalized = normalizeSectionType(sectionType);
    if(normalized === 'lectures') return (subject.lectures || []).map(g => g.id);
    if(normalized === 'years') return (subject.years || []).map(g => g.id);
    if(normalized === 'ai') return (subject.ai || []).map(g => g.id);
    return [];
  }

  function ensureGroupOrder(groups, sectionType, subjectName){
    if(!Array.isArray(groups) || !groups.length) return groups || [];
    const key = getGroupOrderKey(subjectName || groups[0]?.subjectName || state.currentSubject?.name, sectionType || groups[0]?.type);
    const originalIds = getOriginalOrderIds(subjectName || groups[0]?.subjectName || state.currentSubject?.name, sectionType || groups[0]?.type);
    const fallbackIds = originalIds.length ? originalIds : groups.map(g => g.id);
    const stored = Array.isArray(state.groupPreferences[key]) ? state.groupPreferences[key].slice() : [];
    const ids = groups.map(g => g.id);
    const clean = stored.filter(id => ids.includes(id));
    fallbackIds.forEach(id => { if(ids.includes(id) && !clean.includes(id)) clean.push(id); });
    ids.forEach(id => { if(!clean.includes(id)) clean.push(id); });
    state.groupPreferences[key] = clean;
    saveGroupPreferences();
    const rank = new Map(clean.map((id,i)=>[id,i]));
    return groups.slice().sort((a,b)=>(rank.get(a.id) ?? 1e9) - (rank.get(b.id) ?? 1e9));
  }

  function moveGroupToBottomByInfo(subjectName, sectionType, groupId){
    const key = getGroupOrderKey(subjectName, sectionType);
    const arr = Array.isArray(state.groupPreferences[key]) ? state.groupPreferences[key].slice() : getOriginalOrderIds(subjectName, sectionType);
    const next = arr.filter(id => id !== groupId);
    next.push(groupId);
    state.groupPreferences[key] = next;
    saveGroupPreferences();
  }

  function reorderGroupIds(subjectName, sectionType, draggedId, targetId, afterTarget){
    const key = getGroupOrderKey(subjectName, sectionType);
    const arr = Array.isArray(state.groupPreferences[key]) ? state.groupPreferences[key].slice() : getOriginalOrderIds(subjectName, sectionType);
    const filtered = arr.filter(id => id !== draggedId);
    const targetIndex = filtered.indexOf(targetId);
    if(targetIndex < 0){
      filtered.push(draggedId);
    }else{
      filtered.splice(targetIndex + (afterTarget ? 1 : 0), 0, draggedId);
    }
    state.groupPreferences[key] = filtered;
    saveGroupPreferences();
  }

  function resetSectionToOriginalOrder(subjectName, sectionType){
    const key = getGroupOrderKey(subjectName, sectionType);
    const originalIds = getOriginalOrderIds(subjectName, sectionType);
    if(!originalIds.length) return;
    state.groupPreferences[key] = originalIds.slice();
    saveGroupPreferences();
  }

  function restoreGroupToOriginalPosition(subjectName, sectionType, groupId){
    const key = getGroupOrderKey(subjectName, sectionType);
    const originalIds = getOriginalOrderIds(subjectName, sectionType);
    if(!originalIds.length) return;
    const originalRank = new Map(originalIds.map((id, idx) => [id, idx]));
    const current = Array.isArray(state.groupPreferences[key]) ? state.groupPreferences[key].slice() : originalIds.slice();
    const filtered = current.filter(id => id !== groupId && originalRank.has(id));
    const groupRank = originalRank.get(groupId);
    if(groupRank == null) return;
    let inserted = false;
    const next = [];
    for(const id of filtered){
      if(!inserted && (originalRank.get(id) ?? 1e9) > groupRank){
        next.push(groupId);
        inserted = true;
      }
      next.push(id);
    }
    if(!inserted) next.push(groupId);
    state.groupPreferences[key] = next;
    saveGroupPreferences();
  }

  function getAllGroupsForSubject(subject){
    if(!subject) return [];
    return []
      .concat((subject.lectures || []).map(g => ({ group:g, sectionType:'lectures', type:'lecture' })))
      .concat((subject.years || []).map(g => ({ group:g, sectionType:'years', type:'year' })))
      .concat((subject.ai || []).map(g => ({ group:g, sectionType:'ai', type:'ai' })));
  }

  function findGroupById(groupId){
    for(const subject of (state.subjects || [])){
      for(const item of getAllGroupsForSubject(subject)){
        if(item.group.id === groupId) return { subject, ...item };
      }
    }
    return null;
  }

  function saveChecklistAndRefresh(){
    try{ saveChecklistStore(); }catch(e){}
    try{ saveProgressStore(); }catch(e){}
    if(typeof renderChecklist === 'function') renderChecklist();
    if(typeof renderChecklistSubject === 'function' && el('checklist-subject-screen') && el('checklist-subject-screen').classList.contains('active')) renderChecklistSubject();
    if(typeof updateStatisticsIfOpen === 'function') updateStatisticsIfOpen();
    if(typeof renderMemories === 'function') renderMemories();
    if(shouldEnhanceSelectionScreen() && el('selection-screen') && el('selection-screen').classList.contains('active')){
      try{ renderSelectionScreenWithEnhancements(); }catch(e){}
    }
  }

  function addProgressIdsForQuestion(q){
    if(!q) return;
    addProgressId('subject:'+q.subjectName, q.id);
    const actual = q.originalSourceType || q.sourceType;
    if(actual === 'lecture' && q.lectureName) addProgressId('lecture:'+q.subjectName+'/'+q.lectureName, q.id);
    if(actual === 'ai' && q.lectureName) addProgressId('ai:'+q.subjectName+'/'+q.lectureName, q.id);
    if(q.batchName) addProgressId('year:'+q.subjectName+'/'+q.batchName, q.id);
  }

  function removeProgressIdsFromKey(key, ids){
    if(!state.progress[key]) return;
    const set = new Set(ids);
    const entry = state.progress[key] || { questionIds: [] };
    entry.questionIds = (entry.questionIds || []).filter(id => !set.has(id));
    if(!entry.questionIds.length) delete state.progress[key];
    else state.progress[key] = entry;
  }

  function removeProgressIdsForQuestion(q){
    if(!q) return;
    const ids = [q.id];
    removeProgressIdsFromKey('subject:'+q.subjectName, ids);
    const actual = q.originalSourceType || q.sourceType;
    if(actual === 'lecture' && q.lectureName) removeProgressIdsFromKey('lecture:'+q.subjectName+'/'+q.lectureName, ids);
    if(actual === 'ai' && q.lectureName) removeProgressIdsFromKey('ai:'+q.subjectName+'/'+q.lectureName, ids);
    if(q.batchName) removeProgressIdsFromKey('year:'+q.subjectName+'/'+q.batchName, ids);
  }

  function setGroupCompleted(groupId, completed, opts){
    const options = Object.assign({ moveBottom:false, countAsAnswered:false, resetProgress:false }, opts || {});
    const found = findGroupById(groupId);
    if(!found) return;
    const { subject, group, sectionType } = found;

    if(completed){
      state.checklistCompleted[group.id] = true;
      if(options.countAsAnswered){
        (group.questions || []).forEach(q => addProgressIdsForQuestion(q));
      }
      if(options.moveBottom){
        moveGroupToBottomByInfo(subject.name, sectionType, group.id);
      }
    } else {
      delete state.checklistCompleted[group.id];
      if(options.resetProgress){
        (group.questions || []).forEach(q => removeProgressIdsForQuestion(q));
      }
      restoreGroupToOriginalPosition(subject.name, sectionType, group.id);
    }

    saveChecklistAndRefresh();
  }

  function markGroupsCompletedBulk(groups){
    groups.forEach(group => {
      state.checklistCompleted[group.id] = true;
      (group.questions || []).forEach(q => addProgressIdsForQuestion(q));
    });
    saveChecklistAndRefresh();
  }

  function resetGroupsCompletionBulk(groups){
    groups.forEach(group => {
      delete state.checklistCompleted[group.id];
      (group.questions || []).forEach(q => removeProgressIdsForQuestion(q));
    });
    saveChecklistAndRefresh();
  }

  function removeDialogExtras(){
    const actions = document.querySelector('#dialog-overlay .dialog-actions');
    if(!actions) return;
    actions.querySelectorAll('.dialog-extra-btn').forEach(btn => btn.remove());
  }

  function appendMoveToBottomButton(group){
    const actions = document.querySelector('#dialog-overlay .dialog-actions');
    if(!actions) return;
    actions.querySelectorAll('.dialog-extra-btn').forEach(btn => btn.remove());

    const moveBtn = document.createElement('button');
    moveBtn.className = 'btn-primary dialog-extra-btn';
    moveBtn.textContent = 'نعم ونقلها للأسفل';
    moveBtn.onclick = function(){
      hideDialog();
      setGroupCompleted(group.id, true, { moveBottom:true, countAsAnswered:true });
      showToast('تم تعليم العنصر كمكتمل ونقله للأسفل.', 'success');
    };

    actions.appendChild(moveBtn);
  }

  window.confirmCompleteGroup = function(idx){
    const group = (state.currentGroups || [])[idx];
    if(!group) return;
    const isDone = !!state.checklistCompleted[group.id];

    removeDialogExtras();

    if(isDone){
      showDialog({
        title:'إعادة الدراسة',
        message:`<div>هل تريد إعادة دراسة <strong>${escapeHtml(group.name)}</strong>؟</div><div style="margin-top:8px;color:var(--text-light)">سيتم إزالة التحديد عنها من هنا ومن قسم Checklist، وتصفير إحصائياتها.</div>`,
        showCancel:true,
        confirmText:'نعم، أعدها للدراسة',
        cancelText:'إلغاء',
        onConfirm:()=>{
          setGroupCompleted(group.id, false, { resetProgress:true });
          showToast('تمت إزالة التحديد وإعادة تصفير إحصائيات العنصر.', 'success');
        }
      });
      return;
    }

    showDialog({
      title:'تأكيد الإنجاز',
      message:`<div style="margin-bottom:10px;">هل أتممت <strong>${escapeHtml(group.name)}</strong> بالفعل؟</div>`,
      showCancel:true,
      confirmText:'نعم',
      cancelText:'إلغاء',
      onConfirm:()=>{
        setGroupCompleted(group.id, true, { moveBottom:false, countAsAnswered:true });
        showToast('تم تعليم العنصر كمكتمل.', 'success');
      },
      onCancel:()=>{}
    });
    setTimeout(() => appendMoveToBottomButton(group), 0);
  };

  window.toggleChecklistGroupCompletion = function(groupId){
    const found = findGroupById(groupId);
    if(!found) return;
    const isDone = !!state.checklistCompleted[groupId];
    removeDialogExtras();
    if(isDone){
      showDialog({
        title:'إعادة الدراسة',
        message:`<div>هل تريد إعادة دراسة <strong>${escapeHtml(found.group.name)}</strong>؟</div><div style="margin-top:8px;color:var(--text-light)">سيتم إزالة التحديد عنها من قسم Checklist ومن قسم المواد، وتصفير إحصائياتها.</div>`,
        showCancel:true,
        confirmText:'نعم، أعدها للدراسة',
        cancelText:'إلغاء',
        onConfirm:()=>{ setGroupCompleted(groupId, false, { resetProgress:true }); showToast('تمت إزالة التحديد وتصفير إحصائيات العنصر.', 'success'); }
      });
    } else {
      setGroupCompleted(groupId, true, { moveBottom:false, countAsAnswered:true });
      showToast('تم تعليم العنصر كمكتمل.', 'success');
    }
  };

  function ensureSelectionBulkToolbar(){
    let toolbar = el('selection-bulk-toolbar');
    if(toolbar) return toolbar;
    toolbar = document.createElement('div');
    toolbar.id = 'selection-bulk-toolbar';
    toolbar.className = 'selection-bulk-toolbar hidden';
    toolbar.innerHTML = '<button class="btn-secondary" onclick="openSelectionBulkDialog()">تحديد الكل</button><button class="btn-secondary" onclick="restoreCurrentSelectionOriginalOrder()">العودة للترتيب الأصلي</button>';
    const search = el('selection-search-container');
    const screen = el('selection-screen');
    if(search && search.parentNode) search.parentNode.insertBefore(toolbar, search);
    else if(screen) screen.appendChild(toolbar);
    return toolbar;
  }

  function buildEnhancedSelectionList(){
    const list = el('selection-list');
    if(!list) return;
    const meta = state.currentSelectionMeta || {};
    const subjectName = state.currentSubject?.name || (state.currentGroups[0]?.subjectName) || 'unknown';
    const sectionType = normalizeSectionType(meta.sectionType || state.currentGroups[0]?.type);
    state.currentGroups = ensureGroupOrder(state.currentGroups || [], sectionType, subjectName);
    const t = theme();
    list.innerHTML = '';

    state.currentGroups.forEach((group, idx) => {
      const icon = group.type === 'ai' ? t.icons.ai : (group.type === 'year' ? t.icons.years : t.icons.lectures);
      const done = !!state.checklistCompleted[group.id];
      const item = document.createElement('div');
      item.className = 'selection-item selection-group-item' + (done ? ' group-completed' : '') + (state.selectedGroups.includes(idx) ? ' selected' : '');
      item.draggable = true;
      item.dataset.groupId = group.id;
      item.setAttribute('data-group-name', (group.name + ' ' + (group.subjectName||'')).toLowerCase());
      item.innerHTML = `
        <input type="checkbox" id="group-${idx}" ${state.selectedGroups.includes(idx)?'checked':''} onchange="toggleGroupSelection(${idx})">
        <label for="group-${idx}" style="width:100%; cursor:pointer;">
          <strong class="group-title ${done?'done-title':''}">${icon} ${escapeHtml(group.name)}</strong><br>
          <small class="group-sub ${done?'done-sub':''}" style="color:var(--text-muted)">${group.questions.length} questions</small>
        </label>
        <div class="selection-item-group-actions">
          <button class="selection-complete-btn ${done?'done':''}" title="تعليم كمكتمل أو إعادة الدراسة" onclick="event.stopPropagation(); confirmCompleteGroup(${idx})">${done ? '🔁' : '✅'}</button>
          <span class="selection-drag-handle" title="اسحب لإعادة الترتيب">↕️</span>
        </div>`;

      item.addEventListener('click', function(event){
        if(event.target.closest('input') || event.target.closest('label') || event.target.closest('.selection-complete-btn')) return;
        const cb = item.querySelector('input');
        cb.checked = !cb.checked;
        toggleGroupSelection(idx);
      });
      item.addEventListener('dragstart', e => { item.classList.add('dragging'); e.dataTransfer.setData('text/plain', group.id); });
      item.addEventListener('dragend', () => { item.classList.remove('dragging'); document.querySelectorAll('#selection-list .selection-group-item').forEach(x=>x.classList.remove('drag-over')); });
      item.addEventListener('dragover', e => { e.preventDefault(); item.classList.add('drag-over'); });
      item.addEventListener('dragleave', () => item.classList.remove('drag-over'));
      item.addEventListener('drop', e => {
        e.preventDefault();
        item.classList.remove('drag-over');
        const draggedId = e.dataTransfer.getData('text/plain');
        const rect = item.getBoundingClientRect();
        const afterTarget = e.clientY > (rect.top + rect.height / 2);
        reorderGroupIds(subjectName, sectionType, draggedId, group.id, afterTarget);
        renderSelectionScreenWithEnhancements();
      });
      list.appendChild(item);
    });
  }

  function renderSelectionScreenWithEnhancements(){
    const toolbar = ensureSelectionBulkToolbar();
    if(toolbar) toolbar.classList.toggle('hidden', !shouldEnhanceSelectionScreen());
    if(!shouldEnhanceSelectionScreen()) return;
    buildEnhancedSelectionList();
    updateSelectionFooter();
  }
  window.renderSelectionScreenWithEnhancements = renderSelectionScreenWithEnhancements;

  window.openSelectionBulkDialog = function(){
    if(!shouldEnhanceSelectionScreen() || !Array.isArray(state.currentGroups) || !state.currentGroups.length) return;
    removeDialogExtras();
    showDialog({
      title:'إدارة هذا القسم',
      message:'<div>يمكنك تعليم كل العناصر في هذا القسم كمكتملة أو إعادة تعيينها.</div>',
      showCancel:true,
      confirmText:'تحديد الكل كمنجز',
      cancelText:'إلغاء',
      onConfirm:()=>{
        markGroupsCompletedBulk(state.currentGroups.slice());
        showToast('تم تعليم كل عناصر هذا القسم كمكتملة.', 'success');
      },
      onCancel:()=>{}
    });
    setTimeout(()=>{
      const actions = document.querySelector('#dialog-overlay .dialog-actions');
      if(!actions) return;
      actions.querySelectorAll('.dialog-extra-btn').forEach(btn => btn.remove());
      const resetBtn = document.createElement('button');
      resetBtn.className = 'btn-secondary dialog-extra-btn';
      resetBtn.textContent = 'إعادة تعيين';
      resetBtn.onclick = function(){
        hideDialog();
        resetGroupsCompletionBulk(state.currentGroups.slice());
        showToast('تمت إعادة تعيين هذا القسم وتصفير إحصائياته.', 'success');
      };
      actions.insertBefore(resetBtn, actions.firstChild);
    }, 0);
  };

  window.restoreCurrentSelectionOriginalOrder = function(){
    if(!state.currentGroups || !state.currentGroups.length) return;
    const subjectName = state.currentSubject?.name || state.currentGroups[0]?.subjectName || 'unknown';
    const sectionType = normalizeSectionType((state.currentSelectionMeta || {}).sectionType || state.currentGroups[0]?.type);
    resetSectionToOriginalOrder(subjectName, sectionType);
    renderSelectionScreenWithEnhancements();
    showToast('تم إعادة ترتيب المحاضرات وفقًا للترتيب الأصلي.', 'success');
  };

  THEMES.doctor = {
    icons:{exams:'🩺',wrong:'💉',favorites:'🫀',checklist:'☑️',search:'🔎',statistics:'🧾',settings:'⚕️',lectures:'🧠',ai:'🧬',years:'📅',start:'🏥',results:'🏅',progress:'📈',location:'📍',success:'✅',error:'💉',review:'📝',subject:'🩻'},
    texts:{startExam:'🏥 Start Round',resultsTitle:'Clinical Report',statsTitle:'🧾 إحصائيات الطبيب',settingsTitle:'⚕️ إعدادات الطبيب',examSettingsTitle:'⚕️ Clinical Settings',examSettingsButton:'⚕️ Exam Settings',trainingLabel:'Clinical Training',examLabel:'Clinical Exam'}
  };

  THEMES.castle = {
    icons:{exams:'🪖',wrong:'💥',favorites:'🏅',checklist:'☑️',search:'🔎',statistics:'📍',settings:'⚔️',lectures:'📜',ai:'🛰️',years:'📅',start:'🪖',results:'🎖️',progress:'📈',location:'📍',success:'🎯',error:'💥',review:'📝',subject:'🪖'},
    texts:{startExam:'🪖 Start Battle',resultsTitle:'War Report',statsTitle:'📍 إحصائيات الحرب',settingsTitle:'⚔️ إعدادات الحرب',examSettingsTitle:'⚔️ War Settings',examSettingsButton:'⚔️ Exam Settings',trainingLabel:'War Training',examLabel:'Battle Mode'}
  };

  function rebuildThemeSelectors(){
    const options = [
      ['default','الافتراضي'],
      ['doctor','الطبيب'],
      ['desert','البادية'],
      ['pirates','القراصنة'],
      ['castle','الحرب'],
      ['space','الفضاء'],
      ['lab','المختبر']
    ];
    [el('theme-selector'), el('exam-theme-selector')].filter(Boolean).forEach(sel => {
      const current = sel.value || state.settings.theme || 'default';
      sel.innerHTML = options.map(([value,label]) => `<option value="${value}">${label}</option>`).join('');
      sel.value = options.some(([value]) => value === current) ? current : 'default';
    });
  }

  function updateDarkModeSettingVisibility(){
    const row = el('dark-mode-setting');
    const toggle = el('dark-mode-toggle');
    const isDefault = (state.settings.theme || 'default') === 'default';
    if(row) row.style.display = isDefault ? '' : 'none';
    if(toggle) toggle.disabled = !isDefault;
  }

  const __origLoadSettings = typeof loadSettings === 'function' ? loadSettings : null;
  const __origSyncSettingsControls = typeof syncSettingsControls === 'function' ? syncSettingsControls : null;
  const __origApplyThemeUI = typeof applyThemeUI === 'function' ? applyThemeUI : null;
  const __origApplyBackgroundSound = typeof applyBackgroundSound === 'function' ? applyBackgroundSound : null;
  const __origApplyEffectAudioVolumes = typeof applyEffectAudioVolumes === 'function' ? applyEffectAudioVolumes : null;

  saveSettings = function(){
    const payload = Object.assign({}, state.settings, { bgSoundEnabled: false });
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(payload));
  };

  loadSettings = function(){
    if(__origLoadSettings) __origLoadSettings();
    else state.settings = Object.assign({}, DEFAULT_SETTINGS);
    state.settings.bgSoundEnabled = false;
  };

  syncSettingsControls = function(){
    if(__origSyncSettingsControls) __origSyncSettingsControls();
    rebuildThemeSelectors();
    const a = el('bg-sound-enabled-toggle');
    const b = el('exam-bg-sound-enabled-toggle');
    if(a) a.checked = !!state.settings.bgSoundEnabled;
    if(b) b.checked = !!state.settings.bgSoundEnabled;
    updateDarkModeSettingVisibility();
  };

  applyThemeUI = function(){
    if(__origApplyThemeUI) __origApplyThemeUI();
    rebuildThemeSelectors();
  };

  applySettings = function(){
    state.settings = Object.assign({}, DEFAULT_SETTINGS, state.settings || {});
    const darkAllowed = (state.settings.theme || 'default') === 'default';
    document.documentElement.setAttribute('data-dark', String(darkAllowed && !!state.settings.darkMode));
    document.documentElement.setAttribute('data-theme', state.settings.theme || 'default');
    document.documentElement.setAttribute('data-animations', String(state.settings.animations !== false));
    if(typeof syncSettingsControls === 'function') syncSettingsControls();
    if(typeof applyThemeUI === 'function') applyThemeUI();
    if(__origApplyBackgroundSound) __origApplyBackgroundSound();
    if(__origApplyEffectAudioVolumes) __origApplyEffectAudioVolumes();
    updateDarkModeSettingVisibility();
    ensureGlobalHomeButtons();
  };

  changeTheme = function(name){
    state.settings.theme = THEMES[name] ? name : 'default';
    saveSettings();
    applySettings();
    if(typeof renderSubjects === 'function') renderSubjects();
    if(typeof renderChecklist === 'function') renderChecklist();
    if(typeof renderChecklistSubject === 'function' && el('checklist-subject-screen') && el('checklist-subject-screen').classList.contains('active')) renderChecklistSubject();
    if(state.currentSubject && el('subject-sections-screen') && el('subject-sections-screen').classList.contains('active') && typeof openSubject === 'function') openSubject(state.currentSubject.id);
    if(typeof renderSubjectStats === 'function' && el('subject-stats-screen') && el('subject-stats-screen').classList.contains('active')) renderSubjectStats();
    if(state.currentExam && el('exam-screen') && el('exam-screen').classList.contains('active') && typeof renderExam === 'function') renderExam();
    if(typeof updateStatisticsIfOpen === 'function') updateStatisticsIfOpen();
    if(typeof renderMemories === 'function') renderMemories();
  };

  prepareQuestionForExam = function(question){
    const clone = JSON.parse(JSON.stringify(question));
    const baseOptions = (clone.options || []).map(opt => stripOptionPrefix(opt));
    clone.originalOptions = baseOptions.slice();
    clone.options = baseOptions.slice();
    clone.correctAnswerText = getCorrectAnswerText({ ...clone, options: baseOptions, originalOptions: baseOptions.slice() });
    clone.correctAnswer = clone.correctAnswerText;
    clone.correctIndex = resolveCorrectIndex(clone.options, clone.correctAnswerText);
    return clone;
  };

  function cleanOptionDisplay(text){ return String(text||'').replace(/\u200C+/g,''); }
  function getFormattedCurrentCorrectAnswer(q){
    const idx = getCorrectIndex(q);
    if(idx < 0) return cleanOptionDisplay(getCorrectAnswerText(q) || q.correctAnswerText || q.correctAnswer || '');
    return `${LETTERS[idx]}) ${cleanOptionDisplay(q.options[idx])}`;
  }

  renderOptionButton = function(opt, i, idx, showAnswerState, selectedIndex, correctIdx){
    let cls='option-btn';
    if(selectedIndex===i) cls+=' selected';
    if(showAnswerState){ if(i===correctIdx) cls+=' correct'; else if(selectedIndex===i && i!==correctIdx) cls+=' wrong'; }
    return `<button class="${cls}" onclick="selectOption(${i})"><span class="option-label">${LETTERS[i]})</span>${escapeHtml(cleanOptionDisplay(opt))}</button>`;
  };

  renderExam = function(){
    if(!state.currentExam) return;
    const t=theme(); const questions=state.currentExam.questions; const idx=state.currentExam.currentIndex; const q=questions[idx]; if(!q) return;
    let progressText=t.icons.progress+' '+(idx+1)+'/'+questions.length;
    if(state.currentExam.mode==='training'){
      const answered=state.currentExam.firstAnswers.filter(x=>x!==null).length;
      const correct=state.currentExam.firstAnswers.filter((ans,i)=>ans!==null && isAnswerCorrect(questions[i],ans)).length;
      const pct=answered>0 ? Math.round((correct/answered)*100) : 0;
      progressText+=' · '+t.icons.success+correct+' · '+pct+'%';
    } else progressText+=' · '+(questions.length-idx)+' left';
    el('exam-progress').textContent=progressText;
    renderGrid();
    const correctIdx=getCorrectIndex(q);
    const showAnswerState=state.currentExam.mode==='training' && state.currentExam.showAnswer;
    const fav=state.favorites.includes(q.id);
    const answerSummaryHtml = showAnswerState ? `<div class="answer-summary"><strong>Correct Answer:</strong> <span class="answer-value">${escapeHtml(getFormattedCurrentCorrectAnswer(q))}</span></div>` : '';
    el('question-container').innerHTML=`<div class="question-header"><span class="question-number">Q${escapeHtml(q.number||String(idx+1))}</span><div class="question-actions"><button class="icon-btn ${fav?'active':''}" onclick="toggleFavorite('${q.id}')">💚</button><button class="icon-btn" onclick="toggleQuestionLocation()">${t.icons.location}</button></div></div><p class="question-text">${escapeHtml(q.text)}</p><div class="options-list">${q.options.map((opt,i)=>renderOptionButton(opt,i,idx,showAnswerState,state.currentExam.answers[idx],correctIdx)).join('')}</div>${answerSummaryHtml}<div class="explanation-box ${showAnswerState?'visible':''}"><strong>Explanation:</strong> ${escapeHtml(q.explanation||'No explanation available.')}</div>${renderRemoveWrongBtn()}`;
    el('question-container').classList.add('exam-content-ltr');
    renderExamNav();
  };

  openReadonly = function(questionId){
    const q=state.allQuestions.find(item=>item.id===questionId); if(!q) return; const t=theme(); const correctIdx=getCorrectIndex(q); showScreen('readonly-screen');
    el('readonly-content').innerHTML=`<div class="question-header"><span class="question-number">Question ${escapeHtml(q.number||'?')}</span><div class="question-actions"><button class="icon-btn ${state.favorites.includes(q.id)?'active':''}" onclick="toggleFavorite('${q.id}'); openReadonly('${q.id}')">💚</button><button class="icon-btn" onclick="showLocation('${escapeJsString(q.subjectName)}','${escapeJsString(q.lectureName)}','${escapeJsString(q.batchName||'')}','${escapeJsString(q.pageNumber||'')}')">${t.icons.location}</button></div></div><p class="question-text">${escapeHtml(q.text)}</p><div class="options-list">${q.options.map((opt,i)=>'<div class="option-btn '+(i===correctIdx?'correct':'')+'" style="cursor:default;"><span class="option-label">'+LETTERS[i]+')</span>'+escapeHtml(cleanOptionDisplay(opt))+'</div>').join('')}</div><div class="answer-summary"><strong>Correct Answer:</strong> <span class="answer-value">${escapeHtml(getFormattedCurrentCorrectAnswer(q))}</span></div><div class="explanation-box visible"><strong>Explanation:</strong> ${escapeHtml(q.explanation||'No explanation available.')}</div>`;
    el('readonly-content').classList.add('readonly-ltr');
  };

  reviewExam = function(){
    if(!state.currentExam) return; const reviewDiv=el('results-review'); reviewDiv.classList.remove('hidden'); let html='<h3 class="mt-20" style="text-align:right">'+theme().icons.review+' Review</h3>';
    state.currentExam.questions.forEach((q,idx)=>{ const answersUsed = state.currentExam.mode==='exam' ? state.currentExam.answers : state.currentExam.firstAnswers; const userAnswer=answersUsed[idx]; const correctIdx=getCorrectIndex(q); const ok=userAnswer===correctIdx; html += `<div class="question-container review-question-card mt-10" style="border-inline-start:4px solid ${ok?'var(--success)':'var(--danger)'};"><div class="question-header"><span class="question-number">Q${escapeHtml(q.number||String(idx+1))}</span><span style="color:${ok?'var(--success)':'var(--danger)'};font-weight:900;">${ok?theme().icons.success+' Correct':theme().icons.error+' Wrong'}</span></div><p class="question-text">${escapeHtml(q.text)}</p><div class="options-list">${q.options.map((opt,i)=>{ let cls='option-btn'; if(i===correctIdx) cls+=' correct'; if(i===userAnswer && i!==correctIdx) cls+=' wrong'; return '<div class="'+cls+'" style="cursor:default;"><span class="option-label">'+LETTERS[i]+')</span>'+escapeHtml(cleanOptionDisplay(opt))+'</div>'; }).join('')}</div><div class="answer-summary"><strong>Correct Answer:</strong> <span class="answer-value">${escapeHtml(getFormattedCurrentCorrectAnswer(q))}</span></div><div class="explanation-box visible"><strong>Explanation:</strong> ${escapeHtml(q.explanation||'No explanation available.')}</div></div>`; }); reviewDiv.innerHTML=html; };

  getSubjectVisibilitySettings = function(subjectId){
    return Object.assign({ lectures:true, years:true, ai:true }, state.subjectStatsSettings[subjectId] || {});
  };
  function getVisibleSubjectGroups(subject){
    const settings = getSubjectVisibilitySettings(subject.id);
    const lectureGroups = (!isSectionExcluded('lecture') && settings.lectures !== false) ? (subject.lectures || []) : [];
    const yearGroups = (!isSectionExcluded('lecture') && !isSectionExcluded('year') && settings.years !== false) ? (subject.years || []) : [];
    const aiGroups = (!isSectionExcluded('ai') && settings.ai !== false) ? (subject.ai || []) : [];
    return [].concat(lectureGroups, yearGroups, aiGroups);
  }
  getSubjectTotalQuestions = function(subject){
    const ids = new Set();
    getVisibleSubjectGroups(subject).forEach(g => (g.questions||[]).forEach(q => ids.add(q.id)));
    return ids.size;
  };
  getSubjectAnsweredCount = function(subject){
    const ids = new Set();
    getVisibleSubjectGroups(subject).forEach(g => (g.questions||[]).forEach(q => {
      const subjectEntry = state.progress['subject:'+q.subjectName];
      if(subjectEntry && (subjectEntry.questionIds||[]).includes(q.id)) ids.add(q.id);
    }));
    return ids.size;
  };
  getGlobalStats = function(){
    let totalQuestions = 0;
    let answeredQuestions = 0;
    const excludedSubjects = getExcludedSubjectsSet();
    for(const subject of state.subjects){
      if(excludedSubjects.has(subject.id)) continue;
      totalQuestions += getSubjectTotalQuestions(subject);
      answeredQuestions += getSubjectAnsweredCount(subject);
    }
    const percentage = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;
    return { totalQuestions, answeredQuestions, remainingQuestions: Math.max(0,totalQuestions-answeredQuestions), percentage };
  };

  renderSubjectStats = function(){
    const subject = state.currentSubject;
    if(!subject) return;
    const settings = getSubjectVisibilitySettings(subject.id);
    const t = theme();
    if(el('subject-stats-name')) el('subject-stats-name').textContent = subject.name;
    const total = getSubjectTotalQuestions(subject);
    const answered = getSubjectAnsweredCount(subject);
    const remaining = Math.max(0,total-answered);
    const pct = total > 0 ? Math.round((answered/total)*100) : 0;
    if(el('subject-stats-summary')) el('subject-stats-summary').innerHTML = `
      <div class="progress-card">
        <h4>${t.icons.subject} ${escapeHtml(subject.name)}</h4>
        <p><span>إجمالي الأسئلة</span><strong>${total}</strong></p>
        <p><span>المنجز</span><strong>${answered}</strong></p>
        <p><span>المتبقي</span><strong>${remaining}</strong></p>
        <div class="progress-bar"><span style="width:${pct}%"></span></div>
        <p><span>نسبة الإنجاز</span><strong>${pct}%</strong></p>
      </div>`;
    const sections = [];
    if((subject.lectures||[]).length && !isSectionExcluded('lecture') && settings.lectures !== false) sections.push(renderSectionAnalyticsCard(subject,'lecture','المحاضرات',t.icons.lectures,getSectionAnalytics(subject,'lecture')));
    if((subject.years||[]).length && !isSectionExcluded('lecture') && !isSectionExcluded('year') && settings.years !== false) sections.push(renderSectionAnalyticsCard(subject,'year','السنوات',t.icons.years,getSectionAnalytics(subject,'year')));
    if((subject.ai||[]).length && !isSectionExcluded('ai') && settings.ai !== false) sections.push(renderSectionAnalyticsCard(subject,'ai','الذكاء الاصطناعي',t.icons.ai,getSectionAnalytics(subject,'ai')));
    if(el('subject-stats-sections')) el('subject-stats-sections').innerHTML = sections.length ? sections.join('') : '<div class="empty-state"><p>لا توجد أقسام مرئية لهذه المادة حالياً.</p></div>';
  };

  renderChecklistSubject = function(){
    const subject = state.currentSubject;
    if(!subject) return;
    const lectureGroups = ensureGroupOrder([...(subject.lectures||[])], 'lectures', subject.name);
    const total = lectureGroups.length;
    const completed = lectureGroups.reduce((sum,g)=>sum + (!!state.checklistCompleted[g.id] ? 1 : 0), 0);
    const remaining = Math.max(0, total-completed);
    const percentage = total?Math.round((completed/total)*100):0;
    if(el('checklist-subject-summary')) el('checklist-subject-summary').innerHTML = `
      <div class="progress-card">
        <h4>☑️ ${escapeHtml(subject.name)}</h4>
        <div class="checklist-summary-grid">
          <div class="checklist-summary-card"><p><span>الإجمالي</span><strong>${total}</strong></p></div>
          <div class="checklist-summary-card"><p><span>المنجز</span><strong>${completed}</strong></p></div>
          <div class="checklist-summary-card"><p><span>المتبقي</span><strong>${remaining}</strong></p></div>
          <div class="checklist-summary-card"><p><span>النسبة المئوية</span><strong>${percentage}%</strong></p></div>
        </div>
        <div class="progress-bar" style="margin-top:12px;"><span style="width:${percentage}%"></span></div>
      </div>`;

    if(el('checklist-subject-lectures')) el('checklist-subject-lectures').innerHTML = lectureGroups.length ? lectureGroups.map(group => {
      const checked = !!state.checklistCompleted[group.id];
      return `<label class="checklist-lecture-row"><input type="checkbox" ${checked?'checked':''} onchange="toggleChecklistGroupCompletion('${group.id}')"><span class="checklist-lecture-name ${checked?'completed':''}">📚 ${escapeHtml(group.name)}</span><span class="checklist-lecture-count">${group.questions.length} سؤال</span></label>`;
    }).join('') : '<div class="empty-state"><p>لا توجد محاضرات ضمن هذه المادة.</p></div>';
  };

  const __origShowSelectionScreen = typeof showSelectionScreen === 'function' ? showSelectionScreen : null;
  showSelectionScreen = function(groups, title, meta){
    const subjectName = state.currentSubject?.name || groups?.[0]?.subjectName || 'unknown';
    const sectionType = normalizeSectionType(meta?.sectionType || groups?.[0]?.type);
    const ordered = shouldEnhanceSelectionScreen() ? ensureGroupOrder(groups || [], sectionType, subjectName) : (groups || []);
    if(__origShowSelectionScreen) __origShowSelectionScreen(ordered, title, meta);
    const toolbar = ensureSelectionBulkToolbar();
    if(toolbar) toolbar.classList.toggle('hidden', !shouldEnhanceSelectionScreen());
    if(shouldEnhanceSelectionScreen()) renderSelectionScreenWithEnhancements();
    ensureGlobalHomeButtons();
  };

  openStatsExclusionDialog = (function(original){
    return function(){
      if(original) original();
      const yearsInput = el('exclude-years');
      if(yearsInput && yearsInput.parentElement) yearsInput.parentElement.remove();
      if(!state.statsExclusions.excludedSections) state.statsExclusions.excludedSections = { lectures:false, years:false, ai:false };
      state.statsExclusions.excludedSections.years = false;
    };
  })(typeof openStatsExclusionDialog === 'function' ? openStatsExclusionDialog : null);

  applyStatsExclusions = (function(original){
    return function(){
      if(!state.statsExclusions.excludedSections) state.statsExclusions.excludedSections = { lectures:false, years:false, ai:false };
      state.statsExclusions.excludedSections.years = false;
      if(typeof original === 'function') original();
      if(state.statsExclusions.excludedSections) state.statsExclusions.excludedSections.years = false;
      persistStatsExclusions();
    };
  })(typeof applyStatsExclusions === 'function' ? applyStatsExclusions : null);

  function ensureSettingsScreen(){
    let screen = el('settings-screen');
    const panel = el('settings-panel');
    if(screen || !panel) return screen;
    screen = document.createElement('div');
    screen.id = 'settings-screen';
    screen.className = 'screen';
    screen.innerHTML = '<div class="screen-header"><button class="btn-back" onclick="closeSettingsPage()">← رجوع</button><h3>⚙️ الإعدادات</h3></div>';
    panel.parentNode.removeChild(panel);
    panel.classList.add('visible');
    screen.appendChild(panel);
    el('app').appendChild(screen);
    return screen;
  }
  window.closeSettingsPage = function(){ goHome(); };

  function getThemeHomeIcon(){
    const currentTheme = state.settings?.theme || 'default';
    const map = {
      default: '🏠',
      doctor: '🏥',
      desert: '⛺',
      pirates: '🚢',
      castle: '🏰',
      space: '🌍',
      lab: '🏪'
    };
    return map[currentTheme] || '🏠';
  }

  function getHomeButtonText(){
    return `${getThemeHomeIcon()} Home`;
  }

  function ensureGlobalHomeButtons(){
    document.querySelectorAll('.screen').forEach(screen => {
      if(!screen || screen.id === 'home-screen' || screen.id === 'settings-screen') return;

      if(screen.id === 'exam-screen'){
        const header = screen.querySelector('.exam-header');
        if(!header) return;

        let btn = header.querySelector('.btn-home-global');
        if(!btn){
          btn = document.createElement('button');
          btn.className = 'btn-secondary btn-home-global';
          btn.style.marginInlineStart = 'auto';
          const right = header.querySelector('.exam-header-right');
          if(right) header.insertBefore(btn, right);
          else header.appendChild(btn);
        }

        btn.textContent = getHomeButtonText();
        btn.onclick = goHome;
        return;
      }

      const header = screen.querySelector('.screen-header');
      if(!header) return;

      let btn = header.querySelector('.btn-home-global');
      if(!btn){
        btn = document.createElement('button');
        btn.className = 'btn-secondary btn-home-global';
        btn.style.marginInlineStart = 'auto';
        header.appendChild(btn);
      }

      btn.textContent = getHomeButtonText();
      btn.onclick = goHome;
    });
  }

  toggleSettings = function(){
    if(el('settings-screen') && el('settings-screen').classList.contains('active')){
      goHome();
      return;
    }
    ensureSettingsScreen();
    const panel = el('settings-panel');
    if(panel) panel.classList.add('visible');
    showScreen('settings-screen');
  };

  function renderHistoryDeleteScopeOptions(forceValue){
    const sel = el('history-delete-scope');
    if(!sel) return;
    const subjects = sortSubjects(state.subjects || []).map(s => s.name);
    const current = forceValue || sel.value || state.historyDeleteState.baseScope || 'all';
    sel.innerHTML = '<option value="manual" hidden>يتم التحديد يدويًّا</option><option value="all">كل السجل</option>' + subjects.map(name => `<option value="${escapeAttribute(name)}">${escapeHtml(name)}</option>`).join('');
    const valid = current === 'manual' || current === 'all' || subjects.includes(current);
    sel.value = valid ? current : 'all';
    if(sel.value !== 'manual') state.historyDeleteState.baseScope = sel.value;
  }

  getHistoryItemsForDeletion = function(){
    const scope = el('history-delete-scope')?.value || 'all';
    const actualScope = scope === 'manual' ? (state.historyDeleteState.baseScope || 'all') : scope;
    const base = state.examHistory.slice().sort((a,b)=>(b.endedAt||0)-(a.endedAt||0));
    if(actualScope === 'all') return base;
    return base.filter(item => item.subjectName === actualScope);
  };

  function updateHistoryDeleteScopeManualState(){
    const sel = el('history-delete-scope');
    if(!sel) return;
    const ids = Array.from(document.querySelectorAll('.history-delete-checkbox:checked')).map(cb => cb.value);
    const items = getHistoryItemsForDeletion();
    state.historyDeleteState.ids = ids.slice();
    if(ids.length === items.length && items.length){
      renderHistoryDeleteScopeOptions(state.historyDeleteState.baseScope || 'all');
    }else if(ids.length !== items.length){
      renderHistoryDeleteScopeOptions('manual');
    }
  }

  renderHistoryDeleteList = function(){
    const list = el('history-delete-list');
    const sel = el('history-delete-scope');
    if(!list) return;

    const selectedValue = sel ? (sel.value || state.historyDeleteState.baseScope || 'all') : (state.historyDeleteState.baseScope || 'all');
    const actualScope = selectedValue === 'manual' ? (state.historyDeleteState.baseScope || 'all') : selectedValue;
    const base = state.examHistory.slice().sort((a,b)=>(b.endedAt||0)-(a.endedAt||0));
    const items = actualScope === 'all' ? base : base.filter(item => item.subjectName === actualScope);

    list.innerHTML = items.length ? items.map(item=>`<label class="selection-item selected" style="--subject-color:${getSubjectColor(item.subjectName)}"><input type="checkbox" class="history-delete-checkbox" value="${escapeAttribute(item.id)}" checked><div><div class="history-subject" style="margin-bottom:6px;">${escapeHtml(item.subjectName || 'Unknown Subject')}</div><strong>${escapeHtml(formatHistorySubLabel(item))}</strong><br><small style="color:var(--text-light)">${formatDateTime(item.endedAt)}</small></div></label>`).join('') : '<div class="stats-empty-note">لا توجد عناصر متاحة للحذف.</div>';
    document.querySelectorAll('.history-delete-checkbox').forEach(cb => cb.addEventListener('change', updateHistoryDeleteScopeManualState));
    state.historyDeleteState.ids = items.map(item => item.id);
    state.historyDeleteState.baseScope = actualScope;
    renderHistoryDeleteScopeOptions(selectedValue === 'manual' ? 'manual' : actualScope);
  };

  selectAllHistoryDeleteItems = function(checked){
    document.querySelectorAll('.history-delete-checkbox').forEach(cb=>cb.checked=checked);
    updateHistoryDeleteScopeManualState();
  };

  toggleHistoryDeleteModal = function(show){
    const modal = el('history-delete-modal');
    if(!modal) return;
    modal.classList.toggle('hidden', !show);
    if(show){
      renderHistoryDeleteScopeOptions(state.historyDeleteState.baseScope || 'all');
      renderHistoryDeleteList();
    }
  };
  openHistoryDeleteDialog = function(){ toggleHistoryDeleteModal(true); };

  const st = document.createElement('style');
  st.id = 'medical-app-patch-v4-style';
  st.textContent = `
  [data-theme="default"]{--bg:#ffffff;--bg-card:#ffffff;--text:#132238;--text-light:#4f6179;--text-muted:#8da0b8;--border:#e7eef7;--border-light:#f5f8fc;--shadow:0 8px 24px rgba(37,99,235,.06),0 2px 10px rgba(15,23,42,.03);--shadow-lg:0 20px 45px rgba(37,99,235,.09),0 6px 18px rgba(15,23,42,.05);--card-gradient:linear-gradient(180deg,#ffffff,#ffffff);--button-gradient:linear-gradient(135deg,#2563eb,#38bdf8);--toast-bg:linear-gradient(135deg,rgba(37,99,235,.95),rgba(56,189,248,.92));--toast-border:rgba(255,255,255,.26)}
  [data-theme="doctor"]{--primary:#3b82f6;--primary-light:#7dd3fc;--primary-soft:rgba(59,130,246,.10);--success:#0f766e;--success-soft:rgba(15,118,110,.10);--danger:#dc2626;--danger-soft:rgba(220,38,38,.10);--bg:linear-gradient(180deg,#f8fdff 0%,#eef8ff 100%);--bg-card:#ffffff;--text:#14324a;--text-light:#56728a;--text-muted:#7e9ab1;--border:#d8edf9;--border-light:#eff8fd;--shadow:0 8px 24px rgba(14,116,144,.08),0 2px 10px rgba(15,23,42,.03);--shadow-lg:0 20px 45px rgba(14,116,144,.10),0 6px 18px rgba(15,23,42,.05);--card-gradient:linear-gradient(180deg,rgba(255,255,255,.98),rgba(244,251,255,.98));--button-gradient:linear-gradient(135deg,#3b82f6,#7dd3fc);--toast-bg:linear-gradient(135deg,rgba(37,99,235,.95),rgba(14,165,233,.92));--toast-border:rgba(255,255,255,.22)}
  [data-theme="castle"]{--primary:#7b8f45;--primary-light:#d3c37a;--primary-soft:rgba(123,143,69,.16);--success:#7fb069;--danger:#d97745;--bg:linear-gradient(180deg,#1f2618 0%,#2f3820 40%,#161b12 100%);--bg-card:rgba(32,40,24,.92);--text:#eef6df;--text-light:#c9d5af;--text-muted:#93a07d;--border:rgba(211,195,122,.20);--border-light:rgba(255,255,255,.06);--card-gradient:linear-gradient(180deg,rgba(45,55,33,.94),rgba(24,29,18,.94));--button-gradient:linear-gradient(135deg,#6f8441,#c7b974);--toast-bg:linear-gradient(135deg,rgba(111,132,65,.96),rgba(199,185,116,.92))}
  .answer-summary{margin-top:18px;padding:14px 16px;border-radius:12px;line-height:1.8;background:var(--success-soft);border:1px solid var(--success);color:var(--text)}
  .answer-summary strong,.answer-summary .answer-value{color:inherit}
  .explanation-box{background:linear-gradient(135deg,rgba(37,99,235,.10),rgba(56,189,248,.08));border:1px solid rgba(37,99,235,.28);color:var(--text)}
  [data-theme="desert"] .explanation-box{background:linear-gradient(135deg,rgba(59,130,246,.11),rgba(14,165,233,.08));border-color:rgba(59,130,246,.24)}
  [data-theme="pirates"] .explanation-box{background:linear-gradient(135deg,rgba(59,130,246,.11),rgba(14,165,233,.08));border-color:rgba(59,130,246,.24)}
  [data-theme="doctor"] .explanation-box{background:linear-gradient(135deg,rgba(59,130,246,.12),rgba(125,211,252,.10));border-color:rgba(59,130,246,.24)}
  [data-theme="space"] .explanation-box,[data-theme="castle"] .explanation-box,[data-theme="lab"] .explanation-box{background:linear-gradient(135deg,rgba(251,146,60,.12),rgba(245,158,11,.08));border:1px solid rgba(251,146,60,.28);color:var(--text)}
  .selection-item-group-actions{display:flex;align-items:center;gap:8px;margin-inline-start:auto}
  .selection-complete-btn{border:1px solid var(--border);background:color-mix(in srgb,var(--bg-card) 94%,transparent 6%);color:var(--success);border-radius:10px;padding:8px 10px;cursor:pointer;font-weight:900;min-width:42px}
  .selection-complete-btn.done{background:var(--success-soft);border-color:var(--success)}
  .selection-drag-handle{cursor:grab;user-select:none;padding:8px 10px;border-radius:10px;border:1px dashed var(--border);color:var(--text-light)}
  .selection-group-item.group-completed{background:color-mix(in srgb,var(--success-soft) 60%,var(--bg-card) 40%);border-color:color-mix(in srgb,var(--success) 26%,var(--border) 74%)}
  .selection-group-item .done-title,.selection-group-item .done-sub{text-decoration:line-through;opacity:.65}
  .selection-group-item.dragging{opacity:.55}.selection-group-item.drag-over{border-color:var(--primary);background:var(--primary-soft)}
  #dialog-cancel.btn-secondary{opacity:.68;background:color-mix(in srgb,var(--bg-card) 78%,transparent 22%);color:var(--text-light)}
  #question-container.exam-content-ltr,#question-container.exam-content-ltr .question-text,#question-container.exam-content-ltr .options-list,#question-container.exam-content-ltr .option-btn,#question-container.exam-content-ltr .answer-summary,#question-container.exam-content-ltr .explanation-box,#readonly-content.readonly-ltr,#readonly-content.readonly-ltr .question-text,#readonly-content.readonly-ltr .options-list,#readonly-content.readonly-ltr .option-btn,#results-review .review-question-card,#results-review .review-question-card .question-text,#results-review .review-question-card .options-list,#results-review .review-question-card .option-btn{direction:ltr;text-align:left;unicode-bidi:plaintext}
  #question-container.exam-content-ltr .question-header,#readonly-content.readonly-ltr .question-header{direction:ltr}
  .option-label{color:inherit!important}
  .selection-bulk-toolbar{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:12px}
  [data-theme="pirates"] .app-subtitle{color:#f7f0d7}
  [data-theme="pirates"] .exam-progress-badge{color:#fff7e3;background:rgba(255,255,255,.10);border:1px solid rgba(255,255,255,.18)}
  #section-exclusions-list{display:flex;flex-direction:column;gap:10px;align-items:flex-start}
  #section-exclusions-list label{display:flex;align-items:center;gap:10px;width:100%}
  @media (orientation:portrait) and (max-width:1180px){#exams-hint-bar{display:none!important}}
  `;
  document.head.appendChild(st);

  aggregateMemorySeries = function(period, detailed, selectedSubjects){
    const entries = Object.entries(state.questionsFirstSeen || {})
      .map(([qid,info]) => ({ qid, ts:Number(info.ts||0), subjectName:info.subjectName||'غير معروف' }))
      .filter(x => x.ts > 0)
      .sort((a,b) => a.ts - b.ts);
    const now = new Date();
    let labels = []; let buckets = []; let caption = '';
    function startOfWeek(date){ const d=new Date(date); d.setHours(0,0,0,0); d.setDate(d.getDate()-d.getDay()); return d; }
    function endOfWeek(date){ const d=startOfWeek(date); d.setDate(d.getDate()+6); d.setHours(23,59,59,999); return d; }
    function startOfMonth(date){ const d=new Date(date.getFullYear(), date.getMonth(), 1); d.setHours(0,0,0,0); return d; }
    function endOfMonth(date){ const d=new Date(date.getFullYear(), date.getMonth()+1, 0); d.setHours(23,59,59,999); return d; }
    function startOfYear(date){ const d=new Date(date.getFullYear(),0,1); d.setHours(0,0,0,0); return d; }
    function endOfYear(date){ const d=new Date(date.getFullYear(),11,31); d.setHours(23,59,59,999); return d; }
    if(period === 'weekly'){
      const start = startOfWeek(now), end = endOfWeek(now); caption = `من ${start.toLocaleDateString('ar-EG')} إلى ${end.toLocaleDateString('ar-EG')}`;
      for(let i=0;i<7;i++){ const d = new Date(start); d.setDate(start.getDate()+i); buckets.push(d.toISOString().slice(0,10)); labels.push(d.toLocaleDateString('ar-EG',{weekday:'short', day:'numeric'})); }
    } else if(period === 'monthly'){
      const start = startOfMonth(now), end = endOfMonth(now); caption = `${start.toLocaleDateString('ar-EG')} — ${end.toLocaleDateString('ar-EG')}`;
      for(let i=1;i<=end.getDate();i++){ const d = new Date(now.getFullYear(), now.getMonth(), i); buckets.push(d.toISOString().slice(0,10)); labels.push(String(i)); }
    } else {
      const start = startOfYear(now), end = endOfYear(now); caption = `${start.toLocaleDateString('ar-EG')} — ${end.toLocaleDateString('ar-EG')}`;
      for(let i=0;i<12;i++){ const d = new Date(now.getFullYear(), i, 1); buckets.push(d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')); labels.push(d.toLocaleDateString('ar-EG',{month:'short'})); }
    }
    function getBucketKey(ts){ const d = new Date(ts); if(period === 'yearly') return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'); d.setHours(0,0,0,0); return d.toISOString().slice(0,10); }
    function inRange(ts){ const d = new Date(ts); if(period==='weekly') return d>=startOfWeek(now) && d<=endOfWeek(now); if(period==='monthly') return d>=startOfMonth(now) && d<=endOfMonth(now); return d>=startOfYear(now) && d<=endOfYear(now); }
    const visibleEntries = entries.filter(e => inRange(e.ts));
    if(!detailed){ const data = buckets.map(key => visibleEntries.filter(e => getBucketKey(e.ts) === key).length); return { labels, series:[{name:'كل المواد', data, color:'#2563eb'}], caption }; }
    const subjects = (selectedSubjects && selectedSubjects.length) ? selectedSubjects.slice() : Array.from(new Set(visibleEntries.map(e => e.subjectName))).sort();
    const series = subjects.map(subject => ({ name: subject, color: typeof getSubjectColor === 'function' ? getSubjectColor(subject) : '#2563eb', data: buckets.map(key => visibleEntries.filter(e => e.subjectName === subject && getBucketKey(e.ts) === key).length) }));
    return { labels, series, caption };
  };

  window.addEventListener('beforeunload', () => {
    try{ const audio = el('bg-audio'); if(audio){ audio.pause(); audio.currentTime = 0; } }catch(e){}
  });

  document.addEventListener('DOMContentLoaded', function(){
    rebuildThemeSelectors();
    try{ if(typeof applySettings === 'function') applySettings(); }catch(e){}
    const yearsInput = el('exclude-years');
    if(yearsInput && yearsInput.parentElement) yearsInput.parentElement.remove();
    if(state.statsExclusions && state.statsExclusions.excludedSections) state.statsExclusions.excludedSections.years = false;
    ensureSelectionBulkToolbar();
    ensureSettingsScreen();
    ensureGlobalHomeButtons();
  });
})();
