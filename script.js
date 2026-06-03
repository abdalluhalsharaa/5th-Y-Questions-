// ======================= GLOBAL STATE =======================
let allQuestionsGlobal = [];
let subjectsData = new Map();
let currentSubject = null;
let currentDynamicGroups = [];
let selectedGroupIndices = [];
let selectedMode = null, selectedDirection = null, extraTime = 0;
let currentExam = null, timerInterval = null;
let favorites = [], wrongQuestions = [], progress = {};
let settings = {};

// ======================= UTILITIES =======================
function showToast(msg) { const t = document.getElementById('toast'); t.textContent = msg; t.classList.remove('hidden'); setTimeout(() => t.classList.add('hidden'), 2500); }
function showScreen(id) { document.querySelectorAll('.screen').forEach(s => s.classList.remove('active')); document.getElementById(id).classList.add('active'); }
function goHome() { window.location.reload(); }
function shuffleArray(arr) { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; }
function getCorrectIndex(q) { return ['A','B','C','D','E'].indexOf(q.correctAnswer.charAt(0).toUpperCase()); }
function isAnswerCorrect(q, idx) { return idx === getCorrectIndex(q); }

// ======================= ADVANCED PARSER (supports both formats) =======================
function parseQuestionsFromTxt(content, fileName, subjectName, isAi = false) {
    const sections = content.split('###').filter(s => s.trim());
    const questions = [];
    for (let raw of sections) {
        let lines = raw.split('\n').map(l => l.trim()).filter(l => l);
        if (lines.length < 2) continue;
        let qNumber = '', qText = '', options = [], correctAnswer = '', explanation = '', batchName = '', pageNumber = '';
        let idx = 0;
        // optional Question number
        if (lines[idx] && lines[idx].match(/^Question\s+\d+/i)) { qNumber = lines[idx].replace(/^Question\s+/i, '').trim(); idx++; }
        // question text until first option
        let textLines = [];
        while (idx < lines.length && !lines[idx].match(/^[A-E]\)/)) { textLines.push(lines[idx]); idx++; }
        qText = textLines.join(' ');
        // options A) ... B) ...
        while (idx < lines.length && lines[idx].match(/^[A-E]\)/)) { options.push(lines[idx]); idx++; }
        // Correct Answer
        while (idx < lines.length) { if (lines[idx].match(/^Correct Answer:/i)) { correctAnswer = lines[idx].replace(/^Correct Answer:\s*/i, '').trim().charAt(0).toUpperCase(); idx++; break; } idx++; }
        // Explanation
        let explLines = [];
        while (idx < lines.length) {
            if (lines[idx].match(/^Explanation:/i)) {
                explLines.push(lines[idx].replace(/^Explanation:\s*/i, ''));
                idx++;
                while (idx < lines.length && !lines[idx].match(/^(Correct Answer:|P\d+|Batch:|Iris|Aorta|[A-Za-z].*-\s*\d+)/i)) { explLines.push(lines[idx]); idx++; }
                break;
            }
            idx++;
        }
        explanation = explLines.join(' ');
        // Batch name (e.g., "Iris - 5") and Page number
        while (idx < lines.length) {
            let l = lines[idx];
            if (l.match(/^P\d+/i)) pageNumber = l;
            else if (l.match(/[A-Za-z]+\s*-\s*\d+/)) batchName = l;
            idx++;
        }
        if (!correctAnswer) continue;
        const finalNumber = qNumber || (questions.length+1).toString();
        const uniqueId = `${subjectName}|${fileName}|${finalNumber}`.replace(/\s/g, '_');
        questions.push({
            id: uniqueId, number: finalNumber, text: qText, options, correctAnswer, explanation,
            batchName: batchName || null, pageNumber, lectureName: fileName.replace('.txt',''),
            subject: subjectName, groupType: isAi ? 'ai' : 'lecture'
        });
    }
    return questions;
}

// ======================= LOAD SUBJECT (with demo data fallback) =======================
async function loadSubject(subjectName) {
    if (subjectsData.has(subjectName)) return subjectsData.get(subjectName);
    const basePath = `subjects/${subjectName}/`;
    // predefined file lists (you can extend)
    const lectureFiles = ['Pancreatitis.txt', 'ONP.txt'];
    const aiFiles = ['Pancreatitis.txt'];
    let allQs = [], lectures = [], aiLectures = [];

    // try to fetch real files, otherwise use demo data
    for (let f of lectureFiles) {
        try {
            let res = await fetch(`${basePath}${f}`);
            if (res.ok) {
                let txt = await res.text();
                let qs = parseQuestionsFromTxt(txt, f, subjectName, false);
                allQs.push(...qs);
                lectures.push({ name: f.replace('.txt',''), questions: qs, file: f });
            } else throw new Error('not found');
        } catch(e) {
            // demo fallback
            console.log(`Using demo data for ${subjectName}/${f}`);
            let demoQs = generateDemoQuestions(subjectName, f);
            allQs.push(...demoQs);
            lectures.push({ name: f.replace('.txt','') + ' (demo)', questions: demoQs });
        }
    }
    for (let f of aiFiles) {
        try {
            let res = await fetch(`${basePath}AI/${f}`);
            if (res.ok) {
                let txt = await res.text();
                let qs = parseQuestionsFromTxt(txt, f, subjectName, true);
                allQs.push(...qs);
                aiLectures.push({ name: f.replace('.txt','') + ' (AI)', questions: qs });
            } else throw new Error('AI not found');
        } catch(e) {
            let demoAi = generateDemoQuestions(subjectName, f, true);
            allQs.push(...demoAi);
            aiLectures.push({ name: f.replace('.txt','') + ' (AI demo)', questions: demoAi });
        }
    }

    // Build Year Groups from batchName inside all questions
    const yearMap = new Map();
    allQs.forEach(q => { if(q.batchName && q.batchName.trim()) { if(!yearMap.has(q.batchName)) yearMap.set(q.batchName, []); yearMap.get(q.batchName).push(q); } });
    let yearGroups = [];
    for (let [batch, qs] of yearMap.entries()) yearGroups.push({ name: batch, questions: qs, type: 'year' });

    const subjectPackage = { lectures, aiLectures, yearGroups, allQuestions: allQs };
    subjectsData.set(subjectName, subjectPackage);
    allQuestionsGlobal.push(...allQs);
    return subjectPackage;
}

// demo question generator
function generateDemoQuestions(subject, fileName, isAi=false) {
    return [{
        id: `${subject}|${fileName}|demo1`, number: '1', text: `Sample question from ${subject} - ${fileName}. What is the first line treatment?`,
        options: ['A) Option A', 'B) Option B', 'C) Option C', 'D) Option D'],
        correctAnswer: 'A', explanation: 'This is a demo explanation. Replace with real files.',
        batchName: isAi ? null : `${subject} - 2024`, pageNumber: 'P1',
        lectureName: fileName.replace('.txt',''), subject: subject, groupType: isAi ? 'ai' : 'lecture'
    }];
}

// ======================= UI FLOW =======================
async function showSubjectsScreen() {
    const subjects = ['Surgery', 'Ortho', 'Anesthesia'];
    const container = document.getElementById('subjects-list');
    container.innerHTML = '';
    for(let sub of subjects) {
        const div = document.createElement('div'); div.className = 'selection-item';
        div.innerHTML = `<strong>📁 ${sub}</strong><br><small>Click to load</small>`;
        div.onclick = async () => { showToast(`Loading ${sub}...`); await loadSubject(sub); currentSubject = sub; await showDynamicGroupsForSubject(sub); };
        container.appendChild(div);
    }
    showScreen('subjects-screen');
}

async function showDynamicGroupsForSubject(subject) {
    const data = subjectsData.get(subject);
    if(!data) return;
    currentDynamicGroups = [];
    if(data.lectures.length) data.lectures.forEach(l => currentDynamicGroups.push({ name: l.name, type: 'lecture', questions: l.questions, groupKey: `lecture_${l.name}` }));
    if(data.aiLectures.length) data.aiLectures.forEach(l => currentDynamicGroups.push({ name: l.name, type: 'ai', questions: l.questions, groupKey: `ai_${l.name}` }));
    if(data.yearGroups.length) data.yearGroups.forEach(g => currentDynamicGroups.push({ name: g.name, type: 'year', questions: g.questions, groupKey: `year_${g.name}` }));
    renderGroupSelectionScreen(currentDynamicGroups, `${subject} - Select Groups`);
}

function renderGroupSelectionScreen(groups, title) {
    selectedGroupIndices = [];
    document.getElementById('selection-title').textContent = title;
    const container = document.getElementById('selection-list');
    container.innerHTML = '';
    groups.forEach((g, idx) => {
        const item = document.createElement('div'); item.className = 'selection-item'; item.dataset.groupName = g.name.toLowerCase();
        item.innerHTML = `<input type="checkbox" id="grp-${idx}"><label for="grp-${idx}"><strong>${g.name}</strong> (${g.questions.length} q) <span style="font-size:0.7rem;">[${g.type}]</span></label>`;
        item.onclick = (e) => { if(e.target.tagName !== 'INPUT') { let cb = item.querySelector('input'); cb.checked = !cb.checked; toggleGroupSelection(groups, idx); } };
        container.appendChild(item);
    });
    document.getElementById('selection-footer').classList.add('hidden');
    document.getElementById('direction-selection').classList.add('hidden');
    document.getElementById('timer-options').classList.add('hidden');
    document.getElementById('start-section').classList.add('hidden');
    window.currentGroupList = groups;
    window.toggleGroupSelection = (list, idx) => { let pos = selectedGroupIndices.indexOf(idx); if(pos>-1) selectedGroupIndices.splice(pos,1); else selectedGroupIndices.push(idx); updateSelectionFooterGroups(); };
    window.updateSelectionFooterGroups = () => { 
        let total = selectedGroupIndices.reduce((s,i)=> s + groups[i].questions.length, 0);
        if(selectedGroupIndices.length) { document.getElementById('selection-footer').classList.remove('hidden'); document.getElementById('selected-count').innerText = `${total} questions`; document.getElementById('question-count-input').max = total; document.getElementById('question-count-input').value = Math.min(total,10); document.getElementById('max-questions-label').innerHTML = `/ ${total}`; }
        else document.getElementById('selection-footer').classList.add('hidden');
        selectedMode=null; selectedDirection=null; document.getElementById('direction-selection').classList.add('hidden'); document.getElementById('start-section').classList.add('hidden'); document.querySelectorAll('.btn-mode').forEach(b=>b.classList.remove('active'));
    };
    showScreen('selection-screen');
    document.getElementById('selection-search-container').classList.add('hidden');
}

function goBackFromSelection() { showSubjectsScreen(); }
function filterSelectionList() {}
function selectMode(mode) { selectedMode = mode; document.getElementById('direction-selection').classList.remove('hidden'); document.getElementById('start-section').classList.add('hidden'); document.querySelectorAll('.btn-mode').forEach(b=>b.classList.remove('active')); document.getElementById(mode==='training'?'btn-training-mode':'btn-exam-mode').classList.add('active'); extraTime=0; }
function selectDirection(dir) { selectedDirection = dir; document.querySelectorAll('.btn-direction').forEach(b=>b.classList.remove('active')); document.getElementById(dir==='oneway'?'btn-oneway':'btn-twoway').classList.add('active'); if(selectedMode==='exam') { let cnt = parseInt(document.getElementById('question-count-input').value); document.getElementById('base-time-display').innerText = `${cnt} min`; document.getElementById('total-time-display').innerText = `${cnt} min`; document.getElementById('timer-options').classList.remove('hidden'); } else document.getElementById('timer-options').classList.add('hidden'); document.getElementById('start-section').classList.remove('hidden'); }
function addExtraTime() { extraTime = 5; let cnt = parseInt(document.getElementById('question-count-input').value); document.getElementById('total-time-display').innerText = `${cnt+5} min`; }
function confirmStartExam() { if(!selectedMode || !selectedDirection) { showToast('Select mode & direction'); return; } let num = parseInt(document.getElementById('question-count-input').value); if(num<1) return; let allQ = []; selectedGroupIndices.forEach(i=> allQ.push(...currentDynamicGroups[i].questions)); allQ = shuffleArray(allQ).slice(0,num); currentExam = { mode: selectedMode, direction: selectedDirection, questions: allQ, currentIndex: 0, answers: new Array(allQ.length).fill(null), firstAnswers: new Array(allQ.length).fill(null), startTime: Date.now(), totalTime: (allQ.length + extraTime)*60*1000, submitted: false, showAnswer: false }; saveExamState(); showScreen('exam-screen'); renderExam(); if(selectedMode==='exam') startTimer(); }
function renderExam() { if(!currentExam) return; let q = currentExam.questions[currentExam.currentIndex]; let isFav = favorites.includes(q.id); let container = document.getElementById('question-container'); container.innerHTML = `<div class="question-header"><span>Q${q.number}</span><button class="icon-btn" onclick="toggleFavorite('${q.id}')">${isFav?'★':'☆'}</button></div><p>${q.text}</p><div class="options-list">${q.options.map((opt,i)=>`<button class="option-btn ${currentExam.answers[currentExam.currentIndex]===i?'selected':''} ${(currentExam.mode==='training' && currentExam.showAnswer)?(i===getCorrectIndex(q)?'correct':(currentExam.answers[currentExam.currentIndex]===i?'wrong':'')):''}" onclick="selectOption(${i})">${opt}</button>`).join('')}</div><div class="explanation-box ${currentExam.mode==='training' && currentExam.showAnswer ? 'visible' : ''}">💡 ${q.explanation}</div>`; renderGrid(); renderExamNav(); }
function renderGrid() { let grid = document.getElementById('question-grid'); grid.innerHTML = ''; currentExam.questions.forEach((_,i)=>{ let btn = document.createElement('button'); btn.className = `grid-btn ${i===currentExam.currentIndex?'current':''} ${currentExam.answers[i]!==null?'answered':''}`; btn.textContent = i+1; btn.onclick = ()=>{ if(currentExam.direction==='twoway' || i===currentExam.currentIndex) navigateToQuestion(i); }; grid.appendChild(btn); }); }
function renderExamNav() { let nav = document.getElementById('exam-nav'); nav.innerHTML = (currentExam.direction==='twoway' && currentExam.currentIndex>0)?'<button class="btn-secondary" onclick="prevQuestion()">← Prev</button>':'<span></span>'; if(currentExam.mode==='training') { if(currentExam.showAnswer && currentExam.currentIndex < currentExam.questions.length-1) nav.innerHTML += '<button class="btn-primary" onclick="nextQuestion()">Next →</button>'; else if(currentExam.answers[currentExam.currentIndex]!==null && !currentExam.showAnswer) nav.innerHTML += '<button class="btn-small" onclick="showAnswer()">Show Answer</button>'; } else { if(currentExam.answers[currentExam.currentIndex]!==null){ if(currentExam.currentIndex < currentExam.questions.length-1) nav.innerHTML += '<button class="btn-primary" onclick="nextQuestion()">Next →</button>'; else nav.innerHTML += '<button class="btn-primary" onclick="finishExam()">Submit</button>'; } } }
function selectOption(idx) { if(currentExam.submitted) return; if(currentExam.mode==='training' && currentExam.showAnswer) return; currentExam.answers[currentExam.currentIndex] = idx; if(currentExam.firstAnswers[currentExam.currentIndex]===null) currentExam.firstAnswers[currentExam.currentIndex]=idx; if(currentExam.mode==='training'){ let isCorrect = isAnswerCorrect(currentExam.questions[currentExam.currentIndex], idx); if(isCorrect){ currentExam.showAnswer=true; showCelebration(); } else { if(!wrongQuestions.includes(currentExam.questions[currentExam.currentIndex].id)) wrongQuestions.push(currentExam.questions[currentExam.currentIndex].id); saveWrongQuestions(); } renderExam(); } else { renderExam(); saveExamState(); } }
function showAnswer() { if(!currentExam) return; currentExam.showAnswer=true; renderExam(); saveExamState(); }
function nextQuestion() { if(currentExam.currentIndex+1 < currentExam.questions.length){ currentExam.currentIndex++; currentExam.showAnswer=false; renderExam(); } }
function prevQuestion() { if(currentExam.currentIndex>0){ currentExam.currentIndex--; if(currentExam.mode==='training') currentExam.showAnswer = currentExam.answers[currentExam.currentIndex]!==null; renderExam(); } }
function navigateToQuestion(i) { if(currentExam.direction==='twoway'){ currentExam.currentIndex=i; if(currentExam.mode==='training') currentExam.showAnswer = currentExam.answers[i]!==null; renderExam(); } }
function finishExam() { currentExam.submitted=true; if(timerInterval) clearInterval(timerInterval); saveProgress(); clearExamState(); showResults(); }
function showResults() { showScreen('results-screen'); let correct=0; currentExam.firstAnswers.forEach((ans,i)=>{ if(ans!==null && isAnswerCorrect(currentExam.questions[i],ans)) correct++; }); let total=currentExam.questions.length; document.getElementById('results-content').innerHTML = `<div class="result-score">${Math.round(correct/total*100)}%</div><div class="result-details"><div>✅ ${correct}/${total}</div></div><button class="btn-primary" onclick="reviewExam()">Review</button><button class="btn-secondary" onclick="goHome()">Home</button>`; }
function reviewExam() { let html=''; currentExam.questions.forEach((q,i)=>{ let user = currentExam.firstAnswers[i]; let correctIdx = getCorrectIndex(q); let isC = user===correctIdx; html+=`<div class="question-container"><p><strong>Q${q.number}</strong> ${q.text}</p>${q.options.map((opt,oi)=>`<div class="option-btn ${oi===correctIdx?'correct':''} ${oi===user && oi!==correctIdx?'wrong':''}">${opt}</div>`).join('')}<div class="explanation-box visible">📘 ${q.explanation}</div></div>`; }); document.getElementById('results-review').innerHTML = html; }
function startTimer() { timerInterval = setInterval(()=>{ if(!currentExam||currentExam.submitted){ clearInterval(timerInterval); return; } let rem = currentExam.totalTime - (Date.now()-currentExam.startTime); if(rem<=0){ clearInterval(timerInterval); finishExam(); } else { let mins = Math.floor(rem/60000); let secs = Math.floor((rem%60000)/1000); document.getElementById('exam-timer').classList.remove('hidden'); document.getElementById('exam-timer').innerText = `${mins}:${secs<10?'0'+secs:secs}`; } },1000); }
function toggleFavorite(id) { let idx = favorites.indexOf(id); if(idx>-1) favorites.splice(idx,1); else favorites.push(id); saveFavorites(); if(currentExam && !currentExam.submitted) renderExam(); }
function openSection(type) { if(type==='wrong'){ let wq = allQuestionsGlobal.filter(q=>wrongQuestions.includes(q.id)); if(!wq.length){showToast('No wrong Qs'); return;} startSpecialExam(wq); } else if(type==='favorites'){ let fq = allQuestionsGlobal.filter(q=>favorites.includes(q.id)); if(!fq.length){showToast('No favorites'); return;} startSpecialExam(fq); } else if(type==='search'){ populateSearchFilter(); showScreen('search-screen'); } }
function startSpecialExam(questions) { currentExam = { mode:'training', direction:'twoway', questions: shuffleArray(questions), currentIndex:0, answers:new Array(questions.length).fill(null), firstAnswers:new Array(questions.length).fill(null), startTime:Date.now(), totalTime:(questions.length+5)*60*1000, submitted:false, showAnswer:false }; saveExamState(); showScreen('exam-screen'); renderExam(); }
function populateSearchFilter() { let filter = document.getElementById('search-filter'); filter.innerHTML = '<option value="all">All</option>'; }
async function performSearch() { let query = document.getElementById('search-input').value.toLowerCase(); if(query.length<2) return; let results = allQuestionsGlobal.filter(q=> (q.text+q.options.join(' ')+q.explanation).toLowerCase().includes(query)); document.getElementById('search-results').innerHTML = results.slice(0,30).map(q=>`<div class="search-result-item" onclick="openReadonly('${q.id}')"><strong>${q.subject} | ${q.lectureName}</strong><br>${q.text.substring(0,100)}...</div>`).join(''); }
function openReadonly(id) { let q = allQuestionsGlobal.find(qq=>qq.id===id); if(!q) return; showScreen('readonly-screen'); document.getElementById('readonly-content').innerHTML = `<div><h4>${q.subject} - ${q.lectureName}</h4><p>${q.text}</p>${q.options.map((opt,i)=>`<div class="option-btn ${i===getCorrectIndex(q)?'correct':''}">${opt}</div>`).join('')}<div class="explanation-box visible">${q.explanation}</div></div>`; }
function closeReadonly() { showScreen('search-screen'); }
function openExams() { showSubjectsScreen(); }
function toggleStatistics() { let p = document.getElementById('statistics-panel'); p.classList.toggle('visible'); if(p.classList.contains('visible')) renderStatistics(); }
function renderStatistics() { document.getElementById('stats-content').innerHTML = `<p>📚 Total Questions: ${allQuestionsGlobal.length}</p><p>⭐ Favorites: ${favorites.length}</p><p>❌ Wrong: ${wrongQuestions.length}</p>`; }
function resetProgress() { if(confirm('Reset all?')){ progress={}; favorites=[]; wrongQuestions=[]; localStorage.clear(); showToast('Reset done'); goHome(); } }
function saveProgress() { if(!currentExam) return; currentExam.firstAnswers.forEach((ans,i)=>{ if(ans!==null){ let q = currentExam.questions[i]; let key = `${q.subject}|${q.lectureName}`; if(!progress[key]) progress[key]={}; progress[key][q.id]=true; } }); localStorage.setItem('exam-progress',JSON.stringify(progress)); }
function saveExamState() { localStorage.setItem('exam-state', JSON.stringify(currentExam)); }
function clearExamState() { localStorage.removeItem('exam-state'); }
function checkResumeExam() { let saved = localStorage.getItem('exam-state'); if(saved) { try{ let ex = JSON.parse(saved); if(!ex.submitted){ if(confirm('Resume unfinished exam?')){ currentExam=ex; showScreen('exam-screen'); renderExam(); if(ex.mode==='exam') startTimer(); } else clearExamState(); } }catch(e){} } }
function saveFavorites() { localStorage.setItem('exam-favorites', JSON.stringify(favorites)); }
function saveWrongQuestions() { localStorage.setItem('exam-wrong', JSON.stringify(wrongQuestions)); }
function loadStorage() { try{ favorites = JSON.parse(localStorage.getItem('exam-favorites'))||[]; wrongQuestions = JSON.parse(localStorage.getItem('exam-wrong'))||[]; progress = JSON.parse(localStorage.getItem('exam-progress'))||{}; settings = JSON.parse(localStorage.getItem('exam-settings'))||{}; }catch(e){} }
function toggleDarkMode() { let isDark = document.getElementById('dark-mode-toggle').checked; document.documentElement.setAttribute('data-dark', isDark); settings.darkMode = isDark; localStorage.setItem('exam-settings',JSON.stringify(settings)); }
function changeTheme(val) { document.documentElement.setAttribute('data-theme', val); settings.theme = val; localStorage.setItem('exam-settings',JSON.stringify(settings)); }
function changeSound(val) { let audio = document.getElementById('bg-audio'); if(val==='none') audio.pause(); else { audio.src = `${val}.mp3`; audio.volume = settings.volume/100||0.5; audio.play().catch(e=>{}); } settings.bgSound = val; localStorage.setItem('exam-settings',JSON.stringify(settings)); }
function changeVolume(v) { let audio = document.getElementById('bg-audio'); audio.volume = v/100; settings.volume = v; localStorage.setItem('exam-settings',JSON.stringify(settings)); }
function toggleAnimations() { let en = document.getElementById('animations-toggle').checked; document.documentElement.setAttribute('data-animations', en); settings.animations = en; localStorage.setItem('exam-settings',JSON.stringify(settings)); }
function applySettings() { document.getElementById('dark-mode-toggle').checked = settings.darkMode||false; document.documentElement.setAttribute('data-dark', settings.darkMode||false); document.getElementById('theme-selector').value = settings.theme||'default'; document.documentElement.setAttribute('data-theme', settings.theme||'default'); document.getElementById('sound-selector').value = settings.bgSound||'none'; document.getElementById('volume-control').value = settings.volume||50; document.getElementById('animations-toggle').checked = settings.animations!==false; }
function showCelebration() { if(settings.animations===false) return; let canvas = document.getElementById('fireworks-canvas'); canvas.classList.remove('hidden'); setTimeout(()=>canvas.classList.add('hidden'), 1500); }
function exitExam() { if(currentExam && !currentExam.submitted && confirm('Exit? progress saved')) saveExamState(); currentExam=null; goHome(); }
function toggleGrid() { let g = document.getElementById('question-grid'); g.classList.toggle('hidden'); document.getElementById('btn-grid-toggle').innerHTML = g.classList.contains('hidden') ? '☰ Show Grid' : '☰ Hide Grid'; }
async function init() { loadStorage(); applySettings(); await loadSubject('Surgery'); await loadSubject('Ortho'); await loadSubject('Anesthesia'); checkResumeExam(); document.getElementById('random-quote').innerText = "🚀 Dynamic Subjects Ready | Exams from Folders"; }
window.openExams = openExams; window.goBackFromSelection = goBackFromSelection; window.selectMode = selectMode; window.selectDirection = selectDirection; window.addExtraTime = addExtraTime; window.confirmStartExam = confirmStartExam; window.selectOption = selectOption; window.nextQuestion = nextQuestion; window.prevQuestion = prevQuestion; window.showAnswer = showAnswer; window.finishExam = finishExam; window.toggleFavorite = toggleFavorite; window.openSection = openSection; window.toggleStatistics = toggleStatistics; window.toggleSettings = () => document.getElementById('settings-panel').classList.toggle('visible'); window.resetProgress = resetProgress; window.toggleDarkMode = toggleDarkMode; window.changeTheme = changeTheme; window.changeSound = changeSound; window.changeVolume = changeVolume; window.toggleAnimations = toggleAnimations; window.exitExam = exitExam; window.toggleGrid = toggleGrid; window.performSearch = performSearch; window.openReadonly = openReadonly; window.closeReadonly = closeReadonly; window.reviewExam = reviewExam; window.goHome = goHome;
init();
