
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
let subjectActionsOpenId = null;

const STORAGE_KEYS = {
    settings: 'medical-app-settings-v7',
    progress: 'medical-app-progress-v7',
    favorites: 'medical-app-favorites-v7',
    wrong: 'medical-app-wrong-v7',
    examState: 'medical-app-exam-state-v7',
    subjectPrefs: 'medical-app-subject-prefs-v7'
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
        toast: { success: '✅', error: '❌', info: 'ℹ️' }
    },
    desert: {
        name: 'البادية',
        icons: { exams: '🏹', wrong: '🦂', favorites: '🌵', search: '🔎', statistics: '🧭', settings: '🏕️', lectures: '📜', ai: '🔥', years: '📅', start: '🐪', results: '👑', progress: '🏹', favoriteAction: '💚', location: '🧭', success: '🤎', error: '🦂', review: '📜', subject: '🏜️' },
        texts: { startExam: '🐪 Start Journey', resultsTitle: 'Majlis Report', statsTitle: '🧭 إحصائيات الرحلة', settingsTitle: '🏕️ إعدادات الخيمة', examSettingsTitle: '🏕️ Exam Camp Settings', examSettingsButton: '🏕️ Exam Settings', progressLabel: 'Desert Progress', trainingLabel: 'Training Camp', examLabel: 'Journey Exam' },
        toast: { success: '🤎', error: '🦂', info: '🏜️' }
    },
    space: {
        name: 'الفضاء',
        icons: { exams: '🚀', wrong: '☄️', favorites: '🌟', search: '🔭', statistics: '📡', settings: '🤖', lectures: '🛰️', ai: '👽', years: '🪐', start: '🚀', results: '🌌', progress: '🎯', favoriteAction: '💚', location: '📡', success: '✨', error: '☄️', review: '🧾', subject: '🪐' },
        texts: { startExam: '🚀 Launch Mission', resultsTitle: 'Mission Report', statsTitle: '📡 Mission Analytics', settingsTitle: '🤖 Space Controls', examSettingsTitle: '🤖 Mission Controls', examSettingsButton: '🤖 Mission Settings', progressLabel: 'Mission Progress', trainingLabel: 'Training Mission', examLabel: 'Space Mission' },
        toast: { success: '✨', error: '☄️', info: '🪐' }
    },
    pirates: {
        name: 'القراصنة',
        icons: { exams: '☠️', wrong: '🦈', favorites: '💰', search: '🔎', statistics: '🧭', settings: '⚓', lectures: '🗺️', ai: '🦜', years: '🗓️', start: '☠️', results: '👑', progress: '🏴‍☠️', favoriteAction: '💚', location: '🧭', success: '🪙', error: '🦈', review: '📜', subject: '⚓' },
        texts: { startExam: '☠️ Start Voyage', resultsTitle: 'Treasure Report', statsTitle: '🧭 Voyage Progress', settingsTitle: '⚓ Captain Settings', examSettingsTitle: '⚓ Voyage Settings', examSettingsButton: '⚓ Voyage Settings', progressLabel: 'Voyage Progress', trainingLabel: 'Deck Training', examLabel: 'Treasure Voyage' },
        toast: { success: '🪙', error: '🦈', info: '🏴‍☠️' }
    },
    castle: {
        name: 'القلعة',
        icons: { exams: '⚔️', wrong: '🐉', favorites: '👑', search: '🔎', statistics: '🛡️', settings: '🏰', lectures: '📜', ai: '🕯️', years: '📅', start: '⚔️', results: '👑', progress: '🏹', favoriteAction: '💚', location: '🛡️', success: '🛡️', error: '🐉', review: '📜', subject: '🏰' },
        texts: { startExam: '⚔️ Begin Quest', resultsTitle: 'Kingdom Report', statsTitle: '🛡️ Quest Progress', settingsTitle: '🏰 Castle Settings', examSettingsTitle: '🏰 Quest Settings', examSettingsButton: '🏰 Quest Settings', progressLabel: 'Quest Progress', trainingLabel: 'Knight Training', examLabel: 'Kingdom Trial' },
        toast: { success: '🛡️', error: '🐉', info: '🏰' }
    },
    lab: {
        name: 'المختبر',
        icons: { exams: '🧪', wrong: '☣️', favorites: '🧬', search: '🔬', statistics: '📈', settings: '⚗️', lectures: '🔬', ai: '🧠', years: '📅', start: '🧪', results: '🏅', progress: '🧫', favoriteAction: '💚', location: '📍', success: '🧫', error: '☣️', review: '📋', subject: '⚗️' },
        texts: { startExam: '🧪 Start Experiment', resultsTitle: 'Research Report', statsTitle: '📈 Experiment Progress', settingsTitle: '⚗️ Lab Settings', examSettingsTitle: '⚗️ Experiment Settings', examSettingsButton: '⚗️ Experiment Settings', progressLabel: 'Experiment Progress', trainingLabel: 'Trial Run', examLabel: 'Main Experiment' },
        toast: { success: '🧫', error: '☣️', info: '🧪' }
    }
};

const DEFAULT_SETTINGS = { darkMode: false, theme: 'default', bgSound: 'none', bgSoundEnabled: true, volume: 50, feedbackEnabled: true, animations: true };
const IGNORE_ROOT_DIRS = new Set(['.git', '.github', 'node_modules', 'assets', 'asset', 'audio', 'audios', 'img', 'images', 'css', 'js', 'docs', 'dist', 'build']);

function getEl(id) { return document.getElementById(id); }
function getTheme() { return THEMES[settings.theme] || THEMES.default; }

window.addEventListener('DOMContentLoaded', function () {
    try {
        loadSettings();
        loadProgress();
        loadFavorites();
        loadWrongQuestions();
        loadSubjectPreferences();
        applySettings();
        displayRandomQuote();
        bindGlobalSubjectActionClose();
        primeAudioUnlock();
        prepareStaticEffectAudio().then(loadData).then(checkResumeExam).catch(function (err) {
            console.error(err);
            showToast('تعذر تشغيل التطبيق. تحقق من الملفات.', 'error');
        });
    } catch (err) {
        console.error(err);
        showToast('حدث خطأ في بدء التطبيق.', 'error');
    }
});

function displayRandomQuote() {
    const quotes = [
        'لا توجد وصفة سحرية، ولا توجد طريقة ليس فيها العمل والتعب وبذل الجهد!',
        'الفشل ليس النهاية، بل خطوة ضرورية نحو القمة إذا تعلمت منه.',
        'العلم الذي تدرسه اليوم هو الأمل الذي ستمنحه لغيرك غدًا.',
        'دراسة الطب ماراثون وليست سباقًا قصيرًا؛ واصل التقدم بهدوء.',
        'ابدأ الآن، فالوقت المثالي لا يأتي وحده.'
    ];
    const el = getEl('random-quote');
    if (el) el.textContent = quotes[Math.floor(Math.random() * quotes.length)];
}

async function loadData() {
    subjects = [];
    allQuestions = [];
    discoveredRepo = await discoverRepository();
    if (!discoveredRepo) throw new Error('Cannot detect GitHub repository.');
    const rootItems = await listRepoDirectory('');
    const subjectDirs = rootItems.filter(function (item) {
        return item.type === 'dir' && !IGNORE_ROOT_DIRS.has(item.name.toLowerCase());
    });
    const scanned = [];
    for (let i = 0; i < subjectDirs.length; i += 1) {
        const result = await scanSubjectFolder(subjectDirs[i]);
        if (result) scanned.push(result);
    }
    subjects = sortSubjects(scanned);
    normalizeSubjectPreferences();
    allQuestions = subjects.reduce(function (acc, subject) { return acc.concat(subject.allQuestions); }, []);
    populateSearchFilter();
    renderSubjects();
    updateStatisticsIfOpen();
}

async function discoverRepository() {
    const hostname = window.location.hostname;
    if (!hostname.endsWith('github.io')) return null;
    const owner = hostname.split('.')[0];
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    const repo = pathParts.length > 0 ? pathParts[0] : owner + '.github.io';
    const response = await fetch('https://api.github.com/repos/' + owner + '/' + repo);
    if (!response.ok) throw new Error('Unable to read repository metadata.');
    const data = await response.json();
    return { owner: owner, repo: repo, branch: data.default_branch || 'main' };
}

async function listRepoDirectory(path) {
    const cleanPath = path ? encodeURIComponent(path).replace(/%2F/g, '/') : '';
    const url = 'https://api.github.com/repos/' + discoveredRepo.owner + '/' + discoveredRepo.repo + '/contents/' + cleanPath + '?ref=' + encodeURIComponent(discoveredRepo.branch);
    const response = await fetch(url, { headers: { Accept: 'application/vnd.github+json' } });
    if (!response.ok) throw new Error('Unable to read directory: ' + (path || 'root'));
    const data = await response.json();
    return Array.isArray(data) ? data : [];
}

async function scanSubjectFolder(dirItem) {
    const subjectItems = await listRepoDirectory(dirItem.path);
    const lectureFiles = subjectItems.filter(function (item) {
        return item.type === 'file' && item.name.toLowerCase().endsWith('.txt');
    }).sort(function (a, b) { return a.name.localeCompare(b.name); });
    const aiFolder = subjectItems.find(function (item) { return item.type === 'dir' && item.name.toLowerCase() === 'ai'; });
    let aiFiles = [];
    if (aiFolder) {
        const aiItems = await listRepoDirectory(aiFolder.path);
        aiFiles = aiItems.filter(function (item) {
            return item.type === 'file' && item.name.toLowerCase().endsWith('.txt');
        }).sort(function (a, b) { return a.name.localeCompare(b.name); });
    }
    if (lectureFiles.length === 0 && aiFiles.length === 0 && !aiFolder) {
        return { id: slugify(dirItem.name), name: dirItem.name, lectures: [], ai: [], years: [], allQuestions: [], totalQuestions: 0, totalLectures: 0, hasAiFolder: false };
    }
    const lectures = [];
    const aiLectures = [];
    let startCounter = 1;
    for (let i = 0; i < lectureFiles.length; i += 1) {
        const group = await buildLectureGroupFromFile(lectureFiles[i], dirItem.name, 'lecture', startCounter);
        if (group) { startCounter += group.questions.length; lectures.push(group); }
    }
    for (let j = 0; j < aiFiles.length; j += 1) {
        const group = await buildLectureGroupFromFile(aiFiles[j], dirItem.name, 'ai', startCounter);
        if (group) { startCounter += group.questions.length; aiLectures.push(group); }
    }
    const all = lectures.reduce(function (acc, g) { return acc.concat(g.questions); }, []).concat(aiLectures.reduce(function (acc, g) { return acc.concat(g.questions); }, []));
    const years = buildYearsFromQuestions(dirItem.name, all);
    return { id: slugify(dirItem.name), name: dirItem.name, lectures: lectures, ai: aiLectures, years: years, allQuestions: all, totalQuestions: all.length, totalLectures: lectures.length + aiLectures.length, hasAiFolder: !!aiFolder };
}

async function buildLectureGroupFromFile(fileItem, subjectName, sourceType, startCounter) {
    const text = await fetchQuestionFile(fileItem);
    const lectureName = fileItem.name.replace(/\.txt$/i, '');
    const questions = parseQuestionFile(text, { subjectName: subjectName, lectureName: lectureName, sourceType: sourceType, sourcePath: fileItem.path, startCounter: startCounter });
    if (!questions.length) return null;
    return { id: slugify(subjectName) + '__' + sourceType + '__' + slugify(lectureName), name: lectureName, type: sourceType, subjectName: subjectName, path: fileItem.path, questions: questions };
}

async function fetchQuestionFile(fileItem) {
    if (fileItem.download_url) {
        const response = await fetch(fileItem.download_url);
        if (response.ok) return await response.text();
    }
    const url = 'https://raw.githubusercontent.com/' + discoveredRepo.owner + '/' + discoveredRepo.repo + '/' + discoveredRepo.branch + '/' + fileItem.path;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Unable to fetch file: ' + fileItem.path);
    return await response.text();
}

function buildYearsFromQuestions(subjectName, pool) {
    const map = new Map();
    pool.forEach(function (question) {
        const batch = String(question.batchName || '').trim();
        if (!batch) return;
        if (!map.has(batch)) map.set(batch, []);
        map.get(batch).push(Object.assign({}, question, { sourceType: 'year', originalSourceType: question.sourceType }));
    });
    return Array.from(map.entries()).sort(function (a, b) { return a[0].localeCompare(b[0], 'en', { sensitivity: 'base' }); }).map(function (entry) {
        return { id: slugify(subjectName) + '__year__' + slugify(entry[0]), name: entry[0], type: 'year', subjectName: subjectName, questions: entry[1] };
    });
}

function parseQuestionFile(rawText, meta) {
    const normalized = normalizeText(rawText);
    const blocks = splitQuestionBlocks(normalized);
    const questions = [];
    let fallbackCounter = meta.startCounter || 1;
    for (let i = 0; i < blocks.length; i += 1) {
        const parsed = parseQuestionBlock(blocks[i], meta, fallbackCounter, i);
        if (parsed) {
            if (!parsed.number) parsed.number = String(fallbackCounter);
            questions.push(parsed);
            fallbackCounter += 1;
        }
    }
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

function splitQuestionBlocks(text) {
    if (!text) return [];
    const byHashes = text.split(/(?:^|\n)\s*###\s*(?=\n|$)/g).map(function (part) { return part.trim(); }).filter(Boolean);
    if (byHashes.length > 1) return byHashes;
    const paragraphs = text.split(/\n{2,}/).map(function (p) { return p.trim(); }).filter(Boolean);
    if (paragraphs.length <= 1) return [text.trim()].filter(Boolean);
    const blocks = [];
    let current = [];
    let hasCorrect = false;
    for (let i = 0; i < paragraphs.length; i += 1) {
        const paragraph = paragraphs[i];
        const looksNew = current.length > 0 && hasCorrect && looksLikeQuestionStart(paragraph);
        if (looksNew) {
            blocks.push(current.join('\n\n').trim());
            current = [];
            hasCorrect = false;
        }
        current.push(paragraph);
        if (/^\s*Correct\s*Answer\s*:/im.test(paragraph)) hasCorrect = true;
        if (i === paragraphs.length - 1 && current.length) blocks.push(current.join('\n\n').trim());
    }
    return blocks.filter(Boolean);
}

function looksLikeQuestionStart(paragraph) {
    const firstLine = (paragraph.split('\n').find(function (line) { return line.trim(); }) || '').trim();
    if (!firstLine) return false;
    if (/^Question\s*\d+/i.test(firstLine)) return true;
    if (/^(Correct\s*Answer|Explanation)\s*:/i.test(firstLine)) return false;
    if (/^[A-E][\)\.\-]/.test(firstLine)) return false;
    if (isPageLine(firstLine)) return false;
    return true;
}

function parseQuestionBlock(block, meta, fallbackCounter, blockIndex) {
    try {
        const lines = block.split('\n').map(function (line) { return line.trim(); }).filter(Boolean);
        if (!lines.length || !lines.some(function (line) { return /^Correct\s*Answer\s*:/i.test(line); })) return null;
        let questionNumber = '';
        let questionText = '';
        let options = [];
        let correctAnswer = '';
        let explanation = '';
        let batchName = '';
        let pageNumber = '';
        let startIndex = 0;
        const headMatch = (lines[0] || '').match(/^Question\s*(\d+)\s*[:\-.]?\s*(.*)$/i);
        if (headMatch) {
            questionNumber = headMatch[1] || '';
            if (headMatch[2]) lines[0] = headMatch[2].trim(); else startIndex = 1;
        }
        const answerLineIndex = lines.findIndex(function (line) { return /^Correct\s*Answer\s*:/i.test(line); });
        if (answerLineIndex === -1) return null;
        const beforeAnswer = lines.slice(startIndex, answerLineIndex);
        const firstOptionIndex = beforeAnswer.findIndex(function (line) { return /^[A-E][\)\.\-]\s*/i.test(line); });
        if (firstOptionIndex === -1) return null;
        questionText = beforeAnswer.slice(0, firstOptionIndex).join(' ').trim() || ('Question ' + fallbackCounter);
        options = beforeAnswer.slice(firstOptionIndex).filter(function (line) { return /^[A-E][\)\.\-]\s*/i.test(line); });
        correctAnswer = lines[answerLineIndex].replace(/^Correct\s*Answer\s*:\s*/i, '').trim();
        let i = answerLineIndex + 1;
        if (i < lines.length && /^Explanation\s*:/i.test(lines[i])) {
            const expParts = [];
            const firstExp = lines[i].replace(/^Explanation\s*:\s*/i, '').trim();
            if (firstExp) expParts.push(firstExp);
            i += 1;
            while (i < lines.length && !isMetadataLine(lines[i])) {
                expParts.push(lines[i]);
                i += 1;
            }
            explanation = expParts.join(' ').trim();
        }
        while (i < lines.length) {
            const line = lines[i];
            if (isPageLine(line)) pageNumber = line;
            else if (!batchName && isBatchLine(line)) batchName = line;
            else if (!batchName && looksLikeMetadataTail(line)) batchName = line;
            else if (!explanation && !/^Explanation\s*:/i.test(line)) explanation = [explanation, line].filter(Boolean).join(' ').trim();
            i += 1;
        }
        if (!questionNumber) questionNumber = String(fallbackCounter);
        return { id: buildQuestionId(meta.subjectName, meta.sourceType, meta.lectureName, questionNumber, questionText, blockIndex), number: questionNumber, text: questionText, options: options, correctAnswer: correctAnswer, correctIndex: resolveCorrectIndex(options, correctAnswer), explanation: explanation, batchName: batchName, pageNumber: pageNumber, subjectName: meta.subjectName, lectureName: meta.lectureName, groupName: meta.lectureName, sourceType: meta.sourceType, sourcePath: meta.sourcePath };
    } catch (err) {
        console.warn('Question parsing error:', err, block);
        return null;
    }
}

function isMetadataLine(line) { return isPageLine(line) || isBatchLine(line) || looksLikeMetadataTail(line); }
function isPageLine(line) { return /^P\s*\(?\s*\d+\s*\)?$/i.test(line) || /^Page\s*\d+$/i.test(line); }
function isBatchLine(line) { return /^[A-Za-z][A-Za-z0-9\s&()'\/]+-\s*\d+$/i.test(line) || /^\d+(st|nd|rd|th)\s+Year/i.test(line); }
function looksLikeMetadataTail(line) { return /^[A-Za-z].{0,60}$/.test(line) && /\d/.test(line) && !/[?.!]$/.test(line); }
function resolveCorrectIndex(options, correctAnswer) {
    if (!Array.isArray(options) || !options.length) return -1;
    const letterMatch = String(correctAnswer || '').match(/^([A-E])/i);
    if (letterMatch) {
        const idx = letterMatch[1].toUpperCase().charCodeAt(0) - 65;
        if (idx >= 0 && idx < options.length) return idx;
    }
    const answerText = normalizeComparisonText(correctAnswer);
    for (let i = 0; i < options.length; i += 1) {
        const optText = normalizeComparisonText(options[i]);
        if (optText && (optText.indexOf(answerText) > -1 || answerText.indexOf(optText) > -1)) return i;
    }
    return -1;
}
function buildQuestionId(subjectName, sourceType, lectureName, questionNumber, questionText, blockIndex) {
    return [slugify(subjectName), slugify(sourceType), slugify(lectureName), slugify(questionNumber || String(blockIndex + 1)), hashString(questionText).slice(0, 10)].join('__');
}

function loadSubjectPreferences() {
    try { subjectPreferences = Object.assign({ order: [], pinned: [] }, JSON.parse(localStorage.getItem(STORAGE_KEYS.subjectPrefs)) || {}); }
    catch (err) { subjectPreferences = { order: [], pinned: [] }; }
}
function saveSubjectPreferences() { localStorage.setItem(STORAGE_KEYS.subjectPrefs, JSON.stringify(subjectPreferences)); }
function normalizeSubjectPreferences() {
    const ids = subjects.map(function (s) { return s.id; });
    subjectPreferences.order = (subjectPreferences.order || []).filter(function (id) { return ids.indexOf(id) > -1; });
    subjectPreferences.pinned = (subjectPreferences.pinned || []).filter(function (id) { return ids.indexOf(id) > -1; });
    ids.forEach(function (id) { if (subjectPreferences.order.indexOf(id) === -1) subjectPreferences.order.push(id); });
    saveSubjectPreferences();
}
function sortSubjects(list) {
    const orderIndex = new Map();
    (subjectPreferences.order || []).forEach(function (id, idx) { orderIndex.set(id, idx); });
    const pinned = new Set(subjectPreferences.pinned || []);
    return list.slice().sort(function (a, b) {
        const ap = pinned.has(a.id) ? 1 : 0;
        const bp = pinned.has(b.id) ? 1 : 0;
        if (ap !== bp) return bp - ap;
        const ao = orderIndex.has(a.id) ? orderIndex.get(a.id) : Number.MAX_SAFE_INTEGER;
        const bo = orderIndex.has(b.id) ? orderIndex.get(b.id) : Number.MAX_SAFE_INTEGER;
        if (ao !== bo) return ao - bo;
        return a.name.localeCompare(b.name, 'en', { sensitivity: 'base' });
    });
}
function moveSubject(subjectId, direction) {
    normalizeSubjectPreferences();
    const arr = subjectPreferences.order.slice();
    const idx = arr.indexOf(subjectId);
    if (idx === -1) return;
    const target = direction === 'up' ? idx - 1 : idx + 1;
    if (target < 0 || target >= arr.length) return;
    const temp = arr[idx]; arr[idx] = arr[target]; arr[target] = temp;
    subjectPreferences.order = arr;
    saveSubjectPreferences();
    subjects = sortSubjects(subjects);
    renderSubjects();
    openSubjectActions(subjectId);
}
function togglePinSubject(subjectId) {
    normalizeSubjectPreferences();
    const pinned = new Set(subjectPreferences.pinned || []);
    if (pinned.has(subjectId)) pinned.delete(subjectId); else pinned.add(subjectId);
    subjectPreferences.pinned = Array.from(pinned);
    saveSubjectPreferences();
    subjects = sortSubjects(subjects);
    renderSubjects();
    openSubjectActions(subjectId);
}
function openSubjectActions(subjectId) {
    subjectActionsOpenId = subjectId;
    document.querySelectorAll('.subject-card').forEach(function (card) {
        card.classList.toggle('actions-open', card.getAttribute('data-subject-id') === subjectId);
    });
}
function closeSubjectActions() { subjectActionsOpenId = null; document.querySelectorAll('.subject-card').forEach(function (card) { card.classList.remove('actions-open'); }); }
function bindGlobalSubjectActionClose() { document.addEventListener('click', function (event) { if (!event.target.closest('.subject-card')) closeSubjectActions(); }); }
function startSubjectLongPress(subjectId) { clearTimeout(subjectLongPressTimer); subjectLongPressTimer = setTimeout(function () { openSubjectActions(subjectId); }, 420); }
function cancelSubjectLongPress() { clearTimeout(subjectLongPressTimer); subjectLongPressTimer = null; }

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(function (screen) { screen.classList.remove('active'); });
    const target = getEl(screenId); if (target) target.classList.add('active');
}
function goHome() { toggleExamSettings(false); showScreen('home-screen'); const review = getEl('results-review'); if (review) review.classList.add('hidden'); }
function openExams() { renderSubjects(); showScreen('subjects-screen'); }
function openSection(section) {
    if (section === 'wrong') openWrongQuestions();
    else if (section === 'favorites') openFavoriteQuestions();
    else if (section === 'search') { showScreen('search-screen'); getEl('search-input').value = ''; getEl('search-results').innerHTML = ''; }
    else openExams();
}

function renderSubjects() {
    const container = getEl('subjects-list'); const empty = getEl('subjects-empty'); if (!container || !empty) return;
    subjects = sortSubjects(subjects);
    const searchTerm = String(getEl('subjects-search') ? getEl('subjects-search').value : '').trim().toLowerCase();
    const theme = getTheme();
    const pinnedSet = new Set(subjectPreferences.pinned || []);
    const visible = subjects.filter(function (subject) { return subject.name.toLowerCase().indexOf(searchTerm) > -1; });
    if (!subjects.length) { empty.classList.remove('hidden'); container.innerHTML = ''; return; }
    empty.classList.add('hidden');
    container.innerHTML = visible.map(function (subject) {
        const isPinned = pinnedSet.has(subject.id);
        return `
            <div class="subject-card${subjectActionsOpenId === subject.id ? ' actions-open' : ''}" data-subject-id="${subject.id}" onclick="handleSubjectOpen('${subject.id}', event)" onmousedown="startSubjectLongPress('${subject.id}')" ontouchstart="startSubjectLongPress('${subject.id}')" onmouseup="cancelSubjectLongPress()" onmouseleave="cancelSubjectLongPress()" ontouchend="cancelSubjectLongPress()" ontouchcancel="cancelSubjectLongPress()">
                ${isPinned ? '<span class="subject-pin-badge">📌 مثبت</span>' : ''}
                <div class="subject-card-top">
                    <div class="subject-icon-box">${theme.icons.subject}</div>
                    <div class="subject-title-wrap">
                        <div class="subject-badge-text">${escapeHtml(subject.name)}</div>
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
    if (!visible.length) container.innerHTML = '<div class="empty-state"><div class="empty-icon">🔎</div><p>لا توجد مواد مطابقة للبحث.</p></div>';
}
function handleSubjectOpen(subjectId, event) { if (event && event.target && event.target.closest('.subject-action-btn')) return; if (subjectActionsOpenId === subjectId) return; openSubject(subjectId); }
function filterSubjects() { renderSubjects(); }

function openSubject(subjectId) {
    currentSubject = subjects.find(function (subject) { return subject.id === subjectId; }) || null;
    if (!currentSubject) { showToast('المادة غير موجودة.', 'error'); return; }
    const theme = getTheme();
    getEl('subject-sections-title').textContent = currentSubject.name;
    getEl('subject-sections-summary').innerHTML = `
        <div class="subject-summary-grid">
            <div><span>${theme.icons.lectures} المحاضرات</span><strong>${currentSubject.lectures.length}</strong></div>
            <div><span>${theme.icons.ai} AI</span><strong>${currentSubject.ai.length}</strong></div>
            <div><span>${theme.icons.years} Years</span><strong>${currentSubject.years.length}</strong></div>
            <div><span>${theme.icons.progress} إجمالي الأسئلة</span><strong>${currentSubject.totalQuestions}</strong></div>
        </div>
    `;
    const cards = [];
    cards.push(buildCategoryCard('ai', 'AI ' + currentSubject.name, theme.icons.ai, currentSubject.ai.length, countQuestions(currentSubject.ai), currentSubject.hasAiFolder || currentSubject.ai.length > 0));
    cards.push(buildCategoryCard('lectures', currentSubject.name + ' Lectures', theme.icons.lectures, currentSubject.lectures.length, countQuestions(currentSubject.lectures), true));
    if (currentSubject.years.length > 0) cards.push(buildCategoryCard('years', currentSubject.name + ' Years', theme.icons.years, currentSubject.years.length, countQuestions(currentSubject.years), true));
    getEl('subject-categories').innerHTML = cards.join('') || '<div class="empty-state"><div class="empty-icon">📭</div><p>لا توجد ملفات TXT بعد داخل هذه المادة.</p></div>';
    showScreen('subject-sections-screen');
}
function buildCategoryCard(type, title, icon, count, totalQuestions, enabled) {
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
function countQuestions(groups) { return groups.reduce(function (sum, group) { return sum + group.questions.length; }, 0); }
function openSubjectCategory(type) {
    if (!currentSubject) return;
    let groups = []; let title = currentSubject.name; let placeholder = 'ابحث...';
    if (type === 'ai') { groups = currentSubject.ai; title = 'AI ' + currentSubject.name; placeholder = 'ابحث عن ملف AI...'; }
    else if (type === 'lectures') { groups = currentSubject.lectures; title = currentSubject.name + ' Lectures'; placeholder = 'ابحث عن اسم المحاضرة...'; }
    else { groups = currentSubject.years; title = currentSubject.name + ' Years'; placeholder = 'ابحث عن الدفعة...'; }
    showSelectionScreen(groups, title, { backContext: 'subject', searchable: true, searchPlaceholder: placeholder, sectionType: type });
}
function backFromSelection() { if (currentSelectionMeta && currentSelectionMeta.backContext === 'subject' && currentSubject) openSubject(currentSubject.id); else goHome(); }

function resetSelectionState() { selectedGroups = []; currentGroups = []; selectedMode = null; selectedDirection = null; extraTime = 0; extraTimeAdded = false; currentSelectionMeta = null; }
function showSelectionScreen(groups, title, meta) {
    resetSelectionState(); currentGroups = groups.slice(); currentSelectionMeta = meta || {};
    showScreen('selection-screen'); getEl('selection-title').textContent = title;
    const searchContainer = getEl('selection-search-container'); const searchInput = getEl('selection-search');
    if (meta && meta.searchable) { searchContainer.classList.remove('hidden'); searchInput.value = ''; searchInput.placeholder = meta.searchPlaceholder || 'ابحث...'; }
    else { searchContainer.classList.add('hidden'); searchInput.value = ''; }
    const list = getEl('selection-list'); const theme = getTheme(); list.innerHTML = '';
    groups.forEach(function (group, idx) {
        const icon = group.type === 'ai' ? theme.icons.ai : group.type === 'year' ? theme.icons.years : theme.icons.lectures;
        const item = document.createElement('div');
        item.className = 'selection-item'; item.setAttribute('data-group-name', (group.name + ' ' + (group.subjectName || '')).toLowerCase());
        item.innerHTML = `<input type="checkbox" id="group-${idx}" onchange="toggleGroupSelection(${idx})"><label for="group-${idx}" style="width:100%; cursor:pointer;"><strong>${icon} ${escapeHtml(group.name)}</strong><br><small style="color:var(--text-muted)">${group.questions.length} questions</small></label>`;
        item.addEventListener('click', function (event) { if (event.target.closest('input') || event.target.closest('label')) return; const cb = item.querySelector('input'); cb.checked = !cb.checked; toggleGroupSelection(idx); });
        list.appendChild(item);
    });
    getEl('selection-footer').classList.add('hidden'); getEl('direction-selection').classList.add('hidden'); getEl('timer-options').classList.add('hidden'); getEl('start-section').classList.add('hidden');
    document.querySelectorAll('.btn-mode').forEach(function (btn) { btn.classList.remove('active'); });
    document.querySelectorAll('.btn-direction').forEach(function (btn) { btn.classList.remove('active'); });
}
function filterSelectionList() {
    const term = String(getEl('selection-search').value || '').toLowerCase().trim();
    document.querySelectorAll('#selection-list .selection-item').forEach(function (item) { const name = item.getAttribute('data-group-name') || ''; item.style.display = name.indexOf(term) > -1 ? '' : 'none'; });
}
function toggleGroupSelection(idx) {
    const existing = selectedGroups.indexOf(idx);
    if (existing > -1) selectedGroups.splice(existing, 1); else selectedGroups.push(idx);
    document.querySelectorAll('#selection-list .selection-item').forEach(function (item, itemIdx) { item.classList.toggle('selected', selectedGroups.indexOf(itemIdx) > -1); });
    updateSelectionFooter();
}
function updateSelectionFooter() {
    const footer = getEl('selection-footer');
    const totalQuestions = selectedGroups.reduce(function (sum, idx) { return sum + currentGroups[idx].questions.length; }, 0);
    if (selectedGroups.length > 0) {
        footer.classList.remove('hidden'); getEl('selected-count').textContent = totalQuestions + ' questions selected';
        const input = getEl('question-count-input'); input.max = totalQuestions; input.value = totalQuestions; getEl('max-questions-label').textContent = '/ ' + totalQuestions;
    } else footer.classList.add('hidden');
    selectedMode = null; selectedDirection = null;
    getEl('direction-selection').classList.add('hidden'); getEl('timer-options').classList.add('hidden'); getEl('start-section').classList.add('hidden');
    document.querySelectorAll('.btn-mode').forEach(function (btn) { btn.classList.remove('active'); });
    document.querySelectorAll('.btn-direction').forEach(function (btn) { btn.classList.remove('active'); });
}
function selectMode(mode) {
    selectedMode = mode; selectedDirection = null; extraTime = 0; extraTimeAdded = false;
    document.querySelectorAll('.btn-mode').forEach(function (btn) { btn.classList.remove('active'); });
    getEl(mode === 'training' ? 'btn-training-mode' : 'btn-exam-mode').classList.add('active');
    document.querySelectorAll('.btn-direction').forEach(function (btn) { btn.classList.remove('active'); });
    getEl('direction-selection').classList.remove('hidden'); getEl('timer-options').classList.add('hidden'); getEl('start-section').classList.add('hidden');
}
function selectDirection(direction) {
    selectedDirection = direction;
    document.querySelectorAll('.btn-direction').forEach(function (btn) { btn.classList.remove('active'); });
    getEl(direction === 'oneway' ? 'btn-oneway' : 'btn-twoway').classList.add('active');
    if (selectedMode === 'exam') {
        const count = parseInt(getEl('question-count-input').value, 10) || 0;
        getEl('base-time-display').textContent = count + ' min'; getEl('extra-time-display').textContent = '+0 min'; getEl('total-time-display').textContent = count + ' min'; getEl('timer-options').classList.remove('hidden');
        const btn = getEl('btn-add-extra'); btn.disabled = false; btn.textContent = '+ إضافة 5 دقائق'; extraTime = 0; extraTimeAdded = false;
    } else getEl('timer-options').classList.add('hidden');
    getEl('start-section').classList.remove('hidden');
}
function addExtraTime() {
    if (extraTimeAdded) return; extraTime = 5; extraTimeAdded = true;
    const count = parseInt(getEl('question-count-input').value, 10) || 0;
    getEl('extra-time-display').textContent = '+5 min'; getEl('total-time-display').textContent = (count + 5) + ' min';
    const btn = getEl('btn-add-extra'); btn.disabled = true; btn.textContent = '✓ تمت إضافة 5 دقائق';
}
function confirmStartExam() {
    if (!selectedMode || !selectedDirection) { showToast('يرجى اختيار النمط واتجاه التنقل.', 'error'); return; }
    const count = parseInt(getEl('question-count-input').value, 10);
    if (!count || count < 1) { showToast('يرجى إدخال عدد صحيح من الأسئلة.', 'error'); return; }
    let questions = [];
    selectedGroups.forEach(function (idx) { questions = questions.concat(currentGroups[idx].questions); });
    questions = shuffleArray(questions).slice(0, count);
    startExamSession(questions, selectedMode, selectedDirection, currentSelectionMeta ? currentSelectionMeta.sectionType : 'custom', extraTime);
}
function startExamSession(questions, mode, direction, sourceLabel, extraMinutes) {
    if (!questions.length) { showToast('لا توجد أسئلة متاحة.', 'error'); return; }
    currentExam = { mode: mode, direction: direction, sourceLabel: sourceLabel || 'custom', questions: questions.map(function (q) { return Object.assign({}, q); }), currentIndex: 0, answers: new Array(questions.length).fill(null), firstAnswers: new Array(questions.length).fill(null), startTime: Date.now(), totalTime: (questions.length + (extraMinutes || 0)) * 60 * 1000, submitted: false, showAnswer: false };
    saveExamState(); showScreen('exam-screen'); renderExam(); if (mode === 'exam') startTimer();
}
function startSpecialExam(questions, mode, direction) { startExamSession(shuffleArray(questions.slice()), mode, direction || 'twoway', 'special', 5); }

function renderExam() {
    if (!currentExam) return;
    const theme = getTheme(); const questions = currentExam.questions; const currentIndex = currentExam.currentIndex; const question = questions[currentIndex]; if (!question) return;
    let progressText = theme.icons.progress + ' ' + theme.texts.progressLabel + ' · ' + (currentIndex + 1) + '/' + questions.length;
    if (currentExam.mode === 'training') {
        const answered = currentExam.firstAnswers.filter(function (item) { return item !== null; }).length;
        const correct = currentExam.firstAnswers.filter(function (answer, idx) { return answer !== null && isAnswerCorrect(questions[idx], answer); }).length;
        const pct = answered > 0 ? Math.round((correct / answered) * 100) : 0;
        progressText += ' · ' + theme.icons.success + correct + ' · ' + pct + '%';
    } else progressText += ' · ' + (questions.length - currentIndex) + ' left';
    getEl('exam-progress').textContent = progressText;
    renderGrid();
    const correctIdx = getCorrectIndex(question); const showAnswerState = currentExam.mode === 'training' && currentExam.showAnswer; const isFav = favorites.indexOf(question.id) > -1;
    getEl('question-container').innerHTML = `
        <div class="question-header">
            <span class="question-number">Q${escapeHtml(question.number || String(currentIndex + 1))}</span>
            <div class="question-actions">
                <button class="icon-btn ${isFav ? 'active' : ''}" onclick="toggleFavorite('${question.id}')" title="Favorite">💚</button>
                <button class="icon-btn" onclick="showLocation('${escapeJsString(question.subjectName)}','${escapeJsString(question.lectureName)}','${escapeJsString(question.batchName || '')}','${escapeJsString(question.pageNumber || '')}')" title="Location">${theme.icons.location}</button>
            </div>
        </div>
        <p class="question-text">${escapeHtml(question.text)}</p>
        <div class="options-list">
            ${question.options.map(function (opt, idx) { let cls = 'option-btn'; if (currentExam.answers[currentIndex] === idx) cls += ' selected'; if (showAnswerState) { if (idx === correctIdx) cls += ' correct'; else if (currentExam.answers[currentIndex] === idx && idx !== correctIdx) cls += ' wrong'; } return '<button class="' + cls + '" onclick="selectOption(' + idx + ')">' + escapeHtml(opt) + '</button>'; }).join('')}
        </div>
        <div class="explanation-box ${showAnswerState ? 'visible' : ''}"><strong>Explanation:</strong> ${escapeHtml(question.explanation || 'No explanation available.')}</div>
        <div class="inline-meta">
            <span>${theme.icons.subject} ${escapeHtml(question.subjectName || '')}</span>
            <span>${question.sourceType === 'ai' ? theme.icons.ai : theme.icons.lectures} ${escapeHtml(question.lectureName || '')}</span>
            ${question.batchName ? '<span>' + theme.icons.years + ' ' + escapeHtml(question.batchName) + '</span>' : ''}
            ${question.pageNumber ? '<span>' + theme.icons.location + ' ' + escapeHtml(question.pageNumber) + '</span>' : ''}
        </div>
    `;
    renderExamNav();
}
function renderGrid() {
    if (!currentExam) return;
    const grid = getEl('question-grid'); grid.innerHTML = '';
    currentExam.questions.forEach(function (question, idx) {
        let cls = 'grid-btn';
        if (idx === currentExam.currentIndex) cls += ' current';
        else if (currentExam.answers[idx] !== null) { if (currentExam.mode === 'training' && currentExam.firstAnswers[idx] !== null) cls += isAnswerCorrect(question, currentExam.firstAnswers[idx]) ? ' answered' : ' wrong'; else cls += ' answered'; }
        if (currentExam.direction === 'oneway' && idx < currentExam.currentIndex) cls += ' disabled';
        const btn = document.createElement('button'); btn.className = cls; btn.textContent = String(idx + 1); btn.onclick = function () { navigateToQuestion(idx); }; grid.appendChild(btn);
    });
}
function renderExamNav() {
    if (!currentExam) return;
    const nav = getEl('exam-nav'); const idx = currentExam.currentIndex; const last = currentExam.questions.length - 1; let left = '<span></span>'; let right = '<span></span>';
    if (currentExam.direction === 'twoway' && idx > 0) left = '<button class="btn-secondary" onclick="prevQuestion()">Previous ←</button>';
    if (currentExam.mode === 'training') {
        if (currentExam.showAnswer) right = idx < last ? '<button class="btn-primary" onclick="nextQuestion()">Next →</button>' : '<button class="btn-primary" onclick="finishExam()">Finish</button>';
        else if (currentExam.answers[idx] !== null) right = '<button class="btn-small" onclick="showAnswer()">Show Answer</button>';
    } else if (currentExam.answers[idx] !== null) right = idx < last ? '<button class="btn-primary" onclick="nextQuestion()">Next →</button>' : '<button class="btn-primary" onclick="finishExam()">Submit Exam</button>';
    nav.innerHTML = left + right;
}
function selectOption(optionIndex) {
    if (!currentExam || currentExam.submitted) return; if (currentExam.mode === 'training' && currentExam.showAnswer) return;
    const idx = currentExam.currentIndex; const question = currentExam.questions[idx]; currentExam.answers[idx] = optionIndex; if (currentExam.firstAnswers[idx] === null) currentExam.firstAnswers[idx] = optionIndex;
    const isCorrectNow = isAnswerCorrect(question, optionIndex);
    if (currentExam.mode === 'training') {
        if (settings.feedbackEnabled) playEffectSound(isCorrectNow ? 'right' : 'wrong');
        if (isCorrectNow) { currentExam.showAnswer = true; if (settings.animations !== false) showMiniCelebration(); showToast(themeSuccessMessage(), 'success'); }
        else { if (wrongQuestions.indexOf(question.id) === -1) { wrongQuestions.push(question.id); saveWrongQuestions(); } showToast(themeWrongMessage(), 'error'); }
        saveExamState(); renderExam();
    } else { saveExamState(); renderExam(); }
}
function themeSuccessMessage() { switch (settings.theme) { case 'desert': return 'إجابة أصابت الهدف في قلب الصحراء!'; case 'space': return 'Target locked. Correct answer!'; case 'pirates': return 'Direct hit, captain!'; case 'castle': return 'A noble strike!'; case 'lab': return 'Hypothesis confirmed!'; default: return 'إجابة صحيحة!'; } }
function themeWrongMessage() { switch (settings.theme) { case 'desert': return 'الجواب انحرف عن مسار القافلة.'; case 'space': return 'Trajectory mismatch. Try again.'; case 'pirates': return 'Wrong turn on the treasure map.'; case 'castle': return 'The dragon dodged that answer.'; case 'lab': return 'Experiment unstable. Re-check the sample.'; default: return 'إجابة خاطئة.'; } }
function showAnswer() { if (!currentExam) return; currentExam.showAnswer = true; const idx = currentExam.currentIndex; const question = currentExam.questions[idx]; const answer = currentExam.firstAnswers[idx]; if (answer !== null && !isAnswerCorrect(question, answer) && wrongQuestions.indexOf(question.id) === -1) { wrongQuestions.push(question.id); saveWrongQuestions(); } saveExamState(); renderExam(); }
function nextQuestion() { if (!currentExam) return; if (currentExam.currentIndex < currentExam.questions.length - 1) { currentExam.currentIndex += 1; currentExam.showAnswer = false; saveExamState(); renderExam(); window.scrollTo({ top: 0, behavior: settings.animations === false ? 'auto' : 'smooth' }); } }
function prevQuestion() { if (!currentExam || currentExam.direction !== 'twoway') return; if (currentExam.currentIndex > 0) { currentExam.currentIndex -= 1; if (currentExam.mode === 'training') currentExam.showAnswer = currentExam.answers[currentExam.currentIndex] !== null; saveExamState(); renderExam(); } }
function navigateToQuestion(index) { if (!currentExam) return; if (currentExam.direction === 'oneway' && index !== currentExam.currentIndex) return; currentExam.currentIndex = index; if (currentExam.mode === 'training') currentExam.showAnswer = currentExam.answers[index] !== null; saveExamState(); renderExam(); }
function toggleGrid() { const grid = getEl('question-grid'); const btn = getEl('btn-grid-toggle'); grid.classList.toggle('hidden'); btn.innerHTML = grid.classList.contains('hidden') ? '<span>☰</span> إظهار الشبكة' : '<span>☰</span> إخفاء الشبكة'; }
function exitExam() { if (currentExam && !currentExam.submitted) { if (confirm('هل تريد الخروج؟ سيتم حفظ التقدم الحالي.')) { saveExamState(); currentExam = null; clearInterval(timerInterval); timerInterval = null; goHome(); } } else { currentExam = null; goHome(); } }

function startTimer() {
    clearInterval(timerInterval); const timerEl = getEl('exam-timer'); timerEl.classList.remove('hidden');
    timerInterval = setInterval(function () {
        if (!currentExam || currentExam.submitted) { clearInterval(timerInterval); timerInterval = null; return; }
        const elapsed = Date.now() - currentExam.startTime; const remaining = currentExam.totalTime - elapsed;
        if (remaining <= 0) { clearInterval(timerInterval); timerInterval = null; timeUp(); return; }
        const mins = Math.floor(remaining / 60000); const secs = Math.floor((remaining % 60000) / 1000);
        timerEl.textContent = mins + ':' + String(secs).padStart(2, '0'); timerEl.classList.toggle('timer-danger', remaining <= 60000);
    }, 1000);
}
function timeUp() { if (!currentExam) return; const unanswered = currentExam.answers.filter(function (answer) { return answer === null; }).length; showToast('انتهى الوقت! يوجد ' + unanswered + ' سؤالًا بدون إجابة.', 'error'); finishExam(); }

function finishExam() {
    if (!currentExam) return; currentExam.submitted = true; currentExam.endTime = Date.now();
    if (currentExam.mode === 'exam') {
        currentExam.questions.forEach(function (question, idx) { const ans = currentExam.answers[idx]; if (ans !== null && !isAnswerCorrect(question, ans) && wrongQuestions.indexOf(question.id) === -1) wrongQuestions.push(question.id); });
        saveWrongQuestions();
    }
    clearInterval(timerInterval); timerInterval = null; saveProgress(); clearExamState();
    if (currentExam.mode === 'exam') { showScreen('results-screen'); showWaitingMessages(); } else showResults();
}
function showWaitingMessages() {
    const waitDiv = getEl('results-waiting'); const contentDiv = getEl('results-content'); const reviewDiv = getEl('results-review'); const messageEl = getEl('waiting-message'); const messages = ['جاري تحليل الإجابات...', 'يتم احتساب النتيجة...', 'نراجع الأداء العام...', 'لحظات قليلة...', 'يتم تجهيز النتائج...'];
    waitDiv.classList.remove('hidden'); reviewDiv.classList.add('hidden'); reviewDiv.innerHTML = ''; contentDiv.innerHTML = '';
    let idx = 0; const interval = setInterval(function () { idx = (idx + 1) % messages.length; messageEl.textContent = messages[idx]; }, 1500);
    setTimeout(function () { clearInterval(interval); waitDiv.classList.add('hidden'); showResults(); }, 2200);
}
function showResults() {
    if (!currentExam) return; const theme = getTheme(); showScreen('results-screen'); getEl('results-title').textContent = theme.icons.results + ' ' + theme.texts.resultsTitle;
    const questions = currentExam.questions; const answersToCheck = currentExam.mode === 'exam' ? currentExam.answers : currentExam.firstAnswers; const total = questions.length; const answeredCount = answersToCheck.filter(function (answer) { return answer !== null; }).length;
    const correct = answersToCheck.reduce(function (sum, answer, idx) { return sum + (answer !== null && isAnswerCorrect(questions[idx], answer) ? 1 : 0); }, 0); const unanswered = total - answeredCount; const incorrect = answeredCount - correct; const score = total > 0 ? Math.round((correct / total) * 100) : 0; const timeSpent = currentExam.endTime ? Math.round((currentExam.endTime - currentExam.startTime) / 1000) : 0; const mins = Math.floor(timeSpent / 60); const secs = timeSpent % 60;
    if (score > 50) { playCelebrateSound(); if (settings.animations !== false) showFireworks(); showToast(themeCelebrateMessage(score), 'success'); }
    getEl('results-content').innerHTML = `
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
function themeCelebrateMessage(score) { switch (settings.theme) { case 'desert': return 'سارت القافلة بنجاح! النتيجة ' + score + '%'; case 'space': return 'Mission accomplished! Score ' + score + '%'; case 'pirates': return 'Treasure secured! Score ' + score + '%'; case 'castle': return 'Victory for the kingdom! Score ' + score + '%'; case 'lab': return 'Research breakthrough! Score ' + score + '%'; default: return 'أحسنت! نتيجتك ' + score + '%'; } }
function reviewExam() {
    if (!currentExam) return; const reviewDiv = getEl('results-review'); reviewDiv.classList.remove('hidden'); let html = '<h3 class="mt-20" style="text-align:right">' + getTheme().icons.review + ' Review</h3>';
    currentExam.questions.forEach(function (question, idx) {
        const userAnswer = currentExam.answers[idx]; const correctIdx = getCorrectIndex(question); const isCorrectNow = userAnswer === correctIdx;
        html += `
            <div class="question-container mt-10" style="border-inline-start:4px solid ${isCorrectNow ? 'var(--success)' : 'var(--danger)'};">
                <div class="question-header"><span class="question-number">Q${escapeHtml(question.number || String(idx + 1))}</span><span style="color:${isCorrectNow ? 'var(--success)' : 'var(--danger)'}; font-weight:900;">${isCorrectNow ? getTheme().icons.success + ' Correct' : getTheme().icons.error + ' Wrong'}</span></div>
                <p class="question-text">${escapeHtml(question.text)}</p>
                <div class="options-list">${question.options.map(function (opt, optionIdx) { let cls = 'option-btn'; if (optionIdx === correctIdx) cls += ' correct'; if (optionIdx === userAnswer && optionIdx !== correctIdx) cls += ' wrong'; return '<div class="' + cls + '" style="cursor:default;">' + escapeHtml(opt) + '</div>'; }).join('')}</div>
                <div class="explanation-box visible"><strong>Explanation:</strong> ${escapeHtml(question.explanation || 'No explanation available.')}</div>
            </div>
        `;
    });
    reviewDiv.innerHTML = html;
}

function populateSearchFilter() {
    const filter = getEl('search-filter'); if (!filter) return; filter.innerHTML = '<option value="all">All Subjects</option>';
    subjects.forEach(function (subject) { filter.innerHTML += '<option value="' + escapeAttribute(subject.id) + '">' + escapeHtml(subject.name) + '</option>'; });
}
function performSearch() {
    const query = String(getEl('search-input').value || '').toLowerCase().trim(); const filter = getEl('search-filter').value; const resultsDiv = getEl('search-results');
    if (query.length < 2) { resultsDiv.innerHTML = '<p style="color:var(--text-muted); text-align:center; padding:20px;">اكتب حرفين على الأقل للبحث...</p>'; return; }
    const theme = getTheme();
    const results = allQuestions.filter(function (question) {
        const text = [question.text, (question.options || []).join(' '), question.explanation || '', question.batchName || '', question.lectureName || '', question.subjectName || ''].join(' ').toLowerCase();
        const matchesFilter = filter === 'all' || slugify(question.subjectName) === filter; return text.indexOf(query) > -1 && matchesFilter;
    });
    if (!results.length) { resultsDiv.innerHTML = '<p style="color:var(--text-muted); text-align:center; padding:20px;">لا توجد نتائج مطابقة.</p>'; return; }
    resultsDiv.innerHTML = results.slice(0, 60).map(function (question) {
        return `
            <div class="search-result-item" onclick="openReadonly('${question.id}')">
                <p><strong>Q${escapeHtml(question.number || '?')}:</strong> ${escapeHtml(shortenText(question.text, 140))}</p>
                <div class="search-result-meta">${theme.icons.subject} ${escapeHtml(question.subjectName || '')} · ${question.sourceType === 'ai' ? theme.icons.ai : theme.icons.lectures} ${escapeHtml(question.lectureName || '')} ${question.batchName ? '· ' + theme.icons.years + ' ' + escapeHtml(question.batchName) : ''} ${question.pageNumber ? '· ' + theme.icons.location + ' ' + escapeHtml(question.pageNumber) : ''}</div>
            </div>
        `;
    }).join('');
}
function openReadonly(questionId) {
    const question = allQuestions.find(function (item) { return item.id === questionId; }); if (!question) return; const theme = getTheme(); const correctIdx = getCorrectIndex(question); showScreen('readonly-screen');
    getEl('readonly-content').innerHTML = `
        <div class="question-header">
            <span class="question-number">Question ${escapeHtml(question.number || '?')}</span>
            <div class="question-actions"><button class="icon-btn ${favorites.indexOf(question.id) > -1 ? 'active' : ''}" onclick="toggleFavorite('${question.id}'); openReadonly('${question.id}')">💚</button><button class="icon-btn" onclick="showLocation('${escapeJsString(question.subjectName)}','${escapeJsString(question.lectureName)}','${escapeJsString(question.batchName || '')}','${escapeJsString(question.pageNumber || '')}')">${theme.icons.location}</button></div>
        </div>
        <p class="question-text">${escapeHtml(question.text)}</p>
        <div class="options-list">${question.options.map(function (opt, idx) { return '<div class="option-btn ' + (idx === correctIdx ? 'correct' : '') + '" style="cursor:default;">' + escapeHtml(opt) + '</div>'; }).join('')}</div>
        <div class="explanation-box visible"><strong>Explanation:</strong> ${escapeHtml(question.explanation || 'No explanation available.')}</div>
        <div class="inline-meta"><span>${theme.icons.subject} ${escapeHtml(question.subjectName || '')}</span><span>${question.sourceType === 'ai' ? theme.icons.ai : theme.icons.lectures} ${escapeHtml(question.lectureName || '')}</span>${question.batchName ? '<span>' + theme.icons.years + ' ' + escapeHtml(question.batchName) + '</span>' : ''}${question.pageNumber ? '<span>' + theme.icons.location + ' ' + escapeHtml(question.pageNumber) + '</span>' : ''}</div>
    `;
}
function closeReadonly() { if (getEl('search-input') && getEl('search-input').value) showScreen('search-screen'); else goHome(); }
function showLocation(subjectName, lectureName, batchName, pageNumber) { const parts = []; if (subjectName) parts.push('المادة: ' + subjectName); if (lectureName) parts.push('الملف: ' + lectureName); if (batchName) parts.push('الدفعة: ' + batchName); if (pageNumber) parts.push('الصفحة: ' + pageNumber); showToast(parts.join(' | ') || 'لا توجد بيانات موقع متاحة.', 'info'); }

function openWrongQuestions() {
    const questions = allQuestions.filter(function (question) { return wrongQuestions.indexOf(question.id) > -1; });
    if (!questions.length) { showToast('لا توجد أسئلة خاطئة حتى الآن.', 'info'); return; }
    showScreen('selection-screen'); getEl('selection-title').textContent = 'Wrong Questions'; getEl('selection-search-container').classList.add('hidden'); getEl('selection-footer').classList.add('hidden');
    getEl('selection-list').innerHTML = `
        <div class="empty-state">
            <p style="font-size:1.05rem; font-weight:900; margin-bottom:16px;">${questions.length} سؤالًا خاطئًا متاحًا للتدريب</p>
            <div class="mode-buttons" style="max-width:420px; margin:0 auto;">
                <button class="btn-mode" onclick="startSpecialExam(getWrongQuestionObjects(), 'training', 'twoway')"><span class="mode-icon">🎓</span><span class="mode-label">Training</span></button>
                <button class="btn-mode" onclick="startSpecialExam(getWrongQuestionObjects(), 'exam', 'oneway')"><span class="mode-icon">📝</span><span class="mode-label">Exam</span></button>
            </div>
            <button class="btn-danger mt-20" onclick="clearWrongQuestions()">مسح الأسئلة الخاطئة</button>
        </div>
    `;
    currentSelectionMeta = { backContext: 'home' };
}
function getWrongQuestionObjects() { return allQuestions.filter(function (question) { return wrongQuestions.indexOf(question.id) > -1; }); }
function clearWrongQuestions() { if (confirm('هل تريد مسح جميع الأسئلة الخاطئة؟')) { wrongQuestions = []; saveWrongQuestions(); goHome(); showToast('تم مسح قائمة الأسئلة الخاطئة.', 'success'); } }
function toggleFavorite(questionId) { const idx = favorites.indexOf(questionId); if (idx > -1) favorites.splice(idx, 1); else favorites.push(questionId); saveFavorites(); if (currentExam && !currentExam.submitted) renderExam(); }
function openFavoriteQuestions() {
    const questions = allQuestions.filter(function (question) { return favorites.indexOf(question.id) > -1; });
    if (!questions.length) { showToast('لا توجد أسئلة مفضلة حتى الآن.', 'info'); return; }
    showScreen('selection-screen'); getEl('selection-title').textContent = 'Favorite Questions'; getEl('selection-search-container').classList.add('hidden'); getEl('selection-footer').classList.add('hidden');
    getEl('selection-list').innerHTML = `
        <div class="empty-state">
            <p style="font-size:1.05rem; font-weight:900; margin-bottom:16px;">${questions.length} سؤالًا مفضلًا</p>
            <div class="mode-buttons" style="max-width:420px; margin:0 auto;">
                <button class="btn-mode" onclick="startSpecialExam(getFavoriteQuestionObjects(), 'training', 'twoway')"><span class="mode-icon">🎓</span><span class="mode-label">Training</span></button>
                <button class="btn-mode" onclick="startSpecialExam(getFavoriteQuestionObjects(), 'exam', 'oneway')"><span class="mode-icon">📝</span><span class="mode-label">Exam</span></button>
            </div>
            <button class="btn-danger mt-20" onclick="clearFavorites()">مسح المفضلة</button>
        </div>
    `;
    currentSelectionMeta = { backContext: 'home' };
}
function getFavoriteQuestionObjects() { return allQuestions.filter(function (question) { return favorites.indexOf(question.id) > -1; }); }
function clearFavorites() { if (confirm('هل تريد مسح جميع المفضلة؟')) { favorites = []; saveFavorites(); goHome(); showToast('تم مسح قائمة المفضلة.', 'success'); } }

function toggleStatistics() { const panel = getEl('statistics-panel'); panel.classList.toggle('visible'); if (panel.classList.contains('visible')) renderStatistics(); }
function updateStatisticsIfOpen() { const panel = getEl('statistics-panel'); if (panel && panel.classList.contains('visible')) renderStatistics(); }
function renderStatistics() {
    const theme = getTheme(); const content = getEl('stats-content'); const answeredQuestions = new Set();
    Object.keys(progress).forEach(function (key) { const entry = progress[key] || { questionIds: [] }; (entry.questionIds || []).forEach(function (id) { answeredQuestions.add(id); }); });
    const totalQuestions = allQuestions.length; const totalLectures = subjects.reduce(function (sum, subject) { return sum + subject.lectures.length; }, 0); const totalAi = subjects.reduce(function (sum, subject) { return sum + subject.ai.length; }, 0); const totalYears = subjects.reduce(function (sum, subject) { return sum + subject.years.length; }, 0);
    const summaryHtml = `
        <div class="stats-summary-grid">
            <div class="progress-card"><h4>${theme.icons.progress} الإجمالي</h4><p><span>كل الأسئلة</span><strong>${totalQuestions}</strong></p><p><span>تمت الإجابة</span><strong>${answeredQuestions.size}</strong></p></div>
            <div class="progress-card"><h4>${theme.icons.favorites} المفضلة</h4><p><span>عدد الأسئلة</span><strong>${favorites.length}</strong></p><p><span>الخاطئة</span><strong>${wrongQuestions.length}</strong></p></div>
            <div class="progress-card"><h4>${theme.icons.statistics} الأقسام</h4><p><span>Lectures</span><strong>${totalLectures}</strong></p><p><span>AI</span><strong>${totalAi}</strong></p><p><span>Years</span><strong>${totalYears}</strong></p></div>
        </div>
    `;
    const subjectCards = subjects.map(function (subject) {
        const entry = progress['subject:' + subject.name] || { questionIds: [] }; const answered = new Set(entry.questionIds || []).size; const pct = subject.totalQuestions ? Math.round((answered / subject.totalQuestions) * 100) : 0;
        return `
            <div class="progress-card">
                <h4>${theme.icons.subject} ${escapeHtml(subject.name)}</h4>
                <div class="stats-row"><span>الإجابات المسجلة</span><strong>${answered}/${subject.totalQuestions}</strong></div>
                <div class="progress-bar"><span style="width:${pct}%"></span></div>
                <div class="stats-row mt-10"><span>النسبة</span><strong>${pct}%</strong></div>
                ${subject.lectures.length ? '<div class="mt-10"><strong>' + theme.icons.lectures + ' Lectures</strong></div>' + subject.lectures.map(function (group) { return groupProgressLine('lecture:' + subject.name + '/' + group.name, group.name, group.questions.length); }).join('') : ''}
                ${subject.ai.length ? '<div class="mt-10"><strong>' + theme.icons.ai + ' AI</strong></div>' + subject.ai.map(function (group) { return groupProgressLine('ai:' + subject.name + '/' + group.name, group.name, group.questions.length); }).join('') : ''}
                ${subject.years.length ? '<div class="mt-10"><strong>' + theme.icons.years + ' Years</strong></div>' + subject.years.map(function (group) { return groupProgressLine('year:' + subject.name + '/' + group.name, group.name, group.questions.length); }).join('') : ''}
            </div>
        `;
    }).join('');
    content.innerHTML = summaryHtml + '<div class="progress-grid">' + (subjectCards || '<div class="empty-state"><p>لا توجد بيانات إحصائية بعد.</p></div>') + '</div>';
}
function groupProgressLine(key, label, total) { const entry = progress[key] || { questionIds: [] }; const answered = new Set(entry.questionIds || []).size; const pct = total ? Math.round((answered / total) * 100) : 0; return '<div class="stats-row"><span>' + escapeHtml(label) + '</span><strong>' + answered + '/' + total + ' (' + pct + '%)</strong></div>'; }
function resetProgress() { if (!confirm('هل تريد إعادة ضبط جميع البيانات؟ لا يمكن التراجع عن هذا الإجراء.')) return; progress = {}; favorites = []; wrongQuestions = []; localStorage.removeItem(STORAGE_KEYS.progress); localStorage.removeItem(STORAGE_KEYS.favorites); localStorage.removeItem(STORAGE_KEYS.wrong); localStorage.removeItem(STORAGE_KEYS.examState); showToast('تمت إعادة ضبط جميع البيانات.', 'success'); updateStatisticsIfOpen(); }

function toggleSettings() { getEl('settings-panel').classList.toggle('visible'); }
function toggleExamSettings(show) { const modal = getEl('exam-settings-modal'); modal.classList.toggle('hidden', !show); if (show) syncSettingsControls(); }
function handleExamSettingsOverlay(event) { if (event.target.id === 'exam-settings-modal') toggleExamSettings(false); }
function toggleDarkMode() { settings.darkMode = !!getEl('dark-mode-toggle').checked; saveSettings(); applySettings(); }
function changeTheme(themeName) { settings.theme = THEMES[themeName] ? themeName : 'default'; saveSettings(); applySettings(); renderSubjects(); if (currentSubject && getEl('subject-sections-screen').classList.contains('active')) openSubject(currentSubject.id); if (currentExam && getEl('exam-screen').classList.contains('active')) renderExam(); if (getEl('results-screen').classList.contains('active') && getEl('results-content').innerHTML.trim()) showResults(); updateStatisticsIfOpen(); }
function changeSound(soundName) { settings.bgSound = BACKGROUND_SOUNDS[soundName] ? soundName : 'none'; saveSettings(); applySettings(); }
function toggleBackgroundSoundEnabled() { const active = [getEl('bg-sound-enabled-toggle'), getEl('exam-bg-sound-enabled-toggle')].find(function (el) { return el && el === document.activeElement; }); settings.bgSoundEnabled = active ? !!active.checked : !!getEl('bg-sound-enabled-toggle').checked; saveSettings(); applySettings(); }
function changeVolume(value) { settings.volume = clampNumber(parseInt(value, 10), 0, 100, 50); saveSettings(); applySettings(); }
function toggleFeedbackSounds() { const active = [getEl('feedback-toggle'), getEl('exam-feedback-toggle')].find(function (el) { return el && el === document.activeElement; }); settings.feedbackEnabled = active ? !!active.checked : !!getEl('feedback-toggle').checked; saveSettings(); applySettings(); }
function toggleAnimations() { settings.animations = !!getEl('animations-toggle').checked; saveSettings(); applySettings(); }
function applySettings() {
    settings = Object.assign({}, DEFAULT_SETTINGS, settings || {});
    document.documentElement.setAttribute('data-dark', String(!!settings.darkMode)); document.documentElement.setAttribute('data-theme', settings.theme || 'default'); document.documentElement.setAttribute('data-animations', String(settings.animations !== false));
    syncSettingsControls(); applyThemeUI(); applyBackgroundSound(); applyEffectAudioVolumes();
}
function syncSettingsControls() {
    const entries = [ ['dark-mode-toggle', 'checked', !!settings.darkMode], ['theme-selector', 'value', settings.theme || 'default'], ['exam-theme-selector', 'value', settings.theme || 'default'], ['sound-selector', 'value', settings.bgSound || 'none'], ['exam-sound-selector', 'value', settings.bgSound || 'none'], ['bg-sound-enabled-toggle', 'checked', settings.bgSoundEnabled !== false], ['exam-bg-sound-enabled-toggle', 'checked', settings.bgSoundEnabled !== false], ['volume-control', 'value', settings.volume == null ? 50 : settings.volume], ['exam-volume-control', 'value', settings.volume == null ? 50 : settings.volume], ['feedback-toggle', 'checked', settings.feedbackEnabled !== false], ['exam-feedback-toggle', 'checked', settings.feedbackEnabled !== false], ['animations-toggle', 'checked', settings.animations !== false] ];
    entries.forEach(function (entry) { const el = getEl(entry[0]); if (el) el[entry[1]] = entry[2]; });
}
function applyThemeUI() {
    const theme = getTheme();
    setText('nav-icon-exams', theme.icons.exams); setText('nav-icon-wrong', theme.icons.wrong); setText('nav-icon-favorites', theme.icons.favorites); setText('nav-icon-search', theme.icons.search); setText('nav-icon-statistics', theme.icons.statistics); setText('nav-icon-settings', theme.icons.settings); setText('statistics-title', theme.texts.statsTitle); setText('settings-title', theme.texts.settingsTitle); setText('exam-settings-title', theme.texts.examSettingsTitle); setText('btn-exam-settings', theme.texts.examSettingsButton); setText('results-title', theme.icons.results + ' ' + theme.texts.resultsTitle);
    const trainingIcon = document.querySelector('#btn-training-mode .mode-icon'); const examIcon = document.querySelector('#btn-exam-mode .mode-icon'); const trainingLabel = document.querySelector('#btn-training-mode .mode-label'); const examLabel = document.querySelector('#btn-exam-mode .mode-label');
    if (trainingIcon) trainingIcon.textContent = theme.icons.progress; if (examIcon) examIcon.textContent = theme.icons.exams; if (trainingLabel) trainingLabel.textContent = theme.texts.trainingLabel; if (examLabel) examLabel.textContent = theme.texts.examLabel;
    updateStartButtonIcon();
}
function updateStartButtonIcon() { setText('btn-start-exam', getTheme().texts.startExam); }
function setText(id, text) { const el = getEl(id); if (el) el.textContent = text; }

function primeAudioUnlock() {
    function unlock() { if (bodyGestureAudioUnlocked) return; bodyGestureAudioUnlocked = true; applyBackgroundSound(); document.removeEventListener('click', unlock); document.removeEventListener('touchstart', unlock); document.removeEventListener('keydown', unlock); }
    document.addEventListener('click', unlock, { once: true }); document.addEventListener('touchstart', unlock, { once: true }); document.addEventListener('keydown', unlock, { once: true });
}
async function resolveAssetPath(candidates) {
    const list = (candidates || []).filter(Boolean).map(function (item) { return encodeURI(item); });
    for (let i = 0; i < list.length; i += 1) {
        const candidate = list[i]; if (assetPathCache[candidate]) return assetPathCache[candidate];
        try { const response = await fetch(candidate, { method: 'HEAD' }); if (response.ok) { assetPathCache[candidate] = candidate; return candidate; } } catch (err) {}
    }
    return list[0] || '';
}
async function prepareStaticEffectAudio() { getEl('right-audio').src = await resolveAssetPath(['right.mp3', 'audio/right.mp3', 'assets/audio/right.mp3']); getEl('wrong-audio').src = await resolveAssetPath(['wrong.mp3', 'audio/wrong.mp3', 'assets/audio/wrong.mp3']); getEl('celebrate-audio').src = await resolveAssetPath(['celebrate.mp3', 'audio/celebrate.mp3', 'assets/audio/celebrate.mp3']); applyEffectAudioVolumes(); }
function applyEffectAudioVolumes() { const volume = (settings.volume == null ? 50 : settings.volume) / 100; ['right-audio', 'wrong-audio', 'celebrate-audio'].forEach(function (id) { const audio = getEl(id); if (audio) audio.volume = volume; }); }
async function applyBackgroundSound() {
    const audio = getEl('bg-audio'); if (!audio) return; audio.volume = (settings.volume == null ? 50 : settings.volume) / 100; const key = settings.bgSound || 'none'; const sound = BACKGROUND_SOUNDS[key] || BACKGROUND_SOUNDS.none;
    if (!settings.bgSoundEnabled || key === 'none' || !sound.file) { audio.pause(); return; }
    const src = await resolveAssetPath([sound.file, 'audio/' + sound.file, 'assets/audio/' + sound.file]);
    if (audio.dataset.currentSrc !== src) { audio.src = src; audio.dataset.currentSrc = src; audio.load(); }
    if (bodyGestureAudioUnlocked) audio.play().catch(function () {});
}
function playEffectSound(type) { if (!currentExam || currentExam.mode !== 'training' || settings.feedbackEnabled === false) return; const audio = getEl(type === 'right' ? 'right-audio' : 'wrong-audio'); if (!audio || !audio.src) return; try { audio.currentTime = 0; audio.play().catch(function () {}); } catch (err) {} }
function playCelebrateSound() { const audio = getEl('celebrate-audio'); if (!audio || !audio.src) return; try { audio.currentTime = 0; audio.play().catch(function () {}); } catch (err) {} }

function showMiniCelebration() { showFireworks(56, 12); }
function showFireworks(durationFrames, explosionCount) {
    const canvas = getEl('fireworks-canvas'); if (!canvas) return; canvas.classList.remove('hidden'); const ctx = canvas.getContext('2d'); canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    const themeColors = { default: ['#2563eb', '#38bdf8', '#10b981', '#f59e0b'], desert: ['#f4c95d', '#db9b41', '#9a5b24', '#fff0c9'], space: ['#8b5cf6', '#38bdf8', '#f0abfc', '#ffffff'], pirates: ['#d9a740', '#7d4b16', '#fdf0c2', '#7ec8e3'], castle: ['#d4af37', '#7c3f98', '#f5f1dc', '#9ea7d8'], lab: ['#00bcd4', '#7ef9ff', '#15d3a2', '#ffffff'] };
    const colors = themeColors[settings.theme] || themeColors.default; const particles = []; const bursts = [ { x: canvas.width * 0.3, y: canvas.height * 0.35 }, { x: canvas.width * 0.7, y: canvas.height * 0.4 }, { x: canvas.width * 0.5, y: canvas.height * 0.26 } ];
    bursts.forEach(function (burst) { for (let i = 0; i < explosionCount; i += 1) { const angle = (Math.PI * 2 * i) / explosionCount; const speed = 2.5 + Math.random() * 4.8; particles.push({ x: burst.x, y: burst.y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, color: colors[Math.floor(Math.random() * colors.length)], size: Math.random() * 3 + 1.5, life: 1 }); } });
    let frame = 0;
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(function (p) { p.x += p.vx; p.y += p.vy; p.vy += 0.08; p.life -= 0.012; if (p.life > 0) { ctx.globalAlpha = p.life; ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill(); } });
        frame += 1; if (frame < durationFrames) requestAnimationFrame(animate); else { ctx.clearRect(0, 0, canvas.width, canvas.height); canvas.classList.add('hidden'); }
    }
    animate();
}

function saveSettings() { localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings)); }
function loadSettings() { try { settings = Object.assign({}, DEFAULT_SETTINGS, JSON.parse(localStorage.getItem(STORAGE_KEYS.settings)) || {}); } catch (err) { settings = Object.assign({}, DEFAULT_SETTINGS); } }
function addProgressId(key, questionId) { if (!progress[key]) progress[key] = { questionIds: [] }; if (progress[key].questionIds.indexOf(questionId) === -1) progress[key].questionIds.push(questionId); }
function saveProgress() {
    if (!currentExam) return; const answersToUse = currentExam.mode === 'exam' ? currentExam.answers : currentExam.firstAnswers;
    currentExam.questions.forEach(function (question, idx) { if (answersToUse[idx] === null) return; addProgressId('subject:' + question.subjectName, question.id); const actual = question.originalSourceType || question.sourceType; if (actual === 'lecture') addProgressId('lecture:' + question.subjectName + '/' + question.lectureName, question.id); if (actual === 'ai') addProgressId('ai:' + question.subjectName + '/' + question.lectureName, question.id); if (question.batchName) addProgressId('year:' + question.subjectName + '/' + question.batchName, question.id); });
    localStorage.setItem(STORAGE_KEYS.progress, JSON.stringify(progress)); updateStatisticsIfOpen();
}
function loadProgress() { try { progress = JSON.parse(localStorage.getItem(STORAGE_KEYS.progress)) || {}; } catch (err) { progress = {}; } }
function saveFavorites() { localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify(favorites)); updateStatisticsIfOpen(); }
function loadFavorites() { try { favorites = JSON.parse(localStorage.getItem(STORAGE_KEYS.favorites)) || []; } catch (err) { favorites = []; } }
function saveWrongQuestions() { localStorage.setItem(STORAGE_KEYS.wrong, JSON.stringify(wrongQuestions)); updateStatisticsIfOpen(); }
function loadWrongQuestions() { try { wrongQuestions = JSON.parse(localStorage.getItem(STORAGE_KEYS.wrong)) || []; } catch (err) { wrongQuestions = []; } }
function saveExamState() { if (currentExam) localStorage.setItem(STORAGE_KEYS.examState, JSON.stringify(currentExam)); }
function clearExamState() { localStorage.removeItem(STORAGE_KEYS.examState); }
function checkResumeExam() {
    const raw = localStorage.getItem(STORAGE_KEYS.examState); if (!raw) return;
    try { const saved = JSON.parse(raw); if (!saved || saved.submitted || !Array.isArray(saved.questions) || !saved.questions.length) { clearExamState(); return; } if (confirm('يوجد امتحان غير مكتمل. هل تريد المتابعة من حيث توقفت؟')) { currentExam = saved; showScreen('exam-screen'); renderExam(); if (currentExam.mode === 'exam') startTimer(); } else clearExamState(); }
    catch (err) { clearExamState(); }
}

function getCorrectIndex(question) { if (typeof question.correctIndex === 'number' && question.correctIndex >= 0) return question.correctIndex; question.correctIndex = resolveCorrectIndex(question.options || [], question.correctAnswer || ''); return question.correctIndex; }
function isAnswerCorrect(question, answerIndex) { return getCorrectIndex(question) === answerIndex; }
function shuffleArray(arr) { const copy = arr.slice(); for (let i = copy.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); const temp = copy[i]; copy[i] = copy[j]; copy[j] = temp; } return copy; }
function showToast(message, type) { const toast = getEl('toast'); if (!toast) return; clearTimeout(toastTimer); const theme = getTheme(); const prefix = theme.toast[type] || theme.toast.info; toast.textContent = prefix + ' ' + message; toast.classList.remove('hidden'); toast.classList.add('visible'); toastTimer = setTimeout(function () { toast.classList.remove('visible'); toast.classList.add('hidden'); }, 2600); }
function slugify(text) { return String(text || '').toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]+/g, '-').replace(/^-+|-+$/g, '') || 'item'; }
function hashString(input) { let hash = 0; const str = String(input || ''); for (let i = 0; i < str.length; i += 1) { hash = ((hash << 5) - hash) + str.charCodeAt(i); hash |= 0; } return Math.abs(hash).toString(36); }
function normalizeComparisonText(text) { return String(text || '').toLowerCase().replace(/^[a-e][\)\.\-]\s*/i, '').replace(/\s+/g, ' ').trim(); }
function escapeHtml(value) { return String(value == null ? '' : value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
function escapeAttribute(value) { return escapeHtml(value); }
function escapeJsString(value) { return String(value == null ? '' : value).replace(/\\/g, '\\\\').replace(/'/g, "\\'"); }
function shortenText(text, maxLength) { const str = String(text || ''); return str.length > maxLength ? str.slice(0, maxLength).trim() + '...' : str; }
function clampNumber(value, min, max, fallback) { if (Number.isNaN(value)) return fallback; return Math.min(max, Math.max(min, value)); }

window.openExams = openExams; window.openSection = openSection; window.toggleStatistics = toggleStatistics; window.toggleSettings = toggleSettings; window.toggleDarkMode = toggleDarkMode; window.changeTheme = changeTheme; window.changeSound = changeSound; window.toggleBackgroundSoundEnabled = toggleBackgroundSoundEnabled; window.changeVolume = changeVolume; window.toggleFeedbackSounds = toggleFeedbackSounds; window.toggleAnimations = toggleAnimations; window.filterSubjects = filterSubjects; window.handleSubjectOpen = handleSubjectOpen; window.startSubjectLongPress = startSubjectLongPress; window.cancelSubjectLongPress = cancelSubjectLongPress; window.moveSubject = moveSubject; window.togglePinSubject = togglePinSubject; window.openSubject = openSubject; window.openSubjectCategory = openSubjectCategory; window.backFromSelection = backFromSelection; window.filterSelectionList = filterSelectionList; window.toggleGroupSelection = toggleGroupSelection; window.selectMode = selectMode; window.selectDirection = selectDirection; window.addExtraTime = addExtraTime; window.confirmStartExam = confirmStartExam; window.startSpecialExam = startSpecialExam; window.selectOption = selectOption; window.showAnswer = showAnswer; window.nextQuestion = nextQuestion; window.prevQuestion = prevQuestion; window.navigateToQuestion = navigateToQuestion; window.toggleGrid = toggleGrid; window.exitExam = exitExam; window.finishExam = finishExam; window.reviewExam = reviewExam; window.performSearch = performSearch; window.openReadonly = openReadonly; window.closeReadonly = closeReadonly; window.showLocation = showLocation; window.openWrongQuestions = openWrongQuestions; window.getWrongQuestionObjects = getWrongQuestionObjects; window.clearWrongQuestions = clearWrongQuestions; window.toggleFavorite = toggleFavorite; window.openFavoriteQuestions = openFavoriteQuestions; window.getFavoriteQuestionObjects = getFavoriteQuestionObjects; window.clearFavorites = clearFavorites; window.resetProgress = resetProgress; window.goHome = goHome; window.toggleExamSettings = toggleExamSettings; window.handleExamSettingsOverlay = handleExamSettingsOverlay;
