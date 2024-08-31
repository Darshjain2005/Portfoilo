document.getElementById('search-form').addEventListener('submit', function(event) {
    event.preventDefault();

    const skillsQuery = document.getElementById('search-skills').value.toLowerCase();
    const certificationsQuery = document.getElementById('search-certifications').value.toLowerCase();

    
    const users = [
        {
            name: 'Darsh',
            email: 'darsh@example.com',
            skills: ['JavaScript', 'React'],
            certifications: ['Certified JavaScript Developer']
        },
        {
            name: 'Shreyan',
            email: 'shreyan@example.com',
            skills: ['Python', 'Django'],
            certifications: ['Certified Python Programmer']
        },
        {
            name: 'Amitesh',
            email: 'amitesh@example.com',
            skills: ['Html', 'Css'],
            certifications: ['Frontend Developer']
        }
    ];

    
    const results = users.filter(user => {
        const hasSkills = user.skills.some(skill => skill.toLowerCase().includes(skillsQuery));
        const hasCertifications = user.certifications.some(cert => cert.toLowerCase().includes(certificationsQuery));
        return hasSkills || hasCertifications;
    });

    
    const resultsDiv = document.getElementById('search-results');
    resultsDiv.innerHTML = '';
    if (results.length > 0) {
        results.forEach(user => {
            const userElement = document.createElement('div');
            userElement.innerHTML = `
                <h3>${user.name}</h3>
                <p>Email: ${user.email}</p>
                <p>Skills: ${user.skills.join(', ')}</p>
                <p>Certifications: ${user.certifications.join(', ')}</p>
            `;
            resultsDiv.appendChild(userElement);
        });
    } else {
        resultsDiv.innerHTML = '<p>No results found.</p>';
    }
});

document.getElementById("logout-button").addEventListener("click", function() {
    console.log("Logout button clicked");

    try {
        
        sessionStorage.clear();
        localStorage.clear();
        console.log("Session and local storage cleared");

        
        window.location.href = "login.html"; 
        console.log("Redirecting to login page");
    } catch (error) {
        console.error("An error occurred during logout:", error);
    }
});