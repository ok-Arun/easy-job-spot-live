const API_BASE = `${window.APP_CONFIG.API_BASE_URL}/admin/jobs`;
const token = localStorage.getItem("token");

let selectedJobId = null;
let selectedAction = null;

document.addEventListener("DOMContentLoaded", () => {

    if (!token) {
        window.location.href = "/login.html";
        return;
    }

    applyURLFilter();
    fetchAllJobs();

    document.getElementById("filterBtn").addEventListener("click", () => {
        fetchAllJobs();
    });
});


/* ================= URL FILTER ================= */

function applyURLFilter() {
    const params = new URLSearchParams(window.location.search);
    const statusFromURL = params.get("status");

    const dropdown = document.getElementById("statusFilter");

    if (statusFromURL && dropdown) {
        dropdown.value = statusFromURL;
    }
}


/* ================= FETCH JOBS ================= */

async function fetchAllJobs() {

    const status = document.getElementById("statusFilter").value;

    let url = API_BASE;

    if (status && status.trim() !== "") {
        url += `?status=${status}`;
    }

    try {
        const response = await fetch(url, {
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        const result = await response.json();

        if (!result.success) {
            alert("Failed to load jobs");
            return;
        }

        renderJobs(result.data.content);

    } catch (error) {
        console.error(error);
        alert("Error loading jobs");
    }
}


/* ================= RENDER CARDS ================= */

function renderJobs(jobs) {

    const container = document.getElementById("allJobsTableBody");
    const jobCount = document.getElementById("jobCount");

    container.innerHTML = "";
    jobCount.textContent = `Total: ${jobs ? jobs.length : 0}`;

    if (!jobs || jobs.length === 0) {
        container.innerHTML = `
            <div style="padding:40px; text-align:center; color:#94a3b8;">
                No jobs found.
            </div>
        `;
        return;
    }

    jobs.forEach(job => {

        const applicantCount = job.totalApplicants ?? 0;

        const card = document.createElement("div");
        card.className = "job-card";

        card.innerHTML = `
            <div class="job-main">

                <div class="job-top-row">
                    <span class="status-badge ${job.status}">
                        ${job.status}
                    </span>
                </div>

                <div class="job-title">${job.title}</div>

                <div class="job-meta">
                    ${job.company} • ${job.location}
                </div>

                <div class="job-meta">
                    ${applicantCount} Applicants
                </div>

                <div class="job-date">
                    Posted On: ${formatDate(job.createdAt)}
                </div>

            </div>

            <div class="job-actions">
                ${renderActions(job)}
            </div>
        `;

        container.appendChild(card);
    });
}


/* ================= ACTION BUTTONS ================= */

function renderActions(job) {

    const viewBtn = `
        <button class="view-btn"
                onclick="viewApplications('${job.id}')">
            Applicants
        </button>
    `;

    if (job.status === "REMOVED_BY_ADMIN") {
        return `
            ${viewBtn}
            <button class="restore-btn"
                    onclick="openModal('restore','${job.id}')">
                Restore
            </button>
        `;
    }

    if (job.status === "CLOSED" || job.status === "REJECTED" || job.status === "EXPIRED") {
        return `
            ${viewBtn}
            <button class="remove-btn"
                    onclick="openModal('remove','${job.id}')">
                Remove
            </button>
        `;
    }

    return `
        ${viewBtn}
        <button class="close-btn"
                onclick="openModal('close','${job.id}')">
            Close
        </button>
        <button class="remove-btn"
                onclick="openModal('remove','${job.id}')">
            Remove
        </button>
    `;
}


/* ================= MODAL LOGIC ================= */

function openModal(action, jobId) {

    selectedAction = action;
    selectedJobId = jobId;

    const modal = document.getElementById("actionModal");
    const title = document.getElementById("actionTitle");
    const message = document.getElementById("actionMessage");
    const confirmBtn = document.getElementById("confirmActionBtn");

    modal.classList.remove("hidden");

    if (action === "close") {
        title.textContent = "Close Job";
        message.textContent = "Are you sure you want to close this job?";
        confirmBtn.textContent = "Close";
    }

    if (action === "remove") {
        title.textContent = "Remove Job";
        message.textContent = "This will permanently remove the job. Continue?";
        confirmBtn.textContent = "Remove";
    }

    if (action === "restore") {
        title.textContent = "Restore Job";
        message.textContent = "Do you want to restore this job?";
        confirmBtn.textContent = "Restore";
    }

    confirmBtn.onclick = confirmAction;
}

function closeActionModal() {
    document.getElementById("actionModal").classList.add("hidden");
    selectedJobId = null;
    selectedAction = null;
}


/* ================= CONFIRM ACTION ================= */

async function confirmAction() {

    if (!selectedJobId || !selectedAction) return;

    let endpoint = "";

    if (selectedAction === "close") {
        endpoint = `/${selectedJobId}/close`;
    }

    if (selectedAction === "remove") {
        endpoint = `/${selectedJobId}/remove`;
    }

    if (selectedAction === "restore") {
        endpoint = `/${selectedJobId}/restore`;
    }

    try {
        const response = await fetch(API_BASE + endpoint, {
            method: "PUT",
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        const result = await response.json();

        if (!result.success) {
            alert("Action failed");
            return;
        }

        closeActionModal();
        fetchAllJobs(); // refresh list

    } catch (error) {
        console.error(error);
        alert("Something went wrong");
    }
}


/* ================= VIEW APPLICATIONS ================= */

function viewApplications(jobId) {
    window.location.href = `admin-job-applications.html?jobId=${jobId}`;
}


/* ================= UTIL ================= */

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString();
}