/* ================= CONFIG ================= */

const API_BASE = `${window.APP_CONFIG.API_BASE_URL}/admin/users`;
const token = localStorage.getItem("token");

if (!token) location.href = "/login.html";


/* ================= STATE ================= */

let currentPage = 0;
const pageSize = 10;

let deleteUserId = null;
let deleteUserName = null;


/* ================= DOM ================= */

const searchInput = document.getElementById("searchInput");
const roleFilter = document.getElementById("roleFilter");
const usersTable = document.getElementById("usersTable");
const usersCards = document.getElementById("usersCards");


/* ================= INIT ================= */

document.addEventListener("DOMContentLoaded", () => {
    applyURLFilter();
    loadUsers(0);
});


/* ================= FILTER FROM URL ================= */

function applyURLFilter() {

    const params = new URLSearchParams(window.location.search);
    const userTypeFromURL = params.get("userType");

    if (userTypeFromURL) {
        roleFilter.value = userTypeFromURL;
    }

}


/* ================= BUILD API URL ================= */

function buildURL(page) {

    const search = searchInput.value.trim();
    const userType = roleFilter.value;

    let url = `${API_BASE}?page=${page}&size=${pageSize}`;

    if (search) {
        url += `&search=${encodeURIComponent(search)}`;
    }

    if (userType) {
        url += `&userType=${encodeURIComponent(userType)}`;
    }

    return url;

}


/* ================= FETCH USERS ================= */

async function loadUsers(page = 0) {

    try {

        currentPage = page;

        const res = await fetch(buildURL(page), {
            headers: { Authorization: "Bearer " + token }
        });

        const result = await res.json();

        if (!result.success) {
            alert("Failed to load users");
            return;
        }

        const data = result.data;
        const pageData = data.users;
        const users = pageData.content || [];

        updateStats(data);
        renderTable(users);
        renderCards(users);
        renderPagination(pageData);

    } catch (err) {

        console.error(err);
        alert("Error loading users");

    }

}


/* ================= UPDATE STATS ================= */

function updateStats(data) {

    document.getElementById("totalUsers").innerText = data.totalUsers;
    document.getElementById("seekers").innerText = data.seekers;
    document.getElementById("providers").innerText = data.providers;
    document.getElementById("admins").innerText = data.admins;

}


/* ================= STATUS HELPERS ================= */

function getStatusData(user) {

    if (user.userType === "JOB_PROVIDER") {

        if (user.providerStatus === "PENDING") {
            return { class: "status-pending", text: "PENDING" };
        }

        if (user.providerStatus === "APPROVED") {
            return { class: "status-active", text: "APPROVED" };
        }

    }

    return { class: "status-active", text: "ACTIVE" };

}


/* ================= TABLE ================= */

function renderTable(users) {

    if (!users.length) {

        usersTable.innerHTML =
            `<tr><td colspan="5" class="empty-row">No users found</td></tr>`;

        return;
    }

    usersTable.innerHTML = users.map(user => {

        const status = getStatusData(user);

        return `
        <tr>

            <td>${user.name}</td>

            <td>${user.email}</td>

            <td>
                <span class="role-badge ${user.userType}">
                    ${user.userType.replace("_", " ")}
                </span>
            </td>

            <td>
                <span class="${status.class}">
                    ${status.text}
                </span>
            </td>

            <td>
                <button class="delete-btn"
                    onclick="openDeleteModal('${user.id}','${user.name}')">
                    Delete
                </button>
            </td>

        </tr>
        `;

    }).join("");

}


/* ================= MOBILE CARDS ================= */

function renderCards(users) {

    if (!usersCards) return;

    if (!users.length) {

        usersCards.innerHTML =
            `<div class="empty-row">No users found</div>`;

        return;
    }

    usersCards.innerHTML = users.map(user => {

        const status = getStatusData(user);

        return `
        <div class="user-card">

            <div class="user-header">

                <span class="user-name">${user.name}</span>

                <span class="status-badge ${status.class}">
                    ● ${status.text}
                </span>

            </div>

            <div class="user-email">${user.email}</div>

            <div class="user-role">

                <span class="role-badge ${user.userType}">
                    ${user.userType.replace("_", " ")}
                </span>

            </div>

            <button class="delete-btn"
                onclick="openDeleteModal('${user.id}','${user.name}')">
                Delete
            </button>

        </div>
        `;

    }).join("");

}


/* ================= PAGINATION ================= */

function renderPagination(pageData) {

    const container = document.getElementById("pagination");

    if (!container) return;

    const totalPages = pageData.totalPages;
    const pageNumber = pageData.number;

    let buttons = "";

    for (let i = 0; i < totalPages; i++) {

        buttons += `
        <button
            class="page-btn ${i === pageNumber ? "active" : ""}"
            onclick="loadUsers(${i})">

            ${i + 1}

        </button>
        `;
    }

    container.innerHTML = buttons;

}


/* ================= DELETE MODAL ================= */

function openDeleteModal(id, name) {

    deleteUserId = id;
    deleteUserName = name;

    document.getElementById("deleteUserName").innerText = name;

    document.getElementById("deleteModal").style.display = "flex";

}

function closeDeleteModal() {

    deleteUserId = null;
    deleteUserName = null;

    document.getElementById("deleteModal").style.display = "none";

}

async function confirmDeleteUser() {

    if (!deleteUserId) return;

    try {

        await fetch(`${API_BASE}/${deleteUserId}`, {
            method: "DELETE",
            headers: { Authorization: "Bearer " + token }
        });

        closeDeleteModal();
        loadUsers(currentPage);

    } catch (err) {

        console.error(err);
        alert("Failed to delete user");

    }

}


/* ================= FILTER EVENTS ================= */

searchInput.addEventListener("keypress", e => {

    if (e.key === "Enter") {
        loadUsers(0);
    }

});

roleFilter.addEventListener("change", () => loadUsers(0));