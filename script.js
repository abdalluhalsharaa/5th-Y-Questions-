/* ============================================
   MEDICAL EXAM PRACTICE - MAIN JAVASCRIPT
   Refactored for GitHub folder discovery, dynamic subjects,
   universal parsing, persistent settings, and in-exam settings
   ============================================ */

// ============================================
// GLOBAL STATE
// ============================================
let subjects = [];
let allQuestions = [];
let allGroups = [];
let currentExam = null;
let settings = {};
let favorites = [];
let wrongQuestions = [];
let progress = {};
let discoveredRepo = null;
let currentSubject = null;
let currentSelectionMeta = null;
let currentViewContext = 'home';

// Selection state
let selectedGroups = [];
let currentGroups = [];
let selectedMode = null;
let selectedDirection = null;
let extraTime = 0;
let extraTimeAdded = false;

// Timer
let timerInterval = null;
let toastTimer = null;
let assetPathCache = {};

const STORAGE_KEYS = {
    settings: 'medical-app-settings-v3',
    progress: 'medical-app-progress-v3',
    favorites: 'medical-app-favorites-v3',
    wrong: 'medical-app-wrong-v3',
    examState: 'medical-app-exam-state-v3'
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

const DEFAULT_SETTINGS = {
    darkMode: false,
    theme: 'default',
    bgSound: 'none',
    bgSoundEnabled: true,
    volume: 50,
    feedbackEnabled: true,
    animations: true
};

const IGNORE_ROOT_DIRS = new Set([
    '.git', '.github', 'node_modules', 'assets', 'asset', 'audio', 'audios', 'img', 'images', 'css', 'js', 'docs', 'dist', 'build'
]);

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    loadSettings();
    loadProgress();
    loadFavorites();
    loadWrongQuestions();
    applySettings();
    displayRandomQuote();
    updateStartButtonIcon();
    await prepareStaticEffectAudio();
    await loadData();
    checkResumeExam();
});

function displayRandomQuote() {
    const quotes = [
        'لا توجد وصفة سحرية، ولا توجد طريقة ليس فيها العمل والتعب وبذل الجهد!',
        'الفشل ليس النهاية، بل خطوة ضرورية نحو القمة إذا تعلمت منه.',
        'العلم الذي تدرسه اليوم هو الأمل الذي ستمنحه لغيرك غدًا.',
        'دراسة الطب ماراثون وليست سباقًا قصيرًا؛ واصل التقدم بهدوء.',
        'ابدأ الآن، فالوقت المثالي لا يأتي وحده.'
    ];
    const quoteEl = document.getElementById('random-quote');
    if (!quoteEl) return;
    quoteEl.textContent = quotes[Math.floor(Math.random() * quotes.length)];
}

// ============================================
// DATA LOADING - GITHUB DISCOVERY
// ============================================
async function loadData() {
    try {
        subjects = [];
        allQuestions = [];
        allGroups = [];

        discoveredRepo = await discoverRepository();
        if (!discoveredRepo) {
            throw new Error('GitHub repository metadata could not be detected from this GitHub Pages URL.');
        }

        const rootItems = await listRepoDirectory('');
        const dirItems = rootItems.filter(item => item.type === 'dir' && !IGNORE_ROOT_DIRS.has(item.name.toLowerCase()));
        const subjectResults = await Promise.all(dirItems.map(scanSubjectFolder));

        subjects = subjectResults
            .filter(Boolean)
            .sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }));

        allGroups = subjects.flatMap(subject => [
            ...subject.lectures,
            ...subject.ai,
            ...subject.years
        ]);

        allQuestions = subjects.flatMap(subject => subject.allQuestions);
        populateSearchFilter();
        renderSubjects();
        updateStatisticsIfOpen();
    } catch (error) {
        console.error('Error loading repository content:', error);
        showToast('تعذر تحميل المواد من GitHub. تأكد أن المستودع عام وأن المجلدات موجودة.');
        renderSubjects();
    }
}

async function discoverRepository() {
    const hostname = window.location.hostname;
    if (!hostname.endsWith('github.io')) return null;

    const owner = hostname.split('.')[0];
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    let repo = '';

    if (hostname === `${owner}.github.io`) {
        repo = pathParts.length > 0 ? pathParts[0] : `${owner}.github.io`;
    } else {
        return null;
    }

    const repoMetaRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
    if (!repoMetaRes.ok) {
        throw new Error('Unable to read repository metadata.');
    }
    const repoMeta = await repoMetaRes.json();
    return {
        owner,
        repo,
        branch: repoMeta.default_branch || 'main'
    };
}

async function listRepoDirectory(path) {
    const cleanPath = path ? encodeURIComponent(path).replace(/%2F/g, '/') : '';
    const url = `https://api.github.com/repos/${discoveredRepo.owner}/${discoveredRepo.repo}/contents/${cleanPath}?ref=${encodeURIComponent(discoveredRepo.branch)}`;
    const res = await fetch(url, {
        headers: { 'Accept': 'application/vnd.github+json' }
    });
    if (!res.ok) {
        throw new Error(`Unable to read directory: ${path || 'root'}`);
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
}

async function scanSubjectFolder(dirItem) {
    const subjectName = dirItem.name;
    const subjectPath = dirItem.path;
    const subjectItems = await listRepoDirectory(subjectPath);

    const directTxtFiles = subjectItems
        .filter(item => item.type === 'file' && item.name.toLowerCase().endsWith('.txt'))
        .sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }));

    const aiFolder = subjectItems.find(item => item.type === 'dir' && item.name.toLowerCase() === 'ai');
    let aiTxtFiles = [];
    if (aiFolder) {
        const aiItems = await listRepoDirectory(aiFolder.path);
        aiTxtFiles = aiItems
            .filter(item => item.type === 'file' && item.name.toLowerCase().endsWith('.txt'))
            .sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }));
    }

    if (directTxtFiles.length === 0 && aiTxtFiles.length === 0) {
        return null;
    }

    const lectures = [];
    const aiLectures = [];
    let runningQuestionCounter = 1;

    for (const file of directTxtFiles) {
        const lecture = await buildLectureGroupFromFile(file, subjectName, 'lecture', runningQuestionCounter);
        if (lecture) {
            runningQuestionCounter += lecture.questions.length;
            lectures.push(lecture);
        }
    }

    for (const file of aiTxtFiles) {
        const lecture = await buildLectureGroupFromFile(file, subjectName, 'ai', runningQuestionCounter);
        if (lecture) {
            runningQuestionCounter += lecture.questions.length;
            aiLectures.push(lecture);
        }
    }

    const combinedQuestionPool = [...lectures.flatMap(g => g.questions), ...aiLectures.flatMap(g => g.questions)];
    const years = buildYearGroups(subjectName, combinedQuestionPool);

    const totalQuestions = combinedQuestionPool.length;
    const totalLectures = lectures.length + aiLectures.length;

    return {
        id: slugify(subjectName),
        name: subjectName,
        path: subjectPath,
        lectures,
        ai: aiLectures,
        years,
        allQuestions: combinedQuestionPool,
        totalQuestions,
        totalLectures,
        lectureCount: lectures.length,
        aiCount: aiLectures.length,
        yearCount: years.length
    };
}

async function buildLectureGroupFromFile(fileItem, subjectName, sourceType, startCounter) {
    try {
        const text = await fetchQuestionFile(fileItem);
        const lectureName = fileItem.name.replace(/\.txt$/i, '');
        const questions = parseQuestionFile(text, {
            subjectName,
            lectureName,
            sourceType,
            sourcePath: fileItem.path,
            startCounter
        });

        if (!questions.length) return null;

        questions.forEach((q, idx) => {
            if (!q.number) q.number = String(startCounter + idx);
        });

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
        map.get(batch).push({ ...question, groupType: 'year', originalSourceType: question.sourceType, sourceType: 'year' });
    });

    return Array.from(map.entries())
        .sort((a, b) => a[0].localeCompare(b[0], 'en', { sensitivity: 'base' }))
        .map(([batchName, questions]) => ({
            id: `${slugify(subjectName)}__year__${slugify(batchName)}`,
            name: batchName,
            type: 'year',
            subjectName,
            questions
        }));
}

// ============================================
// UNIVERSAL QUESTION PARSER
// ============================================
function parseQuestionFile(rawText, meta) {
    const normalized = normalizeText(rawText);
    const blocks = smartSplitQuestionBlocks(normalized);
    const questions = [];
    let fallbackCounter = meta.startCounter || 1;

    blocks.forEach((block, blockIndex) => {
        const question = parseQuestionBlock(block, meta, fallbackCounter, blockIndex);
        if (question) {
            if (!question.number) question.number = String(fallbackCounter);
            fallbackCounter += 1;
            questions.push(question);
        }
    });

    return questions;
}

function normalizeText(text) {
    return (text || '')
        .replace(/^\uFEFF/, '')
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .replace(/\t/g, '    ')
        .replace(/\n\s*\/\/\/\/\/\s*(?=\n|$)/g, '\n')
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

        if (idx === paragraphs.length - 1 && current.length) {
            blocks.push(current.join('\n\n').trim());
        }
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
        const originalLines = block
            .split('\n')
            .map(line => line.trim())
            .filter(line => line !== '');

        if (!originalLines.length) return null;
        if (!originalLines.some(line => /^Correct\s*Answer\s*:/i.test(line))) return null;

        const lines = [...originalLines];

        let questionNumber = '';
        let questionText = '';
        let options = [];
        let correctAnswer = '';
        let explanation = '';
        let batchName = '';
        let pageNumber = '';

        let i = 0;
        const firstLine = lines[0] || '';
        const qNumInline = firstLine.match(/^Question\s*(\d+)\s*[:\-.]?\s*(.*)$/i);
        if (qNumInline) {
            questionNumber = qNumInline[1] || '';
            if (qNumInline[2]) {
                lines[0] = qNumInline[2].trim();
            } else {
                i = 1;
            }
        }

        const correctIndexLine = lines.findIndex(line => /^Correct\s*Answer\s*:/i.test(line));
        if (correctIndexLine === -1) return null;

        const beforeCorrect = lines.slice(i, correctIndexLine);
        const firstOptionIdx = beforeCorrect.findIndex(line => /^[A-E][\)\.\-]\s*/i.test(line));
        if (firstOptionIdx === -1) return null;

        const qTextLines = beforeCorrect.slice(0, firstOptionIdx).filter(Boolean);
        questionText = qTextLines.join(' ').trim();
        options = beforeCorrect.slice(firstOptionIdx).filter(line => /^[A-E][\)\.\-]\s*/i.test(line));
        correctAnswer = lines[correctIndexLine].replace(/^Correct\s*Answer\s*:\s*/i, '').trim();

        let j = correctIndexLine + 1;

        if (j < lines.length && /^Explanation\s*:/i.test(lines[j])) {
            const firstExplanation = lines[j].replace(/^Explanation\s*:\s*/i, '').trim();
            const explanationParts = firstExplanation ? [firstExplanation] : [];
            j += 1;

            while (j < lines.length && !isMetadataLine(lines[j])) {
                if (!/^Question\s*\d+/i.test(lines[j]) && !/^Correct\s*Answer\s*:/i.test(lines[j])) {
                    explanationParts.push(lines[j]);
                }
                j += 1;
            }
            explanation = explanationParts.join(' ').trim();
        }

        while (j < lines.length) {
            const line = lines[j].trim();
            if (!line) {
                j += 1;
                continue;
            }
            if (isPageLine(line)) {
                pageNumber = line;
            } else if (!batchName && isBatchLine(line)) {
                batchName = line;
            } else if (!explanation && !/^Correct\s*Answer\s*:/i.test(line) && !/^Explanation\s*:/i.test(line)) {
                if (!batchName && isBatchLine(line)) {
                    batchName = line;
                } else if (!pageNumber && isPageLine(line)) {
                    pageNumber = line;
                } else if (!batchName && looksLikeMetadataTail(line)) {
                    batchName = line;
                } else if (!explanation && !isPageLine(line)) {
                    explanation = [explanation, line].filter(Boolean).join(' ').trim();
                }
            }
            j += 1;
        }

        if (!questionText) {
            questionText = qTextLines.length ? qTextLines.join(' ').trim() : `Question ${fallbackCounter}`;
        }

        if (!questionNumber) questionNumber = String(fallbackCounter);

        const correctIndex = resolveCorrectIndex(options, correctAnswer);
        const id = buildQuestionId(meta.subjectName, meta.sourceType, meta.lectureName, questionNumber, questionText, blockIndex);

        return {
            id,
            number: questionNumber,
            text: questionText,
            options,
            correctAnswer,
            correctIndex,
            explanation,
            batchName,
            pageNumber,
            batchLabel: batchName,
            subjectName: meta.subjectName,
            lectureName: meta.lectureName,
            groupName: meta.lectureName,
            sourceType: meta.sourceType,
            sourcePath: meta.sourcePath
        };
    } catch (error) {
        console.warn('Question parse error:', error, block);
        return null;
    }
}

function isMetadataLine(line) {
    return isPageLine(line) || isBatchLine(line) || looksLikeMetadataTail(line);
}

function isPageLine(line) {
    return /^P\s*\(?\s*\d+\s*\)?$/i.test(line) || /^Page\s*\d+$/i.test(line);
}

function isBatchLine(line) {
    return /^[A-Za-z][A-Za-z0-9\s&()'\/]+-\s*\d+$/i.test(line) || /^\d+(st|nd|rd|th)\s+Year/i.test(line);
}

function looksLikeMetadataTail(line) {
    return /^[A-Za-z].{0,60}$/.test(line) && /\d/.test(line) && !/[?.!]$/.test(line);
}

function resolveCorrectIndex(options, correctAnswer) {
    if (!Array.isArray(options) || !options.length) return -1;
    const letterMatch = String(correctAnswer || '').match(/^([A-E])/i);
    if (letterMatch) {
        const idx = letterMatch[1].toUpperCase().charCodeAt(0) - 65;
        if (idx >= 0 && idx < options.length) return idx;
    }

    const normalizedAnswer = normalizeComparisonText(String(correctAnswer || ''));
    const byText = options.findIndex(opt => normalizeComparisonText(opt).includes(normalizedAnswer) || normalizedAnswer.includes(normalizeComparisonText(opt)));
    return byText;
}

function buildQuestionId(subjectName, sourceType, lectureName, questionNumber, questionText, blockIndex) {
    return [
        slugify(subjectName),
        slugify(sourceType),
        slugify(lectureName),
        slugify(questionNumber || String(blockIndex + 1)),
        hashString(questionText).slice(0, 10)
    ].join('__');
}

// ============================================
// NAVIGATION
// ============================================
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
    const target = document.getElementById(screenId);
    if (target) target.classList.add('active');
}

function goHome() {
    currentViewContext = 'home';
    toggleExamSettings(false);
    showScreen('home-screen');
    document.getElementById('results-review').classList.add('hidden');
}

function openExams() {
    currentViewContext = 'subjects';
    renderSubjects();
    showScreen('subjects-screen');
}

function openSection(section) {
    switch (section) {
        case 'wrong':
            openWrongQuestions();
            break;
        case 'favorites':
            openFavoriteQuestions();
            break;
        case 'search':
            currentViewContext = 'search';
            showScreen('search-screen');
            if (document.getElementById('search-input')) document.getElementById('search-input').value = '';
            if (document.getElementById('search-results')) document.getElementById('search-results').innerHTML = '';
            break;
        default:
            openExams();
    }
}

function renderSubjects() {
    const container = document.getElementById('subjects-list');
    const empty = document.getElementById('subjects-empty');
    if (!container || !empty) return;

    if (!subjects.length) {
        empty.classList.remove('hidden');
        container.innerHTML = '';
        return;
    }

    empty.classList.add('hidden');
    const searchTerm = (document.getElementById('subjects-search')?.value || '').trim().toLowerCase();
    const visibleSubjects = subjects.filter(subject => subject.name.toLowerCase().includes(searchTerm));

    container.innerHTML = visibleSubjects.map(subject => `
        <button class="subject-card" onclick="openSubject('${subject.id}')">
            <span class="subject-badge">📘 Subject</span>
            <h4>${escapeHtml(subject.name)}</h4>
            <div class="subject-meta">
                <div><span>Lectures</span><strong>${subject.totalLectures}</strong></div>
                <div><span>Questions</span><strong>${subject.totalQuestions}</strong></div>
                <div><span>Years</span><strong>${subject.years.length}</strong></div>
            </div>
        </button>
    `).join('');

    if (!visibleSubjects.length) {
        container.innerHTML = `<div class="empty-state"><div class="empty-icon">🔎</div><p>لا توجد مواد مطابقة للبحث.</p></div>`;
    }
}

function filterSubjects() {
    renderSubjects();
}

function openSubject(subjectId) {
    currentSubject = subjects.find(subject => subject.id === subjectId) || null;
    if (!currentSubject) {
        showToast('المادة غير موجودة.');
        return;
    }

    currentViewContext = 'subject-sections';
    const title = document.getElementById('subject-sections-title');
    const summary = document.getElementById('subject-sections-summary');
    const categories = document.getElementById('subject-categories');

    title.textContent = currentSubject.name;
    summary.innerHTML = `
        <div class="subject-summary-grid">
            <div><span>المحاضرات المباشرة</span><strong>${currentSubject.lectures.length}</strong></div>
            <div><span>ملفات AI</span><strong>${currentSubject.ai.length}</strong></div>
            <div><span>دفعات / Years</span><strong>${currentSubject.years.length}</strong></div>
            <div><span>إجمالي الأسئلة</span><strong>${currentSubject.totalQuestions}</strong></div>
        </div>
    `;

    const cards = [];
    if (currentSubject.lectures.length) {
        cards.push(categoryCardHtml('lectures', '📚', 'Lectures', currentSubject.lectures.length, currentSubject.lectures.reduce((sum, g) => sum + g.questions.length, 0)));
    }
    if (currentSubject.ai.length) {
        cards.push(categoryCardHtml('ai', '🤖', 'AI', currentSubject.ai.length, currentSubject.ai.reduce((sum, g) => sum + g.questions.length, 0)));
    }
    if (currentSubject.years.length) {
        cards.push(categoryCardHtml('years', '📅', 'Years', currentSubject.years.length, currentSubject.years.reduce((sum, g) => sum + g.questions.length, 0)));
    }

    categories.innerHTML = cards.join('') || `<div class="empty-state"><div class="empty-icon">📭</div><p>لا توجد أقسام متاحة داخل هذه المادة.</p></div>`;
    showScreen('subject-sections-screen');
}

function categoryCardHtml(type, badgeIcon, label, count, totalQuestions) {
    return `
        <button class="category-card" onclick="openSubjectCategory('${type}')">
            <span class="category-badge">${badgeIcon} Section</span>
            <h4>${label}</h4>
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
        title = `${currentSubject.name} • Lectures`;
        placeholder = 'ابحث عن اسم المحاضرة...';
    } else if (type === 'ai') {
        groups = currentSubject.ai;
        title = `${currentSubject.name} • AI`;
        placeholder = 'ابحث عن ملف AI...';
    } else if (type === 'years') {
        groups = currentSubject.years;
        title = `${currentSubject.name} • Years`;
        placeholder = 'ابحث عن الدفعة...';
    }

    showSelectionScreen(groups, title, {
        backContext: 'subject',
        searchPlaceholder: placeholder,
        searchable: true,
        sectionType: type
    });
}

function backFromSelection() {
    if (currentSelectionMeta?.backContext === 'subject' && currentSubject) {
        openSubject(currentSubject.id);
    } else {
        goHome();
    }
}

// ============================================
// SELECTION SCREEN
// ============================================
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

    showScreen('selection-screen');
    document.getElementById('selection-title').textContent = title;
    const searchContainer = document.getElementById('selection-search-container');
    const searchInput = document.getElementById('selection-search');

    if (meta.searchable) {
        searchContainer.classList.remove('hidden');
        searchInput.value = '';
        searchInput.placeholder = meta.searchPlaceholder || 'ابحث...';
    } else {
        searchContainer.classList.add('hidden');
    }

    const list = document.getElementById('selection-list');
    list.innerHTML = '';

    groups.forEach((group, idx) => {
        const questionCount = group.questions.length;
        const badge = group.type === 'lecture' ? '📚' : group.type === 'ai' ? '🤖' : '📅';
        const item = document.createElement('div');
        item.className = 'selection-item';
        item.dataset.groupName = `${group.name} ${group.subjectName || ''}`.toLowerCase();
        item.innerHTML = `
            <input type="checkbox" id="group-${idx}" onchange="toggleGroupSelection(${idx})">
            <label for="group-${idx}" style="width:100%; cursor:pointer;">
                <strong>${badge} ${escapeHtml(group.name)}</strong>
                <br><small style="color:var(--text-muted)">${questionCount} questions</small>
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
    document.querySelectorAll('#selection-list .selection-item').forEach(item => {
        const text = item.dataset.groupName || '';
        item.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

function toggleGroupSelection(idx) {
    const existing = selectedGroups.indexOf(idx);
    if (existing > -1) selectedGroups.splice(existing, 1);
    else selectedGroups.push(idx);

    document.querySelectorAll('#selection-list .selection-item').forEach((item, itemIdx) => {
        item.classList.toggle('selected', selectedGroups.includes(itemIdx));
    });

    updateSelectionFooter();
}

function updateSelectionFooter() {
    const footer = document.getElementById('selection-footer');
    const totalQuestions = selectedGroups.reduce((sum, idx) => sum + currentGroups[idx].questions.length, 0);
    const countInput = document.getElementById('question-count-input');

    if (selectedGroups.length > 0) {
        footer.classList.remove('hidden');
        document.getElementById('selected-count').textContent = `${totalQuestions} questions selected`;
        countInput.max = totalQuestions;
        countInput.value = totalQuestions;
        document.getElementById('max-questions-label').textContent = `/ ${totalQuestions}`;
    } else {
        footer.classList.add('hidden');
    }

    selectedMode = null;
    selectedDirection = null;
    document.getElementById('direction-selection').classList.add('hidden');
    document.getElementById('timer-options').classList.add('hidden');
    document.getElementById('start-section').classList.add('hidden');
    document.querySelectorAll('.btn-mode').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.btn-direction').forEach(btn => btn.classList.remove('active'));
}

function selectMode(mode) {
    selectedMode = mode;
    selectedDirection = null;
    extraTime = 0;
    extraTimeAdded = false;

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
        btn.disabled = false;
        btn.textContent = '+ إضافة 5 دقائق';
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
    const count = parseInt(document.getElementById('question-count-input').value, 10) || 0;
    document.getElementById('extra-time-display').textContent = '+5 min';
    document.getElementById('total-time-display').textContent = `${count + 5} min`;
    const btn = document.getElementById('btn-add-extra');
    btn.disabled = true;
    btn.textContent = '✓ تمت إضافة 5 دقائق';
}

function confirmStartExam() {
    if (!selectedMode || !selectedDirection) {
        showToast('يرجى اختيار النمط واتجاه التنقل.');
        return;
    }

    const count = parseInt(document.getElementById('question-count-input').value, 10);
    if (!count || count < 1) {
        showToast('يرجى إدخال عدد صحيح من الأسئلة.');
        return;
    }

    let questions = [];
    selectedGroups.forEach(idx => {
        questions = questions.concat(currentGroups[idx].questions);
    });

    questions = shuffleArray([...questions]).slice(0, count);
    startExamSession(questions, selectedMode, selectedDirection, currentSelectionMeta?.sectionType || 'custom', extraTime);
}

function startExamSession(questions, mode, direction, sourceLabel = '', extraMinutes = 0) {
    if (!questions.length) {
        showToast('لا توجد أسئلة متاحة.');
        return;
    }

    currentExam = {
        mode,
        direction,
        questions: questions.map(q => ({ ...q })),
        currentIndex: 0,
        answers: new Array(questions.length).fill(null),
        firstAnswers: new Array(questions.length).fill(null),
        startTime: Date.now(),
        totalTime: (questions.length + extraMinutes) * 60 * 1000,
        submitted: false,
        showAnswer: false,
        sourceLabel
    };

    saveExamState();
    showScreen('exam-screen');
    renderExam();
    if (mode === 'exam') startTimer();
}

function startSpecialExam(questions, mode, direction) {
    startExamSession(shuffleArray([...questions]), mode, direction || 'twoway', 'special', 5);
}

// ============================================
// EXAM RENDERING
// ============================================
function renderExam() {
    if (!currentExam) return;
    const { mode, direction, questions, currentIndex, answers } = currentExam;
    const question = questions[currentIndex];
    if (!question) return;

    const remaining = questions.length - currentIndex;
    let progressText = `${currentIndex + 1}/${questions.length}`;

    if (mode === 'training') {
        const answered = currentExam.firstAnswers.filter(a => a !== null).length;
        const correct = currentExam.firstAnswers.filter((a, idx) => a !== null && isAnswerCorrect(questions[idx], a)).length;
        const pct = answered > 0 ? Math.round((correct / answered) * 100) : 0;
        progressText += ` · ✓${correct} · ${pct}%`;
    } else {
        progressText += ` · ${remaining} left`;
    }

    document.getElementById('exam-progress').textContent = progressText;
    renderGrid();

    const isFav = favorites.includes(question.id);
    const modeShowsAnswer = mode === 'training' && currentExam.showAnswer;
    const correctIdx = getCorrectIndex(question);

    document.getElementById('question-container').innerHTML = `
        <div class="question-header">
            <span class="question-number">Q${escapeHtml(question.number || String(currentIndex + 1))}</span>
            <div class="question-actions">
                <button class="icon-btn ${isFav ? 'active' : ''}" onclick="toggleFavorite('${question.id}')" title="Favorite">✦</button>
                <button class="icon-btn" onclick="showLocation('${escapeJsString(question.subjectName)}','${escapeJsString(question.lectureName)}','${escapeJsString(question.batchName || '')}','${escapeJsString(question.pageNumber || '')}')" title="Location">📍</button>
            </div>
        </div>
        <p class="question-text">${escapeHtml(question.text)}</p>
        <div class="options-list">
            ${question.options.map((opt, idx) => {
                let cls = 'option-btn';
                if (answers[currentIndex] === idx) cls += ' selected';
                if (modeShowsAnswer) {
                    if (idx === correctIdx) cls += ' correct';
                    else if (answers[currentIndex] === idx && idx !== correctIdx) cls += ' wrong';
                }
                return `<button class="${cls}" onclick="selectOption(${idx})">${escapeHtml(opt)}</button>`;
            }).join('')}
        </div>
        <div class="explanation-box ${modeShowsAnswer ? 'visible' : ''}">
            <strong>Explanation:</strong> ${escapeHtml(question.explanation || 'No explanation available.')}
        </div>
        <div class="inline-meta">
            <span>📘 ${escapeHtml(question.subjectName || '')}</span>
            <span>📄 ${escapeHtml(question.lectureName || '')}</span>
            ${question.batchName ? `<span>🗂️ ${escapeHtml(question.batchName)}</span>` : ''}
            ${question.pageNumber ? `<span>📍 ${escapeHtml(question.pageNumber)}</span>` : ''}
        </div>
    `;

    renderExamNav();
}

function renderGrid() {
    if (!currentExam) return;
    const grid = document.getElementById('question-grid');
    const { questions, currentIndex, answers, mode, direction, firstAnswers } = currentExam;
    grid.innerHTML = '';

    questions.forEach((question, idx) => {
        let cls = 'grid-btn';
        if (idx === currentIndex) cls += ' current';
        else if (answers[idx] !== null) {
            if (mode === 'training' && firstAnswers[idx] !== null) {
                cls += isAnswerCorrect(question, firstAnswers[idx]) ? ' answered' : ' wrong';
            } else {
                cls += ' answered';
            }
        }
        if (direction === 'oneway' && idx < currentIndex) cls += ' disabled';

        const btn = document.createElement('button');
        btn.className = cls;
        btn.textContent = idx + 1;
        btn.onclick = () => navigateToQuestion(idx);
        grid.appendChild(btn);
    });
}

function renderExamNav() {
    if (!currentExam) return;
    const nav = document.getElementById('exam-nav');
    const { mode, direction, currentIndex, questions } = currentExam;

    let left = '<span></span>';
    let right = '<span></span>';

    if (direction === 'twoway' && currentIndex > 0) {
        left = `<button class="btn-secondary" onclick="prevQuestion()">Previous ←</button>`;
    }

    if (mode === 'training') {
        if (currentExam.showAnswer) {
            if (currentIndex < questions.length - 1) {
                right = `<button class="btn-primary" onclick="nextQuestion()">Next →</button>`;
            } else {
                right = `<button class="btn-primary" onclick="finishExam()">Finish</button>`;
            }
        } else if (currentExam.answers[currentIndex] !== null) {
            right = `<button class="btn-small" onclick="showAnswer()">Show Answer</button>`;
        }
    } else if (currentExam.answers[currentIndex] !== null) {
        if (currentIndex < questions.length - 1) {
            right = `<button class="btn-primary" onclick="nextQuestion()">Next →</button>`;
        } else {
            right = `<button class="btn-primary" onclick="finishExam()">Submit Exam</button>`;
        }
    }

    nav.innerHTML = `${left}${right}`;
}

// ============================================
// EXAM INTERACTION
// ============================================
function selectOption(optionIndex) {
    if (!currentExam || currentExam.submitted) return;
    const { mode, currentIndex } = currentExam;
    if (mode === 'training' && currentExam.showAnswer) return;

    currentExam.answers[currentIndex] = optionIndex;
    if (currentExam.firstAnswers[currentIndex] === null) {
        currentExam.firstAnswers[currentIndex] = optionIndex;
    }

    const question = currentExam.questions[currentIndex];
    const isCorrect = isAnswerCorrect(question, optionIndex);

    if (mode === 'training') {
        if (settings.feedbackEnabled) {
            playEffectSound(isCorrect ? 'right' : 'wrong');
        }
        if (isCorrect) {
            currentExam.showAnswer = true;
            if (settings.animations !== false) showMiniCelebration();
        } else if (!wrongQuestions.includes(question.id)) {
            wrongQuestions.push(question.id);
            saveWrongQuestions();
        }
        saveExamState();
        renderExam();
    } else {
        saveExamState();
        renderExam();
    }
}

function showAnswer() {
    if (!currentExam) return;
    currentExam.showAnswer = true;
    const question = currentExam.questions[currentExam.currentIndex];
    const answer = currentExam.firstAnswers[currentExam.currentIndex];
    if (answer !== null && !isAnswerCorrect(question, answer)) {
        if (!wrongQuestions.includes(question.id)) {
            wrongQuestions.push(question.id);
            saveWrongQuestions();
        }
    }
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
        window.scrollTo({ top: 0, behavior: settings.animations === false ? 'auto' : 'smooth' });
    }
}

function prevQuestion() {
    if (!currentExam || currentExam.direction !== 'twoway') return;
    if (currentExam.currentIndex > 0) {
        currentExam.currentIndex -= 1;
        if (currentExam.mode === 'training') {
            currentExam.showAnswer = currentExam.answers[currentExam.currentIndex] !== null;
        }
        saveExamState();
        renderExam();
    }
}

function navigateToQuestion(index) {
    if (!currentExam) return;
    if (currentExam.direction === 'oneway' && index !== currentExam.currentIndex) return;
    currentExam.currentIndex = index;
    if (currentExam.mode === 'training') {
        currentExam.showAnswer = currentExam.answers[index] !== null;
    }
    saveExamState();
    renderExam();
}

function toggleGrid() {
    const grid = document.getElementById('question-grid');
    const btn = document.getElementById('btn-grid-toggle');
    grid.classList.toggle('hidden');
    btn.innerHTML = grid.classList.contains('hidden') ? '<span>☰</span> إظهار الشبكة' : '<span>☰</span> إخفاء الشبكة';
}

function exitExam() {
    if (currentExam && !currentExam.submitted) {
        if (confirm('هل تريد الخروج؟ سيتم حفظ التقدم الحالي.')) {
            saveExamState();
            currentExam = null;
            clearInterval(timerInterval);
            timerInterval = null;
            goHome();
        }
    } else {
        currentExam = null;
        goHome();
    }
}

// ============================================
// TIMER
// ============================================
function startTimer() {
    clearInterval(timerInterval);
    const timerEl = document.getElementById('exam-timer');
    timerEl.classList.remove('hidden');

    timerInterval = setInterval(() => {
        if (!currentExam || currentExam.submitted) {
            clearInterval(timerInterval);
            timerInterval = null;
            return;
        }

        const elapsed = Date.now() - currentExam.startTime;
        const remaining = currentExam.totalTime - elapsed;

        if (remaining <= 0) {
            clearInterval(timerInterval);
            timerInterval = null;
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
    if (!currentExam) return;
    const unanswered = currentExam.answers.filter(answer => answer === null).length;
    showToast(`انتهى الوقت! يوجد ${unanswered} سؤالًا بدون إجابة.`);
    finishExam();
}

// ============================================
// RESULTS
// ============================================
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
    const reviewDiv = document.getElementById('results-review');
    const msgEl = document.getElementById('waiting-message');

    waitDiv.classList.remove('hidden');
    reviewDiv.classList.add('hidden');
    reviewDiv.innerHTML = '';
    contentDiv.innerHTML = '';

    const messages = [
        'جاري تحليل الإجابات...',
        'يتم احتساب النتيجة...',
        'نراجع الأداء العام...',
        'لحظات قليلة...',
        'يتم تجهيز النتائج...'
    ];

    let index = 0;
    const interval = setInterval(() => {
        index = (index + 1) % messages.length;
        msgEl.textContent = messages[index];
    }, 1800);

    setTimeout(() => {
        clearInterval(interval);
        waitDiv.classList.add('hidden');
        showResults();
    }, 2500);
}

function showResults() {
    if (!currentExam) return;
    showScreen('results-screen');
    const contentDiv = document.getElementById('results-content');
    const reviewDiv = document.getElementById('results-review');
    reviewDiv.classList.add('hidden');

    const { questions, answers, firstAnswers, startTime, endTime, mode } = currentExam;
    const total = questions.length;
    const answersToCheck = mode === 'exam' ? answers : firstAnswers;
    const answeredCount = answersToCheck.filter(a => a !== null).length;
    const correct = answersToCheck.reduce((sum, ans, idx) => sum + (ans !== null && isAnswerCorrect(questions[idx], ans) ? 1 : 0), 0);
    const unanswered = total - answeredCount;
    const incorrect = answeredCount - correct;
    const score = total > 0 ? Math.round((correct / total) * 100) : 0;
    const timeSpent = endTime ? Math.round((endTime - startTime) / 1000) : 0;
    const mins = Math.floor(timeSpent / 60);
    const secs = timeSpent % 60;

    if (score > 50) {
        playCelebrateSound();
        if (settings.animations !== false) showFireworks();
    }

    contentDiv.innerHTML = `
        <div class="result-score">${score}%</div>
        <div class="result-details">
            <div class="result-card">
                <div class="value">${correct}/${total}</div>
                <div class="label">Correct</div>
            </div>
            <div class="result-card">
                <div class="value">${mins}m ${secs}s</div>
                <div class="label">Time Spent</div>
            </div>
            <div class="result-card">
                <div class="value">${unanswered}</div>
                <div class="label">Unanswered</div>
            </div>
            <div class="result-card">
                <div class="value">${incorrect}</div>
                <div class="label">Incorrect</div>
            </div>
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

    let html = '<h3 class="mt-20" style="text-align:right">Review</h3>';
    questions.forEach((question, idx) => {
        const userAnswer = answers[idx];
        const correctIdx = getCorrectIndex(question);
        const isCorrect = userAnswer === correctIdx;
        html += `
            <div class="question-container mt-10" style="border-inline-start: 4px solid ${isCorrect ? 'var(--success)' : 'var(--danger)'};">
                <div class="question-header">
                    <span class="question-number">Q${escapeHtml(question.number || String(idx + 1))}</span>
                    <span style="color:${isCorrect ? 'var(--success)' : 'var(--danger)'}; font-weight:800;">${isCorrect ? '✓ Correct' : '✗ Wrong'}</span>
                </div>
                <p class="question-text">${escapeHtml(question.text)}</p>
                <div class="options-list">
                    ${question.options.map((opt, oi) => {
                        let cls = 'option-btn';
                        if (oi === correctIdx) cls += ' correct';
                        if (oi === userAnswer && oi !== correctIdx) cls += ' wrong';
                        return `<div class="${cls}" style="cursor:default;">${escapeHtml(opt)}</div>`;
                    }).join('')}
                </div>
                <div class="explanation-box visible">
                    <strong>Explanation:</strong> ${escapeHtml(question.explanation || 'No explanation available.')}
                </div>
            </div>
        `;
    });

    reviewDiv.innerHTML = html;
}

// ============================================
// SEARCH
// ============================================
function populateSearchFilter() {
    const filter = document.getElementById('search-filter');
    if (!filter) return;
    filter.innerHTML = '<option value="all">All Subjects</option>';
    subjects.forEach(subject => {
        filter.innerHTML += `<option value="${escapeAttribute(subject.id)}">${escapeHtml(subject.name)}</option>`;
    });
}

function performSearch() {
    const query = (document.getElementById('search-input').value || '').toLowerCase().trim();
    const filter = document.getElementById('search-filter').value;
    const resultsDiv = document.getElementById('search-results');

    if (query.length < 2) {
        resultsDiv.innerHTML = '<p style="color:var(--text-muted); text-align:center; padding:20px;">اكتب حرفين على الأقل للبحث...</p>';
        return;
    }

    const results = allQuestions.filter(question => {
        const haystack = [
            question.text,
            ...(question.options || []),
            question.explanation || '',
            question.batchName || '',
            question.lectureName || '',
            question.subjectName || ''
        ].join(' ').toLowerCase();

        const matchesQuery = haystack.includes(query);
        const matchesFilter = filter === 'all' || slugify(question.subjectName) === filter;
        return matchesQuery && matchesFilter;
    });

    if (!results.length) {
        resultsDiv.innerHTML = '<p style="color:var(--text-muted); text-align:center; padding:20px;">لا توجد نتائج مطابقة.</p>';
        return;
    }

    resultsDiv.innerHTML = results.slice(0, 60).map(question => `
        <div class="search-result-item" onclick="openReadonly('${question.id}')">
            <p><strong>Q${escapeHtml(question.number || '?')}:</strong> ${escapeHtml(shortenText(question.text, 140))}</p>
            <div class="search-result-meta">📘 ${escapeHtml(question.subjectName || '')} · 📄 ${escapeHtml(question.lectureName || '')} ${question.batchName ? `· 🗂️ ${escapeHtml(question.batchName)}` : ''} ${question.pageNumber ? `· 📍 ${escapeHtml(question.pageNumber)}` : ''}</div>
        </div>
    `).join('');
}

// ============================================
// READONLY VIEWER / LOCATION
// ============================================
function openReadonly(questionId) {
    const question = allQuestions.find(q => q.id === questionId);
    if (!question) return;

    currentViewContext = 'readonly';
    showScreen('readonly-screen');
    const content = document.getElementById('readonly-content');
    const correctIdx = getCorrectIndex(question);

    content.innerHTML = `
        <div class="question-header">
            <span class="question-number">Question ${escapeHtml(question.number || '?')}</span>
            <div class="question-actions">
                <button class="icon-btn ${favorites.includes(question.id) ? 'active' : ''}" onclick="toggleFavorite('${question.id}'); openReadonly('${question.id}')">✦</button>
                <button class="icon-btn" onclick="showLocation('${escapeJsString(question.subjectName)}','${escapeJsString(question.lectureName)}','${escapeJsString(question.batchName || '')}','${escapeJsString(question.pageNumber || '')}')">📍</button>
            </div>
        </div>
        <p class="question-text">${escapeHtml(question.text)}</p>
        <div class="options-list">
            ${question.options.map((opt, idx) => `
                <div class="option-btn ${idx === correctIdx ? 'correct' : ''}" style="cursor:default;">${escapeHtml(opt)}</div>
            `).join('')}
        </div>
        <div class="explanation-box visible">
            <strong>Explanation:</strong> ${escapeHtml(question.explanation || 'No explanation available.')}
        </div>
        <div class="inline-meta">
            <span>📘 ${escapeHtml(question.subjectName || '')}</span>
            <span>📄 ${escapeHtml(question.lectureName || '')}</span>
            ${question.batchName ? `<span>🗂️ ${escapeHtml(question.batchName)}</span>` : ''}
            ${question.pageNumber ? `<span>📍 ${escapeHtml(question.pageNumber)}</span>` : ''}
        </div>
    `;
}

function closeReadonly() {
    if (document.getElementById('search-input')?.value) {
        showScreen('search-screen');
    } else {
        goHome();
    }
}

function showLocation(subjectName, lectureName, batchName, pageNumber) {
    const parts = [
        subjectName ? `المادة: ${subjectName}` : '',
        lectureName ? `الملف: ${lectureName}` : '',
        batchName ? `الدفعة: ${batchName}` : '',
        pageNumber ? `الصفحة: ${pageNumber}` : ''
    ].filter(Boolean);
    showToast(parts.join(' | ') || 'لا توجد بيانات موقع متاحة.');
}

// ============================================
// WRONG QUESTIONS
// ============================================
function openWrongQuestions() {
    const questions = allQuestions.filter(question => wrongQuestions.includes(question.id));
    if (!questions.length) {
        showToast('لا توجد أسئلة خاطئة حتى الآن.');
        return;
    }

    currentViewContext = 'wrong';
    showScreen('selection-screen');
    document.getElementById('selection-title').textContent = 'Wrong Questions';
    document.getElementById('selection-search-container').classList.add('hidden');
    document.getElementById('selection-footer').classList.add('hidden');
    document.getElementById('selection-list').innerHTML = `
        <div class="empty-state">
            <p style="font-size:1.05rem; font-weight:800; margin-bottom:16px;">${questions.length} سؤالًا خاطئًا متاحًا للتدريب</p>
            <div class="mode-buttons" style="max-width:420px; margin:0 auto;">
                <button class="btn-mode" onclick="startSpecialExam(getWrongQuestionObjects(), 'training', 'twoway')">
                    <span class="mode-icon">🎓</span>
                    <span class="mode-label">Training</span>
                </button>
                <button class="btn-mode" onclick="startSpecialExam(getWrongQuestionObjects(), 'exam', 'oneway')">
                    <span class="mode-icon">📝</span>
                    <span class="mode-label">Exam</span>
                </button>
            </div>
            <button class="btn-danger mt-20" onclick="clearWrongQuestions()">مسح الأسئلة الخاطئة</button>
        </div>
    `;
    currentSelectionMeta = { backContext: 'home' };
}

function getWrongQuestionObjects() {
    return allQuestions.filter(question => wrongQuestions.includes(question.id));
}

function clearWrongQuestions() {
    if (confirm('هل تريد مسح جميع الأسئلة الخاطئة؟')) {
        wrongQuestions = [];
        saveWrongQuestions();
        goHome();
        showToast('تم مسح قائمة الأسئلة الخاطئة.');
    }
}

// ============================================
// FAVORITES
// ============================================
function toggleFavorite(questionId) {
    const idx = favorites.indexOf(questionId);
    if (idx > -1) favorites.splice(idx, 1);
    else favorites.push(questionId);
    saveFavorites();
    if (currentExam && !currentExam.submitted) renderExam();
}

function openFavoriteQuestions() {
    const questions = allQuestions.filter(question => favorites.includes(question.id));
    if (!questions.length) {
        showToast('لا توجد أسئلة مفضلة حتى الآن.');
        return;
    }

    currentViewContext = 'favorites';
    showScreen('selection-screen');
    document.getElementById('selection-title').textContent = 'Favorite Questions';
    document.getElementById('selection-search-container').classList.add('hidden');
    document.getElementById('selection-footer').classList.add('hidden');
    document.getElementById('selection-list').innerHTML = `
        <div class="empty-state">
            <p style="font-size:1.05rem; font-weight:800; margin-bottom:16px;">${questions.length} سؤالًا مفضلًا</p>
            <div class="mode-buttons" style="max-width:420px; margin:0 auto;">
                <button class="btn-mode" onclick="startSpecialExam(getFavoriteQuestionObjects(), 'training', 'twoway')">
                    <span class="mode-icon">🎓</span>
                    <span class="mode-label">Training</span>
                </button>
                <button class="btn-mode" onclick="startSpecialExam(getFavoriteQuestionObjects(), 'exam', 'oneway')">
                    <span class="mode-icon">📝</span>
                    <span class="mode-label">Exam</span>
                </button>
            </div>
            <button class="btn-danger mt-20" onclick="clearFavorites()">مسح المفضلة</button>
        </div>
    `;
    currentSelectionMeta = { backContext: 'home' };
}

function getFavoriteQuestionObjects() {
    return allQuestions.filter(question => favorites.includes(question.id));
}

function clearFavorites() {
    if (confirm('هل تريد مسح جميع الأسئلة المفضلة؟')) {
        favorites = [];
        saveFavorites();
        goHome();
        showToast('تم مسح قائمة المفضلة.');
    }
}

// ============================================
// STATISTICS
// ============================================
function toggleStatistics() {
    const panel = document.getElementById('statistics-panel');
    panel.classList.toggle('visible');
    if (panel.classList.contains('visible')) renderStatistics();
}

function updateStatisticsIfOpen() {
    const panel = document.getElementById('statistics-panel');
    if (panel?.classList.contains('visible')) renderStatistics();
}

function renderStatistics() {
    const content = document.getElementById('stats-content');
    if (!content) return;

    const totalQuestions = allQuestions.length;
    const answeredQuestions = new Set();
    Object.values(progress).forEach(entry => {
        (entry?.questionIds || []).forEach(id => answeredQuestions.add(id));
    });

    const totalLectures = subjects.reduce((sum, subject) => sum + subject.lectures.length, 0);
    const totalAiFiles = subjects.reduce((sum, subject) => sum + subject.ai.length, 0);
    const totalYears = subjects.reduce((sum, subject) => sum + subject.years.length, 0);

    const summaryCards = `
        <div class="stats-summary-grid">
            <div class="progress-card"><h4>الإجمالي</h4><p><span>كل الأسئلة</span><strong>${totalQuestions}</strong></p><p><span>تمت الإجابة</span><strong>${answeredQuestions.size}</strong></p></div>
            <div class="progress-card"><h4>المفضلة</h4><p><span>عدد الأسئلة</span><strong>${favorites.length}</strong></p><p><span>الخاطئة</span><strong>${wrongQuestions.length}</strong></p></div>
            <div class="progress-card"><h4>الأقسام</h4><p><span>Lectures</span><strong>${totalLectures}</strong></p><p><span>AI</span><strong>${totalAiFiles}</strong></p><p><span>Years</span><strong>${totalYears}</strong></p></div>
        </div>
    `;

    const subjectCards = subjects.map(subject => {
        const subjectKey = progress[`subject:${subject.name}`] || { questionIds: [] };
        const answered = new Set(subjectKey.questionIds || []).size;
        const pct = subject.totalQuestions ? Math.round((answered / subject.totalQuestions) * 100) : 0;

        const lectureCompletion = subject.lectures.map(group => groupProgressLine(`lecture:${subject.name}/${group.name}`, group.name, group.questions.length)).join('');
        const aiCompletion = subject.ai.map(group => groupProgressLine(`ai:${subject.name}/${group.name}`, group.name, group.questions.length)).join('');
        const yearCompletion = subject.years.map(group => groupProgressLine(`year:${subject.name}/${group.name}`, group.name, group.questions.length)).join('');

        return `
            <div class="progress-card">
                <h4>${escapeHtml(subject.name)}</h4>
                <div class="stats-row"><span>الإجابات المسجلة</span><strong>${answered}/${subject.totalQuestions}</strong></div>
                <div class="progress-bar"><span style="width:${pct}%"></span></div>
                <div class="stats-row mt-10"><span>النسبة</span><strong>${pct}%</strong></div>
                ${lectureCompletion ? `<div class="mt-10"><strong>Lectures</strong></div>${lectureCompletion}` : ''}
                ${aiCompletion ? `<div class="mt-10"><strong>AI</strong></div>${aiCompletion}` : ''}
                ${yearCompletion ? `<div class="mt-10"><strong>Years</strong></div>${yearCompletion}` : ''}
            </div>
        `;
    }).join('');

    content.innerHTML = summaryCards + `<div class="progress-grid">${subjectCards || '<div class="empty-state"><p>لا توجد بيانات إحصائية بعد.</p></div>'}</div>`;
}

function groupProgressLine(key, label, total) {
    const entry = progress[key] || { questionIds: [] };
    const answered = new Set(entry.questionIds || []).size;
    const pct = total ? Math.round((answered / total) * 100) : 0;
    return `<div class="stats-row"><span>${escapeHtml(label)}</span><strong>${answered}/${total} (${pct}%)</strong></div>`;
}

function resetProgress() {
    if (!confirm('هل تريد إعادة ضبط جميع البيانات؟ لا يمكن التراجع عن هذا الإجراء.')) return;
    progress = {};
    favorites = [];
    wrongQuestions = [];
    localStorage.removeItem(STORAGE_KEYS.progress);
    localStorage.removeItem(STORAGE_KEYS.favorites);
    localStorage.removeItem(STORAGE_KEYS.wrong);
    localStorage.removeItem(STORAGE_KEYS.examState);
    showToast('تمت إعادة ضبط جميع البيانات.');
    renderStatistics();
}

// ============================================
// SETTINGS
// ============================================
function toggleSettings() {
    document.getElementById('settings-panel').classList.toggle('visible');
}

function toggleExamSettings(show) {
    const modal = document.getElementById('exam-settings-modal');
    if (!modal) return;
    modal.classList.toggle('hidden', !show);
    if (show) syncSettingsControls();
}

function handleExamSettingsOverlay(event) {
    if (event.target.id === 'exam-settings-modal') toggleExamSettings(false);
}

function toggleDarkMode() {
    settings.darkMode = !!document.getElementById('dark-mode-toggle').checked;
    saveSettings();
    applySettings();
}

function changeTheme(theme) {
    settings.theme = theme === 'desert' ? 'desert' : 'default';
    saveSettings();
    applySettings();
}

function changeSound(sound) {
    settings.bgSound = BACKGROUND_SOUNDS[sound] ? sound : 'none';
    saveSettings();
    applySettings();
}

function toggleBackgroundSoundEnabled() {
    const value = [
        document.getElementById('bg-sound-enabled-toggle'),
        document.getElementById('exam-bg-sound-enabled-toggle')
    ].find(el => el && el === document.activeElement)?.checked;

    if (typeof value === 'boolean') settings.bgSoundEnabled = value;
    else settings.bgSoundEnabled = !!document.getElementById('bg-sound-enabled-toggle').checked;

    saveSettings();
    applySettings();
}

function changeVolume(value) {
    settings.volume = constrainNumber(parseInt(value, 10), 0, 100, 50);
    saveSettings();
    applySettings();
}

function toggleFeedbackSounds() {
    const active = [
        document.getElementById('feedback-toggle'),
        document.getElementById('exam-feedback-toggle')
    ].find(el => el && el === document.activeElement)?.checked;

    if (typeof active === 'boolean') settings.feedbackEnabled = active;
    else settings.feedbackEnabled = !!document.getElementById('feedback-toggle').checked;

    saveSettings();
    applySettings();
}

function toggleAnimations() {
    settings.animations = !!document.getElementById('animations-toggle').checked;
    saveSettings();
    applySettings();
}

function applySettings() {
    settings = { ...DEFAULT_SETTINGS, ...settings };

    document.documentElement.setAttribute('data-dark', String(!!settings.darkMode));
    document.documentElement.setAttribute('data-theme', settings.theme || 'default');
    document.documentElement.setAttribute('data-animations', String(settings.animations !== false));

    syncSettingsControls();
    updateStartButtonIcon();
    applyBackgroundSound();
    applyEffectAudioVolumes();
}

function syncSettingsControls() {
    const mappings = [
        ['dark-mode-toggle', 'checked', !!settings.darkMode],
        ['theme-selector', 'value', settings.theme || 'default'],
        ['exam-theme-selector', 'value', settings.theme || 'default'],
        ['sound-selector', 'value', settings.bgSound || 'none'],
        ['exam-sound-selector', 'value', settings.bgSound || 'none'],
        ['bg-sound-enabled-toggle', 'checked', settings.bgSoundEnabled !== false],
        ['exam-bg-sound-enabled-toggle', 'checked', settings.bgSoundEnabled !== false],
        ['volume-control', 'value', settings.volume ?? 50],
        ['exam-volume-control', 'value', settings.volume ?? 50],
        ['feedback-toggle', 'checked', settings.feedbackEnabled !== false],
        ['exam-feedback-toggle', 'checked', settings.feedbackEnabled !== false],
        ['animations-toggle', 'checked', settings.animations !== false]
    ];

    mappings.forEach(([id, prop, value]) => {
        const el = document.getElementById(id);
        if (!el) return;
        el[prop] = value;
    });
}

function updateStartButtonIcon() {
    const btn = document.getElementById('btn-start-exam');
    if (!btn) return;
    const icons = { default: '🚀', desert: '🏜️' };
    btn.textContent = `${icons[settings.theme || 'default'] || '🚀'} Start Exam`;
}

// ============================================
// AUDIO
// ============================================
async function resolveAssetPath(candidates = []) {
    const cleanCandidates = candidates.filter(Boolean).map(path => encodeURI(path));
    for (const candidate of cleanCandidates) {
        if (assetPathCache[candidate]) return assetPathCache[candidate];
        try {
            const res = await fetch(candidate, { method: 'HEAD' });
            if (res.ok) {
                assetPathCache[candidate] = candidate;
                return candidate;
            }
        } catch (_) {}
    }
    return cleanCandidates[0] || '';
}

async function prepareStaticEffectAudio() {
    const rightAudio = document.getElementById('right-audio');
    const wrongAudio = document.getElementById('wrong-audio');
    const celebrateAudio = document.getElementById('celebrate-audio');

    rightAudio.src = await resolveAssetPath(['right.mp3', 'audio/right.mp3', 'assets/audio/right.mp3']);
    wrongAudio.src = await resolveAssetPath(['wrong.mp3', 'audio/wrong.mp3', 'assets/audio/wrong.mp3']);
    celebrateAudio.src = await resolveAssetPath(['celebrate.mp3', 'audio/celebrate.mp3', 'assets/audio/celebrate.mp3']);
    applyEffectAudioVolumes();
}

function applyEffectAudioVolumes() {
    const volume = (settings.volume ?? 50) / 100;
    ['right-audio', 'wrong-audio', 'celebrate-audio'].forEach(id => {
        const audio = document.getElementById(id);
        if (audio) audio.volume = volume;
    });
}

async function applyBackgroundSound() {
    const audio = document.getElementById('bg-audio');
    if (!audio) return;

    audio.volume = (settings.volume ?? 50) / 100;
    const soundKey = settings.bgSound || 'none';
    const soundConfig = BACKGROUND_SOUNDS[soundKey] || BACKGROUND_SOUNDS.none;

    if (!settings.bgSoundEnabled || soundKey === 'none' || !soundConfig.file) {
        audio.pause();
        return;
    }

    const nextSrc = await resolveAssetPath([
        soundConfig.file,
        `audio/${soundConfig.file}`,
        `assets/audio/${soundConfig.file}`
    ]);

    if (audio.dataset.currentSrc !== nextSrc) {
        audio.src = nextSrc;
        audio.dataset.currentSrc = nextSrc;
        audio.load();
    }

    audio.play().catch(() => {
        // Autoplay can be blocked until user interaction.
    });
}

function playEffectSound(type) {
    if (currentExam?.mode !== 'training') return;
    if (settings.feedbackEnabled === false) return;
    const audio = document.getElementById(type === 'right' ? 'right-audio' : 'wrong-audio');
    if (!audio || !audio.src) return;
    try {
        audio.currentTime = 0;
        audio.play().catch(() => {});
    } catch (_) {}
}

function playCelebrateSound() {
    const audio = document.getElementById('celebrate-audio');
    if (!audio || !audio.src) return;
    try {
        audio.currentTime = 0;
        audio.play().catch(() => {});
    } catch (_) {}
}

// ============================================
// CELEBRATION
// ============================================
function showMiniCelebration() {
    showFireworks(60, 12);
}

function showFireworks(durationFrames = 120, explosionCount = 24) {
    const canvas = document.getElementById('fireworks-canvas');
    if (!canvas) return;
    canvas.classList.remove('hidden');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const colors = ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43'];
    const bursts = [
        { x: canvas.width * 0.3, y: canvas.height * 0.35 },
        { x: canvas.width * 0.7, y: canvas.height * 0.4 },
        { x: canvas.width * 0.5, y: canvas.height * 0.25 }
    ];

    bursts.forEach(burst => {
        for (let i = 0; i < explosionCount; i += 1) {
            const angle = (Math.PI * 2 * i) / explosionCount;
            const speed = 2.5 + Math.random() * 4.5;
            particles.push({
                x: burst.x,
                y: burst.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: Math.random() * 3 + 1.5,
                life: 1
            });
        }
    });

    let frame = 0;
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.08;
            particle.life -= 0.012;
            if (particle.life > 0) {
                ctx.globalAlpha = particle.life;
                ctx.fillStyle = particle.color;
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fill();
            }
        });
        frame += 1;
        if (frame < durationFrames) {
            requestAnimationFrame(animate);
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            canvas.classList.add('hidden');
        }
    }
    animate();
}

// ============================================
// STORAGE
// ============================================
function saveSettings() {
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
}

function loadSettings() {
    try {
        settings = { ...DEFAULT_SETTINGS, ...(JSON.parse(localStorage.getItem(STORAGE_KEYS.settings)) || {}) };
    } catch (_) {
        settings = { ...DEFAULT_SETTINGS };
    }
}

function saveProgress() {
    if (!currentExam) return;
    const answersToUse = currentExam.mode === 'exam' ? currentExam.answers : currentExam.firstAnswers;
    currentExam.questions.forEach((question, idx) => {
        if (answersToUse[idx] === null) return;
        addProgressId(`subject:${question.subjectName}`, question.id);
        const actualSourceType = question.originalSourceType || question.sourceType;
        if (actualSourceType === 'lecture') addProgressId(`lecture:${question.subjectName}/${question.lectureName}`, question.id);
        if (actualSourceType === 'ai') addProgressId(`ai:${question.subjectName}/${question.lectureName}`, question.id);
        if (question.batchName) addProgressId(`year:${question.subjectName}/${question.batchName}`, question.id);
    });
    localStorage.setItem(STORAGE_KEYS.progress, JSON.stringify(progress));
    updateStatisticsIfOpen();
}

function addProgressId(key, questionId) {
    if (!progress[key]) progress[key] = { questionIds: [] };
    if (!progress[key].questionIds.includes(questionId)) progress[key].questionIds.push(questionId);
}

function loadProgress() {
    try {
        progress = JSON.parse(localStorage.getItem(STORAGE_KEYS.progress)) || {};
    } catch (_) {
        progress = {};
    }
}

function saveFavorites() {
    localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify(favorites));
    updateStatisticsIfOpen();
}

function loadFavorites() {
    try {
        favorites = JSON.parse(localStorage.getItem(STORAGE_KEYS.favorites)) || [];
    } catch (_) {
        favorites = [];
    }
}

function saveWrongQuestions() {
    localStorage.setItem(STORAGE_KEYS.wrong, JSON.stringify(wrongQuestions));
    updateStatisticsIfOpen();
}

function loadWrongQuestions() {
    try {
        wrongQuestions = JSON.parse(localStorage.getItem(STORAGE_KEYS.wrong)) || [];
    } catch (_) {
        wrongQuestions = [];
    }
}

function saveExamState() {
    if (!currentExam) return;
    localStorage.setItem(STORAGE_KEYS.examState, JSON.stringify(currentExam));
}

function clearExamState() {
    localStorage.removeItem(STORAGE_KEYS.examState);
}

function checkResumeExam() {
    const raw = localStorage.getItem(STORAGE_KEYS.examState);
    if (!raw) return;

    try {
        const saved = JSON.parse(raw);
        if (!saved || saved.submitted || !Array.isArray(saved.questions) || !saved.questions.length) {
            clearExamState();
            return;
        }

        if (confirm('يوجد امتحان غير مكتمل. هل تريد المتابعة من حيث توقفت؟')) {
            currentExam = saved;
            showScreen('exam-screen');
            renderExam();
            if (currentExam.mode === 'exam') startTimer();
        } else {
            clearExamState();
        }
    } catch (error) {
        console.warn('Resume exam parse failure:', error);
        clearExamState();
    }
}

// ============================================
// UTILITIES
// ============================================
function getCorrectIndex(question) {
    if (typeof question.correctIndex === 'number' && question.correctIndex >= 0) return question.correctIndex;
    question.correctIndex = resolveCorrectIndex(question.options || [], question.correctAnswer || '');
    return question.correctIndex;
}

function isAnswerCorrect(question, answerIndex) {
    return getCorrectIndex(question) === answerIndex;
}

function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.remove('hidden');
    toast.classList.add('visible');
    toastTimer = setTimeout(() => {
        toast.classList.remove('visible');
        toast.classList.add('hidden');
    }, 2600);
}

function slugify(text) {
    return String(text || '')
        .toLowerCase()
        .replace(/[^a-z0-9\u0600-\u06FF]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'item';
}

function hashString(input) {
    let hash = 0;
    const str = String(input || '');
    for (let i = 0; i < str.length; i += 1) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash).toString(36);
}

function normalizeComparisonText(text) {
    return String(text || '').toLowerCase().replace(/^[a-e][\)\.\-]\s*/i, '').replace(/\s+/g, ' ').trim();
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function escapeAttribute(value) {
    return escapeHtml(value);
}

function escapeJsString(value) {
    return String(value ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function shortenText(text, maxLength) {
    const str = String(text || '');
    return str.length > maxLength ? `${str.slice(0, maxLength).trim()}...` : str;
}

function constrainNumber(value, min, max, fallback) {
    if (Number.isNaN(value)) return fallback;
    return Math.min(max, Math.max(min, value));
}

// expose functions to inline handlers
window.openExams = openExams;
window.openSection = openSection;
window.toggleStatistics = toggleStatistics;
window.toggleSettings = toggleSettings;
window.toggleDarkMode = toggleDarkMode;
window.changeTheme = changeTheme;
window.changeSound = changeSound;
window.toggleBackgroundSoundEnabled = toggleBackgroundSoundEnabled;
window.changeVolume = changeVolume;
window.toggleFeedbackSounds = toggleFeedbackSounds;
window.toggleAnimations = toggleAnimations;
window.filterSubjects = filterSubjects;
window.openSubject = openSubject;
window.openSubjectCategory = openSubjectCategory;
window.backFromSelection = backFromSelection;
window.filterSelectionList = filterSelectionList;
window.toggleGroupSelection = toggleGroupSelection;
window.selectMode = selectMode;
window.selectDirection = selectDirection;
window.addExtraTime = addExtraTime;
window.confirmStartExam = confirmStartExam;
window.startSpecialExam = startSpecialExam;
window.selectOption = selectOption;
window.showAnswer = showAnswer;
window.nextQuestion = nextQuestion;
window.prevQuestion = prevQuestion;
window.navigateToQuestion = navigateToQuestion;
window.toggleGrid = toggleGrid;
window.exitExam = exitExam;
window.reviewExam = reviewExam;
window.performSearch = performSearch;
window.openReadonly = openReadonly;
window.closeReadonly = closeReadonly;
window.showLocation = showLocation;
window.openWrongQuestions = openWrongQuestions;
window.getWrongQuestionObjects = getWrongQuestionObjects;
window.clearWrongQuestions = clearWrongQuestions;
window.toggleFavorite = toggleFavorite;
window.openFavoriteQuestions = openFavoriteQuestions;
window.getFavoriteQuestionObjects = getFavoriteQuestionObjects;
window.clearFavorites = clearFavorites;
window.resetProgress = resetProgress;
window.goHome = goHome;
window.toggleExamSettings = toggleExamSettings;
window.handleExamSettingsOverlay = handleExamSettingsOverlay;

window.finishExam = finishExam;
