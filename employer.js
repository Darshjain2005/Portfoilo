(function() {
  if (document) {
    document.addEventListener('DOMContentLoaded', () => {
      // Logout functionality
      const logoutButton = document.getElementById('logout-button');

      if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
          try {
            // Remove authentication tokens or any related data from localStorage
            localStorage.removeItem('token');
            localStorage.removeItem('user_id');

            // Redirect to the login page
            window.location.href = 'login.html'; // Adjust the path if necessary
          } catch (error) {
            console.error('Error during logout:', error);
          }
        });
      } else {
        console.error('Logout button with id "logout-button" not found.');
      }

      // Search form functionality
      const searchForm = document.getElementById('search-form');

      if (searchForm) {
        searchForm.addEventListener('submit', async (event) => {
          event.preventDefault();

          // Retrieve input values
          const skillsInput = document.getElementById('search-skills');
          const certificationsInput = document.getElementById('search-certifications');

          if (!skillsInput || !certificationsInput) {
            console.error('Search input fields not found.');
            return;
          }

          const skills = skillsInput.value.trim();
          const certifications = certificationsInput.value.trim();

          // Basic validation: At least one field should be filled
          if (skills === '' && certifications === '') {
            alert('Please enter at least one search criterion (Skills or Certifications).');
            return;
          }

          try {
            // Show a loading indicator (optional)
            const resultsDiv = document.getElementById('search-results');
            resultsDiv.innerHTML = '<p>Loading...</p>';

            // Send GET request to the server with query parameters
            const response = await fetch(`http://localhost:3001/search?skills=${encodeURIComponent(skills)}&certifications=${encodeURIComponent(certifications)}`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`, // Include token if required
                'Content-Type': 'application/json'
              }
            });

            // Check if the response is OK (status code 200-299)
            if (!response.ok) {
              throw new Error(`Server Error: ${response.status} ${response.statusText}`);
            }

            // Parse the JSON data from the response
            const data = await response.json();

            // Validate the data returned from the server
            if (!Array.isArray(data)) {
              throw new Error('Invalid data returned from the server');
            }

            // Clear previous results
            resultsDiv.innerHTML = '';

            // Check if any results were returned
            if (data.length === 0) {
              resultsDiv.innerHTML = '<p>No results found.</p>';
            } else {
              // Iterate over the results and display them
              data.forEach(item => {
                const itemDiv = document.createElement('div');
                itemDiv.classList.add('result-item');

                // Customize the display based on your data structure
                itemDiv.innerHTML = `
                  <p>${item.full_name}, ${item.skills.join(', ')}, ${item.certifications.join(', ')}, ${item.email}</p>
                `;

                resultsDiv.appendChild(itemDiv);
              });
            }
          } catch (error) {
            console.error('Error during search:', error);
            const resultsDiv = document.getElementById('search-results');
            resultsDiv.innerHTML = `<p>Error: ${error.message}</p>`;
          }
        });
      } else {
        console.error('Search form with id "search-form" not found.');
      }
    });
  } else {
    console.error('Document is not available');
  }
})();