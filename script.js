/* ============================================
   MEDICAL EXAM PRACTICE - FOLDER-BASED VERSION
   Structure:
   SubjectName/*.txt                -> Lectures
   SubjectName/AI/*.txt             -> AI Lectures
   Years are derived automatically from batch names found inside normal lecture files.
   ============================================ */

let subjectCatalog = {};
let allLectures = [];
let allYears = [];
let allAI = [];
let allQuestions = [];
let currentExam = null;
let settings = {};
let favorites = [];
let wrongQuestions = [];
let progress = {};
let currentQuestionListMode = null;
let currentSubjectSlug = null;
let selectionScreenReturnTo = 'subjects';
let readonlyReturnTo = 'home';

let selectedGroups = [];
let currentGroups = [];
let selectedMode = null;
let selectedDirection = null;
let extraTime = 0;
let extraTimeAdded = false;
let timerInterval = null;

const DEFAULT_SETTINGS = {
    darkMode: false,
    theme: 'default',
    sound: 'none',
    volume: 50,
    animations: true
};

const SOUND_MAP = {
    'fireplace': 'fireplace.mp3',
    'forest': 'forest.mp3',
    'rain-window': 'rain-window.mp3',
    'beach': 'beach.mp3',
    'irbid-cafe': 'irbid-cafe.mp3',
    'rain-thunder': 'rain-thunder.mp3'
};

document.addEventListener('DOMContentLoaded', async () => {
    loadSettings();
    loadProgress();
    loadFavorites();
    loadWrongQuestions();
    buildModals();
    applySettings();
    displayRandomQuote();
    bindButtons();
    await loadData();
    checkResumeExam();
});

function bindButtons() {
    const statsBtn = document.querySelector('.nav-btn--stats');
    const settingsBtn = document.querySelector('.nav-btn--settings');
    if (statsBtn) statsBtn.onclick = toggleStatistics;
    if (settingsBtn) settingsBtn.onclick = toggleSettings;
}

function displayRandomQuote() {
    const quotes = [
        'لا توجد وصفة سحرية، ولا توجد طريقة ليس فيها العمل والتعب وبذل الجهد !',
        'الفشل ليس النهاية، بل هو خطوة ضرورية نحو القمة إذا تعلمت منه !',
        'العلم الذي تدرسه اليوم هو الأمل الذي ستمنحه لغيرك غداً !',
        'دراسة الطب هي ماراثون وليست سباقاً قصيراً؛ حافظ على أنفاسك وواصل التقدم !',
        'لا تنتظر الوقت المناسب، فالوقت لن يكون مثاليًا أبدًا. ابدأ من حيث تقف !'
    ];
    const quoteEl = document.getElementById('random-quote');
    if (quoteEl) quoteEl.textContent = quotes[Math.floor(Math.random() * quotes.length)];
}

async function loadData() {
    try {
        subjectCatalog = await discoverSubjectsFromGitHub();
        await loadSubjectData();
        populateSearchFilter();
        renderSubjects();
    } catch (err) {
        console.error('Error loading repo data:', err);
        showToast('Error loading subject folders from GitHub.');
    }
}

function slugify(str = '') {
    return String(str)
        .toLowerCase().trim()
        .replace(/\.txt$/i, '')
        .replace(/[\s_]+/g, '-')
        .replace(/[^a-z0-9\-\u0600-\u06FF]/gi, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

function titleCaseSlug(slug = '') {
    return slug.replace(/[-_]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function inferGitHubRepo() {
    const host = window.location.hostname;
    const parts = window.location.pathname.split('/').filter(Boolean);
    if (host.endsWith('github.io')) {
        const owner = host.replace('.github.io', '');
        const repo = parts.length ? parts[0] : `${owner}.github.io`;
        return { owner, repo };
    }
    const owner = window.GITHUB_REPO_OWNER || '';
    const repo = window.GITHUB_REPO_NAME || '';
    if (owner && repo) return { owner, repo };
    throw new Error('Custom domain detected. Please define window.GITHUB_REPO_OWNER and window.GITHUB_REPO_NAME once in index.html.');
}

async function githubApi(url) {
    const res = await fetch(url, { headers: { 'Accept': 'application/vnd.github+json' } });
    if (!res.ok) throw new Error(`GitHub API failed: ${res.status}`);
    return res.json();
}

async function discoverSubjectsFromGitHub() {
    const { owner, repo } = inferGitHubRepo();
    const repoMeta = await githubApi(`https://api.github.com/repos/${owner}/${repo}`);
    const branch = repoMeta.default_branch;
    const treeData = await githubApi(`https://api.github.com/repos/${owner}/${repo}/git/trees/${encodeURIComponent(branch)}?recursive=1`);
    const tree = treeData.tree || [];

    const catalog = {};
    tree.forEach(item => {
        if (item.type !== 'blob' || !/\.txt$/i.test(item.path)) return;
        const parts = item.path.split('/');

        // SUPPORT ONLY FOLDER-BASED SUBJECTS:
        // Subject/Lecture1.txt
        // Subject/AI/Lecture1.txt
        if (parts.length === 2) {
            const [subjectFolder, fileName] = parts;
            if (!fileName.toLowerCase().endsWith('.txt')) return;
            upsertSubject(catalog, subjectFolder);
            catalog[slugify(subjectFolder)].lectureFiles.push({
                path: item.path,
                fileName,
                rawUrl: `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${item.path}`
            });
        }
        else if (parts.length === 3 && parts[1].toLowerCase() === 'ai') {
            const [subjectFolder, _ai, fileName] = parts;
            if (!fileName.toLowerCase().endsWith('.txt')) return;
            upsertSubject(catalog, subjectFolder);
            catalog[slugify(subjectFolder)].aiFiles.push({
                path: item.path,
                fileName,
                rawUrl: `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${item.path}`
            });
        }
    });

    return catalog;
}

function upsertSubject(catalog, folderName) {
    const slug = slugify(folderName);
    if (!catalog[slug]) {
        catalog[slug] = {
            slug,
            name: folderName || titleCaseSlug(slug),
            lectureFiles: [],
            aiFiles: [],
            lectures: [],
            years: [],
            ai: [],
            counts: { lectures: 0, years: 0, ai: 0, totalQuestions: 0 }
        };
    }
}

async function loadSubjectData() {
    allLectures = [];
    allYears = [];
    allAI = [];
    allQuestions = [];

    for (const subject of Object.values(subjectCatalog)) {
        // Normal lecture files
        for (const file of subject.lectureFiles) {
            const text = await fetchText(file.rawUrl);
            const lectureName = file.fileName.replace(/\.txt$/i, '');
            const questions = parseLectureTxt(text, {
                subjectName: subject.name,
                subjectSlug: subject.slug,
                lectureName,
                source: 'lecture'
            });
            const group = {
                name: lectureName,
                type: 'lecture',
                subjectName: subject.name,
                subjectSlug: subject.slug,
                questions
            };
            if (questions.length) {
                subject.lectures.push(group);
                allLectures.push(group);
                allQuestions.push(...questions);
            }
        }

        // Derive Year/Batch groups only from normal lecture files
        const yearMap = {};
        subject.lectures.forEach(lectureGroup => {
            lectureGroup.questions.forEach(q => {
                if (!q.batchName) return;
                if (!yearMap[q.batchName]) yearMap[q.batchName] = [];
                yearMap[q.batchName].push({
                    ...q,
                    source: 'year',
                    groupName: q.batchName
                });
            });
        });
        subject.years = Object.entries(yearMap)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([batchName, questions]) => ({
                name: batchName,
                type: 'year',
                subjectName: subject.name,
                subjectSlug: subject.slug,
                questions
            }));
        allYears.push(...subject.years);

        // AI folder lecture files
        for (const file of subject.aiFiles) {
            const text = await fetchText(file.rawUrl);
            const lectureName = file.fileName.replace(/\.txt$/i, '');
            const questions = parseLectureTxt(text, {
                subjectName: subject.name,
                subjectSlug: subject.slug,
                lectureName,
                source: 'ai'
            });
            const group = {
                name: lectureName,
                type: 'ai',
                subjectName: subject.name,
                subjectSlug: subject.slug,
                questions
            };
            if (questions.length) {
                subject.ai.push(group);
                allAI.push(group);
                allQuestions.push(...questions);
            }
        }

        subject.counts.lectures = subject.lectures.length;
        subject.counts.years = subject.years.length;
        subject.counts.ai = subject.ai.length;
        subject.counts.totalQuestions = [
            ...subject.lectures.flatMap(g => g.questions),
            ...subject.ai.flatMap(g => g.questions)
        ].length;
    }
}

async function fetchText(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch ${url}`);
    return res.text();
}

function parseLectureTxt(text, ctx) {
    const normalized = String(text)
        .replace(/\r/g, '')
        .replace(/^﻿/, '')
        .replace(/\n\s*\/\/\/\/\/[\s\S]*$/g, '\n')
        .trim();

    if (!normalized) return [];

    const blocks = normalized
        .split(/\n\s*###\s*\n|\n\s*###\s*$/g)
        .map(b => b.trim())
        .filter(Boolean);

    const questions = [];
    let autoNumber = 1;

    for (const block of blocks) {
        const q = parseQuestionBlock(block, ctx, autoNumber);
        if (q) {
            questions.push(q);
            autoNumber += 1;
        }
    }
    return questions;
}

function parseQuestionBlock(block, ctx, fallbackNumber) {
    try {
        const rawLines = block.split('\n').map(line => line.trim()).filter(Boolean);
        if (!rawLines.length) return null;

        let lines = [...rawLines];
        // Remove repeated lecture title if present at block start
        if (lines[0].toLowerCase() === String(ctx.lectureName).toLowerCase()) {
            lines.shift();
        }
        if (!lines.length) return null;

        let i = 0;
        let questionNumber = '';
        let questionText = '';
        let options = [];
        let correctAnswerLetter = '';
        let correctAnswerText = '';
        let explanation = '';
        let batchName = '';
        let pageNumber = '';

        // Optional "Question 9:" line
        if (/^Question\s+\d+/i.test(lines[i])) {
            const match = lines[i].match(/^Question\s+(\d+)/i);
            questionNumber = match ? match[1] : '';
            i += 1;
        }

        // Question text until options start
        const qTextLines = [];
        while (i < lines.length && !isOptionLine(lines[i]) && !/^Correct Answer:/i.test(lines[i])) {
            qTextLines.push(lines[i].replace(/:$/, ''));
            i += 1;
        }
        questionText = qTextLines.join(' ').trim();
        if (!questionText) return null;

        // Options
        while (i < lines.length && isOptionLine(lines[i])) {
            options.push(normalizeOption(lines[i]));
            i += 1;
        }
        if (!options.length) return null;

        // Correct answer
        while (i < lines.length) {
            if (/^Correct Answer:/i.test(lines[i])) {
                const answerRaw = lines[i].replace(/^Correct Answer:\s*/i, '').trim();
                const letterMatch = answerRaw.match(/^([A-E])/i);
                correctAnswerLetter = letterMatch ? letterMatch[1].toUpperCase() : '';
                correctAnswerText = answerRaw.replace(/^[A-E][\)\.]?\s*/i, '').trim();
                i += 1;
                break;
            }
            i += 1;
        }
        if (!correctAnswerText && correctAnswerLetter) {
            const correctOption = options.find(opt => opt.startsWith(correctAnswerLetter + ')'));
            if (correctOption) correctAnswerText = correctOption.substring(2).trim();
        }

        // Explanation if present
        if (i < lines.length && /^Explanation:/i.test(lines[i])) {
            const explanationLines = [lines[i].replace(/^Explanation:\s*/i, '')];
            i += 1;
            while (i < lines.length && !isMetadataLine(lines[i])) {
                explanationLines.push(lines[i]);
                i += 1;
            }
            explanation = explanationLines.join(' ').trim();
        }

        // trailing metadata: batch/page (optional)
        while (i < lines.length) {
            const line = lines[i];
            if (isPageLine(line)) pageNumber = line;
            else if (isBatchLine(line)) batchName = line;
            i += 1;
        }

        const finalNumber = questionNumber || String(fallbackNumber);
        const questionId = makeQuestionId(ctx, finalNumber, questionText);
        return {
            id: questionId,
            number: finalNumber,
            text: questionText,
            optionsRaw: options,
            correctAnswerLetter,
            correctAnswerText,
            explanation,
            batchName,
            lectureName: ctx.lectureName,
            pageNumber,
            groupName: ctx.source === 'year' ? batchName : ctx.lectureName,
            source: ctx.source,
            subjectName: ctx.subjectName,
            subjectSlug: ctx.subjectSlug
        };
    } catch (err) {
        console.warn('Failed to parse question block:', err, block);
        return null;
    }
}

function isOptionLine(line) {
    return /^[A-E][\)\.]\s+/i.test(line);
}

function normalizeOption(line) {
    const text = line.replace(/^[A-E][\)\.]\s*/i, '').trim();
    const letterMatch = line.match(/^([A-E])/i);
    const letter = letterMatch ? letterMatch[1].toUpperCase() : 'A';
    return `${letter}) ${text}`;
}

function isPageLine(line) {
    return /^P\s*\(?\d+\)?$/i.test(line);
}

function isBatchLine(line) {
    return /^[A-Za-z\u0600-\u06FF][A-Za-z0-9\u0600-\u06FF\s_\-]+-\s*\d+[A-Za-z0-9\u0600-\u06FF\s_\-]*$/i.test(line);
}

function isMetadataLine(line) {
    return isPageLine(line) || isBatchLine(line);
}

function makeQuestionId(ctx, number, questionText) {
    const fragment = slugify(questionText).slice(0, 40) || 'q';
    return `${ctx.subjectSlug}__${ctx.source}__${slugify(ctx.lectureName)}__${number}__${fragment}`;
}

function shuffleArray(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

function shuffleOptions(question) {
    const options = question.optionsRaw.map((opt, idx) => ({
        idx,
        letter: opt.charAt(0),
        text: opt.substring(2).trim()
    }));
    for (let i = options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [options[i], options[j]] = [options[j], options[i]];
    }
    const letters = ['A', 'B', 'C', 'D', 'E'];
    const shuffledOptions = options.map((opt, i) => `${letters[i]}) ${opt.text}`);
    return {
        shuffledOptions,
        originalCorrectText: question.correctAnswerText
    };
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
    document.getElementById(screenId)?.classList.add('active');
    document.getElementById('settings-panel')?.classList.remove('visible');
    document.getElementById('statistics-panel')?.classList.remove('visible');
}

function goHome() {
    showScreen('home-screen');
    readonlyReturnTo = 'home';
}

function openSection(section) {
    if (section === 'exams') {
        renderSubjects();
        showSubjectsScreen();
    } else if (section === 'wrong') {
        openWrongQuestions();
    } else if (section === 'favorites') {
        openFavoriteQuestions();
    } else if (section === 'search') {
        readonlyReturnTo = 'search';
        showScreen('search-screen');
        document.getElementById('search-input').value = '';
        document.getElementById('search-results').innerHTML = '';
    }
}

function showSubjectsScreen() {
    showScreen('subjects-screen');
}

function renderSubjects() {
    const list = document.getElementById('subjects-list');
    const subjects = Object.values(subjectCatalog).sort((a, b) => a.name.localeCompare(b.name));
    if (!subjects.length) {
        list.innerHTML = '<div class="selection-item"><div><strong>No subject folders found.</strong><br><small class="inline-note">Create folders like Surgery/, Ortho/, Anesthesia/ and put TXT lecture files inside.</small></div></div>';
        return;
    }
    list.innerHTML = subjects.map(subject => `
        <div class="subject-choice-item" onclick="openSubjectModes('${escapeJs(subject.slug)}')">
            <div>
                <strong>${escapeHtml(subject.name)}</strong>
                <div class="meta">${subject.counts.totalQuestions} question(s)</div>
                <div class="source-chip-row">
                    <span class="source-chip ${subject.lectures.length ? 'available' : ''}">Lectures: ${subject.lectures.length}</span>
                    ${subject.years.length ? `<span class="source-chip available">Years: ${subject.years.length}</span>` : ''}
                    ${subject.ai.length ? `<span class="source-chip available">AI: ${subject.ai.length}</span>` : ''}
                </div>
            </div>
            <div class="choice-arrow">›</div>
        </div>
    `).join('');
}

function openSubjectModes(subjectSlug) {
    currentSubjectSlug = subjectSlug;
    const subject = subjectCatalog[subjectSlug];
    if (!subject) return;
    document.getElementById('subject-mode-title').textContent = subject.name;

    const cards = [];
    if (subject.lectures.length) {
        cards.push(`
            <div class="subject-choice-item" onclick="openGroupsForSubject('${escapeJs(subjectSlug)}', 'lecture')">
                <div>
                    <strong>Lectures</strong>
                    <div class="meta">All lecture TXT files inside ${escapeHtml(subject.name)}/</div>
                </div>
                <div class="choice-arrow">›</div>
            </div>
        `);
    }
    if (subject.years.length) {
        cards.push(`
            <div class="subject-choice-item" onclick="openGroupsForSubject('${escapeJs(subjectSlug)}', 'year')">
                <div>
                    <strong>Years</strong>
                    <div class="meta">Built automatically from detected batch names like Iris - 5</div>
                </div>
                <div class="choice-arrow">›</div>
            </div>
        `);
    }
    if (subject.ai.length) {
        cards.push(`
            <div class="subject-choice-item" onclick="openGroupsForSubject('${escapeJs(subjectSlug)}', 'ai')">
                <div>
                    <strong>AI</strong>
                    <div class="meta">TXT files inside ${escapeHtml(subject.name)}/AI/</div>
                </div>
                <div class="choice-arrow">›</div>
            </div>
        `);
    }

    document.getElementById('subject-mode-list').innerHTML = cards.join('') || '<div class="selection-item"><div>No lecture files found in this subject yet.</div></div>';
    showScreen('subject-mode-screen');
}

function openGroupsForSubject(subjectSlug, type) {
    const subject = subjectCatalog[subjectSlug];
    if (!subject) return;

    let groups = [];
    let title = subject.name;
    let searchEnabled = false;

    if (type === 'lecture') {
        groups = subject.lectures;
        title += ' · Lectures';
        searchEnabled = true;
    } else if (type === 'year') {
        groups = subject.years;
        title += ' · Years';
    } else if (type === 'ai') {
        groups = subject.ai;
        title += ' · AI';
        searchEnabled = true;
    }

    selectionScreenReturnTo = 'subject-mode';
    showSelectionScreen(groups, title, searchEnabled);
}

function backFromSelection() {
    if (selectionScreenReturnTo === 'subject-mode') showScreen('subject-mode-screen');
    else if (selectionScreenReturnTo === 'subjects') showSubjectsScreen();
    else goHome();
}

function resetSelectionState() {
    selectedGroups = [];
    currentGroups = [];
    selectedMode = null;
    selectedDirection = null;
    extraTime = 0;
    extraTimeAdded = false;
}

function showSelectionScreen(groups, title, enableSearch = false) {
    resetSelectionState();
    currentGroups = groups || [];
    showScreen('selection-screen');
    document.getElementById('selection-title').textContent = title;

    const searchContainer = document.getElementById('selection-search-container');
    const searchInput = document.getElementById('selection-search');
    if (enableSearch) {
        searchContainer.classList.remove('hidden');
        searchInput.value = '';
    } else {
        searchContainer.classList.add('hidden');
    }

    const list = document.getElementById('selection-list');
    list.innerHTML = '';
    groups.forEach((group, idx) => {
        const item = document.createElement('div');
        item.className = 'selection-item';
        item.dataset.groupName = String(group.name || '').toLowerCase();
        item.innerHTML = `
            <input type="checkbox" id="group-${idx}" onchange="toggleGroupSelection(${idx})">
            <label for="group-${idx}" style="cursor:pointer; width: 100%;">
                <strong>${escapeHtml(group.name)}</strong>
                <br><small style="color:var(--text-muted)">${group.questions.length} questions</small>
            </label>
        `;
        item.onclick = (e) => {
            if (e.target.tagName !== 'INPUT') {
                const cb = item.querySelector('input');
                cb.checked = !cb.checked;
                toggleGroupSelection(idx);
            }
        };
        list.appendChild(item);
    });

    document.getElementById('selection-footer').classList.add('hidden');
    document.getElementById('direction-selection').classList.add('hidden');
    document.getElementById('timer-options').classList.add('hidden');
    document.getElementById('start-section').classList.add('hidden');
    document.querySelectorAll('.btn-mode').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.btn-direction').forEach(b => b.classList.remove('active'));
}

function filterSelectionList() {
    const term = document.getElementById('selection-search').value.toLowerCase().trim();
    document.querySelectorAll('#selection-list .selection-item').forEach(item => {
        const name = item.dataset.groupName || '';
        item.style.display = name.includes(term) ? '' : 'none';
    });
}

function toggleGroupSelection(idx) {
    const existing = selectedGroups.indexOf(idx);
    if (existing > -1) selectedGroups.splice(existing, 1);
    else selectedGroups.push(idx);

    document.querySelectorAll('#selection-list .selection-item').forEach((item, i) => {
        const selected = selectedGroups.includes(i);
        item.classList.toggle('selected', selected);
        const cb = item.querySelector('input');
        if (cb) cb.checked = selected;
    });
    updateSelectionFooter();
}

function updateSelectionFooter() {
    const footer = document.getElementById('selection-footer');
    const totalQuestions = selectedGroups.reduce((sum, idx) => sum + currentGroups[idx].questions.length, 0);
    const input = document.getElementById('question-count-input');

    if (selectedGroups.length) {
        footer.classList.remove('hidden');
        document.getElementById('selected-count').textContent = `${totalQuestions} questions selected`;
        input.max = totalQuestions;
        input.value = totalQuestions;
        document.getElementById('max-questions-label').textContent = `/ ${totalQuestions}`;
    } else {
        footer.classList.add('hidden');
    }

    selectedMode = null;
    selectedDirection = null;
    extraTime = 0;
    extraTimeAdded = false;
    document.getElementById('direction-selection').classList.add('hidden');
    document.getElementById('timer-options').classList.add('hidden');
    document.getElementById('start-section').classList.add('hidden');
    document.querySelectorAll('.btn-mode').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.btn-direction').forEach(b => b.classList.remove('active'));
}

function onQuestionCountChange() {
    const input = document.getElementById('question-count-input');
    const max = Number(input.max || 0);
    let value = Number(input.value || 0);
    if (value < 1) value = 1;
    if (max && value > max) value = max;
    input.value = value;
    if (selectedMode === 'exam' && selectedDirection) {
        document.getElementById('base-time-display').textContent = `${value} min`;
        document.getElementById('total-time-display').textContent = `${value + extraTime} min`;
    }
}

function selectMode(mode) {
    selectedMode = mode;
    selectedDirection = null;
    extraTime = 0;
    extraTimeAdded = false;
    document.querySelectorAll('.btn-mode').forEach(b => b.classList.remove('active'));
    document.getElementById(mode === 'training' ? 'btn-training-mode' : 'btn-exam-mode').classList.add('active');
    document.getElementById('direction-selection').classList.remove('hidden');
    document.querySelectorAll('.btn-direction').forEach(b => b.classList.remove('active'));
    document.getElementById('timer-options').classList.add('hidden');
    document.getElementById('start-section').classList.add('hidden');
}

function selectDirection(direction) {
    selectedDirection = direction;
    document.querySelectorAll('.btn-direction').forEach(b => b.classList.remove('active'));
    document.getElementById(direction === 'oneway' ? 'btn-oneway' : 'btn-twoway').classList.add('active');

    if (selectedMode === 'exam') {
        const count = parseInt(document.getElementById('question-count-input').value) || 0;
        document.getElementById('base-time-display').textContent = `${count} min`;
        document.getElementById('extra-time-display').textContent = '+0 min';
        document.getElementById('total-time-display').textContent = `${count} min`;
        document.getElementById('timer-options').classList.remove('hidden');
        const btn = document.getElementById('btn-add-extra');
        btn.disabled = false;
        btn.textContent = '+ Add 5 Extra Minutes';
        extraTime = 0;
        extraTimeAdded = false;
    } else {
        document.getElementById('timer-options').classList.add('hidden');
    }
    document.getElementById('start-section').classList.remove('hidden');
}

function addExtraTime() {
    if (extraTimeAdded) return;
    extraTime = 5;
    extraTimeAdded = true;
    const count = parseInt(document.getElementById('question-count-input').value) || 0;
    document.getElementById('extra-time-display').textContent = '+5 min';
    document.getElementById('total-time-display').textContent = `${count + 5} min`;
    const btn = document.getElementById('btn-add-extra');
    btn.disabled = true;
    btn.textContent = '✓ Extra 5 Minutes Added';
}

function confirmStartExam() {
    if (!selectedMode || !selectedDirection) {
        showToast('Please select mode and direction');
        return;
    }
    const count = parseInt(document.getElementById('question-count-input').value);
    if (!count || count < 1) {
        showToast('Please enter a valid number of questions');
        return;
    }

    let questions = [];
    selectedGroups.forEach(idx => {
        questions = questions.concat(currentGroups[idx].questions);
    });
    questions = shuffleArray(questions).slice(0, count);

    const processedQuestions = questions.map(q => {
        const shuffled = shuffleOptions(q);
        return { ...q, shuffledOptions: shuffled.shuffledOptions, originalCorrectText: q.correctAnswerText };
    });

    currentExam = {
        mode: selectedMode,
        direction: selectedDirection,
        questions: processedQuestions,
        currentIndex: 0,
        answers: new Array(processedQuestions.length).fill(null),
        firstAnswers: new Array(processedQuestions.length).fill(null),
        startTime: Date.now(),
        totalTime: (processedQuestions.length + extraTime) * 60 * 1000,
        submitted: false,
        showAnswer: false
    };

    saveExamState();
    showScreen('exam-screen');
    renderExam();
    if (selectedMode === 'exam') startTimer();
}

function renderExam() {
    if (!currentExam) return;
    const { mode, questions, currentIndex, answers } = currentExam;
    const question = questions[currentIndex];
    const remaining = questions.length - currentIndex;
    let progressText = `${currentIndex + 1}/${questions.length}`;

    if (mode === 'training') {
        const correct = currentExam.firstAnswers.filter((a, i) => {
            if (a === null) return false;
            const selectedText = questions[i].shuffledOptions[a].substring(2).trim();
            return selectedText === questions[i].originalCorrectText;
        }).length;
        const answered = currentExam.firstAnswers.filter(a => a !== null).length;
        const pct = answered ? Math.round((correct / answered) * 100) : 0;
        progressText += ` · ✓${correct} · ${pct}%`;
    } else {
        progressText += ` · ${remaining} left`;
    }

    document.getElementById('exam-progress').textContent = progressText;
    renderGrid();
    const isFav = favorites.includes(question.id);

    document.getElementById('question-container').innerHTML = `
        <div class="question-header">
            <span class="question-number">Q${escapeHtml(question.number || String(currentIndex + 1))}</span>
            <div class="question-actions">
                <button class="icon-btn ${isFav ? 'active' : ''}" onclick="toggleFavorite('${escapeJs(question.id)}')" title="Favorite">✦</button>
                <button class="icon-btn" onclick="showLocation('${escapeJs(question.subjectName)}', '${escapeJs(question.lectureName)}', '${escapeJs(question.batchName)}', '${escapeJs(question.number)}', '${escapeJs(question.pageNumber)}')" title="Location">📍</button>
                <button class="icon-btn" onclick="openExamSettings()" title="Settings">⚙️</button>
            </div>
        </div>
        <p class="question-text">${escapeHtml(question.text)}</p>
        <div class="options-list">
            ${question.shuffledOptions.map((opt, i) => {
                let cls = 'option-btn';
                if (answers[currentIndex] === i) cls += ' selected';
                if (mode === 'training' && currentExam.showAnswer) {
                    const isCorrectOpt = opt.substring(2).trim() === question.originalCorrectText;
                    if (isCorrectOpt) cls += ' correct';
                    else if (answers[currentIndex] === i && !isCorrectOpt) cls += ' wrong';
                }
                return `<button class="${cls}" onclick="selectOption(${i})">${escapeHtml(opt)}</button>`;
            }).join('')}
        </div>
        <div class="explanation-box ${(mode === 'training' && currentExam.showAnswer) ? 'visible' : ''}">
            <strong>Explanation:</strong> ${escapeHtml(question.explanation || 'No explanation available.')}
        </div>
        <div class="mt-20 inline-note">Subject: ${escapeHtml(question.subjectName)} · Lecture: ${escapeHtml(question.lectureName || '—')} · Batch: ${escapeHtml(question.batchName || '—')}</div>
    `;
    renderExamNav();
}

function renderGrid() {
    const grid = document.getElementById('question-grid');
    const { questions, currentIndex, answers, mode, direction, firstAnswers } = currentExam;
    grid.innerHTML = '';
    questions.forEach((q, i) => {
        let cls = 'grid-btn';
        if (i === currentIndex) cls += ' current';
        else if (answers[i] !== null) {
            if (mode === 'training' && firstAnswers[i] !== null) {
                const selectedText = q.shuffledOptions[firstAnswers[i]].substring(2).trim();
                cls += selectedText === q.originalCorrectText ? ' answered' : ' wrong';
            } else {
                cls += ' answered';
            }
        }
        if (direction === 'oneway' && i < currentIndex) cls += ' disabled';

        const btn = document.createElement('button');
        btn.className = cls;
        btn.textContent = i + 1;
        btn.onclick = () => navigateToQuestion(i);
        grid.appendChild(btn);
    });
}

function renderExamNav() {
    const nav = document.getElementById('exam-nav');
    const { mode, direction, currentIndex, questions } = currentExam;
    let html = '';

    if (direction === 'twoway' && currentIndex > 0) html += '<button class="btn-secondary" onclick="prevQuestion()">← Previous</button>';
    else html += '<span></span>';

    if (mode === 'training') {
        if (currentExam.showAnswer) {
            html += currentIndex < questions.length - 1
                ? '<button class="btn-primary" onclick="nextQuestion()">Next →</button>'
                : '<button class="btn-primary" onclick="finishExam()">Finish</button>';
        } else if (currentExam.answers[currentIndex] !== null) {
            html += '<button class="btn-small" onclick="showAnswer()">Show Answer</button>';
        } else {
            html += '<span></span>';
        }
    } else {
        if (currentExam.answers[currentIndex] !== null) {
            html += currentIndex < questions.length - 1
                ? '<button class="btn-primary" onclick="nextQuestion()">Next →</button>'
                : '<button class="btn-primary" onclick="finishExam()">Submit Exam</button>';
        } else {
            html += '<span></span>';
        }
    }
    nav.innerHTML = html;
}

function selectOption(optionIndex) {
    if (!currentExam || currentExam.submitted) return;
    const { mode, currentIndex } = currentExam;
    if (mode === 'training' && currentExam.showAnswer) return;

    currentExam.answers[currentIndex] = optionIndex;
    if (currentExam.firstAnswers[currentIndex] === null) currentExam.firstAnswers[currentIndex] = optionIndex;

    if (mode === 'training') {
        const question = currentExam.questions[currentIndex];
        const selectedText = question.shuffledOptions[optionIndex].substring(2).trim();
        const isCorrect = selectedText === question.originalCorrectText;
        if (isCorrect) {
            currentExam.showAnswer = true;
            showCelebration();
            saveExamState();
            renderExam();
        } else {
            if (!wrongQuestions.includes(question.id)) {
                wrongQuestions.push(question.id);
                saveWrongQuestions();
            }
            renderExam();
        }
    } else {
        saveExamState();
        renderExam();
    }
}

function showAnswer() {
    if (!currentExam) return;
    const question = currentExam.questions[currentExam.currentIndex];
    const userAnswerIdx = currentExam.answers[currentExam.currentIndex];
    if (userAnswerIdx !== null) {
        const selectedText = question.shuffledOptions[userAnswerIdx].substring(2).trim();
        if (selectedText !== question.originalCorrectText && !wrongQuestions.includes(question.id)) {
            wrongQuestions.push(question.id);
            saveWrongQuestions();
        }
    }
    currentExam.showAnswer = true;
    saveExamState();
    renderExam();
}

function nextQuestion() {
    if (!currentExam) return;
    if (currentExam.currentIndex < currentExam.questions.length - 1) {
        currentExam.currentIndex += 1;
        currentExam.showAnswer = false;
        saveExamState();
        renderExam();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function prevQuestion() {
    if (!currentExam || currentExam.direction !== 'twoway') return;
    if (currentExam.currentIndex > 0) {
        currentExam.currentIndex -= 1;
        if (currentExam.mode === 'training') currentExam.showAnswer = currentExam.answers[currentExam.currentIndex] !== null;
        saveExamState();
        renderExam();
    }
}

function navigateToQuestion(index) {
    if (!currentExam) return;
    if (currentExam.direction === 'oneway' && index < currentExam.currentIndex) return;
    if (currentExam.direction === 'twoway') {
        currentExam.currentIndex = index;
        if (currentExam.mode === 'training') currentExam.showAnswer = currentExam.answers[index] !== null;
        saveExamState();
        renderExam();
    }
}

function toggleGrid() {
    const grid = document.getElementById('question-grid');
    const btn = document.getElementById('btn-grid-toggle');
    grid.classList.toggle('hidden');
    btn.innerHTML = grid.classList.contains('hidden') ? '<span>☰</span> Show Grid' : '<span>☰</span> Hide Grid';
}

function exitExam() {
    if (!currentExam || currentExam.submitted) {
        currentExam = null;
        goHome();
        return;
    }
    showExitConfirmModal();
}

function showExitConfirmModal() {
    showModal({
        title: 'خروج من الامتحان',
        body: '<p>هل أنت متأكد من رغبتك بالخروج من الامتحان؟</p>',
        actions: [
            { label: 'لا', className: 'btn-secondary', onClick: closeModal },
            { label: 'نعم', className: 'btn-primary', onClick: () => { closeModal(); showSaveProgressModal(); } }
        ]
    });
}

function showSaveProgressModal() {
    showModal({
        title: 'حفظ التقدم',
        body: '<p>هل تود حفظ تقدمك على الأسئلة التي أجبت عليها؟</p>',
        actions: [
            { label: 'العودة للامتحان', className: 'btn-secondary', onClick: closeModal },
            { label: 'لا والخروج', className: 'btn-danger', onClick: () => { closeModal(); clearExamState(); currentExam = null; goHome(); } },
            { label: 'نعم والخروج', className: 'btn-primary', onClick: () => { closeModal(); saveExamState(); currentExam = null; goHome(); } }
        ]
    });
}

function startTimer() {
    const timerEl = document.getElementById('exam-timer');
    timerEl.classList.remove('hidden');
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        if (!currentExam || currentExam.submitted) {
            clearInterval(timerInterval);
            return;
        }
        const elapsed = Date.now() - currentExam.startTime;
        const remaining = currentExam.totalTime - elapsed;
        if (remaining <= 0) {
            clearInterval(timerInterval);
            timeUp();
            return;
        }
        const mins = Math.floor(remaining / 60000);
        const secs = Math.floor((remaining % 60000) / 1000);
        timerEl.textContent = `${mins}:${String(secs).padStart(2, '0')}`;
        timerEl.classList.toggle('timer-danger', remaining <= 60000);
    }, 1000);
}

function timeUp() {
    const unanswered = currentExam.answers.filter(a => a === null).length;
    showToast(`Time is up! ${unanswered} questions unanswered.`);
    finishExam();
}

function finishExam() {
    if (!currentExam) return;
    currentExam.submitted = true;
    currentExam.endTime = Date.now();
    clearInterval(timerInterval);
    timerInterval = null;
    saveProgress();
    clearExamState();
    if (currentExam.mode === 'exam') {
        showScreen('results-screen');
        showWaitingMessages();
    } else {
        showResults();
    }
}

function showWaitingMessages() {
    const waitDiv = document.getElementById('results-waiting');
    const contentDiv = document.getElementById('results-content');
    const msgEl = document.getElementById('waiting-message');
    waitDiv.classList.remove('hidden');
    contentDiv.innerHTML = '';
    const messages = ['Processing your answers...', 'Calculating your score...', 'Analyzing your performance...', 'Almost there...', 'Preparing your results...'];
    let idx = 0;
    const interval = setInterval(() => {
        idx = (idx + 1) % messages.length;
        msgEl.textContent = messages[idx];
    }, 1600);
    setTimeout(() => {
        clearInterval(interval);
        waitDiv.classList.add('hidden');
        showResults();
    }, 3000);
}

function showResults() {
    showScreen('results-screen');
    const contentDiv = document.getElementById('results-content');
    const reviewDiv = document.getElementById('results-review');
    reviewDiv.classList.add('hidden');
    reviewDiv.innerHTML = '';

    const { questions, answers, firstAnswers, startTime, endTime, mode } = currentExam;
    const total = questions.length;
    const answeredCount = answers.filter(a => a !== null).length;
    const unanswered = total - answeredCount;

    let correct = 0;
    const answersToCheck = mode === 'exam' ? answers : firstAnswers;
    answersToCheck.forEach((ansIdx, i) => {
        if (ansIdx !== null) {
            const selectedText = questions[i].shuffledOptions[ansIdx].substring(2).trim();
            if (selectedText === questions[i].originalCorrectText) correct += 1;
        }
    });

    const incorrect = answeredCount - correct;
    const score = total ? Math.round((correct / total) * 100) : 0;
    const totalSeconds = endTime ? Math.round((endTime - startTime) / 1000) : 0;
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;

    if (score > 50) showCelebration();

    contentDiv.innerHTML = `
        <div class="result-score">${score}%</div>
        <div class="result-details">
            <div class="result-card"><div class="value">${correct}/${total}</div><div class="label">Correct</div></div>
            <div class="result-card"><div class="value">${mins}m ${secs}s</div><div class="label">Time Spent</div></div>
            <div class="result-card"><div class="value">${unanswered}</div><div class="label">Unanswered</div></div>
            <div class="result-card"><div class="value">${incorrect}</div><div class="label">Incorrect</div></div>
        </div>
        <button class="btn-primary mt-20" onclick="reviewExam()">Review Questions</button>
        <button class="btn-secondary mt-10" onclick="goHome()">Back to Home</button>
    `;
}

function reviewExam() {
    if (!currentExam) return;
    const { questions, answers } = currentExam;
    const reviewDiv = document.getElementById('results-review');
    reviewDiv.classList.remove('hidden');

    let html = '<h3 class="mt-20" style="text-align:left">Review</h3>';
    questions.forEach((q, i) => {
        const userAnswerIdx = answers[i];
        let isCorrect = false;
        if (userAnswerIdx !== null) {
            const selectedText = q.shuffledOptions[userAnswerIdx].substring(2).trim();
            isCorrect = selectedText === q.originalCorrectText;
        }
        const correctIdx = q.shuffledOptions.findIndex(opt => opt.substring(2).trim() === q.originalCorrectText);
        const isFav = favorites.includes(q.id);

        html += `
            <div class="question-container mt-10" style="border-left: 4px solid ${isCorrect ? 'var(--success)' : 'var(--danger)'}">
                <div class="question-header">
                    <span class="question-number">Q${escapeHtml(q.number || String(i + 1))}</span>
                    <div class="question-actions">
                        <button class="icon-btn ${isFav ? 'active' : ''}" onclick="toggleFavorite('${escapeJs(q.id)}'); reviewExam();" title="Favorite">✦</button>
                        <button class="icon-btn" onclick="showLocation('${escapeJs(q.subjectName)}', '${escapeJs(q.lectureName)}', '${escapeJs(q.batchName)}', '${escapeJs(q.number)}', '${escapeJs(q.pageNumber)}')" title="Location">📍</button>
                    </div>
                    <span style="color:${isCorrect ? 'var(--success)' : 'var(--danger)'}; font-weight:600">${isCorrect ? '✓ Correct' : '✗ Wrong'}</span>
                </div>
                <p class="question-text">${escapeHtml(q.text)}</p>
                <div class="options-list">
                    ${q.shuffledOptions.map((opt, oi) => {
                        let cls = 'option-btn';
                        if (oi === correctIdx) cls += ' correct';
                        if (oi === userAnswerIdx && oi !== correctIdx) cls += ' wrong';
                        return `<div class="${cls}" style="cursor:default">${escapeHtml(opt)}</div>`;
                    }).join('')}
                </div>
                <div class="explanation-box visible"><strong>Explanation:</strong> ${escapeHtml(q.explanation || 'No explanation available.')}</div>
            </div>
        `;
    });
    reviewDiv.innerHTML = html;
}

function populateSearchFilter() {
    const filter = document.getElementById('search-filter');
    filter.innerHTML = '<option value="all">All Subjects</option>';
    Object.values(subjectCatalog)
        .sort((a, b) => a.name.localeCompare(b.name))
        .forEach(subject => {
            filter.innerHTML += `<option value="${escapeHtml(subject.slug)}">${escapeHtml(subject.name)}</option>`;
        });
}

function performSearch() {
    const query = document.getElementById('search-input').value.toLowerCase().trim();
    const filter = document.getElementById('search-filter').value;
    const resultsDiv = document.getElementById('search-results');
    readonlyReturnTo = 'search';

    if (query.length < 2) {
        resultsDiv.innerHTML = '<p style="color:var(--text-muted); text-align:center; padding:20px;">Type at least 2 characters to search...</p>';
        return;
    }

    const results = allQuestions.filter(q => {
        const haystack = `${q.text} ${q.optionsRaw.join(' ')} ${q.explanation}`.toLowerCase();
        const subjectMatch = filter === 'all' || q.subjectSlug === filter;
        return haystack.includes(query) && subjectMatch;
    });

    if (!results.length) {
        resultsDiv.innerHTML = '<p style="color:var(--text-muted); text-align:center; padding:20px;">No results found.</p>';
        return;
    }

    resultsDiv.innerHTML = results.slice(0, 50).map(q => `
        <div class="search-result-item" onclick="openReadonly('${escapeJs(q.id)}')">
            <p><strong>${escapeHtml(q.subjectName)} · ${escapeHtml(q.lectureName)} · Q${escapeHtml(q.number)}</strong> — ${escapeHtml(q.text.substring(0, 120))}${q.text.length > 120 ? '...' : ''}</p>
            <div class="search-result-meta">📍 ${escapeHtml(q.batchName || 'No batch')} · ${escapeHtml(q.pageNumber || '')}</div>
        </div>
    `).join('');
}

function openReadonly(questionId) {
    const question = allQuestions.find(q => q.id === questionId);
    if (!question) return;

    const shuffled = shuffleOptions(question);
    const isFav = favorites.includes(question.id);
    const correctIdx = shuffled.shuffledOptions.findIndex(opt => opt.substring(2).trim() === question.correctAnswerText);
    showScreen('readonly-screen');

    document.getElementById('readonly-content').innerHTML = `
        <div class="question-header">
            <span class="question-number">Question ${escapeHtml(question.number)}</span>
            <div class="question-actions">
                <button class="icon-btn ${isFav ? 'active' : ''}" onclick="toggleFavorite('${escapeJs(question.id)}'); openReadonly('${escapeJs(question.id)}');" title="Favorite">✦</button>
                <button class="icon-btn" onclick="showLocation('${escapeJs(question.subjectName)}', '${escapeJs(question.lectureName)}', '${escapeJs(question.batchName)}', '${escapeJs(question.number)}', '${escapeJs(question.pageNumber)}')" title="Location">📍</button>
            </div>
        </div>
        <p class="question-text">${escapeHtml(question.text)}</p>
        <div class="options-list">
            ${shuffled.shuffledOptions.map((opt, i) => `<div class="option-btn ${i === correctIdx ? 'correct' : ''}" style="cursor:default">${escapeHtml(opt)}</div>`).join('')}
        </div>
        <div class="explanation-box visible"><strong>Explanation:</strong> ${escapeHtml(question.explanation || 'No explanation available.')}</div>
        <div class="mt-20" style="color:var(--text-light); font-size:0.9rem; padding:12px; background:var(--border-light); border-radius:var(--radius-sm);">
            <p><strong>Subject:</strong> ${escapeHtml(question.subjectName)}</p>
            <p><strong>Lecture:</strong> ${escapeHtml(question.lectureName || '—')}</p>
            <p><strong>Batch:</strong> ${escapeHtml(question.batchName || '—')}</p>
            <p><strong>Page:</strong> ${escapeHtml(question.pageNumber || '—')}</p>
            <p><strong>Source:</strong> ${escapeHtml(question.source)}</p>
        </div>
    `;
}

function closeReadonly() {
    if (readonlyReturnTo === 'search') showScreen('search-screen');
    else if (readonlyReturnTo === 'wrong' || readonlyReturnTo === 'favorites') reopenCurrentQuestionList();
    else goHome();
}

function openWrongQuestions() {
    const questions = allQuestions.filter(q => wrongQuestions.includes(q.id));
    if (!questions.length) {
        showToast('No wrong questions yet!');
        return;
    }
    currentQuestionListMode = 'wrong';
    readonlyReturnTo = 'wrong';
    showQuestionListScreen(questions, 'Wrong Questions');
}

function openFavoriteQuestions() {
    const questions = allQuestions.filter(q => favorites.includes(q.id));
    if (!questions.length) {
        showToast('No favorite questions yet!');
        return;
    }
    currentQuestionListMode = 'favorites';
    readonlyReturnTo = 'favorites';
    showQuestionListScreen(questions, 'Favorite Questions');
}

function reopenCurrentQuestionList() {
    if (currentQuestionListMode === 'wrong') openWrongQuestions();
    else if (currentQuestionListMode === 'favorites') openFavoriteQuestions();
    else goHome();
}

function showQuestionListScreen(questions, title) {
    selectionScreenReturnTo = 'home';
    showScreen('selection-screen');
    document.getElementById('selection-title').textContent = title;
   
