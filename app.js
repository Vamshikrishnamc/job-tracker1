/**
 * JobTracker Application Logic
 * Modern, responsive, local-first job application tracker.
 */

(function () {
  'use strict';

  // --- Constants & Config ---
  const STORAGE_KEY = 'jobtracker_applications_v1';
  const THEME_KEY = 'jobtracker_theme';
  const VIEW_KEY = 'jobtracker_view';

  const STATUSES = [
    { key: 'wishlist', label: 'Wishlist', color: '#8b5cf6' },
    { key: 'applied', label: 'Applied', color: '#3b82f6' },
    { key: 'interviewing', label: 'Interviewing', color: '#f59e0b' },
    { key: 'offer', label: 'Offer', color: '#10b981' },
    { key: 'rejected', label: 'Rejected', color: '#64748b' }
  ];

  // Default sample applications to showcase the app on initial load
  const SAMPLE_DATA = [
    {
      id: 'job_sample_1',
      company: 'Linear',
      role: 'Frontend Engineer',
      status: 'interviewing',
      workplace: 'Remote',
      location: 'San Francisco, CA (Remote)',
      salary: '$150k - $175k + Equity',
      appliedDate: '2025-05-10',
      jobUrl: 'https://linear.app/careers',
      contact: 'Sarah Miller (Head of Talent)',
      notes: 'Initial technical screen completed. Scheduled system design interview next Tuesday at 2 PM PST.\nPrep notes: Focus on optimistic UI updates, web workers, and keyboard navigation.',
      priority: 'high',
      updatedAt: Date.now() - 86400000 * 2
    },
    {
      id: 'job_sample_2',
      company: 'Stripe',
      role: 'Full Stack Engineer',
      status: 'offer',
      workplace: 'Remote',
      location: 'Seattle, WA',
      salary: '$180k + $45k Bonus',
      appliedDate: '2025-04-18',
      jobUrl: 'https://stripe.com/jobs',
      contact: 'Alex Chen (Recruiter)',
      notes: 'Received official offer letter! Base $180k, signing bonus $30k, 4-year RSU grant. Decision deadline next Friday.',
      priority: 'high',
      updatedAt: Date.now() - 86400000 * 1
    },
    {
      id: 'job_sample_3',
      company: 'Figma',
      role: 'Product Designer / Dev',
      status: 'applied',
      workplace: 'Hybrid',
      location: 'New York, NY',
      salary: '$140k - $160k',
      appliedDate: '2025-05-14',
      jobUrl: 'https://figma.com/careers',
      contact: 'Referral through David (ex-colleague)',
      notes: 'Applied with custom portfolio presentation. David submitted internal referral recommendation.',
      priority: 'medium',
      updatedAt: Date.now() - 86400000 * 4
    },
    {
      id: 'job_sample_4',
      company: 'Vercel',
      role: 'Developer Relations Engineer',
      status: 'wishlist',
      workplace: 'Remote',
      location: 'Remote (Worldwide)',
      salary: '$135k - $155k',
      appliedDate: '2025-05-18',
      jobUrl: 'https://vercel.com/careers',
      contact: 'Reached out to DevRel Lead on X',
      notes: 'Bookmark application for when Next.js open source project showcase is completed.',
      priority: 'medium',
      updatedAt: Date.now() - 86400000 * 6
    },
    {
      id: 'job_sample_5',
      company: 'Datadog',
      role: 'Senior Software Engineer',
      status: 'rejected',
      workplace: 'On-site',
      location: 'Boston, MA',
      salary: '$165k',
      appliedDate: '2025-04-02',
      jobUrl: 'https://datadoghq.com/careers',
      contact: 'Recruiting team',
      notes: 'Reached round 3 onsite. Position filled by candidate with deeper Go concurrency experience. Encouraged to reapply in 6 months.',
      priority: 'low',
      updatedAt: Date.now() - 86400000 * 20
    }
  ];

  // --- State ---
  let applications = [];
  let currentView = localStorage.getItem(VIEW_KEY) || 'board';
  let activeFilterStatus = 'all';
  let activeWorkplaceFilter = 'all';
  let activeSort = 'date-desc';
  let searchQuery = '';
  let draggedJobId = null;
  let currentlyViewingJobId = null;

  // --- DOM Elements ---
  const boardView = document.getElementById('boardView');
  const listView = document.getElementById('listView');
  const viewBoardBtn = document.getElementById('viewBoardBtn');
  const viewListBtn = document.getElementById('viewListBtn');
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');

  // Toolbar & Filters
  const statusFilter = document.getElementById('statusFilter');
  const workplaceFilter = document.getElementById('workplaceFilter');
  const sortBy = document.getElementById('sortBy');
  const resetFiltersBtn = document.getElementById('resetFiltersBtn');
  const filterBanner = document.getElementById('filterBanner');
  const filterCountEl = document.getElementById('filterCount');
  const clearActiveFilterBtn = document.getElementById('clearActiveFilterBtn');

  // Data dropdown
  const dataMenuBtn = document.getElementById('dataMenuBtn');
  const dataMenuDropdown = document.getElementById('dataMenuDropdown');
  const exportJsonBtn = document.getElementById('exportJsonBtn');
  const exportCsvBtn = document.getElementById('exportCsvBtn');
  const importJsonInput = document.getElementById('importJsonInput');
  const loadSampleDataBtn = document.getElementById('loadSampleDataBtn');
  const clearAllDataBtn = document.getElementById('clearAllDataBtn');

  // Stats Counters
  const statTotal = document.getElementById('statTotal');
  const statWishlist = document.getElementById('statWishlist');
  const statApplied = document.getElementById('statApplied');
  const statInterviewing = document.getElementById('statInterviewing');
  const statOffer = document.getElementById('statOffer');
  const statRejected = document.getElementById('statRejected');
  const quickStatsFooter = document.getElementById('quickStatsFooter');

  // Table Body
  const jobsTableBody = document.getElementById('jobsTableBody');
  const tableEmptyState = document.getElementById('tableEmptyState');

  // Add/Edit Modal
  const jobModal = document.getElementById('jobModal');
  const modalTitle = document.getElementById('modalTitle');
  const jobForm = document.getElementById('jobForm');
  const addJobBtn = document.getElementById('addJobBtn');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const cancelModalBtn = document.getElementById('cancelModalBtn');

  // Form Inputs
  const jobIdInput = document.getElementById('jobId');
  const companyInput = document.getElementById('companyInput');
  const roleInput = document.getElementById('roleInput');
  const statusInput = document.getElementById('statusInput');
  const workplaceInput = document.getElementById('workplaceInput');
  const priorityInput = document.getElementById('priorityInput');
  const locationInput = document.getElementById('locationInput');
  const salaryInput = document.getElementById('salaryInput');
  const appliedDateInput = document.getElementById('appliedDateInput');
  const jobUrlInput = document.getElementById('jobUrlInput');
  const contactInput = document.getElementById('contactInput');
  const notesInput = document.getElementById('notesInput');

  // Details Modal
  const detailsModal = document.getElementById('detailsModal');
  const closeDetailsBtn = document.getElementById('closeDetailsBtn');
  const closeDetailsBottomBtn = document.getElementById('closeDetailsBottomBtn');
  const editJobFromDetailsBtn = document.getElementById('editJobFromDetailsBtn');
  const deleteJobFromDetailsBtn = document.getElementById('deleteJobFromDetailsBtn');

  const detailsAvatar = document.getElementById('detailsAvatar');
  const detailsRole = document.getElementById('detailsRole');
  const detailsCompany = document.getElementById('detailsCompany');
  const detailsStatusBadge = document.getElementById('detailsStatusBadge');
  const detailsWorkplace = document.getElementById('detailsWorkplace');
  const detailsSalary = document.getElementById('detailsSalary');
  const detailsDate = document.getElementById('detailsDate');
  const detailsPriority = document.getElementById('detailsPriority');
  const detailsContact = document.getElementById('detailsContact');
  const detailsContactContainer = document.getElementById('detailsContactContainer');
  const detailsUrlSection = document.getElementById('detailsUrlSection');
  const detailsLink = document.getElementById('detailsLink');
  const detailsNotes = document.getElementById('detailsNotes');
  const detailsStatusButtons = document.getElementById('detailsStatusButtons');

  // Toast Container
  const toastContainer = document.getElementById('toastContainer');

  // --- Initialization ---
  function init() {
    initTheme();
    loadApplications();
    setupEventListeners();
    setupDragAndDrop();
    switchView(currentView);
    render();
  }

  // --- Theme Handling ---
  function initTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme) {
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    }
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem(THEME_KEY, next);
    showToast(`Switched to ${next} theme`, 'info');
  }

  // --- Storage Management ---
  function loadApplications() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        applications = JSON.parse(raw);
      } else {
        // Initial first load: load sample data so app isn't empty
        applications = [...SAMPLE_DATA];
        saveApplications();
      }
    } catch (err) {
      console.error('Failed to parse applications from localStorage:', err);
      applications = [...SAMPLE_DATA];
    }
  }

  function saveApplications() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(applications));
    } catch (err) {
      console.error('Failed to save applications to localStorage:', err);
      showToast('Error saving data to browser storage', 'error');
    }
  }

  // --- Helpers ---
  function generateId() {
    return 'job_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatDate(dateStr) {
    if (!dateStr) return 'Not set';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  }

  function getAvatarGradient(name) {
    if (!name) return 'linear-gradient(135deg, #4f46e5, #06b6d4)';
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue1 = Math.abs(hash % 360);
    const hue2 = (hue1 + 45) % 360;
    return `linear-gradient(135deg, hsl(${hue1}, 70%, 50%), hsl(${hue2}, 75%, 42%))`;
  }

  function getInitials(name) {
    if (!name) return 'CO';
    const clean = name.trim().replace(/[^a-zA-Z0-9\s]/g, '');
    const parts = clean.split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return clean.slice(0, 2).toUpperCase();
  }

  function getPriorityStars(priority) {
    switch (priority) {
      case 'high': return '⭐⭐⭐';
      case 'medium': return '⭐⭐';
      case 'low': return '⭐';
      default: return '⭐⭐';
    }
  }

  function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    let icon = '✓';
    if (type === 'error') icon = '✕';
    if (type === 'info') icon = 'ℹ️';

    toast.innerHTML = `<span>${icon}</span> <span>${escapeHtml(message)}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.25s ease';
      setTimeout(() => toast.remove(), 260);
    }, 3200);
  }

  // --- Filtering & Sorting ---
  function getFilteredAndSortedJobs() {
    let list = applications.filter(job => {
      // Status filter
      if (activeFilterStatus !== 'all' && job.status !== activeFilterStatus) {
        return false;
      }
      // Workplace filter
      if (activeWorkplaceFilter !== 'all' && job.workplace !== activeWorkplaceFilter) {
        return false;
      }
      // Search query filter
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        const comp = (job.company || '').toLowerCase();
        const role = (job.role || '').toLowerCase();
        const loc = (job.location || '').toLowerCase();
        const notes = (job.notes || '').toLowerCase();
        const contact = (job.contact || '').toLowerCase();
        if (!comp.includes(q) && !role.includes(q) && !loc.includes(q) && !notes.includes(q) && !contact.includes(q)) {
          return false;
        }
      }
      return true;
    });

    // Sorting
    list.sort((a, b) => {
      switch (activeSort) {
        case 'date-desc':
          return (b.appliedDate || '').localeCompare(a.appliedDate || '');
        case 'date-asc':
          return (a.appliedDate || '').localeCompare(b.appliedDate || '');
        case 'company-asc':
          return (a.company || '').localeCompare(b.company || '');
        case 'company-desc':
          return (b.company || '').localeCompare(a.company || '');
        case 'priority-desc': {
          const pMap = { high: 3, medium: 2, low: 1 };
          return (pMap[b.priority] || 2) - (pMap[a.priority] || 2);
        }
        default:
          return 0;
      }
    });

    return list;
  }

  // --- Rendering Functions ---
  function render() {
    updateMetrics();
    updateFilterBanner();

    const filteredJobs = getFilteredAndSortedJobs();

    if (currentView === 'board') {
      renderBoard(filteredJobs);
    } else {
      renderList(filteredJobs);
    }
  }

  function updateMetrics() {
    const counts = {
      total: applications.length,
      wishlist: 0,
      applied: 0,
      interviewing: 0,
      offer: 0,
      rejected: 0
    };

    applications.forEach(j => {
      if (counts[j.status] !== undefined) {
        counts[j.status]++;
      }
    });

    statTotal.textContent = counts.total;
    statWishlist.textContent = counts.wishlist;
    statApplied.textContent = counts.applied;
    statInterviewing.textContent = counts.interviewing;
    statOffer.textContent = counts.offer;
    statRejected.textContent = counts.rejected;

    quickStatsFooter.textContent = `${counts.total} application${counts.total === 1 ? '' : 's'} tracked (${counts.interviewing} interviewing, ${counts.offer} offer${counts.offer === 1 ? '' : 's'})`;

    // Highlight active filter card in metrics if any
    document.querySelectorAll('.metric-card').forEach(card => {
      const filter = card.getAttribute('data-filter');
      if (filter === activeFilterStatus) {
        card.classList.add('active-filter');
      } else {
        card.classList.remove('active-filter');
      }
    });
  }

  function updateFilterBanner() {
    const isFiltered = activeFilterStatus !== 'all' || activeWorkplaceFilter !== 'all' || searchQuery.trim() !== '';
    if (isFiltered) {
      const filtered = getFilteredAndSortedJobs();
      filterCountEl.textContent = filtered.length;
      filterBanner.style.display = 'flex';
    } else {
      filterBanner.style.display = 'none';
    }
  }

  // Render Kanban Board
  function renderBoard(jobs) {
    STATUSES.forEach(status => {
      const colCards = document.getElementById(`cards-${status.key}`);
      const countEl = document.getElementById(`count-${status.key}`);
      if (!colCards) return;

      const columnJobs = jobs.filter(j => j.status === status.key);
      countEl.textContent = columnJobs.length;

      colCards.innerHTML = '';

      if (columnJobs.length === 0) {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'column-empty-state';
        emptyDiv.textContent = 'No applications';
        colCards.appendChild(emptyDiv);
      } else {
        columnJobs.forEach(job => {
          const card = createJobCard(job);
          colCards.appendChild(card);
        });
      }
    });
  }

  // Create single Kanban Job Card Element
  function createJobCard(job) {
    const card = document.createElement('div');
    card.className = 'job-card';
    card.setAttribute('draggable', 'true');
    card.setAttribute('data-id', job.id);

    const gradient = getAvatarGradient(job.company);
    const initials = getInitials(job.company);
    const stars = getPriorityStars(job.priority);
    const formattedDate = formatDate(job.appliedDate);

    card.innerHTML = `
      <div class="card-top">
        <div class="card-company-info">
          <div class="company-avatar" style="background: ${gradient};">
            ${escapeHtml(initials)}
          </div>
          <div style="min-width: 0;">
            <div class="card-company-name" title="${escapeHtml(job.company)}">${escapeHtml(job.company)}</div>
            <div class="card-role-title" title="${escapeHtml(job.role)}">${escapeHtml(job.role)}</div>
          </div>
        </div>
      </div>

      <div class="card-meta-row">
        ${job.workplace ? `<span class="card-badge">${escapeHtml(job.workplace)}</span>` : ''}
        ${job.salary ? `<span class="card-badge salary">💵 ${escapeHtml(job.salary)}</span>` : ''}
        <span class="card-badge priority-indicator" title="Priority: ${job.priority}">${stars}</span>
      </div>

      <div class="card-footer">
        <span title="Applied Date">📅 ${formattedDate}</span>
        <div class="card-actions">
          <button class="card-icon-action btn-view-job" title="View details" data-id="${job.id}">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
          </button>
          <button class="card-icon-action btn-edit-job" title="Edit application" data-id="${job.id}">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          <button class="card-icon-action delete btn-delete-job" title="Delete application" data-id="${job.id}">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </div>
    `;

    // Click card opens details modal (unless clicking an action button)
    card.addEventListener('click', (e) => {
      if (e.target.closest('.card-icon-action')) return;
      openDetailsModal(job.id);
    });

    return card;
  }

  // Render Table / List View
  function renderList(jobs) {
    jobsTableBody.innerHTML = '';

    if (jobs.length === 0) {
      tableEmptyState.style.display = 'block';
      return;
    }

    tableEmptyState.style.display = 'none';

    jobs.forEach(job => {
      const tr = document.createElement('tr');
      const gradient = getAvatarGradient(job.company);
      const initials = getInitials(job.company);
      const stars = getPriorityStars(job.priority);
      const formattedDate = formatDate(job.appliedDate);

      tr.innerHTML = `
        <td>
          <div class="table-company-cell">
            <div class="company-avatar" style="background: ${gradient};">
              ${escapeHtml(initials)}
            </div>
            <div>${escapeHtml(job.company)}</div>
          </div>
        </td>
        <td><strong>${escapeHtml(job.role)}</strong></td>
        <td>
          <span class="status-badge status-${job.status}">
            ${escapeHtml(job.status)}
          </span>
        </td>
        <td>${escapeHtml(job.workplace || 'Remote')} ${job.location ? `• <span style="color:var(--text-secondary);font-size:0.8rem;">${escapeHtml(job.location)}</span>` : ''}</td>
        <td>${job.salary ? escapeHtml(job.salary) : '<span style="color:var(--text-muted);">-</span>'}</td>
        <td>${formattedDate}</td>
        <td><span title="Priority: ${job.priority}">${stars}</span></td>
        <td class="text-right">
          <div class="table-actions">
            <button class="card-icon-action btn-view-job" title="View details" data-id="${job.id}">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </button>
            <button class="card-icon-action btn-edit-job" title="Edit" data-id="${job.id}">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
            <button class="card-icon-action delete btn-delete-job" title="Delete" data-id="${job.id}">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </td>
      `;

      tr.addEventListener('click', (e) => {
        if (e.target.closest('.card-icon-action')) return;
        openDetailsModal(job.id);
      });

      jobsTableBody.appendChild(tr);
    });
  }

  // --- Drag and Drop Logic ---
  function setupDragAndDrop() {
    // Event delegation on board container for dragstart and dragend
    boardView.addEventListener('dragstart', (e) => {
      const card = e.target.closest('.job-card');
      if (!card) return;
      draggedJobId = card.getAttribute('data-id');
      card.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', draggedJobId);
    });

    boardView.addEventListener('dragend', (e) => {
      const card = e.target.closest('.job-card');
      if (card) {
        card.classList.remove('dragging');
      }
      document.querySelectorAll('.column-cards').forEach(col => {
        col.classList.remove('drag-over');
      });
      draggedJobId = null;
    });

    // Column dragover and drop targets
    document.querySelectorAll('.column-cards').forEach(col => {
      col.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        col.classList.add('drag-over');
      });

      col.addEventListener('dragleave', (e) => {
        if (!col.contains(e.relatedTarget)) {
          col.classList.remove('drag-over');
        }
      });

      col.addEventListener('drop', (e) => {
        e.preventDefault();
        col.classList.remove('drag-over');
        const targetStatus = col.getAttribute('data-status');
        const jobId = e.dataTransfer.getData('text/plain') || draggedJobId;

        if (jobId && targetStatus) {
          updateJobStatus(jobId, targetStatus);
        }
      });
    });
  }

  function updateJobStatus(jobId, newStatus) {
    const job = applications.find(j => j.id === jobId);
    if (!job) return;

    if (job.status !== newStatus) {
      job.status = newStatus;
      job.updatedAt = Date.now();
      saveApplications();
      render();
      showToast(`Moved to ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`);
      
      // Update details modal if currently open with this job
      if (currentlyViewingJobId === jobId && detailsModal.classList.contains('show')) {
        openDetailsModal(jobId);
      }
    }
  }

  // --- View Switcher ---
  function switchView(view) {
    currentView = view;
    localStorage.setItem(VIEW_KEY, view);

    if (view === 'board') {
      boardView.style.display = 'grid';
      listView.style.display = 'none';
      viewBoardBtn.classList.add('active');
      viewListBtn.classList.remove('active');
    } else {
      boardView.style.display = 'none';
      listView.style.display = 'block';
      viewListBtn.classList.add('active');
      viewBoardBtn.classList.remove('active');
    }
    render();
  }

  // --- Modal: Add / Edit ---
  function openAddModal(defaultStatus = 'applied') {
    jobForm.reset();
    jobIdInput.value = '';
    modalTitle.textContent = 'Add Job Application';
    statusInput.value = defaultStatus;
    workplaceInput.value = 'Remote';
    priorityInput.value = 'medium';

    // Set today's date by default
    const today = new Date().toISOString().split('T')[0];
    appliedDateInput.value = today;

    jobModal.classList.add('show');
    companyInput.focus();
  }

  function openEditModal(jobId) {
    const job = applications.find(j => j.id === jobId);
    if (!job) return;

    jobIdInput.value = job.id;
    modalTitle.textContent = `Edit Application: ${job.company}`;
    companyInput.value = job.company || '';
    roleInput.value = job.role || '';
    statusInput.value = job.status || 'applied';
    workplaceInput.value = job.workplace || 'Remote';
    priorityInput.value = job.priority || 'medium';
    locationInput.value = job.location || '';
    salaryInput.value = job.salary || '';
    appliedDateInput.value = job.appliedDate || '';
    jobUrlInput.value = job.jobUrl || '';
    contactInput.value = job.contact || '';
    notesInput.value = job.notes || '';

    // If details modal was open, close it
    detailsModal.classList.remove('show');
    jobModal.classList.add('show');
    companyInput.focus();
  }

  function closeJobModal() {
    jobModal.classList.remove('show');
  }

  function handleFormSubmit(e) {
    e.preventDefault();

    const company = companyInput.value.trim();
    const role = roleInput.value.trim();

    if (!company || !role) {
      showToast('Please enter both Company and Role title', 'error');
      return;
    }

    const id = jobIdInput.value;
    const isEdit = Boolean(id);

    const jobData = {
      id: isEdit ? id : generateId(),
      company: company,
      role: role,
      status: statusInput.value,
      workplace: workplaceInput.value,
      priority: priorityInput.value,
      location: locationInput.value.trim(),
      salary: salaryInput.value.trim(),
      appliedDate: appliedDateInput.value,
      jobUrl: jobUrlInput.value.trim(),
      contact: contactInput.value.trim(),
      notes: notesInput.value.trim(),
      updatedAt: Date.now()
    };

    if (isEdit) {
      const idx = applications.findIndex(j => j.id === id);
      if (idx !== -1) {
        applications[idx] = jobData;
        showToast(`Updated ${jobData.company} application`);
      }
    } else {
      applications.unshift(jobData);
      showToast(`Added ${jobData.company} application!`);
    }

    saveApplications();
    closeJobModal();
    render();
  }

  // --- Modal: Details ---
  function openDetailsModal(jobId) {
    const job = applications.find(j => j.id === jobId);
    if (!job) return;

    currentlyViewingJobId = jobId;

    detailsAvatar.textContent = getInitials(job.company);
    detailsAvatar.style.background = getAvatarGradient(job.company);
    detailsRole.textContent = job.role;
    detailsCompany.textContent = `${job.company}${job.location ? ' • ' + job.location : ''}`;

    detailsStatusBadge.className = `status-badge status-${job.status}`;
    detailsStatusBadge.textContent = job.status;

    detailsWorkplace.textContent = job.workplace || 'Remote';
    detailsSalary.textContent = job.salary || 'Not specified';
    detailsDate.textContent = formatDate(job.appliedDate);
    detailsPriority.textContent = `${job.priority.toUpperCase()} (${getPriorityStars(job.priority)})`;

    if (job.contact) {
      detailsContactContainer.style.display = 'flex';
      detailsContact.textContent = job.contact;
    } else {
      detailsContactContainer.style.display = 'none';
    }

    if (job.jobUrl) {
      detailsUrlSection.style.display = 'block';
      detailsLink.href = job.jobUrl;
    } else {
      detailsUrlSection.style.display = 'none';
    }

    detailsNotes.textContent = job.notes ? job.notes : 'No notes added yet.';

    // Populate status changer buttons
    detailsStatusButtons.innerHTML = '';
    STATUSES.forEach(st => {
      const btn = document.createElement('button');
      btn.className = `stage-btn ${job.status === st.key ? 'active' : ''}`;
      btn.textContent = st.label;
      btn.addEventListener('click', () => {
        updateJobStatus(job.id, st.key);
      });
      detailsStatusButtons.appendChild(btn);
    });

    detailsModal.classList.add('show');
  }

  function closeDetailsModal() {
    detailsModal.classList.remove('show');
    currentlyViewingJobId = null;
  }

  function deleteJob(jobId) {
    const job = applications.find(j => j.id === jobId);
    if (!job) return;

    if (confirm(`Are you sure you want to delete application for ${job.role} at ${job.company}?`)) {
      applications = applications.filter(j => j.id !== jobId);
      saveApplications();
      closeDetailsModal();
      render();
      showToast(`Deleted application for ${job.company}`, 'info');
    }
  }

  // --- Data Export & Import ---
  function exportToJson() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(applications, null, 2));
    const downloadAnchor = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `job_tracker_backup_${dateStr}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('JSON backup file exported');
  }

  function exportToCsv() {
    if (applications.length === 0) {
      showToast('No applications to export', 'error');
      return;
    }

    const headers = ['Company', 'Role', 'Status', 'Workplace', 'Location', 'Salary', 'Date Applied', 'Priority', 'Recruiter Contact', 'Job URL', 'Notes'];

    const rows = applications.map(j => [
      `"${(j.company || '').replace(/"/g, '""')}"`,
      `"${(j.role || '').replace(/"/g, '""')}"`,
      `"${(j.status || '').replace(/"/g, '""')}"`,
      `"${(j.workplace || '').replace(/"/g, '""')}"`,
      `"${(j.location || '').replace(/"/g, '""')}"`,
      `"${(j.salary || '').replace(/"/g, '""')}"`,
      `"${(j.appliedDate || '').replace(/"/g, '""')}"`,
      `"${(j.priority || '').replace(/"/g, '""')}"`,
      `"${(j.contact || '').replace(/"/g, '""')}"`,
      `"${(j.jobUrl || '').replace(/"/g, '""')}"`,
      `"${(j.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const downloadAnchor = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    downloadAnchor.setAttribute("href", encodeURI(csvContent));
    downloadAnchor.setAttribute("download", `job_applications_${dateStr}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('CSV spreadsheet exported');
  }

  function importFromJson(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const imported = JSON.parse(e.target.result);
        if (Array.isArray(imported)) {
          // Merge or replace
          if (confirm(`Import ${imported.length} applications? This will combine with existing records.`)) {
            const existingIds = new Set(applications.map(j => j.id));
            imported.forEach(item => {
              if (!item.id || existingIds.has(item.id)) {
                item.id = generateId();
              }
              applications.push(item);
            });
            saveApplications();
            render();
            showToast(`Successfully imported ${imported.length} applications!`);
          }
        } else {
          showToast('Invalid backup file structure', 'error');
        }
      } catch (err) {
        showToast('Error reading JSON file', 'error');
      }
    };
    reader.readAsText(file);
  }

  function loadSampleData() {
    if (confirm('Load sample job applications into your tracker?')) {
      const sampleCopies = SAMPLE_DATA.map(s => ({ ...s, id: generateId() }));
      applications.unshift(...sampleCopies);
      saveApplications();
      render();
      showToast('Loaded demo applications');
    }
  }

  function clearAllData() {
    if (confirm('Are you sure you want to delete ALL tracked jobs? This cannot be undone.')) {
      if (confirm('Please confirm one more time: permanently delete everything?')) {
        applications = [];
        saveApplications();
        render();
        showToast('All job records cleared', 'info');
      }
    }
  }

  // --- Event Listeners Setup ---
  function setupEventListeners() {
    // Theme toggle
    themeToggleBtn.addEventListener('click', toggleTheme);

    // View buttons
    viewBoardBtn.addEventListener('click', () => switchView('board'));
    viewListBtn.addEventListener('click', () => switchView('list'));

    // Search bar
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      clearSearchBtn.style.display = searchQuery ? 'block' : 'none';
      render();
    });

    clearSearchBtn.addEventListener('click', () => {
      searchInput.value = '';
      searchQuery = '';
      clearSearchBtn.style.display = 'none';
      render();
    });

    // Toolbar filters
    statusFilter.addEventListener('change', (e) => {
      activeFilterStatus = e.target.value;
      render();
    });

    workplaceFilter.addEventListener('change', (e) => {
      activeWorkplaceFilter = e.target.value;
      render();
    });

    sortBy.addEventListener('change', (e) => {
      activeSort = e.target.value;
      render();
    });

    resetFiltersBtn.addEventListener('click', () => {
      activeFilterStatus = 'all';
      activeWorkplaceFilter = 'all';
      activeSort = 'date-desc';
      searchQuery = '';
      searchInput.value = '';
      clearSearchBtn.style.display = 'none';
      statusFilter.value = 'all';
      workplaceFilter.value = 'all';
      sortBy.value = 'date-desc';
      render();
    });

    clearActiveFilterBtn.addEventListener('click', () => {
      resetFiltersBtn.click();
    });

    // Metric Cards quick filter click
    document.querySelectorAll('.metric-card').forEach(card => {
      card.addEventListener('click', () => {
        const targetFilter = card.getAttribute('data-filter');
        if (activeFilterStatus === targetFilter && targetFilter !== 'all') {
          activeFilterStatus = 'all';
          statusFilter.value = 'all';
        } else {
          activeFilterStatus = targetFilter;
          statusFilter.value = targetFilter;
        }
        render();
      });
    });

    // Data dropdown toggle
    dataMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dataMenuDropdown.classList.toggle('show');
    });

    document.addEventListener('click', (e) => {
      if (!dataMenuBtn.contains(e.target) && !dataMenuDropdown.contains(e.target)) {
        dataMenuDropdown.classList.remove('show');
      }
    });

    exportJsonBtn.addEventListener('click', () => {
      exportToJson();
      dataMenuDropdown.classList.remove('show');
    });

    exportCsvBtn.addEventListener('click', () => {
      exportToCsv();
      dataMenuDropdown.classList.remove('show');
    });

    importJsonInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        importFromJson(e.target.files[0]);
        e.target.value = '';
      }
      dataMenuDropdown.classList.remove('show');
    });

    loadSampleDataBtn.addEventListener('click', () => {
      loadSampleData();
      dataMenuDropdown.classList.remove('show');
    });

    clearAllDataBtn.addEventListener('click', () => {
      clearAllData();
      dataMenuDropdown.classList.remove('show');
    });

    // Add Job Modal Triggers
    addJobBtn.addEventListener('click', () => openAddModal());

    document.querySelectorAll('.col-add-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const defStatus = btn.getAttribute('data-add-status') || 'applied';
        openAddModal(defStatus);
      });
    });

    closeModalBtn.addEventListener('click', closeJobModal);
    cancelModalBtn.addEventListener('click', closeJobModal);
    jobForm.addEventListener('submit', handleFormSubmit);

    // Click outside modal window to close
    jobModal.addEventListener('click', (e) => {
      if (e.target === jobModal) closeJobModal();
    });

    detailsModal.addEventListener('click', (e) => {
      if (e.target === detailsModal) closeDetailsModal();
    });

    closeDetailsBtn.addEventListener('click', closeDetailsModal);
    closeDetailsBottomBtn.addEventListener('click', closeDetailsModal);

    editJobFromDetailsBtn.addEventListener('click', () => {
      if (currentlyViewingJobId) {
        openEditModal(currentlyViewingJobId);
      }
    });

    deleteJobFromDetailsBtn.addEventListener('click', () => {
      if (currentlyViewingJobId) {
        deleteJob(currentlyViewingJobId);
      }
    });

    // Action buttons inside cards / table rows (event delegation)
    document.addEventListener('click', (e) => {
      const editBtn = e.target.closest('.btn-edit-job');
      if (editBtn) {
        e.stopPropagation();
        const id = editBtn.getAttribute('data-id');
        openEditModal(id);
        return;
      }

      const viewBtn = e.target.closest('.btn-view-job');
      if (viewBtn) {
        e.stopPropagation();
        const id = viewBtn.getAttribute('data-id');
        openDetailsModal(id);
        return;
      }

      const deleteBtn = e.target.closest('.btn-delete-job');
      if (deleteBtn) {
        e.stopPropagation();
        const id = deleteBtn.getAttribute('data-id');
        deleteJob(id);
        return;
      }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Escape closes modals
      if (e.key === 'Escape') {
        if (jobModal.classList.contains('show')) closeJobModal();
        if (detailsModal.classList.contains('show')) closeDetailsModal();
        if (dataMenuDropdown.classList.contains('show')) dataMenuDropdown.classList.remove('show');
      }

      // Ctrl + K or Cmd + K focuses search
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInput.focus();
        searchInput.select();
      }

      // 'N' opens Add modal if not in input/textarea
      if (
        e.key.toLowerCase() === 'n' &&
        !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName) &&
        !jobModal.classList.contains('show') &&
        !detailsModal.classList.contains('show')
      ) {
        e.preventDefault();
        openAddModal();
      }
    });
  }

  // --- Run on DOM Ready ---
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
