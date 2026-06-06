
/* PATCH V4: answer/explanation theming + statistics exclusions cleanup + limit completion controls to Exams فقط */
(function(){
  'use strict';

  // ---------- Styles ----------
  const style = document.createElement('style');
  style.id = 'medical-app-patch-v4-style';
  style.textContent = `
  /* Correct Answer box matches correct option colors */
  .answer-summary{
    background: var(--success-soft) !important;
    border: 1px solid var(--success) !important;
    color: var(--text) !important;
    line-height: 1.8;
  }
  .answer-summary strong,
  .answer-summary .answer-value{
    color: inherit !important;
  }

  /* Explanation: blue for light themes, soft orange for dark themes */
  .explanation-box{
    background: var(--explanation-bg, rgba(37,99,235,.10)) !important;
    border: 1px solid var(--explanation-border, rgba(37,99,235,.28)) !important;
    color: var(--explanation-text, var(--text)) !important;
  }
  .explanation-box strong{
    color: inherit !important;
  }

  [data-theme="default"],
  [data-theme="doctor"],
  [data-theme="desert"],
  [data-theme="pirates"]{
    --explanation-bg: linear-gradient(180deg, rgba(37,99,235,.09), rgba(56,189,248,.08));
    --explanation-border: rgba(37,99,235,.26);
    --explanation-text: #1d4ed8;
  }

  [data-theme="space"],
  [data-theme="castle"],
  [data-theme="lab"]{
    --explanation-bg: linear-gradient(180deg, rgba(251,146,60,.11), rgba(253,186,116,.08));
    --explanation-border: rgba(251,146,60,.24);
    --explanation-text: #fed7aa;
  }

  /* hide Years exclusion visually if old markup exists */
  label:has(#exclude-years){ display:none !important; }
  `;
  document.head.appendChild(style);

  // ---------- Helpers ----------
  function cleanOptionDisplay(text){
    return String(text || '').replace(/\u200C+/g, '');
  }
  function getFormattedCurrentCorrectAnswer(q){
    const idx = getCorrectIndex(q);
    if(idx < 0) return cleanOptionDisplay(getCorrectAnswerText(q) || q.correctAnswerText || q.correctAnswer || '');
    return `${LETTERS[idx]}) ${cleanOptionDisplay(q.options[idx])}`;
  }

  // ---------- Ensure Explanation / Correct Answer rendering in current theme ----------
  renderExam = function(){
    if(!state.currentExam) return;
    const t = theme();
    const questions = state.currentExam.questions;
    const idx = state.currentExam.currentIndex;
    const q = questions[idx];
    if(!q) return;

    let progressText = t.icons.progress + ' ' + (idx+1) + '/' + questions.length;
    if(state.currentExam.mode === 'training'){
      const answered = state.currentExam.firstAnswers.filter(x => x !== null).length;
      const correct = state.currentExam.firstAnswers.filter((ans,i) => ans !== null && isAnswerCorrect(questions[i], ans)).length;
      const pct = answered > 0 ? Math.round((correct/answered)*100) : 0;
      progressText += ' · ' + t.icons.success + correct + ' · ' + pct + '%';
    } else {
      progressText += ' · ' + (questions.length - idx) + ' left';
    }

    el('exam-progress').textContent = progressText;
    renderGrid();
    const correctIdx = getCorrectIndex(q);
    const showAnswerState = state.currentExam.mode === 'training' && state.currentExam.showAnswer;
    const fav = state.favorites.includes(q.id);
    const answerSummaryHtml = showAnswerState
      ? `<div class="answer-summary"><strong>Correct Answer:</strong> <span class="answer-value">${escapeHtml(getFormattedCurrentCorrectAnswer(q))}</span></div>`
      : '';

    el('question-container').innerHTML = `
      <div class="question-header">
        <span class="question-number">Q${escapeHtml(q.number || String(idx+1))}</span>
        <div class="question-actions">
          <button class="icon-btn ${fav?'active':''}" onclick="toggleFavorite('${q.id}')">💚</button>
          <button class="icon-btn" onclick="toggleQuestionLocation()">${t.icons.location}</button>
        </div>
      </div>
      <p class="question-text">${escapeHtml(q.text)}</p>
      <div class="options-list">${q.options.map((opt,i)=>renderOptionButton(cleanOptionDisplay(opt), i, idx, showAnswerState, state.currentExam.answers[idx], correctIdx)).join('')}</div>
      ${answerSummaryHtml}
      <div class="explanation-box ${showAnswerState?'visible':''}"><strong>Explanation:</strong> ${escapeHtml(q.explanation || 'No explanation available.')}</div>
      ${renderRemoveWrongBtn()}`;

    el('question-container').classList.add('exam-content-ltr');
    renderExamNav();
  };

  openReadonly = function(questionId){
    const q = state.allQuestions.find(item => item.id === questionId);
    if(!q) return;
    const t = theme();
    const correctIdx = getCorrectIndex(q);
    showScreen('readonly-screen');
    el('readonly-content').innerHTML = `
      <div class="question-header">
        <span class="question-number">Question ${escapeHtml(q.number || '?')}</span>
        <div class="question-actions">
          <button class="icon-btn ${state.favorites.includes(q.id)?'active':''}" onclick="toggleFavorite('${q.id}'); openReadonly('${q.id}')">💚</button>
          <button class="icon-btn" onclick="showLocation('${escapeJsString(q.subjectName)}','${escapeJsString(q.lectureName)}','${escapeJsString(q.batchName||'')}','${escapeJsString(q.pageNumber||'')}')">${t.icons.location}</button>
        </div>
      </div>
      <p class="question-text">${escapeHtml(q.text)}</p>
      <div class="options-list">${q.options.map((opt,i)=>'<div class="option-btn '+(i===correctIdx?'correct':'')+'" style="cursor:default;"><span class="option-label">'+LETTERS[i]+')</span>'+escapeHtml(cleanOptionDisplay(opt))+'</div>').join('')}</div>
      <div class="answer-summary"><strong>Correct Answer:</strong> <span class="answer-value">${escapeHtml(getFormattedCurrentCorrectAnswer(q))}</span></div>
      <div class="explanation-box visible"><strong>Explanation:</strong> ${escapeHtml(q.explanation || 'No explanation available.')}</div>`;
    el('readonly-content').classList.add('readonly-ltr');
  };

  reviewExam = function(){
    if(!state.currentExam) return;
    const reviewDiv = el('results-review');
    reviewDiv.classList.remove('hidden');
    let html = '<h3 class="mt-20" style="text-align:right">'+theme().icons.review+' Review</h3>';
    state.currentExam.questions.forEach((q,idx)=>{
      const answersUsed = state.currentExam.mode === 'exam' ? state.currentExam.answers : state.currentExam.firstAnswers;
      const userAnswer = answersUsed[idx];
      const correctIdx = getCorrectIndex(q);
      const ok = userAnswer === correctIdx;
      html += `<div class="question-container review-question-card mt-10" style="border-inline-start:4px solid ${ok?'var(--success)':'var(--danger)'};"><div class="question-header"><span class="question-number">Q${escapeHtml(q.number||String(idx+1))}</span><span style="color:${ok?'var(--success)':'var(--danger)'};font-weight:900;">${ok?theme().icons.success+' Correct':theme().icons.error+' Wrong'}</span></div><p class="question-text">${escapeHtml(q.text)}</p><div class="options-list">${q.options.map((opt,i)=>{ let cls='option-btn'; if(i===correctIdx) cls+=' correct'; if(i===userAnswer && i!==correctIdx) cls+=' wrong'; return '<div class="'+cls+'" style="cursor:default;"><span class="option-label">'+LETTERS[i]+')</span>'+escapeHtml(cleanOptionDisplay(opt))+'</div>'; }).join('')}</div><div class="answer-summary"><strong>Correct Answer:</strong> <span class="answer-value">${escapeHtml(getFormattedCurrentCorrectAnswer(q))}</span></div><div class="explanation-box visible"><strong>Explanation:</strong> ${escapeHtml(q.explanation || 'No explanation available.')}</div></div>`;
    });
    reviewDiv.innerHTML = html;
  };

  // ---------- Statistics exclusions: remove Years ----------
  openStatsExclusionDialog = function(){
    const container = el('subject-exclusions-list');
    const subjects = sortSubjects(state.subjects);
    const excludedSet = getExcludedSubjectsSet();
    container.innerHTML = subjects.map(sub => `
      <label style="display:flex; align-items:center; gap:10px; margin-bottom:8px;">
        <input type="checkbox" data-subject-id="${sub.id}" ${excludedSet.has(sub.id) ? 'checked' : ''}> ${escapeHtml(sub.name)}
      </label>
    `).join('');

    const sectionsWrap = el('section-exclusions-list');
    if(sectionsWrap){
      sectionsWrap.innerHTML = `
        <label><input type="checkbox" id="exclude-lectures" ${state.statsExclusions.excludedSections.lectures ? 'checked' : ''}> المحاضرات (Lectures)</label>
        <label><input type="checkbox" id="exclude-ai" ${state.statsExclusions.excludedSections.ai ? 'checked' : ''}> الذكاء الاصطناعي (AI)</label>`;
    }
    el('stats-exclusion-modal').classList.remove('hidden');
  };

  applyStatsExclusions = function(){
    const excludedSubjects = [];
    document.querySelectorAll('#subject-exclusions-list input[data-subject-id]').forEach(cb => { if(cb.checked) excludedSubjects.push(cb.dataset.subjectId); });
    state.statsExclusions.excludedSubjects = excludedSubjects;
    state.statsExclusions.excludedSections = {
      lectures: el('exclude-lectures') ? !!el('exclude-lectures').checked : false,
      years: false,
      ai: el('exclude-ai') ? !!el('exclude-ai').checked : false
    };
    persistStatsExclusions();
    renderStatisticsPage();
    closeStatsExclusionDialog();
  };

  // ---------- Completion controls ONLY in Exams ----------
  function buildPlainSelectionList(){
    const list = el('selection-list');
    if(!list) return;
    const groups = state.currentGroups || [];
    const t = theme();
    list.innerHTML = '';
    groups.forEach((group, idx) => {
      const icon = group.type === 'ai' ? t.icons.ai : (group.type === 'year' ? t.icons.years : t.icons.lectures);
      const item = document.createElement('div');
      item.className = 'selection-item' + (state.selectedGroups.includes(idx) ? ' selected' : '');
      item.setAttribute('data-group-name', (group.name + ' ' + (group.subjectName||'')).toLowerCase());
      item.innerHTML = `<input type="checkbox" id="group-${idx}" ${state.selectedGroups.includes(idx)?'checked':''} onchange="toggleGroupSelection(${idx})"><label for="group-${idx}" style="width:100%; cursor:pointer;"><strong>${icon} ${escapeHtml(group.name)}</strong><br><small style="color:var(--text-muted)">${group.questions.length} questions</small></label>`;
      item.addEventListener('click', function(event){
        if(event.target.closest('input') || event.target.closest('label')) return;
        const cb = item.querySelector('input');
        cb.checked = !cb.checked;
        toggleGroupSelection(idx);
      });
      list.appendChild(item);
    });
  }

  function buildExamSelectionList(){
    const list = el('selection-list');
    if(!list) return;
    const meta = state.currentSelectionMeta || {};
    const subjectName = state.currentSubject?.name || (state.currentGroups[0]?.subjectName) || 'unknown';
    const sectionType = String(meta.sectionType || state.currentGroups[0]?.type || 'custom').toLowerCase();
    const orderKey = `${subjectName}::${sectionType === 'lecture' ? 'lectures' : sectionType === 'year' ? 'years' : sectionType}`;
    const pref = state.groupPreferences && Array.isArray(state.groupPreferences[orderKey]) ? state.groupPreferences[orderKey].slice() : [];
    if(pref.length){
      const rank = new Map(pref.map((id,i)=>[id,i]));
      state.currentGroups = state.currentGroups.slice().sort((a,b)=>(rank.get(a.id)??1e9)-(rank.get(b.id)??1e9));
    }

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
        <label for="group-${idx}" style="width:100%; cursor:pointer;"><strong class="group-title ${done?'done-title':''}">${icon} ${escapeHtml(group.name)}</strong><br><small class="group-sub ${done?'done-sub':''}" style="color:var(--text-muted)">${group.questions.length} questions</small></label>
        <div class="selection-item-group-actions"><button class="selection-complete-btn ${done?'done':''}" title="تعليم كمكتمل أو إعادة الدراسة" onclick="event.stopPropagation(); confirmCompleteGroup(${idx})">✅</button><span class="selection-drag-handle" title="اسحب لإعادة الترتيب">↕️</span></div>`;

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
        const arr = state.groupPreferences[orderKey] || state.currentGroups.map(g=>g.id);
        const filtered = arr.filter(id => id !== draggedId);
        const targetIndex = filtered.indexOf(group.id);
        if(targetIndex < 0) filtered.push(draggedId); else filtered.splice(targetIndex, 0, draggedId);
        state.groupPreferences[orderKey] = filtered;
        try{ localStorage.setItem('medical-app-group-prefs-v2', JSON.stringify(state.groupPreferences)); }catch(err){}
        buildExamSelectionList();
      });
      list.appendChild(item);
    });
  }

  function renderSelectionScreenWithMode(){
    const collectionType = state.currentSelectionMeta?.collectionType || null;
    if(collectionType === 'wrong' || collectionType === 'favorites') buildPlainSelectionList();
    else buildExamSelectionList();
    updateSelectionFooter();
  }

  const prevShowSelectionScreen = showSelectionScreen;
  showSelectionScreen = function(groups, title, meta){
    prevShowSelectionScreen(groups, title, meta);
    renderSelectionScreenWithMode();
  };
  window.renderSelectionScreenWithEnhancements = renderSelectionScreenWithMode;

  document.addEventListener('DOMContentLoaded', function(){
    // if wrong/favorites selection screen is reopened later, mode renderer will handle it
    if(el('selection-screen') && el('selection-screen').classList.contains('active')) renderSelectionScreenWithMode();
  });
})();
