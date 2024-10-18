let currentFilter = [];  // Default filter 
let currentTags = [];  // Default tags 
let tasks = [];
let isAscending = true;
// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDM1NW5KnuQBjAvhmyZNGw2IPryX-XkVIc",
    authDomain: "fit2101-team4-33a7c.firebaseapp.com",
    projectId: "fit2101-team4-33a7c",
    storageBucket: "fit2101-team4-33a7c.appspot.com",
    messagingSenderId: "994238089468",
    appId: "1:994238089468:web:aab8b310b1c9317c6e6f79",
    measurementId: "G-MKHL29F6MM"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
const db = firebase.firestore();
let globalUser;

// Listen for changes in the user's authentication state
firebase.auth().onAuthStateChanged((user) => {
    // Check if a user is signed in
    if (user) {
        console.log("User is signed in:", user); // Log the user object for debugging
        globalUser = user;

        // Get the user's document from Firestore
        db.collection('users').doc(globalUser.uid).get().then((doc) => {
            if (doc.exists) {
                const userData = doc.data();
                const wallpaperUrl = userData.wallpaper || '../images/anime-girl-short-hairs-crossing-street-on-rainy-day-pa-1920x1200.jpg';

                // Set the background image
                document.body.style.backgroundImage = `url(${wallpaperUrl})`;
            } else {
                console.log("No such document!");
            }
        }).catch((error) => {
            console.log("Error getting document:", error);
        });

        // Update the user info section in the HTML to display the user's email
        document.getElementById('user-info').innerHTML = `
            <p>${user.email}<br><small>Team Member</small></p>
        `;

    } else {
        // If no user is signed in, redirect to the login page
        window.location.href = "../html/login_page.html"; 
    }
});

// Function to update wallpaper field in Firestore for the current user
function updateWallpaper(wallpaperUrl) {
    // const currentUser = auth.currentUser;
    if (globalUser) {
        const userDocRef = db.collection('users').doc(globalUser.uid);

        // Update the wallpaper field
        userDocRef.update({
            wallpaper: wallpaperUrl
        }).then(() => {
            console.log("Wallpaper updated successfully!");
            // Change the background after the wallpaper is updated
            document.body.style.backgroundImage = `url(${wallpaperUrl})`;
        }).catch((error) => {
            console.error("Error updating wallpaper:", error);
        });
    } else {
        console.log("No user is signed in.");
    }
}

// Add event listeners for each wallpaper button
document.getElementById('team-dropdown').addEventListener('click', function(event) {
    if (event.target.tagName === 'BUTTON') {
        const selectedWallpaper = event.target.textContent;

        // Define the mapping of wallpaper based on selection
        let wallpaperUrl;
        if (selectedWallpaper === 'City') {
            wallpaperUrl = '../images/anime-girl-short-hairs-crossing-street-on-rainy-day-pa-1920x1200.jpg';
        } else if (selectedWallpaper === 'Nature') {
            wallpaperUrl = '../images/beautiful-waterfall-landscape.jpg';
        } else if (selectedWallpaper === 'Futuristic') {
            wallpaperUrl = '../images/peakpx.jpg';
        }

        // Update the wallpaper in Firestore and change the background
        updateWallpaper(wallpaperUrl);
    }
});

// Function to get all tasks from Firestore
async function getAllTasks() {
    try {
        const querySnapshot = await db.collection("task").get();
        tasks = querySnapshot.docs.map(doc => {
            return {
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt ? doc.data().createdAt.toDate() : null // Convert Firestore Timestamp to JS Date
            }; // can use : new Date (0) to set date 01/01/1970, : new Date () to set to current date, or null for no date
        });
        return tasks;
    } catch (error) {
        console.error("Error fetching tasks:", error);
        throw error;
    }
}

function priorityMapping(priority) {
    const colourMapping = {
        Low: 'priority-low',
        Medium: 'priority-medium',
        Important: 'priority-high',
        Urgent: 'priority-urgent'
    };
    return colourMapping[priority];
}

// Display the tasks on the page with a details dropdown
function displayTasks(tasksToDisplay) {
    const taskList = document.getElementById('task-list');
    taskList.innerHTML = '';  // Clear the task list before re-populating

    tasksToDisplay.forEach((task, index) => {
        const taskElement = document.createElement('div');
        const tagsHTML = task.tag.map(selected => `<span class="task-tag">${selected}</span>`).join(' ')
        // taskElement.className = 'task-item';

        // Format the createdAt date
        const createdAt = task.createdAt ? task.createdAt.toLocaleDateString() : 'Unknown';

        taskElement.className = `task-item ${priorityMapping(task.priority)}`;

        taskElement.setAttribute('onclick', `toggleDetails(${index})`); // Makes the entire task-item clickable

        taskElement.addEventListener('dblclick', (event) => {
            event.stopPropagation();
            window.location.href=`../html/edit_task.html?id=${task.id}`;
        });

        taskElement.innerHTML = `
            <div class="triangle-story-point" data-point="${task.storyPoint}"></div> <!-- Story point in triangle -->
            <div class="task-header">
                <h3>${task.name}</h3>
            </div>
            <div class="task-priority">${task.priority}</div>
            <div class="task-tags">${tagsHTML}</div>
            <div class="task-details" id="details-${index}">
                <p><strong>Tag:</strong> ${tagsHTML}</p>
                <p><strong>Project Stage:</strong> ${task.projectStage}</p>
                <p><strong>Task Status:</strong> ${task.status}</p>
                <p><strong>Priority:</strong> ${task.priority}</p>
                <p><strong>Story Point:</strong> ${task.storyPoint}</p>
                <p><strong>Type of Story:</strong> ${task.typeOfStory}</p>
                <p><strong>Assignee:</strong> ${task.assignee}</p>
                <p><strong>Description:</strong> ${task.description}</p>
                <p><strong>Date Created:</strong> ${createdAt}</p>
                <button class="edit-btn" onclick="window.location.href='../html/edit_task.html?id=${task.id}'">EDIT</button>
                <button class="delete-btn" onclick="deleteTask(${index})">DELETE</button>
            </div>
        `;
        const arrowButton = document.createElement('div');
        arrowButton.className = 'task-arrow';
        arrowButton.innerHTML = '&#x2192;';
        arrowButton.addEventListener('click', () => moveToSprint(task.id));  // Trigger the moveToSprint function on click
        taskElement.appendChild(arrowButton);

        taskList.appendChild(taskElement);
    });
}

// Initial display of all tasks
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const tasks = await getAllTasks();
        displayTasks(tasks);
    } catch (error) {
        console.error("Error loading tasks:", error);
        throw error;
    }
    // // Samples
    // displayTasks(tasks);
});

// Function to filter task names based on user input
function filterTaskNames() {
    const input = document.getElementById('task-search').value.toLowerCase(); // Get user input
    const dropdown = document.getElementById('search-dropdown'); // Dropdown for suggestions
    
    // Clear previous suggestions
    dropdown.innerHTML = '';

    if (input) {
        // Filter tasks based on whether the first letter of the first word matches
        // and whether the entire task name matches the input
        const filteredTasks = tasks.filter(task => {
            const firstWord = task.name.split(' ')[0]; // Get the first word of the task name
            return (
                //firstWord[0].toLowerCase() === input[0] || // Check if the first letter matches
                //task.name.toLowerCase() === input // Check if the entire task name matches
                task.name.toLowerCase().includes(input) // Check if the task name includes the user input
            );
        });

        // Show dropdown if there are filtered tasks
        if (filteredTasks.length > 0) {
            dropdown.style.display = 'block'; // Show dropdown
            filteredTasks.forEach(task => {
                // Create a div for each filtered task
                const taskDiv = document.createElement('div');
                taskDiv.textContent = task.name; // Set the task name as the text
                taskDiv.onclick = () => {
                    // Handle task selection (e.g., display task details or navigate)
                    console.log(`Selected task: ${task.name}`);
                    dropdown.style.display = 'none'; // Hide dropdown after selection
                    document.getElementById('task-search').value = task.name; // Set input value to selected task name
                    displayTasks([task]); // Display the selected task
                };
                dropdown.appendChild(taskDiv); // Append to dropdown
            });
        } else {
            dropdown.style.display = 'none'; // Hide dropdown if no matches
        }
    } else {
        dropdown.style.display = 'none'; // Hide dropdown if input is empty
    }
    displayTasks(tasks); // Display all tasks if input is empty
}

async function deleteTask(index) {
    try {
        // Get the task ID from the tasks array using the index
        const taskId = tasks[index].id;

        // Delete the task from Firestore using its ID
        await db.collection("task").doc(taskId).delete();

        // Remove the task from the local tasks array
        tasks.splice(index, 1);

        // Update the displayed tasks on the page
        displayTasks(tasks);

        console.log(`Task with ID: ${taskId} has been deleted.`);
    } catch (error) {
        console.error("Error deleting task:", error);
        alert("Failed to delete the task. Please try again.");
    }
}

// Function to toggle task details visibility
function toggleDetails(index) {
    const details = document.getElementById(`details-${index}`);
    if (details.style.display === "none" || !details.style.display) {
        details.style.display = "block";
    } else {
        details.style.display = "none";
    }
}

// Sorting tasks based on the selected criteria
function sortTasks(criteria) {
    // Toggle the sorting order between ascending and descending
    isAscending = !isAscending;

    dateTasks = tasks; // Copy the original tasks to a new array for sorting by date
    if (criteria === 'date') {
        dateTasks.sort((a, b) => {
            const dateA = a.createdAt ? a.createdAt : new Date(0);
            const dateB = b.createdAt ? b.createdAt : new Date(0);
            return (dateA - dateB) * (isAscending ? 1 : -1); // Sort by date
        });
        displayTasks(dateTasks);  // Re-display the sorted tasks
    // Check if currentTags is not empty (assumes no status filter is selected)
    } else if (currentTags.length > 0) { 
        newTasks = currentTags; // Use the filtered tasks for sorting
        if (criteria === 'priority') {
            // Sort tasks based on priority
            newTasks.sort((a, b) => {
                // Define the order of priorities
                const priorityOrder = { Low: 1, Medium: 2, Important: 3, Urgent: 4 };
                // Sort tasks based on the defined priority order
                return (priorityOrder[a.priority] - priorityOrder[b.priority]) * (isAscending ? 1 : -1);
            });
        displayTasks(newTasks);  // Re-display the sorted tasks
        };
        // Check if there are status filters applied and current tags selected
    } else if (currentFilter.length > 0 && currentTags.length > 0) {
        newTasks2 = currentTags; // Use the filtered tasks for sorting
        if (criteria === 'priority') {
             // Sort tasks based on priority
            newTasks2.sort((a, b) => {
                // Define the order of priorities
                const priorityOrder = { Low: 1, Medium: 2, Important: 3, Urgent: 4 };
                // Sort tasks based on the defined priority order
                return (priorityOrder[a.priority] - priorityOrder[b.priority]) * (isAscending ? 1 : -1);
            });
        displayTasks(newTasks2);  // Re-display the sorted tasks
    };
    // Check if currentFilter is not empty (assumes no tags are selected, only status filters)
    } else if (currentFilter.length > 0) {
        newTasks3 = currentFilter; // Use the filtered tasks for sorting
        if (criteria === 'priority') {
            // Sort tasks based on priority
            newTasks3.sort((a, b) => {
                // Define the order of priorities
                const priorityOrder = { Low: 1, Medium: 2, Important: 3, Urgent: 4 };
                // Sort tasks based on the defined priority order
                return (priorityOrder[a.priority] - priorityOrder[b.priority]) * (isAscending ? 1 : -1);
            });
        displayTasks(newTasks3);  // Re-display the sorted tasks
        };
    } else {
        // If no filters or tags are applied, sort the original tasks
        if (criteria === 'priority') {
            // Sort the original tasks based on priority
            tasks.sort((a, b) => {
                // Define the order of priorities
                const priorityOrder = { Low: 1, Medium: 2, Important: 3, Urgent: 4 };
                 // Sort tasks based on the defined priority order
                return (priorityOrder[a.priority] - priorityOrder[b.priority]) * (isAscending ? 1 : -1);
            });
        };
        displayTasks(tasks);  // Re-display the sorted tasks
    }
}


// Filtering tasks based on status
function filterTasks(status) {
    // Reset the current filter criteria to start fresh for each call
    currentFilter = [];

    let filteredTasks; // Variable to hold the tasks after filtering
    if (status === 'all') {
        // If the status is 'all', show all tasks
        filteredTasks = tasks;
    } else {
        // Otherwise, filter tasks based on the selected status
        filteredTasks = tasks.filter(task => task.status === status);
    }
    // Update currentFilter to hold the tasks that match the filter criteria
    currentFilter = filteredTasks;
    displayTasks(currentFilter);  // Re-display only the filtered tasks
}

let tagsSelected = [];

// Function to check which tags are selected by the user
function checkSelectedTags() {
    // Select all checkbox inputs in the tags section
    const checkboxes = document.querySelectorAll('.tags-section input[type="checkbox"]');

    // Create an array of selected tag values based on checked checkboxes
    tagsSelected = Array.from(checkboxes)
        .filter(checkbox => checkbox.checked) // Keep only checked checkboxes
        .map(checkbox => checkbox.value); // Map to their values (tag names)

    // If no tags are selected and there is an existing status filter applied
    if (tagsSelected.length === 0 && currentFilter.length > 0) {
        currentTags = []; // Clear currentTags
        // Display tasks filtered by the existing currentFilter
        displayTasks(currentFilter);

      // If no tags are selected and no filters are applied
    } else if (tagsSelected.length === 0) {
        currentTags = []; // Clear currentTags
        // Display all tasks since no filters or tags are selected
        displayTasks(tasks);
    } else {
        // If there are selected tags
        filterTasksByTags();  // Filter tasks by the selected tags
    }
}

// Function to filter tasks based on selected tags
function filterTasksByTags() {
    // If there are currently applied filters
    if (currentFilter.length > 0) {
        // Filter the tasks from currentFilter based on selected tags
        const filteredByTags = currentFilter.filter(task =>
            tagsSelected.every(selected => task.tag.includes(selected)) // Keep tasks that include all selected tags
        );
        currentTags = filteredByTags; // Update currentTags with the filtered tasks
        displayTasks(currentTags); // Display the filtered tasks
      // If there are no current filters applied
    } else {
    // Filter the original tasks based on selected tags
    const filteredByTags = tasks.filter(task =>
        tagsSelected.every(selected => task.tag.includes(selected)) // Keep tasks that include all selected tags
    );
    currentTags = filteredByTags; // Update currentTags with the filtered tasks
    displayTasks(currentTags); // Display the filtered tasks
}
}


// Toggle the display of dropdown menus
document.querySelector('.sort-by-btn').addEventListener('click', function() {
    document.getElementById('sort-dropdown').classList.toggle('show');
});

document.querySelector('.filter-btn').addEventListener('click', function() {
    document.getElementById('filter-dropdown').classList.toggle('show');
});

// Close the dropdowns if the user clicks outside of them
window.onclick = function(event) {
    // Check if the clicked target is not one of the dropdown buttons or inside the dropdowns
    if (!event.target.matches('.sort-by-btn') && !event.target.matches('.filter-btn') &&
    !event.target.closest('#sort-dropdown') && !event.target.closest('#filter-dropdown')) {
        // Get all dropdown content elements
        const dropdowns = document.getElementsByClassName("dropdown-content");
        // Loop through each dropdown content element
        for (let i = 0; i < dropdowns.length; i++) {
            const openDropdown = dropdowns[i];
            // If the dropdown is currently open (visible)
            if (openDropdown.classList.contains('show')) {
                // Remove the 'show' class to hide the dropdown
                openDropdown.classList.remove('show');
            }
        }
    }
};

async function getCurrentSprint(){
    try {
        const querySnapshot = await db.collection('sprints')
            .where('isActive', '==', true)
            .limit(1)
            .get()
        if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            console.log("Current Sprint:", doc.data());  // Debugging
            return { id: doc.id, ...doc.data() };
        } else {
            console.log("No active sprints.");
            return null;
        }
    } catch (error) {
        console.error("Error fetching the current sprint:", error);
        throw error;
    }
}

async function moveToSprint(taskId) {
    try {
        const currentSprint = await getCurrentSprint();

        if (currentSprint){
            const taskRef = db.collection("task").doc(taskId)

            const taskDoc = await taskRef.get();

            if (!taskDoc.exists) {
                alert("Task not found!")
            } else {
                const task = taskDoc.data();

                if (task.sprintId && task.sprintId === currentSprint.id) {
                    alert("This task is already in the sprint.");
                } else {
                    await taskRef.update({
                        sprintId: currentSprint.id
                    });
            
                    alert("Task moved to sprint successfully!");
                }
            }
        } else {
            console.log("No active sprint, no tasks to fetch.");
        }
    } catch (error) {
        console.error("Error moving task to sprint:", error);
        alert("Failed to move task to sprint. Please try again.");
    }
}

// Toggle the display of the wallpaper dropdown
document.getElementById('manageTeamBtn').addEventListener('click', function() {
    document.getElementById('team-dropdown').classList.toggle('show');
});

// Close the dropdown if the user clicks outside of it
window.onclick = function(event) {
    // Check if the clicked target is not the dropdown button or inside the dropdown
    if (!event.target.matches('#manageTeamBtn') && !document.getElementById('team-dropdown').contains(event.target)) {
        // If the dropdown is open (has 'show' class), close it
        const dropdown = document.getElementById('team-dropdown');
        if (dropdown.classList.contains('show')) {
            dropdown.classList.remove('show');
        }
    }
};

