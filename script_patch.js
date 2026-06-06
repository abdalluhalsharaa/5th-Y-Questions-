
/* PATCH V2: theme doctor + pure white default + green correct-answer box + completion/order controls + robust stats + no option shuffle + repo fallback */
(function(){
  'use strict';

  const GROUP_PREFS_KEY = 'medical-app-group-prefs-v1';
  if(!state.groupPreferences) state.groupPreferences = {};
  try{ state.groupPreferences = JSON.parse(localStorage.getItem(GROUP_PREFS_KEY) || '{}') || {}; }catch(e){ state.groupPreferences = {}; }

  function saveGroupPreferences(){
    try{ localStorage.setItem(GROUP_PREFS_KEY, JSON.stringify(state.groupPreferences || {})); }catch(e){}
  }
  function getGroupOrderKey(meta, subjectName){
    const section = (meta && meta.sectionType) || 'custom';
    return `${subjectName || 'unknown'}::${section}`;
  }
  function ensureGroupOrder(meta, groups){
    if(!groups || !groups.length) return groups || [];
    const subjectName = groups[0]?.subjectName || state.currentSubject?.name || 'unknown';
    const key = getGroupOrderKey(meta, subjectName);
    const store = state.groupPreferences[key] || [];
    const ids = groups.map(g => g.id);
    const clean = store.filter(id => ids.includes(id));
    ids.forEach(id => { if(!clean.includes(id)) clean.push(id); });
    state.groupPreferences[key] = clean;
    saveGroupPreferences();
    const rank = new Map(clean.map((id,i)=>[id,i]));
    return groups.slice().sort((a,b)=>(rank.get(a.id)??1e9)-(rank.get(b.id)??1e9));
  }
  function moveGroupToBottom(groupId){
    const groups = state.currentGroups || [];
    if(!groups.length) return;
    const subjectName = groups[0]?.subjectName || state.currentSubject?.name || 'unknown';
    const key = getGroupOrderKey(state.currentSelectionMeta, subjectName);
    const order = (state.groupPreferences[key] || groups.map(g=>g.id)).filter(Boolean);
    const next = order.filter(id => id !== groupId);
    next.push(groupId);
    state.groupPreferences[key] = next;
    saveGroupPreferences();
  }
  function reorderGroupIds(draggedId, targetId){
    const groups = state.currentGroups || [];
    if(!groups.length || draggedId===targetId) return;
    const subjectName = groups[0]?.subjectName || state.currentSubject?.name || 'unknown';
    const key = getGroupOrderKey(state.currentSelectionMeta, subjectName);
    const order = ensureGroupOrder(state.currentSelectionMeta, groups).map(g=>g.id);
    const filtered = order.filter(id => id !== draggedId);
    const targetIndex = filtered.indexOf(targetId);
    if(targetIndex < 0) filtered.push(draggedId);
    else filtered.splice(targetIndex, 0, draggedId);
    state.groupPreferences[key] = filtered;
    saveGroupPreferences();
  }

  function injectThemeOptions(){
    const selectors = [el('theme-selector'), el('exam-theme-selector')].filter(Boolean);
    selectors.forEach(sel => {
      if(sel && !sel.querySelector('option[value="doctor"]')){
        const opt = document.createElement('option');
        opt.value = 'doctor';
        opt.textContent = 'الطبيب';
        const desert = sel.querySelector('option[value="desert"]');
        if(desert) sel.insertBefore(opt, desert);
        else sel.appendChild(opt);
      }
    });
  }

  THEMES.doctor = {
    icons:{exams:'🩺',wrong:'💉',favorites:'🫀',checklist:'☑️',search:'🔎',statistics:'🧾',settings:'⚕️',lectures:'🧠',ai:'🧬',years:'📅',start:'🏥',results:'🏅',progress:'📈',location:'📍',success:'✅',error:'💉',review:'📝',subject:'🩻'},
    texts:{startExam:'🏥 Start Round',resultsTitle:'Clinical Report',statsTitle:'🧾 إحصائيات الطبيب',settingsTitle:'⚕️ إعدادات الطبيب',examSettingsTitle:'⚕️ Clinical Settings',examSettingsButton:'⚕️ Exam Settings',trainingLabel:'Clinical Training',examLabel:'Clinical Exam'}
  };

  const originalApplyThemeUI = typeof applyThemeUI === 'function' ? applyThemeUI : null;
  applyThemeUI = function(){
    if(originalApplyThemeUI) originalApplyThemeUI();
    injectThemeOptions();
  };

  // Pure white default + doctor theme + answer summary colors + exam LTR tweaks + selection buttons
  const extraStyle = document.createElement('style');
  extraStyle.id = 'patch-v2-style';
  extraStyle.textContent = `
  [data-theme="default"]{--bg:#ffffff;--bg-card:#ffffff;--text:#132238;--text-light:#4f6179;--text-muted:#8da0b8;--border:#e7eef7;--border-light:#f5f8fc;--shadow:0 8px 24px rgba(37,99,235,.06),0 2px 10px rgba(15,23,42,.03);--shadow-lg:0 20px 45px rgba(37,99,235,.09),0 6px 18px rgba(15,23,42,.05);--card-gradient:linear-gradient(180deg,#ffffff,#ffffff);--button-gradient:linear-gradient(135deg,#2563eb,#38bdf8);--toast-bg:linear-gradient(135deg,rgba(37,99,235,.95),rgba(56,189,248,.92));--toast-border:rgba(255,255,255,.26)}
  [data-theme="doctor"]{--primary:#3b82f6;--primary-light:#7dd3fc;--primary-soft:rgba(59,130,246,.10);--success:#0f766e;--success-soft:rgba(15,118,110,.10);--danger:#dc2626;--danger-soft:rgba(220,38,38,.10);--bg:linear-gradient(180deg,#f8fdff 0%,#eef8ff 100%);--bg-card:#ffffff;--text:#14324a;--text-light:#56728a;--text-muted:#7e9ab1;--border:#d8edf9;--border-light:#eff8fd;--shadow:0 8px 24px rgba(14,116,144,.08),0 2px 10px rgba(15,23,42,.03);--shadow-lg:0 20px 45px rgba(14,116,144,.10),0 6px 18px rgba(15,23,42,.05);--card-gradient:linear-gradient(180deg,rgba(255,255,255,.98),rgba(244,251,255,.98));--button-gradient:linear-gradient(135deg,#3b82f6,#7dd3fc);--toast-bg:linear-gradient(135deg,rgba(37,99,235,.95),rgba(14,165,233,.92));--toast-border:rgba(255,255,255,.22)}
  .answer-summary{background:color-mix(in srgb,var(--answer-box-bg,#ecfdf5) 100%, transparent 0%);border:1px solid var(--answer-box-border,#86efac);color:var(--answer-box-text,#166534)}
  [data-theme="default"],[data-theme="doctor"],[data-theme="desert"]{--answer-box-bg:rgba(22,101,52,.08);--answer-box-border:rgba(22,101,52,.28);--answer-box-text:#166534}
  [data-theme="pirates"]{--answer-box-bg:rgba(22,101,52,.09);--answer-box-border:rgba(22,101,52,.28);--answer-box-text:#166534}
  [data-theme="space"],[data-theme="castle"],[data-theme="lab"]{--answer-box-bg:rgba(187,247,208,.10);--answer-box-border:rgba(187,247,208,.26);--answer-box-text:#dcfce7}
  .selection-item-group-actions{display:flex;align-items:center;gap:8px;margin-inline-start:auto}
  .selection-complete-btn{border:1px solid var(--border);background:color-mix(in srgb,var(--bg-card) 94%,transparent 6%);color:var(--success);border-radius:10px;padding:8px 10px;cursor:pointer;font-weight:900;min-width:42px}
  .selection-complete-btn.done{background:var(--success-soft);border-color:var(--success)}
  .selection-drag-handle{cursor:grab;user-select:none;padding:8px 10px;border-radius:10px;border:1px dashed var(--border);color:var(--text-light)}
  .selection-item.dragging{opacity:.55}.selection-item.drag-over{border-color:var(--primary);background:var(--primary-soft)}
  #question-container.exam-content-ltr,#question-container.exam-content-ltr .question-text,#question-container.exam-content-ltr .options-list,#question-container.exam-content-ltr .option-btn,#question-container.exam-content-ltr .answer-summary,#question-container.exam-content-ltr .explanation-box,#readonly-content.readonly-ltr,#readonly-content.readonly-ltr .question-text,#readonly-content.readonly-ltr .options-list,#readonly-content.readonly-ltr .option-btn,#results-review .review-question-card,#results-review .review-question-card .question-text,#results-review .review-question-card .options-list,#results-review .review-question-card .option-btn{direction:ltr;text-align:left;unicode-bidi:plaintext}
  #question-container.exam-content-ltr .question-header,#readonly-content.readonly-ltr .question-header{direction:ltr}
  .option-label{color:inherit!important}
  `;
  document.head.appendChild(extraStyle);

  // Preserve no option shuffling
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

  const originalRenderExam = typeof renderExam === 'function' ? renderExam : null;
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
    el('question-container').innerHTML=`<div class="question-header"><span class="question-number">Q${escapeHtml(q.number||String(idx+1))}</span><div class="question-actions"><button class="icon-btn ${fav?'active':''}" onclick="toggleFavorite('${q.id}')">💚</button><button class="icon-btn" onclick="toggleQuestionLocation()">${t.icons.location}</button></div></div><p class="question-text">${escapeHtml(q.text)}</p><div class="options-list">${q.options.map((opt,i)=>renderOptionButton(cleanOptionDisplay(opt),i,idx,showAnswerState,state.currentExam.answers[idx],correctIdx)).join('')}</div>${answerSummaryHtml}<div class="explanation-box ${showAnswerState?'visible':''}"><strong>Explanation:</strong> ${escapeHtml(q.explanation||'No explanation available.')}</div>${renderRemoveWrongBtn()}`;
    el('question-container').classList.add('exam-content-ltr');
    renderExamNav();
  };

  const originalOpenReadonly = typeof openReadonly === 'function' ? openReadonly : null;
  openReadonly = function(questionId){
    const q=state.allQuestions.find(item=>item.id===questionId); if(!q) return; const t=theme(); const correctIdx=getCorrectIndex(q); showScreen('readonly-screen');
    const answerText = getFormattedCurrentCorrectAnswer(q);
    el('readonly-content').innerHTML=`<div class="question-header"><span class="question-number">Question ${escapeHtml(q.number||'?')}</span><div class="question-actions"><button class="icon-btn ${state.favorites.includes(q.id)?'active':''}" onclick="toggleFavorite('${q.id}'); openReadonly('${q.id}')">💚</button><button class="icon-btn" onclick="showLocation('${escapeJsString(q.subjectName)}','${escapeJsString(q.lectureName)}','${escapeJsString(q.batchName||'')}','${escapeJsString(q.pageNumber||'')}')">${t.icons.location}</button></div></div><p class="question-text">${escapeHtml(q.text)}</p><div class="options-list">${q.options.map((opt,i)=>'<div class="option-btn '+(i===correctIdx?'correct':'')+'" style="cursor:default;"><span class="option-label">'+LETTERS[i]+')</span>'+escapeHtml(cleanOptionDisplay(opt))+'</div>').join('')}</div><div class="answer-summary"><strong>Correct Answer:</strong> <span class="answer-value">${escapeHtml(answerText)}</span></div><div class="explanation-box visible"><strong>Explanation:</strong> ${escapeHtml(q.explanation||'No explanation available.')}</div>`;
    el('readonly-content').classList.add('readonly-ltr');
  };

  const originalReviewExam = typeof reviewExam === 'function' ? reviewExam : null;
  reviewExam = function(){
    if(!state.currentExam) return; const reviewDiv=el('results-review'); reviewDiv.classList.remove('hidden');
    let html='<h3 class="mt-20" style="text-align:right">'+theme().icons.review+' Review</h3>';
    state.currentExam.questions.forEach((q,idx)=>{
      const answersUsed = state.currentExam.mode==='exam' ? state.currentExam.answers : state.currentExam.firstAnswers;
      const userAnswer=answersUsed[idx]; const correctIdx=getCorrectIndex(q); const ok=userAnswer===correctIdx;
      html += `<div class="question-container review-question-card mt-10" style="border-inline-start:4px solid ${ok?'var(--success)':'var(--danger)'};"><div class="question-header"><span class="question-number">Q${escapeHtml(q.number||String(idx+1))}</span><span style="color:${ok?'var(--success)':'var(--danger)'};font-weight:900;">${ok?theme().icons.success+' Correct':theme().icons.error+' Wrong'}</span></div><p class="question-text">${escapeHtml(q.text)}</p><div class="options-list">${q.options.map((opt,i)=>{ let cls='option-btn'; if(i===correctIdx) cls+=' correct'; if(i===userAnswer && i!==correctIdx) cls+=' wrong'; return '<div class="'+cls+'" style="cursor:default;"><span class="option-label">'+LETTERS[i]+')</span>'+escapeHtml(cleanOptionDisplay(opt))+'</div>'; }).join('')}</div><div class="answer-summary"><strong>Correct Answer:</strong> <span class="answer-value">${escapeHtml(getFormattedCurrentCorrectAnswer(q))}</span></div><div class="explanation-box visible"><strong>Explanation:</strong> ${escapeHtml(q.explanation||'No explanation available.')}</div></div>`;
    });
    reviewDiv.innerHTML=html;
  };

  // group completion + ordering + render enhancements
  function markGroupCompleted(idx, moveBottom){
    const group = state.currentGroups[idx];
    if(!group) return;
    state.checklistCompleted[group.id] = true;
    saveChecklistStore();
    if(moveBottom) moveGroupToBottom(group.id);
    if(typeof renderChecklist === 'function') renderChecklist();
    if(typeof renderChecklistSubject === 'function' && el('checklist-subject-screen')?.classList.contains('active')) renderChecklistSubject();
    if(typeof renderSelectionScreenWithEnhancements === 'function') renderSelectionScreenWithEnhancements();
    showToast(moveBottom ? 'تم التعليم على العنصر ونقله للأسفل.' : 'تم التعليم على العنصر كمكتمل.', 'success');
  }
  window.confirmCompleteGroup = function(idx){
    const group = state.currentGroups[idx];
    if(!group) return;
    showDialog({
      title:'تأكيد الإنجاز',
      message:`<div style="margin-bottom:12px;">هل أتممت <strong>${escapeHtml(group.name)}</strong> بالفعل؟</div><div class="dialog-actions" style="justify-content:flex-start;margin-top:14px;"><button class="btn-secondary" onclick="hideDialog()">لا</button><button class="btn-secondary" onclick="hideDialog(); markGroupCompleted(${idx}, false)">نعم وتركها بمكانها</button><button class="btn-primary" onclick="hideDialog(); markGroupCompleted(${idx}, true)">نعم ونقلها للأسفل</button></div>`,
      confirmText:'إغلاق', showCancel:false
    });
  };
  window.markGroupCompleted = markGroupCompleted;

  function buildEnhancedSelectionList(){
    const list=el('selection-list'); if(!list) return;
    const groups = ensureGroupOrder(state.currentSelectionMeta, state.currentGroups || []);
    state.currentGroups = groups.slice();
    const t=theme();
    list.innerHTML='';
    groups.forEach((group,idx)=>{
      const icon=group.type==='ai'?t.icons.ai:(group.type==='year'?t.icons.years:t.icons.lectures);
      const item=document.createElement('div');
      item.className='selection-item';
      item.draggable=true;
      item.dataset.groupId=group.id;
      item.setAttribute('data-group-name',(group.name+' '+(group.subjectName||'')).toLowerCase());
      const checked = state.selectedGroups.includes(idx) ? 'checked' : '';
      const completed = !!state.checklistCompleted[group.id];
      item.innerHTML=`<input type="checkbox" id="group-${idx}" ${checked} onchange="toggleGroupSelection(${idx})"><label for="group-${idx}" style="width:100%; cursor:pointer;"><strong>${icon} ${escapeHtml(group.name)}</strong><br><small style="color:var(--text-muted)">${group.questions.length} questions</small></label><div class="selection-item-group-actions"><button class="selection-complete-btn ${completed?'done':''}" title="تعليم كمكتمل" onclick="event.stopPropagation(); confirmCompleteGroup(${idx})">✅</button><span class="selection-drag-handle" title="اسحب لإعادة الترتيب">↕️</span></div>`;
      item.addEventListener('click',function(event){ if(event.target.closest('input')||event.target.closest('label')||event.target.closest('.selection-complete-btn')) return; const cb=item.querySelector('input'); cb.checked=!cb.checked; toggleGroupSelection(idx); });
      item.addEventListener('dragstart', e => { item.classList.add('dragging'); e.dataTransfer.setData('text/plain', group.id); });
      item.addEventListener('dragend', () => { item.classList.remove('dragging'); document.querySelectorAll('#selection-list .selection-item').forEach(x=>x.classList.remove('drag-over')); });
      item.addEventListener('dragover', e => { e.preventDefault(); item.classList.add('drag-over'); });
      item.addEventListener('dragleave', () => item.classList.remove('drag-over'));
      item.addEventListener('drop', e => { e.preventDefault(); item.classList.remove('drag-over'); const draggedId = e.dataTransfer.getData('text/plain'); reorderGroupIds(draggedId, group.id); renderSelectionScreenWithEnhancements(); });
      list.appendChild(item);
    });
  }
  function renderSelectionScreenWithEnhancements(){
    buildEnhancedSelectionList();
    updateSelectionFooter();
  }
  const originalShowSelectionScreen = typeof showSelectionScreen === 'function' ? showSelectionScreen : null;
  showSelectionScreen = function(groups,title,meta){
    if(originalShowSelectionScreen) originalShowSelectionScreen(ensureGroupOrder(meta, groups), title, meta);
    renderSelectionScreenWithEnhancements();
  };

  // robust stats: default all sections visible + unique IDs to avoid >100%
  getSubjectVisibilitySettings = function(subjectId){
    return Object.assign({ lectures:true, years:true, ai:true }, state.subjectStatsSettings[subjectId] || {});
  };
  function getVisibleSubjectGroups(subject){
    const settings = getSubjectVisibilitySettings(subject.id);
    const groups = [];
    if(!isSectionExcluded('lecture') && settings.lectures !== false) groups.push(...(subject.lectures||[]));
    if(!isSectionExcluded('year') && settings.years !== false) groups.push(...(subject.years||[]));
    if(!isSectionExcluded('ai') && settings.ai !== false) groups.push(...(subject.ai||[]));
    return groups;
  }
  getSubjectTotalQuestions = function(subject){
    const ids = new Set();
    getVisibleSubjectGroups(subject).forEach(g => (g.questions||[]).forEach(q => ids.add(q.id)));
    return ids.size;
  };
  getSubjectAnsweredCount = function(subject){
    const ids = new Set();
    getVisibleSubjectGroups(subject).forEach(g => (g.questions||[]).forEach(q => {
      const progressKey = getGroupProgressKey(g.type, g.subjectName, g.name);
      const entry = state.progress[progressKey];
      if(entry && entry.questionIds && entry.questionIds.includes(q.id)) ids.add(q.id);
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

  // repo fallback improvements
  discoverRepository = async function(){
    const hostname=window.location.hostname;
    const pathParts=window.location.pathname.split('/').filter(Boolean);
    if(hostname.endsWith('github.io')){
      const owner=hostname.split('.')[0];
      const repo=pathParts.length>0 ? pathParts[0] : owner+'.github.io';
      return {owner,repo,branch:null};
    }
    const params = new URLSearchParams(window.location.search);
    const owner = params.get('gh_owner');
    const repo = params.get('gh_repo');
    const branch = params.get('gh_branch');
    if(owner && repo) return {owner,repo,branch:branch || null};
    return null;
  };
  listRepoDirectory = async function(path){
    const clean=path ? encodeURIComponent(path).replace(/%2F/g,'/') : '';
    const repo = state.discoveredRepo;
    const branchCandidates = [repo.branch,'main','master','gh-pages'].filter((b,i,a)=>b && a.indexOf(b)===i);
    let lastError = null;
    for(const branch of branchCandidates){
      const url='https://api.github.com/repos/'+repo.owner+'/'+repo.repo+'/contents/'+clean+'?ref='+encodeURIComponent(branch);
      const resp=await fetch(url,{headers:{Accept:'application/vnd.github+json'}});
      if(resp.ok){
        repo.branch = branch;
        const data=await resp.json();
        return Array.isArray(data)?data:[];
      }
      lastError = new Error('Unable to read directory: '+(path||'root')+' @ '+branch);
    }
    throw lastError || new Error('Unable to read directory: '+(path||'root'));
  };
  fetchQuestionFile = async function(fileItem){
    if(fileItem.download_url){ const r=await fetch(fileItem.download_url); if(r.ok) return await r.text(); }
    const repo = state.discoveredRepo;
    const branchCandidates = [repo.branch,'main','master','gh-pages'].filter((b,i,a)=>b && a.indexOf(b)===i);
    for(const branch of branchCandidates){
      const url='https://raw.githubusercontent.com/'+repo.owner+'/'+repo.repo+'/'+branch+'/'+encodeURI(fileItem.path);
      const r=await fetch(url);
      if(r.ok){ repo.branch = branch; return await r.text(); }
    }
    throw new Error('Unable to fetch file: '+fileItem.path);
  };

  document.addEventListener('DOMContentLoaded', () => {
    injectThemeOptions();
    try{ if(typeof applySettings === 'function') applySettings(); }catch(e){}
  });
})();
