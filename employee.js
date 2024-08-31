document.getElementById('about-form').addEventListener('submit', function(event) {
    event.preventDefault();
    const aboutText = document.getElementById('about-input').value;
    document.getElementById('about-content').innerText = aboutText;
    document.getElementById('about-input').value = '';
});

document.getElementById('project-form').addEventListener('submit', function(event) {
    event.preventDefault();
    const title = document.getElementById('project-title').value;
    const description = document.getElementById('project-description').value;

    const projectItem = document.createElement('div');
    projectItem.classList.add('project-item');
    projectItem.innerHTML = `<h3>${title}</h3><p>${description}</p>`;
    
    document.getElementById('projects-list').appendChild(projectItem);
    
    document.getElementById('project-title').value = '';
    document.getElementById('project-description').value = '';
});

document.getElementById('certificate-form').addEventListener('submit', function(event) {
    event.preventDefault();
    const title = document.getElementById('certificate-title').value;
    const file = document.getElementById('certificate-file').files[0];

    const reader = new FileReader();
    reader.onload = function() {
        const certificateItem = document.createElement('div');
        certificateItem.classList.add('certificate-item');
        certificateItem.innerHTML = `<img src="${reader.result}" alt="${title}"><p>${title}</p>`;
        document.getElementById('certificates-list').appendChild(certificateItem);
    };
    reader.readAsDataURL(file);
    
    document.getElementById('certificate-title').value = '';
    document.getElementById('certificate-file').value = '';
});

document.getElementById('contact-form').addEventListener('submit', function(event) {
    event.preventDefault();
    const email = document.getElementById('contact-email').value;
    const linkedin = document.getElementById('contact-linkedin').value;

    const contactInfo = document.createElement('div');
    contactInfo.innerHTML = `<p>Email: ${email}</p><p>LinkedIn: <a href="${linkedin}" target="_blank">${linkedin}</a></p>`;
    
    document.getElementById('contact-info').appendChild(contactInfo);
    
    document.getElementById('contact-email').value = '';
    document.getElementById('contact-linkedin').value = '';
});

document.getElementById("logout-button").addEventListener("click", function() {
    console.log("Logout button clicked");

    try {
        // Clear any user session data
        sessionStorage.clear();
        localStorage.clear();
        console.log("Session and local storage cleared");

        // Redirect to the login page
        window.location.href = "login.html"; // Make sure this file exists
        console.log("Redirecting to login page");
    } catch (error) {
        console.error("An error occurred during logout:", error);
    }
});


