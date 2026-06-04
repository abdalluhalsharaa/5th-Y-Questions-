/* ============================================
   MEDICAL EXAM PRACTICE - MAIN JAVASCRIPT
   Dynamic GitHub subject discovery + 6-theme system
   ============================================ */

let subjects = [];
let allQuestions = [];
let currentExam = null;
let settings = {};
let favorites = [];
let wrongQuestions = [];
let progress = {};
let discoveredRepo = null;
let currentSubject = null;
let currentSelectionMeta = null;

let selectedGroups = [];
let currentGroups = [];
let selectedMode = null;
let selectedDirection = null;
let extraTime = 0;
let extraTimeAdded = false;

let timerInterval = null;
let toastTimer = null;
let assetPathCache = {};
let bodyGestureAudioUnlocked = false;

const STORAGE_KEYS = {
    settings: 'medical-app-settings-v4',
    progress: 'medical-app-progress-v4',
    favorites: 'medical-app-favorites-v4',
    wrong: 'medical-app-wrong-v4',
    examState: 'medical-app-exam-state-v4'
};

const BACKGROUND_SOUNDS = {
    none: { label: 'بدون صوت', file: '' },
    cafeteria: { label: 'الكافيتيريا', file: 'Cafeteria.mp3' },
    'after-exam': { label: 'بعد الامتحان', file: 'After the exam.mp3' },
    beach: { label: 'الشاطئ', file: 'Beach.mp3' },
    forest: { label: 'الغابة', file: 'Forest.mp3' },
    fireplace: { label: 'مدفأة حطب', file: 'Fireplace.mp3' },
    'rain-thunder': { label: 'أمطار رعدية', file: 'Rain-thunder.mp3' },
    'rain-window': { label: 'مطر على النافذة', file: 'Rain-window.mp3' }
};

const THEMES = {
    default: {
        name: 'الافتراضي',
        icons: {
            exams: '📝', wrong: '❌', favorites: '⭐', search: '🔍', statistics: '📊', settings: '⚙️',
            lectures: '📚', ai: '🤖', years: '📅', start: '🚀', results: '🏆', progress: '🎯',
            favoriteAction: '✦', location: '📍', success: '✅', error: '❌', review: '🧾', subject: '📘'
        },
        texts: {
            startExam: '🚀 Start Exam',
            resultsTitle: 'Results',
            statsTitle: '📊 الإحصائيات',
            settingsTitle: '⚙️ الإعدادات',
            examSettingsTitle: '⚙️ Exam Settings',
            examSettingsButton: '⚙️ Exam Settings',
            progressLabel: 'Progress',
            missionModeTraining: 'Training Mode',
            missionModeExam: 'Real Exam Mode'
        },
        toasts: { successPrefix: '✅', errorPrefix: '❌', infoPrefix: 'ℹ️' }
    },
    desert: {
        name: 'البادية',
        icons: {
            exams: '🏹', wrong: '🦂', favorites: '🌵', search: '🔎', statistics: '🧭', settings: '🏕️',
            lectures: '📜', ai: '🔥', years: '📅', start: '🐪', results: '👑', progress: '🏹',
            favoriteAction: '🌵', location: '🧭', success: '🤎', error: '🦂', review: '📜', subject: '🏜️'
        },
        texts: {
            startExam: '🐪 Start Journey',
            resultsTitle: 'Majlis Report',
            statsTitle: '🧭 إحصائيات الرحلة',
            settingsTitle: '🏕️ إعدادات الخيمة',
            examSettingsTitle: '🏕️ Exam Camp Settings',
            examSettingsButton: '🏕️ Exam Settings',
            progressLabel: 'Desert Progress',
            missionModeTraining: 'Training Camp',
            missionModeExam: 'Journey Exam'
        },
        toasts: { successPrefix: '🤎', errorPrefix: '🦂', infoPrefix: '🏜️' }
    },
    space: {
        name: 'الفضاء',
        icons: {
            exams: '🚀', wrong: '☄️', favorites: '🌟', search: '🔭', statistics: '📡', settings: '🤖',
            lectures: '🛰️', ai: '👽', years: '🪐', start: '🚀', results: '🌌', progress: '🎯',
            favoriteAction: '🌟', location: '📡', success: '✨', error: '☄️', review: '🧾', subject: '🪐'
        },
        texts: {
            startExam: '🚀 Launch Mission',
            resultsTitle: 'Mission Report',
            statsTitle: '📡 Mission Analytics',
            settingsTitle: '🤖 Space Controls',
            examSettingsTitle: '🤖 Mission Controls',
            examSettingsButton: '🤖 Mission Settings',
            progressLabel: 'Mission Progress',
            missionModeTraining: 'Training Mission',
            missionModeExam: 'Space Mission'
        },
        toasts: { successPrefix: '✨', errorPrefix: '☄️', infoPrefix: '🪐' }
    },
    pirates: {
        name: 'القراصنة',
        icons: {
            exams: '☠️', wrong: '🦈', favorites: '💰', search: '🔎', statistics: '🧭', settings: '⚓',
            lectures: '🗺️', ai: '🦜', years: '🗓️', start: '☠️', results: '👑', progress: '🏴‍☠️',
            favoriteAction: '💰', location: '🧭', success: '🪙', error: '🦈', review: '📜', subject: '⚓'
        },
        texts: {
            startExam: '☠️ Start Voyage',
            resultsTitle: 'Treasure Report',
            statsTitle: '🧭 Voyage Progress',
            settingsTitle: '⚓ Captain Settings',
            examSettingsTitle: '⚓ Voyage Settings',
            examSettingsButton: '⚓ Voyage Settings',
            progressLabel: 'Voyage Progress',
            missionModeTraining: 'Deck Training',
            missionModeExam: 'Treasure Voyage'
        },
        toasts: { successPrefix: '🪙', errorPrefix: '🦈', infoPrefix: '🏴‍☠️' }
    },
    castle: {
        name: 'القلعة',
        icons: {
            exams: '⚔️', wrong: '🐉', favorites: '👑', search: '🔎', statistics: '🛡️', settings: '🏰',
            lectures: '📜', ai: '🕯️', years: '📅', start: '⚔️', results: '👑', progress: '🏹',
            favoriteAction: '👑', location: '🛡️', success: '🛡️', error: '🐉', review: '📜', subject: '🏰'
        },
        texts: {
            startExam: '⚔️ Begin Quest',
            resultsTitle: 'Kingdom Report',
            statsTitle: '🛡️ Quest Progress',
            settingsTitle: '🏰 Castle Settings',
            examSettingsTitle: '🏰 Quest Settings',
            examSettingsButton: '🏰 Quest Settings',
            progressLabel: 'Quest Progress',
            missionModeTraining: 'Knight Training',
            missionModeExam: 'Kingdom Trial'
        },
        toasts: { successPrefix: '🛡️', errorPrefix: '🐉', infoPrefix: '🏰' }
    },
    lab: {
        name: 'المختبر',
        icons: {
            exams: '🧪', wrong: '☣️', favorites: '🧬', search: '🔬', statistics: '📈', settings: '⚗️',
            lectures: '🔬', ai: '🧠', years: '📅', start: '🧪', results: '🏅', progress: '🧫',
            favoriteAction: '🧬', location: '📍', success: '🧫', error: '☣️', review: '📋', subject: '⚗️'
        },
        texts: {
            startExam: '🧪 Start Experiment',
            resultsTitle: 'Research Report',
            statsTitle: '📈 Experiment Progress',
            settingsTitle: '⚗️ Lab Settings',
            examSettingsTitle: '⚗️ Experiment Settings',
            examSettingsButton: '⚗️ Experiment Settings',
            progressLabel: 'Experiment Progress',
            missionModeTraining: 'Trial Run',
            missionModeExam: 'Main Experiment'
        },
        toasts: { successPrefix: '🧫', errorPrefix: '☣️', infoPrefix: '🧪' }
    }
};

const DEFAULT_SETTINGS = {
    darkMode: false,
    theme: 'default',
    bgSound: 'none',
    bgSoundEnabled: true,
    volume: 50,
    feedbackEnabled: true,
    animations: true
};

const IGNORE_ROOT_DIRS = new Set(['.git', '.github', 'node_modules', 'assets', 'asset', 'audio', 'audios', 'img', 'images', 'css', 'js', 'docs', 'dist', 'build']);

const CATEGORY_LABELS = {
    lectures: 'Lectures',
    ai: 'AI',
    years: 'Years'
};

document.addEventListener('DOMContentLoaded', async () => {
    loadSettings();
    loadProgress();
    loadFavorites();
    loadWrongQuestions();
    applySettings();
    displayRandomQuote();
    await prepareStaticEffectAudio();
    primeAudioUnlock();
    await loadData();
    checkResumeExam();
});

function currentTheme() { return THEMES[settings.theme] || THEMES.default; }

function displayRandomQuote() {
    const quotes = [
        'لا توجد وصفة سحرية، ولا توجد طريقة ليس فيها العمل والتعب وبذل الجهد!',
        'الفشل ليس النهاية، بل خطوة ضرورية نحو القمة إذا تعلمت منه.',
        'العلم الذي تدرسه اليوم هو الأمل الذي ستمنحه لغيرك غدًا.',
        'دراسة الطب ماراثون وليست سباقًا قصيرًا؛ واصل التقدم بهدوء.',
        'ابدأ الآن، فالوقت المثالي لا يأتي وحده.'
    ];
    const quoteEl = document.getElementById('random-quote');
    if (quoteEl) quoteEl.textContent = quotes[Math.floor(Math.random() * quotes.length)];
}

/* ===================== DATA LOADING ===================== */
async function loadData() {
    try {
        subjects = [];
        allQuestions = [];
        discoveredRepo = await discoverRepository();
        if (!discoveredRepo) throw new Error('Repository metadata not detected.');

        const rootItems = await listRepoDirectory('');
        const dirItems = rootItems.filter(item => item.type === 'dir' && !IGNORE_ROOT_DIRS.has(item.name.toLowerCase()));
        const subjectResults = await Promise.all(dirItems.map(scanSubjectFolder));
        subjects = subjectResults.filter(Boolean).sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }));
        allQuestions = subjects.flatMap(subject => subject.allQuestions);
        populateSearchFilter();
        renderSubjects();
        updateStatisticsIfOpen();
    } catch (error) {
        console.error(error);
        showToast('تعذر تحميل المواد من GitHub. تأكد من أن المجلدات موجودة داخل الريبو.', 'error');
        renderSubjects();
    }
}

async function discoverRepository() {
    const hostname = window.location.hostname;
    if (!hostname.endsWith('github.io')) return null;
    const owner = hostname.split('.')[0];
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    const repo = pathParts.length > 0 ? pathParts[0] : `${owner}.github.io`;
    const repoMetaRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
    if (!repoMetaRes.ok) throw new Error('Unable to read repository metadata.');
    const repoMeta = await repoMetaRes.json();
    return { owner, repo, branch: repoMeta.default_branch || 'main' };
}

async function listRepoDirectory(path) {
    const cleanPath = path ? encodeURIComponent(path).replace(/%2F/g, '/') : '';
    const url = `https://api.github.com/repos/${discoveredRepo.owner}/${discoveredRepo.repo}/contents/${cleanPath}?ref=${encodeURIComponent(discoveredRepo.branch)}`;
    const res = await fetch(url, { headers: { 'Accept': 'application/vnd.github+json' } });
    if (!res.ok) throw new Error(`Unable to read directory: ${path || 'root'}`);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
}

async function scanSubjectFolder(dirItem) {
    const subjectName = dirItem.name;
    const subjectItems = await listRepoDirectory(dirItem.path);
    const lectureFiles = subjectItems.filter(item => item.type === 'file' && item.name.toLowerCase().endsWith('.txt')).sort((a,b) => a.name.localeCompare(b.name));
    const aiFolder = subjectItems.find(item => item.type === 'dir' && item.name.toLowerCase() === 'ai');
    let aiFiles = [];
    if (aiFolder) {
        const aiItems = await listRepoDirectory(aiFolder.path);
        aiFiles = aiItems.filter(item => item.type === 'file' && item.name.toLowerCase().endsWith('.txt')).sort((a,b) => a.name.localeCompare(b.name));
    }

    // If folder exists with .gitkeep / README only, still show as material.
    if (lectureFiles.length === 0 && aiFiles.length === 0 && subjectItems.every(item => item.type !== 'dir' || item.name.toLowerCase() !== 'ai')) {
        return {
            id: slugify(subjectName), name: subjectName, lectures: [], ai: [], years: [], allQuestions: [], totalQuestions: 0, totalLectures: 0
        };
    }

    const lectures = [];
    const aiLectures = [];
    let counter = 1;

    for (const file of lectureFiles) {
        const group = await buildLectureGroupFromFile(file, subjectName, 'lecture', counter);
        if (group) { counter += group.questions.length; lectures.push(group); }
    }
    for (const file of aiFiles) {
        const group = await buildLectureGroupFromFile(file, subjectName, 'ai', counter);
        if (group) { counter += group.questions.length; aiLectures.push(group); }
    }

    const combined = [...lectures.flatMap(g => g.questions), ...aiLectures.flatMap(g => g.questions)];
    const years = buildYearGroups(subjectName, combined);
    return {
        id: slugify(subjectName),
        name: subjectName,
        lectures,
        ai: aiLectures,
        years,
        allQuestions: combined,
        totalQuestions: combined.length,
        totalLectures: lectures.length + aiLectures.length
    };
}

async function buildLectureGroupFromFile(fileItem, subjectName, sourceType, startCounter) {
    try {
        const text = await fetchQuestionFile(fileItem);
        const lectureName = fileItem.name.replace(/\.txt$/i, '');
        const questions = parseQuestionFile(text, { subjectName, lectureName, sourceType, sourcePath: fileItem.path, startCounter });
        if (!questions.length) return null;
        return {
            id: `${slugify(subjectName)}__${sourceType}__${slugify(lectureName)}`,
            name: lectureName,
            type: sourceType,
            subjectName,
            path: fileItem.path,
            questions
        };
    } catch (error) {
        console.warn('Failed to parse file:', fileItem.path, error);
        return null;
    }
}

async function fetchQuestionFile(fileItem) {
    if (fileItem.download_url) {
        const res = await fetch(fileItem.download_url);
        if (res.ok) return await res.text();
    }
    const url = `https://raw.githubusercontent.com/${discoveredRepo.owner}/${discoveredRepo.repo}/${discoveredRepo.branch}/${fileItem.path}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Unable to fetch file: ${fileItem.path}`);
    return await res.text();
}

function buildYearGroups(subjectName, questionPool) {
    const map = new Map();
    questionPool.forEach(question => {
        const batch = (question.batchName || '').trim();
        if (!batch) return;
        if (!map.has(batch)) map.set(batch, []);
        map.get(batch).push({ ...question, originalSourceType: question.sourceType, sourceType: 'year' });
    });
    return Array.from(map.entries()).sort((a,b)=>a[0].localeCompare(b[0],'en',{sensitivity:'base'})).map(([batchName, questions]) => ({
        id: `${slugify(subjectName)}__year__${slugify(batchName)}`,
        name: batchName,
        type: 'year',
        subjectName,
        questions
    }));
}

/* ===================== UNIVERSAL PARSER ===================== */
function parseQuestionFile(rawText, meta) {
    const normalized = normalizeText(rawText);
    const blocks = smartSplitQuestionBlocks(normalized);
    const questions = [];
    let fallbackCounter = meta.startCounter || 1;
    blocks.forEach((block, blockIndex) => {
        const q = parseQuestionBlock(block, meta, fallbackCounter, blockIndex);
        if (q) {
            if (!q.number) q.number = String(fallbackCounter);
            fallbackCounter += 1;
            questions.push(q);
        }
    });
    return questions;
}

function normalizeText(text) {
    return String(text || '')
        .replace(/^\uFEFF/, '')
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .replace(/\t/g, '    ')
        .replace(/\/\/\/\/\//g, '\n')
        .trim();
}

function smartSplitQuestionBlocks(text) {
    if (!text) return [];
    let chunks = text.split(/(?:^|\n)\s*###\s*(?=\n|$)/g).map(s => s.trim()).filter(Boolean);
    if (chunks.length > 1) return chunks;
    const paragraphs = text.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
    if (paragraphs.length <= 1) return [text.trim()].filter(Boolean);
    const blocks = [];
    let current = [];
    let hasCorrect = false;
    paragraphs.forEach((paragraph, idx) => {
        const looksNew = current.length > 0 && hasCorrect && isLikelyNewQuestionParagraph(paragraph);
        if (looksNew) {
            blocks.push(current.join('\n\n').trim());
            current = [];
            hasCorrect = false;
        }
        current.push(paragraph);
        if (/^\s*Correct\s*Answer\s*:/im.test(paragraph)) hasCorrect = true;
        if (idx === paragraphs.length - 1 && current.length) blocks.push(current.join('\n\n').trim());
    });
    return blocks.filter(Boolean);
}

function isLikelyNewQuestionParagraph(paragraph) {
    const firstLine = (paragraph.split('\n').find(line => line.trim()) || '').trim();
    if (!firstLine) return false;
    if (/^Question\s*\d+/i.test(firstLine)) return true;
    if (/^(Correct\s*Answer|Explanation)\s*:/i.test(firstLine)) return false;
    if (/^[A-E][\)\.\-]/.test(firstLine)) return false;
    if (isPageLine(firstLine)) return false;
    return true;
}

function parseQuestionBlock(block, meta, fallbackCounter, blockIndex) {
    try {
        const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
        if (!lines.length || !lines.some(line => /^Correct\s*Answer\s*:/i.test(line))) return null;
        let questionNumber = '';
        let questionText = '';
        let options = [];
        let correctAnswer = '';
        let explanation = '';
        let batchName = '';
        let pageNumber = '';

        let i = 0;
        const qMatch = (lines[0] || '').match(/^Question\s*(\d+)\s*[:\-.]?\s*(.*)$/i);
        if (qMatch) {
            questionNumber = qMatch[1] || '';
            if (qMatch[2]) lines[0] = qMatch[2].trim(); else i = 1;
        }

        const correctIndexLine = lines.findIndex(line => /^Correct\s*Answer\s*:/i.test(line));
        if (correctIndexLine === -1) return null;
        const beforeCorrect = lines.slice(i, correctIndexLine);
        const firstOptionIdx = beforeCorrect.findIndex(line => /^[A-E][\)\.\-]\s*/i.test(line));
        if (firstOptionIdx === -1) return null;

        questionText = beforeCorrect.slice(0, firstOptionIdx).join(' ').trim() || `Question ${fallbackCounter}`;
        options = beforeCorrect.slice(firstOptionIdx).filter(line => /^[A-E][\)\.\-]\s*/i.test(line));
        correctAnswer = lines[correctIndexLine].replace(/^Correct\s*Answer\s*:\s*/i, '').trim();
        let j = correctIndexLine + 1;

        if (j < lines.length && /^Explanation\s*:/i.test(lines[j])) {
            const expParts = [lines[j].replace(/^Explanation\s*:\s*/i, '').trim()].filter(Boolean);
            j += 1;
            while (j < lines.length && !isMetadataLine(lines[j])) { expParts.push(lines[j]); j += 1; }
            explanation = expParts.join(' ').trim();
        }

        while (j < lines.length) {
            const line = lines[j];
            if (isPageLine(line)) pageNumber = line;
            else if (!batchName && isBatchLine(line)) batchName = line;
            else if (!batchName && looksLikeMetadataTail(line)) batchName = line;
            else if (!explanation && !/^Explanation\s*:/i.test(line)) explanation = [explanation, line].filter(Boolean).join(' ').trim();
            j += 1;
        }

        if (!questionNumber) questionNumber = String(fallbackCounter);
        const correctIndex = resolveCorrectIndex(options, correctAnswer);
        const id = buildQuestionId(meta.subjectName, meta.sourceType, meta.lectureName, questionNumber, questionText, blockIndex);
        return {
            id, number: questionNumber, text: questionText, options, correctAnswer, correctIndex, explanation,
            batchName, pageNumber, subjectName: meta.subjectName, lectureName: meta.lectureName,
            groupName: meta.lectureName, sourceType: meta.sourceType, sourcePath: meta.sourcePath
        };
    } catch (error) {
        console.warn('Question parse error:', error, block);
        return null;
    }
}

function isMetadataLine(line) { return isPageLine(line) || isBatchLine(line) || looksLikeMetadataTail(line); }
function isPageLine(line) { return /^P\s*\(?\s*\d+\s*\)?$/i.test(line) || /^Page\s*\d+$/i.test(line); }
function isBatchLine(line) { return /^[A-Za-z][A-Za-z0-9\s&()'\/]+-\s*\d+$/i.test(line) || /^\d+(st|nd|rd|th)\s+Year/i.test(line); }
function looksLikeMetadataTail(line) { return /^[A-Za-z].{0,60}$/.test(line) && /\d/.test(line) && !/[?.!]$/.test(line); }
function resolveCorrectIndex(options, correctAnswer) {
    if (!options.length) return -1;
    const letterMatch = String(correctAnswer || '').match(/^([A-E])/i);
    if (letterMatch) {
        const idx = letterMatch[1].toUpperCase().charCodeAt(0) - 65;
        if (idx >= 0 && idx < options.length) return idx;
    }
    const normalizedAnswer = normalizeComparisonText(correctAnswer);
    return options.findIndex(opt => normalizeComparisonText(opt).includes(normalizedAnswer) || normalizedAnswer.includes(normalizeComparisonText(opt)));
}
function buildQuestionId(subjectName, sourceType, lectureName, questionNumber, questionText, blockIndex) {
    return [slugify(subjectName), slugify(sourceType), slugify(lectureName), slugify(questionNumber || String(blockIndex+1)), hashString(questionText).slice(0,10)].join('__');
}

/* ===================== NAVIGATION ===================== */
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
    document.getElementById(screenId)?.classList.add('active');
}
function goHome() {
    toggleExamSettings(false);
    showScreen('home-screen');
    document.getElementById('results-review').classList.add('hidden');
}
function openExams() { renderSubjects(); showScreen('subjects-screen'); }
function openSection(section) {
    switch (section) {
        case 'wrong': openWrongQuestions(); break;
        case 'favorites': openFavoriteQuestions(); break;
        case 'search':
            showScreen('search-screen');
            document.getElementById('search-input').value = '';
            document.getElementById('search-results').innerHTML = '';
            break;
        default: openExams();
    }
}

function renderSubjects() {
    const container = document.getElementById('subjects-list');
    const empty = document.getElementById('subjects-empty');
    if (!container || !empty) return;
    const theme = currentTheme();
    const searchTerm = (document.getElementById('subjects-search')?.value || '').trim().toLowerCase();
    const visible = subjects.filter(s => s.name.toLowerCase().includes(searchTerm));
    if (!subjects.length) {
        empty.classList.remove('hidden');
        container.innerHTML = '';
        return;
    }
    empty.classList.add('hidden');
    container.innerHTML = visible.map(subject => `
        <button class="subject-card" onclick="openSubject('${subject.id}')">
            <span class="subject-badge">${theme.icons.subject} Subject</span>
            <h4>${escapeHtml(subject.name)}</h4>
            <div class="subject-meta">
                <div><span>${theme.icons.lectures} Lectures</span><strong>${subject.totalLectures}</strong></div>
                <div><span>${theme.icons.progress} Questions</span><strong>${subject.totalQuestions}</strong></div>
                <div><span>${theme.icons.years} Years</span><strong>${subject.years.length}</strong></div>
            </div>
        </button>
    `).join('');
    if (!visible.length) container.innerHTML = `<div class="empty-state"><div class="empty-icon">🔎</div><p>لا توجد مواد مطابقة للبحث.</p></div>`;
}
function filterSubjects() { renderSubjects(); }

function openSubject(subjectId) {
    currentSubject = subjects.find(s => s.id === subjectId) || null;
    if (!currentSubject) { showToast('المادة غير موجودة.', 'error'); return; }
    const theme = currentTheme();
    document.getElementById('subject-sections-title').textContent = currentSubject.name;
    document.getElementById('subject-sections-summary').innerHTML = `
        <div class="subject-summary-grid">
            <div><span>${theme.icons.lectures} المحاضرات</span><strong>${currentSubject.lectures.length}</strong></div>
            <div><span>${theme.icons.ai} AI</span><strong>${currentSubject.ai.length}</strong></div>
            <div><span>${theme.icons.years} Years</span><strong>${currentSubject.years.length}</strong></div>
            <div><span>${theme.icons.progress} إجمالي الأسئلة</span><strong>${currentSubject.totalQuestions}</strong></div>
        </div>
    `;
    const cards = [];
    cards.push(categoryCardHtml('lectures', `${currentSubject.name} Lectures`, theme.icons.lectures, currentSubject.lectures.length, currentSubject.lectures.reduce((s,g)=>s+g.questions.length,0), currentSubject.lectures.length > 0));
    cards.push(categoryCardHtml('ai', `${currentSubject.name} AI`, theme.icons.ai, currentSubject.ai.length, currentSubject.ai.reduce((s,g)=>s+g.questions.length,0), currentSubject.ai.length > 0));
    if (currentSubject.years.length > 0) cards.push(categoryCardHtml('years', `${currentSubject.name} Years`, theme.icons.years, currentSubject.years.length, currentSubject.years.reduce((s,g)=>s+g.questions.length,0), true));
    document.getElementById('subject-categories').innerHTML = cards.filter(Boolean).join('') || `<div class="empty-state"><div class="empty-icon">📭</div><p>لا توجد ملفات TXT بعد داخل هذه المادة.</p></div>`;
    showScreen('subject-sections-screen');
}

function categoryCardHtml(type, title, icon, count, totalQuestions, enabled) {
    if (!enabled) {
        return `
            <div class="category-card" style="opacity:.66; cursor:default;">
                <span class="category-badge">${icon} Section</span>
                <h4>${escapeHtml(title)}</h4>
                <div class="category-meta">
                    <div><span>العناصر</span><strong>0</strong></div>
                    <div><span>الأسئلة</span><strong>0</strong></div>
                </div>
            </div>
        `;
    }
    return `
        <button class="category-card" onclick="openSubjectCategory('${type}')">
            <span class="category-badge">${icon} Section</span>
            <h4>${escapeHtml(title)}</h4>
            <div class="category-meta">
                <div><span>العناصر</span><strong>${count}</strong></div>
                <div><span>الأسئلة</span><strong>${totalQuestions}</strong></div>
            </div>
        </button>
    `;
}

function openSubjectCategory(type) {
    if (!currentSubject) return;
    let groups = [];
    let title = currentSubject.name;
    let placeholder = 'ابحث...';
    if (type === 'lectures') {
        groups = currentSubject.lectures;
        title = `${currentSubject.name} Lectures`;
        placeholder = 'ابحث عن اسم المحاضرة...';
    } else if (type === 'ai') {
        groups = currentSubject.ai;
        title = `${currentSubject.name} AI`;
        placeholder = 'ابحث عن ملف AI...';
    } else if (type === 'years') {
        groups = currentSubject.years;
        title = `${currentSubject.name} Years`;
        placeholder = 'ابحث عن الدفعة...';
    }
    showSelectionScreen(groups, title, { backContext: 'subject', searchPlaceholder: placeholder, searchable: true, sectionType: type });
}

function backFromSelection() {
    if (currentSelectionMeta?.backContext === 'subject' && currentSubject) openSubject(currentSubject.id);
    else goHome();
}

/* ===================== SELECTION ===================== */
function resetSelectionState() {
    selectedGroups = [];
    currentGroups = [];
    selectedMode = null;
    selectedDirection = null;
    extraTime = 0;
    extraTimeAdded = false;
    currentSelectionMeta = null;
}

function showSelectionScreen(groups, title, meta = {}) {
    resetSelectionState();
    currentGroups = groups;
    currentSelectionMeta = meta;
    const theme = currentTheme();
    showScreen('selection-screen');
    document.getElementById('selection-title').textContent = title;
    const searchContainer = document.getElementById('selection-search-container');
    const searchInput = document.getElementById('selection-search');
    if (meta.searchable) {
        searchContainer.classList.remove('hidden');
        searchInput.value = '';
        searchInput.placeholder = meta.searchPlaceholder || 'ابحث...';
    } else searchContainer.classList.add('hidden');

    const list = document.getElementById('selection-list');
    list.innerHTML = '';
    groups.forEach((group, idx) => {
        const icon = group.type === 'lecture' ? theme.icons.lectures : group.type === 'ai' ? theme.icons.ai : theme.icons.years;
        const item = document.createElement('div');
        item.className = 'selection-item';
        item.dataset.groupName = `${group.name} ${group.subjectName || ''}`.toLowerCase();
        item.innerHTML = `
            <input type="checkbox" id="group-${idx}" onchange="toggleGroupSelection(${idx})">
            <label for="group-${idx}" style="width:100%; cursor:pointer;">
                <strong>${icon} ${escapeHtml(group.name)}</strong>
                <br><small style="color:var(--text-muted)">${group.questions.length} questions</small>
            </label>
        `;
        item.addEventListener('click', event => {
            if (event.target.closest('input') || event.target.closest('label')) return;
            const cb = item.querySelector('input');
            cb.checked = !cb.checked;
            toggleGroupSelection(idx);
        });
        list.appendChild(item);
    });
    document.getElementById('selection-footer').classList.add('hidden');
    document.getElementById('direction-selection').classList.add('hidden');
    document.getElementById('timer-options').classList.add('hidden');
    document.getElementById('start-section').classList.add('hidden');
    document.querySelectorAll('.btn-mode').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.btn-direction').forEach(btn => btn.classList.remove('active'));
}

function filterSelectionList() {
    const searchTerm = (document.getElementById('selection-search').value || '').trim().toLowerCase();
    document.querySelectorAll('#selection-list .selection-item').forEach(item => { item.style.display = (item.dataset.groupName || '').includes(searchTerm) ? '' : 'none'; });
}

function toggleGroupSelection(idx) {
    const existing = selectedGroups.indexOf(idx);
    if (existing > -1) selectedGroups.splice(existing, 1); else selectedGroups.push(idx);
    document.querySelectorAll('#selection-list .selection-item').forEach((item, i) => item.classList.toggle('selected', selectedGroups.includes(i)));
    updateSelectionFooter();
}

function updateSelectionFooter() {
    const footer = document.getElementById('selection-footer');
    const totalQuestions = selectedGroups.reduce((sum, idx) => sum + currentGroups[idx].questions.length, 0);
    const input = document.getElementById('question-count-input');
    if (selectedGroups.length > 0) {
        footer.classList.remove('hidden');
        document.getElementById('selected-count').textContent = `${totalQuestions} questions selected`;
        input.max = totalQuestions; input.value = totalQuestions;
        document.getElementById('max-questions-label').textContent = `/ ${totalQuestions}`;
    } else footer.classList.add('hidden');
    selectedMode = null; selectedDirection = null;
    document.getElementById('direction-selection').classList.add('hidden');
    document.getElementById('timer-options').classList.add('hidden');
    document.getElementById('start-section').classList.add('hidden');
    document.querySelectorAll('.btn-mode').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.btn-direction').forEach(btn => btn.classList.remove('active'));
}

function selectMode(mode) {
    selectedMode = mode; selectedDirection = null; extraTime = 0; extraTimeAdded = false;
    document.querySelectorAll('.btn-mode').forEach(btn => btn.classList.remove('active'));
    document.getElementById(mode === 'training' ? 'btn-training-mode' : 'btn-exam-mode').classList.add('active');
    document.querySelectorAll('.btn-direction').forEach(btn => btn.classList.remove('active'));
    document.getElementById('direction-selection').classList.remove('hidden');
    document.getElementById('timer-options').classList.add('hidden');
    document.getElementById('start-section').classList.add('hidden');
}

function selectDirection(direction) {
    selectedDirection = direction;
    document.querySelectorAll('.btn-direction').forEach(btn => btn.classList.remove('active'));
    document.getElementById(direction === 'oneway' ? 'btn-oneway' : 'btn-twoway').classList.add('active');
    if (selectedMode === 'exam') {
        const count = parseInt(document.getElementById('question-count-input').value, 10) || 0;
        document.getElementById('base-time-display').textContent = `${count} min`;
        document.getElementById('extra-time-display').textContent = `+0 min`;
        document.getElementById('total-time-display').textContent = `${count} min`;
        document.getElementById('timer-options').classList.remove('hidden');
        const btn = document.getElementById('btn-add-extra');
        btn.disabled = false; btn.textContent = '+ إضافة 5 دقائق';
        extraTime = 0; extraTimeAdded = false;
    } else document.getElementById('timer-options').classList.add('hidden');
    document.getElementById('start-section').classList.remove('hidden');
}

function addExtraTime() {
    if (extraTimeAdded) return;
    extraTime = 5; extraTimeAdded = true;
    const count = parseInt(document.getElementById('question-count-input').value, 10) || 0;
    document.getElementById('extra-time-display').textContent = '+5 min';
    document.getElementById('total-time-display').textContent = `${count + 5} min`;
    const btn = document.getElementById('btn-add-extra'); btn.disabled = true; btn.textContent = '✓ تمت إضافة 5 دقائق';
}

function confirmStartExam() {
    if (!selectedMode || !selectedDirection) { showToast('يرجى اختيار النمط واتجاه التنقل.', 'error'); return; }
    const count = parseInt(document.getElementById('question-count-input').value, 10);
    if (!count || count < 1) { showToast('يرجى إدخال عدد صحيح من الأسئلة.', 'error'); return; }
    let questions = [];
    selectedGroups.forEach(idx => { questions = questions.concat(currentGroups[idx].questions); });
    questions = shuffleArray([...questions]).slice(0, count);
    startExamSession(questions, selectedMode, selectedDirection, currentSelectionMeta?.sectionType || 'custom', extraTime);
}

function startExamSession(questions, mode, direction, sourceLabel = '', extraMinutes = 0) {
    if (!questions.length) { showToast('لا توجد أسئلة متاحة.', 'error'); return; }
    currentExam = {
        mode, direction, questions: questions.map(q => ({ ...q })), currentIndex: 0,
        answers: new Array(questions.length).fill(null), firstAnswers: new Array(questions.length).fill(null),
        startTime: Date.now(), totalTime: (questions.length + extraMinutes) * 60 * 1000,
        submitted: false, showAnswer: false, sourceLabel
    };
    saveExamState();
    showScreen('exam-screen');
    renderExam();
    if (mode === 'exam') startTimer();
}
function startSpecialExam(questions, mode, direction) { startExamSession(shuffleArray([...questions]), mode, direction || 'twoway', 'special', 5); }

/* ===================== EXAM RENDERING ===================== */
function renderExam() {
    if (!currentExam) return;
    const theme = currentTheme();
    const { mode, direction, questions, currentIndex, answers } = currentExam;
    const question = questions[currentIndex];
    if (!question) return;
    const remaining = questions.length - currentIndex;
    let progressText = `${theme.icons.progress} ${theme.texts.progressLabel} · ${currentIndex + 1}/${questions.length}`;
    if (mode === 'training') {
        const answered = currentExam.firstAnswers.filter(a => a !== null).length;
        const correct = currentExam.firstAnswers.filter((a, idx) => a !== null && isAnswerCorrect(questions[idx], a)).length;
        const pct = answered > 0 ? Math.round((correct / answered) * 100) : 0;
        progressText += ` · ${theme.icons.success}${correct} · ${pct}%`;
    } else progressText += ` · ${remaining} left`;
    document.getElementById('exam-progress').textContent = progressText;
    renderGrid();
    const isFav = favorites.includes(question.id);
    const showAnswerState = mode === 'training' && currentExam.showAnswer;
    const correctIdx = getCorrectIndex(question);
    document.getElementById('question-container').innerHTML = `
        <div class="question-header">
            <span class="question-number">Q${escapeHtml(question.number || String(currentIndex + 1))}</span>
            <div class="question-actions">
                <button class="icon-btn ${isFav ? 'active' : ''}" onclick="toggleFavorite('${question.id}')" title="Favorite">${theme.icons.favoriteAction}</button>
                <button class="icon-btn" onclick="showLocation('${escapeJsString(question.subjectName)}','${escapeJsString(question.lectureName)}','${escapeJsString(question.batchName || '')}','${escapeJsString(question.pageNumber || '')}')" title="Location">${theme.icons.location}</button>
            </div>
        </div>
        <p class="question-text">${escapeHtml(question.text)}</p>
        <div class="options-list">
            ${question.options.map((opt, idx) => {
                let cls = 'option-btn';
                if (answers[currentIndex] === idx) cls += ' selected';
                if (showAnswerState) {
                    if (idx === correctIdx) cls += ' correct'; else if (answers[currentIndex] === idx && idx !== correctIdx) cls += ' wrong';
                }
                return `<button class="${cls}" onclick="selectOption(${idx})">${escapeHtml(opt)}</button>`;
            }).join('')}
        </div>
        <div class="explanation-box ${showAnswerState ? 'visible' : ''}"><strong>Explanation:</strong> ${escapeHtml(question.explanation || 'No explanation available.')}</div>
        <div class="inline-meta">
            <span>${theme.icons.subject} ${escapeHtml(question.subjectName || '')}</span>
            <span>${question.sourceType === 'ai' ? theme.icons.ai : theme.icons.lectures} ${escapeHtml(question.lectureName || '')}</span>
            ${question.batchName ? `<span>${theme.icons.years} ${escapeHtml(question.batchName)}</span>` : ''}
            ${question.pageNumber ? `<span>${theme.icons.location} ${escapeHtml(question.pageNumber)}</span>` : ''}
        </div>
    `;
    renderExamNav();
}

function renderGrid() {
    if (!currentExam) return;
    const grid = document.getElementById('question-grid');
    const { questions, currentIndex, answers, mode, direction, firstAnswers } = currentExam;
    grid.innerHTML = '';
    questions.forEach((q, idx) => {
        let cls = 'grid-btn';
        if (idx === currentIndex) cls += ' current';
        else if (answers[idx] !== null) {
            if (mode === 'training' && firstAnswers[idx] !== null) cls += isAnswerCorrect(q, firstAnswers[idx]) ? ' answered' : ' wrong';
            else cls += ' answered';
        }
        if (direction === 'oneway' && idx < currentIndex) cls += ' disabled';
        const btn = document.createElement('button');
        btn.className = cls; btn.textContent = idx + 1; btn.onclick = () => navigateToQuestion(idx); grid.appendChild(btn);
    });
}

function renderExamNav() {
    if (!currentExam) return;
    const nav = document.getElementById('exam-nav');
    const { mode, direction, currentIndex, questions } = currentExam;
    let left = '<span></span>', right = '<span></span>';
    if (direction === 'twoway' && currentIndex > 0) left = `<button class="btn-secondary" onclick="prevQuestion()">Previous ←</button>`;
    if (mode === 'training') {
        if (currentExam.showAnswer) right = currentIndex < questions.length - 1 ? `<button class="btn-primary" onclick="nextQuestion()">Next →</button>` : `<button class="btn-primary" onclick="finishExam()">Finish</button>`;
        else if (currentExam.answers[currentIndex] !== null) right = `<button class="btn-small" onclick="showAnswer()">Show Answer</button>`;
    } else if (currentExam.answers[currentIndex] !== null) {
        right = currentIndex < questions.length - 1 ? `<button class="btn-primary" onclick="nextQuestion()">Next →</button>` : `<button class="btn-primary" onclick="finishExam()">Submit Exam</button>`;
    }
    nav.innerHTML = `${left}${right}`;
}

/* ===================== EXAM INTERACTION ===================== */
function selectOption(optionIndex) {
    if (!currentExam || currentExam.submitted) return;
    if (currentExam.mode === 'training' && currentExam.showAnswer) return;
    const idx = currentExam.currentIndex;
    currentExam.answers[idx] = optionIndex;
    if (currentExam.firstAnswers[idx] === null) currentExam.firstAnswers[idx] = optionIndex;
    const question = currentExam.questions[idx];
    const isCorrect = isAnswerCorrect(question, optionIndex);
    if (currentExam.mode === 'training') {
        if (settings.feedbackEnabled) playEffectSound(isCorrect ? 'right' : 'wrong');
        if (isCorrect) {
            currentExam.showAnswer = true;
            if (settings.animations !== false) showMiniCelebration();
            showToast(themedSuccessMessage(), 'success');
        } else {
            if (!wrongQuestions.includes(question.id)) { wrongQuestions.push(question.id); saveWrongQuestions(); }
            showToast(themedWrongMessage(), 'error');
        }
        saveExamState(); renderExam();
    } else { saveExamState(); renderExam(); }
}

function themedSuccessMessage() {
    const key = settings.theme || 'default';
    switch (key) {
        case 'desert': return 'إجابة أصابت الهدف في قلب الصحراء!';
        case 'space': return 'Target locked. Correct answer!';
        case 'pirates': return 'Direct hit, captain!';
        case 'castle': return 'A noble strike!';
        case 'lab': return 'Hypothesis confirmed!';
        default: return 'إجابة صحيحة!';
    }
}
function themedWrongMessage() {
    const key = settings.theme || 'default';
    switch (key) {
        case 'desert': return 'الجواب انحرف عن مسار القافلة.';
        case 'space': return 'Trajectory mismatch. Try again.';
        case 'pirates': return 'Wrong turn on the treasure map.';
        case 'castle': return 'The dragon dodged that answer.';
        case 'lab': return 'Experiment unstable. Re-check the sample.';
        default: return 'إجابة خاطئة.';
    }
}

function showAnswer() {
    if (!currentExam) return;
    currentExam.showAnswer = true;
    const question = currentExam.questions[currentExam.currentIndex];
    const answer = currentExam.firstAnswers[currentExam.currentIndex];
    if (answer !== null && !isAnswerCorrect(question, answer)) {
        if (!wrongQuestions.includes(question.id)) { wrongQuestions.push(question.id); saveWrongQuestions(); }
    }
    saveExamState(); renderExam();
}
function nextQuestion() {
    if (!currentExam) return;
    if (currentExam.currentIndex < currentExam.questions.length - 1) {
        currentExam.currentIndex += 1; currentExam.showAnswer = false; saveExamState(); renderExam();
        window.scrollTo({ top: 0, behavior: settings.animations === false ? 'auto' : 'smooth' });
    }
}
function prevQuestion() {
    if (!currentExam || currentExam.direction !== 'twoway') return;
    if (currentExam.currentIndex > 0) {
        currentExam.currentIndex -= 1; if (currentExam.mode === 'training') currentExam.showAnswer = currentExam.answers[currentExam.currentIndex] !== null; saveExamState(); renderExam();
    }
}
function navigateToQuestion(index) {
    if (!currentExam) return;
    if (currentExam.direction === 'oneway' && index !== currentExam.currentIndex) return;
    currentExam.currentIndex = index; if (currentExam.mode === 'training') currentExam.showAnswer = currentExam.answers[index] !== null; saveExamState(); renderExam();
}
function toggleGrid() {
    const grid = document.getElementById('question-grid'); const btn = document.getElementById('btn-grid-toggle');
    grid.classList.toggle('hidden'); btn.innerHTML = grid.classList.contains('hidden') ? '<span>☰</span> إظهار الشبكة' : '<span>☰</span> إخفاء الشبكة';
}
function exitExam() {
    if (currentExam && !currentExam.submitted) {
        if (confirm('هل تريد الخروج؟ سيتم حفظ التقدم الحالي.')) { saveExamState(); currentExam = null; clearInterval(timerInterval); timerInterval = null; goHome(); }
    } else { currentExam = null; goHome(); }
}

/* ===================== TIMER ===================== */
function startTimer() {
    clearInterval(timerInterval);
    const timerEl = document.getElementById('exam-timer'); timerEl.classList.remove('hidden');
    timerInterval = setInterval(() => {
        if (!currentExam || currentExam.submitted) { clearInterval(timerInterval); timerInterval = null; return; }
        const elapsed = Date.now() - currentExam.startTime; const remaining = currentExam.totalTime - elapsed;
        if (remaining <= 0) { clearInterval(timerInterval); timerInterval = null; timeUp(); return; }
        const mins = Math.floor(remaining / 60000); const secs = Math.floor((remaining % 60000) / 1000);
        timerEl.textContent = `${mins}:${String(secs).padStart(2, '0')}`; timerEl.classList.toggle('timer-danger', remaining <= 60000);
    }, 1000);
}
function timeUp() {
    if (!currentExam) return;
    const unanswered = currentExam.answers.filter(a => a === null).length;
    showToast(`انتهى الوقت! يوجد ${unanswered} سؤالًا بدون إجابة.`, 'error');
    finishExam();
}

/* ===================== RESULTS ===================== */
function finishExam() {
    if (!currentExam) return;
    currentExam.submitted = true; currentExam.endTime = Date.now();
    clearInterval(timerInterval); timerInterval = null;
    saveProgress(); clearExamState();
    if (currentExam.mode === 'exam') { showScreen('results-screen'); showWaitingMessages(); }
    else showResults();
}

function showWaitingMessages() {
    const waitDiv = document.getElementById('results-waiting');
    const contentDiv = document.getElementById('results-content');
    const reviewDiv = document.getElementById('results-review');
    const msgEl = document.getElementById('waiting-message');
    waitDiv.classList.remove('hidden'); reviewDiv.classList.add('hidden'); reviewDiv.innerHTML = ''; contentDiv.innerHTML = '';
    const messages = ['جاري تحليل الإجابات...', 'يتم احتساب النتيجة...', 'نراجع الأداء العام...', 'لحظات قليلة...', 'يتم تجهيز النتائج...'];
    let index = 0; const interval = setInterval(() => { index = (index + 1) % messages.length; msgEl.textContent = messages[index]; }, 1500);
    setTimeout(() => { clearInterval(interval); waitDiv.classList.add('hidden'); showResults(); }, 2200);
}

function showResults() {
    if (!currentExam) return;
    const theme = currentTheme();
    showScreen('results-screen');
    document.getElementById('results-title').textContent = `${theme.icons.results} ${theme.texts.resultsTitle}`;
    const contentDiv = document.getElementById('results-content');
    const reviewDiv = document.getElementById('results-review'); reviewDiv.classList.add('hidden');
    const { questions, answers, firstAnswers, startTime, endTime, mode } = currentExam;
    const total = questions.length; const answersToCheck = mode === 'exam' ? answers : firstAnswers;
    const answeredCount = answersToCheck.filter(a => a !== null).length;
    const correct = answersToCheck.reduce((sum, ans, idx) => sum + (ans !== null && isAnswerCorrect(questions[idx], ans) ? 1 : 0), 0);
    const unanswered = total - answeredCount; const incorrect = answeredCount - correct;
    const score = total > 0 ? Math.round((correct / total) * 100) : 0;
    const timeSpent = endTime ? Math.round((endTime - startTime) / 1000) : 0;
    const mins = Math.floor(timeSpent / 60); const secs = timeSpent % 60;
    if (score > 50) {
        playCelebrateSound();
        if (settings.animations !== false) showFireworks();
        showToast(themedCelebrationMessage(score), 'success');
    }
    contentDiv.innerHTML = `
        <div class="result-score">${score}%</div>
        <div class="result-details">
            <div class="result-card"><div class="value">${correct}/${total}</div><div class="label">Correct</div></div>
            <div class="result-card"><div class="value">${mins}m ${secs}s</div><div class="label">Time Spent</div></div>
            <div class="result-card"><div class="value">${unanswered}</div><div class="label">Unanswered</div></div>
            <div class="result-card"><div class="value">${incorrect}</div><div class="label">Incorrect</div></div>
        </div>
        <button class="btn-primary mt-20" onclick="reviewExam()">${theme.icons.review} Review Questions</button>
        <button class="btn-secondary mt-10" onclick="goHome()">${theme.icons.exams} Back to Home</button>
    `;
}

function themedCelebrationMessage(score) {
    switch (settings.theme) {
        case 'desert': return `سارت القافلة بنجاح! النتيجة ${score}%`;
        case 'space': return `Mission accomplished! Score ${score}%`;
        case 'pirates': return `Treasure secured! Score ${score}%`;
        case 'castle': return `Victory for the kingdom! Score ${score}%`;
        case 'lab': return `Research breakthrough! Score ${score}%`;
        default: return `أحسنت! نتيجتك ${score}%`;
    }
}

function reviewExam() {
    if (!currentExam) return;
    const { questions, answers } = currentExam;
    const reviewDiv = document.getElementById('results-review'); reviewDiv.classList.remove('hidden');
    let html = `<h3 class="mt-20" style="text-align:right">${currentTheme().icons.review} Review</h3>`;
    questions.forEach((q, i) => {
        const userAnswer = answers[i]; const correctIdx = getCorrectIndex(q); const ok = userAnswer === correctIdx;
        html += `
            <div class="question-container mt-10" style="border-inline-start:4px solid ${ok ? 'var(--success)' : 'var(--danger)'};">
                <div class="question-header">
                    <span class="question-number">Q${escapeHtml(q.number || String(i+1))}</span>
                    <span style="color:${ok ? 'var(--success)' : 'var(--danger)'}; font-weight:900;">${ok ? currentTheme().icons.success + ' Correct' : currentTheme().icons.error + ' Wrong'}</span>
                </div>
                <p class="question-text">${escapeHtml(q.text)}</p>
                <div class="options-list">
                    ${q.options.map((opt, oi) => {
                        let cls = 'option-btn'; if (oi === correctIdx) cls += ' correct'; if (oi === userAnswer && oi !== correctIdx) cls += ' wrong';
                        return `<div class="${cls}" style="cursor:default;">${escapeHtml(opt)}</div>`;
                    }).join('')}
                </div>
                <div class="explanation-box visible"><strong>Explanation:</strong> ${escapeHtml(q.explanation || 'No explanation available.')}</div>
            </div>
        `;
    });
    reviewDiv.innerHTML = html;
}

/* ===================== SEARCH / VIEWERS ===================== */
function populateSearchFilter() {
    const filter = document.getElementById('search-filter');
    filter.innerHTML = '<option value="all">All Subjects</option>';
    subjects.forEach(subject => { filter.innerHTML += `<option value="${escapeAttribute(subject.id)}">${escapeHtml(subject.name)}</option>`; });
}

function performSearch() {
    const query = (document.getElementById('search-input').value || '').toLowerCase().trim();
    const filter = document.getElementById('search-filter').value;
    const resultsDiv = document.getElementById('search-results');
    if (query.length < 2) { resultsDiv.innerHTML = '<p style="color:var(--text-muted); text-align:center; padding:20px;">اكتب حرفين على الأقل للبحث...</p>'; return; }
    const theme = currentTheme();
    const results = allQuestions.filter(q => {
        const haystack = [q.text, ...(q.options||[]), q.explanation || '', q.batchName || '', q.lectureName || '', q.subjectName || ''].join(' ').toLowerCase();
        return haystack.includes(query) && (filter === 'all' || slugify(q.subjectName) === filter);
    });
    if (!results.length) { resultsDiv.innerHTML = '<p style="color:var(--text-muted); text-align:center; padding:20px;">لا توجد نتائج مطابقة.</p>'; return; }
    resultsDiv.innerHTML = results.slice(0, 60).map(q => `
        <div class="search-result-item" onclick="openReadonly('${q.id}')">
            <p><strong>Q${escapeHtml(q.number || '?')}:</strong> ${escapeHtml(shortenText(q.text, 140))}</p>
            <div class="search-result-meta">${theme.icons.subject} ${escapeHtml(q.subjectName || '')} · ${q.sourceType === 'ai' ? theme.icons.ai : theme.icons.lectures} ${escapeHtml(q.lectureName || '')} ${q.batchName ? `· ${theme.icons.years} ${escapeHtml(q.batchName)}` : ''} ${q.pageNumber ? `· ${theme.icons.location} ${escapeHtml(q.pageNumber)}` : ''}</div>
        </div>
    `).join('');
}

function openReadonly(questionId) {
    const q = allQuestions.find(item => item.id === questionId); if (!q) return;
    const theme = currentTheme();
    showScreen('readonly-screen');
    const correctIdx = getCorrectIndex(q);
    document.getElementById('readonly-content').innerHTML = `
        <div class="question-header">
            <span class="question-number">Question ${escapeHtml(q.number || '?')}</span>
            <div class="question-actions">
                <button class="icon-btn ${favorites.includes(q.id) ? 'active' : ''}" onclick="toggleFavorite('${q.id}'); openReadonly('${q.id}')">${theme.icons.favoriteAction}</button>
                <button class="icon-btn" onclick="showLocation('${escapeJsString(q.subjectName)}','${escapeJsString(q.lectureName)}','${escapeJsString(q.batchName || '')}','${escapeJsString(q.pageNumber || '')}')">${theme.icons.location}</button>
            </div>
        </div>
        <p class="question-text">${escapeHtml(q.text)}</p>
        <div class="options-list">${q.options.map((opt, idx) => `<div class="option-btn ${idx === correctIdx ? 'correct' : ''}" style="cursor:default;">${escapeHtml(opt)}</div>`).join('')}</div>
        <div class="explanation-box visible"><strong>Explanation:</strong> ${escapeHtml(q.explanation || 'No explanation available.')}</div>
        <div class="inline-meta">
            <span>${theme.icons.subject} ${escapeHtml(q.subjectName || '')}</span>
            <span>${q.sourceType === 'ai' ? theme.icons.ai : theme.icons.lectures} ${escapeHtml(q.lectureName || '')}</span>
            ${q.batchName ? `<span>${theme.icons.years} ${escapeHtml(q.batchName)}</span>` : ''}
            ${q.pageNumber ? `<span>${theme.icons.location} ${escapeHtml(q.pageNumber)}</span>` : ''}
        </div>
    `;
}
function closeReadonly() { if (document.getElementById('search-input')?.value) showScreen('search-screen'); else goHome(); }
function showLocation(subjectName, lectureName, batchName, pageNumber) {
    const parts = [subjectName ? `المادة: ${subjectName}` : '', lectureName ? `الملف: ${lectureName}` : '', batchName ? `الدفعة: ${batchName}` : '', pageNumber ? `الصفحة: ${pageNumber}` : ''].filter(Boolean);
    showToast(parts.join(' | ') || 'لا توجد بيانات موقع متاحة.', 'info');
}

/* ===================== WRONG / FAVORITES ===================== */
function openWrongQuestions() {
    const qs = allQuestions.filter(q => wrongQuestions.includes(q.id));
    if (!qs.length) { showToast('لا توجد أسئلة خاطئة حتى الآن.', 'info'); return; }
    showScreen('selection-screen');
    document.getElementById('selection-title').textContent = 'Wrong Questions';
    document.getElementById('selection-search-container').classList.add('hidden');
    document.getElementById('selection-footer').classList.add('hidden');
    document.getElementById('selection-list').innerHTML = `
        <div class="empty-state">
            <p style="font-size:1.05rem; font-weight:900; margin-bottom:16px;">${qs.length} سؤالًا خاطئًا متاحًا للتدريب</p>
            <div class="mode-buttons" style="max-width:420px; margin:0 auto;">
                <button class="btn-mode" onclick="startSpecialExam(getWrongQuestionObjects(), 'training', 'twoway')"><span class="mode-icon">🎓</span><span class="mode-label">Training</span></button>
                <button class="btn-mode" onclick="startSpecialExam(getWrongQuestionObjects(), 'exam', 'oneway')"><span class="mode-icon">📝</span><span class="mode-label">Exam</span></button>
            </div>
            <button class="btn-danger mt-20" onclick="clearWrongQuestions()">مسح الأسئلة الخاطئة</button>
        </div>
    `;
    currentSelectionMeta = { backContext: 'home' };
}
function getWrongQuestionObjects() { return allQuestions.filter(q => wrongQuestions.includes(q.id)); }
function clearWrongQuestions() { if (confirm('هل تريد مسح جميع الأسئلة الخاطئة؟')) { wrongQuestions = []; saveWrongQuestions(); goHome(); showToast('تم مسح قائمة الأسئلة الخاطئة.', 'success'); } }
function toggleFavorite(questionId) {
    const idx = favorites.indexOf(questionId); if (idx > -1) favorites.splice(idx,1); else favorites.push(questionId); saveFavorites(); if (currentExam && !currentExam.submitted) renderExam();
}
function openFavoriteQuestions() {
    const qs = allQuestions.filter(q => favorites.includes(q.id));
    if (!qs.length) { showToast('لا توجد أسئلة مفضلة حتى الآن.', 'info'); return; }
    showScreen('selection-screen');
    document.getElementById('selection-title').textContent = 'Favorite Questions';
    document.getElementById('selection-search-container').classList.add('hidden');
    document.getElementById('selection-footer').classList.add('hidden');
    document.getElementById('selection-list').innerHTML = `
        <div class="empty-state">
            <p style="font-size:1.05rem; font-weight:900; margin-bottom:16px;">${qs.length} سؤالًا مفضلًا</p>
            <div class="mode-buttons" style="max-width:420px; margin:0 auto;">
                <button class="btn-mode" onclick="startSpecialExam(getFavoriteQuestionObjects(), 'training', 'twoway')"><span class="mode-icon">🎓</span><span class="mode-label">Training</span></button>
                <button class="btn-mode" onclick="startSpecialExam(getFavoriteQuestionObjects(), 'exam', 'oneway')"><span class="mode-icon">📝</span><span class="mode-label">Exam</span></button>
            </div>
            <button class="btn-danger mt-20" onclick="clearFavorites()">مسح المفضلة</button>
        </div>
    `;
    currentSelectionMeta = { backContext: 'home' };
}
function getFavoriteQuestionObjects() { return allQuestions.filter(q => favorites.includes(q.id)); }
function clearFavorites() { if (confirm('هل تريد مسح جميع المفضلة؟')) { favorites = []; saveFavorites(); goHome(); showToast('تم مسح قائمة المفضلة.', 'success'); } }

/* ===================== STATISTICS ===================== */
function toggleStatistics() {
    const panel = document.getElementById('statistics-panel'); panel.classList.toggle('visible'); if (panel.classList.contains('visible')) renderStatistics();
}
function updateStatisticsIfOpen() { if (document.getElementById('statistics-panel')?.classList.contains('visible')) renderStatistics(); }
function renderStatistics() {
    const theme = currentTheme();
    const content = document.getElementById('stats-content');
    const totalQuestions = allQuestions.length; const answeredQuestions = new Set();
    Object.values(progress).forEach(entry => (entry?.questionIds || []).forEach(id => answeredQuestions.add(id)));
    const totalLectures = subjects.reduce((sum, s) => sum + s.lectures.length, 0);
    const totalAiFiles = subjects.reduce((sum, s) => sum + s.ai.length, 0);
    const totalYears = subjects.reduce((sum, s) => sum + s.years.length, 0);
    const summary = `
        <div class="stats-summary-grid">
            <div class="progress-card"><h4>${theme.icons.progress} الإجمالي</h4><p><span>كل الأسئلة</span><strong>${totalQuestions}</strong></p><p><span>تمت الإجابة</span><strong>${answeredQuestions.size}</strong></p></div>
            <div class="progress-card"><h4>${theme.icons.favorites} المفضلة</h4><p><span>عدد الأسئلة</span><strong>${favorites.length}</strong></p><p><span>الخاطئة</span><strong>${wrongQuestions.length}</strong></p></div>
            <div class="progress-card"><h4>${theme.icons.statistics} الأقسام</h4><p><span>Lectures</span><strong>${totalLectures}</strong></p><p><span>AI</span><strong>${totalAiFiles}</strong></p><p><span>Years</span><strong>${totalYears}</strong></p></div>
        </div>
    `;
    const subjectCards = subjects.map(subject => {
        const entry = progress[`subject:${subject.name}`] || { questionIds: [] }; const answered = new Set(entry.questionIds || []).size; const pct = subject.totalQuestions ? Math.round((answered / subject.totalQuestions) * 100) : 0;
        const lectures = subject.lectures.map(group => groupProgressLine(`lecture:${subject.name}/${group.name}`, group.name, group.questions.length)).join('');
        const ai = subject.ai.map(group => groupProgressLine(`ai:${subject.name}/${group.name}`, group.name, group.questions.length)).join('');
        const years = subject.years.map(group => groupProgressLine(`year:${subject.name}/${group.name}`, group.name, group.questions.length)).join('');
        return `
            <div class="progress-card">
                <h4>${theme.icons.subject} ${escapeHtml(subject.name)}</h4>
                <div class="stats-row"><span>الإجابات المسجلة</span><strong>${answered}/${subject.totalQuestions}</strong></div>
                <div class="progress-bar"><span style="width:${pct}%"></span></div>
                <div class="stats-row mt-10"><span>النسبة</span><strong>${pct}%</strong></div>
                ${lectures ? `<div class="mt-10"><strong>${theme.icons.lectures} Lectures</strong></div>${lectures}` : ''}
                ${ai ? `<div class="mt-10"><strong>${theme.icons.ai} AI</strong></div>${ai}` : ''}
                ${years ? `<div class="mt-10"><strong>${theme.icons.years} Years</strong></div>${years}` : ''}
            </div>
        `;
    }).join('');
    content.innerHTML = summary + `<div class="progress-grid">${subjectCards || '<div class="empty-state"><p>لا توجد بيانات إحصائية بعد.</p></div>'}</div>`;
}
function groupProgressLine(key, label, total) {
    const entry = progress[key] || { questionIds: [] }; const answered = new Set(entry.questionIds || []).size; const pct = total ? Math.round((answered / total) * 100) : 0;
    return `<div class="stats-row"><span>${escapeHtml(label)}</span><strong>${answered}/${total} (${pct}%)</strong></div>`;
}
function resetProgress() {
    if (!confirm('هل تريد إعادة ضبط جميع البيانات؟ لا يمكن التراجع عن هذا الإجراء.')) return;
    progress = {}; favorites = []; wrongQuestions = [];
    localStorage.removeItem(STORAGE_KEYS.progress); localStorage.removeItem(STORAGE_KEYS.favorites); localStorage.removeItem(STORAGE_KEYS.wrong); localStorage.removeItem(STORAGE_KEYS.examState);
    showToast('تمت إعادة ضبط جميع البيانات.', 'success'); renderStatistics();
}

/* ===================== SETTINGS / THEMES ===================== */
function toggleSettings() { document.getElementById('settings-panel').classList.toggle('visible'); }
function toggleExamSettings(show) { const modal = document.getElementById('exam-settings-modal'); modal.classList.toggle('hidden', !show); if (show) syncSettingsControls(); }
function handleExamSettingsOverlay(event) { if (event.target.id === 'exam-settings-modal') toggleExamSettings(false); }
function toggleDarkMode() { settings.darkMode = !!document.getElementById('dark-mode-toggle').checked; saveSettings(); applySettings(); }
function changeTheme(theme) { settings.theme = THEMES[theme] ? theme : 'default'; saveSettings(); applySettings(); renderSubjects(); if (currentSubject && document.getElementById('subject-sections-screen').classList.contains('active')) openSubject(currentSubject.id); if (currentExam && document.getElementById('exam-screen').classList.contains('active')) renderExam(); if (document.getElementById('results-screen').classList.contains('active') && document.getElementById('results-content').innerHTML.trim()) showResults(); if (document.getElementById('statistics-panel').classList.contains('visible')) renderStatistics(); }
function changeSound(sound) { settings.bgSound = BACKGROUND_SOUNDS[sound] ? sound : 'none'; saveSettings(); applySettings(); }
function toggleBackgroundSoundEnabled() {
    const source = [document.getElementById('bg-sound-enabled-toggle'), document.getElementById('exam-bg-sound-enabled-toggle')].find(el => el && el === document.activeElement);
    settings.bgSoundEnabled = typeof source?.checked === 'boolean' ? source.checked : !!document.getElementById('bg-sound-enabled-toggle').checked;
    saveSettings(); applySettings();
}
function changeVolume(value) { settings.volume = constrainNumber(parseInt(value,10), 0, 100, 50); saveSettings(); applySettings(); }
function toggleFeedbackSounds() {
    const source = [document.getElementById('feedback-toggle'), document.getElementById('exam-feedback-toggle')].find(el => el && el === document.activeElement);
    settings.feedbackEnabled = typeof source?.checked === 'boolean' ? source.checked : !!document.getElementById('feedback-toggle').checked;
    saveSettings(); applySettings();
}
function toggleAnimations() { settings.animations = !!document.getElementById('animations-toggle').checked; saveSettings(); applySettings(); }

function applySettings() {
    settings = { ...DEFAULT_SETTINGS, ...settings };
    document.documentElement.setAttribute('data-dark', String(!!settings.darkMode));
    document.documentElement.setAttribute('data-theme', settings.theme || 'default');
    document.documentElement.setAttribute('data-animations', String(settings.animations !== false));
    syncSettingsControls();
    applyThemeUI();
    applyBackgroundSound();
    applyEffectAudioVolumes();
}

function syncSettingsControls() {
    const pairs = [
        ['dark-mode-toggle', 'checked', !!settings.darkMode],
        ['theme-selector', 'value', settings.theme || 'default'], ['exam-theme-selector', 'value', settings.theme || 'default'],
        ['sound-selector', 'value', settings.bgSound || 'none'], ['exam-sound-selector', 'value', settings.bgSound || 'none'],
        ['bg-sound-enabled-toggle', 'checked', settings.bgSoundEnabled !== false], ['exam-bg-sound-enabled-toggle', 'checked', settings.bgSoundEnabled !== false],
        ['volume-control', 'value', settings.volume ?? 50], ['exam-volume-control', 'value', settings.volume ?? 50],
        ['feedback-toggle', 'checked', settings.feedbackEnabled !== false], ['exam-feedback-toggle', 'checked', settings.feedbackEnabled !== false],
        ['animations-toggle', 'checked', settings.animations !== false]
    ];
    pairs.forEach(([id, prop, value]) => { const el = document.getElementById(id); if (el) el[prop] = value; });
}

function applyThemeUI() {
    const theme = currentTheme();
    setText('nav-icon-exams', theme.icons.exams); setText('nav-label-exams', 'Exams');
    setText('nav-icon-wrong', theme.icons.wrong); setText('nav-label-wrong', 'Wrong Questions');
    setText('nav-icon-favorites', theme.icons.favorites); setText('nav-label-favorites', 'Favorite Questions');
    setText('nav-icon-search', theme.icons.search); setText('nav-label-search', 'Search');
    setText('nav-icon-statistics', theme.icons.statistics); setText('nav-label-statistics', 'Statistics');
    setText('nav-icon-settings', theme.icons.settings); setText('nav-label-settings', 'Settings');
    setText('statistics-title', theme.texts.statsTitle); setText('settings-title', theme.texts.settingsTitle); setText('exam-settings-title', theme.texts.examSettingsTitle); setText('results-title', `${theme.icons.results} ${theme.texts.resultsTitle}`);
    setText('btn-exam-settings', theme.texts.examSettingsButton);
    const trainingIcon = document.querySelector('#btn-training-mode .mode-icon'); if (trainingIcon) trainingIcon.textContent = theme.icons.progress;
    const examIcon = document.querySelector('#btn-exam-mode .mode-icon'); if (examIcon) examIcon.textContent = theme.icons.exams;
    const trainingLabel = document.querySelector('#btn-training-mode .mode-label'); if (trainingLabel) trainingLabel.textContent = theme.texts.missionModeTraining;
    const examLabel = document.querySelector('#btn-exam-mode .mode-label'); if (examLabel) examLabel.textContent = theme.texts.missionModeExam;
    updateStartButtonIcon();
}
function updateStartButtonIcon() { setText('btn-start-exam', currentTheme().texts.startExam); }
function setText(id, value) { const el = document.getElementById(id); if (el) el.textContent = value; }

/* ===================== AUDIO ===================== */
function primeAudioUnlock() {
    const unlock = () => {
        if (bodyGestureAudioUnlocked) return;
        bodyGestureAudioUnlocked = true;
        applyBackgroundSound();
        document.removeEventListener('click', unlock);
        document.removeEventListener('touchstart', unlock);
        document.removeEventListener('keydown', unlock);
    };
    document.addEventListener('click', unlock, { once: true });
    document.addEventListener('touchstart', unlock, { once: true });
    document.addEventListener('keydown', unlock, { once: true });
}

async function resolveAssetPath(candidates = []) {
    const clean = candidates.filter(Boolean).map(path => encodeURI(path));
    for (const candidate of clean) {
        if (assetPathCache[candidate]) return assetPathCache[candidate];
        try {
            const res = await fetch(candidate, { method: 'HEAD' });
            if (res.ok) { assetPathCache[candidate] = candidate; return candidate; }
        } catch (_) {}
    }
    return clean[0] || '';
}

async function prepareStaticEffectAudio() {
    document.getElementById('right-audio').src = await resolveAssetPath(['right.mp3', 'audio/right.mp3', 'assets/audio/right.mp3']);
    document.getElementById('wrong-audio').src = await resolveAssetPath(['wrong.mp3', 'audio/wrong.mp3', 'assets/audio/wrong.mp3']);
    document.getElementById('celebrate-audio').src = await resolveAssetPath(['celebrate.mp3', 'audio/celebrate.mp3', 'assets/audio/celebrate.mp3']);
    applyEffectAudioVolumes();
}

function applyEffectAudioVolumes() {
    const volume = (settings.volume ?? 50) / 100;
    ['right-audio', 'wrong-audio', 'celebrate-audio'].forEach(id => { const audio = document.getElementById(id); if (audio) audio.volume = volume; });
}

async function applyBackgroundSound() {
    const audio = document.getElementById('bg-audio');
    audio.volume = (settings.volume ?? 50) / 100;
    const soundKey = settings.bgSound || 'none';
    const sound = BACKGROUND_SOUNDS[soundKey] || BACKGROUND_SOUNDS.none;
    if (!settings.bgSoundEnabled || soundKey === 'none' || !sound.file) { audio.pause(); return; }
    const nextSrc = await resolveAssetPath([sound.file, `audio/${sound.file}`, `assets/audio/${sound.file}`]);
    if (audio.dataset.currentSrc !== nextSrc) { audio.src = nextSrc; audio.dataset.currentSrc = nextSrc; audio.load(); }
    if (bodyGestureAudioUnlocked) audio.play().catch(() => {});
}

function playEffectSound(type) {
    if (currentExam?.mode !== 'training' || settings.feedbackEnabled === false) return;
    const audio = document.getElementById(type === 'right' ? 'right-audio' : 'wrong-audio');
    if (!audio?.src) return;
    try { audio.currentTime = 0; audio.play().catch(() => {}); } catch (_) {}
}
function playCelebrateSound() {
    const audio = document.getElementById('celebrate-audio');
    if (!audio?.src) return;
    try { audio.currentTime = 0; audio.play().catch(() => {}); } catch (_) {}
}

/* ===================== CELEBRATION ===================== */
function showMiniCelebration() { showFireworks(56, 12); }
function showFireworks(durationFrames = 120, explosionCount = 24) {
    const canvas = document.getElementById('fireworks-canvas'); if (!canvas) return;
    canvas.classList.remove('hidden'); const ctx = canvas.getContext('2d'); canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    const particles = []; const themeColors = {
        default: ['#2563eb','#38bdf8','#10b981','#f59e0b'], desert: ['#f4c95d','#db9b41','#9a5b24','#fff0c9'],
        space: ['#8b5cf6','#38bdf8','#f0abfc','#ffffff'], pirates: ['#d9a740','#7d4b16','#fdf0c2','#7ec8e3'], castle: ['#d4af37','#7c3f98','#f5f1dc','#9ea7d8'], lab: ['#00bcd4','#7ef9ff','#15d3a2','#ffffff']
    };
    const colors = themeColors[settings.theme] || themeColors.default;
    const bursts = [{ x: canvas.width*0.3, y: canvas.height*0.35 }, { x: canvas.width*0.7, y: canvas.height*0.4 }, { x: canvas.width*0.5, y: canvas.height*0.26 }];
    bursts.forEach(burst => {
        for (let i = 0; i < explosionCount; i += 1) {
            const angle = (Math.PI * 2 * i) / explosionCount; const speed = 2.5 + Math.random()*4.8;
            particles.push({ x: burst.x, y: burst.y, vx: Math.cos(angle)*speed, vy: Math.sin(angle)*speed, color: colors[Math.floor(Math.random()*colors.length)], size: Math.random()*3+1.5, life: 1 });
        }
    });
    let frame = 0;
    function animate() {
        ctx.clearRect(0,0,canvas.width,canvas.height);
        particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += 0.08; p.life -= 0.012; if (p.life > 0) { ctx.globalAlpha = p.life; ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x,p.y,p.size,0,Math.PI*2); ctx.fill(); } });
        frame += 1;
        if (frame < durationFrames) requestAnimationFrame(animate); else { ctx.clearRect(0,0,canvas.width,canvas.height); canvas.classList.add('hidden'); }
    }
    animate();
}

/* ===================== STORAGE ===================== */
function saveSettings() { localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings)); }
function loadSettings() { try { settings = { ...DEFAULT_SETTINGS, ...(JSON.parse(localStorage.getItem(STORAGE_KEYS.settings)) || {}) }; } catch (_) { settings = { ...DEFAULT_SETTINGS }; } }
function addProgressId(key, questionId) { if (!progress[key]) progress[key] = { questionIds: [] }; if (!progress[key].questionIds.includes(questionId)) progress[key].questionIds.push(questionId); }
function saveProgress() {
    if (!currentExam) return;
    const answersToUse = currentExam.mode === 'exam' ? currentExam.answers : currentExam.firstAnswers;
    currentExam.questions.forEach((question, idx) => {
        if (answersToUse[idx] === null) return;
        addProgressId(`subject:${question.subjectName}`, question.id);
        const actualSource = question.originalSourceType || question.sourceType;
        if (actualSource === 'lecture') addProgressId(`lecture:${question.subjectName}/${question.lectureName}`, question.id);
        if (actualSource === 'ai') addProgressId(`ai:${question.subjectName}/${question.lectureName}`, question.id);
        if (question.batchName) addProgressId(`year:${question.subjectName}/${question.batchName}`, question.id);
    });
    localStorage.setItem(STORAGE_KEYS.progress, JSON.stringify(progress));
    updateStatisticsIfOpen();
}
function loadProgress() { try { progress = JSON.parse(localStorage.getItem(STORAGE_KEYS.progress)) || {}; } catch (_) { progress = {}; } }
function saveFavorites() { localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify(favorites)); updateStatisticsIfOpen(); }
function loadFavorites() { try { favorites = JSON.parse(localStorage.getItem(STORAGE_KEYS.favorites)) || []; } catch (_) { favorites = []; } }
function saveWrongQuestions() { localStorage.setItem(STORAGE_KEYS.wrong, JSON.stringify(wrongQuestions)); updateStatisticsIfOpen(); }
function loadWrongQuestions() { try { wrongQuestions = JSON.parse(localStorage.getItem(STORAGE_KEYS.wrong)) || []; } catch (_) { wrongQuestions = []; } }
function saveExamState() { if (currentExam) localStorage.setItem(STORAGE_KEYS.examState, JSON.stringify(currentExam)); }
function clearExamState() { localStorage.removeItem(STORAGE_KEYS.examState); }
function checkResumeExam() {
    const raw = localStorage.getItem(STORAGE_KEYS.examState); if (!raw) return;
    try {
        const saved = JSON.parse(raw); if (!saved || saved.submitted || !Array.isArray(saved.questions) || !saved.questions.length) { clearExamState(); return; }
        if (confirm('يوجد امتحان غير مكتمل. هل تريد المتابعة من حيث توقفت؟')) { currentExam = saved; showScreen('exam-screen'); renderExam(); if (currentExam.mode === 'exam') startTimer(); }
        else clearExamState();
    } catch (_) { clearExamState(); }
}

/* ===================== HELPERS ===================== */
function getCorrectIndex(question) { if (typeof question.correctIndex === 'number' && question.correctIndex >= 0) return question.correctIndex; question.correctIndex = resolveCorrectIndex(question.options || [], question.correctAnswer || ''); return question.correctIndex; }
function isAnswerCorrect(question, answerIndex) { return getCorrectIndex(question) === answerIndex; }
function shuffleArray(array) { const arr = [...array]; for (let i = arr.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; }
function showToast(message, kind = 'info') {
    const toast = document.getElementById('toast'); if (!toast) return;
    clearTimeout(toastTimer); const theme = currentTheme(); const prefix = kind === 'success' ? theme.toasts.successPrefix : kind === 'error' ? theme.toasts.errorPrefix : theme.toasts.infoPrefix;
    toast.textContent = `${prefix} ${message}`; toast.classList.remove('hidden'); toast.classList.add('visible');
    toastTimer = setTimeout(() => { toast.classList.remove('visible'); toast.classList.add('hidden'); }, 2600);
}
function slugify(text) { return String(text || '').toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]+/g, '-').replace(/^-+|-+$/g, '') || 'item'; }
function hashString(input) { let hash = 0; const str = String(input || ''); for (let i = 0; i < str.length; i += 1) { hash = ((hash << 5) - hash) + str.charCodeAt(i); hash |= 0; } return Math.abs(hash).toString(36); }
function normalizeComparisonText(text) { return String(text || '').toLowerCase().replace(/^[a-e][\)\.\-]\s*/i, '').replace(/\s+/g, ' ').trim(); }
function escapeHtml(value) { return String(value ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
function escapeAttribute(value) { return escapeHtml(value); }
function escapeJsString(value) { return String(value ?? '').replace(/\\/g,'\\\\').replace(/'/g,"\\'"); }
function shortenText(text, maxLength) { const str = String(text || ''); return str.length > maxLength ? `${str.slice(0, maxLength).trim()}...` : str; }
function constrainNumber(value, min, max, fallback) { if (Number.isNaN(value)) return fallback; return Math.min(max, Math.max(min, value)); }

window.openExams = openExams; window.openSection = openSection; window.toggleStatistics = toggleStatistics; window.toggleSettings = toggleSettings; window.toggleDarkMode = toggleDarkMode; window.changeTheme = changeTheme; window.changeSound = changeSound; window.toggleBackgroundSoundEnabled = toggleBackgroundSoundEnabled; window.changeVolume = changeVolume; window.toggleFeedbackSounds = toggleFeedbackSounds; window.toggleAnimations = toggleAnimations; window.filterSubjects = filterSubjects; window.openSubject = openSubject; window.openSubjectCategory = openSubjectCategory; window.backFromSelection = backFromSelection; window.filterSelectionList = filterSelectionList; window.toggleGroupSelection = toggleGroupSelection; window.selectMode = selectMode; window.selectDirection = selectDirection; window.addExtraTime = addExtraTime; window.confirmStartExam = confirmStartExam; window.startSpecialExam = startSpecialExam; window.selectOption = selectOption; window.showAnswer = showAnswer; window.nextQuestion = nextQuestion; window.prevQuestion = prevQuestion; window.navigateToQuestion = navigateToQuestion; window.toggleGrid = toggleGrid; window.exitExam = exitExam; window.finishExam = finishExam; window.reviewExam = reviewExam; window.performSearch = performSearch; window.openReadonly = openReadonly; window.closeReadonly = closeReadonly; window.showLocation = showLocation; window.openWrongQuestions = openWrongQuestions; window.getWrongQuestionObjects = getWrongQuestionObjects; window.clearWrongQuestions = clearWrongQuestions; window.toggleFavorite = toggleFavorite; window.openFavoriteQuestions = openFavoriteQuestions; window.getFavoriteQuestionObjects = getFavoriteQuestionObjects; window.clearFavorites = clearFavorites; window.resetProgress = resetProgress; window.goHome = goHome; window.toggleExamSettings = toggleExamSettings; window.handleExamSettingsOverlay = handleExamSettingsOverlay;
