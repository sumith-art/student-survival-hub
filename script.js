/* ==========================================================================
   STUDENT SURVIVAL HUB - INTERACTIVE LOGIC
   ========================================================================== */

// 1. Initial State & Mock Data Setup
const DEFAULT_THEME = 'light';

// Helper to generate local dates dynamically for mock exams so they are always in the future
const getFutureDateString = (daysFromNow) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
};

const defaultState = {
    theme: DEFAULT_THEME,
    studySessions: [
        { id: 'session-1', date: new Date(Date.now() - 86400000 * 2).toLocaleDateString(), duration: 25 },
        { id: 'session-2', date: new Date(Date.now() - 86400000).toLocaleDateString(), duration: 25 },
        { id: 'session-3', date: new Date().toLocaleDateString(), duration: 25 }
    ],
    tasks: [
        { id: 'task-1', title: 'Complete calculus problem set 3', priority: 'high', completed: false },
        { id: 'task-2', title: 'Review Chapter 4 Physics notes', priority: 'medium', completed: false },
        { id: 'task-3', title: 'Submit Chemistry lab report draft', priority: 'low', completed: true }
    ],
    exams: [
        { id: 'exam-1', title: 'Applied Physics Midterm', date: getFutureDateString(3) },
        { id: 'exam-2', title: 'Calculus II Finals', date: getFutureDateString(8) }
    ],
    attendance: [
        { id: 'subject-1', name: 'Mathematics II', attended: 13, conducted: 15 },
        { id: 'subject-2', name: 'Applied Physics', conducted: 13, attended: 9 },
        { id: 'subject-3', name: 'Computer Programming', conducted: 16, attended: 16 }
    ],
    notes: [
        {
            id: 'note-1',
            title: 'Big O Notation Cheat Sheet',
            subject: 'Computer Science',
            content: 'Big O describes worst-case execution time/space complexity.\n\n- O(1): Constant Time (e.g. array lookup by index)\n- O(log n): Logarithmic Time (e.g. Binary Search)\n- O(n): Linear Time (e.g. Single loop traversal)\n- O(n log n): Log-linear Time (e.g. Merge Sort, Quick Sort)\n- O(n²): Quadratic Time (e.g. Bubble Sort, nested loops)',
            lastUpdated: Date.now() - 3600000
        },
        {
            id: 'note-2',
            title: 'Coulomb\'s Law Formula',
            subject: 'Physics',
            content: 'Formula: F = k * (|q1 * q2|) / r²\n\nWhere:\n- F is the electrostatic force between charges\n- k is Coulomb\'s constant (8.99 × 10⁹ N m²/C²)\n- q1, q2 are magnitudes of the charges\n- r is the distance between charges',
            lastUpdated: Date.now() - 7200000
        }
    ]
};

// Global App State
let state = {
    theme: DEFAULT_THEME,
    studySessions: [],
    tasks: [],
    exams: [],
    attendance: [],
    notes: []
};

// 2. LocalStorage Persistence Sync
function loadState() {
    try {
        const stored = localStorage.getItem('survival_hub_state');
        if (stored) {
            state = JSON.parse(stored);
        } else {
            state = defaultState;
            saveState();
        }
    } catch (e) {
        console.error('Error loading state from localStorage, falling back to defaults.', e);
        state = defaultState;
    }
}

function saveState() {
    try {
        localStorage.setItem('survival_hub_state', JSON.stringify(state));
    } catch (e) {
        console.error('Error saving state to localStorage', e);
    }
}

// 3. Application Initialization
document.addEventListener('DOMContentLoaded', () => {
    loadState();
    initTheme();
    initTabs();
    initMobileMenu();
    
    // Initial Render of All Views
    renderDashboard();
    renderTasks();
    renderExams();
    renderAttendance();
    renderNotes();
    initTimer();
    
    // Set current date in header
    updateHeaderDate();
    
    // Bind All Event Listeners
    bindFormSubmissions();
    
    // Initialize Lucide Icons after content renders
    lucide.createIcons();
});

// Update current date in header
function updateHeaderDate() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('current-date').textContent = new Date().toLocaleDateString('en-US', options);
}

// 4. Tab / Section Switching (SPA Router)
function initTabs() {
    const navLinks = document.querySelectorAll('.nav-link');
    const tabPanels = document.querySelectorAll('.tab-panel');
    
    function switchTab(tabId) {
        // Update URL hash
        window.location.hash = tabId;

        // Remove active class from links and panels
        navLinks.forEach(link => link.classList.remove('active'));
        tabPanels.forEach(panel => panel.classList.remove('active'));

        // Find targets
        const targetLink = document.querySelector(`.nav-link[data-tab="${tabId}"]`);
        const targetPanel = document.getElementById(tabId);

        if (targetLink && targetPanel) {
            targetLink.classList.add('active');
            targetPanel.classList.add('active');
            
            // Custom panel loads if needed
            if (tabId === 'dashboard') {
                renderDashboard();
            }
        }
    }

    // Nav bar tab switching click handler
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const tabId = link.getAttribute('data-tab');
            switchTab(tabId);
            
            // Close mobile menu if open
            const sidebar = document.getElementById('sidebar');
            if (sidebar.classList.contains('open')) {
                sidebar.classList.remove('open');
            }
        });
    });

    // Dashboard widgets "View All" link redirection
    document.querySelectorAll('[data-go-tab]').forEach(link => {
        link.addEventListener('click', (e) => {
            const tabId = link.getAttribute('data-go-tab');
            switchTab(tabId);
        });
    });

    // Handle initial hash routing
    if (window.location.hash) {
        const hash = window.location.hash.substring(1);
        const validTabs = ['dashboard', 'timer', 'tasks', 'exams', 'attendance', 'notes'];
        if (validTabs.includes(hash)) {
            switchTab(hash);
        }
    }
}

// Mobile navigation drawer toggle
function initMobileMenu() {
    const mobileToggle = document.getElementById('mobile-toggle');
    const sidebar = document.getElementById('sidebar');

    mobileToggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
    });

    // Close when clicking outside of sidebar on mobile
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) {
            if (!sidebar.contains(e.target) && !mobileToggle.contains(e.target) && sidebar.classList.contains('open')) {
                sidebar.classList.remove('open');
            }
        }
    });
}

// 5. Light/Dark Theme Controller
function initTheme() {
    const themeToggleBtn = document.getElementById('theme-toggle');
    const darkIcon = themeToggleBtn.querySelector('.dark-icon');
    const lightIcon = themeToggleBtn.querySelector('.light-icon');
    const themeText = themeToggleBtn.querySelector('.theme-text');

    function applyTheme(theme) {
        if (theme === 'dark') {
            document.body.classList.add('dark-mode');
            darkIcon.style.display = 'none';
            lightIcon.style.display = 'inline-block';
            themeText.textContent = 'Light Mode';
        } else {
            document.body.classList.remove('dark-mode');
            darkIcon.style.display = 'inline-block';
            lightIcon.style.display = 'none';
            themeText.textContent = 'Dark Mode';
        }
    }

    // Apply active state theme
    applyTheme(state.theme);

    themeToggleBtn.addEventListener('click', () => {
        state.theme = state.theme === 'dark' ? 'light' : 'dark';
        saveState();
        applyTheme(state.theme);
        showToast(`Switched to ${state.theme} mode`, 'info');
    });
}

// Toast Alert Manager
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toast-message');
    const toastIcon = document.getElementById('toast-icon');

    // Reset classes
    toast.className = 'toast';
    toast.classList.add(type);
    toastMsg.textContent = message;

    // Set matching icons
    let iconName = 'check-circle';
    if (type === 'error') iconName = 'alert-triangle';
    if (type === 'info') iconName = 'info';
    toastIcon.setAttribute('data-lucide', iconName);
    
    // Redraw icon
    lucide.createIcons();

    // Show toast
    toast.classList.add('show');

    // Hide after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Safe local date parser to avoid timezone shifts
function parseLocalDate(dateString) {
    const parts = dateString.split('-');
    if (parts.length === 3) {
        return new Date(parts[0], parts[1] - 1, parts[2]);
    }
    return new Date(dateString);
}

// Web Audio API beep generator (no sound assets required)
function playBeep() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5 note
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        
        oscillator.start();
        // Fade out beep slightly
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
        oscillator.stop(audioCtx.currentTime + 0.6);
    } catch (e) {
        console.warn('Audio Context blocked or unsupported.', e);
    }
}


// ==========================================================================
// 6. Dashboard Calculations & Rendering
// ==========================================================================
function renderDashboard() {
    // 1. Study time calculation
    const totalMinutes = state.studySessions.reduce((sum, s) => sum + s.duration, 0);
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    document.getElementById('stat-study-time').textContent = `${hrs}h ${mins}m`;

    // 2. Pending tasks calculation
    const pendingTasks = state.tasks.filter(t => !t.completed);
    document.getElementById('stat-pending-tasks').textContent = pendingTasks.length;

    // 3. Attendance Rate
    let overallAttendance = 0;
    if (state.attendance.length > 0) {
        const totalAttended = state.attendance.reduce((sum, s) => sum + Number(s.attended), 0);
        const totalConducted = state.attendance.reduce((sum, s) => sum + Number(s.conducted), 0);
        overallAttendance = totalConducted > 0 ? Math.round((totalAttended / totalConducted) * 100) : 100;
    }
    document.getElementById('stat-attendance').textContent = `${overallAttendance}%`;

    // 4. Days to next exam
    const today = new Date();
    today.setHours(0,0,0,0);
    
    let nextExamDays = 'None';
    let upcomingExamsList = [];

    if (state.exams.length > 0) {
        const examsWithCountdown = state.exams.map(exam => {
            const examDate = parseLocalDate(exam.date);
            examDate.setHours(0,0,0,0);
            const diffTime = examDate.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return { ...exam, daysRemaining: diffDays };
        }).filter(exam => exam.daysRemaining >= 0); // Only future exams

        // Sort by closest date
        examsWithCountdown.sort((a, b) => a.daysRemaining - b.daysRemaining);
        upcomingExamsList = examsWithCountdown;

        if (examsWithCountdown.length > 0) {
            nextExamDays = `${examsWithCountdown[0].daysRemaining}d`;
        }
    }
    document.getElementById('stat-next-exam').textContent = nextExamDays;

    // Render Widget 1: Urgent Pending Tasks (Max 3)
    const urgentTasksContainer = document.getElementById('dash-tasks-list');
    urgentTasksContainer.innerHTML = '';
    
    const activeTasks = pendingTasks.slice(0, 3);
    if (activeTasks.length === 0) {
        urgentTasksContainer.innerHTML = `<li class="no-data">No pending tasks! Enjoy your free time. 🎉</li>`;
    } else {
        activeTasks.forEach(task => {
            const li = document.createElement('li');
            li.className = `dash-item ${task.priority}`;
            li.innerHTML = `
                <div>
                    <span class="dash-item-title">${task.title}</span>
                </div>
                <span class="priority-badge ${task.priority}">${task.priority}</span>
            `;
            urgentTasksContainer.appendChild(li);
        });
    }

    // Render Widget 2: Upcoming Exams (Max 3)
    const upcomingExamsContainer = document.getElementById('dash-exams-list');
    upcomingExamsContainer.innerHTML = '';

    const nearestExams = upcomingExamsList.slice(0, 3);
    if (nearestExams.length === 0) {
        upcomingExamsContainer.innerHTML = `<div class="no-data">No exams scheduled! 📚</div>`;
    } else {
        nearestExams.forEach(exam => {
            const item = document.createElement('div');
            item.className = 'dash-item';
            // Determine border severity
            if (exam.daysRemaining <= 3) {
                item.style.borderLeft = '4px solid var(--danger)';
            } else {
                item.style.borderLeft = '4px solid var(--primary)';
            }
            
            const examDateFormatted = parseLocalDate(exam.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            item.innerHTML = `
                <div>
                    <span class="dash-item-title">${exam.title}</span>
                    <div class="dash-item-subtitle">${examDateFormatted}</div>
                </div>
                <span class="priority-badge ${exam.daysRemaining <= 3 ? 'high' : 'low'}">
                    ${exam.daysRemaining === 0 ? 'Today!' : `${exam.daysRemaining}d left`}
                </span>
            `;
            upcomingExamsContainer.appendChild(item);
        });
    }
}


// ==========================================================================
// 7. Study Sprint Pomodoro Timer logic
// ==========================================================================
let timerInterval = null;
let timeRemaining = 1500; // 25 minutes default
let totalTime = 1500;
let isRunning = false;
let isFocusMode = true; // True = focus session (25m), False = break session (5m)

function initTimer() {
    const timeDisplay = document.getElementById('timer-time');
    const startBtn = document.getElementById('timer-start');
    const pauseBtn = document.getElementById('timer-pause');
    const resetBtn = document.getElementById('timer-reset');
    const focusModeBtn = document.getElementById('btn-focus-mode');
    const breakModeBtn = document.getElementById('btn-break-mode');

    updateTimerUI();
    updateSprintLogs();

    // Mode Selector buttons
    focusModeBtn.addEventListener('click', () => {
        if (!isRunning || confirm('Switch to Focus Mode? Your current session will reset.')) {
            setTimerMode(true);
        }
    });

    breakModeBtn.addEventListener('click', () => {
        if (!isRunning || confirm('Switch to Break Mode? Your current session will reset.')) {
            setTimerMode(false);
        }
    });

    // Control buttons
    startBtn.addEventListener('click', () => {
        startTimer();
    });

    pauseBtn.addEventListener('click', () => {
        pauseTimer();
    });

    resetBtn.addEventListener('click', () => {
        resetTimer();
    });
}

function setTimerMode(focus) {
    pauseTimer();
    isFocusMode = focus;
    
    const focusModeBtn = document.getElementById('btn-focus-mode');
    const breakModeBtn = document.getElementById('btn-break-mode');
    const statusText = document.getElementById('timer-status-text');

    if (isFocusMode) {
        focusModeBtn.classList.add('active');
        breakModeBtn.classList.remove('active');
        statusText.textContent = 'Focus Session';
        timeRemaining = 1500; // 25m
        totalTime = 1500;
    } else {
        focusModeBtn.classList.remove('active');
        breakModeBtn.classList.add('active');
        statusText.textContent = 'Short Break';
        timeRemaining = 300; // 5m
        totalTime = 300;
    }
    
    updateTimerUI();
}

function startTimer() {
    if (isRunning) return;
    isRunning = true;
    
    document.getElementById('timer-start').style.display = 'none';
    document.getElementById('timer-pause').style.display = 'inline-flex';
    
    timerInterval = setInterval(() => {
        timeRemaining--;
        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            timerFinished();
        } else {
            updateTimerUI();
        }
    }, 1000);
}

function pauseTimer() {
    if (!isRunning) return;
    isRunning = false;
    clearInterval(timerInterval);
    
    document.getElementById('timer-start').style.display = 'inline-flex';
    document.getElementById('timer-pause').style.display = 'none';
}

function resetTimer() {
    pauseTimer();
    timeRemaining = totalTime;
    updateTimerUI();
    showToast('Timer reset', 'info');
}

function updateTimerUI() {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    
    // Update numerical readout
    document.getElementById('timer-time').textContent = 
        `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    
    // Update SVG circle stroke dashoffset
    // Total stroke circumference is 534
    const offset = 534 * (1 - timeRemaining / totalTime);
    document.getElementById('timer-progress-bar').style.strokeDashoffset = offset;
}

function timerFinished() {
    playBeep();
    isRunning = false;
    
    document.getElementById('timer-start').style.display = 'inline-flex';
    document.getElementById('timer-pause').style.display = 'none';

    if (isFocusMode) {
        const sessionLength = Math.round(totalTime / 60);
        const newSession = {
            id: 'session-' + Date.now(),
            date: new Date().toLocaleDateString(),
            duration: sessionLength
        };
        
        state.studySessions.push(newSession);
        saveState();
        
        showToast(`Awesome work! Focus sprint logged (${sessionLength} mins).`, 'success');
        updateSprintLogs();
        renderDashboard();
        
        // Auto swap to Break Mode
        setTimeout(() => {
            setTimerMode(false);
        }, 1500);
    } else {
        showToast('Break over! Ready to lock back in?', 'info');
        
        // Auto swap to Focus Mode
        setTimeout(() => {
            setTimerMode(true);
        }, 1500);
    }
}

function updateSprintLogs() {
    const logsContainer = document.getElementById('timer-logs-list');
    logsContainer.innerHTML = '';

    // Calculate insight states
    const todayStr = new Date().toLocaleDateString();
    const todaySessions = state.studySessions.filter(s => s.date === todayStr);
    const todayMins = todaySessions.reduce((sum, s) => sum + s.duration, 0);

    document.getElementById('insight-sessions').textContent = todaySessions.length;
    document.getElementById('insight-hours').textContent = `${todayMins}m`;

    // Render chronological log entries (reverse order)
    const reversedLogs = [...state.studySessions].reverse();
    if (reversedLogs.length === 0) {
        logsContainer.innerHTML = `<li style="background:none; text-align:center; color:var(--text-secondary);">No sprints completed yet.</li>`;
    } else {
        reversedLogs.forEach(session => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>Focus Sprint completed</span>
                <span class="log-time">${session.date} • ${session.duration} mins</span>
            `;
            logsContainer.appendChild(li);
        });
    }
}


// ==========================================================================
// 8. Task Manager logic
// ==========================================================================
let currentTaskFilter = 'all';

function renderTasks() {
    const listContainer = document.getElementById('tasks-list');
    listContainer.innerHTML = '';

    const filtered = state.tasks.filter(task => {
        if (currentTaskFilter === 'pending') return !task.completed;
        if (currentTaskFilter === 'completed') return task.completed;
        return true;
    });

    // Update pending count text
    const pendingCount = state.tasks.filter(t => !t.completed).length;
    document.getElementById('task-summary-count').textContent = 
        `${pendingCount} task${pendingCount !== 1 ? 's' : ''} pending`;

    if (filtered.length === 0) {
        listContainer.innerHTML = `<div class="no-data">No tasks found. Add a task to start tracking! 📝</div>`;
        return;
    }

    filtered.forEach(task => {
        const item = document.createElement('div');
        item.className = `task-item ${task.completed ? 'completed' : ''}`;
        
        item.innerHTML = `
            <div class="task-left">
                <label class="checkbox-container">
                    <input type="checkbox" ${task.completed ? 'checked' : ''} data-id="${task.id}">
                    <span class="checkmark"></span>
                </label>
                <span class="task-title-text">${task.title}</span>
            </div>
            <div class="task-meta">
                <span class="priority-badge ${task.priority}">${task.priority}</span>
                <button class="action-btn-trash" data-delete-id="${task.id}" title="Delete Task">
                    <i data-lucide="trash-2"></i>
                </button>
            </div>
        `;

        // Checkbox Toggle Listener
        const checkbox = item.querySelector('input[type="checkbox"]');
        checkbox.addEventListener('change', () => {
            toggleTaskStatus(task.id);
        });

        // Delete Button Listener
        const deleteBtn = item.querySelector('.action-btn-trash');
        deleteBtn.addEventListener('click', () => {
            deleteTask(task.id);
        });

        listContainer.appendChild(item);
    });

    lucide.createIcons();
}

function toggleTaskStatus(id) {
    state.tasks = state.tasks.map(task => {
        if (task.id === id) {
            const newStatus = !task.completed;
            showToast(newStatus ? 'Task completed! Good job 🎉' : 'Task marked pending', 'success');
            return { ...task, completed: newStatus };
        }
        return task;
    });
    saveState();
    renderTasks();
    renderDashboard();
}

function deleteTask(id) {
    state.tasks = state.tasks.filter(t => t.id !== id);
    saveState();
    renderTasks();
    renderDashboard();
    showToast('Task deleted successfully', 'info');
}

// Bind task filter button triggers
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentTaskFilter = btn.getAttribute('data-filter');
        renderTasks();
    });
});


// ==========================================================================
// 9. Exam Countdown logic
// ==========================================================================
function renderExams() {
    const gridContainer = document.getElementById('exams-grid');
    gridContainer.innerHTML = '';

    const today = new Date();
    today.setHours(0,0,0,0);

    // Compute remaining days and sort exams
    const computedExams = state.exams.map(exam => {
        const examDate = parseLocalDate(exam.date);
        examDate.setHours(0,0,0,0);
        const diff = examDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diff / (1000 * 60 * 60 * 24));
        return { ...exam, daysRemaining: diffDays };
    });

    // Sort: Nearest upcoming first, past exams pushed to bottom
    computedExams.sort((a, b) => {
        if (a.daysRemaining >= 0 && b.daysRemaining >= 0) return a.daysRemaining - b.daysRemaining;
        if (a.daysRemaining < 0 && b.daysRemaining < 0) return b.daysRemaining - a.daysRemaining; // reverse sort past exams
        return a.daysRemaining >= 0 ? -1 : 1; // Future exams first
    });

    if (computedExams.length === 0) {
        gridContainer.innerHTML = `<div class="no-data" style="grid-column: 1/-1;">No exams scheduled. Relax or prepare ahead! 🎯</div>`;
        return;
    }

    computedExams.forEach(exam => {
        const card = document.createElement('div');
        
        const isCritical = exam.daysRemaining >= 0 && exam.daysRemaining <= 3;
        const isPast = exam.daysRemaining < 0;

        card.className = `exam-card ${isCritical ? 'critical' : ''}`;
        if (isPast) card.style.opacity = '0.6';

        const dateStr = parseLocalDate(exam.date).toLocaleDateString('en-US', {
            weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
        });

        let countdownLabel = '';
        if (exam.daysRemaining === 0) countdownLabel = 'TODAY';
        else if (exam.daysRemaining === 1) countdownLabel = 'Tomorrow';
        else if (exam.daysRemaining > 1) countdownLabel = `${exam.daysRemaining} days left`;
        else countdownLabel = 'Completed';

        card.innerHTML = `
            <div class="exam-card-header">
                <div>
                    <h3 class="exam-subject">${exam.title}</h3>
                    <span class="exam-date-text">
                        <i data-lucide="calendar" style="width:14px;height:14px;"></i> ${dateStr}
                    </span>
                </div>
                <button class="action-btn-trash" data-delete-id="${exam.id}" title="Delete Exam">
                    <i data-lucide="trash-2"></i>
                </button>
            </div>
            <div class="exam-countdown-badge">
                ${countdownLabel}
            </div>
        `;

        card.querySelector('.action-btn-trash').addEventListener('click', () => {
            deleteExam(exam.id);
        });

        gridContainer.appendChild(card);
    });

    lucide.createIcons();
}

function deleteExam(id) {
    state.exams = state.exams.filter(e => e.id !== id);
    saveState();
    renderExams();
    renderDashboard();
    showToast('Exam schedule deleted', 'info');
}


// ==========================================================================
// 10. Attendance Tracker logic
// ==========================================================================
function renderAttendance() {
    const gridContainer = document.getElementById('subjects-grid');
    gridContainer.innerHTML = '';

    if (state.attendance.length === 0) {
        gridContainer.innerHTML = `<div class="no-data" style="grid-column: 1/-1;">No subjects added yet. Track your attendance here! 🛡️</div>`;
        return;
    }

    state.attendance.forEach(sub => {
        const card = document.createElement('div');
        card.className = 'subject-card';

        const attended = Number(sub.attended);
        const conducted = Number(sub.conducted);
        const percentage = conducted > 0 ? Math.round((attended / conducted) * 100) : 100;
        
        const isSafe = percentage >= 75;
        const statusClass = isSafe ? 'status-safe' : 'status-danger';

        // Calculate recommendations
        let insightMessage = '';
        if (conducted === 0) {
            insightMessage = 'No classes conducted yet.';
        } else if (isSafe) {
            if (percentage === 100) {
                insightMessage = 'Perfect attendance record! 🌟';
            } else {
                // Number of classes student can skip while remaining above 75%
                const missable = Math.floor((attended - 0.75 * conducted) / 0.75);
                insightMessage = missable > 0 
                    ? `You can safely miss the next ${missable} class${missable !== 1 ? 'es' : ''}.`
                    : 'Careful! Slipping below 75% if you miss the next class.';
            }
        } else {
            // Number of consecutive classes to attend to reach 75%
            const reqClasses = Math.ceil((0.75 * conducted - attended) / 0.25);
            insightMessage = `Attend next ${reqClasses} class${reqClasses !== 1 ? 'es' : ''} to reach 75%.`;
        }

        card.innerHTML = `
            <div>
                <div class="subject-header">
                    <h3 class="subject-title">${sub.name}</h3>
                    <button class="action-btn-trash" data-delete-id="${sub.id}" title="Delete Subject">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
                
                <div class="subject-stats-row">
                    <span class="subject-classes-count">${attended} / ${conducted} classes</span>
                    <span class="subject-percentage ${statusClass}">${percentage}%</span>
                </div>
                
                <div class="progress-bar-container">
                    <div class="progress-bar-fill ${statusClass}" style="width: ${percentage}%"></div>
                </div>
                
                <p class="subject-insights-text ${statusClass}">${insightMessage}</p>
            </div>
            
            <div class="subject-actions">
                <button class="btn btn-secondary btn-icon-adjust btn-add-attended" title="Add Attended Class">+ Attended</button>
                <button class="btn btn-secondary btn-icon-adjust btn-add-conducted" title="Add Conducted Class">+ Conducted</button>
            </div>
        `;

        // Event listener: Add Attended (+1 Attended, +1 Conducted)
        card.querySelector('.btn-add-attended').addEventListener('click', () => {
            adjustAttendance(sub.id, 1, 1);
        });

        // Event listener: Add Conducted (+0 Attended, +1 Conducted)
        card.querySelector('.btn-add-conducted').addEventListener('click', () => {
            adjustAttendance(sub.id, 0, 1);
        });

        // Event listener: Delete subject
        card.querySelector('.action-btn-trash').addEventListener('click', () => {
            deleteSubject(sub.id);
        });

        gridContainer.appendChild(card);
    });

    lucide.createIcons();
}

function adjustAttendance(id, addAttended, addConducted) {
    state.attendance = state.attendance.map(sub => {
        if (sub.id === id) {
            return {
                ...sub,
                attended: Math.max(0, Number(sub.attended) + addAttended),
                conducted: Math.max(0, Number(sub.conducted) + addConducted)
            };
        }
        return sub;
    });
    saveState();
    renderAttendance();
    renderDashboard();
}

function deleteSubject(id) {
    state.attendance = state.attendance.filter(s => s.id !== id);
    saveState();
    renderAttendance();
    renderDashboard();
    showToast('Subject deleted', 'info');
}


// ==========================================================================
// 11. Notes Vault logic
// ==========================================================================
let selectedNotesSubjectFilter = 'All';

function renderNotes() {
    const gridContainer = document.getElementById('notes-grid');
    gridContainer.innerHTML = '';

    // Render Filters Bar
    renderNotesFilters();

    // Filter Notes array
    const filteredNotes = state.notes.filter(note => {
        if (selectedNotesSubjectFilter === 'All') return true;
        return note.subject.toLowerCase() === selectedNotesSubjectFilter.toLowerCase();
    });

    // Sort notes: Newest first
    filteredNotes.sort((a, b) => b.lastUpdated - a.lastUpdated);

    if (filteredNotes.length === 0) {
        gridContainer.innerHTML = `<div class="no-data" style="grid-column:1/-1;">No notes found. Create a revision note to start! 📝</div>`;
        return;
    }

    filteredNotes.forEach(note => {
        const card = document.createElement('div');
        card.className = 'note-card';

        const updatedStr = new Date(note.lastUpdated).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: '2-digit'
        });

        card.innerHTML = `
            <div>
                <div class="note-card-header">
                    <h4 class="note-card-title">${note.title}</h4>
                    <span class="note-card-subject-tag">${note.subject}</span>
                </div>
                <div class="note-card-body">${note.content}</div>
            </div>
            <div class="note-card-footer">
                <span>Updated: ${updatedStr}</span>
                <div class="note-card-actions">
                    <button class="note-action-btn edit" data-edit-id="${note.id}" title="Edit Note">
                        <i data-lucide="edit-3" style="width:16px;height:16px;"></i>
                    </button>
                    <button class="note-action-btn delete" data-delete-id="${note.id}" title="Delete Note">
                        <i data-lucide="trash-2" style="width:16px;height:16px;"></i>
                    </button>
                </div>
            </div>
        `;

        card.querySelector('.note-action-btn.edit').addEventListener('click', () => {
            editNote(note.id);
        });

        card.querySelector('.note-action-btn.delete').addEventListener('click', () => {
            deleteNote(note.id);
        });

        gridContainer.appendChild(card);
    });

    lucide.createIcons();
}

function renderNotesFilters() {
    const filtersContainer = document.getElementById('notes-subjects-filter');
    filtersContainer.innerHTML = '';

    // Extract unique subjects
    const subjects = ['All'];
    state.notes.forEach(note => {
        const sub = note.subject.trim();
        if (sub && !subjects.some(s => s.toLowerCase() === sub.toLowerCase())) {
            subjects.push(sub);
        }
    });

    subjects.forEach(sub => {
        const btn = document.createElement('button');
        btn.className = `subject-filter-tag ${selectedNotesSubjectFilter.toLowerCase() === sub.toLowerCase() ? 'active' : ''}`;
        btn.textContent = sub;
        btn.addEventListener('click', () => {
            selectedNotesSubjectFilter = sub;
            renderNotes();
        });
        filtersContainer.appendChild(btn);
    });
}

function editNote(id) {
    const note = state.notes.find(n => n.id === id);
    if (!note) return;

    // Load into Editor form
    document.getElementById('note-id').value = note.id;
    document.getElementById('note-title').value = note.title;
    document.getElementById('note-subject').value = note.subject;
    document.getElementById('note-content').value = note.content;

    // Change title and show cancel button
    document.getElementById('note-form-title').innerHTML = '<i data-lucide="edit-3"></i> Edit Note';
    document.getElementById('btn-cancel-edit').style.display = 'inline-flex';
    document.getElementById('btn-save-note').textContent = 'Update Note';

    // Scroll form into view
    document.getElementById('note-editor-card').scrollIntoView({ behavior: 'smooth' });
    lucide.createIcons();
}

function deleteNote(id) {
    if (confirm('Are you sure you want to delete this note?')) {
        state.notes = state.notes.filter(n => n.id !== id);
        
        // If editing note is deleted, reset the editor form
        const currentEditId = document.getElementById('note-id').value;
        if (currentEditId === id) {
            resetNoteForm();
        }

        saveState();
        renderNotes();
        showToast('Note deleted successfully', 'info');
    }
}

function resetNoteForm() {
    document.getElementById('note-id').value = '';
    document.getElementById('note-form').reset();
    document.getElementById('note-form-title').innerHTML = '<i data-lucide="plus-circle"></i> Create New Note';
    document.getElementById('btn-cancel-edit').style.display = 'none';
    document.getElementById('btn-save-note').textContent = 'Save Note';
    lucide.createIcons();
}

document.getElementById('btn-cancel-edit').addEventListener('click', () => {
    resetNoteForm();
    showToast('Editing cancelled', 'info');
});


// ==========================================================================
// 12. Standard Forms Submission Handlers
// ==========================================================================
function bindFormSubmissions() {
    // 1. Task Creation Form
    const taskForm = document.getElementById('task-form');
    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = document.getElementById('task-title').value.trim();
        const priority = document.getElementById('task-priority').value;

        if (!title) return;

        const newTask = {
            id: 'task-' + Date.now(),
            title: title,
            priority: priority,
            completed: false
        };

        state.tasks.push(newTask);
        saveState();
        renderTasks();
        renderDashboard();

        taskForm.reset();
        showToast('New task added successfully!', 'success');
    });

    // 2. Exam Creation Form
    const examForm = document.getElementById('exam-form');
    examForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = document.getElementById('exam-title').value.trim();
        const dateString = document.getElementById('exam-date').value;

        if (!title || !dateString) return;

        const newExam = {
            id: 'exam-' + Date.now(),
            title: title,
            date: dateString
        };

        state.exams.push(newExam);
        saveState();
        renderExams();
        renderDashboard();

        examForm.reset();
        showToast('Exam date scheduled!', 'success');
    });

    // 3. Attendance Subject Creation Form
    const attForm = document.getElementById('attendance-form');
    attForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('subject-name').value.trim();
        const attended = Number(document.getElementById('attended-classes').value);
        const conducted = Number(document.getElementById('total-classes').value);

        if (!name) return;
        if (attended > conducted) {
            showToast('Attended classes cannot exceed conducted classes!', 'error');
            return;
        }

        const newSubject = {
            id: 'sub-' + Date.now(),
            name: name,
            attended: attended,
            conducted: conducted
        };

        state.attendance.push(newSubject);
        saveState();
        renderAttendance();
        renderDashboard();

        attForm.reset();
        showToast('Subject attendance tracker initialized', 'success');
    });

    // 4. Notes Creation & Editing Form
    const noteForm = document.getElementById('note-form');
    noteForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const noteId = document.getElementById('note-id').value;
        const title = document.getElementById('note-title').value.trim();
        const subject = document.getElementById('note-subject').value.trim();
        const content = document.getElementById('note-content').value.trim();

        if (!title || !subject || !content) return;

        if (noteId) {
            // Edit Mode: Update existing
            state.notes = state.notes.map(note => {
                if (note.id === noteId) {
                    return {
                        ...note,
                        title: title,
                        subject: subject,
                        content: content,
                        lastUpdated: Date.now()
                    };
                }
                return note;
            });
            showToast('Note updated successfully', 'success');
        } else {
            // Create Mode: Add new
            const newNote = {
                id: 'note-' + Date.now(),
                title: title,
                subject: subject,
                content: content,
                lastUpdated: Date.now()
            };
            state.notes.push(newNote);
            showToast('Note added to Vault', 'success');
        }

        saveState();
        resetNoteForm();
        renderNotes();
    });
}
