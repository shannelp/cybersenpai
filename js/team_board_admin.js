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
const db = firebase.firestore();

let globalUsers;
let globalTasks;

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
            <p>${user.email}<br><small>Admin</small></p>
        `;

    } else {
        // If no user is signed in, redirect to the login page
        window.location.href = "../html/login_page.html"; 
    }
});

// Toggle the display of the team dropdown
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

function setDate() {
    // Get the selected start and end dates
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;

    // Check if both dates are selected
    if (!startDate || !endDate) {
        alert('Please select both a start date and an end date.');
        return;
    }

    // Display selected dates in console (for now)
    console.log('Start Date:', startDate);
    console.log('End Date:', endDate);

    displayUsers(globalUsers, globalTasks, startDate, endDate)

    // Here you can add more logic, such as fetching data for the selected date range
    // For example, updating the UI based on the date range
}

// Function to get all users from Firestore
async function getAllUsers() {
    try {
        const querySnapshot = await db.collection("users").get();
        users = querySnapshot.docs.map(doc => {
            return {
                id: doc.id,
                ...doc.data()
            };
        });
        return users;
    } catch (error) {
        console.error("Error fetching tasks:", error);
        throw error;
    }
}

// Function to get all tasks from Firestore
async function getAllTasks() {
    try {
        const querySnapshot = await db.collection("task").get();
        tasks = querySnapshot.docs.map(doc => {
            return {
                id: doc.id,
                ...doc.data()
            };
        });
        return tasks;
    } catch (error) {
        console.error("Error fetching tasks:", error);
        throw error;
    }
}

function displayUsers(usersToDisplay, tasks, startDate, endDate){
    usersToDisplay.forEach((user) => {
        totalHour = getTotalHour(user, tasks, startDate, endDate);
        console.log(user.name, totalHour); //for debugging
    })
}


// Calculates the total hours and minutes worked by a user within a specified date range.
// If no startDate or endDate is provided, it sums all logged hours and minutes.
function getTotalHour(user, tasks, startDate, endDate) {
    let totalHours = 0;
    let totalMinutes = 0;

    // Iterate through each task
    tasks.forEach(task => {
        // Check if the task is assigned to the user
        if (task.assignee === user.name) {
            // Check if hoursLogged exists and is an array
            if (task.hoursLogged && Array.isArray(task.hoursLogged)) {
                // Iterate through the hoursLogged array of the task
                task.hoursLogged.forEach(log => {
                    const logDate = new Date(log.date);
                    const start = new Date(startDate);
                    const end = new Date(endDate);
                    
                    // If both startDate and endDate are provided, filter by date range
                    if ((!startDate || logDate >= start) && (!endDate || logDate <= end)) {
                        totalHours += log.hours || 0;   // Add hours (default to 0 if undefined)
                        totalMinutes += log.minutes || 0; // Add minutes (default to 0 if undefined)
                    }
                });
            }
        }
    });

    // Convert total minutes to hours and minutes
    totalHours += Math.floor(totalMinutes / 60);
    totalMinutes = totalMinutes % 60;

    // Return formatted string "{hours}h {minutes}m"
    return `${totalHours}h ${totalMinutes}m`;
}

// Initial display of all users
document.addEventListener('DOMContentLoaded', async () => {
    try {
        globalUsers = await getAllUsers();
        globalTasks = await getAllTasks();
        // startDate and endDate are not set by default.
        displayUsers(globalUsers, globalTasks, null, null);
    } catch (error) {
        console.error("Error loading tasks:", error);
        throw error;
    }
});

function displayUsers(usersToDisplay, tasks, startDate, endDate) {
    const membersList = document.getElementById('membersList');
    membersList.innerHTML = ''; // Clear previous content

    usersToDisplay.forEach((user) => {
        const totalHour = getTotalHour(user, tasks, startDate, endDate);
        const userItem = document.createElement('div');
        userItem.className = 'members-item'; // Apply styles from CSS

        userItem.innerHTML = `
            <form id="form-${user.id}">
                <div class="members-header">
                    <span>${user.name}</span>
                    <span class="logged-hours">${totalHour}</span> <!-- Centered logged hours -->
                    <button class="effort-bar-admin">See Effort Bar</button>
                </div>

        `;
        // Append userItem to membersList
        membersList.appendChild(userItem);

        // Add event listener to the form
        userItem.querySelector('form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const hours = e.target.hours.value;
            const minutes = e.target.minutes.value;

            // Here you would implement the logic to log the hours to Firestore
            await logHoursToFirestore(user.id, hours, minutes);
            alert(`Logged ${hours} hours and ${minutes} minutes for ${user.name}`);
            e.target.reset(); // Reset form fields
        });

        // Add event listener to the "See Effort Bar" button
        const effortBarButton = userItem.querySelector('.effort-bar-admin');
        effortBarButton.addEventListener('click', () => {
            displayEffortBar(user, tasks, startDate, endDate); // Call displayEffortBar with the user's name
        });
    });
}

function displayEffortBar(user, tasks, startDate, endDate){
    const data = getDataForChart(user, tasks, startDate, endDate)
    console.log(data)
}

// Returns data for chart in the format [{date: formattedDate(month/date), hours: Int, mins: Int}]
function getDataForChart(user, tasks, startDate, endDate) {
    const result = []; // Array to store the final results

    // Get the date range
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    // Iterate through each task
    tasks.forEach(task => {
        // Check if the task is assigned to the user
        if (task.assignee === user.name) {
            // Check if hoursLogged exists and is an array
            if (task.hoursLogged && Array.isArray(task.hoursLogged)) {
                // Iterate through the task's logged hours
                task.hoursLogged.forEach(log => {
                    // Ensure log is defined and has necessary properties
                    if (log && log.date) {
                        const logDate = new Date(log.date);
                        
                        // Check if the log date is within the specified range
                        if ((!start || logDate >= start) && (!end || logDate <= end)) {
                            // Format the date to "MM/DD"
                            const formattedDate = logDate.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });

                            // Find any existing entry for this date
                            const existingEntry = result.find(entry => entry.date === formattedDate);

                            if (existingEntry) {
                                // If an existing entry is found, add hours and minutes
                                existingEntry.hours += log.hours || 0;
                                existingEntry.mins += log.minutes || 0;

                                // If minutes exceed 60, adjust hours and minutes
                                if (existingEntry.mins >= 60) {
                                    existingEntry.hours += Math.floor(existingEntry.mins / 60);
                                    existingEntry.mins = existingEntry.mins % 60;
                                }
                            } else {
                                // Create a new entry if none exists
                                result.push({
                                    date: formattedDate,
                                    hours: log.hours || 0,
                                    mins: log.minutes || 0
                                });
                            }
                        }
                    }
                });
            }
        }
    });

    return result; // Return the array containing the total for each date
}