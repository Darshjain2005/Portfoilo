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

            const companyName = companyNameInput.value.trim();
            const email = emailInput.value.trim();
            const username = usernameInput.value.trim();
            const password = passwordInput.value.trim();

            if (!companyName || !email || !username || !password) {
                alert("All fields are required.");
                return;
            }

            console.log("Creating employer account with:", { companyName, email, username });

            try {
                const response = await fetch("http://localhost:3001/create-employer-account", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        company_name: companyName, 
                        email: email,
                        username: username,
                        password: password
                    })
                });

                console.log("Received response:", response);

                const data = await response.json();

                if (!response.ok) {
                    console.error("Error response data:", data);
                    throw new Error(data.message || "Account creation failed.");
                }

                console.log("Account creation successful:", data);
                alert("Account created successfully!");
                window.location.href = "login.html"; // Redirect to login page
            } catch (error) {
                console.error("Error during account creation:", error);
                alert(`Error: ${error.message}`);
            }
        });
    }

    // Search form functionality
    if (searchForm) {
        searchForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            const skillsInput = document.getElementById("search-skills");
            const certificationsInput = document.getElementById("search-certifications");

            const skills = skillsInput.value.trim();
            const certifications = certificationsInput.value.trim();

            if (skills === '' && certifications === '') {
                alert('Please enter at least one search criterion (Skills or Certifications).');
                return;
            }

            try {
                searchResultsDiv.innerHTML = '<p>Loading...</p>';

                const response = await fetch(`/search?skills=${encodeURIComponent(skills)}&certifications=${encodeURIComponent(certifications)}`);
                if (!response.ok) throw new Error(`Server Error: ${response.status} ${response.statusText}`);

                const data = await response.json();
                if (!Array.isArray(data)) throw new Error('Invalid data returned from the server');

                searchResultsDiv.innerHTML = '';
                if (data.length === 0) {
                    searchResultsDiv.innerHTML = '<p>No results found.</p>';
                } else {
                    data.forEach(item => {
                        const skills = item.skills ? item.skills.join(', ') : 'N/A';
                        const certifications = item.certifications ? item.certifications.join(', ') : 'N/A';

                        const itemDiv = document.createElement('div');
                        itemDiv.classList.add('result-item');
                        itemDiv.innerHTML = `<p><strong>Name:</strong> ${item.full_name} <br><strong>Skills:</strong> ${skills} <br><strong>Certifications:</strong> ${certifications} <br><strong>Email:</strong> ${item.email}</p>`;
                        searchResultsDiv.appendChild(itemDiv);
                    });
                }
            } catch (error) {
                console.error('Error during search:', error);
                searchResultsDiv.innerHTML = `<p>Error: ${error.message}</p>`;
            }
        });
    }

    // Logout functionality
    if (logoutButton) {
        logoutButton.addEventListener("click", () => {
            localStorage.removeItem("token");
            localStorage.removeItem("user_id");
            window.location.href = "login.html";
        });
    }
});
