const API_BASE_URL = window.APP_CONFIG.API_BASE_URL;
const JOBS_URL = `${API_BASE_URL}/provider/jobs`;

let currentFilter = "";
let currentPage = 0;
const pageSize = 10;

// ================= INIT =================
document.addEventListener("DOMContentLoaded", () => {
    requireAuth();
    setupEventListeners();
    loadJobs();
});

function setupEventListeners() {

    // Filter delegation
    document.querySelector(".job-filters")
        .addEventListener("click", (e) => {
            const btn = e.target.closest(".filter-btn");
            if (!btn) return;

            const status = btn.dataset.status || "";

            document.querySelectorAll(".filter-btn").forEach(b => {
                b.classList.remove("active");
                b.setAttribute("aria-pressed", "false");
            });

            btn.classList.add("active");
            btn.setAttribute("aria-pressed", "true");

            currentFilter = status;
            currentPage = 0; // reset to first page on filter change
            loadJobs(status, 0);
        });

    // Job action delegation
    document.getElementById("jobsContainer")
        .addEventListener("click", handleJobActions);
}

// ================= LOAD JOBS =================
async function loadJobs(status = currentFilter, page = currentPage) {

    const state = document.getElementById("stateContainer");
    const container = document.getElementById("jobsContainer");
    const pagination = document.getElementById("paginationContainer");

    showLoading(state, container);
    pagination.classList.add("hidden");

    try {

        const url =
            `${JOBS_URL}?page=${page}&size=${pageSize}` +
            (status ? `&status=${status}` : "");

        const res = await fetch(url, {
            headers: { Authorization: "Bearer " + getToken() }
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json = await res.json();
        const pageData = json?.data;

        const jobs = pageData?.content ?? [];
        const totalPages = pageData?.totalPages ?? 0;

        if (!Array.isArray(jobs)) {
            throw new Error("Invalid response structure");
        }

        currentPage = page;

        state.classList.add("hidden");
        state.setAttribute("aria-busy", "false");
        container.classList.remove("hidden");

        if (!jobs.length) {
            container.innerHTML =
                `<div class="empty-state-box">No jobs found.</div>`;
            return;
        }

        container.innerHTML = jobs.map(renderJobCard).join("");

        renderPagination(totalPages);

    } catch (err) {
        console.error("Load jobs error:", err);
        showError(state, container, "Failed to load jobs.");
    }
}

// ================= PAGINATION =================
function renderPagination(totalPages) {

    const pagination = document.getElementById("paginationContainer");

    if (totalPages <= 1) {
        pagination.classList.add("hidden");
        return;
    }

    let buttons = "";

    for (let i = 0; i < totalPages; i++) {
        buttons += `
            <button
                class="${i === currentPage ? "active" : ""}"
                data-page="${i}">
                ${i + 1}
            </button>
        `;
    }

    pagination.innerHTML = buttons;
    pagination.classList.remove("hidden");

    pagination.querySelectorAll("button").forEach(btn => {
        btn.addEventListener("click", () => {
            const page = parseInt(btn.dataset.page);
            loadJobs(currentFilter, page);
        });
    });
}

// ================= RENDER CARD =================
function renderJobCard(job) {

    const meta = getStatusMeta(job.status);

    return `
        <div class="job-card-horizontal ${meta.cardClass}">

            <div class="job-content">

                <div class="job-top-row">
                    <div>
                        <div class="job-title">
                            ${escapeHtml(job.title)}
                        </div>

                        <div class="job-sub-info">
                            <span class="job-status ${meta.badgeClass}">
                                ${escapeHtml(meta.label)}
                            </span>
                            <span class="dot">•</span>
                            <span>${escapeHtml(String(job.totalApplications ?? 0))} Applications</span>
                        </div>
                    </div>
                </div>

                <div class="job-meta-row">
                    ${escapeHtml(job.location)}
                    <span class="dot">•</span>
                    ${escapeHtml(job.jobType)}
                    <span class="dot">•</span>
                    ${escapeHtml(job.category)}
                </div>

                <div class="job-actions-row">

                    <button
                        class="btn btn-secondary action-btn"
                        data-action="edit"
                        data-id="${encodeURIComponent(job.id)}"
                        ${job.status !== "ACTIVE" ? "disabled" : ""}>
                        Edit
                    </button>

                    <button
                        class="btn btn-primary action-btn"
                        data-action="view"
                        data-id="${encodeURIComponent(job.id)}">
                        View Applications
                    </button>

                    ${
                        job.status === "ACTIVE"
                            ? `<button class="btn btn-danger action-btn"
                                       data-action="close"
                                       data-id="${encodeURIComponent(job.id)}">
                                       Close Job
                               </button>`
                            : job.status === "CLOSED"
                                ? `<button class="btn btn-danger action-btn"
                                           data-action="reopen"
                                           data-id="${encodeURIComponent(job.id)}">
                                           Reopen Job
                                   </button>`
                                : ""
                    }

                </div>

            </div>
        </div>
    `;
}

// ================= ACTION HANDLER =================
function handleJobActions(e) {

    const btn = e.target.closest(".action-btn");
    if (!btn) return;

    const action = btn.dataset.action;
    const id = decodeURIComponent(btn.dataset.id);

    switch (action) {
        case "edit":
            window.location.href = `provider-post-job.html?jobId=${encodeURIComponent(id)}`;
            break;

        case "view":
            window.location.href =
                `provider-job-applications.html?jobId=${encodeURIComponent(id)}`;
            break;

        case "close":
            openConfirmModal(
                "Close Job",
                "Are you sure you want to close this job?",
                async () => await jobAction(`${JOBS_URL}/${id}/close`)
            );
            break;

        case "reopen":
            openConfirmModal(
                "Reopen Job",
                "Are you sure you want to reopen this job?",
                async () => await jobAction(`${JOBS_URL}/${id}/reopen`)
            );
            break;
    }
}

// ================= JOB ACTION =================
async function jobAction(url) {

    try {

        const res = await fetch(url, {
            method: "PUT",
            headers: { Authorization: "Bearer " + getToken() }
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        showToast("Action successful.");
        loadJobs(currentFilter, currentPage);

    } catch (err) {
        console.error("Job action error:", err);
        showToast("Action failed.", true);
    }
}

// ================= STATUS META =================
function getStatusMeta(status) {
    switch (status) {
        case "ACTIVE":
            return { label: "ACTIVE", badgeClass: "badge-active", cardClass: "job-active" };
        case "PENDING_APPROVAL":
            return { label: "PENDING", badgeClass: "badge-pending", cardClass: "job-pending" };
        case "CLOSED":
        case "EXPIRED":
            return { label: "CLOSED", badgeClass: "badge-closed", cardClass: "job-closed" };
        default:
            return { label: status || "UNKNOWN", badgeClass: "", cardClass: "" };
    }
}

// ================= MODAL =================
function openConfirmModal(title, message, onConfirm) {

    const modal = document.getElementById("confirmModal");
    const okBtn = document.getElementById("confirmOk");
    const cancelBtn = document.getElementById("confirmCancel");

    document.getElementById("confirmTitle").textContent = title;
    document.getElementById("confirmMessage").textContent = message;

    modal.classList.remove("hidden");

    const close = () => {
        okBtn.disabled = false;
        modal.classList.add("hidden");
    };

    cancelBtn.onclick = close;

    okBtn.onclick = async () => {
        okBtn.disabled = true;
        await onConfirm();
        close();
    };
}

// ================= UI STATES =================
function showLoading(state, container) {
    state.innerHTML = `
        <div class="spinner-box">
            <div class="spinner"></div>
        </div>
    `;
    state.classList.remove("hidden");
    state.setAttribute("aria-busy", "true");
    container.classList.add("hidden");
}

function showError(state, container, message) {
    state.innerHTML = `<div class="error-box">${escapeHtml(message)}</div>`;
    state.classList.remove("hidden");
    container.classList.add("hidden");
}

// ================= TOAST =================
function showToast(message, isError = false) {

    const toast = document.createElement("div");
    toast.className = `toast-message ${isError ? "toast-error" : "toast-success"}`;
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 3000);
}

// ================= HELPERS =================
function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text ?? "";
    return div.innerHTML;
}