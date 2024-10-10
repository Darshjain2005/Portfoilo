// Show form based on role (Employer or Employee)
function showRole(role) {
  document.getElementById('role-selection').classList.add('hidden');

  if (role === 'employer') {
    document.getElementById('employer-form').style.display = 'block';
    document.getElementById('employee-form').style.display = 'none';
  } else if (role === 'employee') {
    document.getElementById('employer-form').style.display = 'none';
    document.getElementById('employee-form').style.display = 'block';
  }
}

// Toggle password visibility
function togglePassword(fieldId, toggleIcon) {
  const passwordField = document.getElementById(fieldId);
  if (passwordField.type === 'password') {
    passwordField.type = 'text';
    toggleIcon.textContent = '👁️‍🗨️'; // Change to closed eye
  } else {
    passwordField.type = 'password';
    toggleIcon.textContent = '👁️'; // Change to open eye
  }
}

// Handle Employee Login
document.getElementById('employee-login-form')?.addEventListener('submit', function(event) {
  event.preventDefault();

  const formData = new FormData(this);
  const data = {
    username: formData.get('username'),
    password: formData.get('password')
  };

  console.log('Sending employee login request:', data);

  fetch('http://localhost:3001/employee-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  .then(response => {
    if (!response.ok) {
      // Handle HTTP errors
      throw new Error('Network response was not ok');
    }
    return response.json();  // Parse JSON only if response is OK
  })
  .then(result => {
    console.log('Employee login response:', result); // Log the response to check what is returned
    if (result.token && result.userId) {  // Check for both token and userId
      localStorage.setItem('token', result.token);
      localStorage.setItem('userId', result.userId);  // Store userId in localStorage
      window.location.href = 'employee.html';  // Redirect to the Employee page
    } else {
      alert(result.message || 'Invalid login credentials'); // Display server message or default alert
    }
  })
  .catch(error => {
    console.error('Error during employee login:', error);
    alert('An error occurred during login. Please try again.');
  });
});

// Handle Employer Login
document.getElementById('employer-login-form')?.addEventListener('submit', function(event) {
  event.preventDefault();

  const formData = new FormData(this);
  const data = {
    username: formData.get('username'),
    password: formData.get('password')
  };

  console.log('Sending employer login request:', data);

  fetch('http://localhost:3001/employer-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  .then(response => {
    if (!response.ok) {
      // Handle HTTP errors
      throw new Error('Network response was not ok');
    }
    return response.json();  // Parse JSON only if response is OK
  })
  .then(result => {
    console.log('Employer login response:', result); // Log the response to check what is returned
    if (result.token && result.userId) {  // Check for both token and userId
      localStorage.setItem('token', result.token);
      localStorage.setItem('userId', result.userId);  // Store userId in localStorage
      window.location.href = 'employer.html';  // Redirect to the Employer page
    } else {
      alert(result.message || 'Invalid login credentials'); // Display server message or default alert
    }
  })
  .catch(error => {
    console.error('Error during employer login:', error);
    alert('An error occurred during login. Please try again.');
  });
});
