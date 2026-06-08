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
function showScreen(id){ document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active')); const t=el(id); if(t) t.classList.add('active'); }
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
      <div class="stats-lecture-progress">
        <div class="stats-row"><span>${type==='year' ? 'الدفعة' : (type==='ai' ? 'ملف AI' : 'المحاضرة')}</span><strong>${Math.max(0,row.total-row.remaining)}/${row.total}</strong></div>
        <div class="progress-bar"><span style="width:${row.percentage}%"></span></div>
      </div>
    </div>
  `).join('') : '<div class="stats-empty-note">لا توجد عناصر ضمن هذا القسم.</div>';
  return `
    <div class="stats-section-card stats-section-accent" style="--section-accent:${palette.accent};--section-accent-bg:${palette.bg};">
      <div class="stats-section-head">
        <div class="stats-section-title">${icon} ${label}</div>
        <div class="stats-meta-pill">${analytics.total} سؤال</div>
        <div class="stats-meta-pill">${analytics.remaining} متبقٍّ</div>
        <div class="stats-meta-pill">${analytics.percentage}%</div>
      </div>
      <div class="progress-bar" style="margin-top:10px;"><span style="width:${analytics.percentage}%"></span></div>
      <div class="stats-lecture-list">${rowsHtml}</div>
    </div>
  `;
}
function openSubjectStats(subjectId){
  const subject = state.subjects.find(s => s.id === subjectId);
  if(!subject) return;
  state.currentSubject = subject;
  renderSubjectStats();
  showScreen('subject-stats-screen');
}
function closeSubjectStats(){ state.currentSubject = null; showScreen('statistics-screen'); renderStatisticsPage(); }
function renderSubjectStats(){
  const subject = state.currentSubject;
  if(!subject) return;
  const settings = getSubjectVisibilitySettings(subject.id);
  const t = theme();
  if(el('subject-stats-name')) el('subject-stats-name').textContent = subject.name;
  const total = getSubjectTotalQuestions(subject);
  const answered = getSubjectAnsweredCount(subject);
  const remaining = Math.max(0,total-answered);
  const pct = total > 0 ? Math.round((answered/total)*100) : 0;
  if(el('subject-stats-summary')){
    el('subject-stats-summary').innerHTML = `
      <div class="progress-card">
        <h4>${t.icons.subject} ${escapeHtml(subject.name)}</h4>
        <p><span>إجمالي الأسئلة</span><strong>${total}</strong></p>
        <p><span>المنجز</span><strong>${answered}</strong></p>
        <p><span>المتبقي</span><strong>${remaining}</strong></p>
        <div class="progress-bar"><span style="width:${pct}%"></span></div>
        <p><span>نسبة الإنجاز</span><strong>${pct}%</strong></p>
      </div>
    `;
  }
  const sections = [];
  if(subject.lectures.length && !isSectionExcluded('lecture') && settings.lectures !== false) sections.push(renderSectionAnalyticsCard(subject,'lecture','المحاضرات',t.icons.lectures,getSectionAnalytics(subject,'lecture')));
  if(subject.years.length && !isSectionExcluded('year') && settings.years !== false) sections.push(renderSectionAnalyticsCard(subject,'year','السنوات',t.icons.years,getSectionAnalytics(subject,'year')));
  if(subject.ai.length && !isSectionExcluded('ai') && settings.ai !== false) sections.push(renderSectionAnalyticsCard(subject,'ai','الذكاء الاصطناعي',t.icons.ai,getSectionAnalytics(subject,'ai')));
  if(el('subject-stats-sections')) el('subject-stats-sections').innerHTML = sections.length ? sections.join('') : '<div class="empty-state"><p>لا توجد أقسام مرئية لهذه المادة حالياً.</p></div>';
}
function openSubjectCategoryFromStats(){ return; }
function openSubjectStatsSettings(subjectId){
  const actualSubjectId = subjectId || state.currentSubject?.id;
  const subject = state.subjects.find(s => s.id === actualSubjectId);
  if(!subject) return;
  state.statsModalSubjectId = actualSubjectId;
  el('subject-stats-modal-subject-name').textContent = subject.name;
  const settings = getSubjectVisibilitySettings(subject.id);
  const container = el('subject-sections-toggle-list');
  const sections = [];
  if(subject.lectures.length) sections.push({ id:'lectures', label:'المحاضرات', checked: settings.lectures !== false });
  if(subject.years.length) sections.push({ id:'years', label:'السنوات', checked: settings.years !== false });
  if(subject.ai.length) sections.push({ id:'ai', label:'الذكاء الاصطناعي', checked: settings.ai !== false });
  if(sections.length === 0) container.innerHTML = '<div class="stats-empty-note">لا توجد أقسام متاحة للإعدادات.</div>';
  else container.innerHTML = sections.map(sec => `
    <label style="display:flex; align-items:center; gap:10px; margin-bottom:12px;">
      <input type="checkbox" data-section="${sec.id}" ${sec.checked ? 'checked' : ''}> ${sec.label}
    </label>
  `).join('');
  el('subject-stats-settings-modal').classList.remove('hidden');
}
function closeSubjectStatsSettings(){ el('subject-stats-settings-modal').classList.add('hidden'); }
function applySubjectStatsSettings(){
  const subjectId = state.statsModalSubjectId;
  const subject = state.subjects.find(s=>s.id===subjectId);
  if(!subject) return;
  const settings = { lectures: true, years: true, ai: true };
  const checkboxes = document.querySelectorAll('#subject-sections-toggle-list input[data-section]');
  checkboxes.forEach(cb => {
    const section = cb.dataset.section;
    if(section === 'lectures') settings.lectures = cb.checked;
    if(section === 'years') settings.years = cb.checked;
    if(section === 'ai') settings.ai = cb.checked;
  });
  state.subjectStatsSettings[subject.id] = settings;
  persistSubjectStatsSettings();
  if(el('subject-stats-screen') && el('subject-stats-screen').classList.contains('active')) renderSubjectStats();
  else renderStatisticsPage();
  closeSubjectStatsSettings();
}
function openStatsExclusionDialog(){
  const container = el('subject-exclusions-list');
  const subjects = sortSubjects(state.subjects);
  const excludedSet = getExcludedSubjectsSet();
  container.innerHTML = subjects.map(sub => `
    <label style="display:flex; align-items:center; gap:10px; margin-bottom:8px;">
      <input type="checkbox" data-subject-id="${sub.id}" ${excludedSet.has(sub.id) ? 'checked' : ''}> ${escapeHtml(sub.name)}
    </label>
  `).join('');
  if(el('exclude-lectures')) el('exclude-lectures').checked = !!state.statsExclusions.excludedSections.lectures;
  if(el('exclude-years')) el('exclude-years').checked = !!state.statsExclusions.excludedSections.years;
  if(el('exclude-ai')) el('exclude-ai').checked = !!state.statsExclusions.excludedSections.ai;
  el('stats-exclusion-modal').classList.remove('hidden');
}
function closeStatsExclusionDialog(){ el('stats-exclusion-modal').classList.add('hidden'); }
function saveStatsExclusions(){}
function applyStatsExclusions(){
  const excludedSubjects = [];
  document.querySelectorAll('#subject-exclusions-list input[data-subject-id]').forEach(cb => { if(cb.checked) excludedSubjects.push(cb.dataset.subjectId); });
  state.statsExclusions.excludedSubjects = excludedSubjects;
  state.statsExclusions.excludedSections = {
    lectures: el('exclude-lectures') ? !!el('exclude-lectures').checked : false,
    years: el('exclude-years') ? !!el('exclude-years').checked : false,
    ai: el('exclude-ai') ? !!el('exclude-ai').checked : false
  };
  persistStatsExclusions();
  renderStatisticsPage();
  closeStatsExclusionDialog();
}
function openResetModal(){
  const container = el('reset-subjects-list');
  const subjects = sortSubjects(state.subjects);
  container.innerHTML = subjects.map(sub => `
    <label style="display:flex; align-items:center; gap:10px; margin-bottom:8px;">
      <input type="checkbox" data-subject-id="${sub.id}" class="reset-subject-checkbox"> ${escapeHtml(sub.name)}
    </label>
  `).join('');
  state.resetSelectedSubjects = [];
  const step1 = el('reset-step1');
  const step2 = el('reset-step2');
  if(step1) step1.classList.remove('hidden');
  if(step2) step2.classList.add('hidden');
  el('reset-stats-modal').classList.remove('hidden');
}
function closeResetModal(){ el('reset-stats-modal').classList.add('hidden'); }
function showResetConfirmation(){
  const selected = Array.from(document.querySelectorAll('.reset-subject-checkbox:checked')).map(cb => cb.dataset.subjectId);
  if(selected.length === 0){ showToast('يرجى اختيار مادة واحدة على الأقل.', 'error'); return; }
  state.resetSelectedSubjects = selected;
  const allSubjects = sortSubjects(state.subjects);
  const selectedNames = selected.map(id => allSubjects.find(s => s.id === id)?.name || id).join('، ');
  const isAll = selected.length === allSubjects.length;
  const msg = isAll ? 'أنت على وشك إعادة ضبط جميع بيانات التقدم (جميع المواد). هذا الإجراء لا يمكن التراجع عنه.' : `أنت على وشك إعادة ضبط بيانات التقدم للمواد التالية: ${selectedNames}. هذا الإجراء لا يمكن التراجع عنه.`;
  el('reset-confirm-msg').innerHTML = `<p style="margin-bottom:16px;">${escapeHtml(msg)}</p>`;
  el('reset-step1').classList.add('hidden');
  el('reset-step2').classList.remove('hidden');
}
function goResetStep1(){ el('reset-step1').classList.remove('hidden'); el('reset-step2').classList.add('hidden'); }
function executeResetStatistics(){
  const selected = state.resetSelectedSubjects;
  const allSubjects = sortSubjects(state.subjects);
  const toDelete = new Set(selected);
  const newProgress = {};
  for(const [key, value] of Object.entries(state.progress)){
    let keep = true;
    for(const subject of allSubjects){
      if(toDelete.has(subject.id)){
        if(key === `subject:${subject.name}`) keep = false;
        if(key.startsWith(`lecture:${subject.name}/`)) keep = false;
        if(key.startsWith(`year:${subject.name}/`)) keep = false;
        if(key.startsWith(`ai:${subject.name}/`)) keep = false;
      }
    }
    if(keep) newProgress[key] = value;
  }
  state.progress = newProgress;
  saveProgressStore();
  renderStatisticsPage();
  closeResetModal();
  showToast('تم إعادة ضبط البيانات للمواد المحددة.', 'success');
  updateStatisticsIfOpen();
  renderMemories();
}
function toggleStatistics(){ openStatisticsPage(); }
function updateStatisticsIfOpen(){
  if(el('statistics-screen') && el('statistics-screen').classList.contains('active')) renderStatisticsPage();
  if(el('subject-stats-screen') && el('subject-stats-screen').classList.contains('active')) renderSubjectStats();
}

function getCurrentBrowseSubjects(){
  if(state.browseMode==='all' || state.browseMode==='checklist') return sortSubjects(state.subjects);
  const idSet = new Set(state.browseMode==='favorites' ? state.favorites : state.wrongQuestions);
  const filtered = state.subjects.map(subject => {
    const reduceGroups = groups => groups.map(g => ({...g, questions:g.questions.filter(q=>idSet.has(q.id))})).filter(g=>g.questions.length>0);
    const lectures = reduceGroups(subject.lectures || []);
    const years = reduceGroups(subject.years || []);
    const ai = reduceGroups(subject.ai || []);
    const all = lectures.flatMap(g=>g.questions).concat(years.flatMap(g=>g.questions)).concat(ai.flatMap(g=>g.questions));
    return {...subject, lectures, years, ai, allQuestions: all, totalQuestions: all.length, totalLectures: lectures.length + years.length + ai.length};
  }).filter(s=>s.totalQuestions>0);
  return sortSubjects(filtered);
}

function setEmptyText(text, icon='📁'){ if(el('subjects-empty-text')) el('subjects-empty-text').textContent=text; const empty=el('subjects-empty'); const ic=empty?empty.querySelector('.empty-icon'):null; if(ic) ic.textContent=icon; }
function subjectMetaRows(subject){
  const lectureCount = subject.lectures.length;
  const lectureQuestions = countQuestions(subject.lectures);
  const rows = [
    `<div><span>Lectures</span><strong>${lectureCount}</strong></div>`,
    `<div><span>Questions</span><strong>${lectureQuestions}</strong></div>`
  ];
  if(subject.years.length){ rows.push(`<div><span>Years</span><strong><span>Batchs ${subject.years.length}</span><small>${countQuestions(subject.years)}Q</small></strong></div>`); }
  if(subject.ai.length){ rows.push(`<div><span>AI Questions</span><strong>${countQuestions(subject.ai)}</strong></div>`); }
  return rows.join('');
}
function renderSubjects(){
  const container=el('subjects-list'); const empty=el('subjects-empty'); if(!container||!empty) return;
  state.displayedSubjects=getCurrentBrowseSubjects();
  const searchTerm=String(el('subjects-search')?el('subjects-search').value:'').trim().toLowerCase();
  const t=theme(); const pinnedSet=new Set(state.subjectPreferences.pinned||[]);
  const visible=state.displayedSubjects.filter(s=>s.name.toLowerCase().includes(searchTerm));
  const titleMap={all:'Exams', favorites:'Favorite Questions', wrong:'Wrong Questions'};
  if(el('subjects-screen-title')) el('subjects-screen-title').textContent=titleMap[state.browseMode] || 'Exams';
  const hint = el('exams-hint-bar'); if(hint) hint.classList.toggle('hidden', state.browseMode !== 'all');
  if(!state.displayedSubjects.length){ empty.classList.remove('hidden'); container.innerHTML=''; if(state.browseMode==='wrong') setEmptyText('لا توجد أسئلة خاطئة حتى الآن.','❌'); else if(state.browseMode==='favorites') setEmptyText('لا توجد أسئلة مفضلة حتى الآن.','⭐'); else setEmptyText('التحميل جارٍ','🐦‍🔥'); return; }
  empty.classList.add('hidden');
  container.innerHTML=visible.map(subject=>{
    const pinned=pinnedSet.has(subject.id);
    return `<div class="subject-card${state.openSubjectActionId===subject.id?' actions-open':''}" data-subject-id="${subject.id}" onclick="handleSubjectOpen('${subject.id}',event)" onmousedown="startSubjectLongPress('${subject.id}')" ontouchstart="startSubjectLongPress('${subject.id}')" onmouseup="cancelSubjectLongPress()" onmouseleave="cancelSubjectLongPress()" ontouchend="cancelSubjectLongPress()" ontouchcancel="cancelSubjectLongPress()">${pinned?'<span class="subject-pin-badge">📌 مثبت</span>':''}<div class="subject-card-top"><div class="subject-icon-box">${t.icons.subject}</div><div class="subject-title-wrap"><div class="subject-badge-text">${escapeHtml(subject.name)}</div></div></div><div class="subject-meta">${subjectMetaRows(subject)}</div>${state.browseMode==='all'?`<div class="subject-actions" onclick="event.stopPropagation()"><button class="subject-action-btn" onclick="moveSubject('${subject.id}','up')">⬆️ أعلى</button><button class="subject-action-btn" onclick="moveSubject('${subject.id}','down')">⬇️ أسفل</button><button class="subject-action-btn" onclick="togglePinSubject('${subject.id}')">${pinned?'📍 إلغاء التثبيت':'📌 تثبيت بالأعلى'}</button></div>`:''}</div>`;
  }).join('');
  if(!visible.length) container.innerHTML='<div class="empty-state"><div class="empty-icon">🔎</div><p>لا توجد مواد مطابقة للبحث.</p></div>';
}
function filterSubjects(){ renderSubjects(); }
function openExams(){ state.browseMode='all'; renderSubjects(); showScreen('subjects-screen'); }
function openChecklist(){ state.browseMode='checklist'; renderChecklist(); showScreen('checklist-screen'); }
function openSection(section){
  if(section==='wrong'){ state.browseMode='wrong'; renderSubjects(); showScreen('subjects-screen'); }
  else if(section==='favorites'){ state.browseMode='favorites'; renderSubjects(); showScreen('subjects-screen'); }
  else if(section==='checklist'){ openChecklist(); }
  else if(section==='search'){ showScreen('search-screen'); if(el('search-input')) el('search-input').value=''; if(el('search-results')) el('search-results').innerHTML=''; }
  else openExams();
}
function backToSubjects(){ renderSubjects(); showScreen('subjects-screen'); }
function moveSubject(subjectId,direction){ normalizeSubjectPreferences(); const arr=state.subjectPreferences.order.slice(); const idx=arr.indexOf(subjectId); if(idx===-1) return; const target=direction==='up'?idx-1:idx+1; if(target<0||target>=arr.length) return; [arr[idx],arr[target]]=[arr[target],arr[idx]]; state.subjectPreferences.order=arr; saveSubjectPreferences(); state.subjects=sortSubjects(state.subjects); renderSubjects(); openSubjectActions(subjectId); updateStatisticsIfOpen(); renderMemories(); renderChecklist(); }
function togglePinSubject(subjectId){ normalizeSubjectPreferences(); const pinned=new Set(state.subjectPreferences.pinned||[]); if(pinned.has(subjectId)) pinned.delete(subjectId); else pinned.add(subjectId); state.subjectPreferences.pinned=Array.from(pinned); saveSubjectPreferences(); state.subjects=sortSubjects(state.subjects); renderSubjects(); openSubjectActions(subjectId); updateStatisticsIfOpen(); renderMemories(); renderChecklist(); }
function openSubjectActions(subjectId){ state.openSubjectActionId=subjectId; document.querySelectorAll('.subject-card').forEach(card=>card.classList.toggle('actions-open', card.getAttribute('data-subject-id')===subjectId)); }
function closeSubjectActions(){ state.openSubjectActionId=null; document.querySelectorAll('.subject-card').forEach(card=>card.classList.remove('actions-open')); }
function startSubjectLongPress(subjectId){ if(state.browseMode!=='all') return; clearTimeout(state.longPressTimer); state.longPressTimer=setTimeout(()=>openSubjectActions(subjectId),420); }
function cancelSubjectLongPress(){ clearTimeout(state.longPressTimer); state.longPressTimer=null; }
function handleSubjectOpen(subjectId,event){ if(event && event.target && event.target.closest('.subject-action-btn')) return; if(state.openSubjectActionId===subjectId) return; openSubject(subjectId); }

function renderChecklist(){
  const container = el('checklist-list');
  if(!container) return;
  const subjects = sortSubjects(state.subjects);
  if(!subjects.length){ container.innerHTML = '<div class="empty-state"><div class="empty-icon">📭</div><p>لا توجد مواد بعد.</p></div>'; return; }
  container.innerHTML = subjects.map(subject => {
    const checklistStats = calculateLectureChecklistStats(subject);
    return `
      <div class="selection-item checklist-subject-tile" onclick="openChecklistSubject('${subject.id}')">
        <div>
          <div class="checklist-subject-tile-title">${escapeHtml(subject.name)}</div>
          <small style="color:var(--text-light)">الإجمالي ${checklistStats.total} · المنجز ${checklistStats.completed} · المتبقي ${checklistStats.remaining}</small>
        </div>
        <div class="checklist-subject-tile-arrow">‹</div>
      </div>
    `;
  }).join('');
}
function openChecklistSubject(subjectId){ const subject = state.subjects.find(s => s.id === subjectId); if(!subject) return; state.currentSubject = subject; if(el('checklist-subject-title')) el('checklist-subject-title').textContent = subject.name; renderChecklistSubject(); showScreen('checklist-subject-screen'); }
function closeChecklistSubject(){ state.currentSubject = null; renderChecklist(); showScreen('checklist-screen'); }
function renderChecklistSubject(){
  const subject = state.currentSubject;
  if(!subject) return;
  const stats = calculateLectureChecklistStats(subject);
  if(el('checklist-subject-summary')) el('checklist-subject-summary').innerHTML = `
      <div class="progress-card">
        <h4>☑️ ${escapeHtml(subject.name)}</h4>
        <div class="checklist-summary-grid">
          <div class="checklist-summary-card"><p><span>الإجمالي</span><strong>${stats.total}</strong></p></div>
          <div class="checklist-summary-card"><p><span>المنجز</span><strong>${stats.completed}</strong></p></div>
          <div class="checklist-summary-card"><p><span>المتبقي</span><strong>${stats.remaining}</strong></p></div>
          <div class="checklist-summary-card"><p><span>النسبة المئوية</span><strong>${stats.percentage}%</strong></p></div>
        </div>
        <div class="progress-bar" style="margin-top:12px;"><span style="width:${stats.percentage}%"></span></div>
      </div>`;
  if(el('checklist-subject-lectures')) el('checklist-subject-lectures').innerHTML = subject.lectures.length ? subject.lectures.map(group => { const checked = !!state.checklistCompleted[group.id]; return `<label class="checklist-lecture-row"><input type="checkbox" ${checked?'checked':''} onchange="toggleChecklistLecture('${group.id}')"><span class="checklist-lecture-name ${checked?'completed':''}">${escapeHtml(group.name)}</span><span class="checklist-lecture-count">${group.questions.length} سؤال</span></label>`; }).join('') : '<div class="empty-state"><p>لا توجد محاضرات ضمن هذه المادة.</p></div>';
}
function toggleChecklistSubject(subjectId){ openChecklistSubject(subjectId); }
function toggleChecklistLecture(groupId){ state.checklistCompleted[groupId] = !state.checklistCompleted[groupId]; saveChecklistStore(); renderChecklist(); if(el('checklist-subject-screen') && el('checklist-subject-screen').classList.contains('active')) renderChecklistSubject(); updateStatisticsIfOpen(); }

function openSubject(subjectId){ state.currentSubject=state.displayedSubjects.find(s=>s.id===subjectId) || state.subjects.find(s=>s.id===subjectId) || null; if(!state.currentSubject){ showToast('المادة غير موجودة.','error'); return; } const t=theme(); el('subject-sections-title').textContent=state.currentSubject.name; el('subject-sections-summary').innerHTML=`<div class="subject-summary-grid"><div><span>${t.icons.lectures} المحاضرات</span><strong>${state.currentSubject.lectures.length}</strong></div><div><span>${t.icons.years} Years</span><strong>${state.currentSubject.years.length}</strong></div><div><span>${t.icons.ai} AI</span><strong>${state.currentSubject.ai.length}</strong></div><div><span>${t.icons.progress} إجمالي الأسئلة</span><strong>${state.currentSubject.totalQuestions}</strong></div></div>`; const cards=[]; if(state.currentSubject.lectures.length) cards.push(buildCategoryCard('lectures','Lectures','Lectures',state.currentSubject.lectures.length,countQuestions(state.currentSubject.lectures),true)); if(state.currentSubject.years.length) cards.push(buildCategoryCard('years','Years','Years',state.currentSubject.years.length,countQuestions(state.currentSubject.years),true)); if(state.currentSubject.ai.length || (state.browseMode==='all' && state.currentSubject.hasAiFolder)) cards.push(buildCategoryCard('ai','AI','AI',state.currentSubject.ai.length,countQuestions(state.currentSubject.ai),state.currentSubject.ai.length>0 || (state.browseMode==='all' && state.currentSubject.hasAiFolder))); el('subject-categories').innerHTML=cards.join('') || '<div class="empty-state"><div class="empty-icon">📭</div><p>لا توجد ملفات TXT بعد داخل هذه المادة.</p></div>'; showScreen('subject-sections-screen'); }
function countQuestions(groups){ return groups.reduce((sum,g)=>sum+g.questions.length,0); }
function buildCategoryCard(type,title,badgeText,itemCount,totalQuestions,enabled){ if(!enabled) return ''; return `<button class="category-card" onclick="openSubjectCategory('${type}')"><span class="category-badge">${badgeText}</span><div class="category-meta"><div><span>المحاضرات</span><strong>${itemCount}</strong></div><div><span>الأسئلة</span><strong>${totalQuestions}</strong></div></div></button>`; }
function openSubjectCategory(type){ if(!state.currentSubject) return; let groups=[], title=''; let placeholder='ابحث...'; if(type==='lectures'){ groups=state.currentSubject.lectures; title='Lectures'; placeholder='ابحث عن اسم المحاضرة...'; } else if(type==='years'){ groups=state.currentSubject.years; title='Years'; placeholder='ابحث عن الدفعة...'; } else { groups=state.currentSubject.ai; title='AI'; placeholder='ابحث عن ملف AI...'; } showSelectionScreen(groups, title, { backContext:'subject', searchable:true, searchPlaceholder:placeholder, sectionType:type, collectionType: state.browseMode!=='all' ? state.browseMode : null, displayLabel: state.currentSubject.name + ' · ' + title }); }
function backFromSelection(){ if(state.currentSelectionMeta && state.currentSelectionMeta.backContext==='subject' && state.currentSubject) openSubject(state.currentSubject.id); else goHome(); }

function showSelectionScreen(groups,title,meta){ state.selectedGroups=[]; state.currentGroups=groups.slice(); state.selectedMode=null; state.selectedDirection=null; state.extraTime=0; state.extraTimeAdded=false; state.currentSelectionMeta=meta||{}; showScreen('selection-screen'); el('selection-title').textContent=title; const searchContainer=el('selection-search-container'); const searchInput=el('selection-search'); if(meta&&meta.searchable){ searchContainer.classList.remove('hidden'); searchInput.value=''; searchInput.placeholder=meta.searchPlaceholder||'ابحث...'; } else { searchContainer.classList.add('hidden'); searchInput.value=''; } const list=el('selection-list'); const t=theme(); list.innerHTML=''; groups.forEach((group,idx)=>{ const icon=group.type==='ai'?t.icons.ai:(group.type==='year'?t.icons.years:t.icons.lectures); const item=document.createElement('div'); item.className='selection-item'; item.setAttribute('data-group-name',(group.name+' '+(group.subjectName||'')).toLowerCase()); item.innerHTML=`<input type="checkbox" id="group-${idx}" onchange="toggleGroupSelection(${idx})"><label for="group-${idx}" style="width:100%; cursor:pointer;"><strong>${icon} ${escapeHtml(group.name)}</strong><br><small style="color:var(--text-muted)">${group.questions.length} questions</small></label>`; item.addEventListener('click',function(event){ if(event.target.closest('input')||event.target.closest('label')) return; const cb=item.querySelector('input'); cb.checked=!cb.checked; toggleGroupSelection(idx); }); list.appendChild(item); }); el('selection-footer').classList.add('hidden'); el('direction-selection').classList.add('hidden'); el('timer-options').classList.add('hidden'); el('start-section').classList.add('hidden'); document.querySelectorAll('.btn-mode').forEach(btn=>btn.classList.remove('active')); document.querySelectorAll('.btn-direction').forEach(btn=>btn.classList.remove('active')); }
function filterSelectionList(){ const term=String(el('selection-search').value||'').toLowerCase().trim(); document.querySelectorAll('#selection-list .selection-item').forEach(item=>{ const name=item.getAttribute('data-group-name')||''; item.style.display=name.includes(term)?'':''; }); }
function toggleGroupSelection(idx){ const existing=state.selectedGroups.indexOf(idx); if(existing>-1) state.selectedGroups.splice(existing,1); else state.selectedGroups.push(idx); document.querySelectorAll('#selection-list .selection-item').forEach((item,itemIdx)=>item.classList.toggle('selected', state.selectedGroups.includes(itemIdx))); updateSelectionFooter(); }
function updateSelectionFooter(){ const footer=el('selection-footer'); const totalQuestions=state.selectedGroups.reduce((sum,idx)=>sum+state.currentGroups[idx].questions.length,0); if(state.selectedGroups.length>0){ footer.classList.remove('hidden'); el('selected-count').textContent=totalQuestions+' questions selected'; const input=el('question-count-input'); input.max=totalQuestions; input.value=totalQuestions; el('max-questions-label').textContent='/ '+totalQuestions; } else footer.classList.add('hidden'); state.selectedMode=null; state.selectedDirection=null; el('direction-selection').classList.add('hidden'); el('timer-options').classList.add('hidden'); el('start-section').classList.add('hidden'); document.querySelectorAll('.btn-mode').forEach(btn=>btn.classList.remove('active')); document.querySelectorAll('.btn-direction').forEach(btn=>btn.classList.remove('active')); }
function selectMode(mode){ state.selectedMode=mode; state.selectedDirection=null; state.extraTime=0; state.extraTimeAdded=false; document.querySelectorAll('.btn-mode').forEach(btn=>btn.classList.remove('active')); el(mode==='training'?'btn-training-mode':'btn-exam-mode').classList.add('active'); document.querySelectorAll('.btn-direction').forEach(btn=>btn.classList.remove('active')); el('direction-selection').classList.remove('hidden'); el('timer-options').classList.add('hidden'); el('start-section').classList.add('hidden'); }
function selectDirection(direction){ state.selectedDirection=direction; document.querySelectorAll('.btn-direction').forEach(btn=>btn.classList.remove('active')); el(direction==='oneway'?'btn-oneway':'btn-twoway').classList.add('active'); if(state.selectedMode==='exam'){ const count=parseInt(el('question-count-input').value,10)||0; el('base-time-display').textContent=count+' min'; el('extra-time-display').textContent='+0 min'; el('total-time-display').textContent=count+' min'; el('timer-options').classList.remove('hidden'); const btn=el('btn-add-extra'); btn.disabled=false; btn.textContent='+ إضافة 5 دقائق'; btn.classList.remove('active'); state.extraTime=0; state.extraTimeAdded=false; } else el('timer-options').classList.add('hidden'); el('start-section').classList.remove('hidden'); }
function addExtraTime(){ const count=parseInt(el('question-count-input').value,10)||0; const btn=el('btn-add-extra'); if(!state.extraTimeAdded){ state.extraTime=5; state.extraTimeAdded=true; el('extra-time-display').textContent='+5 min'; el('total-time-display').textContent=(count+5)+' min'; btn.disabled=false; btn.textContent='− إزالة 5 دقائق'; btn.classList.add('active'); } else { state.extraTime=0; state.extraTimeAdded=false; el('extra-time-display').textContent='+0 min'; el('total-time-display').textContent=count+' min'; btn.disabled=false; btn.textContent='+ إضافة 5 دقائق'; btn.classList.remove('active'); } }
function confirmStartExam(){ try{ if(!state.selectedMode || !state.selectedDirection){ showToast('يرجى اختيار النمط واتجاه التنقل.','error'); return; } const count=parseInt(el('question-count-input').value,10); if(!count || count<1){ showToast('يرجى إدخال عدد صحيح من الأسئلة.','error'); return; } let questions=[]; state.selectedGroups.forEach(idx=>{ if(state.currentGroups[idx] && Array.isArray(state.currentGroups[idx].questions)) questions=questions.concat(state.currentGroups[idx].questions); }); if(!questions.length){ showToast('لا توجد أسئلة متاحة للبدء.','error'); return; } const selectedGroupObjects=state.selectedGroups.map(idx=>state.currentGroups[idx]).filter(Boolean); const historySubjectName=selectedGroupObjects[0]?.subjectName || state.currentSubject?.name || 'Unknown Subject'; const historyGroups=selectedGroupObjects.map(g=>({ name:g.name, type:g.type || state.currentSelectionMeta?.sectionType || 'lecture' })); const randomizedQuestions = shuffleArray(questions).slice(0, count).map(prepareQuestionForExam); startExamSession(randomizedQuestions, state.selectedMode, state.selectedDirection, state.currentSelectionMeta ? state.currentSelectionMeta.sectionType : 'custom', state.extraTime, { collectionType: state.currentSelectionMeta ? state.currentSelectionMeta.collectionType : null, displayLabel: state.currentSelectionMeta ? state.currentSelectionMeta.displayLabel : 'Exam', historySubjectName, historyGroups }); }catch(err){ console.error('confirmStartExam error', err); showToast('حدث خطأ عند بدء الامتحان. افتح Console إن استمرت المشكلة.','error'); } }
function prepareQuestionForExam(question){
  const clone = JSON.parse(JSON.stringify(question));
  const baseOptions = (clone.options || []).map(opt => stripOptionPrefix(opt));

  // نحافظ على نفس ترتيب الخيارات كما هو في ملف الـ TXT
  clone.originalOptions = baseOptions.slice();
  clone.options = baseOptions.slice();

  // نحسب الإجابة الصحيحة بناءً على الترتيب الأصلي غير المعدل
  clone.correctAnswerText = getCorrectAnswerText({
    ...clone,
    options: baseOptions,
    originalOptions: baseOptions.slice()
  });

  clone.correctAnswer = clone.correctAnswerText;
  clone.correctIndex = resolveCorrectIndex(clone.options, clone.correctAnswerText);

  return clone;
}

function startExamSession(questions,mode,direction,sourceLabel,extraMinutes,meta){ state.currentExam={ mode, direction, sourceLabel:sourceLabel||'custom', collectionType: meta && meta.collectionType ? meta.collectionType : null, displayLabel: meta && meta.displayLabel ? meta.displayLabel : (sourceLabel||'Exam'), historySubjectName: meta?.historySubjectName || null, historyGroups: meta?.historyGroups || [], questions:questions.map(q=>Object.assign({},q)), currentIndex:0, answers:new Array(questions.length).fill(null), firstAnswers:new Array(questions.length).fill(null), startTime:Date.now(), totalTime:(questions.length+(extraMinutes||0))*60*1000, submitted:false, showAnswer:false, masteredWrongIds:[] }; saveExamState(); showScreen('exam-screen'); renderExam(); if(mode==='exam') startTimer(); scrollQuestionIntoView(false); }
function renderRemoveWrongBtn(){ if(!state.currentExam || state.currentExam.collectionType!=='wrong' || state.currentExam.mode!=='training') return ''; const idx=state.currentExam.currentIndex; const q=state.currentExam.questions[idx]; const answered=state.currentExam.firstAnswers[idx]; if(answered===null || !isAnswerCorrect(q, answered) || !state.wrongQuestions.includes(q.id)) return ''; return `<button class="btn-secondary mt-20" onclick="confirmRemoveCurrentWrong()">✅ إزالة السؤال من الأخطاء</button>`; }
function startSpecialExam(questions, mode, direction){ startExamSession(shuffleArray(questions.slice()).map(prepareQuestionForExam), mode, direction||'twoway', 'special', 5, { collectionType:null, displayLabel:'Special Exam', historySubjectName:'Special Exam', historyGroups:[] }); }

function renderOptionButton(opt, i, idx, showAnswerState, selectedIndex, correctIdx){ let cls='option-btn'; if(selectedIndex===i) cls+=' selected'; if(showAnswerState){ if(i===correctIdx) cls+=' correct'; else if(selectedIndex===i && i!==correctIdx) cls+=' wrong'; } return `<button class="${cls}" onclick="selectOption(${i})"><span class="option-label">${LETTERS[i]})</span>${escapeHtml(cleanOptionDisplay(opt))}</button>`; }
function renderExam(){ if(!state.currentExam) return; const t=theme(); const questions=state.currentExam.questions; const idx=state.currentExam.currentIndex; const q=questions[idx]; if(!q) return; let progressText=t.icons.progress+' '+(idx+1)+'/'+questions.length; if(state.currentExam.mode==='training'){ const answered=state.currentExam.firstAnswers.filter(x=>x!==null).length; const correct=state.currentExam.firstAnswers.filter((ans,i)=>ans!==null && isAnswerCorrect(questions[i],ans)).length; const pct=answered>0 ? Math.round((correct/answered)*100) : 0; progressText+=' · '+t.icons.success+correct+' · '+pct+'%'; } else progressText+=' · '+(questions.length-idx)+' left'; el('exam-progress').textContent=progressText; renderGrid(); const correctIdx=getCorrectIndex(q); const showAnswerState=state.currentExam.mode==='training' && state.currentExam.showAnswer; const fav=state.favorites.includes(q.id); const answerSummaryHtml = showAnswerState ? `<div class="answer-summary"><strong>Correct Answer:</strong> <span class="answer-value">${escapeHtml(getFormattedCurrentCorrectAnswer(q))}</span></div>` : ''; el('question-container').innerHTML=`<div class="question-header"><span class="question-number">Q${escapeHtml(q.number||String(idx+1))}</span><div class="question-actions"><button class="icon-btn ${fav?'active':''}" onclick="toggleFavorite('${q.id}')">💚</button><button class="icon-btn" onclick="toggleQuestionLocation()">${t.icons.location}</button></div></div><p class="question-text">${escapeHtml(q.text)}</p><div class="options-list">${q.options.map((opt,i)=>renderOptionButton(opt,i,idx,showAnswerState,state.currentExam.answers[idx],correctIdx)).join('')}</div>${answerSummaryHtml}<div class="explanation-box ${showAnswerState?'visible':''}"><strong>Explanation:</strong> ${escapeHtml(q.explanation||'No explanation available.')}</div>${renderRemoveWrongBtn()}`; el('question-container').classList.add('exam-content-ltr'); renderExamNav(); }
function renderGrid(){ if(!state.currentExam) return; const grid=el('question-grid'); grid.innerHTML=''; state.currentExam.questions.forEach((q,idx)=>{ let cls='grid-btn'; if(idx===state.currentExam.currentIndex) cls+=' current'; else if(state.currentExam.answers[idx]!==null){ if(state.currentExam.mode==='training' && state.currentExam.firstAnswers[idx]!==null) cls+=isAnswerCorrect(q,state.currentExam.firstAnswers[idx])?' answered':' wrong'; else cls+=' answered'; } if(state.currentExam.direction==='oneway' && idx<state.currentExam.currentIndex) cls+=' disabled'; const btn=document.createElement('button'); btn.className=cls; btn.textContent=String(idx+1); btn.onclick=()=>navigateToQuestion(idx); grid.appendChild(btn); }); }
function renderExamNav(){ if(!state.currentExam) return; const nav=el('exam-nav'); const idx=state.currentExam.currentIndex, last=state.currentExam.questions.length-1; let prevBtn='<span></span>', nextBtn='<span></span>'; if(state.currentExam.direction==='twoway' && idx>0) prevBtn='<button class="btn-secondary" onclick="prevQuestion()">Previous ←</button>'; if(state.currentExam.mode==='training'){ if(state.currentExam.showAnswer) nextBtn=idx<last?'<button class="btn-primary" onclick="nextQuestion()">Next →</button>':'<button class="btn-primary" onclick="finishExam()">Finish</button>'; else if(state.currentExam.answers[idx]!==null) nextBtn='<button class="btn-small" onclick="showAnswer()">Show Answer</button>'; } else if(state.currentExam.answers[idx]!==null) nextBtn=idx<last?'<button class="btn-primary" onclick="nextQuestion()">Next →</button>':'<button class="btn-primary" onclick="finishExam()">Finish</button>'; nav.innerHTML=prevBtn + nextBtn; }
function selectOption(optionIndex){ if(!state.currentExam || state.currentExam.submitted) return; if(state.currentExam.mode==='training' && state.currentExam.showAnswer) return; const idx=state.currentExam.currentIndex; const q=state.currentExam.questions[idx]; state.currentExam.answers[idx]=optionIndex; if(state.currentExam.firstAnswers[idx]===null) state.currentExam.firstAnswers[idx]=optionIndex; const correct=isAnswerCorrect(q,optionIndex); if(state.currentExam.mode==='training'){ if(state.settings.feedbackEnabled) playEffectSound(correct?'right':'wrong'); if(correct){ state.currentExam.showAnswer=true; if(state.settings.animations!==false) showFireworks(48,12); } else { if(!state.wrongQuestions.includes(q.id)){ state.wrongQuestions.push(q.id); saveWrongQuestions(); } showToast(themeWrongMessage(),'error'); } saveExamState(); renderExam(); } else { saveExamState(); renderExam(); } }
function themeWrongMessage(){ switch(state.settings.theme){ case 'desert': return 'الجواب انحرف عن مسار القافلة.'; case 'space': return 'Trajectory mismatch. Try again.'; case 'pirates': return 'Wrong turn on the treasure map.'; case 'castle': return 'The dragon dodged that answer.'; case 'lab': return 'Experiment unstable. Re-check the sample.'; default: return 'إجابة خاطئة.'; } }
function showAnswer(){ if(!state.currentExam) return; state.currentExam.showAnswer=true; const idx=state.currentExam.currentIndex; const q=state.currentExam.questions[idx]; const ans=state.currentExam.firstAnswers[idx]; if(ans!==null && !isAnswerCorrect(q,ans) && !state.wrongQuestions.includes(q.id)){ state.wrongQuestions.push(q.id); saveWrongQuestions(); } saveExamState(); renderExam(); }
function nextQuestion(){ if(!state.currentExam) return; if(state.currentExam.currentIndex<state.currentExam.questions.length-1){ state.currentExam.currentIndex+=1; state.currentExam.showAnswer=false; saveExamState(); renderExam(); scrollQuestionIntoView(true); } }
function prevQuestion(){ if(!state.currentExam || state.currentExam.direction!=='twoway') return; if(state.currentExam.currentIndex>0){ state.currentExam.currentIndex-=1; if(state.currentExam.mode==='training') state.currentExam.showAnswer=state.currentExam.answers[state.currentExam.currentIndex]!==null; saveExamState(); renderExam(); scrollQuestionIntoView(true); } }
function navigateToQuestion(index){ if(!state.currentExam) return; if(state.currentExam.direction==='oneway' && index!==state.currentExam.currentIndex) return; state.currentExam.currentIndex=index; if(state.currentExam.mode==='training') state.currentExam.showAnswer=state.currentExam.answers[index]!==null; saveExamState(); renderExam(); scrollQuestionIntoView(true); }
function scrollQuestionIntoView(smooth){ const q=el('question-container'); if(!q) return; const top=q.getBoundingClientRect().top + window.scrollY - 12; window.scrollTo({top, behavior:smooth && state.settings.animations!==false ? 'smooth':'auto'}); }
function toggleQuestionLocation(){ if(!state.currentExam) return; const q=state.currentExam.questions[state.currentExam.currentIndex]; const parts=[]; if(q.subjectName) parts.push('المادة: '+q.subjectName); if(q.lectureName) parts.push('الملف: '+q.lectureName); if(q.batchName) parts.push('الدفعة: '+q.batchName); if(q.pageNumber) parts.push('الصفحة: '+q.pageNumber); showToast(parts.join(' | ') || 'لا توجد بيانات موقع متاحة.','info',3000); }
function confirmRemoveCurrentWrong(){ if(!state.currentExam || state.currentExam.collectionType!=='wrong') return; const q=state.currentExam.questions[state.currentExam.currentIndex]; askConfirm('هل أتقنت هذا السؤال وتريد إزالته من الأسئلة الخاطئة؟', ()=>removeWrongQuestionsByIds([q.id])); }
function removeWrongQuestionsByIds(ids){ const set=new Set(ids); state.wrongQuestions = state.wrongQuestions.filter(id=>!set.has(id)); saveWrongQuestions(); updateStatisticsIfOpen(); if(state.currentExam){ state.currentExam.masteredWrongIds = state.currentExam.masteredWrongIds.filter(id=>!set.has(id)); renderExam(); } if(state.browseMode==='wrong') renderSubjects(); showToast('تمت إزالة السؤال/الأسئلة من قائمة الأخطاء.','success'); }
function toggleGrid(){ const grid=el('question-grid'); const btn=el('btn-grid-toggle'); grid.classList.toggle('hidden'); btn.innerHTML=grid.classList.contains('hidden')?'<span>☰</span> إظهار الشبكة':'<span>☰</span> إخفاء الشبكة'; }
function exitExam(){ if(state.currentExam && !state.currentExam.submitted) askConfirm('هل تريد الخروج؟ سيتم حفظ التقدم الحالي.', ()=>{ saveExamState(); state.currentExam=null; clearInterval(state.timerInterval); state.timerInterval=null; goHome(); }); else { state.currentExam=null; goHome(); } }

function startTimer(){ clearInterval(state.timerInterval); const timerEl=el('exam-timer'); timerEl.classList.remove('hidden'); state.timerInterval=setInterval(()=>{ if(!state.currentExam || state.currentExam.submitted){ clearInterval(state.timerInterval); state.timerInterval=null; return; } const elapsed=Date.now()-state.currentExam.startTime; const remaining=state.currentExam.totalTime-elapsed; if(remaining<=0){ clearInterval(state.timerInterval); state.timerInterval=null; timeUp(); return; } const mins=Math.floor(remaining/60000); const secs=Math.floor((remaining%60000)/1000); timerEl.textContent=mins+':'+String(secs).padStart(2,'0'); timerEl.classList.toggle('timer-danger', remaining<=60000); },1000); }
function timeUp(){ if(!state.currentExam) return; const unanswered=state.currentExam.answers.filter(a=>a===null).length; showToast('انتهى الوقت! يوجد '+unanswered+' سؤالًا بدون إجابة.','error'); finishExam(); }
function recordExamMemory(){ if(!state.currentExam) return; const end = state.currentExam.endTime || Date.now(); const start = state.currentExam.startTime || end; const answers = state.currentExam.mode==='exam' ? state.currentExam.answers : state.currentExam.firstAnswers; state.currentExam.questions.forEach((q,idx)=>{ if(answers[idx]===null) return; if(!state.questionsFirstSeen[q.id]) state.questionsFirstSeen[q.id] = { ts:end, subjectName:q.subjectName || 'Unknown' }; }); const stats = calculateScore(state.currentExam); const mastered = [];
  if(state.currentExam.collectionType==='wrong'){
    state.currentExam.questions.forEach((q,idx)=>{ const ans=answers[idx]; if(ans!==null && isAnswerCorrect(q,ans) && state.wrongQuestions.includes(q.id)) mastered.push(q.id); });
    state.currentExam.masteredWrongIds = Array.from(new Set(mastered));
  }
  state.examHistory.push({ id:'exam_'+Date.now()+'_'+Math.random().toString(36).slice(2,7), startedAt:start, endedAt:end, durationMs:end-start, mode:state.currentExam.mode, sourceLabel:state.currentExam.displayLabel || state.currentExam.sourceLabel || 'Exam', collectionType:state.currentExam.collectionType || null, total:stats.total, correct:stats.correct, score:stats.score, subjectName: state.currentExam.historySubjectName || (state.currentExam.questions[0]?.subjectName || 'Unknown Subject'), groups: state.currentExam.historyGroups || [] });
  saveMemoryStores();
}
function finishExam(){ if(!state.currentExam) return; state.currentExam.submitted=true; state.currentExam.endTime=Date.now(); if(state.currentExam.mode==='exam'){ state.currentExam.questions.forEach((q,idx)=>{ const ans=state.currentExam.answers[idx]; if(ans!==null && !isAnswerCorrect(q,ans) && !state.wrongQuestions.includes(q.id)) state.wrongQuestions.push(q.id); }); saveWrongQuestions(); } clearInterval(state.timerInterval); state.timerInterval=null; saveProgress(); recordExamMemory(); clearExamState(); if(state.currentExam.mode==='exam'){ showScreen('results-screen'); showWaitingMessages(); } else showResults(); }
function saveProgress(){ if(!state.currentExam) return; const answers=state.currentExam.mode==='exam'?state.currentExam.answers:state.currentExam.firstAnswers; state.currentExam.questions.forEach((q,idx)=>{ if(answers[idx]===null) return; addProgressId('subject:'+q.subjectName,q.id); const actual=q.originalSourceType||q.sourceType; if(actual==='lecture') addProgressId('lecture:'+q.subjectName+'/'+q.lectureName,q.id); if(actual==='ai') addProgressId('ai:'+q.subjectName+'/'+q.lectureName,q.id); if(q.batchName) addProgressId('year:'+q.subjectName+'/'+q.batchName,q.id); }); saveProgressStore(); updateStatisticsIfOpen(); renderMemories(); }
function showWaitingMessages(){ const waitDiv=el('results-waiting'), contentDiv=el('results-content'), reviewDiv=el('results-review'), messageEl=el('waiting-message'); const messages=['انتظر ...','قاعد بصلّح لك الامتحان ...','استنى شوي ...','هاي قرّبت أكمل ...','أصبر ثواني ...','هيني كمّلت 🫡🐦‍🔥💚']; waitDiv.classList.remove('hidden'); reviewDiv.classList.add('hidden'); reviewDiv.innerHTML=''; contentDiv.innerHTML=''; let idx=0; messageEl.textContent=messages[0]; const interval=setInterval(()=>{ idx=Math.min(idx+1, messages.length-1); messageEl.textContent=messages[idx]; },1150); setTimeout(()=>{ clearInterval(interval); waitDiv.classList.add('hidden'); showResults(); },7000); }
function calculateScore(exam){ const questions=exam.questions; const answers=exam.mode==='exam'?exam.answers:exam.firstAnswers; const total=questions.length; const answered=answers.filter(a=>a!==null).length; const correct=answers.reduce((sum,a,idx)=>sum + (a!==null && isAnswerCorrect(questions[idx],a) ? 1 : 0),0); return {total, answered, correct, unanswered:total-answered, incorrect:answered-correct, score: total>0 ? Math.round((correct/total)*100) : 0}; }
function renderMasteredWrongButton(){ if(!state.currentExam || !state.currentExam.masteredWrongIds || !state.currentExam.masteredWrongIds.length) return ''; return `<button class="btn-secondary mt-10" onclick="confirmBulkRemoveMasteredWrong()">✅ إزالة الأسئلة التي تمكنت منها من الأسئلة الخاطئة</button>`; }
function confirmBulkRemoveMasteredWrong(){ if(!state.currentExam || !state.currentExam.masteredWrongIds || !state.currentExam.masteredWrongIds.length) return; askConfirm('سيتم إزالة كل الأسئلة التي أجبت عنها بشكل صحيح في هذا الامتحان من قائمة الأسئلة الخاطئة. هل تريد المتابعة؟', ()=>removeWrongQuestionsByIds(state.currentExam.masteredWrongIds.slice())); }
function showResults(){ if(!state.currentExam) return; const t=theme(); showScreen('results-screen'); el('results-title').textContent=t.icons.results+' '+t.texts.resultsTitle; const stats=calculateScore(state.currentExam); const timeSpent=state.currentExam.endTime ? Math.round((state.currentExam.endTime-state.currentExam.startTime)/1000) : 0; const mins=Math.floor(timeSpent/60), secs=timeSpent%60; if(stats.score>=50){ playCelebrateSound(); if(state.settings.animations!==false) showFireworks(110,24); } el('results-content').innerHTML=`<div class="result-score">${stats.score}%</div><div class="result-details"><div class="result-card"><div class="value">${stats.correct}/${stats.total}</div><div class="label">Correct</div></div><div class="result-card"><div class="value">${mins}m ${secs}s</div><div class="label">Time Spent</div></div><div class="result-card"><div class="value">${stats.unanswered}</div><div class="label">Unanswered</div></div><div class="result-card"><div class="value">${stats.incorrect}</div><div class="label">Incorrect</div></div></div><button class="btn-primary mt-20" onclick="reviewExam()">${t.icons.review} Review Questions</button>${renderMasteredWrongButton()}<button class="btn-secondary mt-10" onclick="goHome()">${t.icons.exams} Back to Home</button>`; }
function reviewExam(){ if(!state.currentExam) return; const reviewDiv=el('results-review'); reviewDiv.classList.remove('hidden'); let html='<h3 class="mt-20" style="text-align:right">'+theme().icons.review+' Review</h3>'; state.currentExam.questions.forEach((q,idx)=>{ const answersUsed = state.currentExam.mode==='exam' ? state.currentExam.answers : state.currentExam.firstAnswers; const userAnswer=answersUsed[idx]; const correctIdx=getCorrectIndex(q); const ok=userAnswer===correctIdx; html += `<div class="question-container review-question-card mt-10" style="border-inline-start:4px solid ${ok?'var(--success)':'var(--danger)'};"><div class="question-header"><span class="question-number">Q${escapeHtml(q.number||String(idx+1))}</span><span style="color:${ok?'var(--success)':'var(--danger)'};font-weight:900;">${ok?theme().icons.success+' Correct':theme().icons.error+' Wrong'}</span></div><p class="question-text">${escapeHtml(q.text)}</p><div class="options-list">${q.options.map((opt,i)=>{ let cls='option-btn'; if(i===correctIdx) cls+=' correct'; if(i===userAnswer && i!==correctIdx) cls+=' wrong'; return '<div class="'+cls+'" style="cursor:default;"><span class="option-label">'+LETTERS[i]+')</span>'+escapeHtml(cleanOptionDisplay(opt))+'</div>'; }).join('')}</div><div class="answer-summary"><strong>Correct Answer:</strong> <span class="answer-value">${escapeHtml(getFormattedCurrentCorrectAnswer(q))}</span></div><div class="explanation-box visible"><strong>Explanation:</strong> ${escapeHtml(q.explanation||'No explanation available.')}</div></div>`; }); reviewDiv.innerHTML=html; }

function populateSearchFilter(){ const filter=el('search-filter'); if(!filter) return; filter.innerHTML='<option value="all">All Subjects</option>'; state.subjects.forEach(s=>{ filter.innerHTML += '<option value="'+escapeAttribute(s.id)+'">'+escapeHtml(s.name)+'</option>'; }); }
function performSearch(){ const query=String(el('search-input').value||'').toLowerCase().trim(); const filter=el('search-filter').value; const resultsDiv=el('search-results'); if(query.length<2){ resultsDiv.innerHTML='<p style="color:var(--text-muted); text-align:center; padding:20px;">اكتب حرفين على الأقل للبحث...</p>'; return; } const t=theme(); const results=state.allQuestions.filter(q=>{ const text=[q.text,(q.options||[]).join(' '),q.explanation||'',q.batchName||'',q.lectureName||'',q.subjectName||''].join(' ').toLowerCase(); const matches=filter==='all'||q.subjectId===filter||slugify(q.subjectName)===filter; return text.includes(query) && matches; }); if(!results.length){ resultsDiv.innerHTML='<p style="color:var(--text-muted); text-align:center; padding:20px;">لا توجد نتائج مطابقة.</p>'; return; } resultsDiv.innerHTML=results.slice(0,60).map(q=>`<div class="search-result-item" onclick="openReadonly('${q.id}')"><p><strong>Q${escapeHtml(q.number||'?')}:</strong> ${escapeHtml(shortenText(q.text,140))}</p><div class="search-result-meta">${t.icons.subject} ${escapeHtml(q.subjectName||'')} · ${q.sourceType==='ai'?t.icons.ai:t.icons.lectures} ${escapeHtml(q.lectureName||'')} ${q.batchName?'· '+t.icons.years+' '+escapeHtml(q.batchName):''} ${q.pageNumber?'· '+t.icons.location+' '+escapeHtml(q.pageNumber):''}</div></div>`).join(''); }
function openReadonly(questionId){ const q=state.allQuestions.find(item=>item.id===questionId); if(!q) return; const t=theme(); const correctIdx=getCorrectIndex(q); showScreen('readonly-screen'); el('readonly-content').innerHTML=`<div class="question-header"><span class="question-number">Question ${escapeHtml(q.number||'?')}</span><div class="question-actions"><button class="icon-btn ${state.favorites.includes(q.id)?'active':''}" onclick="toggleFavorite('${q.id}'); openReadonly('${q.id}')">💚</button><button class="icon-btn" onclick="showLocation('${escapeJsString(q.subjectName)}','${escapeJsString(q.lectureName)}','${escapeJsString(q.batchName||'')}','${escapeJsString(q.pageNumber||'')}')">${t.icons.location}</button></div></div><p class="question-text">${escapeHtml(q.text)}</p><div class="options-list">${q.options.map((opt,i)=>'<div class="option-btn '+(i===correctIdx?'correct':'')+'" style="cursor:default;"><span class="option-label">'+LETTERS[i]+')</span>'+escapeHtml(cleanOptionDisplay(opt))+'</div>').join('')}</div><div class="answer-summary"><strong>Correct Answer:</strong> <span class="answer-value">${escapeHtml(getFormattedCurrentCorrectAnswer(q))}</span></div><div class="explanation-box visible"><strong>Explanation:</strong> ${escapeHtml(q.explanation||'No explanation available.')}</div>`; el('readonly-content').classList.add('readonly-ltr'); }
function closeReadonly(){ if(el('search-input') && el('search-input').value) showScreen('search-screen'); else goHome(); }
function showLocation(subjectName, lectureName, batchName, pageNumber){ const parts=[]; if(subjectName) parts.push('المادة: '+subjectName); if(lectureName) parts.push('الملف: '+lectureName); if(batchName) parts.push('الدفعة: '+batchName); if(pageNumber) parts.push('الصفحة: '+pageNumber); showToast(parts.join(' | ') || 'لا توجد بيانات موقع متاحة.','info',3000); }
function toggleFavorite(questionId){ const idx=state.favorites.indexOf(questionId); if(idx>-1) state.favorites.splice(idx,1); else state.favorites.push(questionId); saveFavorites(); if(state.currentExam && !state.currentExam.submitted) renderExam(); if(el('readonly-screen').classList.contains('active')) openReadonly(questionId); if(state.browseMode==='favorites') renderSubjects(); updateStatisticsIfOpen(); }

function getGroupProgressKey(type, subjectName, groupName){ return type+':'+subjectName+'/'+groupName; }
function getAnsweredCountForKey(key){ const entry=state.progress[key]||{questionIds:[]}; return new Set(entry.questionIds||[]).size; }
function getSectionSummary(subject, type){ const groups = type==='lecture' ? subject.lectures : type==='ai' ? subject.ai : subject.years; const totalQuestions = groups.reduce((sum,g)=>sum+g.questions.length,0); let answered = 0; groups.forEach(g=>answered += getAnsweredCountForKey(getGroupProgressKey(type, subject.name, g.name))); const pct = totalQuestions ? Math.round((answered/totalQuestions)*100) : 0; return { groups, totalQuestions, answered, pct }; }
function resetProgressFull(){ askConfirm('هل تريد إعادة ضبط جميع البيانات (جميع المواد)؟ لا يمكن التراجع عن هذا الإجراء.', ()=>{ state.progress={}; saveProgressStore(); showToast('تمت إعادة ضبط جميع بيانات التقدم.','success'); updateStatisticsIfOpen(); renderMemories(); }); }

function getStartOfWeek(date){ const d=new Date(date); d.setHours(0,0,0,0); const day=d.getDay(); d.setDate(d.getDate()-day); return d; }
function getEndOfWeek(date){ const d=getStartOfWeek(date); d.setDate(d.getDate()+6); d.setHours(23,59,59,999); return d; }
function getStartOfMonth(date){ const d=new Date(date.getFullYear(), date.getMonth(), 1); d.setHours(0,0,0,0); return d; }
function getEndOfMonth(date){ const d=new Date(date.getFullYear(), date.getMonth()+1, 0); d.setHours(23,59,59,999); return d; }
function getStartOfYear(date){ const d=new Date(date.getFullYear(), 0, 1); d.setHours(0,0,0,0); return d; }
function getEndOfYear(date){ const d=new Date(date.getFullYear(), 11, 31); d.setHours(23,59,59,999); return d; }
function aggregateMemorySeries(period, detailed, selectedSubjects){
  const entries = Object.entries(state.questionsFirstSeen || {}).map(([qid,info])=>({qid, ts:Number(info.ts||0), subjectName:info.subjectName||'غير معروف'})).filter(x=>x.ts>0).sort((a,b)=>a.ts-b.ts);
  const now=new Date();
  let labels=[]; let buckets=[]; let caption='';
  if(period==='weekly'){
    const start=getStartOfWeek(now); const end=getEndOfWeek(now); caption=`من ${start.toLocaleDateString('ar-EG')} إلى ${end.toLocaleDateString('ar-EG')}`;
    for(let i=0;i<7;i++){ const d=new Date(start); d.setDate(start.getDate()+i); const key=d.toISOString().slice(0,10); buckets.push(key); labels.push(d.toLocaleDateString('ar-EG',{weekday:'short', day:'numeric'})); }
  } else if(period==='monthly'){
    const start=getStartOfMonth(now); const end=getEndOfMonth(now); caption=`${start.toLocaleDateString('ar-EG')} — ${end.toLocaleDateString('ar-EG')}`;
    const days=end.getDate();
    for(let i=1;i<=days;i++){ const d=new Date(now.getFullYear(), now.getMonth(), i); const key=d.toISOString().slice(0,10); buckets.push(key); labels.push(String(i)); }
  } else {
    const start=getStartOfYear(now); const end=getEndOfYear(now); caption=`${start.toLocaleDateString('ar-EG')} — ${end.toLocaleDateString('ar-EG')}`;
    for(let i=0;i<12;i++){ const d=new Date(now.getFullYear(), i, 1); const key=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'); buckets.push(key); labels.push(d.toLocaleDateString('ar-EG',{month:'short'})); }
  }
  function getBucketKey(ts){ const d=new Date(ts); if(period==='yearly') return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'); d.setHours(0,0,0,0); return d.toISOString().slice(0,10); }
  const filteredEntries = entries.filter(e=>{
    const d=new Date(e.ts);
    if(period==='weekly') return d>=getStartOfWeek(now) && d<=getEndOfWeek(now);
    if(period==='monthly') return d>=getStartOfMonth(now) && d<=getEndOfMonth(now);
    return d>=getStartOfYear(now) && d<=getEndOfYear(now);
  });
  if(!detailed){ const data = buckets.map(key=>filteredEntries.filter(e=>getBucketKey(e.ts)===key).length); return {labels, series:[{name:'كل المواد', data, color:'#2563eb'}], caption}; }
  const subjects = selectedSubjects && selectedSubjects.length ? selectedSubjects.slice() : Array.from(new Set(filteredEntries.map(e=>e.subjectName))).sort();
  const series = subjects.map(subject=>({name:subject, color:getSubjectColor(subject), data:buckets.map(key=>filteredEntries.filter(e=>e.subjectName===subject && getBucketKey(e.ts)===key).length)}));
  return {labels, series, caption};
}
function drawMemoriesChart(canvas, labels, series){ const ctx=canvas.getContext('2d'); const w=canvas.width, h=canvas.height; ctx.clearRect(0,0,w,h); ctx.fillStyle='rgba(255,255,255,0.0)'; ctx.fillRect(0,0,w,h); const left=70, right=20, top=20, bottom=70; const maxVal=Math.max(1, ...series.flatMap(s=>s.data)); ctx.strokeStyle='rgba(148,163,184,.4)'; ctx.lineWidth=1; for(let i=0;i<5;i++){ const y = top + (h-top-bottom)*i/4; ctx.beginPath(); ctx.moveTo(left, y); ctx.lineTo(w-right, y); ctx.stroke(); }
  ctx.strokeStyle='rgba(100,116,139,.9)'; ctx.beginPath(); ctx.moveTo(left, top); ctx.lineTo(left, h-bottom); ctx.lineTo(w-right, h-bottom); ctx.stroke();
  ctx.fillStyle='#64748b'; ctx.font='12px Inter'; ctx.textAlign='right'; for(let i=0;i<5;i++){ const val = Math.round(maxVal - (maxVal*i/4)); const y = top + (h-top-bottom)*i/4 + 4; ctx.fillText(String(val), left-10, y); }
  const plotW = w-left-right, plotH=h-top-bottom; const step = labels.length>1 ? plotW/(labels.length-1) : plotW; labels.forEach((lab, i)=>{ const x=left + step*i; ctx.save(); ctx.translate(x, h-bottom+18); ctx.rotate(-0.35); ctx.textAlign='right'; ctx.fillStyle='#64748b'; ctx.fillText(lab, 0, 0); ctx.restore(); });
  series.forEach(s=>{ ctx.strokeStyle=s.color; ctx.fillStyle=s.color; ctx.lineWidth=2.5; ctx.beginPath(); s.data.forEach((value, i)=>{ const x=left + step*i; const y=h-bottom - (value/maxVal)*plotH; if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y); }); ctx.stroke(); s.data.forEach((value, i)=>{ const x=left + step*i; const y=h-bottom - (value/maxVal)*plotH; ctx.beginPath(); ctx.arc(x,y,3.5,0,Math.PI*2); ctx.fill(); }); });
  const legendY = h-20; ctx.textAlign='left'; series.forEach((s, idx)=>{ const x = left + idx*140; ctx.fillStyle=s.color; ctx.fillRect(x, legendY-10, 18, 4); ctx.fillStyle='#475569'; ctx.fillText(s.name, x+24, legendY-6); }); }
function toggleHistoryDeleteModal(show){ el('history-delete-modal').classList.toggle('hidden', !show); if(show) renderHistoryDeleteList(); }
function openHistoryDeleteDialog(){ toggleHistoryDeleteModal(true); }
function getCurrentHistoryFilterValue(){ return el('memories-history-filter') ? el('memories-history-filter').value : 'all'; }
function getFilteredExamHistory(){ const selected=getCurrentHistoryFilterValue(); return state.examHistory.slice().sort((a,b)=>(b.endedAt||0)-(a.endedAt||0)).filter(exam=>selected==='all' || exam.subjectName===selected); }
function getHistoryItemsForDeletion(){ const scope=el('history-delete-scope')?.value || 'visible'; if(scope==='all') return state.examHistory.slice().sort((a,b)=>(b.endedAt||0)-(a.endedAt||0)); return getFilteredExamHistory(); }
function renderHistoryDeleteList(){ const list=el('history-delete-list'); const items=getHistoryItemsForDeletion(); list.innerHTML = items.length ? items.map(item=>`<label class="selection-item selected" style="--subject-color:${getSubjectColor(item.subjectName)}"><input type="checkbox" class="history-delete-checkbox" value="${escapeAttribute(item.id)}" checked><div><div class="history-subject" style="margin-bottom:6px;">${escapeHtml(item.subjectName || 'Unknown Subject')}</div><strong>${escapeHtml(formatHistorySubLabel(item))}</strong><br><small style="color:var(--text-light)">${formatDateTime(item.endedAt)}</small></div></label>`).join('') : '<div class="stats-empty-note">لا توجد عناصر متاحة للحذف.</div>'; }
function selectAllHistoryDeleteItems(checked){ document.querySelectorAll('.history-delete-checkbox').forEach(cb=>cb.checked=checked); }
function confirmDeleteHistoryItems(){ const selected=Array.from(document.querySelectorAll('.history-delete-checkbox:checked')).map(cb=>cb.value); const totalItems=state.examHistory.length; const deleteAll=selected.length && selected.length===totalItems; if(!selected.length){ showToast('لم يتم تحديد أي عنصر للحذف.','error'); return; } askConfirm(deleteAll ? 'سيتم حذف كل السجل ولن تستطيع التراجع. هل تريد المتابعة؟' : 'سيتم حذف المحدد ولن تستطيع التراجع. هل تريد المتابعة؟', ()=>{ state.examHistory = state.examHistory.filter(item=>!selected.includes(item.id)); saveMemoryStores(); toggleHistoryDeleteModal(false); renderMemories(); showToast(deleteAll ? 'تم حذف كل السجل.' : 'تم حذف المحدد من السجل.','success'); }); }
function openMemories(){ renderMemories(); showScreen('memories-screen'); }
function switchMemoriesTab(tab){ const chartTab=el('memories-chart-tab'); const timeTab=el('memories-time-tab'); const btnChart=el('mem-tab-chart'); const btnTime=el('mem-tab-time'); if(tab==='chart'){ chartTab.classList.remove('hidden'); timeTab.classList.add('hidden'); btnChart.classList.add('active'); btnTime.classList.remove('active'); } else { chartTab.classList.add('hidden'); timeTab.classList.remove('hidden'); btnChart.classList.remove('active'); btnTime.classList.add('active'); } renderMemories(); }
function renderMemories(){ if(!el('memories-screen')) return; const subjects = sortSubjects(state.subjects).map(s=>s.name); const filters = el('memory-subject-filters'); const previousSelected = Array.from(document.querySelectorAll('#memory-subject-filters input:checked')).map(x=>x.value); if(filters){ const selection = previousSelected.length ? previousSelected : subjects.slice(); filters.innerHTML = subjects.length ? subjects.map(name=>`<label class="memory-subject-chip"><input type="checkbox" value="${escapeAttribute(name)}" ${selection.includes(name)?'checked':''} onchange="renderMemories()"> <span>${escapeHtml(name)}</span></label>`).join('') : '<div class="stats-empty-note">لا توجد مواد بعد.</div>'; }
  const historyFilter=el('memories-history-filter'); if(historyFilter){ const currentValue=historyFilter.value || 'all'; historyFilter.innerHTML='<option value="all">كل المواد</option>'+subjects.map(name=>`<option value="${escapeAttribute(name)}">${escapeHtml(name)}</option>`).join(''); historyFilter.value = subjects.includes(currentValue) ? currentValue : 'all'; }
  const period = el('memory-period') ? el('memory-period').value : 'weekly'; const mode = el('memory-view-mode') ? el('memory-view-mode').value : 'all'; const selectedSubjects = Array.from(document.querySelectorAll('#memory-subject-filters input:checked')).map(x=>x.value);
  const data = aggregateMemorySeries(period, mode==='detailed', selectedSubjects);
  if(el('memory-period-caption')) el('memory-period-caption').textContent = data.caption || '';
  const canvas = el('memories-chart'); if(canvas) drawMemoriesChart(canvas, data.labels, data.series);
  const totalUnique = Object.keys(state.questionsFirstSeen||{}).length; const totalTime = state.examHistory.reduce((sum,e)=>sum+(e.durationMs||0),0); const summary = el('memories-time-summary'); if(summary){ summary.innerHTML = `<div class="progress-card"><h4>أول دخول</h4><p><strong>${formatDateTime(state.firstVisit)}</strong></p></div><div class="progress-card"><h4>عدد الأسئلة الكلي (المُجاب عنها)</h4><p><strong>${totalUnique}</strong></p></div><div class="progress-card"><h4>الوقت الكلي بالامتحانات</h4><p><strong>${formatDuration(totalTime)}</strong></p></div>`; }
  const historyList = el('memories-history-list'); if(historyList){ const history = getFilteredExamHistory(); historyList.innerHTML = history.length ? history.map(exam=>`<div class="memory-history-item" style="--subject-color:${getSubjectColor(exam.subjectName || 'Unknown Subject')}"><div class="history-subject">${escapeHtml(exam.subjectName || 'Unknown Subject')}</div><strong>${escapeHtml(formatHistorySubLabel(exam))}</strong><br><small style="color:var(--text-light)">${formatDateTime(exam.endedAt)}<br>${exam.mode==='exam'?'امتحان فعلي':'تدريب'} · ${exam.correct}/${exam.total} · ${exam.score}% · ${formatDuration(exam.durationMs||0)}</small></div>`).join('') : '<div class="stats-empty-note">لا توجد امتحانات مطابقة.</div>'; }
}
function printMemoriesPdf(){ const selected=getCurrentHistoryFilterValue(); const history = state.examHistory.slice().sort((a,b)=>(b.endedAt||0)-(a.endedAt||0)).filter(exam=>selected==='all' || exam.subjectName===selected); const historyHtml = history.length ? history.map(exam=>{ const color=getSubjectColor(exam.subjectName || 'Unknown Subject'); const badgeTextColor=isDarkTheme() ? '#0f172a' : '#ffffff'; return `<div class="card" style="border-inline-start:6px solid ${color};"><div style="display:inline-block;padding:6px 10px;border-radius:999px;background:${color};color:${badgeTextColor};font-weight:900;margin-bottom:8px;">${escapeHtml(exam.subjectName || 'Unknown Subject')}</div><br><strong>${escapeHtml(formatHistorySubLabel(exam))}</strong><br><small>${formatDateTime(exam.endedAt)}<br>${exam.mode==='exam'?'امتحان فعلي':'تدريب'} · ${exam.correct}/${exam.total} · ${exam.score}% · ${formatDuration(exam.durationMs||0)}</small></div>`; }).join('') : '<div class="card">لا توجد امتحانات مسجلة بعد.</div>'; const html = `<html dir="rtl"><head><meta charset="utf-8"><title>ذكريات الوقت</title><style>body{font-family:Arial,sans-serif;padding:24px;direction:rtl}h1,h2{margin:0 0 12px}.card{border:1px solid #ccc;border-radius:12px;padding:12px;margin-bottom:12px}small{color:#555}</style></head><body><h1>ذكريات الوقت</h1><div class="card"><strong>أول دخول:</strong> ${formatDateTime(state.firstVisit)}</div><div class="card"><strong>عدد الأسئلة المُجاب عنها:</strong> ${Object.keys(state.questionsFirstSeen||{}).length}</div><div class="card"><strong>الوقت الكلي بالامتحانات:</strong> ${formatDuration(state.examHistory.reduce((sum,e)=>sum+(e.durationMs||0),0))}</div><h2>سجل الامتحانات</h2>${historyHtml}</body></html>`; const win = window.open('', '_blank'); win.document.open(); win.document.write(html); win.document.close(); win.focus(); setTimeout(()=>win.print(), 400); }

function showFireworks(durationFrames=80, explosionCount=18){ const canvas=el('fireworks-canvas'); if(!canvas) return; canvas.classList.remove('hidden'); const ctx=canvas.getContext('2d'); canvas.width=window.innerWidth; canvas.height=window.innerHeight; const palettes={default:['#2563eb','#38bdf8','#10b981','#f59e0b'],desert:['#f4c95d','#db9b41','#9a5b24','#fff0c9'],space:['#8b5cf6','#38bdf8','#f0abfc','#ffffff'],pirates:['#d9a740','#7d4b16','#fdf0c2','#7ec8e3'],castle:['#d4af37','#7c3f98','#f5f1dc','#9ea7d8'],lab:['#00bcd4','#7ef9ff','#15d3a2','#ffffff']}; const colors=palettes[state.settings.theme]||palettes.default; const particles=[]; const bursts=[{x:canvas.width*.3,y:canvas.height*.35},{x:canvas.width*.7,y:canvas.height*.4},{x:canvas.width*.5,y:canvas.height*.26}]; bursts.forEach(b=>{ for(let i=0;i<explosionCount;i++){ const angle=(Math.PI*2*i)/explosionCount; const speed=2.5+Math.random()*4.8; particles.push({x:b.x,y:b.y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,color:colors[Math.floor(Math.random()*colors.length)],size:Math.random()*3+1.5,life:1}); } }); let frame=0; function animate(){ ctx.clearRect(0,0,canvas.width,canvas.height); particles.forEach(p=>{ p.x+=p.vx; p.y+=p.vy; p.vy+=0.08; p.life-=0.012; if(p.life>0){ ctx.globalAlpha=p.life; ctx.fillStyle=p.color; ctx.beginPath(); ctx.arc(p.x,p.y,p.size,0,Math.PI*2); ctx.fill(); } }); frame++; if(frame<durationFrames) requestAnimationFrame(animate); else { ctx.clearRect(0,0,canvas.width,canvas.height); canvas.classList.add('hidden'); } } animate(); }

function goHome(){ const wasResults = el('results-screen').classList.contains('active'); toggleExamSettings(false); closeStatsExclusionDialog(); closeResetModal(); closeSubjectStatsSettings(); state.currentSubject=null; showScreen('home-screen'); const review=el('results-review'); if(review) review.classList.add('hidden'); if(wasResults){ setTimeout(()=>softReloadApp(), 150); } }
function softReloadApp(){ const currentAudioTime = el('bg-audio') ? el('bg-audio').currentTime : 0; renderSubjects(); updateStatisticsIfOpen(); renderChecklist(); renderMemories(); if(el('bg-audio') && state.settings.bgSoundEnabled!==false && state.settings.bgSound!=='none'){ try{ el('bg-audio').currentTime = currentAudioTime; el('bg-audio').play().catch(()=>{}); }catch(e){} } }
function checkResumeExam(){ const raw=localStorage.getItem(STORAGE_KEYS.examState); if(!raw) return; try{ const saved=JSON.parse(raw); if(!saved || saved.submitted || !Array.isArray(saved.questions) || !saved.questions.length){ clearExamState(); return; } askConfirm('يوجد امتحان غير مكتمل. هل تريد المتابعة من حيث توقفت؟', ()=>{ state.currentExam=saved; showScreen('exam-screen'); renderExam(); if(state.currentExam.mode==='exam') startTimer(); }, ()=>clearExamState()); }catch{ clearExamState(); } }

function normalizeText(text){ return String(text||'').replace(/^\uFEFF/,'').replace(/\r\n/g,'\n').replace(/\r/g,'\n').replace(/\t/g,'    ').replace(/\/\/\/\/\/\//g,'\n').trim(); }
function parseQuestionFile(raw, meta){ const text=normalizeText(raw); if(!text) return []; let blocks=text.split(/(?:^|\n)\s*###\s*(?=\n|$)/g).map(x=>x.trim()).filter(Boolean); if(blocks.length<=1){ const paragraphs=text.split(/\n{2,}/).map(x=>x.trim()).filter(Boolean); if(paragraphs.length<=1) blocks=[text]; else { blocks=[]; let current=[]; let hasCorrect=false; for(let i=0;i<paragraphs.length;i++){ const p=paragraphs[i]; const first=(p.split('\n').find(l=>l.trim())||'').trim(); const looksNew=current.length>0 && hasCorrect && !/^(Correct\s*Answer|Explanation)\s*:/i.test(first) && !/^[A-E][\)\.\-]/.test(first) && !isPageLine(first); if(looksNew){ blocks.push(current.join('\n\n').trim()); current=[]; hasCorrect=false; } current.push(p); if(/^\s*Correct\s*Answer\s*:/im.test(p)) hasCorrect=true; if(i===paragraphs.length-1 && current.length) blocks.push(current.join('\n\n').trim()); } } }
  const questions=[]; let fallback=meta.startCounter||1;
  for(let blockIndex=0; blockIndex<blocks.length; blockIndex++){
    const lines=blocks[blockIndex].split('\n').map(l=>l.trim()).filter(Boolean); if(!lines.length || !lines.some(l=>/^Correct\s*Answer\s*:/i.test(l))) continue; let questionNumber=''; let questionText=''; let options=[]; let correctAnswer=''; let explanation=''; let batchName=''; let pageNumber=''; let startIndex=0; const head=(lines[0]||'').match(/^Question\s*(\d+)\s*[:\-.]?\s*(.*)$/i); if(head){ questionNumber=head[1]||''; if(head[2]) lines[0]=head[2].trim(); else startIndex=1; } const ansIdx=lines.findIndex(l=>/^Correct\s*Answer\s*:/i.test(l)); if(ansIdx===-1) continue; const before=lines.slice(startIndex, ansIdx); const firstOpt=before.findIndex(l=>/^[A-E][\)\.\-]\s*/i.test(l)); if(firstOpt===-1) continue; questionText=before.slice(0,firstOpt).join(' ').trim() || ('Question '+fallback); options=before.slice(firstOpt).filter(l=>/^[A-E][\)\.\-]\s*/i.test(l)).map(stripOptionPrefix); correctAnswer=lines[ansIdx].replace(/^Correct\s*Answer\s*:\s*/i,'').trim(); let i=ansIdx+1; if(i<lines.length && /^Explanation\s*:/i.test(lines[i])){ const exp=[]; const first=lines[i].replace(/^Explanation\s*:\s*/i,'').trim(); if(first) exp.push(first); i++; while(i<lines.length && !isMetadataLine(lines[i])){ exp.push(lines[i]); i++; } explanation=exp.join(' ').trim(); } while(i<lines.length){ const line=lines[i]; if(isPageLine(line)) pageNumber=line; else if(!batchName && isBatchLine(line)) batchName=line; else if(!batchName && looksLikeMetadataTail(line)) batchName=line; else if(!explanation && !/^Explanation\s*:/i.test(line)) explanation=[explanation,line].filter(Boolean).join(' ').trim(); i++; } if(!questionNumber) questionNumber=String(fallback); const correctAnswerText = (()=>{ const possibleIndex = resolveCorrectIndex(options, correctAnswer); if(possibleIndex>=0 && options[possibleIndex]) return options[possibleIndex]; return stripOptionPrefix(correctAnswer); })(); const id=[slugify(meta.subjectName),slugify(meta.sourceType),slugify(meta.lectureName),slugify(questionNumber),hashString(questionText).slice(0,10)].join('__'); questions.push({id,number:questionNumber,text:questionText,options,originalOptions:options.slice(),correctAnswer,correctAnswerText,correctIndex:resolveCorrectIndex(options,correctAnswerText),explanation,batchName,pageNumber,subjectName:meta.subjectName,subjectId:meta.subjectId||slugify(meta.subjectName),lectureName:meta.lectureName,groupName:meta.lectureName,sourceType:meta.sourceType,sourcePath:meta.sourcePath}); fallback++; }
  return questions;
}
async function discoverRepository(){
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
}
async function listRepoDirectory(path){
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
}
async function fetchQuestionFile(fileItem){
  if(fileItem.download_url){
    const r=await fetch(fileItem.download_url);
    if(r.ok) return await r.text();
  }
  const repo = state.discoveredRepo;
  const branchCandidates = [repo.branch,'main','master','gh-pages'].filter((b,i,a)=>b && a.indexOf(b)===i);
  for(const branch of branchCandidates){
    const url='https://raw.githubusercontent.com/'+repo.owner+'/'+repo.repo+'/'+branch+'/'+encodeURI(fileItem.path);
    const r=await fetch(url);
    if(r.ok){
      repo.branch = branch;
      return await r.text();
    }
  }
  throw new Error('Unable to fetch file: '+fileItem.path);
}
async function buildLectureGroupFromFile(fileItem, subjectName, subjectId, sourceType, startCounter){ const text=await fetchQuestionFile(fileItem); const lectureName=fileItem.name.replace(/\.txt$/i,''); const questions=parseQuestionFile(text,{subjectName,subjectId,lectureName,sourceType,sourcePath:fileItem.path,startCounter}); if(!questions.length) return null; return {id:slugify(subjectName)+'__'+sourceType+'__'+slugify(lectureName),name:lectureName,type:sourceType,subjectName,path:fileItem.path,questions}; }
async function scanSubjectFolder(dirItem){ const items=await listRepoDirectory(dirItem.path); const lectureFiles=items.filter(it=>it.type==='file' && it.name.toLowerCase().endsWith('.txt')).sort((a,b)=>a.name.localeCompare(b.name)); const aiFolder=items.find(it=>it.type==='dir' && it.name.toLowerCase()==='ai'); let aiFiles=[]; if(aiFolder){ const aiItems=await listRepoDirectory(aiFolder.path); aiFiles=aiItems.filter(it=>it.type==='file' && it.name.toLowerCase().endsWith('.txt')).sort((a,b)=>a.name.localeCompare(b.name)); }
  const subjectId = slugify(dirItem.name);
  if(lectureFiles.length===0 && aiFiles.length===0 && !aiFolder){ return {id:subjectId,name:dirItem.name,lectures:[],ai:[],years:[],allQuestions:[],totalQuestions:0,totalLectures:0,hasAiFolder:false}; }
  const lectures=[]; const ai=[]; let counter=1; for(const f of lectureFiles){ const g=await buildLectureGroupFromFile(f,dirItem.name,subjectId,'lecture',counter); if(g){ counter+=g.questions.length; lectures.push(g);} } for(const f of aiFiles){ const g=await buildLectureGroupFromFile(f,dirItem.name,subjectId,'ai',counter); if(g){ counter+=g.questions.length; ai.push(g);} } const all=lectures.flatMap(g=>g.questions).concat(ai.flatMap(g=>g.questions)); const yearsMap=new Map(); all.forEach(q=>{ const batch=String(q.batchName||'').trim(); if(!batch) return; if(!yearsMap.has(batch)) yearsMap.set(batch,[]); yearsMap.get(batch).push(Object.assign({},q,{sourceType:'year',originalSourceType:q.sourceType})); }); const years=Array.from(yearsMap.entries()).sort((a,b)=>a[0].localeCompare(b[0],'en',{sensitivity:'base'})).map(([name,questions])=>({id:subjectId+'__year__'+slugify(name),name,type:'year',subjectName:dirItem.name,questions})); return {id:subjectId,name:dirItem.name,lectures,ai,years,allQuestions:all,totalQuestions:all.length,totalLectures:lectures.length+ai.length+years.length,hasAiFolder:!!aiFolder}; }
async function loadData(){ setEmptyText('التحميل جارٍ ...','⏳'); state.subjects=[]; state.allQuestions=[]; state.discoveredRepo=await discoverRepository(); if(!state.discoveredRepo){ renderSubjects(); renderChecklist(); return; } const root=await listRepoDirectory(''); const subjectDirs=root.filter(item=>item.type==='dir' && !IGNORE_ROOT_DIRS.has(item.name.toLowerCase())); const scanned=[]; for(const dir of subjectDirs){ const s=await scanSubjectFolder(dir); if(s) scanned.push(s); } state.subjects=sortSubjects(scanned); normalizeSubjectPreferences(); state.allQuestions=state.subjects.flatMap(s=>s.allQuestions); populateSearchFilter(); renderSubjects(); renderChecklist(); updateStatisticsIfOpen(); renderMemories(); }

window.addEventListener('DOMContentLoaded', async ()=>{
  loadSettings(); loadProgress(); loadFavorites(); loadWrongQuestions(); loadSubjectPreferences(); loadStatsExclusions(); loadSubjectStatsSettings(); loadChecklistStore(); loadMemoryStores();
  applySettings();
  const quotes = [
  'ومن لم يذق مُـر العَلُّم ِ ساعةً    تجرع ذُل الجهلِ طُـول حياتِهِ',
  'شَكَـوتُ إلى وَكيعٍ سُـوءَ حِفظي    فَـأرشدني إلى ترك المعاصي\nوأخبرني بأن العلم نُور    ونور الله لايهدى لعاصي',
  'اطــلــب العــلم ولا تــكسل فــما    أبعد الخيرات عن أهل الكسل',
  'فليسَ يجنى ثمارَ الفوزِ يانعةً منْ جنةِ العلمِ إلاَّ صادقُ الهممِ',
  'ما الفضلُ إِلا لأهلِ العلمِ إِنهمُ على الهُدى لمن استهدى أدلاءُ',
  'العلمُ زينٌ فكن للعلمِ مكتسباً وكن له طالباً ما عشتَ مقتبسا',
  'هو العلم فاركب فلك تيّاره العذب وغُص فيه لاستخراج لؤلؤه الرّطب',
  'لا توجد وصفة سحرية، ولا توجد طريقة ليس فيها العمل والتعب وبذل الجهد!',
  'الفشل ليس النهاية، بل خطوة ضرورية نحو القمة إذا تعلمت منه.',
  'العلم الذي تدرسه اليوم هو الأمل الذي ستمنحه لغيرك غدًا.',
  'دراسة الطب ماراثون وليست سباقًا قصيرًا؛ واصل التقدم بهدوء.',
  'ابدأ الآن، فالوقت المثالي لا يأتي وحده.',
  'اطلب العلم، فإن لم تنفعك شهادته نفعك أدبه.',
  'من جدَّ وجد، ومن زرع حصد.',
  'العلم يرفع بيوتًا لا عماد لها، والجهل يهدم بيت العز والشرف.',
  'ليس المجد أن لا تسقط، بل المجد أن تنهض كلما سقطت.',
  'تعب اليوم يصنع راحة الغد.',
  'العلم نور، ومن سار في النور بلغ غايته.',
  'لا تحسبن المجد تمرًا أنت آكله، لن تبلغ المجد حتى تلعق الصبر.',
  'كل ساعة دراسة تقرّبك خطوة من حلمك.',
  'النجاح مجموع جهود صغيرة تتكرر يومًا بعد يوم.',
  'إذا كانت الطريق طويلة فالعبرة بالاستمرار لا بالسرعة.',
  'العلم خير ميراث، والعمل خير شاهد.',
  'اجعل همك التعلم لا مجرد النجاح، فالنجاح يتبع المتعلمين.',
  'ما دام فيك نفس يتردد، ففرصة التفوق ما زالت قائمة.',
  'الطبيب العظيم كان يومًا طالبًا يراجع بصبر ويخطئ ويتعلم.',
  'دراسة الطب ليست اختبار ذكاء فقط، بل اختبار صبر وإرادة.',
  'من سار على الدرب وصل، ولو طال الطريق.',
  'الساعي إلى العلم كالساعي إلى كنز لا ينفد.',
  'لا تؤجل جهد اليوم إلى غدٍ فتجتمع عليك الأيام.',
  'كل صفحة تقرؤها اليوم تبني طبيبًا أفضل غدًا.'
];
  if(el('random-quote')) el('random-quote').textContent=quotes[Math.floor(Math.random()*quotes.length)];
  document.addEventListener('click',e=>{ if(!e.target.closest('.subject-card')) closeSubjectActions(); });
  primeAudioUnlock(); await prepareStaticEffectAudio();
  renderSubjects(); renderChecklist(); renderMemories();
  try{ await loadData(); }catch(err){ console.error(err); renderSubjects(); renderChecklist(); showToast('تعذر تحميل بيانات GitHub الآن. تحقّق من الاتصال أو بنية المجلدات أو تأكد من أن الفرع هو main/master/gh-pages.','error'); }
  checkResumeExam();
});

window.state=state; window.openExams=openExams; window.openSection=openSection; window.toggleStatistics=toggleStatistics; window.toggleSettings=toggleSettings; window.toggleDarkMode=toggleDarkMode; window.changeTheme=changeTheme; window.changeSound=changeSound; window.toggleBackgroundSoundEnabled=toggleBackgroundSoundEnabled; window.changeVolume=changeVolume; window.toggleFeedbackSounds=toggleFeedbackSounds; window.toggleAnimations=toggleAnimations; window.filterSubjects=filterSubjects; window.handleSubjectOpen=handleSubjectOpen; window.startSubjectLongPress=startSubjectLongPress; window.cancelSubjectLongPress=cancelSubjectLongPress; window.moveSubject=moveSubject; window.togglePinSubject=togglePinSubject; window.openSubject=openSubject; window.openSubjectCategory=openSubjectCategory; window.backFromSelection=backFromSelection; window.filterSelectionList=filterSelectionList; window.toggleGroupSelection=toggleGroupSelection; window.selectMode=selectMode; window.selectDirection=selectDirection; window.addExtraTime=addExtraTime; window.confirmStartExam=confirmStartExam; window.startSpecialExam=startSpecialExam; window.selectOption=selectOption; window.showAnswer=showAnswer; window.nextQuestion=nextQuestion; window.prevQuestion=prevQuestion; window.navigateToQuestion=navigateToQuestion; window.toggleGrid=toggleGrid; window.exitExam=exitExam; window.finishExam=finishExam; window.reviewExam=reviewExam; window.performSearch=performSearch; window.openReadonly=openReadonly; window.closeReadonly=closeReadonly; window.showLocation=showLocation; window.toggleQuestionLocation=toggleQuestionLocation; window.toggleFavorite=toggleFavorite; window.resetProgress=resetProgressFull; window.goHome=goHome; window.toggleExamSettings=toggleExamSettings; window.hideDialog=hideDialog; window.dialogConfirmAction=dialogConfirmAction; window.dialogCancelAction=dialogCancelAction; window.backToSubjects=backToSubjects; window.confirmRemoveCurrentWrong=confirmRemoveCurrentWrong; window.confirmBulkRemoveMasteredWrong=confirmBulkRemoveMasteredWrong; window.openMemories=openMemories; window.switchMemoriesTab=switchMemoriesTab; window.renderMemories=renderMemories; window.printMemoriesPdf=printMemoriesPdf; window.openHistoryDeleteDialog=openHistoryDeleteDialog; window.toggleHistoryDeleteModal=toggleHistoryDeleteModal; window.renderHistoryDeleteList=renderHistoryDeleteList; window.selectAllHistoryDeleteItems=selectAllHistoryDeleteItems; window.confirmDeleteHistoryItems=confirmDeleteHistoryItems;
window.openStatisticsPage=openStatisticsPage; window.closeStatisticsPage=closeStatisticsPage; window.renderStatisticsPage=renderStatisticsPage; window.openSubjectStats=openSubjectStats; window.closeSubjectStats=closeSubjectStats; window.renderSubjectStats=renderSubjectStats; window.openSubjectCategoryFromStats=openSubjectCategoryFromStats; window.openStatsExclusionDialog=openStatsExclusionDialog; window.closeStatsExclusionDialog=closeStatsExclusionDialog; window.saveStatsExclusions=saveStatsExclusions; window.applyStatsExclusions=applyStatsExclusions; window.openResetModal=openResetModal; window.closeResetModal=closeResetModal; window.showResetConfirmation=showResetConfirmation; window.goResetStep1=goResetStep1; window.executeResetStatistics=executeResetStatistics; window.openSubjectStatsSettings=openSubjectStatsSettings; window.closeSubjectStatsSettings=closeSubjectStatsSettings; window.applySubjectStatsSettings=applySubjectStatsSettings; window.openChecklist=openChecklist; window.renderChecklist=renderChecklist; window.toggleChecklistSubject=toggleChecklistSubject; window.toggleChecklistLecture=toggleChecklistLecture; window.openChecklistSubject=openChecklistSubject; window.closeChecklistSubject=closeChecklistSubject; window.renderChecklistSubject=renderChecklistSubject;
