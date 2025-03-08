document.addEventListener("DOMContentLoaded", () => {
    const createForm = document.getElementById("create-employer-form");
    const companyNameInput = document.getElementById("company-name");
    const emailInput = document.getElementById("employer-email");
    const usernameInput = document.getElementById("employer-username");
    const passwordInput = document.getElementById("employer-password");
    const eyeIcon = document.getElementById("toggle-password");
    const searchForm = document.getElementById("search-form");
    const searchResultsDiv = document.getElementById("search-results");
    const logoutButton = document.getElementById("logout-button");

    // Password visibility toggle
    if (eyeIcon) {
        eyeIcon.addEventListener("click", () => {
            if (passwordInput.type === "password") {
                passwordInput.type = "text";
                eyeIcon.src = "path/to/eye-open-icon.png";
            } else {
                passwordInput.type = "password";
                eyeIcon.src = "path/to/eye-closed-icon.png";
            }
        });
    }

    // Form submission event for creating an employer account
    if (createForm) {
        createForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            const companyName = document.getElementById("company-name").value.trim();
            const email = document.getElementById("email").value.trim();
            const username = document.getElementById("username").value.trim();
            const password = document.getElementById("password").value.trim();

            if (!companyName || !email || !username || !password) {
                alert("All fields are required.");
                return;
            }

            try {
                const response = await fetch("http://localhost:3001/create-employer-account", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        company_name: companyName, 
                        email: email,
                        username: username,
                        password: password
                    })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || "Account creation failed.");
                }

                alert("Account created successfully!");
                window.location.href = "login.html";
            } catch (error) {
                alert(`Error: ${error.message}`);
            }
        });
    }
});