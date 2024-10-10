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
      alert('Please log in to access this feature');
      return;
    }

    // Get the about me input
    const aboutInput = aboutInputField.value;
    console.log('About Me Input:', aboutInput);

    try {
      // Send a POST request to the server to update the about me section
      fetch('http://127.0.0.1:3001/update-about-me', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          user_id: userId,
          about_me: aboutInput
        })
      })
      .then(response => response.text())
      .then(data => {
        console.log('Data:', data);
        if (data.includes('Error')) {
          alert(`Error: ${data}`);
        } else {
          if (document.getElementById('about-content')) {
            document.getElementById('about-content').innerText = aboutInput;
          }
          alert(data);
        }
      })
      .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while updating your about me section. Please try again.');
      });
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred while updating your about me section. Please try again.');
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

      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');

      console.log('User                 ID:', userId); // Log userId before sending
      console.log('Skills:', skillsArray); // Log skills before sending

      if (!token || !userId) {
        alert('Authentication details are missing. Please log in.');
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
            alert('The skill "' + skill + '" already exists.');
            return Promise.resolve();
          }
          if (error.message === 'Both employee_id and skill_id are required.') {
            alert('Both employee ID and skill ID are required.');
            return Promise.resolve();
          }
          if (error.message === 'Employee skill already exists.') {
            alert('Employee skill already exists.');
            return Promise.resolve();
          }
          throw error;
        });
      });

      Promise.all(skillPromises)
        .then(() => {
          alert('Skills added successfully!');
          displaySkills(skillsArray);
          if (document.getElementById('skills-input')) {
            document.getElementById('skills-input').value = ''; // Clear the input
          }
        })
        .catch(error => {
          console.error('Error adding skill:', error);
          alert('Error adding skill: ' + error.message);
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
        .then(response => response.text())
        .then(data => {
          alert(data);
        })
        .catch(error => console.error('Error:', error));
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
        console.log('User  ID before submitting:', userId);

        // Check if userId is set
        if (!userId) {
          console.error('User  ID is null. Please log in again.');
          alert('User  ID is not set. Please log in again.');
          return;
        }

        // Log local storage values for debugging
        console.log('Local Storage before submitting:', localStorage); // Log all local storage values

        // Validate form inputs
        if (!certificateTitleValue || !certificateFileValue) {
          alert('Please provide both a certificate title and a file.');
          return;
        }

        // File size limit (e.g., 500KB)
        const MAX_FILE_SIZE_KB = 500;
        const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_KB * 1024;
        if (certificateFileValue.size > MAX_FILE_SIZE_BYTES) {
          alert(`File size exceeds ${MAX_FILE_SIZE_KB}KB. Please upload a smaller file.`);
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
            throw new Error('Network response was not ok ' + response.statusText);
          }
          return response.text();
        })
        .then(data => {
          // Alert with server response
          alert(data);
          // Clear the form after successful submission
          if (certificateForm) {
            certificateForm.reset();
          }
          console.log('Certificate uploaded successfully.');
        })
        .catch(error => {
          console.error('Error uploading certificate:', error);
          alert('There was an error uploading your certificate. Please try again.');
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
    if (!userId || !validateUserId(userId)) {
      console.error('Invalid user ID');
      alert('Please log in to access this feature');
      return;
    }

    const contactEmail = document.getElementById('contact-email');
    const contactLinkedIn = document.getElementById('contact-linkedin');
    if (contactEmail && contactLinkedIn) {
      const contactEmailValue = contactEmail.value;
      const contactLinkedInValue = contactLinkedIn.value;

      try {
        // Send a POST request to the server to update the contact information
        fetch('http://localhost:3001/update-contact', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            user_id: userId,
            contact_email: contactEmailValue,
            linkedin_profile: contactLinkedInValue
          })
        })
        .then(response => response.text())
        .then(data => {
          if (document.getElementById('contact-info')) {
            document.getElementById('contact-info').innerText = `Email: ${contactEmailValue}, LinkedIn: ${contactLinkedInValue}`;
          }
          alert(data);
        })
        .catch(error => console.error('Error:', error));
      } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while updating your contact information. Please try again.');
      }
    }
  });
}

  // Resume Generation Form Submission
  const resumeForm = document.getElementById('resume-form');
  if (resumeForm) {
    resumeForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const resumeData = {
        name: document.getElementById('resume-name').value,
        email: document.getElementById('resume-email').value,
        objective: document.getElementById('resume-objective').value,
        experience: document.getElementById('resume-experience').value,
        education: document.getElementById('resume-education').value,
        skills: document.getElementById('resume-skills').value,
        projects: document.getElementById('resume-projects').value,
        certifications: document.getElementById('resume-certifications').value,
        languages: document.getElementById('resume-languages').value,
        interests: document.getElementById('resume-interests').value
      };

      fetch('http://localhost:3001/generate-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(resumeData)
      })
      .then(response => {
        if (!response.ok) throw new Error('Failed to generate resume');
        return response.blob();
      })
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'resume.pdf';
        document.body.appendChild(a);
        a.click();
        a.remove();
      })
      .catch(error => console.error('Error:', error));
    });
  }

  // Password validation guidelines
  const passwordInput = document.getElementById('employee-password');
  const minChar = document.getElementById('min-char');
  const uppercase = document.getElementById('uppercase');
  const lowercase = document.getElementById('lowercase');
  const specialChar = document.getElementById('special-char');

  if (passwordInput) {
    passwordInput.addEventListener('input', () => {
      const password = passwordInput.value;

      // Check if password has at least 8 characters
      if (password.length >= 8) {
        minChar.classList.add('valid');
      } else {
        minChar.classList.remove('valid');
      }

      // Check if password contains at least one uppercase letter
      if (/[A-Z]/.test(password)) {
        uppercase.classList.add('valid');
      } else {
        uppercase.classList.remove('valid');
      }

      // Check if password contains at least one lowercase letter
      if (/[a-z]/.test(password)) {
        lowercase.classList.add('valid');
      } else {
        lowercase.classList.remove('valid');
      }

      // Check if password contains at least one special character
      if (/\W/.test(password)) {
        specialChar.classList.add('valid');
      } else {
        specialChar.classList.remove('valid');
      }
    });
  }

  // Create Employee Account Form Submission
  const createEmployeeForm = document.getElementById('create-employee-form');
  if (createEmployeeForm) {
    createEmployeeForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const fullName = document.getElementById('employee-name');
      const email = document.getElementById('employee-email');
      const username = document.getElementById('employee-username');
      const password = document.getElementById('employee-password');

      if (fullName && email && username && password) {
        const fullNameValue = fullName.value.trim();
        const emailValue = email.value.trim();
        const usernameValue = username.value.trim();
        const passwordValue = password.value.trim();

        // Basic validation
        if (!fullNameValue || !emailValue || !usernameValue || !passwordValue) {
          alert('Please fill in all required fields.');
          return;
        }

        // Password validation
        const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\W).{8,}$/;
        if (!passwordPattern.test(passwordValue)) {
          alert('Password does not meet the required criteria.');
          return;
        }

        const employeeData = {
          full_name: fullNameValue,
          email: emailValue,
          username: usernameValue,
          password: passwordValue
        };

        console.log('Request data:', employeeData);

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
            return response.text().then(text => { throw new Error(text || 'Failed to create account'); });
          }
          return response.text();
        })
        .then(data => {
          console.log('Response data:', data);
          alert(data); // Display response from server
          // Optionally, redirect to login page after successful account creation
          window.location.href = 'login.html';
        })
        .catch(error => {
          console.error('Error creating account:', error);
          alert('Error creating account. Please try again.');
        });
      }
    });
  }

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