document.getElementById('advanced-search-toggle').addEventListener('click', function() {
    var advancedSearch = document.getElementById('advanced-search');
    advancedSearch.style.display = advancedSearch.style.display === 'none' ? 'block' : 'none';
});

// Example of showing/hiding the loading spinner (you'll need to adapt this to your actual loading logic)
document.getElementById('search-form').addEventListener('submit', function() {
    document.getElementById('loading').style.display = 'block';
    // Simulate a search operation with a timeout
    setTimeout(function() {
        document.getElementById('loading').style.display = 'none';
        // Add search results dynamically here
    }, 2000); // Adjust the timeout as needed
});
