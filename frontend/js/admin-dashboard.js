// ================= CONFIG =================
const API_BASE = `${window.APP_CONFIG.API_BASE_URL}/admin/dashboard`;

let jobsChart = null;
let applicationsChart = null;
let hiringChart = null;


// ================= INIT =================
document.addEventListener("DOMContentLoaded", () => {

    const token = localStorage.getItem("token");

    if (!token) {
        window.location.replace("/pages/login.html");
        return;
    }

    highlightSidebar();
    setupLogout();
    fetchStats(token);
    fetchTrends(token);
});


// ================= SIDEBAR =================
function highlightSidebar() {

    const links = document.querySelectorAll(".sidebar a");
    const currentPage = window.location.pathname.split("/").pop().toLowerCase();

    links.forEach(link => {

        link.classList.remove("active");

        if (link.getAttribute("href").toLowerCase() === currentPage) {
            link.classList.add("active");
        }

    });

}


// ================= LOGOUT =================
function setupLogout() {

    const logoutBtn = document.querySelector(".logout-btn");

    if (!logoutBtn) return;

    logoutBtn.addEventListener("click", () => {

        localStorage.removeItem("token");
        window.location.replace("/pages/login.html");

    });

}


// ================= FETCH STATS =================
async function fetchStats(token) {

    try {

        const response = await fetch(`${API_BASE}/stats`, {
            headers: { Authorization: "Bearer " + token }
        });

        if (!response.ok) {
            console.error("Stats API failed", response.status);
            return;
        }

        const result = await response.json();
        const data = result.data || {};

        setText("totalJobs", data.jobs?.total);
        setText("pendingJobs", data.jobs?.pending);
        setText("activeJobs", data.jobs?.active);

        setText("totalApplications", data.applications?.total);
        setText("shortlisted", data.applications?.shortlisted);
        setText("rejected", data.applications?.rejected);
        setText("hired", data.applications?.hired);

        if (data.users) {
            setText("totalUsers", data.users?.total);
            setText("jobSeekers", data.users?.jobSeekers);
            setText("providers", data.users?.providers);
            setText("admins", data.users?.admins);
            setText("pendingProviders", data.users?.pendingProviders);
        }

    } catch (error) {

        console.error("Failed to fetch stats:", error);

    }

}


// ================= FETCH TRENDS =================
async function fetchTrends(token) {

    try {

        const response = await fetch(`${API_BASE}/trends`, {
            headers: { Authorization: "Bearer " + token }
        });

        if (!response.ok) {
            console.error("Trends API failed", response.status);
            return;
        }

        const result = await response.json();
        const data = result.data || {};

        renderJobsTrend(data.jobs);
        renderApplicationsTrend(data.applications);
        renderHiringFunnel(data.hiringFunnel);

    } catch (error) {

        console.error("Failed to fetch trends:", error);

    }

}


// ================= SAFE TEXT SETTER =================
function setText(id, value) {

    const el = document.getElementById(id);

    if (el) {
        el.innerText = value ?? 0;
    }

}


// ================= JOB TREND CHART =================
function renderJobsTrend(jobs) {

    if (!jobs) return;

    if (jobsChart) jobsChart.destroy();

    jobsChart = new Chart(
        document.getElementById("jobsTrendChart"),
        {
            type: "bar",
            data: {
                labels: ["Created (30d)", "Approved (30d)"],
                datasets: [{
                    data: [
                        jobs.created?.last30Days || 0,
                        jobs.approved?.last30Days || 0
                    ],
                    backgroundColor: ["#3b82f6", "#10b981"]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                }
            }
        }
    );

}


// ================= APPLICATIONS TREND =================
function renderApplicationsTrend(applications) {

    if (!applications) return;

    if (applicationsChart) applicationsChart.destroy();

    const last30 = applications.received?.last30Days || 0;
    const last7 = applications.received?.last7Days || 0;

    const previous23Days = Math.max(last30 - last7, 0);

    applicationsChart = new Chart(
        document.getElementById("applicationsTrendChart"),
        {
            type: "line",
            data: {
                labels: ["Previous 23 Days", "Last 7 Days"],
                datasets: [{
                    label: "Applications",
                    data: [previous23Days, last7],
                    borderColor: "#6366f1",
                    backgroundColor: "rgba(99,102,241,0.25)",
                    tension: 0.35,
                    fill: true,
                    pointRadius: 5,
                    pointBackgroundColor: "#6366f1"
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: "#94a3b8" }
                    },
                    y: {
                        beginAtZero: true,
                        grid: { color: "rgba(148,163,184,0.15)" },
                        ticks: { color: "#94a3b8" }
                    }
                }
            }
        }
    );

}


// ================= HIRING FUNNEL =================
function renderHiringFunnel(funnel) {

    if (!funnel) return;

    const applied = funnel.applied || 0;
    const shortlisted = funnel.shortlisted || 0;
    const rejected = funnel.rejected || 0;
    const hired = funnel.hired || 0;

    setText("funnelApplied", applied);
    setText("funnelShortlisted", shortlisted);
    setText("funnelRejected", rejected);
    setText("funnelHired", hired);

    if (hiringChart) hiringChart.destroy();

    hiringChart = new Chart(
        document.getElementById("hiringFunnelChart"),
        {
            type: "doughnut",
            data: {
                labels: ["Applied", "Shortlisted", "Rejected", "Hired"],
                datasets: [{
                    data: [applied, shortlisted, rejected, hired],
                    backgroundColor: [
                        "#2563eb",
                        "#14b8a6",
                        "#dc2626",
                        "#16a34a"
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: "70%",
                plugins: {
                    legend: { display: false }
                }
            }
        }
    );

}