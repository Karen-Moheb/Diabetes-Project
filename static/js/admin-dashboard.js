document.addEventListener("DOMContentLoaded", function () {

    // =====================================
    // ADMIN ACCESS CHECK
    // =====================================

    const dashboard = document.getElementById("dashboardLayout");
    const accessDenied = document.getElementById("accessDenied");

    if (
        sessionStorage.getItem("adminLoggedIn") !== "true" ||
        sessionStorage.getItem("userRole") !== "admin"
    ) {
        dashboard.hidden = true;
        accessDenied.hidden = false;
        return;
    }

    dashboard.hidden = false;
    accessDenied.hidden = true;


    // =====================================
    // DISPLAY CURRENT ADMIN INFORMATION
    // =====================================

    const adminName =
        sessionStorage.getItem("adminName") ||
        localStorage.getItem("diabetesUsername") ||
        "Admin";

    const adminEmail =
        sessionStorage.getItem("adminEmail") ||
        "Not available";

    const welcomeName = document.getElementById("adminWelcomeName");
    const fullName = document.getElementById("adminFullName");
    const email = document.getElementById("adminEmail");

    if (welcomeName) {
        welcomeName.textContent = adminName;
    }

    if (fullName) {
        fullName.textContent = adminName;
    }

    if (email) {
        email.textContent = adminEmail;
    }



    // =====================================
    // FETCH REGISTERED USERS FROM DATABASE
    // =====================================

    async function fetchRegisteredUsers() {

        try {

            const response = await fetch("/api/admin/users");

            if (!response.ok) {
                throw new Error("Failed to load registered users.");
            }

            const users = await response.json();

            return users;

        } catch (error) {

            console.error("Users loading error:", error);

            return [];

        }
    }

    // =====================================
    // SAFE TEXT DISPLAY
    // =====================================

    function safe(value) {

        return String(value ?? "").replace(/[&<>"']/g, function (char) {

            return {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;"
            }[char];

        });
    }


    // =====================================
    // RESULT CHECK
    // =====================================

    function isPositive(result) {

        const value = String(result ?? "").toLowerCase();

        return (
            value === "1" ||
            value.includes("positive") ||
            value.includes("diabetic")
        );
    }


    // =====================================
    // DATE FORMAT
    // =====================================

    function formatDate(value) {

        if (!value) return "—";

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return safe(value);
        }

        return date.toLocaleString();
    }


    // =====================================
    // NOTIFICATION COUNT
    // =====================================

    async function updateNotificationCount() {

        const notificationCount =
            document.getElementById("notificationCount");

        const notificationBtn =
            document.getElementById("notificationBtn");

        try {
            const response = await fetch("/api/admin/messages");
            cache: "no-store"

            if (!response.ok) {
                throw new Error("Failed to load notifications.");
            }

            const messages = await response.json();

            const unreadCount = messages.filter(message =>
                message.read !== true
            ).length;

            notificationCount.textContent =
                unreadCount > 99 ? "99+" : unreadCount;

            notificationCount.hidden = unreadCount === 0;

            notificationBtn.setAttribute(
                "aria-label",
                unreadCount === 0
                    ? "No new messages"
                    : `${unreadCount} unread contact messages`
            );

        } catch (error) {
            console.error("Notification loading error:", error);
        }
    }



    // =====================================
    // OVERVIEW STATISTICS
    // =====================================

    async function renderOverview() {

        try {
            const users = await fetchRegisteredUsers();

            const [assessmentsResponse, messagesResponse] =
                await Promise.all([
                    fetch("/api/admin/assessments", {
                        cache: "no-store"
                    }),

                    fetch("/api/admin/messages", {
                        cache: "no-store"
                    })
                ]);

            if (!assessmentsResponse.ok || !messagesResponse.ok) {
                throw new Error("Failed to load dashboard statistics.");
            }

            const assessments = await assessmentsResponse.json();
            const messages = await messagesResponse.json();
            const positive = assessments.filter(item =>
                isPositive(item.result)
            ).length;

            const negative = assessments.filter(item => {
                const value = String(item.result ?? "").toLowerCase();

                return value === "0" || value.includes("negative");
            }).length;

            document.getElementById("totalUsers").textContent =
                users.length;

            document.getElementById("totalAssessments").textContent =
                assessments.length;

            document.getElementById("positiveResults").textContent =
                positive;

            document.getElementById("negativeResults").textContent =
                negative;

            document.getElementById("usersTotal").textContent =
                users.length + " Users";

            document.getElementById("assessmentsTotal").textContent =
                assessments.length + " Assessments";

            document.getElementById("messagesTotal").textContent =
                messages.length + " Messages";

            await updateNotificationCount();

        } catch (error) {
            console.error("Overview loading error:", error);
        }
    }


    // =====================================
    // REGISTERED USERS
    // =====================================


    async function renderUsers() {

        const users = await fetchRegisteredUsers();

        const table = document.getElementById("usersTable");

        if (users.length === 0) {

            table.innerHTML = `
                <tr>
                    <td colspan="7" class="empty-state">
                        No registered users yet.
                    </td>
                </tr>
            `;

            return;
        }

        table.innerHTML = users.map((user, index) => `

            <tr>

                <td>${index + 1}</td>

                <td>${safe(user.name || user.username || "—")}</td>

                <td>${safe(user.email || "—")}</td>

                <td>${safe(user.phone || "Not provided")}</td>

                <td>${safe(user.gender || "Not provided")}</td>

                <td>${safe(user.memberSince || "—")}</td>

                <td>
                    <span class="result-badge negative">
                        Active
                    </span>
                </td>

            </tr>

        `).join("");

    }


    // =====================================
    // ASSESSMENT HISTORY
    // =====================================


    async function renderAssessments() {

        const table = document.getElementById("assessmentsTable");

        try {

            const response = await fetch("/api/admin/assessments");

            if (!response.ok) {
                throw new Error("Failed to load assessments.");
            }

            const assessments = await response.json();

            if (assessments.length === 0) {

                table.innerHTML = `
                    <tr>
                        <td colspan="9" class="empty-state">
                            No assessment records yet.
                        </td>
                    </tr>
                `;

                return;
            }

            table.innerHTML = assessments.map((item, index) => {

                const positive = isPositive(item.result);
                const resultText = positive ? "Positive" : "Negative";

                return `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${formatDate(item.date)}</td>
                        <td style="white-space: nowrap;">
                            ${safe(item.user || "—")}
                        </td>
                        <td>${safe(item.glucose ?? "—")}</td>
                        <td>${safe(item.bloodPressure ?? "—")}</td>
                        <td>${safe(item.bmi ?? "—")}</td>
                        <td>${safe(item.age ?? "—")}</td>
                        <td>${safe(item.probability ?? "—")}%</td>
                        <td>
                            <span class="result-badge ${positive ? "positive" : "negative"}">
                                ${resultText}
                            </span>
                        </td>
                    </tr>
                `;

            }).join("");

        } catch (error) {

            console.error("Assessment loading error:", error);

            table.innerHTML = `
                <tr>
                    <td colspan="9" class="empty-state">
                        Could not load assessment records.
                    </td>
                </tr>
            `;
        }
    }


    // =====================================
    // CONTACT MESSAGES
    // =====================================



    async function renderMessages() {

        const container = document.getElementById("messagesList");

        try {
            const response = await fetch("/api/admin/messages", {
                cache: "no-store"
            });

            if (!response.ok) {
                throw new Error("Failed to load messages.");
            }

            const messages = await response.json();

            if (messages.length === 0) {
                container.innerHTML = `
                    <p class="empty-state">
                        No contact messages yet.
                    </p>
                `;
                updateNotificationCount();
                return;
            }

            container.innerHTML = messages.map((message) => {

                const unread = message.read !== true;

                return `
                    <article class="message-card ${unread ? "unread" : ""}">

                        <div class="message-top">
                            <div class="message-sender">
                                <h3>${safe(message.name || "Unknown Sender")}</h3>
                                <p>${safe(message.email || "No email")}</p>
                                <p class="message-date">${formatDate(message.date)}</p>
                            </div>

                            <span class="message-status ${unread ? "unread" : "read"}">
                                ${unread ? "Unread" : "Read"}
                            </span>
                        </div>

                        <p class="message-text">
                            ${safe(message.message || "")}
                        </p>

                        <div class="message-actions">

                            <button
                                class="read-btn"
                                data-action="toggle-read"
                                data-id="${message.id}"
                                data-read="${unread}">
                                ${unread ? "Mark as Read" : "Mark as Unread"}
                            </button>

                            <button
                                class="delete-btn"
                                data-action="delete"
                                data-id="${message.id}">
                                <i class="fa-solid fa-trash"></i>
                                Delete
                            </button>

                        </div>

                    </article>
                `;

            }).join("");

            updateNotificationCount();

        } catch (error) {
            console.error("Messages loading error:", error);
            container.innerHTML = `
                <p class="empty-state">
                    Could not load contact messages.
                </p>
            `;
        }
    }


    // =====================================
    // NOTIFICATION BUTTON
    // =====================================

    document.getElementById("notificationBtn")
        .addEventListener("click", function () {

            const messagesSection =
                document.getElementById("messagesSection");

            messagesSection.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        });


    // =====================================
    // QUICK ACTIONS
    // =====================================

    document.querySelectorAll(".action-card").forEach(button => {

        button.addEventListener("click", function () {

            const target = document.getElementById(
                this.dataset.target
            );

            if (target) {

                target.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

            }

        });

    });


    // =====================================
    // AUTO REFRESH FROM DATABASE
    // =====================================

    // Refresh messages and dashboard statistics every 2 seconds
    setInterval(async function () {

        await renderMessages();
        await renderOverview();

    }, 2000);


    // =====================================
    // CONTACT MESSAGE ACTIONS
    // =====================================

    // Handle Mark as Read, Mark as Unread, and Delete buttons
    document.addEventListener("click", async function (event) {

        // Get the clicked action button
        const button = event.target.closest("button[data-action]");

        if (!button) return;

        const action = button.dataset.action;
        const messageId = button.dataset.id;

        // Mark message as Read or Unread
        if (action === "toggle-read") {

            const newReadStatus = button.dataset.read === "true";

            try {
                const response = await fetch(
                    `/api/admin/messages/${messageId}/read`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            read: newReadStatus
                        })
                    }
                );

                if (!response.ok) throw new Error("Could not update message.");

                await renderMessages();
                await updateNotificationCount();
                await renderOverview();

            } catch (error) {
                alert(error.message);
            }
        }

        // Delete message from database
        if (action === "delete") {

            if (!confirm("Are you sure you want to delete this message?")) {
                return;
            }

            try {
                const response = await fetch(
                    `/api/admin/messages/${messageId}`,
                    { method: "DELETE" }
                );

                if (!response.ok) throw new Error("Could not delete message.");

                await renderMessages();
                await renderOverview();

            } catch (error) {
                alert(error.message);
            }
        }

    });

    // =====================================
    // LOGOUT
    // =====================================

    document.getElementById("logoutBtn").addEventListener("click", function () {

        sessionStorage.removeItem("adminLoggedIn");
        sessionStorage.removeItem("userRole");
        sessionStorage.removeItem("adminName");
        sessionStorage.removeItem("adminEmail");

        localStorage.removeItem("diabetesUsername");

        window.location.href = "/login";

    });


    // =====================================
    // INITIAL DISPLAY
    // =====================================

    renderOverview();
    renderUsers();
    renderAssessments();
    renderMessages();

});