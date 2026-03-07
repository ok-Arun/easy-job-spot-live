/* ================= CONFIG ================= */

const API_BASE = `${window.APP_CONFIG.API_BASE_URL}/admin/providers`;

let selectedProviderId = null;
let actionType = null;

document.addEventListener("DOMContentLoaded", () => {

    closeConfirmModal();

    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "/login.html";
        return;
    }

    fetchPendingProviders();
});


/* ================= FETCH ================= */

async function fetchPendingProviders() {

    try {

        const response = await fetch(`${API_BASE}/pending`, {
            headers: {
                "Authorization": "Bearer " + localStorage.getItem("token")
            }
        });

        const result = await response.json();
        const data = result.data || result;

        document.getElementById("totalPending").innerText =
            data.totalPending || 0;

        const providers = data.providers || [];

        renderProvidersTable(providers);
        renderProvidersCards(providers);

    } catch (error) {

        console.error("Error fetching providers:", error);

    }
}


/* ================= DESKTOP TABLE ================= */

function renderProvidersTable(providers) {

    const tbody = document.getElementById("providersTableBody");

    if (!providers.length) {

        tbody.innerHTML =
            `<tr><td colspan="4" class="empty-row">No pending providers</td></tr>`;

        return;
    }

    tbody.innerHTML = providers.map(provider => {

        return `
        <tr>

            <td>${provider.name}</td>

            <td>${provider.email}</td>

            <td>
                <span class="badge badge-pending">
                    ${provider.providerStatus}
                </span>
            </td>

            <td>

                <button class="approve-btn"
                    onclick="openConfirmModal('approve', ${JSON.stringify(provider).replace(/"/g,'&quot;')})">
                    Approve
                </button>

                <button class="reject-btn"
                    onclick="openConfirmModal('reject', ${JSON.stringify(provider).replace(/"/g,'&quot;')})">
                    Reject
                </button>

            </td>

        </tr>
        `;

    }).join("");

}


/* ================= MOBILE CARDS ================= */

function renderProvidersCards(providers) {

    const cardsContainer = document.getElementById("providersCards");

    if (!cardsContainer) return;

    if (!providers.length) {

        cardsContainer.innerHTML =
            `<div class="empty-row">No pending providers</div>`;

        return;
    }

    cardsContainer.innerHTML = providers.map(provider => {

        return `
        <div class="provider-card">

            <div class="provider-header">

                <span class="provider-name">${provider.name}</span>

                <span class="badge badge-pending">
                    ${provider.providerStatus}
                </span>

            </div>

            <div class="provider-email">
                ${provider.email}
            </div>

            <div class="provider-actions">

                <button class="approve-btn"
                    onclick="openConfirmModal('approve', ${JSON.stringify(provider).replace(/"/g,'&quot;')})">
                    Approve
                </button>

                <button class="reject-btn"
                    onclick="openConfirmModal('reject', ${JSON.stringify(provider).replace(/"/g,'&quot;')})">
                    Reject
                </button>

            </div>

        </div>
        `;

    }).join("");

}


/* ================= MODAL CONTROL ================= */

function openConfirmModal(type, provider) {

    selectedProviderId = provider.id;
    actionType = type;

    const modal = document.getElementById("confirmModal");
    const title = document.getElementById("confirmTitle");
    const message = document.getElementById("confirmMessage");
    const actionBtn = document.getElementById("confirmActionBtn");

    if (type === "approve") {

        title.innerText = "Approve Provider";
        message.innerText = `Approve "${provider.name}"?`;
        actionBtn.innerText = "Approve";
        actionBtn.className = "approve-btn";

    } else {

        title.innerText = "Reject Provider";
        message.innerText = `Reject "${provider.name}"?`;
        actionBtn.innerText = "Reject";
        actionBtn.className = "reject-btn";

    }

    actionBtn.onclick = confirmAction;

    modal.classList.add("show");

}

function closeConfirmModal() {

    document.getElementById("confirmModal")
        .classList.remove("show");

}


/* ================= ACTION ================= */

async function confirmAction() {

    if (!selectedProviderId) return;

    const endpoint =
        actionType === "approve"
            ? `${API_BASE}/${selectedProviderId}/approve`
            : `${API_BASE}/${selectedProviderId}/reject`;

    try {

        await fetch(endpoint, {
            method: "PUT",
            headers: {
                "Authorization": "Bearer " + localStorage.getItem("token")
            }
        });

        closeConfirmModal();
        fetchPendingProviders();

    } catch (error) {

        console.error("Action failed:", error);

    }
}