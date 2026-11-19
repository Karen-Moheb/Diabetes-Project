document.addEventListener("DOMContentLoaded", function () {

    const contactForm = document.getElementById("contactForm");

    if (!contactForm) return;


    contactForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const name = document.getElementById("contactName").value.trim();
        const email = document.getElementById("contactEmail").value.trim();
        const message = document.getElementById("contactMessage").value.trim();

        const feedback = document.getElementById("formFeedback");

        if (!name || !email || !message) {
            feedback.textContent = "Please fill in all fields.";
            feedback.className = "form-feedback";
            return;
        }

        try {
            const response = await fetch("/api/contact", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name: name,
                    email: email,
                    message: message
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Something went wrong.");
            }

            feedback.textContent = result.message;
            feedback.className = "form-feedback success";

            contactForm.reset();

        } catch (error) {
            feedback.textContent = error.message;
            feedback.className = "form-feedback";
        }

    });
});