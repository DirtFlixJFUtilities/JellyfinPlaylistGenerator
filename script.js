// Global variables
let masterList = [];
let workingList = [];  // New working list for temporary storage
let genres = [];
let studios = [];
let userId = '';
let genresLoaded = false;
let studiosLoaded = false;
let currentModalItem = null; // To store the item being viewed in modal
let currentSort = 'none'; // Track current sort order
let lastCreatedPlaylistId = ''; // To store the most recently created playlist ID for adding items later

// Theme toggle functionality
function applyTheme(theme) {
    const body = document.body;
    const themeToggle = document.getElementById('themeToggle');
    const icon = themeToggle.querySelector('i');
    
    if (theme === 'dark') {
        body.setAttribute('data-theme', 'dark');
        icon.className = 'fas fa-sun';
    } else {
        body.setAttribute('data-theme', 'light');
        icon.className = 'fas fa-moon';
    }
    
    // Save theme preference to localStorage
    localStorage.setItem('theme', theme);
}

// Initialize theme on page load
document.addEventListener('DOMContentLoaded', function() {
    const savedTheme = localStorage.getItem('theme') || 'dark';  // Changed default to dark
    applyTheme(savedTheme);
    
    // Add event listener for the theme toggle button
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            const currentTheme = document.body.getAttribute('data-theme') || 'light';
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            applyTheme(newTheme);
        });
    }
});

// DOM Elements
const serverUrlInput = document.getElementById('serverUrl');
const apiKeyInput = document.getElementById('apiKey');
const filterMovies = document.getElementById('filterMovies');
const filterTV = document.getElementById('filterTV');
const filterMusic = document.getElementById('filterMusic');
const genreFilter = document.getElementById('genreFilter');
const ratingFilter = document.getElementById('ratingFilter');
const ratingValue = document.getElementById('ratingValue');
const yearFrom = document.getElementById('yearFrom');
const yearTo = document.getElementById('yearTo');
const studiosFilter = document.getElementById('studiosFilter');
const searchTerm = document.getElementById('searchTerm');
const fetchItemsBtn = document.getElementById('fetchItemsBtn');
// Removed unused clearListBtn reference - this was likely a leftover from copy-paste
const masterListContainer = document.getElementById('masterListContainer');
const masterListCount = document.getElementById('masterListCount');
const workingListContainer = document.getElementById('workingListContainer');
const workingListCount = document.getElementById('workingListCount');
const createPlaylistBtn = document.getElementById('createPlaylistBtn');
const playlistName = document.getElementById('playlistName');
const playlistDescription = document.getElementById('playlistDescription');
const savePlaylistBtn = document.getElementById('savePlaylistBtn');
const statusMessages = document.getElementById('statusMessages');
const canEditCheckbox = document.getElementById('canEditCheckbox');
const isPublicCheckbox = document.getElementById('isPublicCheckbox');
const sendToMasterListBtn = document.getElementById('sendToMasterListBtn');
const clearWorkingListBtn = document.getElementById('clearWorkingListBtn');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Set up event listeners
    setupEventListeners();
    
    // Add event listener for help modal trigger
    const helpModalTrigger = document.getElementById('helpModalTrigger');
    if (helpModalTrigger) {
        helpModalTrigger.addEventListener('click', function(e) {
            e.preventDefault(); // Prevent default link behavior
            showHelpModal();
        });
    }
    
    // Load initial data
    loadInitialData();
    
    // Fetch users when server URL and API key are provided
    if (serverUrlInput.value && apiKeyInput.value) {
        fetchUsers();
    }
});

// Fetch users from Jellyfin API and populate the user dropdown
async function fetchUsers() {
    try {
        const serverUrl = serverUrlInput.value.trim();
        const apiKey = apiKeyInput.value.trim();
        
        if (!serverUrl) {
            throw new Error('Please enter a Jellyfin server URL');
        }
        
        if (!apiKey) {
            throw new Error('Please enter your Jellyfin API key');
        }
        
        const url = `${serverUrl}/Users`;
        
        let authHeader = `MediaBrowser Client="Dirtflix Playlist Generator", Device="Web Browser", Version="1.0.0", Token="${apiKey}"`;
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'X-Emby-Authorization': authHeader,
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const users = await response.json();
        
        // Get the user select element
        const userSelect = document.getElementById('userSelect');
        
        // Clear existing options (except the first placeholder)
        userSelect.innerHTML = '<option value="">Select a user...</option>';
        
        // Handle different API response formats
        let usersArray = [];
        if (users.Items && Array.isArray(users.Items)) {
            usersArray = users.Items;
        } else if (Array.isArray(users)) {
            usersArray = users;
        }
        
        // Add users to dropdown
        usersArray.forEach(user => {
            const option = document.createElement('option');
            option.value = user.Id;
            option.textContent = user.Name;
            userSelect.appendChild(option);
        });
        
        showStatusMessage(`Successfully loaded ${usersArray.length} users`, 'success');
    } catch (error) {
        console.error('Error fetching users:', error);
        showStatusMessage(`Error loading users: ${error.message}`, 'danger');
    }
}

// Set up event listeners
function setupEventListeners() {
    // Rating filter slider update
    ratingFilter.addEventListener('input', function() {
        ratingValue.textContent = this.value;
    });
     
    // Server URL change - fetch users when server URL is provided
    serverUrlInput.addEventListener('change', function() {
        if (serverUrlInput.value && apiKeyInput.value) {
            fetchUsers();
            loadGenresAndStudios();  // Load genres and studios after both are entered
        }
    });
     
    // API key change - fetch users when API key is provided
    apiKeyInput.addEventListener('change', function() {
        if (serverUrlInput.value && apiKeyInput.value) {
            fetchUsers();
            loadGenresAndStudios();  // Load genres and studios after both are entered
        }
    });

    // Fetch items button
    fetchItemsBtn.addEventListener('click', fetchItems);

    // Clear working list button
    clearWorkingListBtn.addEventListener('click', clearWorkingList);

    // Clear all lists button
    const clearAllListsBtn = document.getElementById('clearAllListsBtn');
    clearAllListsBtn.addEventListener('click', clearAllLists);

    // Send to Master List button
    sendToMasterListBtn.addEventListener('click', sendToMasterList);

    // Remove duplicate event listener - the second one was a copy-paste error

    // Remove selected button
    const removeSelectedBtn = document.getElementById('removeSelectedBtn');
    removeSelectedBtn.addEventListener('click', removeSelectedItems);

    // Conform to genres button
    const conformToGenresBtn = document.getElementById('conformToGenresBtn');
    conformToGenresBtn.addEventListener('click', conformToGenres);

    // Remove selected from working list button
    const removeWorkingListSelectedBtn = document.getElementById('removeWorkingListSelectedBtn');
    removeWorkingListSelectedBtn.addEventListener('click', removeSelectedFromWorkingList);

    // Save playlist button
    savePlaylistBtn.addEventListener('click', savePlaylist);

    // User select change
    const userSelect = document.getElementById('userSelect');
    userSelect.addEventListener('change', function() {
        userId = this.value;
        // When a user is selected, we should fetch items for that user if there are already items in the list
        if (userId && masterList.length > 0) {
            // If there are already items in the master list, refresh them with user context
            fetchItems();
        }
        
        // Update save playlist button text based on selected user
        const savePlaylistBtn = document.getElementById('savePlaylistBtn');
        if (this.value) {
            // Get the user's name from the selected option
            const selectedOption = this.options[this.selectedIndex];
            const userName = selectedOption.textContent;
            savePlaylistBtn.innerHTML = `<i class="fas fa-save me-2"></i>Save Playlist to Jellyfin for ${userName}`;
        } else {
            // Revert to default text when no user is selected
            savePlaylistBtn.innerHTML = `<i class="fas fa-save me-2"></i>Save Playlist to Jellyfin`;
        }
    });

    // Sort dropdown change
    const sortByDropdown = document.getElementById('sortByDropdown');
    sortByDropdown.addEventListener('change', function() {
        currentSort = this.value;
        if (currentSort !== 'none') {
            sortMasterList(currentSort);
        } else {
            // If sorting is reset, display items in original order
            updateMasterListDisplay();
        }
    });

    // Filter checkboxes - add event listeners to reload genres when filters change
    filterMovies.addEventListener('change', handleFilterChange);
    filterTV.addEventListener('change', handleFilterChange);
    filterMusic.addEventListener('change', handleFilterChange);
}

// Load initial data including genres and studios from Jellyfin API
function loadInitialData() {
    // Initialize with some default values
    yearFrom.value = '1900';
    yearTo.value = new Date().getFullYear().toString();
    
    // Only try to load genres and studios if we have server URL and API key
    if (serverUrlInput.value && apiKeyInput.value) {
        loadGenresAndStudios();
    } else {
        // Load sample data as fallback
        loadSampleData();
    }
}

// Fetch genres for specific item types from Jellyfin API
async function fetchGenresForTypes(itemTypes) {
    try {
        const serverUrl = serverUrlInput.value.trim();
        const apiKey = apiKeyInput.value.trim();
        
        if (!serverUrl || !apiKey) {
            throw new Error('Server URL and API key are required');
        }
        
        // Build the query parameters for genres endpoint
        const queryParams = new URLSearchParams();
        queryParams.append('IncludeItemTypes', itemTypes.join(','));
        queryParams.append('Recursive', 'true');
        
        const url = `${serverUrl}/Genres?${queryParams.toString()}`;
        
        let authHeader = `MediaBrowser Client="Dirtflix Playlist Generator", Device="Web Browser", Version="1.0.0", Token="${apiKey}"`;
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'X-Emby-Authorization': authHeader,
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error fetching genres! status: ${response.status}`);
        }
        
        const genresData = await response.json();
        let fetchedGenres = genresData.Items ? genresData.Items.map(item => item.Name) : [];
        
        // Filter to only include genres that begin with a capital letter and don't match various unwanted patterns
        fetchedGenres = fetchedGenres.filter(genre => {
            if (!genre || genre.length === 0) return false;
            if (genre[0] !== genre[0].toUpperCase()) return false;
            
            // Check if it consists of more than one word where any word begins with a lowercase letter
            const words = genre.split(' ');
            if (words.length > 1) {
                for (let i = 0; i < words.length; i++) {
                    if (words[i].length > 0 && words[i][0] !== words[i][0].toUpperCase()) {
                        return false;
                    }
                }
            }
            
            // Check if it contains more than 1 non-alphanumeric character
            const nonAlphaNumericCount = (genre.match(/[^a-zA-Z0-9]/g) || []).length;
            if (nonAlphaNumericCount > 1) {
                return false;
            }
            
            // Check if it contains colon (:) or semicolon (;)
            if (genre.includes(':') || genre.includes(';')) {
                return false;
            }
            
            // Check if it starts with "FIC" followed by exactly 6 digits
            const ficRegex = /^FIC\d{6}$/;
            // Check if it's exactly 3 capitals followed by 6 digits
            const threeCapRegex = /^[A-Z]{3}\d{6}$/;
            // Check if it contains 3 letters followed by 6 digits (anywhere in the string)
            const letterDigitPattern = /[A-Za-z]{3}\d{6}/;
            // Check if it contains "ISBN" followed by numbers (including space)
            const isbnRegex = /ISBN(\s\d+)+/;
            // Check if it contains just "ISBN" followed by numbers
            const simpleIsbnRegex = /ISBN\d+/;
            return !ficRegex.test(genre) &&
                   !threeCapRegex.test(genre) &&
                   !letterDigitPattern.test(genre) &&
                   !isbnRegex.test(genre) &&
                   !simpleIsbnRegex.test(genre);
        });
        
        return fetchedGenres;
    } catch (error) {
        console.error('Error fetching genres:', error);
        throw error;
    }
}

// Fetch studios for specific item types from Jellyfin API
async function fetchStudiosForTypes(itemTypes) {
    try {
        const serverUrl = serverUrlInput.value.trim();
        const apiKey = apiKeyInput.value.trim();
        
        if (!serverUrl || !apiKey) {
            throw new Error('Server URL and API key are required');
        }
        
        // For studios, we'll use the Items endpoint to get unique studio names from filtered items
        // This approach allows us to filter by item types even though /Studios doesn't support it directly
        
        const queryParams = new URLSearchParams();
        queryParams.append('IncludeItemTypes', itemTypes.join(','));
        queryParams.append('Recursive', 'true');
        queryParams.append('Fields', 'Studios');  // Only fetch studio information
        queryParams.append('Limit', '1000');      // Fetch a reasonable number of items
        
        const url = `${serverUrl}/Items?${queryParams.toString()}`;
        
        let authHeader = `MediaBrowser Client="Dirtflix Playlist Generator", Device="Web Browser", Version="1.0.0", Token="${apiKey}"`;
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'X-Emby-Authorization': authHeader,
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error fetching items for studios! status: ${response.status}`);
        }
        
        const itemsData = await response.json();
        let studioNames = [];
        
        // Extract unique studio names from the filtered items
        if (itemsData.Items && Array.isArray(itemsData.Items)) {
            itemsData.Items.forEach(item => {
                if (item.Studios && Array.isArray(item.Studios)) {
                    item.Studios.forEach(studio => {
                        if (studio.Name && !studioNames.includes(studio.Name)) {
                            studioNames.push(studio.Name);
                        }
                    });
                }
            });
        }
        
        // Filter to only include studios that begin with a capital letter
        studioNames = studioNames.filter(studio => {
            if (!studio || studio.length === 0) return false;
            if (studio[0] !== studio[0].toUpperCase()) return false;
            // Check if it contains only numbers
            if (/^\d+$/.test(studio)) return false;
            // Check if it contains the � character
            if (studio.includes('�')) return false;
            // Check if it contains 4 or more non-alphanumeric characters
            const nonAlphaNumericCount = (studio.match(/[^a-zA-Z0-9]/g) || []).length;
            if (nonAlphaNumericCount >= 4) return false;
            return true;
        });
        
        return studioNames;
    } catch (error) {
        console.error('Error fetching studios:', error);
        // If the filtered approach fails, fall back to getting all studios
        try {
            const response = await fetch(`${serverUrl}/Studios`, {
                method: 'GET',
                headers: {
                    'X-Emby-Authorization': `MediaBrowser Client="Dirtflix Playlist Generator", Device="Web Browser", Version="1.0.0", Token="${apiKey}"`,
                    'Accept': 'application/json'
                }
            });
            
            if (response.ok) {
                const studiosData = await response.json();
                let studioNames = studiosData.Items ? studiosData.Items.map(item => item.Name) : [];
                
                // Apply same filtering as before
                studioNames = studioNames.filter(studio => {
                    if (!studio || studio.length === 0) return false;
                    if (studio[0] !== studio[0].toUpperCase()) return false;
                    // Check if it contains only numbers
                    if (/^\d+$/.test(studio)) return false;
                    // Check if it contains the � character
                    if (studio.includes('�')) return false;
                    // Check if it contains 4 or more non-alphanumeric characters
                    const nonAlphaNumericCount = (studio.match(/[^a-zA-Z0-9]/g) || []).length;
                    if (nonAlphaNumericCount >= 4) return false;
                    return true;
                });
                
                return studioNames;
            }
        } catch (fallbackError) {
            console.error('Fallback error fetching studios:', fallbackError);
        }
        
        throw error;
    }
}

// Fetch genres and studios from Jellyfin API based on currently selected item types
async function loadGenresAndStudios() {
    // Only load if we haven't already loaded them and we have both server URL and API key
    if ((genresLoaded && studiosLoaded) || !serverUrlInput.value.trim() || !apiKeyInput.value.trim()) {
        return;
    }
    
    try {
        const serverUrl = serverUrlInput.value.trim();
        const apiKey = apiKeyInput.value.trim();
        
        if (!serverUrl) {
            throw new Error('Please enter a Jellyfin server URL');
        }
        
        if (!apiKey) {
            throw new Error('Please enter your Jellyfin API key');
        }
        
        // Get currently selected item types with proper mapping
        const itemTypes = [];
        if (filterMovies.checked) itemTypes.push('Movie');
        if (filterTV.checked) itemTypes.push('Series');
        if (filterMusic.checked) itemTypes.push('Audio');
        
        // If no filters are selected, default to all types for backward compatibility
        if (itemTypes.length === 0) {
            itemTypes.push('Movie', 'TvProgram', 'MusicAlbum');
        }
        
        // Fetch genres only for the currently selected item types
        const genresResponse = await fetchGenresForTypes(itemTypes);
        genres = genresResponse;
        populateDropdown(genreFilter, genres);
        genresLoaded = true;
        
        // Fetch studios only for the currently selected item types
        const studiosResponse = await fetchStudiosForTypes(itemTypes);
        studios = studiosResponse;
        populateDropdown(studiosFilter, studios);
        studiosLoaded = true;
        
        showStatusMessage('Successfully loaded genres and studios from Jellyfin server', 'success');
    } catch (error) {
        console.error('Error loading genres and studios:', error);
        // Fallback to sample data if API fails
        loadSampleData();
        showStatusMessage(`Failed to load genres/studios, using sample data: ${error.message}`, 'warning');
    }
}

// Function to reload both genres and studios when filter checkboxes change (for consistency)
async function handleFilterChange() {
    // Only reload if we've already loaded the initial data
    if (genresLoaded && studiosLoaded) {
        // Re-fetch genres and studios based on current selections
        await loadGenresAndStudios();
    }
}

function loadSampleData() {
    // Sample genres for demonstration (this will be replaced by actual API data)
    genres = [
        'Action', 'Adventure', 'Animation', 'Comedy', 'Crime',
        'Documentary', 'Drama', 'Fantasy', 'History', 'Horror',
        'Music', 'Mystery', 'Romance', 'Science Fiction', 'Thriller',
        'War', 'Western'
    ];
    
    // Sample studios for demonstration (this will be replaced by actual API data)
    studios = [
        'Disney', 'Universal Studios', 'Warner Bros.', '20th Century Fox',
        'Paramount Pictures', 'Sony Pictures', 'Lionsgate', 'Columbia Pictures'
    ];
    
    // Populate dropdowns with sample data
    populateDropdown(genreFilter, genres);
    populateDropdown(studiosFilter, studios);
}

function populateDropdown(dropdown, items) {
    dropdown.innerHTML = '';
    items.forEach(item => {
        const option = document.createElement('option');
        option.value = item;
        option.textContent = item;
        dropdown.appendChild(option);
    });
}

async function fetchItems() {
    // Show loading state
    showStatusMessage('Fetching items from Jellyfin server...', 'info');
    fetchItemsBtn.disabled = true;
    fetchItemsBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Fetching...';
    
    try {
        const serverUrl = serverUrlInput.value.trim();
        const apiKey = apiKeyInput.value.trim();
        
        if (!serverUrl) {
            throw new Error('Please enter a Jellyfin server URL');
        }
        
        if (!apiKey) {
            throw new Error('Please enter your Jellyfin API key');
        }
        
        // Get selected item types
        const itemTypes = [];
        if (filterMovies.checked) itemTypes.push('Movie');
        if (filterTV.checked) itemTypes.push('Series');
        if (filterMusic.checked) itemTypes.push('Audio');
        
        if (itemTypes.length === 0) {
            throw new Error('Please select at least one item type to fetch');
        }
        
        // Build query parameters
        const queryParams = new URLSearchParams();
        queryParams.append('IncludeItemTypes', itemTypes.join(','));
        queryParams.append('Recursive', 'true');
        queryParams.append('EnableImageTypes', 'Primary,Backdrop');
        queryParams.append('Limit', '1000'); // Increased limit to 1000 items
        queryParams.append('Fields', 'Overview,Taglines,CriticRating,CommunityRating,ProductionYear,Studios,ImageTags,Name,Type,Genres'); // Include additional fields we need
        
        // Add filters
        const minRating = parseFloat(ratingFilter.value);
        if (minRating > 0) {
            queryParams.append('MinCommunityRating', minRating.toString());
        }
        
        const yearFromValue = parseInt(yearFrom.value);
        const yearToValue = parseInt(yearTo.value);
        
        // Convert years to ISO date strings for minPremiereDate and maxPremiereDate
        if (!isNaN(yearFromValue)) {
            const fromDate = new Date(yearFromValue, 0, 1); // January 1st of the from year
            queryParams.append('minPremiereDate', fromDate.toISOString());
        }
        
        if (!isNaN(yearToValue)) {
            const toDate = new Date(yearToValue, 11, 31); // December 31st of the to year
            queryParams.append('maxPremiereDate', toDate.toISOString());
        }
        
        // Add genre filter
        const selectedGenres = Array.from(genreFilter.selectedOptions).map(option => option.value);
        if (selectedGenres.length > 0) {
            queryParams.append('Genres', selectedGenres.join('|'));
        }
        
        // Add studio filter - using proper Studios parameter with | delimited values
        const selectedStudios = Array.from(studiosFilter.selectedOptions).map(option => option.value);
        if (selectedStudios.length > 0) {
            queryParams.append('Studios', selectedStudios.join('|'));
        }
        
        // Add search term if provided
        if (searchTerm.value.trim()) {
            queryParams.append('SearchTerm', searchTerm.value.trim());
        }
        
        // Add user ID to query parameters if available
        if (userId) {
            queryParams.append('UserId', userId);
        }
        
        const url = `${serverUrl}/Items?${queryParams.toString()}`;
        
        let authHeader = `MediaBrowser Client="Dirtflix Playlist Generator", Device="Web Browser", Version="1.0.0", Token="${apiKey}"`;
        
        // If we have a user ID, include it in the authorization header
        if (userId) {
            authHeader += `, UserId="${userId}"`;
        }
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'X-Emby-Authorization': authHeader,
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Process the items and add to master list
        processItems(data.Items);
        
        showStatusMessage(`Successfully fetched ${data.Items.length} items`, 'success');
    } catch (error) {
        console.error('Error fetching items:', error);
        showStatusMessage(`Error: ${error.message}`, 'danger');
    } finally {
        // Reset button state
        fetchItemsBtn.disabled = false;
        fetchItemsBtn.innerHTML = '<i class="fas fa-search me-2"></i>Fetch Items';
    }
}

function processItems(items) {
     if (!items || items.length === 0) {
         showStatusMessage('No items found matching your criteria', 'warning');
         return;
     }
     
     // Add new items to working list (avoid duplicates)
     const existingIds = workingList.map(item => item.Id);
     let newItemsAdded = 0;
     
     items.forEach(item => {
         if (!existingIds.includes(item.Id)) {
             workingList.push(item);
             newItemsAdded++;
         }
     });
     
     // Update UI
     updateWorkingListDisplay();
     
     if (newItemsAdded > 0) {
         showStatusMessage(`Added ${newItemsAdded} new items to the working list`, 'success');
     } else {
         showStatusMessage('No new items added - all items already in working list', 'info');
     }
 }

function updateMasterListDisplay() {
     // Update item count
     masterListCount.textContent = `${masterList.length} ${masterList.length === 1 ? 'item' : 'items'}`;
     
     // Enable/disable remove selected button based on whether we have items
     const removeSelectedBtn = document.getElementById('removeSelectedBtn');
     removeSelectedBtn.disabled = masterList.length === 0;
     savePlaylistBtn.disabled = masterList.length === 0;
     
     if (masterList.length === 0) {
         masterListContainer.innerHTML = `
             <div class="text-center py-5 text-muted">
                 <i class="fas fa-inbox fa-3x mb-3"></i>
                 <p>Your master list is empty</p>
                 <p>Use filters and click "Fetch Items" to populate the list</p>
             </div>
         `;
         return;
     }
     
     // Create HTML for items
     let html = '';
     
     masterList.forEach(item => {
         const itemHtml = `
             <div class="item-card">
                 <div class="card h-100">
                     <div class="card-header d-flex align-items-center">
                         <input type="checkbox" class="item-checkbox me-2" value="${item.Id}">
                         <h6 class="mb-0 flex-grow-1">${item.Name}</h6>
                     </div>
                     ${item.ImageTags && item.ImageTags.Primary ?
                         '<img src="' + serverUrlInput.value.trim() + '/Items/' + item.Id + '/Images/Primary?width=300&height=200" alt="' + item.Name + '" class="card-img-top item-image clickable-image">' :
                         '<div class="bg-light d-flex align-items-center justify-content-center item-image clickable-image" style="width: 300px; height: 200px;"><i class="fas fa-film fa-3x text-muted"></i></div>'
                     }
                     <div class="card-body">
                         ${item.ProductionYear ? `<p class="card-text item-year">Released: ${item.ProductionYear}</p>` : ''}
                         ${item.CommunityRating ? `<p class="card-text item-rating"><i class="fas fa-star"></i> ${item.CommunityRating}/10</p>` : ''}
                         ${item.Genres && item.Genres.length > 0 ? `<p class="card-text item-genres">Genres: ${item.Genres.join(', ')}</p>` : ''}
                         <p class="card-text">
                             <small class="text-muted">${item.Type === 'Movie' ? 'Movie' : 'TV Series'}</small>
                         </p>
                     </div>
                 </div>
             </div>
         `;
         
         html += itemHtml;
     });
     masterListContainer.innerHTML = html;
     
     // Use event delegation - attach one listener to the container instead of multiple listeners
     masterListContainer.addEventListener('click', function(event) {
         // Only trigger if clicking on an image with class 'clickable-image'
         const image = event.target.closest('.clickable-image');
         if (!image) return;
         
         // Find the item card that contains this image
         const card = image.closest('.item-card');
         if (!card) return;
         
         // Find the item in masterList that corresponds to this card by finding the checkbox within it
         const checkbox = card.querySelector('.item-checkbox');
         if (!checkbox) return;
         
         const itemId = checkbox.value;
         const item = masterList.find(item => item.Id === itemId);
         
         if (item) {
             showItemDetails(item);
         }
     });
 }

function updateWorkingListDisplay() {
     // Update item count
     workingListCount.textContent = `${workingList.length} ${workingList.length === 1 ? 'item' : 'items'}`;
     
     if (workingList.length === 0) {
         workingListContainer.innerHTML = `
             <div class="text-center py-5 text-muted">
                 <i class="fas fa-inbox fa-3x mb-3"></i>
                 <p>Your working list is empty</p>
                 <p>Use filters and click "Fetch Items" to populate the list</p>
             </div>
         `;
         return;
     }
     
     // Create HTML for items
     let html = '';
     
     workingList.forEach(item => {
         const itemHtml = `
             <div class="item-card">
                 <div class="card h-100">
                     <div class="card-header d-flex align-items-center">
                         <input type="checkbox" class="item-checkbox me-2" value="${item.Id}">
                         <h6 class="mb-0 flex-grow-1">${item.Name}</h6>
                     </div>
                     ${item.ImageTags && item.ImageTags.Primary ?
                         '<img src="' + serverUrlInput.value.trim() + '/Items/' + item.Id + '/Images/Primary?width=300&height=200" alt="' + item.Name + '" class="card-img-top item-image clickable-image">' :
                         '<div class="bg-light d-flex align-items-center justify-content-center item-image clickable-image" style="width: 300px; height: 200px;"><i class="fas fa-film fa-3x text-muted"></i></div>'
                     }
                     <div class="card-body">
                         ${item.ProductionYear ? `<p class="card-text item-year">Released: ${item.ProductionYear}</p>` : ''}
                         ${item.CommunityRating ? `<p class="card-text item-rating"><i class="fas fa-star"></i> ${item.CommunityRating}/10</p>` : ''}
                         ${item.Genres && item.Genres.length > 0 ? `<p class="card-text item-genres">Genres: ${item.Genres.join(', ')}</p>` : ''}
                         <p class="card-text">
                             <small class="text-muted">${item.Type === 'Movie' ? 'Movie' : 'TV Series'}</small>
                         </p>
                     </div>
                 </div>
             </div>
         `;
         
         html += itemHtml;
     });
     workingListContainer.innerHTML = html;
     
     // Use event delegation - attach one listener to the container instead of multiple listeners
     workingListContainer.addEventListener('click', function(event) {
         // Only trigger if clicking on an image with class 'clickable-image'
         const image = event.target.closest('.clickable-image');
         if (!image) return;
         
         // Find the item card that contains this image
         const card = image.closest('.item-card');
         if (!card) return;
         
         // Find the item in workingList that corresponds to this card by finding the checkbox within it
         const checkbox = card.querySelector('.item-checkbox');
         if (!checkbox) return;
         
         const itemId = checkbox.value;
         const item = workingList.find(item => item.Id === itemId);
         
         if (item) {
             showItemDetails(item);
         }
     });
 }

// Function to filter workingList to only include items that contain ALL currently selected genres
function conformToGenres() {
   // Get the currently selected genres from the genreFilter dropdown
   const selectedGenres = Array.from(genreFilter.selectedOptions).map(option => option.value);
   
   // If no genres are selected, show a message and return
   if (selectedGenres.length === 0) {
       showStatusMessage('Please select at least one genre to conform to', 'warning');
       return;
   }
   
   // Filter the workingList to only include items that contain ALL of the currently selected genres
   const filteredList = workingList.filter(item => {
       // If item doesn't have genres, exclude it from results
       if (!item.Genres || !Array.isArray(item.Genres)) {
           return false;
       }
       
       // Check if all selected genres are present in this item's genres
       return selectedGenres.every(genre => item.Genres.includes(genre));
   });
   
   // Update the workingList with filtered results
   workingList = filteredList;
   
   // Update display to show only filtered items
   updateWorkingListDisplay();
   
   // Show status message about how many items were removed
   const originalCount = workingList.length + (workingList.length - filteredList.length);
   if (filteredList.length < originalCount) {
       showStatusMessage(`Filtered list: ${filteredList.length} of ${originalCount} items remain`, 'success');
   } else {
       showStatusMessage('No items were removed from the list', 'info');
   }
}

function clearMasterList() {
     if (masterList.length === 0) {
         showStatusMessage('Master list is already empty', 'info');
         return;
     }
     
     if (confirm(`Are you sure you want to clear the ${masterList.length} items from your master list?`)) {
         masterList = [];
         updateMasterListDisplay();
         showStatusMessage('Master list cleared successfully', 'success');
     }
 }

function clearWorkingList() {
      if (workingList.length === 0) {
          showStatusMessage('Working list is already empty', 'info');
          return;
      }
      
      if (confirm(`Are you sure you want to clear the ${workingList.length} items from your working list?`)) {
          workingList = [];
          updateWorkingListDisplay();
          showStatusMessage('Working list cleared successfully', 'success');
      }
  }

function clearAllLists() {
      // Confirm with user before clearing
      if (confirm(`Are you sure you want to clear ALL items from both lists?\n\nWorking List: ${workingList.length} items\nMaster List: ${masterList.length} items`)) {
          // Clear working list
          workingList = [];
          updateWorkingListDisplay();
          
          // Clear master list
          masterList = [];
          updateMasterListDisplay();
          
          showStatusMessage('All lists cleared successfully', 'success');
      }
  }

function sendToMasterList() {
     if (workingList.length === 0) {
         showStatusMessage('Working list is empty. Nothing to transfer.', 'warning');
         return;
     }
     
     // Add all items from working list to master list (avoiding duplicates)
     const existingIds = masterList.map(item => item.Id);
     let newItemsAdded = 0;
     
     workingList.forEach(item => {
         if (!existingIds.includes(item.Id)) {
             masterList.push(item);
             newItemsAdded++;
         }
     });
     
     // Clear the working list
     workingList = [];
     
     // Update both displays
     updateMasterListDisplay();
     updateWorkingListDisplay();
     
     if (newItemsAdded > 0) {
         showStatusMessage(`Transferred ${workingList.length} items to master list. ${newItemsAdded} new items added.`, 'success');
     } else {
         showStatusMessage('All items were already in the master list', 'info');
     }
 }

function createPlaylist() {
    // This would normally open a modal or form for playlist details
    if (masterList.length === 0) {
        showStatusMessage('Cannot create playlist - master list is empty', 'warning');
        return;
    }
    
    // For demo purposes, we'll just set default values
    playlistName.value = `My Playlist ${new Date().toLocaleDateString()}`;
    playlistDescription.value = `Generated from Jellyfin items on ${new Date().toLocaleDateString()}`;
    
    showStatusMessage('Playlist details ready. Click "Save Playlist" to create it on your Jellyfin server', 'info');
}

async function savePlaylist() {
    if (masterList.length === 0) {
        showStatusMessage('Cannot save playlist - master list is empty', 'warning');
        return;
    }
    
    const playlistNameValue = playlistName.value.trim();
    if (!playlistNameValue) {
        showStatusMessage('Please enter a name for your playlist', 'warning');
        return;
    }
    
    // Show loading state
    showStatusMessage('Saving playlist to Jellyfin server...', 'info');
    savePlaylistBtn.disabled = true;
    savePlaylistBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...';
    
    try {
        const serverUrl = serverUrlInput.value.trim();
        const apiKey = apiKeyInput.value.trim();
        
        if (!serverUrl) {
            throw new Error('Please enter a Jellyfin server URL');
        }
        
        if (!apiKey) {
            throw new Error('Please enter your Jellyfin API key');
        }
        
       // Prepare playlist data
       const playlistData = {
           Name: playlistNameValue,
           Description: playlistDescription.value.trim(),
           UserId: userId || null,
           Users: userId ? [{
               UserId: userId,
               CanEdit: canEditCheckbox.checked
           }] : [],
           IsPublic: isPublicCheckbox.checked,
           MediaType: document.getElementById('mediaTypeSelect').value,
           Ids: masterList.map(item => item.Id)
       };
        
        let authHeader = `MediaBrowser Client="Dirtflix Playlist Generator", Device="Web Browser", Version="1.0.0", Token="${apiKey}"`;
        
        // If we have a user ID, include it in the authorization header
        if (userId) {
            authHeader += `, UserId="${userId}"`;
        }
        
        const response = await fetch(`${serverUrl}/Playlists`, {
            method: 'POST',
            headers: {
                'X-Emby-Authorization': authHeader,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(playlistData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        // Store the playlist ID for later use
        window.lastCreatedPlaylistId = result.Id;
        
        showStatusMessage(`Playlist "${playlistNameValue}" created successfully with ID: ${result.Id}`, 'success');
        
        // Note: Items are now added during playlist creation via the Ids parameter in playlistData
        // The automatic addition of items after 5 seconds has been removed as requested
    } catch (error) {
        console.error('Error saving playlist:', error);
        showStatusMessage(`Error creating playlist: ${error.message}`, 'danger');
    } finally {
        // Reset button state
        savePlaylistBtn.disabled = false;
        savePlaylistBtn.innerHTML = '<i class="fas fa-save me-2"></i>Save Playlist to Jellyfin';
    }
}

// Function to add items to a playlist using the Jellyfin API
async function addItemsToPlaylist(playlistId, itemIds, userId) {
    const serverUrl = serverUrlInput.value.trim();
    const apiKey = apiKeyInput.value.trim();
    
    if (!serverUrl) {
        throw new Error('Please enter a Jellyfin server URL');
    }
    
    if (!apiKey) {
        throw new Error('Please enter your Jellyfin API key');
    }
    
    // Prepare the request body
    const requestBody = {
        Ids: itemIds
    };
    
    let authHeader = `MediaBrowser Client="Dirtflix Playlist Generator", Device="Web Browser", Version="1.0.0", Token="${apiKey}"`;
    
    // If we have a user ID, include it in the authorization header
    if (userId) {
        authHeader += `, UserId="${userId}"`;
    }
    
    const response = await fetch(`${serverUrl}/Playlists/${playlistId}/Items`, {
        method: 'POST',
        headers: {
            'X-Emby-Authorization': authHeader,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}. Details: ${errorText}`);
    }
    
    return await response.json();
}

function showStatusMessage(message, type) {
    const alertClass = `alert alert-${type} alert-dismissible fade show`;
    
    const alertHtml = `
        <div class="${alertClass}" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;
    
    statusMessages.insertAdjacentHTML('afterbegin', alertHtml);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        const alert = document.querySelector('#statusMessages .alert');
        if (alert) {
            alert.remove();
        }
    }, 5000);
}

function removeSelectedItems() {
 // Get all checkboxes that are checked
 const checkboxes = document.querySelectorAll('.item-checkbox:checked');
 
 if (checkboxes.length === 0) {
     showStatusMessage('Please select at least one item to remove', 'warning');
     return;
 }
 
 // Get the IDs of items to be removed
 const idsToRemove = [];
 checkboxes.forEach(checkbox => {
     idsToRemove.push(checkbox.value);
 });
 
 // Filter out items with those IDs from masterList
 masterList = masterList.filter(item => !idsToRemove.includes(item.Id));
 
 // Update the display
 updateMasterListDisplay();
 
 showStatusMessage(`Removed ${idsToRemove.length} item(s) from the master list`, 'success');
}

// Sort the master list based on selected criteria
function sortMasterList(sortBy) {
    if (masterList.length === 0) return;
    
    // Create a copy of the array to avoid modifying the original
    const sortedList = [...masterList];
    
    switch (sortBy) {
        case 'alphabetical':
            // Sort alphabetically by name
            sortedList.sort((a, b) => {
                const nameA = (a.Name || '').toLowerCase();
                const nameB = (b.Name || '').toLowerCase();
                return nameA.localeCompare(nameB);
            });
            break;
            
        case 'releaseDate':
            // Sort by release date (newest first)
            sortedList.sort((a, b) => {
                const yearA = a.ProductionYear || 0;
                const yearB = b.ProductionYear || 0;
                return yearB - yearA; // Newest first
            });
            break;
            
        case 'rating':
            // Sort by critic rating (highest first)
            sortedList.sort((a, b) => {
                const ratingA = a.CommunityRating || 0;
                const ratingB = b.CommunityRating || 0;
                return ratingB - ratingA; // Highest first
            });
            break;
            
        case 'random':
            // Random sort using Fisher-Yates shuffle algorithm
            for (let i = sortedList.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [sortedList[i], sortedList[j]] = [sortedList[j], sortedList[i]];
            }
            break;
            
        default:
            // No sorting, keep original order
            break;
    }
    
    // Update the masterList with sorted items
    masterList = sortedList;
    
    // Update display to show sorted items
    updateMasterListDisplay();
}

// Function to show item details in modal
function showItemDetails(item) {
    // Set the current item being viewed
    currentModalItem = item;
    
    // Populate modal with item data
    document.getElementById('detailTitle').textContent = item.Name || '';
    document.getElementById('detailType').textContent = item.Type === 'Movie' ? 'Movie' : 'TV Series';
    
    // Studio information - this might be in different fields depending on Jellyfin API response
    let studio = '';
    if (item.Studios && item.Studios.length > 0) {
        studio = item.Studios[0].Name || '';
    } else if (item.Studio) {
        studio = item.Studio;
    }
    document.getElementById('detailStudio').textContent = studio || 'N/A';
    
    // Ratings
    document.getElementById('detailCriticRating').textContent = item.CriticRating ? item.CriticRating.toFixed(1) : 'N/A';
    document.getElementById('detailCommunityRating').textContent = item.CommunityRating ? item.CommunityRating.toFixed(1) : 'N/A';
    
    // Year
    document.getElementById('detailYear').textContent = item.ProductionYear || 'N/A';
    
    // Overview
    document.getElementById('detailOverview').textContent = item.Overview || 'No overview available.';
    
    // Tagline - add it conditionally if it exists
    const detailTagline = document.getElementById('detailTagline');
    const taglineSection = document.getElementById('taglineSection');
    if (item.Taglines && item.Taglines.length > 0) {
        detailTagline.textContent = item.Taglines[0]; // Display first tagline if multiple exist
        taglineSection.style.display = 'block'; // Show the tagline section
    } else {
        taglineSection.style.display = 'none'; // Hide the tagline section if no tagline exists
    }
    
    // Image - use primary image if available, otherwise show placeholder
    const detailImage = document.getElementById('detailImage');
    if (item.ImageTags && item.ImageTags.Primary) {
        detailImage.src = `${serverUrlInput.value.trim()}/Items/${item.Id}/Images/Primary?width=300&height=450`;
        detailImage.alt = item.Name;
    } else {
        // Show a placeholder image
        detailImage.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="450" viewBox="0 0 300 450"%3E%3Crect fill="%23e9ecef" width="300" height="450"/%3E%3Ctext fill="%236c757d" font-family="Verdana" font-size="24" x="150" y="225" text-anchor="middle"%3ENo Image%3C/text%3E%3C/svg%3E';
        detailImage.alt = 'No image available';
    }
    
    // Show the modal
    const modalElement = document.getElementById('itemDetailModal');
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
    
    // Ensure backdrop is properly handled when modal is closed
    modalElement.addEventListener('hidden.bs.modal', function () {
        // Reset the modal content to prevent stale data
        document.getElementById('detailTitle').textContent = '';
        document.getElementById('detailType').textContent = '';
        document.getElementById('detailStudio').textContent = '';
        document.getElementById('detailCriticRating').textContent = 'N/A';
        document.getElementById('detailCommunityRating').textContent = 'N/A';
        document.getElementById('detailYear').textContent = 'N/A';
        document.getElementById('detailOverview').textContent = '';
        document.getElementById('detailTagline').textContent = '';
        document.getElementById('detailImage').src = '';
        
        // Force cleanup of any lingering backdrop
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop) {
            backdrop.remove();
        }
    }, { once: true });
}

// Modified updateMasterListDisplay function with event delegation for better reliability
function updateMasterListDisplay() {
    // Update item count
    masterListCount.textContent = `${masterList.length} ${masterList.length === 1 ? 'item' : 'items'}`;
    
    // Enable/disable remove selected button based on whether we have items
    const removeSelectedBtn = document.getElementById('removeSelectedBtn');
    removeSelectedBtn.disabled = masterList.length === 0;
    savePlaylistBtn.disabled = masterList.length === 0;
    
    if (masterList.length === 0) {
        masterListContainer.innerHTML = `
            <div class="text-center py-5 text-muted">
                <i class="fas fa-inbox fa-3x mb-3"></i>
                <p>Your master list is empty</p>
                <p>Use filters and click "Fetch Items" to populate the list</p>
            </div>
        `;
        return;
    }
    
    // Create HTML for items
    let html = '';
    
    masterList.forEach(item => {
        const itemHtml = `
            <div class="item-card">
                <div class="card h-100">
                    <div class="card-header d-flex align-items-center">
                        <input type="checkbox" class="item-checkbox me-2" value="${item.Id}">
                        <h6 class="mb-0 flex-grow-1">${item.Name}</h6>
                    </div>
                    ${item.ImageTags && item.ImageTags.Primary ?
                        `<img src="${serverUrlInput.value.trim()}/Items/${item.Id}/Images/Primary?width=300&height=200"
                              alt="${item.Name}" class="card-img-top item-image clickable-image">` :
                        '<div class="bg-light d-flex align-items-center justify-content-center item-image clickable-image" style="width: 300px; height: 200px;"><i class="fas fa-film fa-3x text-muted"></i></div>'
                    }
                    <div class="card-body">
                        ${item.ProductionYear ? `<p class="card-text item-year">Released: ${item.ProductionYear}</p>` : ''}
                        ${item.CommunityRating ? `<p class="card-text item-rating"><i class="fas fa-star"></i> ${item.CommunityRating}/10</p>` : ''}
                        ${item.Genres && item.Genres.length > 0 ?
                            `<p class="card-text item-genres">${item.Genres.join(', ')}</p>` : '' }
                        <p class="card-text">
                            <small class="text-muted">${item.Type === 'Movie' ? 'Movie' : 'TV Series'}</small>
                        </p>
                    </div>
                </div>
            </div>
        `;
        
        html += itemHtml;
    });
    
    masterListContainer.innerHTML = html;
    
    // Use event delegation - attach one listener to the container instead of multiple listeners
    masterListContainer.addEventListener('click', function(event) {
        // Only trigger if clicking on an image with class 'clickable-image'
        const image = event.target.closest('.clickable-image');
        if (!image) return;
        
        // Find the item card that contains this image
        const card = image.closest('.item-card');
        if (!card) return;
        
        // Find the item in masterList that corresponds to this card by finding the checkbox within it
        const checkbox = card.querySelector('.item-checkbox');
        if (!checkbox) return;
        
        const itemId = checkbox.value;
        const item = masterList.find(item => item.Id === itemId);
        
        if (item) {
            showItemDetails(item);
        }
    });
}

// Function to remove selected items from working list
function removeSelectedFromWorkingList() {
    // Get all checkboxes that are checked in the working list
    const checkboxes = document.querySelectorAll('#workingListContainer .item-checkbox:checked');
    
    if (checkboxes.length === 0) {
        showStatusMessage('Please select at least one item to remove from working list', 'warning');
        return;
    }
    
    // Get the IDs of items to be removed
    const idsToRemove = [];
    checkboxes.forEach(checkbox => {
        idsToRemove.push(checkbox.value);
    });
    
    // Filter out items with those IDs from workingList
    workingList = workingList.filter(item => !idsToRemove.includes(item.Id));
    
    // Update the display
    updateWorkingListDisplay();
    
    showStatusMessage(`Removed ${idsToRemove.length} item(s) from the working list`, 'success');
}

// Function to show the help modal
function showHelpModal() {
    const helpModalElement = document.getElementById('helpModal');
    if (helpModalElement) {
        const helpModal = new bootstrap.Modal(helpModalElement);
        helpModal.show();
    }
}