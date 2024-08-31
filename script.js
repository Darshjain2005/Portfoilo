function showRole(role) {
    document.getElementById('role-selection').classList.add('hidden');
    document.getElementById('login-section').classList.remove('hidden');

    if (role === 'employer') {
        document.getElementById('employer-form').style.display = 'block';
        document.getElementById('employee-form').style.display = 'none';
    } else if (role === 'employee') {
        document.getElementById('employer-form').style.display = 'none';
        document.getElementById('employee-form').style.display = 'block';
    }
}

document.getElementById('employer-form').addEventListener('submit', function(event) {
    event.preventDefault();

    // Get username and password values
    const username = document.getElementById('employer-username').value;
    const password = document.getElementById('employer-password').value;

    // Hardcoded username and password
    const correctUsername = 'darsh';
    const correctPassword = 'darsh';

    if (username === correctUsername && password === correctPassword) {
        window.location.href = 'employer.html'; // Redirect to the Employer page
    } else {
        alert('Incorrect username or password.');
    }
});

document.getElementById('employee-form').addEventListener('submit', function(event) {
    event.preventDefault();

    // Get username and password values
    const username = document.getElementById('employee-username').value;
    const password = document.getElementById('employee-password').value;

    // Hardcoded username and password
    const correctUsername = 'darsh';
    const correctPassword = 'darsh';

    if (username === correctUsername && password === correctPassword) {
        window.location.href = 'employee.html'; // Redirect to the Employee page
    } else {
        alert('Incorrect username or password.');
    }
});
