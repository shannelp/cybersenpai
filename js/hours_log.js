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
const db = firebase.firestore();

let globalTaskId;

// Listen for changes in the user's authentication state
firebase.auth().onAuthStateChanged((user) => {
    // Check if a user is signed in
    if (user) {
        console.log("User is signed in:", user); // Log the user object for debugging

        // Get the user's document from Firestore
        db.collection('users').doc(user.uid).get().then((doc) => {
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

// Function to populate the team members dropdown
// Function to populate the team members dropdown
async function populateTeamMembersDropdown() {
    const teamSelect = document.getElementById('log-name');
    
    // Clear the dropdown first, then add the placeholder
    teamSelect.innerHTML = ''; // Clear any existing options
    const placeholderOption = document.createElement('option');
    placeholderOption.value = '';
    placeholderOption.disabled = true;
    placeholderOption.selected = true;
    placeholderOption.hidden = true;
    placeholderOption.textContent = 'Select Assignee';
    teamSelect.appendChild(placeholderOption); // Add placeholder at the top
    
    try {
        const teamMembersSnapshot = await db.collection('users').get(); // Fetch team members
        teamMembersSnapshot.forEach((doc) => {
            const teamMember = doc.data();
            const option = document.createElement('option');
            option.value = teamMember.name; // Set the value as the team member's name
            option.textContent = teamMember.name; // Display the team member's name in the dropdown
            teamSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error fetching team members:', error);
    }
}


// Function to fetch hours log data for the task
async function fetchHoursLog(taskId) {
    try {
        const taskDoc = await db.collection("task").doc(taskId).get();
        const task = taskDoc.data();
        const logList = document.getElementById('log-list');

        if (task.hoursLogged && task.hoursLogged.length > 0) {
            task.hoursLogged.forEach(log => {
                const logEntry = document.createElement('p');
                logEntry.innerHTML = `<strong>Date:</strong> ${log.date}, 
                    <strong>Time:</strong> ${log.hours}h ${log.minutes}min`;
                logList.appendChild(logEntry);
            });
        } else {
            logList.innerHTML = "<p>No logs available yet.</p>";
        }
    } catch (error) {
        console.error("Error fetching hours log:", error);
    }
}

// Show log input fields and populate assignee field if a task is found
async function showLogInput() {
    document.getElementById('log-input').style.display = 'block';
    if (!globalTaskId) {
        console.error('Task ID not found');
        return;
    }
    try {
        const taskDoc = await db.collection("task").doc(globalTaskId).get();
        if (taskDoc.exists) {
            const task = taskDoc.data();
            document.getElementById('log-name').value = task.assignee;
        } else {
            console.error('Task not found.');
        }
    } catch (error) {
        console.error('Error getting task assignee:', error);
    }
}

// Function to add a new log entry
async function addLog() {
    const taskId = getTaskIdFromURL();
    const logDate = document.getElementById('log-date').value;
    const logHours = document.getElementById('log-hours').value;
    const logMinutes = document.getElementById('log-minutes').value;
    const logName = document.getElementById('log-name').value;
    const logDescription = document.getElementById('log-description').value;

    // Ensure all fields are filled
    if (!logDate || logHours === "" || logMinutes === "" || logName === "" || logDescription === "") {
        alert("Please fill in all fields.");
        return;
    }

    const logEntry = {
        date: logDate,
        hours: parseInt(logHours, 10),
        minutes: parseInt(logMinutes, 10),
        name: logName,
        description: logDescription
    };

    try {
        const taskRef = db.collection("task").doc(taskId);
        const taskDoc = await taskRef.get();
        if (!taskDoc.exists) {
            alert("Task not found.");
            return;
        }

        const taskData = taskDoc.data();
        const existingLogs = taskData.hoursLogged || [];

        // Add the new log entry to the existing logs
        await taskRef.update({
            hoursLogged: [...existingLogs, logEntry]
        });

        alert("Log added successfully!");
        location.reload(); // Refresh the page to display the new log
    } catch (error) {
        console.error("Error adding log:", error);
        alert("Failed to add log. Please try again.");
    }
}

// Helper function to get task ID from URL
function getTaskIdFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id'); // Assuming 'id' is the query parameter for taskId
}

// Populate the team members dropdown and fetch hours log when page loads
document.addEventListener('DOMContentLoaded', () => {
    globalTaskId = getTaskIdFromURL();
    if (globalTaskId) {
        fetchHoursLog(globalTaskId);
    }
    populateTeamMembersDropdown();
});
