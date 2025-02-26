document.addEventListener('DOMContentLoaded', () => {
  // Fetch and display user data after login
  const userId = localStorage.getItem('user_id'); // Ensure user ID is saved during login
  if (userId) {
    fetch(`http://localhost:3001/get-profile/${userId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    .then(response => response.json())
    .then(profile => {
      // Populate the profile fields with retrieved data
      if (document.getElementById('about-content')) {
        document.getElementById('about-content').innerText = profile.about_me || 'Your about me section is empty.';
      }
      if (document.getElementById('contact-info')) {
        document.getElementById('contact-info').innerText = `Email: ${profile.email}, LinkedIn: ${profile.linkedin}`;
      }
    })
    .catch(error => console.error('Error fetching profile:', error));
  }

// Get the about me form and input field
const aboutForm = document.getElementById('about-me-form');
const aboutInputField = document.getElementById('about-me');

if (aboutForm && aboutInputField) {
  aboutForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const userId = localStorage.getItem('userId');
    if (!userId || !validateUserId(userId)) {
      console.error('Invalid user ID');
      Swal.fire({
        icon: 'warning',
        title: 'Please Log In',
        text: 'Please log in to access this feature.',
        confirmButtonColor: '#008080'
      });
      return;
    }

    // Get the about me input
    const aboutInput = aboutInputField.value;
    console.log('About Me Input:', aboutInput);

    try {
      fetch('http://127.0.0.1:3001/update-about-me', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          user_id: userId,
          about_me_text: aboutInput
        })
      })
      .then(response => response.json())
      .then(data => {
        console.log('Data:', data);
        if (data.error) {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: data.error,
            confirmButtonColor: '#FF6347'
          });
        } else {
          if (document.getElementById('about-content')) {
            document.getElementById('about-content').innerText = aboutInput;
          }
          Swal.fire({
            icon: 'success',
            title: 'Success',
            text: 'About Me section updated successfully!',
            confirmButtonColor: '#008080'
          });
        }
      })
      .catch(error => {
        console.error('Error:', error);
        Swal.fire({
          icon: 'error',
          title: 'Oops...',
          text: 'An error occurred while updating your About Me section. Please try again.',
          confirmButtonColor: '#FF6347'
        });
      });
    } catch (error) {
      console.error('Error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'An error occurred while updating your About Me section. Please try again.',
        confirmButtonColor: '#FF6347'
      });
    }
  });
}


// Validate user ID
function validateUserId(userId) {
  // Add your own validation logic here
  return true; // or false if the user ID is invalid
}

  // Function to display skills in the skills list
function displaySkills(skills) {
  const skillsList = document.getElementById('skills-list');
  if (skillsList) {
    skillsList.innerHTML = ''; // Clear the list before appending new skills
    skills.forEach(skill => {
      const skillItem = document.createElement('div');
      skillItem.className = 'skill-item';
      skillItem.textContent = skill;
      skillsList.appendChild(skillItem);
    });
  }
}

// Define skillsForm
const skillsForm = document.getElementById('skills-form');

if (skillsForm) {
  // Skills Form Submission
  skillsForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const skillsInput = document.getElementById('skills-input');
    if (skillsInput) {
      const skillsInputValue = skillsInput.value;
      const skillsArray = skillsInputValue.split('\n').map(skill => skill.trim()).filter(skill => skill !== '');

      if (skillsArray.length === 0) {
        Swal.fire({
          icon: 'warning',
          title: 'No Skills Entered',
          text: 'Please enter at least one skill.',
        });
        return;
      }

      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');

      console.log('User ID:', userId); // Log userId before sending
      console.log('Skills:', skillsArray); // Log skills before sending

      if (!token || !userId) {
        Swal.fire({
          icon: 'warning',
          title: 'Authentication Required',
          text: 'Authentication details are missing. Please log in.',
        });
        return;
      }

      const skillPromises = skillsArray.map(skill => {
        // First, create the skill
        return fetch('http://localhost:3001/add-skill', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            skill_name: skill
          })
        })
        .then(response => {
          if (!response.ok) {
            return response.text().then(text => { throw new Error(text); });
          }
          return response.json();
        })
        .then(skillData => {
          // Get the skill_id from the response
          const skillId = skillData.id;

          // Now link the employee to the skill
          return fetch('http://localhost:3001/add-employee-skill', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              employee_id: userId,
              skill_id: skillId
            })
          })
          .then(response => {
            if (response.ok) {
              return response.json();
            } else {
              return response.text().then(text => { 
                if (text.includes('Both employee_id and skill_name are required.')) {
                  throw new Error('Both employee_id and skill_id are required.');
                } else if (text.includes('Both employee_id and skill_id are required.')) {
                  throw new Error('Both employee ID and skill ID are required.');
                } else {
                  throw new Error(text);
                }
              });
            }
          });
        })
        .catch(error => {
          if (error.message === 'Skill already exists.') {
            Swal.fire({
              icon: 'info',
              title: 'Duplicate Skill',
              text: `The skill "${skill}" already exists.`,
            });
            return Promise.resolve();
          }
          if (error.message === 'Both employee_id and skill_id are required.') {
            Swal.fire({
              icon: 'error',
              title: 'Missing Information',
              text: 'Both employee ID and skill ID are required.',
            });
            return Promise.resolve();
          }
          if (error.message === 'Employee skill already exists.') {
            Swal.fire({
              icon: 'info',
              title: 'Duplicate Entry',
              text: 'Employee skill already exists.',
            });
            return Promise.resolve();
          }
          throw error;
        });
      });

      Promise.all(skillPromises)
        .then(() => {
          Swal.fire({
            icon: 'success',
            title: 'Skills Added',
            text: 'Skills added successfully!',
          });
          displaySkills(skillsArray);
          if (document.getElementById('skills-input')) {
            document.getElementById('skills-input').value = ''; // Clear the input
          }
        })
        .catch(error => {
          console.error('Error adding skill:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error adding skill: ' + error.message,
          });
        });
    }
  });
}

// Projects Form Submission
const projectForm = document.getElementById('project-form');
if (projectForm) {
  projectForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const projectTitle = document.getElementById('project-title');
    const projectDescription = document.getElementById('project-description');
    
    if (projectTitle && projectDescription) {
      const projectTitleValue = projectTitle.value;
      const projectDescriptionValue = projectDescription.value;

      if (!projectTitleValue || !projectDescriptionValue) {
        alert('Please fill in both the project title and description.'); // Alert for empty fields
        return;
      }

      fetch('http://localhost:3001/add-project', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          user_id: userId,
          title: projectTitleValue,
          description: projectDescriptionValue
        })
      })
      .then(response => {
        if (!response.ok) {
          return response.text().then(text => { throw new Error(text); });
        }
        return response.text(); // Assuming your API returns a message as text
      })
      .then(data => {
        alert('Project added successfully: ' + data); // Success message
      })
      .catch(error => {
        console.error('Error:', error);
        alert('Error adding project: ' + error.message); // Error message
      });
    }
  });
}

// Certificate Form Submission
const certificateForm = document.getElementById('certificate-form');
if (certificateForm) {
  certificateForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // Retrieve the userId from localStorage
    const userId = localStorage.getItem('userId');
    const certificateTitle = document.getElementById('certificate-title');
    const certificateFile = document.getElementById('certificate-file');
    
    if (certificateTitle && certificateFile) {
      const certificateTitleValue = certificateTitle.value;
      const certificateFileValue = certificateFile.files[0]; // Get the uploaded file

      // Log userId to check its value
      console.log('User ID before submitting:', userId);

      // Check if userId is set
      if (!userId) {
        console.error('User ID is null. Please log in again.');
        alert('User ID is not set. Please log in again.'); // Alert for missing user ID
        return;
      }

      // Log local storage values for debugging
      console.log('Local Storage before submitting:', localStorage); // Log all local storage values

      // Validate form inputs
      if (!certificateTitleValue || !certificateFileValue) {
        alert('Please provide both a certificate title and a file.'); // Alert for empty fields
        return;
      }

      // File size limit 
      const MAX_FILE_SIZE_KB = 500;
      const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_KB * 1024;
      if (certificateFileValue.size > MAX_FILE_SIZE_BYTES) {
        alert(`File size exceeds ${MAX_FILE_SIZE_KB}KB. Please upload a smaller file.`); // Alert for file size
        return;
      }

      // Prepare form data
      const formData = new FormData();
      formData.append('employee_id', userId); // Ensure userId is the correct employee ID
      formData.append('certificate_name', certificateTitleValue); // Append certificate name to FormData
      formData.append('certificate_file', certificateFileValue); // Append the file to FormData

      // Log the user ID to verify its value
      console.log('Submitting Certificate with User ID:', userId);

      // Send the form data to the server
      fetch('http://localhost:3001/add-certificate', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}` // Include authorization token if necessary
        }
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok: ' + response.statusText); // Improved error message
        }
        return response.text(); // Assuming the server returns a message as text
      })
      .then(data => {
        // Alert with server response
        alert('Certificate uploaded successfully: ' + data); // Success message
        // Clear the form after successful submission
        certificateForm.reset();
        console.log('Certificate uploaded successfully.');
      })
      .catch(error => {
        console.error('Error uploading certificate:', error);
        alert('There was an error uploading your certificate: ' + error.message); // Specific error message
      });
    }
  });
}

// Contact Form Submission
const contactForm = document.getElementById('contact-form');
if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const userId = localStorage.getItem('userId');
    // Check if user ID is valid
    if (!userId || !validateUserId(userId)) {
      console.error('Invalid user ID');
      alert('Please log in to access this feature'); // Alert for invalid user ID
      return;
    }

    const contactEmail = document.getElementById('contact-email');
    const contactLinkedIn = document.getElementById('contact-linkedin');
    
    if (contactEmail && contactLinkedIn) {
      const contactEmailValue = contactEmail.value;
      const contactLinkedInValue = contactLinkedIn.value;

      // Prepare the request
      fetch('http://localhost:3001/update-contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` // Include authorization token
        },
        body: JSON.stringify({
          user_id: userId,
          contact_email: contactEmailValue,
          linkedin_profile: contactLinkedInValue  
        })
      })
      .then(response => response.json()) // Assuming the server returns JSON
      .then(data => {
        if (data.error) {
          alert(`Error: ${data.error}`); // Alert for error responses from server
        } else {
          // Update contact info display if applicable
          const contactInfoElement = document.getElementById('contact-info');
          if (contactInfoElement) {
            contactInfoElement.innerText = `Email: ${contactEmailValue}, LinkedIn: ${contactLinkedInValue}`;
          }
          alert(data.message || 'Contact information updated successfully!'); // Success alert
        }
      })
      .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while updating your contact information. Please try again.'); // General error alert
      });
    } else {
      alert('Please ensure all fields are filled in correctly.'); // Alert if fields are missing
    }
  });
}


document.addEventListener('DOMContentLoaded', () => {
  const createEmployeeForm = document.getElementById('create-employee-form');
  const loadingIndicator = document.getElementById('loading-indicator');

  createEmployeeForm.addEventListener('submit', (e) => {
      e.preventDefault(); // Prevent default form submission

      const fullName = document.getElementById('employee-name').value.trim();
      const email = document.getElementById('employee-email').value.trim();
      const username = document.getElementById('employee-username').value.trim();
      const password = document.getElementById('employee-password').value.trim();
      const confirmPassword = document.getElementById('confirm-password').value.trim();

      // Basic validation
      if (!fullName || !email || !username || !password || !confirmPassword) {
          Swal.fire({
              title: "Missing Fields",
              text: "Please fill in all required fields.",
              icon: "warning",
              confirmButtonText: "OK"
          });
          return;
      }

      // Confirm password validation
      if (password !== confirmPassword) {
          Swal.fire({
              title: "Password Mismatch",
              text: "Passwords do not match. Please try again.",
              icon: "warning",
              confirmButtonText: "OK"
          });
          return;
      }

      const employeeData = {
          full_name: fullName,
          email: email,
          username: username,
          password: password,
          confirmPassword: confirmPassword // Include confirmPassword
      };

      console.log('Request data:', employeeData);

      // Show loading indicator
      loadingIndicator.style.display = 'block';

      // Send POST request to the server
      fetch('http://localhost:3001/create-employee-account', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify(employeeData)
      })
      .then(response => {
          console.log('Response:', response);
          if (!response.ok) {
              return response.json().then(data => { 
                  throw new Error(data.message || 'Failed to create account. Please check your inputs.'); 
              });
          }
          return response.json();
      })
      .then(data => {
          console.log('Response data:', data);
          Swal.fire({
              title: "Account Created!",
              text: data.message || "Employee account created successfully!",
              icon: "success",
              confirmButtonText: "OK"
          }).then(() => {
              createEmployeeForm.reset(); // Reset the form
              window.location.href = 'login.html'; // Redirect to login
          });
      })
      .catch(error => {
          console.error('Error creating account:', error);
          Swal.fire({
              title: "Error",
              text: error.message || 'There was an error creating your account. Please try again later.',
              icon: "error",
              confirmButtonText: "OK"
          });
      })
      .finally(() => {
          loadingIndicator.style.display = 'none'; // Hide loading indicator
      });
  });
});

// Define the saveProfile function
async function saveProfile(profile) {
  try {
    const response = await fetch('/update-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile)
    });

    if (!response.ok) {
      throw new Error('Error saving profile');
    }
  } catch (error) {
    console.error('Error saving profile:', error);
  }
}

// Define the logout function
async function logout() {
  const profile = { 
    user_id: userId, 
    email: document.getElementById('contact-email').value, 
    linkedin: document.getElementById('contact-linkedin').value 
  };

  await saveProfile(profile);

  // Perform logout logic
  localStorage.removeItem('token');
  localStorage.removeItem('user_id');
  window.location.href = 'login.html'; // Redirect to login page
}

// Add event listener to logout button
const logoutButton = document.getElementById('logout-button');
if (logoutButton) {
  logoutButton.addEventListener('click', logout); // Call logout on button click
}
})