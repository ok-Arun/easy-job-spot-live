// ===== AUTH GUARD =====
(function () {


const token = localStorage.getItem("token");

if (!token) {
    window.location.href = "/pages/login.html";
    return;
}

// ===== FETCH WRAPPER WITH AUTO LOGOUT =====
async function secureFetch(url, options = {}) {

    const token = localStorage.getItem("token");

    const res = await fetch(url, {
        ...options,
        headers: {
            ...(options.headers || {}),
            Authorization: "Bearer " + token
        }
    });

    if (res.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/pages/login.html";
        return;
    }

    return res;
}

window.secureFetch = secureFetch;

// ===== DOM READY =====
document.addEventListener("DOMContentLoaded", async () => {

    // ===== LOAD GLOBAL SIDEBAR =====
    const sidebarContainer = document.getElementById("adminSidebar");

    if (sidebarContainer) {
        try {
            const res = await fetch("/pages/admin-sidebar.html");
            const html = await res.text();
            sidebarContainer.innerHTML = html;
        } catch (err) {
            console.error("Failed to load sidebar:", err);
        }
    }

    // ===== LOAD GLOBAL HEADER =====
    const headerContainer = document.getElementById("adminHeader");

    if (headerContainer) {
        try {
            const res = await fetch("/pages/admin-header.html");
            const html = await res.text();
            headerContainer.innerHTML = html;

            // ===== SET PAGE TITLE =====
            const pageTitle = headerContainer.querySelector("#pageTitle");

            if (pageTitle) {

                const page = window.location.pathname.split("/").pop();

                const titles = {
                    "admin-dashboard.html": "Admin Dashboard",
                    "admin-all-jobs.html": "All Jobs",
                    "admin-job-moderation.html": "Job Moderation",
                    "admin-all-users.html": "All Users",
                    "admin-provider-approval.html": "Provider Approvals"
                };

                pageTitle.textContent = titles[page] || "Admin Panel";
            }

            // ===== LOGOUT BUTTON =====
            const logoutBtn = headerContainer.querySelector(".logout-btn");

            if (logoutBtn) {
                logoutBtn.addEventListener("click", () => {
                    localStorage.removeItem("token");
                    window.location.href = "/pages/login.html";
                });
            }

        } catch (err) {
            console.error("Failed to load header:", err);
        }
    }

    // IMPORTANT: run after both components exist
    initializeSidebar();

});

// ===== SIDEBAR INITIALIZATION =====
function initializeSidebar() {

    const toggleBtn = document.querySelector(".menu-toggle");
    const sidebar = document.querySelector(".sidebar");
    const overlay = document.querySelector(".sidebar-overlay");

    if (!sidebar) return;

    // ===== MOBILE TOGGLE =====
    if (toggleBtn && overlay) {

        toggleBtn.addEventListener("click", () => {
            sidebar.classList.toggle("active");
            overlay.classList.toggle("active");
            document.body.classList.toggle("no-scroll");
        });

        overlay.addEventListener("click", () => {
            sidebar.classList.remove("active");
            overlay.classList.remove("active");
            document.body.classList.remove("no-scroll");
        });

        const sidebarLinks = document.querySelectorAll(".sidebar a");

        sidebarLinks.forEach(link => {
            link.addEventListener("click", () => {
                if (window.innerWidth <= 900) {
                    sidebar.classList.remove("active");
                    overlay.classList.remove("active");
                    document.body.classList.remove("no-scroll");
                }
            });
        });
    }

    // ===== AUTO ACTIVE LINK =====
    const currentPage = window.location.pathname.split("/").pop();
    const links = document.querySelectorAll(".sidebar a");

    links.forEach(link => {

        const href = link.getAttribute("href");

        if (href === currentPage) {
            link.classList.add("active");
        }

    });

}


})();
