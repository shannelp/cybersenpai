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

// Function to get the task ID from the URL
function getTaskIdFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('taskId');
}

// Function to get the total spent time from the hours log.
function getTotalTime(hoursLogged){

    let totalHours = 0;
    let totalMinutes = 0;

    if (hoursLogged == null){
        return;
    }

    const entries = Object.values(hoursLogged);

    for (let entry of entries) {
        totalHours += entry.hours;
        totalMinutes += entry.minutes;
    }

    totalHours += Math.floor(totalMinutes / 60);
    totalMinutes = totalMinutes % 60;

    return `${totalHours} hours ${totalMinutes} mins`;
}

// Function to display task details dynamically
async function displayTaskDetails(taskId) {
    console.log("Fetching task details for task ID:", taskId);
    try {
        const taskDoc = await db.collection("task").doc(taskId).get();
        console.log("Firestore TaskDoc response:", taskDoc);
        console.log("Document Exists:", taskDoc.exists);

        if (!taskDoc.exists) {
            alert("Task not found!");
            return;
        }

        // Extract task data
        const task = taskDoc.data();
        console.log("Task details:", task);

        const taskDetailsElement = document.getElementById('task-details');
        console.log("Task details element:", taskDetailsElement);
        
        // Dynamically populate the task details
        let taskDetailsHTML = `
            <h2>${task.name}</h2>
            <p><strong>Description:</strong> ${task.description || 'No description provided'}</p>
            <p><strong>Assignee:</strong> ${task.assignee || 'Not assigned'}</p>
            <p><strong>Status:</strong> ${task.status}</p>
            <p><strong>Hours Logged:</strong> ${getTotalTime(task.hoursLogged) || 'N/A'}</p>
            <button class="see-history-btn" onclick="window.location.href='../html/history_log.html?id=${taskId}'">SEE HISTORY</button>
        `;

        // Only display the edit button if the task status is "In-progress"
        if (task.status === "In-progress") {
            taskDetailsHTML += `<button class="edit-btn" onclick="window.location.href='../html/hours_log.html?id=${taskId}'">EDIT</button>`;
        }

        // Add the remove button
        taskDetailsHTML += `<button class="remove-btn" onclick="removeFromSprint('${taskId}')">REMOVE</button>`;

        // Set the task details HTML
        taskDetailsElement.innerHTML = taskDetailsHTML;

    } catch (error) {
        console.error("Error fetching task details:", error);
    }
}

// Function to remove the task from the sprint board
async function removeFromSprint(taskId) {
    const confirmation = confirm("Are you sure you want to remove this task from the sprint board?");
    if (!confirmation) return;

    try {
        const taskRef = db.collection("task").doc(taskId);
        const taskDoc = await taskRef.get();

        if (!taskDoc.exists) {
            alert("This task is not in the sprint board.");
            return;
        }

        await taskRef.update({
            sprintId: firebase.firestore.FieldValue.delete()  // Delete sprintId field.
        });

        alert("Task removed from the sprint board.");
        window.location.href = "../html/sprint_backlog.html";  // Redirect back to sprint backlog after deletion
    } catch (error) {
        console.error("Error removing task from sprint board:", error);
        alert("Failed to remove task from sprint board.");
    }
}


// When the page loads, get the task ID from the URL and display the task details
document.addEventListener('DOMContentLoaded', () => {
    const taskId = getTaskIdFromURL();
    if (taskId) {
        displayTaskDetails(taskId);
    }
});
