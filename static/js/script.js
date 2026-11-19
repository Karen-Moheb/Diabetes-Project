document.addEventListener("DOMContentLoaded", function () {

    // =====================================
    // ADMIN LOGIN DATA
    // =====================================



    // =====================================
    // SAFE LOCAL STORAGE READER
    // =====================================

    function getSavedData(key) {
        try {
            const data = JSON.parse(localStorage.getItem(key) || "[]");
            return Array.isArray(data) ? data : [];
        } catch {
            return [];
        }
    }


    // =====================================
    // PASSWORD TOGGLE + ICON
    // =====================================

    function setupPasswordToggle(buttonId, inputId) {

        const button = document.getElementById(buttonId);
        const input = document.getElementById(inputId);

        if (button && input) {

            button.addEventListener("click", function () {

                const isPassword = input.type === "password";

                input.type = isPassword ? "text" : "password";

                const icon = button.querySelector("i");

                if (icon) {
                    icon.classList.toggle("fa-eye", !isPassword);
                    icon.classList.toggle("fa-eye-slash", isPassword);
                }

                button.setAttribute(
                    "aria-label",
                    isPassword ? "Hide password" : "Show password"
                );

            });
        }
    }

    setupPasswordToggle("togglePassword", "password");
    setupPasswordToggle("toggleSignupPassword", "signupPassword");
    setupPasswordToggle("toggleConfirmPassword", "confirmPassword");


    // =====================================
    // USER DISPLAY + RISK ASSESSMENT LINK
    // =====================================

    const savedUsername = localStorage.getItem("diabetesUsername");

    const guestLinks = document.getElementById("guestLinks");
    const userLinks = document.getElementById("userLinks");
    const welcomeUser = document.getElementById("welcomeUser");
    const riskAssessmentLink = document.getElementById("riskAssessmentLink");

    if (guestLinks && userLinks) {

        if (savedUsername) {

            guestLinks.style.display = "none";

            userLinks.style.setProperty("display", "flex", "important");
            userLinks.style.flexDirection = "row";
            userLinks.style.alignItems = "center";
            userLinks.style.justifyContent = "center";
            userLinks.style.gap = "12px";
            userLinks.style.flexWrap = "nowrap";

        } else {

            guestLinks.style.display = "flex";
            userLinks.style.display = "none";

        }
    }

    // Show Risk Assessment only after login
    if (riskAssessmentLink) {

        riskAssessmentLink.style.display =
            savedUsername ? "inline-block" : "none";

    }

    if (welcomeUser) {

        welcomeUser.textContent = savedUsername
            ? "Welcome, " + savedUsername
            : "";

        welcomeUser.style.whiteSpace = "nowrap";
    }


    // =====================================
    // LOGOUT
    // =====================================

    const logoutBtn = document.getElementById("logoutBtn");

    if (logoutBtn) {

        logoutBtn.addEventListener("click", async function () {

            try {

                const response = await fetch("/api/logout", {
                    method: "POST"
                });

                if (response.ok) {

                    localStorage.removeItem("diabetesUsername");

                    sessionStorage.removeItem("userRole");
                    sessionStorage.removeItem("adminLoggedIn");
                    sessionStorage.removeItem("adminName");
                    sessionStorage.removeItem("adminEmail");

                    window.location.href = "/login";

                } else {

                    alert("Logout failed. Please try again.");

                }

            } catch (error) {

                console.error(error);
                alert("Could not connect to the server.");

            }

        });
    }


    // =====================================
    // LOGIN
    // =====================================



    const loginForm = document.getElementById("loginForm");

    if (loginForm) {

        loginForm.addEventListener("submit", async function (event) {

            event.preventDefault();

            const usernameInput = document.getElementById("username");
            const passwordInput = document.getElementById("password");
            const message = document.getElementById("loginMessage");

            if (!usernameInput || !passwordInput) return;

            const username = usernameInput.value.trim();
            const password = passwordInput.value;

            if (!username || !password) {
                if (message) {
                    message.textContent =
                        "Please enter your username and password.";
                }
                return;
            }

            try {

                const response = await fetch("/api/login", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        username: username,
                        password: password
                    })
                });

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.message || "Login failed.");
                }

                localStorage.setItem(
                    "diabetesUsername",
                    result.username
                );

                if (result.is_admin) {

                    sessionStorage.setItem("userRole", "admin");
                    sessionStorage.setItem("adminLoggedIn", "true");
                    sessionStorage.setItem("adminName", result.username);
                    sessionStorage.setItem("adminEmail", result.email);

                    window.location.href = "/admin-dashboard";

                } else {

                    sessionStorage.setItem("userRole", "user");
                    sessionStorage.removeItem("adminLoggedIn");
                    sessionStorage.removeItem("adminName");
                    sessionStorage.removeItem("adminEmail");

                    window.location.href = "/";
                }

            } catch (error) {

                if (message) {
                    message.textContent = error.message;
                } else {
                    alert(error.message);
                }

                console.error("Login error:", error);

            }

        });
    }



    // =====================================
    // SIGN UP
    // =====================================

    const signupForm = document.getElementById("signupForm");

    if (signupForm) {

        signupForm.addEventListener("submit", async function (event) {

            event.preventDefault();

            const username = document.getElementById("signupUsername").value.trim();
            const email = document.getElementById("signupEmail").value.trim();
            const phone = document.getElementById("signupPhone").value.trim();
            const gender = document.getElementById("signupGender").value;
            const password = document.getElementById("signupPassword").value;
            const confirmPassword = document.getElementById("confirmPassword").value;

            const terms = document.getElementById("terms");
            const message = document.getElementById("signupMessage");

            if (!username || !email || !phone || !password || !confirmPassword) {

                message.textContent = "Please fill in all required fields.";
                return;
            }

            if (password.length < 8) {

                message.textContent = "Password must be at least 8 characters.";
                return;
            }

            if (password !== confirmPassword) {

                message.textContent = "Passwords do not match.";
                return;
            }

            if (!terms.checked) {

                message.textContent = "Please accept the Terms & Conditions.";
                return;
            }

            try {

                const response = await fetch("/api/signup", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        username: username,
                        email: email,
                        phone: phone,
                        gender: gender,
                        password: password
                    })
                });

                const result = await response.json();

                if (!response.ok) {

                    message.textContent =
                        result.message || "Registration failed.";

                    return;
                }

                message.textContent = result.message;

                setTimeout(() => {
                    window.location.href = "/login";
                }, 1500);

            } catch (error) {

                message.textContent =
                    "Could not connect to the server.";

                console.error(error);

            }

        });
    }


    // =====================================
    // MOBILE MENU
    // =====================================

    const menuBtn = document.getElementById("menuBtn");
    const navLinks = document.getElementById("navLinks");

    if (menuBtn && navLinks) {

        menuBtn.addEventListener("click", function () {
            navLinks.classList.toggle("show");
        });

    }


    // =====================================
    // SMOOTH SCROLL
    // =====================================

    document.querySelectorAll('a[href^="#"]').forEach(function (link) {

        link.addEventListener("click", function (event) {

            const targetId = link.getAttribute("href");

            if (!targetId || targetId === "#") return;

            const target = document.querySelector(targetId);

            if (target) {

                event.preventDefault();

                target.scrollIntoView({
                    behavior: "smooth"
                });

            }

        });

    });
    // =====================================
    // DIABETES ASSESSMENT FORM
    // =====================================

    const diabetesForm = document.getElementById("diabetesForm");

    if (diabetesForm) {

        diabetesForm.addEventListener("submit", async function (event) {

            event.preventDefault();

            const fields = {
                pregnancies: "Pregnancies",
                glucose: "Glucose",
                bloodPressure: "BloodPressure",
                skinThickness: "SkinThickness",
                insulin: "Insulin",
                bmi: "BMI",
                diabetesPedigree: "DiabetesPedigreeFunction",
                age: "Age"
            };

            const formData = {};

            for (const id in fields) {

                const input = document.getElementById(id);

                if (!input || input.value.trim() === "") {

                    alert("Please fill in all fields.");
                    return;
                }

                const value = Number(input.value);

                if (!Number.isFinite(value) || value < 0) {

                    alert("Please enter valid values.");
                    return;
                }

                formData[fields[id]] = value;

            }

            const message = document.getElementById("formMessage");

            const submitButton = diabetesForm.querySelector(
                'button[type="submit"]'
            );

            try {

                if (submitButton) {
                    submitButton.disabled = true;
                }

                if (message) {
                    message.textContent = "Analyzing your information...";
                }

                const response = await fetch("/api/predict", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(formData)
                });

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.message || "Prediction failed.");
                }

                sessionStorage.setItem(
                    "diabetesFormData",
                    JSON.stringify(formData)
                );

                const params = new URLSearchParams({
                    prediction: result.prediction,
                    probability: result.probability
                });

                window.location.href =
                    "/prediction?" + params.toString();

            } catch (error) {

                if (message) {

                    message.textContent = error.message ||
                        "Could not connect to the server.";

                }

                console.error("Prediction error:", error);

            } finally {

                if (submitButton) {
                    submitButton.disabled = false;
                }

            }

        });
    }


    // =====================================
    // PREDICTION RESULT PAGE
    // =====================================

    const resultCard = document.getElementById("resultCard");

    if (resultCard) {

        const params = new URLSearchParams(window.location.search);

        const prediction = params.get("prediction");
        const probabilityText = params.get("probability");
        const probability = Number(probabilityText);

        const get = id => document.getElementById(id);

        const validResult =
            (prediction === "0" || prediction === "1") &&
            probabilityText !== null &&
            probabilityText.trim() !== "" &&
            Number.isFinite(probability) &&
            probability >= 0 &&
            probability <= 100;


        if (validResult) {

            resultCard.classList.remove("waiting");

            const percentage = probability + "%";

            if (get("topProbability")) {
                get("topProbability").textContent = percentage;
            }

            if (get("donutPercentage")) {
                get("donutPercentage").textContent = percentage;
            }

            if (get("barPercentage")) {
                get("barPercentage").textContent = percentage;
            }

            if (get("overviewProbability")) {
                get("overviewProbability").textContent = percentage;
            }

            if (get("probabilityBar")) {
                get("probabilityBar").style.width = percentage;
            }

            if (get("donutChart")) {

                get("donutChart").style.setProperty(
                    "--probability",
                    percentage
                );

            }

            if (get("predictionValue")) {
                get("predictionValue").textContent = prediction;
            }

            if (get("overviewPrediction")) {
                get("overviewPrediction").textContent = prediction;
            }


            const isPositive = prediction === "1";

            resultCard.classList.add(
                isPositive ? "positive" : "negative"
            );

            if (get("resultIcon")) {
                get("resultIcon").textContent = isPositive ? "!" : "?";
            }

            if (get("resultTitle")) {

                get("resultTitle").textContent =
                    isPositive ? "Positive (1)" : "Negative (0)";

            }

            if (get("resultDescription")) {

                get("resultDescription").textContent =
                    isPositive
                        ? "The AI model returned a positive prediction."
                        : "The AI model returned a negative prediction.";

            }

            if (get("analysisText")) {

                get("analysisText").textContent =
                    "The model returned a " +
                    (isPositive ? "positive" : "negative") +
                    " prediction. Probability: " + percentage;

            }

            if (get("modelStatus")) {

                get("modelStatus").textContent = "Completed";

                get("modelStatus").classList.remove("status-pending");
                get("modelStatus").classList.add("status-completed");

            }


            // Save completed assessment for Admin Dashboard

            const data = JSON.parse(
                sessionStorage.getItem("diabetesFormData") || "{}"
            );

            const history = getSavedData("assessmentHistory");

            history.unshift({

                date: new Date().toLocaleString(),

                user: localStorage.getItem("diabetesUsername") || "Guest",

                glucose: data.Glucose ?? "N/A",
                bloodPressure: data.BloodPressure ?? "N/A",
                bmi: data.BMI ?? "N/A",
                age: data.Age ?? "N/A",

                probability: percentage,

                result: isPositive ? "Positive" : "Negative"

            });

            localStorage.setItem(
                "assessmentHistory",
                JSON.stringify(history)
            );

        } else {

            resultCard.classList.add("waiting");

            if (get("resultTitle")) {
                get("resultTitle").textContent = "Waiting for Result";
            }

            if (get("resultDescription")) {

                get("resultDescription").textContent =
                    "Your information has been submitted. Waiting for the AI model result.";

            }

            if (get("predictionValue")) {
                get("predictionValue").textContent = "--";
            }

            if (get("overviewPrediction")) {
                get("overviewPrediction").textContent = "--";
            }

            if (get("topProbability")) {
                get("topProbability").textContent = "--%";
            }

            if (get("donutPercentage")) {
                get("donutPercentage").textContent = "--%";
            }

            if (get("barPercentage")) {
                get("barPercentage").textContent = "--%";
            }

            if (get("overviewProbability")) {
                get("overviewProbability").textContent = "--%";
            }

            if (get("probabilityBar")) {
                get("probabilityBar").style.width = "0%";
            }

            if (get("donutChart")) {

                get("donutChart").style.setProperty(
                    "--probability",
                    "0%"
                );

            }

            if (get("analysisText")) {

                get("analysisText").textContent =
                    "Waiting for the AI model to return its prediction.";

            }

            if (get("modelStatus")) {

                get("modelStatus").textContent = "Waiting";

                get("modelStatus").classList.remove("status-completed");
                get("modelStatus").classList.add("status-pending");

            }

        }

    }

});