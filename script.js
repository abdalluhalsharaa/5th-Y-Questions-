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
let subjectPreferences = { order: [], pinned: [] };
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
let subjectLongPressTimer = null;
let subjectActiveActionsId = null;

const STORAGE_KEYS = {
    settings: 'medical-app-settings-v5',
    progress: 'medical-app-progress-v5',
    favorites: 'medical-app-favorites-v5',
    wrong: 'medical-app-wrong-v5',
    examState: 'medical-app-exam-state-v5',
    subjectPrefs: 'medical-app-subject-prefs-v5'
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
        icons: { exams: '📝', wrong: '❌', favorites: '⭐', search: '🔍', statistics: '📊', settings: '⚙️', lectures: '📚', ai: '🤖', years: '📅', start: '🚀', results: '🏆', progress: '🎯', favoriteAction: '💚', location: '📍', success: '✅', error: '❌', review: '🧾', subject: '📘' },
        texts: { startExam: '🚀 Start Exam', resultsTitle: 'Results', statsTitle: '📊 الإحصائيات', settingsTitle: '⚙️ الإعدادات', examSettingsTitle: '⚙️ Exam Settings', examSettingsButton: '⚙️ Exam Settings', progressLabel: 'Progress', trainingLabel: 'Training Mode', examLabel: 'Real Exam Mode' },
        toasts: { successPrefix: '✅', errorPrefix: '❌', infoPrefix: 'ℹ️' }
    },
    desert: {
        name: 'البادية',
        icons: { exams: '🏹', wrong: '🦂', favorites: '🌵', search: '🔎', statistics: '🧭', settings: '🏕️', lectures: '📜', ai: '🔥', years: '📅', start: '🐪', results: '👑', progress: '🏹', favoriteAction: '💚', location: '🧭', success: '🤎', error: '🦂', review: '📜', subject: '🏜️' },
        texts: { startExam: '🐪 Start Journey', resultsTitle: 'Majlis Report', statsTitle: '🧭 إحصائيات الرحلة', settingsTitle: '🏕️ إعدادات الخيمة', examSettingsTitle: '🏕️ Exam Camp Settings', examSettingsButton: '🏕️ Exam Settings', progressLabel: 'Desert Progress', trainingLabel: 'Training Camp', examLabel: 'Journey Exam' },
        toasts: { successPrefix: '🤎', errorPrefix: '🦂', infoPrefix: '🏜️' }
    },
    space: {
        name: 'الفضاء',
        icons: { exams: '🚀', wrong: '☄️', favorites: '🌟', search: '🔭', statistics: '📡', settings: '🤖', lectures: '🛰️', ai: '👽', years: '🪐', start: '🚀', results: '🌌', progress: '🎯', favoriteAction: '💚', location: '📡', success: '✨', error: '☄️', review: '🧾', subject: '🪐' },
        texts: { startExam: '🚀 Launch Mission', resultsTitle: 'Mission Report', statsTitle: '📡 Mission Analytics', settingsTitle: '🤖 Space Controls', examSettingsTitle: '🤖 Mission Controls', examSettingsButton: '🤖 Mission Settings', progressLabel: 'Mission Progress', trainingLabel: 'Training Mission', examLabel: 'Space Mission' },
        toasts: { successPrefix: '✨', errorPrefix: '☄️', infoPrefix: '🪐' }
    },
    pirates: {
        name: 'القراصنة',
        icons: { exams: '☠️', wrong: '🦈', favorites: '💰', search: '🔎', statistics: '🧭', settings: '⚓', lectures: '🗺️', ai: '🦜', years: '🗓️', start: '☠️', results: '👑', progress: '🏴‍☠️', favoriteAction: '💚', location: '🧭', success: '🪙', error: '🦈', review: '📜', subject: '⚓' },
        texts: { startExam: '☠️ Start Voyage', resultsTitle: 'Treasure Report', statsTitle: '🧭 Voyage Progress', settingsTitle: '⚓ Captain Settings', examSettingsTitle: '⚓ Voyage Settings', examSettingsButton: '⚓ Voyage Settings', progressLabel: 'Voyage Progress', trainingLabel: 'Deck Training', examLabel: 'Treasure Voyage' },
        toasts: { successPrefix: '🪙', errorPrefix: '🦈', infoPrefix: '🏴‍☠️' }
    },
    castle: {
        name: 'القلعة',
        icons: { exams: '⚔️', wrong: '🐉', favorites: '👑', search: '🔎', statistics: '🛡️', settings: '🏰', lectures: '📜', ai: '🕯️', years: '📅', start: '⚔️', results: '👑', progress: '🏹', favoriteAction: '💚', location: '🛡️', success: '🛡️', error: '🐉', review: '📜', subject: '🏰' },
        texts: { startExam: '⚔️ Begin Quest', resultsTitle: 'Kingdom Report', statsTitle: '🛡️ Quest Progress', settingsTitle: '🏰 Castle Settings', examSettingsTitle: '🏰 Quest Settings', examSettingsButton: '🏰 Quest Settings', progressLabel: 'Quest Progress', trainingLabel: 'Knight Training', examLabel: 'Kingdom Trial' },
        toasts: { successPrefix: '🛡️', errorPrefix: '🐉', infoPrefix: '🏰' }
    },
    lab: {
        name: 'المختبر',
        icons: { exams: '🧪', wrong: '☣️', favorites: '🧬', search: '🔬', statistics: '📈', settings: '⚗️', lectures: '🔬', ai: '🧠', years: '📅', start: '🧪', results: '🏅', progress: '🧫', favoriteAction: '💚', location: '📍', success: '🧫', error: '☣️', review: '📋', subject: '⚗️' },
        texts: { startExam: '🧪 Start Experiment', resultsTitle: 'Research Report', statsTitle: '📈 Experiment Progress', settingsTitle: '⚗️ Lab Settings', examSettingsTitle: '⚗️ Experiment Settings', examSettingsButton: '⚗️ Experiment Settings', progressLabel: 'Experiment Progress', trainingLabel: 'Trial Run', examLabel: 'Main Experiment' },
        toasts: { successPrefix: '🧫', errorPrefix: '☣️', infoPrefix: '🧪' }
    }
};

const DEFAULT_SETTINGS = { darkMode: false, theme: 'default', bgSound: 'none', bgSoundEnabled: true, volume: 50, feedbackEnabled: true, animations: true };
const IGNORE_ROOT_DIRS = new Set(['.git', '.github', 'node_modules', 'assets', 'asset', 'audio', 'audios', 'img', 'images', 'css', 'js', 'docs', 'dist', 'build']);

document.addEventListener('DOMContentLoaded', async () => {
    loadSettings();
    loadProgress();
    loadFavorites();
    loadWrongQuestions();
    loadSubjectPreferences();
    applySettings();
    displayRandomQuote();
    await prepareStaticEffectAudio();
    primeAudioUnlock();
    bindGlobalSubjectActionClose();
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
    const el = document.getElementById('random-quote');
    if (el) el.textContent = quotes[Math.floor(Math.random() * quotes.length)];
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
        subjects = sortSubjectsForDisplay(subjectResults.filter(Boolean));
        allQuestions = subjects.flatMap(subject => subject.allQuestions);
        normalizeSubjectPreferences();
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
    const lectureFiles = subjectItems.filter(item => item.type === 'file' && item.name.toLowerCase().endsWith('.txt')).sort((a, b) => a.name.localeCompare(b.name));
    const aiFolder = subjectItems.find(item => item.type === 'dir' && item.name.toLowerCase() === 'ai');
    let aiFiles = [];
    if (aiFolder) {
        const aiItems = await listRepoDirectory(aiFolder.path);
        aiFiles = aiItems.filter(item => item.type === 'file' && item.name.toLowerCase().endsWith('.txt')).sort((a, b) => a.name.localeCompare(b.name));
    }
    if (lectureFiles.length === 0 && aiFiles.length === 0 && !aiFolder) {
        return { id: slugify(subjectName), name: subjectName, lectures: [], ai: [], years: [], allQuestions: [], totalQuestions: 0, totalLectures: 0, hasAiFolder: false };
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
        totalLectures: lectures.length + aiLectures.length,
        hasAiFolder: !!aiFolder
    };
}

async function buildLectureGroupFromFile(fileItem, subjectName, sourceType, startCounter) {
    try {
        const text = await fetchQuestionFile(fileItem);
        const lectureName = fileItem.name.replace(/\.txt$/i, '');
        const questions = parseQuestionFile(text, { subjectName, lectureName, sourceType, sourcePath: fileItem.path, startCounter });
        if (!questions.length) return null;
        return { id: `${slugify(subjectName)}__${sourceType}__${slugify(lectureName)}`, name: lectureName, type: sourceType, subjectName, path: fileItem.path, questions };
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
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0], 'en', { sensitivity: 'base' })).map(([batchName, questions]) => ({
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
    return String(text || '').replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\t/g, '    ').replace(/\/\/\/\/\//g, '\n').trim();
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
        return { id, number: questionNumber, text: questionText, options, correctAnswer, correctIndex, explanation, batchName, pageNumber, subjectName: meta.subjectName, lectureName: meta.lectureName, groupName: meta.lectureName, sourceType: meta.sourceType, sourcePath: meta.sourcePath };
    } catch (error) { console.warn('Question parse error:', error, block); return null; }
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
    return [slugify(subjectName), slugify(sourceType), slugify(lectureName), slugify(questionNumber || String(blockIndex + 1)), hashString(questionText).slice(0, 10)].join('__');
}

/* ===================== SUBJECT PREFERENCES ===================== */
function loadSubjectPreferences() {
    try {
        subjectPreferences = { order: [], pinned: [], ...(JSON.parse(localStorage.getItem(STORAGE_KEYS.subjectPrefs)) || {}) };
    } catch (_) {
        subjectPreferences = { order: [], pinned: [] };
    }
}
function saveSubjectPreferences() {
    localStorage.setItem(STORAGE_KEYS.subjectPrefs, JSON.stringify(subjectPreferences));
}
function normalizeSubjectPreferences() {
    const ids = subjects.map(s => s.id);
    subjectPreferences.order = (subjectPreferences.order || []).filter(id => ids.includes(id));
    subjectPreferences.pinned = (subjectPreferences.pinned || []).filter(id => ids.includes(id));
    ids.forEach(id => { if (!subjectPreferences.order.includes(id)) subjectPreferences.order.push(id); });
    saveSubjectPreferences();
}
function sortSubjectsForDisplay(subjectList) {
    const list = [...subjectList];
    const orderIndex = new Map((subjectPreferences.order || []).map((id, idx) => [id, idx]));
    const pinnedSet = new Set(subjectPreferences.pinned || []);
    return list.sort((a, b) => {
        const aPinned = pinnedSet.has(a.id) ? 1 : 0;
        const bPinned = pinnedSet.has(b.id) ? 1 : 0;
        if (aPinned !== bPinned) return bPinned - aPinned;
        const aOrder = orderIndex.has(a.id) ? orderIndex.get(a.id) : Number.MAX_SAFE_INTEGER;
        const bOrder = orderIndex.has(b.id) ? orderIndex.get(b.id) : Number.MAX_SAFE_INTEGER;
        if (aOrder !== bOrder) return aOrder - bOrder;
        return a.name.localeCompare(b.name, 'en', { sensitivity: 'base' });
    });
}
function moveSubject(subjectId, direction) {
    normalizeSubjectPreferences();
    const arr = [...subjectPreferences.order];
    const idx = arr.indexOf(subjectId);
    if (idx === -1) return;
    const next = direction === 'up' ? idx - 1 : idx + 1;
    if (next < 0 || next >= arr.length) return;
    [arr[idx], arr[next]] = [arr[next], arr[idx]];
    subjectPreferences.order = arr;
    saveSubjectPreferences();
    subjects = sortSubjectsForDisplay(subjects);
    renderSubjects();
    openSubjectActions(subjectId);
}
function togglePinSubject(subjectId) {
    normalizeSubjectPreferences();
    const pinned = new Set(subjectPreferences.pinned || []);
    if (pinned.has(subjectId)) pinned.delete(subjectId); else pinned.add(subjectId);
    subjectPreferences.pinned = [...pinned];
    saveSubjectPreferences();
    subjects = sortSubjectsForDisplay(subjects);
    renderSubjects();
    openSubjectActions(subjectId);
}
function openSubjectActions(subjectId) {
    subjectActiveActionsId = subjectId;
    document.querySelectorAll('.subject-card').forEach(card => card.classList.toggle('actions-open', card.dataset.subjectId === subjectId));
}
function closeSubjectActions() {
    subjectActiveActionsId = null;
    document.querySelectorAll('.subject-card').forEach(card => card.classList.remove('actions-open'));
}
function bindGlobalSubjectActionClose() {
    document.addEventListener('click', event => {
        if (!event.target.closest('.subject-card')) closeSubjectActions();
    });
}
function startSubjectLongPress(subjectId) {
    clearTimeout(subjectLongPressTimer);
    subjectLongPressTimer = setTimeout(() => openSubjectActions(subjectId), 420);
}
function cancelSubjectLongPress() {
    clearTimeout(subjectLongPressTimer);
    subjectLongPressTimer = null;
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
        case 'search': showScreen('search-screen'); document.getElementById('search-input').value = ''; document.getElementById('search-results').innerHTML = ''; break;
        default: openExams();
    }
}

function renderSubjects() {
    const container = document.getElementById('subjects-list');
    const empty = document.getElementById('subjects-empty');
    if (!container || !empty) return;
    const theme = currentTheme();
    const searchTerm = (document.getElementById('subjects-search')?.value || '').trim().toLowerCase();
    subjects = sortSubjectsForDisplay(subjects);
    const visible = subjects.filter(s => s.name.toLowerCase().includes(searchTerm));
    if (!subjects.length) { empty.classList.remove('hidden'); container.innerHTML = ''; return; }
    empty.classList.add('hidden');
    const pinnedSet = new Set(subjectPreferences.pinned || []);
    container.innerHTML = visible.map(subject => {
        const isPinned = pinnedSet.has(subject.id);
        const title = escapeHtml(subject.name);
        return `
            <div class="subject-card${subjectActiveActionsId === subject.id ? ' actions-open' : ''}" data-subject-id="${subject.id}" onclick="handleSubjectOpen('${subject.id}', event)" onmousedown="startSubjectLongPress('${subject.id}')" ontouchstart="startSubjectLongPress('${subject.id}')" onmouseup="cancelSubjectLongPress()" onmouseleave="cancelSubjectLongPress()" ontouchend="cancelSubjectLongPress()" ontouchcancel="cancelSubjectLongPress()">
                ${isPinned ? `<span class="subject-pin-badge">📌 مثبت</span>` : ''}
                <div class="subject-card-top">
                    <div class="subject-icon-box">${theme.icons.subject}</div>
                    <div class="subject-title-wrap">
                        <div class="subject-badge-text">${title}</div>
                        <div class="subject-subtitle">اضغط مطولاً للترتيب والتثبيت</div>
                    </div>
                </div>
                <div class="subject-meta">
                    <div><span>${theme.icons.lectures} Lectures</span><strong>${subject.totalLectures}</strong></div>
                    <div><span>${theme.icons.progress} Questions</span><strong>${subject.totalQuestions}</strong></div>
                    <div><span>${theme.icons.years} Years</span><strong>${subject.years.length}</strong></div>
                </div>
                <div class="subject-actions" onclick="event.stopPropagation()">
                    <button class="subject-action-btn" onclick="moveSubject('${subject.id}', 'up')">⬆️ أعلى</button>
                    <button class="subject-action-btn" onclick="moveSubject('${subject.id}', 'down')">⬇️ أسفل</button>
                    <button class="subject-action-btn" onclick="togglePinSubject('${subject.id}')">${isPinned ? '📍 إلغاء التثبيت' : '📌 تثبيت بالأعلى'}</button>
                </div>
            </div>
        `;
    }).join('');
    if (!visible.length) container.innerHTML = `<div class="empty-state"><div class="empty-icon">🔎</div><p>لا توجد مواد مطابقة للبحث.</p></div>`;
}
function handleSubjectOpen(subjectId, event) {
    if (event.target.closest('.subject-action-btn')) return;
    if (subjectActiveActionsId === subjectId) return;
    openSubject(subjectId);
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
    cards.push(categoryCardHtml('ai', `AI ${currentSubject.name}`, theme.icons.ai, currentSubject.ai.length, currentSubject.ai.reduce((s, g) => s + g.questions.length, 0), currentSubject.hasAiFolder || currentSubject.ai.length > 0));
    cards.push(categoryCardHtml('lectures', `${currentSubject.name} Lectures`, theme.icons.lectures, currentSubject.lectures.length, currentSubject.lectures.reduce((s, g) => s + g.questions.length, 0), true));
    if (currentSubject.years.length > 0) cards.push(categoryCardHtml('years', `${currentSubject.name} Years`, theme.icons.years, currentSubject.years.length, currentSubject.years.reduce((s, g) => s + g.questions.length, 0), true));
    document.getElementById('subject-categories').innerHTML = cards.filter(Boolean).join('') || `<div class="empty-state"><div class="empty-icon">📭</div><p>لا توجد ملفات TXT بعد داخل هذه المادة.</p></div>`;
    showScreen('subject-sections-screen');
}
function categoryCardHtml(type, title, icon, count, totalQuestions, enabled) {
    if (!enabled) {
        return `
            <div class="category-card" style="opacity:.66; cursor:default;">
                <span class="category-badge">${icon} Section</span>
                <h4>${escapeHtml(title)}</h4>
                <div class="category-meta"><div><span>العناصر</span><strong>0</strong></div><div><span>الأسئلة</span><strong>0</strong></div></div>
            </div>
        `;
    }
    return `
        <button class="category-card" onclick="openSubjectCategory('${type}')">
            <span class="category-badge">${icon} Section</span>
            <h4>${escapeHtml(title)}</h4>
            <div class="category-meta"><div><span>العناصر</span><strong>${count}</strong></div><div><span>الأسئلة</span><strong>${totalQuestions}</strong></div></div>
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
        title = `AI ${currentSubject.name}`;
        placeholder = 'ابحث عن ملف AI...';
    } else if (type === 'years') {
        groups = currentSubject.years;
        title = `${currentSubject.name} Years`;
        placeholder = 'ابحث عن الدفعة...';
    }
    showSelectionScreen(groups, title, { backContext: 'subject', searchPlaceholder: placeholder, searchable: true, sectionType: type });
}
function backFromSelection() { if (currentSelectionMeta?.backContext === 'subject' && currentSubject) openSubject(currentSubject.id); else goHome(); }

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
    if (meta.searchable) { searchContainer.classList.remove('hidden'); searchInput.value = ''; searchInput.placeholder = meta.searchPlaceholder || 'ابحث...'; } else searchContainer.classList.add('hidden');
    const list = document.getElementById('selection-list');
    list.innerHTML = '';
    groups.forEach((group, idx) => {
        const icon = group.type === 'lecture' ? theme.icons.lectures : group.type === 'ai' ? theme.icons.ai : theme.icons.years;
        const item = document.createElement('div');
        item.className = 'selection-item';
        item.dataset.groupName = `${group.name} ${group.subjectName || ''}`.toLowerCase();
        item.innerHTML = `<input type="checkbox" id="group-${idx}" onchange="toggleGroupSelection(${idx})"><label for="group-${idx}" style="width:100%; cursor:pointer;"><strong>${icon} ${escapeHtml(group.name)}</strong><br><small style="color:var(--text-muted)">${group.questions.length} questions</small></label>`;
        item.addEventListener('click', event => { if (event.target.closest('input') || event.target.closest('label')) return; const cb = item.querySelector('input'); cb.checked = !cb.checked; toggleGroupSelection(idx); });
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
        document.getElementById('extra-time-display').textContent = '+0 min';
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
    const btn = document.getElementById('btn-add-extra');
    btn.disabled = true; btn.textContent = '✓ تمت إضافة 5 دقائق';
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
    currentExam = { mode, direction, questions: questions.map(q => ({ ...q })), currentIndex: 0, answers: new Array(questions.length).fill(null), firstAnswers: new Array(questions.length).fill(null), startTime: Date.now(), totalTime: (questions.length + extraMinutes) * 60 * 1000, submitted: false, showAnswer: false, sourceLabel };
    saveExamState();
    showScreen('exam-screen');
    renderExam();
    if (mode === 'exam') startTimer();
}
function startSpecialExam(questions, mode, direction) { startExamSession(shuffleArray([...questions]), mode, direction || 'twoway', 'special', 5); }

/* ===================== EXAM ===================== */
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
                <button class="icon-btn ${isFav ? 'active' : ''}" onclick="toggleFavorite('${question.id}')" title="Favorite">💚</button>
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
    switch (settings.theme) {
        case 'desert': return 'إجابة أصابت الهدف في قلب الصحراء!';
        case 'space': return 'Target locked. Correct answer!';
        case 'pirates': return 'Direct hit, captain!';
        case 'castle': return 'A noble strike!';
        case 'lab': return 'Hypothesis confirmed!';
        default: return 'إجابة صحيحة!';
    }
}
function themedWrongMessage() {
    switch (settings.theme) {
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
