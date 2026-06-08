const state = {
  subjects: [], displayedSubjects: [], allQuestions: [], currentSubject: null, currentSelectionMeta: null,
  currentGroups: [], selectedGroups: [], selectedMode: null, selectedDirection: null, extraTime: 0, extraTimeAdded: false,
  currentExam: null, favorites: [], wrongQuestions: [], progress: {},
  settings: {}, subjectPreferences: { order: [], pinned: [] }, discoveredRepo: null,
  browseMode: 'all', checklistCompleted: {}, checklistExpanded: {}, statsModalSubjectId: null,
  statsExclusions: { excludedSubjects: [], excludedSections: { lectures: false, years: false, ai: false } },
  subjectStatsSettings: {},
  resetSelectedSubjects: [],
  statsExpand: { subjects: {} },
  questionsFirstSeen: {}, examHistory: [], firstVisit: null,
  toastTimer: null, timerInterval: null, audioUnlocked: false, longPressTimer: null, openSubjectActionId: null,
  dialog: { onConfirm: null, onCancel: null }
};
const STORAGE_KEYS = {
  settings:'medical-app-settings-v12', progress:'medical-app-progress-v12', favorites:'medical-app-favorites-v12', wrong:'medical-app-wrong-v12',
  examState:'medical-app-exam-state-v12', subjectPrefs:'medical-app-subject-prefs-v12', questionLog:'medical-app-question-log-v12',
  examHistory:'medical-app-exam-history-v12', firstVisit:'medical-app-first-visit-v12', statsExclusions:'medical-app-stats-exclusions-v2',
  subjectStatsSettings:'medical-app-subject-stats-settings-v2', checklist:'medical-app-checklist-v1'
};
const DEFAULT_SETTINGS = { darkMode:false, theme:'default', bgSound:'none', bgSoundEnabled:true, volume:50, feedbackEnabled:true, animations:true };
const IGNORE_ROOT_DIRS = new Set(['.git','.github','node_modules','assets','asset','audio','audios','img','images','css','js','docs','dist','build']);
const BACKGROUND_SOUNDS = { none:{file:''}, cafeteria:{file:'Cafeteria.mp3'}, 'after-exam':{file:'After the exam.mp3'}, beach:{file:'Beach.mp3'}, forest:{file:'Forest.mp3'}, fireplace:{file:'Fireplace.mp3'}, 'rain-thunder':{file:'Rain-thunder.mp3'}, 'rain-window':{file:'Rain-window.mp3'} };
const LETTERS = 'ABCDE';
const THEMES = {
 default:{icons:{exams:'📝',wrong:'❌',favorites:'⭐',checklist:'☑️',search:'🔍',statistics:'📊',settings:'⚙️',lectures:'📚',ai:'🤖',years:'📅',start:'🚀',results:'🏆',progress:'🎯',location:'📍',success:'✅',error:'❌',review:'🧾',subject:'📘'},texts:{startExam:'🚀 Start Exam',resultsTitle:'Results',statsTitle:'📊 الإحصائيات',settingsTitle:'⚙️ الإعدادات',examSettingsTitle:'⚙️ Exam Settings',examSettingsButton:'⚙️ Exam Settings',trainingLabel:'Training Mode',examLabel:'Real Exam Mode'}},
 desert:{icons:{exams:'🏹',wrong:'🦂',favorites:'🌵',checklist:'☑️',search:'🔎',statistics:'🧭',settings:'🏕️',lectures:'📜',ai:'🔥',years:'📅',start:'🐪',results:'👑',progress:'🏹',location:'🧭',success:'🤎',error:'🦂',review:'📜',subject:'🏜️'},texts:{startExam:'🐪 Start Journey',resultsTitle:'Majlis Report',statsTitle:'🧭 إحصائيات الرحلة',settingsTitle:'🏕️ إعدادات الخيمة',examSettingsTitle:'🏕️ Exam Camp Settings',examSettingsButton:'🏕️ Exam Settings',trainingLabel:'Training Camp',examLabel:'Journey Exam'}},
 space:{icons:{exams:'🚀',wrong:'☄️',favorites:'🌟',checklist:'☑️',search:'🔭',statistics:'📡',settings:'🤖',lectures:'🛰️',ai:'👽',years:'🪐',start:'🚀',results:'🌌',progress:'🎯',location:'📡',success:'✨',error:'☄️',review:'🧾',subject:'🪐'},texts:{startExam:'🚀 Launch Mission',resultsTitle:'Mission Report',statsTitle:'📡 Mission Analytics',settingsTitle:'🤖 Space Controls',examSettingsTitle:'🤖 Mission Controls',examSettingsButton:'🤖 Mission Settings',trainingLabel:'Training Mission',examLabel:'Space Mission'}},
 pirates:{icons:{exams:'☠️',wrong:'🦈',favorites:'💰',checklist:'☑️',search:'🔎',statistics:'🧭',settings:'⚓',lectures:'🗺️',ai:'🦜',years:'🗓️',start:'☠️',results:'👑',progress:'🏴‍☠️',location:'🧭',success:'🪙',error:'🦈',review:'📜',subject:'⚓'},texts:{startExam:'☠️ Start Voyage',resultsTitle:'Treasure Report',statsTitle:'🧭 Voyage Progress',settingsTitle:'⚓ Captain Settings',examSettingsTitle:'⚓ Voyage Settings',examSettingsButton:'⚓ Voyage Settings',trainingLabel:'Deck Training',examLabel:'Treasure Voyage'}},
 castle:{icons:{exams:'⚔️',wrong:'🐉',favorites:'👑',checklist:'☑️',search:'🔎',statistics:'🛡️',settings:'🏰',lectures:'📜',ai:'🕯️',years:'📅',start:'⚔️',results:'👑',progress:'🏹',location:'🛡️',success:'🛡️',error:'🐉',review:'📜',subject:'🏰'},texts:{startExam:'⚔️ Begin Quest',resultsTitle:'Kingdom Report',statsTitle:'🛡️ Quest Progress',settingsTitle:'🏰 Castle Settings',examSettingsTitle:'🏰 Quest Settings',examSettingsButton:'🏰 Quest Settings',trainingLabel:'Knight Training',examLabel:'Kingdom Trial'}},
 lab:{icons:{exams:'🧪',wrong:'☣️',favorites:'🧬',checklist:'☑️',search:'🔬',statistics:'📈',settings:'⚗️',lectures:'🔬',ai:'🧠',years:'📅',start:'🧪',results:'🏅',progress:'🧫',location:'📍',success:'🧫',error:'☣️',review:'📋',subject:'⚗️'},texts:{startExam:'🧪 Start Experiment',resultsTitle:'Research Report',statsTitle:'📈 Experiment Progress',settingsTitle:'⚗️ Lab Settings',examSettingsTitle:'⚗️ Experiment Settings',examSettingsButton:'⚗️ Experiment Settings',trainingLabel:'Trial Run',examLabel:'Main Experiment'}}
};

function el(id){ return document.getElementById(id); }
function theme(){ return THEMES[state.settings.theme] || THEMES.default; }
function isDarkTheme(){ return ['space','castle','lab'].includes(state.settings.theme); }
function showScreen(id){ 
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active')); 
  const t=el(id); 
  if(t) t.classList.add('active'); 
  if (id === 'exam-screen') {
    document.body.classList.add('in-exam-mode');
  } else {
    document.body.classList.remove('in-exam-mode');
  }
}
function slugify(text){ return String(text||'').toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]+/g,'-').replace(/^-+|-+$/g,'') || 'item'; }
function hashString(input){ let h=0; const s=String(input||''); for(let i=0;i<s.length;i++){ h=((h<<5)-h)+s.charCodeAt(i); h|=0; } return Math.abs(h).toString(36); }
function escapeHtml(v){ return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
function escapeAttribute(v){ return escapeHtml(v); }
function escapeJsString(v){ return String(v==null?'':v).replace(/\\/g,'\\\\').replace(/'/g,"\\'"); }
function shortenText(t,m){ const s=String(t||''); return s.length>m ? s.slice(0,m).trim()+'...' : s; }
function clampNum(v,min,max,fallback){ return Number.isNaN(v)?fallback:Math.min(max,Math.max(min,v)); }
function shuffleArray(arr){ const a=arr.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
function formatDateTime(ts){ const d=new Date(ts); return d.toLocaleString('ar-EG'); }
function formatDuration(ms){ const sec=Math.round((ms||0)/1000); const h=Math.floor(sec/3600), m=Math.floor((sec%3600)/60), s=sec%60; const parts=[]; if(h) parts.push(h+' ساعة'); if(m) parts.push(m+' دقيقة'); parts.push(s+' ثانية'); return parts.join(' '); }
function stripOptionPrefix(text){ return String(text||'').replace(/^[A-E][\)\.\-]\s*/i,'').trim(); }
function normalizeComparisonText(text){ return stripOptionPrefix(String(text||'').replace(/[\u200B-\u200D\uFEFF]/g,'').toLowerCase()).replace(/\s+/g,' ').trim(); }
function isPageLine(line){ return /^P\s*\(?\s*\d+\s*\)?$/i.test(line) || /^Page\s*\d+$/i.test(line); }
function isBatchLine(line){ return /^[A-Za-z][A-Za-z0-9\s&()'\/]+-\s*\d+$/i.test(line) || /^\d+(st|nd|rd|th)\s+Year/i.test(line); }
function looksLikeMetadataTail(line){ return /^[A-Za-z].{0,60}$/.test(line) && /\d/.test(line) && !/[?.!]$/.test(line); }
function isMetadataLine(line){ return isPageLine(line) || isBatchLine(line) || looksLikeMetadataTail(line); }
function previewOption(option, idx){ return `${LETTERS[idx] || idx+1}) ${option}`; }
function resolveCorrectIndex(options, correctAnswer){
  if(!Array.isArray(options)||!options.length) return -1;
  const m=String(correctAnswer||'').match(/^([A-E])/i);
  if(m){ const ix=m[1].toUpperCase().charCodeAt(0)-65; if(ix>=0&&ix<options.length) return ix; }
  const ans=normalizeComparisonText(correctAnswer);
  for(let i=0;i<options.length;i++){
    const opt=normalizeComparisonText(options[i]);
    if(opt && (opt===ans || opt.includes(ans) || ans.includes(opt))) return i;
  }
  return -1;
}
function getCorrectIndex(q){ if(typeof q.correctIndex==='number' && q.correctIndex>=0) return q.correctIndex; q.correctIndex=resolveCorrectIndex(q.options||[], q.correctAnswerText || q.correctAnswer || ''); return q.correctIndex; }
function isAnswerCorrect(q, idx){ return getCorrectIndex(q)===idx; }
function getCorrectAnswerText(q){
  if(q.correctAnswerText) return q.correctAnswerText;
  const idx = resolveCorrectIndex(q.originalOptions || q.options || [], q.correctAnswer || '');
  if(idx>=0 && (q.originalOptions || q.options || [])[idx]) return stripOptionPrefix((q.originalOptions || q.options)[idx]);
  return stripOptionPrefix(q.correctAnswer || '');
}
function getSubjectColor(subjectName){ const darkPalette=['#93c5fd','#86efac','#fcd34d','#c4b5fd','#fda4af','#67e8f9','#fdba74','#f9a8d4']; const lightPalette=['#1d4ed8','#15803d','#b45309','#7c3aed','#be123c','#0f766e','#9a3412','#9d174d']; const palette=isDarkTheme()?darkPalette:lightPalette; const subjects=sortSubjects(state.subjects).map(s=>s.name); const idx=Math.max(0, subjects.indexOf(subjectName)) % palette.length; return palette[idx]; }
function formatHistorySubLabel(item){ if(!item || !item.groups || !item.groups.length) return item.sourceLabel || 'عام'; return item.groups.map(g=>g.type==='ai' ? `${g.name} (AI)` : g.name).join('، '); }
function calculateLectureChecklistStats(subject){ const lectures=subject.lectures || []; const total=lectures.length; const completed=lectures.reduce((sum,g)=>sum + (state.checklistCompleted[g.id] ? 1 : 0), 0); const remaining=Math.max(0,total-completed); return { total, completed, remaining, percentage: total?Math.round((completed/total)*100):0 }; }
function getPromptLabelForGroup(group){ if(group.type==='year') return 'Batch'; if(group.type==='ai') return 'AI'; return 'Lecture'; }
function getStatsSectionPalette(type){ const dark = isDarkTheme(); const map = dark ? { lecture:{accent:'#f8fafc', bg:'rgba(255,255,255,0.10)'}, year:{accent:'#fde68a', bg:'rgba(253,230,138,0.12)'}, ai:{accent:'#86efac', bg:'rgba(134,239,172,0.12)'} } : { lecture:{accent:'#1d4ed8', bg:'rgba(29,78,216,0.08)'}, year:{accent:'#92400e', bg:'rgba(245,158,11,0.10)'}, ai:{accent:'#047857', bg:'rgba(16,185,129,0.10)'} }; return map[type] || (dark ? {accent:'#f8fafc', bg:'rgba(255,255,255,0.10)'} : {accent:'#1d4ed8', bg:'rgba(29,78,216,0.08)'}); }
function cleanOptionDisplay(text){ return String(text||'').replace(/\u200C+/g,''); }
function getFormattedCurrentCorrectAnswer(q){ const idx = getCorrectIndex(q); if(idx < 0) return cleanOptionDisplay(getCorrectAnswerText(q) || q.correctAnswerText || q.correctAnswer || ''); return `${LETTERS[idx]}) ${cleanOptionDisplay(q.options[idx])}`; }

function loadJSON(key, fallback){ try{ return JSON.parse(localStorage.getItem(key)) || fallback; }catch{ return fallback; } }
function saveSettings(){ localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(state.settings)); }
function loadSettings(){ state.settings=Object.assign({}, DEFAULT_SETTINGS, loadJSON(STORAGE_KEYS.settings, {})); }
function saveFavorites(){ localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify(state.favorites)); }
function loadFavorites(){ state.favorites=loadJSON(STORAGE_KEYS.favorites, []); }
function saveWrongQuestions(){ localStorage.setItem(STORAGE_KEYS.wrong, JSON.stringify(state.wrongQuestions)); }
function loadWrongQuestions(){ state.wrongQuestions=loadJSON(STORAGE_KEYS.wrong, []); }
function saveProgressStore(){ localStorage.setItem(STORAGE_KEYS.progress, JSON.stringify(state.progress)); }
function loadProgress(){ state.progress=loadJSON(STORAGE_KEYS.progress, {}); }
function saveExamState(){ if(state.currentExam) localStorage.setItem(STORAGE_KEYS.examState, JSON.stringify(state.currentExam)); }
function clearExamState(){ localStorage.removeItem(STORAGE_KEYS.examState); }
function saveSubjectPreferences(){ localStorage.setItem(STORAGE_KEYS.subjectPrefs, JSON.stringify(state.subjectPreferences)); }
function loadSubjectPreferences(){ state.subjectPreferences=Object.assign({order:[],pinned:[]}, loadJSON(STORAGE_KEYS.subjectPrefs, {})); }
function persistStatsExclusions(){ localStorage.setItem(STORAGE_KEYS.statsExclusions, JSON.stringify(state.statsExclusions)); }
function loadStatsExclusions(){ state.statsExclusions=Object.assign({ excludedSubjects: [], excludedSections: { lectures: false, years: false, ai: false } }, loadJSON(STORAGE_KEYS.statsExclusions, {})); }
function persistSubjectStatsSettings(){ localStorage.setItem(STORAGE_KEYS.subjectStatsSettings, JSON.stringify(state.subjectStatsSettings)); }
function loadSubjectStatsSettings(){ state.subjectStatsSettings=loadJSON(STORAGE_KEYS.subjectStatsSettings, {}); }
function saveMemoryStores(){ localStorage.setItem(STORAGE_KEYS.questionLog, JSON.stringify(state.questionsFirstSeen)); localStorage.setItem(STORAGE_KEYS.examHistory, JSON.stringify(state.examHistory)); if(state.firstVisit) localStorage.setItem(STORAGE_KEYS.firstVisit, String(state.firstVisit)); }
function loadMemoryStores(){ state.questionsFirstSeen = loadJSON(STORAGE_KEYS.questionLog, {}); state.examHistory = loadJSON(STORAGE_KEYS.examHistory, []); const fv = localStorage.getItem(STORAGE_KEYS.firstVisit); state.firstVisit = fv ? Number(fv) : Date.now(); if(!fv) localStorage.setItem(STORAGE_KEYS.firstVisit, String(state.firstVisit)); }
function saveChecklistStore(){ localStorage.setItem(STORAGE_KEYS.checklist, JSON.stringify(state.checklistCompleted)); }
function loadChecklistStore(){ state.checklistCompleted = loadJSON(STORAGE_KEYS.checklist, {}); }
function addProgressId(key, qid){ if(!state.progress[key]) state.progress[key]={questionIds:[]}; if(!state.progress[key].questionIds.includes(qid)) state.progress[key].questionIds.push(qid); }

function normalizeSubjectPreferences(){ const ids=state.subjects.map(s=>s.id); state.subjectPreferences.order=(state.subjectPreferences.order||[]).filter(id=>ids.includes(id)); state.subjectPreferences.pinned=(state.subjectPreferences.pinned||[]).filter(id=>ids.includes(id)); ids.forEach(id=>{ if(!state.subjectPreferences.order.includes(id)) state.subjectPreferences.order.push(id); }); saveSubjectPreferences(); }
function sortSubjects(list){ const orderMap=new Map(); (state.subjectPreferences.order||[]).forEach((id,idx)=>orderMap.set(id,idx)); const pinned=new Set(state.subjectPreferences.pinned||[]); return list.slice().sort((a,b)=>{ const ap=pinned.has(a.id)?1:0, bp=pinned.has(b.id)?1:0; if(ap!==bp) return bp-ap; const ao=orderMap.has(a.id)?orderMap.get(a.id):Number.MAX_SAFE_INTEGER; const bo=orderMap.has(b.id)?orderMap.get(b.id):Number.MAX_SAFE_INTEGER; if(ao!==bo) return ao-bo; return a.name.localeCompare(b.name,'en',{sensitivity:'base'}); }); }

function applyThemeUI(){ const t=theme(); el('nav-icon-exams').textContent=t.icons.exams; el('nav-icon-wrong').textContent=t.icons.wrong; el('nav-icon-favorites').textContent=t.icons.favorites; if(el('nav-icon-checklist')) el('nav-icon-checklist').textContent=t.icons.checklist || '☑️'; el('nav-icon-search').textContent=t.icons.search; el('nav-icon-statistics').textContent=t.icons.statistics; el('nav-icon-settings').textContent=t.icons.settings; if(el('nav-icon-memories')) el('nav-icon-memories').textContent='📖'; if(el('statistics-screen-title')) el('statistics-screen-title').textContent=t.texts.statsTitle; if(el('settings-title')) el('settings-title').textContent=t.texts.settingsTitle; if(el('exam-settings-title')) el('exam-settings-title').textContent=t.texts.examSettingsTitle; if(el('btn-exam-settings')) el('btn-exam-settings').textContent=t.texts.examSettingsButton; if(el('btn-start-exam')) el('btn-start-exam').textContent=t.texts.startExam; const a=document.querySelector('#btn-training-mode .mode-label'); const b=document.querySelector('#btn-exam-mode .mode-label'); if(a) a.textContent=t.texts.trainingLabel; if(b) b.textContent=t.texts.examLabel; }
function syncSettingsControls(){ const entries=[['dark-mode-toggle','checked',!!state.settings.darkMode],['theme-selector','value',state.settings.theme],['exam-theme-selector','value',state.settings.theme],['sound-selector','value',state.settings.bgSound],['exam-sound-selector','value',state.settings.bgSound],['bg-sound-enabled-toggle','checked',state.settings.bgSoundEnabled!==false],['exam-bg-sound-enabled-toggle','checked',state.settings.bgSoundEnabled!==false],['volume-control','value',state.settings.volume],['exam-volume-control','value',state.settings.volume],['feedback-toggle','checked',state.settings.feedbackEnabled!==false],['exam-feedback-toggle','checked',state.settings.feedbackEnabled!==false],['animations-toggle','checked',state.settings.animations!==false]]; entries.forEach(([id,prop,val])=>{ const x=el(id); if(x) x[prop]=val; }); }
async function resolveAssetPath(candidates){ for(const item of candidates.filter(Boolean)){ try{ const u=encodeURI(item); const r=await fetch(u,{method:'HEAD'}); if(r.ok) return u; }catch(e){} } return encodeURI(candidates.find(Boolean)||''); }
async function applyBackgroundSound(){ const audio=el('bg-audio'); if(!audio) return; audio.volume=(state.settings.volume||50)/100; const key=state.settings.bgSound||'none'; const sound=BACKGROUND_SOUNDS[key]||BACKGROUND_SOUNDS.none; if(!state.settings.bgSoundEnabled || key==='none' || !sound.file){ audio.pause(); return; } const src=await resolveAssetPath([sound.file,'audio/'+sound.file,'assets/audio/'+sound.file]); if(audio.dataset.currentSrc!==src){ audio.src=src; audio.dataset.currentSrc=src; audio.load(); } if(state.audioUnlocked) audio.play().catch(()=>{}); }
function applyEffectAudioVolumes(){ ['right-audio','wrong-audio','celebrate-audio'].forEach(id=>{ const a=el(id); if(a) a.volume=(state.settings.volume||50)/100; }); }
async function prepareStaticEffectAudio(){ const right = el('right-audio'); const wrong = el('wrong-audio'); const celebrate = el('celebrate-audio'); if(right) right.src=await resolveAssetPath(['right.mp3','audio/right.mp3','assets/audio/right.mp3']); if(wrong) wrong.src=await resolveAssetPath(['wrong.mp3','audio/wrong.mp3','assets/audio/wrong.mp3']); if(celebrate) celebrate.src=await resolveAssetPath(['celebrate.mp3','audio/celebrate.mp3','assets/audio/celebrate.mp3']); applyEffectAudioVolumes(); }
function primeAudioUnlock(){ function unlock(){ if(state.audioUnlocked) return; state.audioUnlocked=true; applyBackgroundSound(); document.removeEventListener('click',unlock); document.removeEventListener('touchstart',unlock); document.removeEventListener('keydown',unlock); } document.addEventListener('click',unlock,{once:true}); document.addEventListener('touchstart',unlock,{once:true}); document.addEventListener('keydown',unlock,{once:true}); }
function playEffectSound(kind){ if(!state.currentExam || state.currentExam.mode!=='training' || state.settings.feedbackEnabled===false) return; const a=el(kind==='right'?'right-audio':'wrong-audio'); if(!a||!a.src) return; try{ a.currentTime=0; a.play().catch(()=>{}); }catch(e){} }
function playCelebrateSound(){ const a=el('celebrate-audio'); if(!a||!a.src) return; try{ a.currentTime=0; a.play().catch(()=>{}); }catch(e){} }

function applySettings(){ state.settings=Object.assign({},DEFAULT_SETTINGS,state.settings||{}); document.documentElement.setAttribute('data-dark', String(!!state.settings.darkMode)); document.documentElement.setAttribute('data-theme', state.settings.theme||'default'); document.documentElement.setAttribute('data-animations', String(state.settings.animations!==false)); syncSettingsControls(); applyThemeUI(); applyBackgroundSound(); applyEffectAudioVolumes(); }
function changeTheme(name){ state.settings.theme = THEMES[name] ? name : 'default'; saveSettings(); applySettings(); renderSubjects(); if(state.currentSubject && el('subject-sections-screen').classList.contains('active')) openSubject(state.currentSubject.id); if(state.currentExam && el('exam-screen').classList.contains('active')) renderExam(); renderStatisticsPage(); renderChecklist(); if(el('checklist-subject-screen') && el('checklist-subject-screen').classList.contains('active')) renderChecklistSubject(); if(el('subject-stats-screen') && el('subject-stats-screen').classList.contains('active')) renderSubjectStats(); renderMemories(); }
function changeSound(name){ state.settings.bgSound = BACKGROUND_SOUNDS[name] ? name : 'none'; saveSettings(); applySettings(); }
function changeVolume(v){ state.settings.volume=clampNum(parseInt(v,10),0,100,50); saveSettings(); applySettings(); }
function toggleDarkMode(){ state.settings.darkMode=!!el('dark-mode-toggle').checked; saveSettings(); applySettings(); }
function toggleBackgroundSoundEnabled(){ const src=document.activeElement && (document.activeElement.id==='exam-bg-sound-enabled-toggle' || document.activeElement.id==='bg-sound-enabled-toggle') ? document.activeElement : el('bg-sound-enabled-toggle'); state.settings.bgSoundEnabled=!!(src && src.checked); saveSettings(); applySettings(); }
function toggleFeedbackSounds(){ const src=document.activeElement && (document.activeElement.id==='exam-feedback-toggle' || document.activeElement.id==='feedback-toggle') ? document.activeElement : el('feedback-toggle'); state.settings.feedbackEnabled=!!(src && src.checked); saveSettings(); applySettings(); }
function toggleAnimations(){ state.settings.animations=!!el('animations-toggle').checked; saveSettings(); applySettings(); }
function toggleSettings(){ el('settings-panel').classList.toggle('visible'); }
function toggleExamSettings(show){ el('exam-settings-modal').classList.toggle('hidden', !show); if(show) syncSettingsControls(); }

function showToast(message, kind='info', duration=2600){ const toast=el('toast'); if(!toast) return; clearTimeout(state.toastTimer); const prefix=(theme().icons[kind] || theme().icons.statistics || 'ℹ️'); toast.textContent=prefix+' '+message; toast.classList.remove('hidden'); toast.classList.add('visible'); state.toastTimer=setTimeout(()=>{ toast.classList.remove('visible'); toast.classList.add('hidden'); },duration); }
function showDialog({title='تنبيه', message='', showCancel=false, confirmText='موافق', cancelText='إلغاء', onConfirm=null, onCancel=null}){ el('dialog-title').textContent=title; el('dialog-body').innerHTML=message; const cancel=el('dialog-cancel'); const confirm=el('dialog-confirm'); cancel.classList.toggle('hidden', !showCancel); cancel.textContent=cancelText; confirm.textContent=confirmText; state.dialog.onConfirm=onConfirm; state.dialog.onCancel=onCancel; el('dialog-overlay').classList.remove('hidden'); }
function hideDialog(){ el('dialog-overlay').classList.add('hidden'); state.dialog.onConfirm=null; state.dialog.onCancel=null; }
function dialogConfirmAction(){ const fn=state.dialog.onConfirm; hideDialog(); if(typeof fn==='function') fn(); }
function dialogCancelAction(){ const fn=state.dialog.onCancel; hideDialog(); if(typeof fn==='function') fn(); }
function askConfirm(message,onConfirm,onCancel){ showDialog({title:'تأكيد',message,showCancel:true,confirmText:'تأكيد',cancelText:'إلغاء',onConfirm,onCancel}); }

function getExcludedSubjectsSet(){ return new Set(state.statsExclusions.excludedSubjects); }
function isSubjectExcluded(subjectId){ return getExcludedSubjectsSet().has(subjectId); }
function isSectionExcluded(sectionType){ const map = { lecture: 'lectures', year: 'years', ai: 'ai' }; const key = map[sectionType]; return state.statsExclusions.excludedSections[key] === true; }
function getSubjectVisibilitySettings(subjectId){ return Object.assign({ lectures:true, years:false, ai:false }, state.subjectStatsSettings[subjectId] || {}); }
function getSubjectProgressEntryForGroup(group){ return getAnsweredCountForKey(getGroupProgressKey(group.type, group.subjectName, group.name)); }
function getSubjectTotalQuestions(subject){
  let total = 0;
  if(!isSectionExcluded('lecture') && getSubjectVisibilitySettings(subject.id).lectures !== false) total += subject.lectures.reduce((s,g)=>s+g.questions.length,0);
  if(!isSectionExcluded('year') && getSubjectVisibilitySettings(subject.id).years !== false) total += subject.years.reduce((s,g)=>s+g.questions.length,0);
  if(!isSectionExcluded('ai') && getSubjectVisibilitySettings(subject.id).ai !== false) total += subject.ai.reduce((s,g)=>s+g.questions.length,0);
  return total;
}
function getSubjectAnsweredCount(subject){
  const answeredSet = new Set();
  const addKey = (key) => { const entry = state.progress[key]; if(entry && entry.questionIds) entry.questionIds.forEach(id=>answeredSet.add(id)); };
  const settings = getSubjectVisibilitySettings(subject.id);
  if(!isSectionExcluded('lecture') && settings.lectures !== false) subject.lectures.forEach(g=> addKey(`lecture:${subject.name}/${g.name}`));
  if(!isSectionExcluded('year') && settings.years !== false) subject.years.forEach(g=> addKey(`year:${subject.name}/${g.name}`));
  if(!isSectionExcluded('ai') && settings.ai !== false) subject.ai.forEach(g=> addKey(`ai:${subject.name}/${g.name}`));
  return answeredSet.size;
}
function getGlobalStats(){
  let totalQuestions = 0;
  let answeredQuestions = 0;
  const excludedSubjects = getExcludedSubjectsSet();
  for(const subject of state.subjects){
    if(excludedSubjects.has(subject.id)) continue;
    const subjTotal = getSubjectTotalQuestions(subject);
    const subjAnswered = getSubjectAnsweredCount(subject);
    totalQuestions += subjTotal;
    answeredQuestions += subjAnswered;
  }
  const percentage = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;
  return { totalQuestions, answeredQuestions, remainingQuestions: Math.max(0,totalQuestions-answeredQuestions), percentage };
}
function getSectionAnalytics(subject, type){
  const groups = type==='lecture' ? subject.lectures : type==='year' ? subject.years : subject.ai;
  const rows = groups.map(group => {
    const total = group.questions.length;
    const answered = getSubjectProgressEntryForGroup(group);
    const remaining = Math.max(0, total - answered);
    const percentage = total ? Math.round((answered/total)*100) : 0;
    return { group, total, answered, remaining, percentage };
  });
  const total = rows.reduce((sum, row) => sum + row.total, 0);
  const answered = rows.reduce((sum, row) => sum + row.answered, 0);
  const remaining = Math.max(0,total-answered);
  const percentage = total ? Math.round((answered/total)*100) : 0;
  return { rows, total, answered, remaining, percentage };
}

function openStatisticsPage(){ renderStatisticsPage(); showScreen('statistics-screen'); }
function closeStatisticsPage(){ goHome(); }
function renderStatisticsPage(){ renderGlobalStats(); renderSubjectsStatsList(); }
function renderGlobalStats(){
  const container = el('global-stats-container');
  if(!container) return;
  const { totalQuestions, answeredQuestions, percentage } = getGlobalStats();
  const remaining = Math.max(0,totalQuestions-answeredQuestions);
  const t = theme();
  container.innerHTML = `
    <div class="progress-card">
      <h4>${t.icons.progress} النظرة العامة</h4>
      <p><span>إجمالي الأسئلة</span><strong>${totalQuestions}</strong></p>
      <p><span>الأسئلة المكتملة</span><strong>${answeredQuestions}</strong></p>
      <p><span>الأسئلة المتبقية</span><strong>${remaining}</strong></p>
      <div class="progress-bar"><span style="width:${percentage}%"></span></div>
      <p><span>نسبة الإنجاز</span><strong>${percentage}%</strong></p>
    </div>
  `;
}
function renderSubjectsStatsList(){
  const container = el('subjects-stats-list');
  if(!container) return;
  const excludedSubjects = getExcludedSubjectsSet();
  const subjectsToShow = sortSubjects(state.subjects).filter(s => !excludedSubjects.has(s.id));
  if(subjectsToShow.length === 0){
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">📭</div><p>لا توجد مواد متاحة بعد تطبيق الاستثناءات.</p></div>';
    return;
  }
  const t = theme();
  container.innerHTML = subjectsToShow.map(subject => {
    const total = getSubjectTotalQuestions(subject);
    const answered = getSubjectAnsweredCount(subject);
    const remaining = Math.max(0,total-answered);
    const pct = total > 0 ? Math.round((answered/total)*100) : 0;
    return `
      <div class="stats-subject-card" onclick="openSubjectStats('${subject.id}')">
        <div class="stats-subject-head">
          <div class="stats-subject-title">${t.icons.subject} ${escapeHtml(subject.name)}</div>
          <div class="stats-meta-pill">${total} سؤال</div>
          <div class="stats-meta-pill">${answered} مكتمل</div>
          <div class="stats-meta-pill">${pct}%</div>
        </div>
        <div class="progress-bar"><span style="width:${pct}%"></span></div>
        <div class="stats-row" style="margin-top:10px;"><span>المتبقي</span><strong>${remaining}</strong></div>
      </div>
    `;
  }).join('');
}
function renderSectionAnalyticsCard(subject, type, label, icon, analytics){
  const palette = getStatsSectionPalette(type);
  const rowsHtml = analytics.rows.length ? analytics.rows.map(row => `
    <div class="stats-lecture-row" style="--subject-color:${getSubjectColor(subject.name)}">
      <div><strong>${escapeHtml(row.group.name)}</strong></div>
      <div class="stats-meta-pill">${row.total} سؤال</div>
      <div class="stats-meta-pill">${row.remaining} متبقٍّ</div>
      <div class="stats-meta-pill">${row.percentage}%</div>
    </div>
  `).join('') : `<div class="stats-empty-note">لا توجد عناصر مفعَّلة في هذا القسم.</div>`;

  return `
    <div class="stats-section-card" style="border-left: 4px solid ${palette.accent}; background: ${palette.bg}">
      <div class="stats-section-header">
        <span class="stats-section-icon">${icon}</span>
        <div class="stats-section-info">
          <div class="stats-section-title">${label}</div>
          <div class="stats-section-summary">${analytics.total} سؤال الكلي · ${analytics.answered} مكتمل (${analytics.percentage}%)</div>
        </div>
      </div>
      <div class="stats-section-body">${rowsHtml}</div>
    </div>
  `;
}

function openExams(){ state.browseMode='all'; renderSubjects(); showScreen('subjects-screen'); }
function openBrowseMode(){ state.browseMode='browse'; renderSubjects(); showScreen('subjects-screen'); }
function openFavorites(){ state.browseMode='favorites'; renderSubjects(); showScreen('subjects-screen'); }
function openWrongQuestions(){ state.browseMode='wrong'; renderSubjects(); showScreen('subjects-screen'); }

function filterSubjects(){ renderSubjects(); }
function renderSubjects(){
  const container = el('subjects-list');
  if(!container) return;
  const query = el('subject-search').value.toLowerCase().trim();
  const pinnedSet = new Set(state.subjectPreferences.pinned || []);
  let visible = sortSubjects(state.subjects);
  if(query){
    visible = visible.filter(s => s.name.toLowerCase().includes(query));
  }
  state.displayedSubjects = visible;
  const empty = el('subjects-empty-state') || document.createElement('div');
  if(!el('subjects-empty-state')){
    empty.id = 'subjects-empty-state';
    empty.className = 'empty-state hidden';
    container.parentNode.insertBefore(empty, container.nextSibling);
  }
  const setEmptyText = (msg,ico='📭') => { empty.innerHTML=`<div class="empty-icon">${ico}</div><p>${msg}</p>`; };
  const titleMap = {all:'الامتحانات والتجميعات', browse:'تصفح الأسئلة', favorites:'المفضلة', wrong:'الأسئلة الخاطئة'};
  if(el('subjects-screen-title')) el('subjects-screen-title').textContent=titleMap[state.browseMode] || 'Exams';
  const hint = el('exams-hint-bar');
  if(hint) hint.classList.toggle('hidden', state.browseMode !== 'all');
  if(!state.displayedSubjects.length){
    empty.classList.remove('hidden');
    container.innerHTML='';
    if(state.browseMode==='wrong') setEmptyText('لا توجد أسئلة خاطئة حتى الآن.','❌');
    else if(state.browseMode==='favorites') setEmptyText('لا توجد أسئلة مفضلة حتى الآن.','⭐');
    else setEmptyText('التحميل جارٍ','🐦‍🔥');
    return;
  }
  empty.classList.add('hidden');
  container.innerHTML=visible.map(subject=>{
    const pinned=pinnedSet.has(subject.id);
    return `<div class="subject-card${state.openSubjectActionId===subject.id?' actions-open':''}" data-subject-id="${subject.id}" style="--subject-color:${getSubjectColor(subject.name)}" onclick="handleSubjectCardClick('${subject.id}')">
      <div class="subject-card-header">
        <div class="subject-title-wrap">
          <span class="subject-icon">${theme().icons.subject}</span>
          <span class="subject-name">${escapeHtml(subject.name)}</span>
        </div>
        <button class="btn-pin${pinned?' pinned':''}" onclick="togglePinSubject('${subject.id}',event)">⭐</button>
      </div>
    </div>`;
  }).join('');
}

function handleSubjectCardClick(subjectId){
  const subject = state.subjects.find(s=>s.id===subjectId);
  if(!subject) return;
  state.currentSubject = subject;
  if(state.browseMode === 'browse'){
    startBrowseMode(subject);
  } else if(state.browseMode === 'favorites'){
    openCollectionsPage('favorites', subject);
  } else if(state.browseMode === 'wrong'){
    openCollectionsPage('wrong', subject);
  } else {
    openSelectionScreen(subject);
  }
}

function openSelectionScreen(subject){
  state.currentSubject = subject;
  if(el('selection-title')) el('selection-title').textContent = subject.name;
  state.selectedGroups = [];
  switchSelectionTab('lectures');
  showScreen('selection-screen');
}

function switchSelectionTab(tab){
  document.querySelectorAll('.selection-tabs .tab-btn').forEach(b=>b.classList.remove('active'));
  const activeBtn = el(`tab-${tab}`);
  if(activeBtn) activeBtn.classList.add('active');
  state.selectedGroups = [];
  renderSelectionList(tab);
  updateSelectionActionBar();
}

function renderSelectionList(tab){
  const container = el('selection-list');
  if(!container || !state.currentSubject) return;
  let groups = [];
  if(tab === 'lectures'){
    groups = state.currentSubject.lectures || [];
  } else if(tab === 'years'){
    groups = state.currentSubject.years || [];
  } else if(tab === 'ai'){
    groups = state.currentSubject.ai || [];
  }
  state.currentGroups = groups;
  if(!groups.length){
    container.innerHTML = `<div class="empty-state"><p>لا توجد بيانات متاحة لهذا القسم.</p></div>`;
    return;
  }
  container.innerHTML = groups.map((g,idx) => {
    const isSelected = state.selectedGroups.includes(idx);
    return `<div class="selection-item${isSelected?' selected':''}" onclick="toggleGroupSelection(${idx})">
      <div class="selection-item-title">${escapeHtml(g.name)}</div>
      <div class="selection-item-meta">${g.questions.length} سؤال</div>
    </div>`;
  }).join('');
}

function toggleGroupSelection(idx){
  const pos = state.selectedGroups.indexOf(idx);
  if(pos > -1) state.selectedGroups.splice(pos, 1);
  else state.selectedGroups.push(idx);
  const items = el('selection-list').children;
  if(items[idx]) items[idx].classList.toggle('selected', pos === -1);
  updateSelectionActionBar();
}

function updateSelectionActionBar(){
  const bar = el('selection-action-bar');
  if(!bar) return;
  let totalQuestions = 0;
  state.selectedGroups.forEach(idx => {
    if(state.currentGroups[idx]) totalQuestions += state.currentGroups[idx].questions.length;
  });
  if(state.selectedGroups.length > 0){
    bar.classList.remove('hidden');
    el('selected-count-label').textContent = `تم تحديد: ${state.selectedGroups.length} عناصر (${totalQuestions} سؤال)`;
  } else {
    bar.classList.add('hidden');
  }
}

function startBrowseFromSelection(){
  let questions = [];
  state.selectedGroups.forEach(idx => {
    if(state.currentGroups[idx]) questions = questions.concat(state.currentGroups[idx].questions);
  });
  if(!questions.length){
    showToast('لا توجد أسئلة لتصفحها.','error');
    return;
  }
  renderBrowseScreen(questions, `${state.currentSubject.name} - تصفح مخصص`);
}

function startExamFromSelection(){
  let questions = [];
  state.selectedGroups.forEach(idx => {
    if(state.currentGroups[idx]) questions = questions.concat(state.currentGroups[idx].questions);
  });
  if(!questions.length){
    showToast('لا توجد أسئلة كافية لبدء امتحان.','error');
    return;
  }
  const activeTab = document.querySelector('.selection-tabs .tab-btn.active').id.replace('tab-','');
  const selectedGroupObjects = state.selectedGroups.map(idx=>state.currentGroups[idx]).filter(Boolean);
  const historySubjectName = state.currentSubject?.name || 'Unknown Subject';
  const historyGroups = selectedGroupObjects.map(g=>({ name:g.name, type:g.type || activeTab }));
  const examQuestions = shuffleArray(questions).map(prepareQuestionForExam);
  startExamSession(examQuestions, 'exam', 'free', activeTab, 0, {
    collectionType: activeTab,
    displayLabel: 'امتحان مخصص',
    historySubjectName,
    historyGroups
  });
}

function prepareQuestionForExam(q){
  return {
    id: q.id,
    text: q.text,
    options: q.options ? q.options.slice() : [],
    correctAnswer: q.correctAnswer,
    explanation: q.explanation || '',
    subjectName: q.subjectName || state.currentSubject?.name || '',
    groupName: q.groupName || ''
  };
}

function startExamSession(questions, mode, direction, sectionType, extraTime, meta){
  state.currentExam = {
    questions,
    mode,
    direction,
    sectionType,
    extraTime,
    meta,
    currentIndex: 0,
    answers: new Array(questions.length).fill(null),
    firstAnswers: new Array(questions.length).fill(null),
    startTime: Date.now(),
    submitted: false,
    subjectName: meta.historySubjectName
  };
  saveExamState();
  renderExam();
  startTimer();
  showScreen('exam-screen');
}

function renderExam(){
  if(!state.currentExam) return;
  const idx = state.currentExam.currentIndex;
  const q = state.currentExam.questions[idx];
  if(!q) return;
  el('exam-progress-index').textContent = `${idx + 1}/${state.currentExam.questions.length}`;
  el('exam-subject-name').textContent = state.currentExam.subjectName || '';
  const progressPct = ((idx + 1) / state.currentExam.questions.length) * 100;
  el('exam-progress-bar').style.width = `${progressPct}%`;
  const container = el('exam-question-container');
  if(!container) return;
  const fav = state.favorites.includes(q.id);
  const correctIdx = getCorrectIndex(q);
  const showAnswerState = state.currentExam.mode === 'training' && state.currentExam.answers[idx] !== null;
  let answerSummaryHtml = '';
  if(showAnswerState){
    const isUserCorrect = state.currentExam.answers[idx] === correctIdx;
    answerSummaryHtml = `<div class="answer-feedback-summary ${isUserCorrect?'correct':'wrong'}">
      ${isUserCorrect?'إجابة صحيحة أحسنت!':'إجابة خاطئة، حاول التركيز في المرة القادمة.'}
    </div>`;
  }
  container.innerHTML = `
    <div class="question-header">
      <span class="question-number">السؤال ${idx + 1}</span>
      <div class="question-actions">
        <button class="icon-btn ${fav?'active':''}" onclick="toggleFavoriteExam('${q.id}')">⭐</button>
      </div>
    </div>
    <p class="question-text">${escapeHtml(q.text)}</p>
    <div class="options-list">
      ${q.options.map((opt, i) => {
        let optClass = 'option-btn';
        if(state.currentExam.answers[idx] === i) optClass += ' selected';
        if(showAnswerState){
          if(i === correctIdx) optClass += ' correct';
          else if(state.currentExam.answers[idx] === i) optClass += ' wrong';
        }
        return `<button class="${optClass}" onclick="selectExamOption(${i})" ${showAnswerState?'disabled':''}>
          <span class="option-letter">${LETTERS[i] || i+1}</span>
          <span class="option-text">${escapeHtml(opt)}</span>
        </button>`;
      }).join('')}
    </div>
    ${answerSummaryHtml}
    <div class="explanation-box ${showAnswerState?'visible':''}">
      <strong>الشرح والتبرير:</strong>
      <p>${escapeHtml(q.explanation || 'لا يوجد شرح متوفر لهذا السؤال.')}</p>
    </div>
  `;
  el('btn-prev').disabled = idx === 0 || state.currentExam.direction === 'oneway';
  if(idx === state.currentExam.questions.length - 1){
    el('btn-next').textContent = 'إنهاء الامتحان';
  } else {
    el('btn-next').textContent = 'التالي';
  }
}

function selectExamOption(optIdx){
  if(!state.currentExam || state.currentExam.submitted) return;
  const idx = state.currentExam.currentIndex;
  if(state.currentExam.answers[idx] !== null && state.currentExam.mode === 'training') return;
  state.currentExam.answers[idx] = optIdx;
  if(state.currentExam.firstAnswers[idx] === null) state.currentExam.firstAnswers[idx] = optIdx;
  saveExamState();
  if(state.currentExam.mode === 'training'){
    const q = state.currentExam.questions[idx];
    if(isAnswerCorrect(q, optIdx)){
      playEffectSound('right');
    } else {
      playEffectSound('wrong');
      addQuestionToWrongBank(q);
    }
  }
  renderExam();
}

function prevQuestion(){
  if(!state.currentExam || state.currentExam.currentIndex === 0) return;
  state.currentExam.currentIndex--;
  renderExam();
}

function nextQuestion(){
  if(!state.currentExam) return;
  const idx = state.currentExam.currentIndex;
  if(idx === state.currentExam.questions.length - 1){
    finishExam();
  } else {
    state.currentExam.currentIndex++;
    renderExam();
  }
}

function exitExam(){
  if(state.currentExam && !state.currentExam.submitted){
    clearInterval(state.timerInterval);
    state.timerInterval = null;
    const overlay = el('exam-exit-dialog-overlay');
    if(overlay){
      overlay.classList.remove('hidden');
    } else {
      if(confirm('هل تريد الخروج وحفظ تقدم الامتحان الحالي؟')){
        saveExamState();
      } else {
        clearExamState();
      }
      state.currentExam = null;
      goToHome();
    }
  } else {
    state.currentExam = null;
    goToHome();
  }
}

function handleExamExitChoice(choice){
  const overlay = el('exam-exit-dialog-overlay');
  if(overlay) overlay.classList.add('hidden');
  if(choice === 1){
    clearExamState();
    state.currentExam = null;
    goToHome();
  } else if(choice === 2){
    saveExamState();
    state.currentExam = null;
    goToHome();
  } else if(choice === 3){
    startTimer();
  }
}

function startTimer(){
  clearInterval(state.timerInterval);
  const timerEl = el('exam-timer');
  if(!timerEl) return;
  state.timerInterval = setInterval(()=>{
    if(!state.currentExam || state.currentExam.submitted){
      clearInterval(state.timerInterval);
      state.timerInterval = null;
      return;
    }
    const elapsed = Date.now() - state.currentExam.startTime;
    const mins = Math.floor(elapsed / 60000);
    const secs = Math.floor((elapsed % 60000) / 1000);
    timerEl.textContent = mins.toString().padStart(2,'0') + ':' + secs.toString().padStart(2,'0');
  }, 1000);
}

function finishExam(){
  if(!state.currentExam) return;
  clearInterval(state.timerInterval);
  state.timerInterval = null;
  state.currentExam.submitted = true;
  state.currentExam.endTime = Date.now();
  recordExamMemory();
  saveProgressFromExam();
  clearExamState();
  renderResultScreen();
  showScreen('result-screen');
}

function calculateScore(exam){
  let correct = 0;
  let wrong = 0;
  let unanswered = 0;
  exam.questions.forEach((q, i) => {
    const ans = exam.answers[i];
    if(ans === null) unanswered++;
    else if(isAnswerCorrect(q, ans)) correct++;
    else wrong++;
  });
  const total = exam.questions.length;
  const score = total ? Math.round((correct / total) * 100) : 0;
  return { correct, wrong, unanswered, total, score };
}

function renderResultScreen(){
  if(!state.currentExam) return;
  const stats = calculateScore(state.currentExam);
  el('result-score-percent').textContent = `${stats.score}%`;
  el('result-score-ratio').textContent = `${stats.correct}/${stats.total}`;
  if(stats.score >= 80){
    el('result-feedback').textContent = 'أداء عبقري وممتاز جداً! واصل تفوقك.';
    playCelebrateSound();
  } else if(stats.score >= 50){
    el('result-feedback').textContent = 'عمل رائع وناجح! يمكنك تحسين النتيجة أكثر.';
    playCelebrateSound();
  } else {
    el('result-feedback').textContent = 'تحتاج إلى مزيد من المراجعة والمذاكرة، بالتوفيق.';
  }
  el('res-correct-count').textContent = stats.correct;
  el('res-wrong-count').textContent = stats.wrong;
  el('res-skipped-count').textContent = stats.unanswered;
  const elapsed = (state.currentExam.endTime || Date.now()) - state.currentExam.startTime;
  const mins = Math.floor(elapsed / 60000);
  const secs = Math.floor((elapsed % 60000) / 1000);
  el('res-time-spent').textContent = `${mins.toString().padStart(2,'0')}:${secs.toString().padStart(2,'0')}`;
  el('review-container').classList.add('hidden');
  el('btn-toggle-review').textContent = 'مراجعة الإجابات';
}

function toggleReviewAnswers(){
  const container = el('review-container');
  if(!container || !state.currentExam) return;
  if(!container.classList.contains('hidden')){
    container.classList.add('hidden');
    el('btn-toggle-review').textContent = 'مراجعة الإجابات';
    return;
  }
  el('btn-toggle-review').textContent = 'إخفاء المراجعة';
  container.innerHTML = state.currentExam.questions.map((q, idx) => {
    const userAns = state.currentExam.answers[idx];
    const correctIdx = getCorrectIndex(q);
    const isCorrect = userAns === correctIdx;
    return `<div class="review-item ${isCorrect?'correct':'wrong'}">
      <div class="review-item-header">السؤال ${idx + 1} (${isCorrect?'صحيح':'خاطئ'})</div>
      <p class="review-item-text">${escapeHtml(q.text)}</p>
      <div class="review-options">
        ${q.options.map((opt, i) => {
          let cls = 'review-option';
          if(i === correctIdx) cls += ' correct';
          if(userAns === i && !isCorrect) cls += ' wrong';
          return `<div class="${cls}">${LETTERS[i] || i+1}) ${escapeHtml(opt)}</div>`;
        }).join('')}
      </div>
      <p class="review-explanation"><strong>الشرح:</strong> ${escapeHtml(q.explanation || 'لا يوجد شرح متوفر.')}</p>
    </div>`;
  }).join('');
  container.classList.remove('hidden');
}

function restartExamCurrent(){
  if(!state.currentExam) return;
  const questions = state.currentExam.questions.map(prepareQuestionForExam);
  startExamSession(questions, state.currentExam.mode, state.currentExam.direction, state.currentExam.sectionType, state.currentExam.extraTime, state.currentExam.meta);
}

function saveProgressFromExam(){
  if(!state.currentExam || state.currentExam.meta?.excludeFromStats) return;
  const meta = state.currentExam.meta;
  if(!meta || !meta.historyGroups) return;
  meta.historyGroups.forEach(g => {
    const key = getGroupProgressKey(g.type, meta.historySubjectName, g.name);
    state.currentExam.questions.forEach((q, i) => {
      if(state.currentExam.answers[i] !== null && isAnswerCorrect(q, state.currentExam.answers[i])){
        addProgressId(key, q.id);
      }
    });
  });
  saveProgressStore();
}

function getGroupProgressKey(type, subjectName, groupName){
  return `${type}:${subjectName}/${groupName}`;
}
function getAnsweredCountForKey(key){
  return state.progress[key]?.questionIds?.length || 0;
}

function addQuestionToWrongBank(q){
  if(!state.wrongQuestions.some(x => x.id === q.id)){
    state.wrongQuestions.push(q);
    saveWrongQuestions();
  }
}
function toggleFavoriteExam(qid){
  const pos = state.favorites.indexOf(qid);
  if(pos > -1) state.favorites.splice(pos, 1);
  else state.favorites.push(qid);
  saveFavorites();
  const favBtn = document.querySelector('.question-actions .icon-btn');
  if(favBtn) favBtn.classList.toggle('active', pos === -1);
}

function startBrowseMode(subject){
  let questions = [];
  if(subject.lectures) subject.lectures.forEach(g => questions = questions.concat(g.questions));
  if(subject.years) subject.years.forEach(g => questions = questions.concat(g.questions));
  if(subject.ai) subject.ai.forEach(g => questions = questions.concat(g.questions));
  if(!questions.length){
    showToast('لا توجد أسئلة متوفرة للتصفح.','error');
    return;
  }
  renderBrowseScreen(questions, `تصفح أسئلة: ${subject.name}`);
}

function renderBrowseScreen(questions, title){
  if(el('browse-title')) el('browse-title').textContent = title;
  const container = el('browse-container');
  if(!container) return;
  container.innerHTML = questions.map((q, idx) => {
    const fav = state.favorites.includes(q.id);
    const correctIdx = getCorrectIndex(q);
    return `<div class="browse-question-card">
      <div class="browse-q-header">
        <span>السؤال ${idx + 1}</span>
        <button class="icon-btn ${fav?'active':''}" onclick="toggleFavoriteBrowse('${q.id}', this)">⭐</button>
      </div>
      <p class="browse-q-text">${escapeHtml(q.text)}</p>
      <div class="browse-options">
        ${q.options.map((opt, i) => {
          let cls = 'browse-option';
          if(i === correctIdx) cls += ' correct';
          return `<div class="${cls}"><strong>${LETTERS[i] || i+1}</strong> ${escapeHtml(opt)}</div>`;
        }).join('')}
      </div>
      <div class="browse-explanation-box">
        <strong>التبرير والشرح:</strong> ${escapeHtml(q.explanation || 'لا يوجد شرح.')}
      </div>
    </div>`;
  }).join('');
  showScreen('browse-screen');
}

function toggleFavoriteBrowse(qid, btn){
  const pos = state.favorites.indexOf(qid);
  if(pos > -1) state.favorites.splice(pos, 1);
  else state.favorites.push(qid);
  saveFavorites();
  if(btn) btn.classList.toggle('active', pos === -1);
}

function openCollectionsPage(type, subject){
  let sourceQuestions = [];
  if(subject.lectures) subject.lectures.forEach(g => sourceQuestions = sourceQuestions.concat(g.questions));
  if(subject.years) subject.years.forEach(g => sourceQuestions = sourceQuestions.concat(g.questions));
  if(subject.ai) subject.ai.forEach(g => sourceQuestions = sourceQuestions.concat(g.questions));
  const list = type === 'favorites' ? state.favorites : state.wrongQuestions.map(x=>x.id);
  const questions = sourceQuestions.filter(q => list.includes(q.id));
  if(el('collections-title')) el('collections-title').textContent = `${type==='favorites'?'المفضلة':'الأسئلة الخاطئة'} - ${subject.name}`;
  const container = el('collections-container');
  if(!container) return;
  if(!questions.length){
    container.innerHTML = `<div class="empty-state"><p>لا توجد أسئلة متوفرة في هذا القسم لهذه المادة.</p></div>`;
    showScreen('collections-screen');
    return;
  }
  container.innerHTML = questions.map((q, idx) => {
    const correctIdx = getCorrectIndex(q);
    return `<div class="browse-question-card">
      <div class="browse-q-header">السؤال ${idx + 1}</div>
      <p class="browse-q-text">${escapeHtml(q.text)}</p>
      <div class="browse-options">
        ${q.options.map((opt, i) => {
          let cls = 'browse-option';
          if(i === correctIdx) cls += ' correct';
          return `<div class="${cls}"><strong>${LETTERS[i] || i+1}</strong> ${escapeHtml(opt)}</div>`;
        }).join('')}
      </div>
      <div class="browse-explanation-box">
        <strong>الشرح:</strong> ${escapeHtml(q.explanation || 'لا يوجد شرح.')}
      </div>
    </div>`;
  }).join('');
  showScreen('collections-screen');
}

function recordExamMemory(){
  if(!state.currentExam) return;
  const stats = calculateScore(state.currentExam);
  const memory = {
    id: hashString(Date.now() + Math.random().toString()),
    subjectName: state.currentExam.subjectName,
    endedAt: Date.now(),
    mode: state.currentExam.mode,
    correct: stats.correct,
    total: stats.total,
    score: stats.score,
    durationMs: Date.now() - state.currentExam.startTime,
    groups: state.currentExam.meta?.historyGroups || []
  };
  state.examHistory.push(memory);
  saveMemoryStores();
}

function openChecklist(){
  renderChecklist();
  showScreen('checklist-screen');
}
function renderChecklist(){
  const container = el('checklist-container');
  if(!container) return;
  if(!state.subjects.length){
    container.innerHTML = '<div class="empty-state"><p>لا توجد مواد متوفرة للـ Checklist.</p></div>';
    return;
  }
  container.innerHTML = sortSubjects(state.subjects).map(subject => {
    const stats = calculateLectureChecklistStats(subject);
    return `<div class="checklist-subject-card" onclick="openChecklistSubject('${subject.id}')">
      <div class="checklist-subject-info">
        <div class="checklist-subject-name">${escapeHtml(subject.name)}</div>
        <div class="checklist-subject-progress">${stats.completed}/${stats.total} محاضرات مكتملة (${stats.percentage}%)</div>
      </div>
      <div class="progress-bar"><span style="width:${stats.percentage}%"></span></div>
    </div>`;
  }).join('');
}

function openChecklistSubject(sid){
  const subject = state.subjects.find(s=>s.id===sid);
  if(!subject) return;
  state.currentSubject = subject;
  if(el('checklist-subject-title')) el('checklist-subject-title').textContent = subject.name;
  renderChecklistSubject();
  showScreen('checklist-subject-screen');
}
function renderChecklistSubject(){
  const container = el('checklist-subject-container');
  if(!container || !state.currentSubject) return;
  const lectures = state.currentSubject.lectures || [];
  if(!lectures.length){
    container.innerHTML = '<div class="empty-state"><p>لا توجد محاضرات متوفرة في هذه المادة.</p></div>';
    return;
  }
  container.innerHTML = lectures.map(g => {
    const isCompleted = !!state.checklistCompleted[g.id];
    return `<div class="checklist-item-row ${isCompleted?'completed':''}" onclick="toggleChecklistLectureClick('${g.id}')">
      <div class="checklist-checkbox-ui">${isCompleted?'✓':''}</div>
      <div class="checklist-item-text-wrap">
        <div class="checklist-item-name">${escapeHtml(g.name)}</div>
        <div class="checklist-item-sub">${g.questions.length} سؤال</div>
      </div>
    </div>`;
  }).join('');
}

function toggleChecklistLectureClick(gid){
  state.checklistCompleted[gid] = !state.checklistCompleted[gid];
  saveChecklistStore();
  renderChecklistSubject();
}

function openSubjectStats(sid){
  const subject = state.subjects.find(s=>s.id===sid);
  if(!subject) return;
  state.currentSubject = subject;
  if(el('subject-stats-title')) el('subject-stats-title').textContent = `إحصائيات: ${subject.name}`;
  renderSubjectStats();
  showScreen('subject-stats-screen');
}

function renderSubjectStats(){
  const container = el('subject-stats-container');
  if(!container || !state.currentSubject) return;
  const subject = state.currentSubject;
  const lectureAnalytics = getSectionAnalytics(subject, 'lecture');
  const yearAnalytics = getSectionAnalytics(subject, 'year');
  const aiAnalytics = getSectionAnalytics(subject, 'ai');
  container.innerHTML = `
    ${renderSectionAnalyticsCard(subject, 'lecture', 'قسم المحاضرات الداخلي', '📚', lectureAnalytics)}
    ${renderSectionAnalyticsCard(subject, 'year', 'قسم أسئلة السنوات السابقة', '📅', yearAnalytics)}
    ${renderSectionAnalyticsCard(subject, 'ai', 'قسم تجميعات الذكاء الاصطناعي', '🧠', aiAnalytics)}
  `;
}

function openHistoryDeleteModal(){
  const select = el('history-delete-filter-subject');
  if(select){
    select.innerHTML = '<option value="all">كل المواد والسجل السلوكي</option>' + 
      sortSubjects(state.subjects).map(s=>`<option value="${escapeAttribute(s.name)}">${escapeHtml(s.name)}</option>`).join('');
  }
  renderHistoryDeleteList();
  el('history-delete-modal').classList.remove('hidden');
}
function toggleHistoryDeleteModal(show){
  el('history-delete-modal').classList.toggle('hidden', !show);
}
function renderHistoryDeleteList(){
  const container = el('history-delete-list');
  if(!container) return;
  const filterVal = el('history-delete-filter-subject').value;
  let history = state.examHistory.slice().sort((a,b)=>b.endedAt-a.endedAt);
  if(filterVal !== 'all'){
    history = history.filter(x => x.subjectName === filterVal);
  }
  if(!history.length){
    container.innerHTML = '<div class="empty-state"><p>لا توجد امتحانات مسجلة متوافقة.</p></div>';
    return;
  }
  container.innerHTML = history.map(exam => {
    return `<div class="history-delete-item">
      <input type="checkbox" data-id="${exam.id}">
      <div class="history-item-details">
        <strong>${escapeHtml(exam.subjectName)}</strong> - ${exam.score}% (${exam.correct}/${exam.total})
        <br><small>${formatDateTime(exam.endedAt)}</small>
      </div>
    </div>`;
  }).join('');
}

function selectAllHistoryDeleteItems(checked){
  document.querySelectorAll('#history-delete-list input[type="checkbox"]').forEach(cb => cb.checked = checked);
}
function confirmDeleteHistoryItems(){
  const checkedBoxes = document.querySelectorAll('#history-delete-list input[type="checkbox"]:checked');
  if(!checkedBoxes.length){
    showToast('لم يتم تحديد أي عنصر لحذفه.','error');
    return;
  }
  askConfirm('هل أنت متأكد تماماً من رغبتك بحذف العناصر المحددة من سجل التاريخ الفعلي؟', () => {
    const idsToRemove = Array.from(checkedBoxes).map(cb => cb.getAttribute('data-id'));
    state.examHistory = state.examHistory.filter(x => !idsToRemove.includes(x.id));
    saveMemoryStores();
    renderHistoryDeleteList();
    showToast('تم حذف العناصر المحددة بنجاح.');
  });
}

function openResetModal(){
  el('reset-step-1').classList.remove('hidden');
  el('reset-step-2').classList.add('hidden');
  el('btn-reset-main').textContent = 'متابعة التهيئة';
  el('reset-modal').classList.remove('hidden');
}
function closeResetModal(){
  el('reset-modal').classList.add('hidden');
}
function toggleResetSubjectsSelection(){
  const val = el('reset-scope-select').value;
  const wrapper = el('reset-subjects-sub-wrapper');
  if(val === 'custom'){
    wrapper.innerHTML = sortSubjects(state.subjects).map(s => {
      return `<div class="checkbox-item">
        <input type="checkbox" id="reset-sub-${s.id}" value="${s.id}" checked>
        <label for="reset-sub-${s.id}">${escapeHtml(s.name)}</label>
      </div>`;
    }).join('');
    wrapper.classList.remove('hidden');
  } else {
    wrapper.classList.add('hidden');
  }
}

function showResetConfirmation(){
  const step1 = el('reset-step-1');
  if(!step1.classList.contains('hidden')){
    step1.classList.add('hidden');
    el('reset-step-2').classList.remove('hidden');
    el('btn-reset-main').textContent = 'تأكيد الحذف النهائي';
  } else {
    executeAppReset();
  }
}

function executeAppReset(){
  const scope = el('reset-scope-select').value;
  let targetSubjectIds = [];
  if(scope === 'custom'){
    document.querySelectorAll('#reset-subjects-sub-wrapper input:checked').forEach(cb => {
      targetSubjectIds.push(cb.value);
    });
    if(!targetSubjectIds.length){
      showToast('يرجى تحديد مادة واحدة على الأقل.','error');
      openResetModal();
      return;
    }
  } else {
    targetSubjectIds = state.subjects.map(s => s.id);
  }
  const targetSubjectNames = state.subjects.filter(s => targetSubjectIds.includes(s.id)).map(s => s.name);
  if(el('reset-opt-progress').checked){
    for(const key in state.progress){
      if(targetSubjectNames.some(name => key.includes(`:${name}/`))){
        delete state.progress[key];
      }
    }
    saveProgressStore();
  }
  if(el('reset-opt-history').checked){
    state.examHistory = state.examHistory.filter(x => !targetSubjectNames.includes(x.subjectName));
    saveMemoryStores();
  }
  if(scope === 'all'){
    if(el('reset-opt-favorites').checked){ state.favorites = []; saveFavorites(); }
    if(el('reset-opt-wrong').checked){ state.wrongQuestions = []; saveWrongQuestions(); }
    if(el('reset-opt-checklist').checked){ state.checklistCompleted = {}; saveChecklistStore(); }
    if(el('reset-opt-settings').checked){ state.settings = Object.assign({}, DEFAULT_SETTINGS); saveSettings(); applySettings(); }
  }
  closeResetModal();
  showToast('تمت تهيئة وإعادة تعيين البيانات المحددة بنجاح.');
  goToHome();
}

function togglePinSubject(sid, event){
  if(event) event.stopPropagation();
  const pins = state.subjectPreferences.pinned || [];
  const pos = pins.indexOf(sid);
  if(pos > -1) pins.splice(pos, 1);
  else pins.push(sid);
  state.subjectPreferences.pinned = pins;
  saveSubjectPreferences();
  renderSubjects();
}

function openSettings(){
  showScreen('settings-screen');
}
function goToHome(){
  showScreen('home-screen');
}
function goHome(){
  showScreen('home-screen');
}
function goBack(){
  const activeScreen = document.querySelector('.screen.active').id;
  if(activeScreen === 'subjects-screen' || activeScreen === 'checklist-screen' || activeScreen === 'statistics-screen' || activeScreen === 'settings-screen'){
    goToHome();
  } else if(activeScreen === 'selection-screen'){
    showScreen('subjects-screen');
  } else if(activeScreen === 'browse-screen' || activeScreen === 'collections-screen'){
    showScreen('subjects-screen');
  } else if(activeScreen === 'checklist-subject-screen'){
    showScreen('checklist-screen');
  } else if(activeScreen === 'subject-stats-screen'){
    showScreen('statistics-screen');
  } else if(activeScreen === 'exam-screen'){
    exitExam();
  } else {
    goToHome();
  }
}

function openStatsExclusionDialog(){
  const container = el('stats-exclusion-subjects-list');
  if(!container) return;
  container.innerHTML = sortSubjects(state.subjects).map(s => {
    const isExcluded = state.statsExclusions.excludedSubjects.includes(s.id);
    return `<div class="checkbox-item">
      <input type="checkbox" id="exclude-sub-${s.id}" value="${s.id}" ${isExcluded?'checked':''}>
      <label for="exclude-sub-${s.id}">${escapeHtml(s.name)}</label>
    </div>`;
  }).join('');
  el('exclude-sections-lectures').checked = !!state.statsExclusions.excludedSections?.lectures;
  el('exclude-sections-years').checked = !!state.statsExclusions.excludedSections?.years;
  el('exclude-sections-ai').checked = !!state.statsExclusions.excludedSections?.ai;
  el('stats-exclusion-modal').classList.remove('hidden');
}
function closeStatsExclusionDialog(){
  el('stats-exclusion-modal').classList.add('hidden');
}
function saveStatsExclusions(){
  const excludedSubjects = [];
  document.querySelectorAll('#stats-exclusion-subjects-list input:checked').forEach(cb => {
    excludedSubjects.push(cb.value);
  });
  state.statsExclusions.excludedSubjects = excludedSubjects;
  if(!state.statsExclusions.excludedSections) state.statsExclusions.excludedSections = {};
  state.statsExclusions.excludedSections.lectures = el('exclude-sections-lectures').checked;
  state.statsExclusions.excludedSections.years = el('exclude-sections-years').checked;
  state.statsExclusions.excludedSections.ai = el('exclude-sections-ai').checked;
  persistStatsExclusions();
  closeStatsExclusionDialog();
  renderStatisticsPage();
  showToast('تم تحديث الاستثناءات الإحصائية الكلية.');
}

function openSubjectStatsSettings(){
  if(!state.currentSubject) return;
  const sid = state.currentSubject.id;
  el('sub-settings-goal').value = state.subjectStatsSettings[sid]?.goal || '';
  el('sub-settings-order').value = state.subjectStatsSettings[sid]?.order || 'completion-asc';
  el('subject-stats-settings-modal').classList.remove('hidden');
}
function closeSubjectStatsSettings(){
  el('subject-stats-settings-modal').classList.add('hidden');
}
function applySubjectStatsSettings(){
  if(!state.currentSubject) return;
  const sid = state.currentSubject.id;
  if(!state.subjectStatsSettings[sid]) state.subjectStatsSettings[sid] = {};
  state.subjectStatsSettings[sid].goal = parseInt(el('sub-settings-goal').value, 10) || 0;
  state.subjectStatsSettings[sid].order = el('sub-settings-order').value;
  persistSubjectStatsSettings();
  closeSubjectStatsSettings();
  renderSubjectStats();
  showToast('تم حفظ خيارات إحصائيات المادة الحالية.');
}

function init(){
  loadSettings();
  loadProgress();
  loadFavorites();
  loadWrongQuestions();
  loadSubjectPreferences();
  loadStatsExclusions();
  loadSubjectStatsSettings();
  loadMemoryStores();
  loadChecklistStore();
  applySettings();
  primeAudioUnlock();
  prepareStaticEffectAudio();
  
  const savedExam = localStorage.getItem(STORAGE_KEYS.examState);
  if(savedExam){
    try {
      const parsed = JSON.parse(savedExam);
      if(parsed && parsed.questions && parsed.questions.length > 0){
        const resumeOverlay = el('exam-resume-dialog-overlay');
        if(resumeOverlay){
          resumeOverlay.classList.remove('hidden');
        } else {
          if(confirm('هل ترغب في استئناف الامتحان السابق المتروك من حيث توقفت؟')){
            state.currentExam = parsed;
            renderExam();
            startTimer();
            showScreen('exam-screen');
          } else {
            clearExamState();
            goToHome();
          }
        }
      } else {
        goToHome();
      }
    } catch(e) {
      clearExamState();
      goToHome();
    }
  } else {
    goToHome();
  }
}

function handleExamResumeChoice(resume){
  const resumeOverlay = el('exam-resume-dialog-overlay');
  if(resumeOverlay) resumeOverlay.classList.add('hidden');
  if(resume){
    const savedExam = localStorage.getItem(STORAGE_KEYS.examState);
    if(savedExam){
      try {
        state.currentExam = JSON.parse(savedExam);
        renderExam();
        startTimer();
        showScreen('exam-screen');
      } catch(e){
        clearExamState();
        goToHome();
      }
    } else {
      goToHome();
    }
  } else {
    clearExamState();
    goToHome();
  }
}

window.onload = init;

window.el=el; window.changeTheme=changeTheme; window.changeSound=changeSound; window.changeVolume=changeVolume;
window.toggleDarkMode=toggleDarkMode; window.toggleBackgroundSoundEnabled=toggleBackgroundSoundEnabled;
window.toggleFeedbackSounds=toggleFeedbackSounds; window.toggleAnimations=toggleAnimations; window.toggleSettings=toggleSettings;
window.toggleExamSettings=toggleExamSettings; window.showToast=showToast; window.showDialog=showDialog;
window.hideDialog=hideDialog; window.dialogConfirmAction=dialogConfirmAction; window.dialogCancelAction=dialogCancelAction;
window.openExams=openExams; window.openBrowseMode=openBrowseMode; window.openFavorites=openFavorites;
window.openWrongQuestions=openWrongQuestions; window.filterSubjects=filterSubjects; window.togglePinSubject=togglePinSubject;
window.switchSelectionTab=switchSelectionTab; window.toggleGroupSelection=toggleGroupSelection;
window.startBrowseFromSelection=startBrowseFromSelection; window.startExamFromSelection=startExamFromSelection;
window.selectExamOption=selectExamOption; window.prevQuestion=prevQuestion; window.nextQuestion=nextQuestion;
window.exitExam=exitExam; window.handleExamExitChoice=handleExamExitChoice; window.handleExamResumeChoice=handleExamResumeChoice;
window.finishExam=finishExam; window.toggleReviewAnswers=toggleReviewAnswers; window.restartExamCurrent=restartExamCurrent;
window.toggleFavoriteBrowse=toggleFavoriteBrowse; window.toggleFavoriteExam=toggleFavoriteExam;
window.toggleResetSubjectsSelection=toggleResetSubjectsSelection; window.showResetConfirmation=showResetConfirmation;
window.closeResetModal=closeResetModal; window.openResetModal=openResetModal; window.openHistoryDeleteModal=openHistoryDeleteModal;
window.toggleHistoryDeleteModal=toggleHistoryDeleteModal; window.renderHistoryDeleteList=renderHistoryDeleteList;
window.selectAllHistoryDeleteItems=selectAllHistoryDeleteItems; window.confirmDeleteHistoryItems=confirmDeleteHistoryItems;
window.openStatisticsPage=openStatisticsPage; window.closeStatisticsPage=closeStatisticsPage; window.renderStatisticsPage=renderStatisticsPage;
window.openSubjectStats=openSubjectStats; window.renderSubjectStats=renderSubjectStats; window.openStatsExclusionDialog=openStatsExclusionDialog;
window.closeStatsExclusionDialog=closeStatsExclusionDialog; window.saveStatsExclusions=saveStatsExclusions;
window.openSubjectStatsSettings=openSubjectStatsSettings; window.closeSubjectStatsSettings=closeSubjectStatsSettings;
window.applySubjectStatsSettings=applySubjectStatsSettings; window.openChecklist=openChecklist; window.renderChecklist=renderChecklist;
window.openChecklistSubject=openChecklistSubject; window.renderChecklistSubject=renderChecklistSubject; window.toggleChecklistLectureClick=toggleChecklistLectureClick;
window.goToHome=goToHome; window.goHome=goHome; window.goBack=goBack; window.handleSubjectCardClick=handleSubjectCardClick;
