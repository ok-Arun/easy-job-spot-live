// ================= CONFIG =================
const API_BASE_URL = window.APP_CONFIG.API_BASE_URL;
const DASHBOARD_URL = `${API_BASE_URL}/provider/dashboard/stats`;


// ================= INIT =================
document.addEventListener("DOMContentLoaded", () => {
    requireAuth();
    loadDashboard();
    setupActions();
    setupLogout();
});


// ================= LOAD DASHBOARD =================
async function loadDashboard() {
    showLoading();

    try {
        const response = await fetch(DASHBOARD_URL, {
            headers: {
                "Authorization": "Bearer " + getToken()
            }
        });

        if (response.status === 403) {
            showError(`
                <div class="error-box" style="text-align:center;">
                    <p style="margin-bottom:15px;">
                        Please complete your company profile before using the dashboard.
                    </p>
                    <button class="btn btn-primary"
                        onclick="window.location.href='provider-profile.html'">
                        Complete Profile
                    </button>
                </div>
            `, true);
            return;
        }

        if (!response.ok) {
            throw new Error("Failed to load dashboard data");
        }

        const result = await response.json();
        const data = result.data || {};

        renderStats(data);
        renderJobTable(data.perJob || []);

        showDashboard();

    } catch (error) {
        console.error("Dashboard error:", error);
        showError("Unable to load dashboard. Please try again.");
    }
}


// ================= RENDER STATS =================
function renderStats(data) {
    const jobs = data.jobs || {};
    const applications = data.applications || {};

    setText("totalJobs", jobs.total);
    setText("activeJobs", jobs.active);
    setText("pendingJobs", jobs.pendingApproval);

    setText("totalApplications", applications.total);
    setText("shortlisted", applications.shortlisted);
    setText("hired", applications.hired);
}


// ================= RENDER JOB CARDS =================
function renderJobTable(perJob) {
    const container = document.getElementById("jobStatsBody");
    const emptyMsg = document.getElementById("emptyJobsMessage");

    if (!container) return;

    container.innerHTML = "";

    if (!perJob || perJob.length === 0) {
        if (emptyMsg) emptyMsg.classList.remove("hidden");
        return;
    }

    if (emptyMsg) emptyMsg.classList.add("hidden");

    perJob.forEach(job => {

        const statusMeta = getStatusMeta(job.status);

        const card = document.createElement("div");
        card.className = "job-card";

        card.innerHTML = `
            <div class="job-label">JOB TITLE</div>

            <div class="job-title">
                ${escapeHtml(job.jobTitle)}
                <span class="status-badge ${statusMeta.class}">
                    ${statusMeta.label}
                </span>
            </div>

            <div class="job-card-stats">
                <div class="job-stat">
                    <span>Total Applicants</span>
                    <strong>${job.totalApplications ?? 0}</strong>
                </div>

                <div class="job-stat">
                    <span>Shortlisted</span>
                    <strong>${job.shortlisted ?? 0}</strong>
                </div>

                <div class="job-stat">
                    <span>Rejected</span>
                    <strong>${job.rejected ?? 0}</strong>
                </div>

                <div class="job-stat">
                    <span>Hired</span>
                    <strong>${job.hired ?? 0}</strong>
                </div>
            </div>

            <div class="job-card-action">
                <button class="btn btn-sm view-applicants-btn"
                        data-job-id="${job.jobId}"
                        ${job.totalApplications === 0 ? "disabled" : ""}>
                    View
                </button>
            </div>
        `;

        container.appendChild(card);
    });

    attachViewApplicantsHandlers();
}


// ================= STATUS META =================
function getStatusMeta(status) {
    switch (status) {
        case "ACTIVE":
            return { label: "ACTIVE", class: "badge-active" };
        case "PENDING_APPROVAL":
            return { label: "PENDING", class: "badge-pending" };
        case "CLOSED":
        case "EXPIRED":
            return { label: "CLOSED", class: "badge-closed" };
        default:
            return { label: "", class: "" };
    }
}


// ================= ACTION HANDLERS =================
function setupActions() {

    const postBtn = document.getElementById("postJobBtn");
    const viewBtn = document.getElementById("viewJobsBtn");

    if (postBtn) {
        postBtn.addEventListener("click", () => {
            window.location.href = "provider-post-job.html";
        });
    }

    if (viewBtn) {
        viewBtn.addEventListener("click", () => {
            window.location.href = "provider-jobs.html";
        });
    }
}


// ================= VIEW APPLICANTS =================
function attachViewApplicantsHandlers() {
    document.querySelectorAll(".view-applicants-btn")
        .forEach(btn => {
            btn.addEventListener("click", () => {
                const jobId = btn.dataset.jobId;
                window.location.href =
                    `provider-job-applications.html?jobId=${jobId}`;
            });
        });
}


// ================= LOGOUT =================
function setupLogout() {
    const logoutBtn = document.getElementById("logoutBtn");
    if (!logoutBtn) return;

    logoutBtn.addEventListener("click", () => {
        clearAuthSession();
        window.location.href = "login.html";
    });
}


// ================= UI STATES =================
function showLoading() {
    const state = document.getElementById("stateContainer");
    const content = document.getElementById("dashboardContent");

    if (state) {
        state.innerHTML = `
            <div class="spinner-box">
                <div class="spinner"></div>
            </div>
        `;
        state.className = "state loading";
    }

    if (content) content.classList.add("hidden");
}

function showError(message, isHtml = false) {
    const state = document.getElementById("stateContainer");
    const content = document.getElementById("dashboardContent");

    if (state) {
        state.innerHTML = isHtml
            ? message
            : `<div class="error-box">${message}</div>`;

        state.className = "state error";
    }

    if (content) content.classList.add("hidden");
}

function showDashboard() {
    const state = document.getElementById("stateContainer");
    const content = document.getElementById("dashboardContent");

    if (state) state.classList.add("hidden");
    if (content) content.classList.remove("hidden");
}


// ================= HELPERS =================
function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value ?? 0;
}

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text || "";
    return div.innerHTML;
}