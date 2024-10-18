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

// Function to fetch hours log and display it in the history log
async function fetchHistoryLog(taskId) {
    console.log("Fetching history log for task ID:", taskId);
    try {
        const taskDoc = await db.collection("task").doc(taskId).get();
        const task = taskDoc.data();
        console.log("Task details:", task);
        const logList = document.getElementById('log-list');
        const totalTimeElement = document.getElementById('total-time-spent');

        if (task.hoursLogged && task.hoursLogged.length > 0) {
            let totalHours = 0;
            let totalMinutes = 0;

            task.hoursLogged.forEach(log => {
                totalHours += log.hours;
                totalMinutes += log.minutes;

                const logEntry = document.createElement('p');
                logEntry.innerHTML = `<strong>Date:</strong> ${log.date}, 
                    <strong>Name:</strong> ${log.name}, 
                    <strong>Time:</strong> ${log.hours}h ${log.minutes}min, 
                    <strong>Details:</strong> ${log.description}`;
                logList.appendChild(logEntry);
            });

            // Calculate the total time spent and update it
            totalHours += Math.floor(totalMinutes / 60); // Convert minutes to hours if > 60
            totalMinutes = totalMinutes % 60; // Get remaining minutes
            
            totalTimeElement.textContent = `TOTAL TIME SPENT: ${totalHours} HOURS ${totalMinutes} MINUTES`;

            // Set totalTime attribute in the task document in Firestore
            const taskRef = db.collection("task").doc(taskId);
            const totalTime = `${totalHours}h ${totalMinutes}min`; // Create the total time string or store total time in minutes
            await taskRef.update({
                totalTime: totalTime // Add the new attribute to Firestore
            });
            console.log(`Task ${taskId} updated with totalTime: ${totalTime}`);
        } else {
            logList.innerHTML = "<p>No history logs available yet.</p>";
        }
    } catch (error) {
        console.error("Error fetching history log:", error);
    }
}

// Helper function to get task ID from URL
function getTaskIdFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');  // Assuming 'id' is the query parameter for taskId
}

// Fetch history log when page loads
document.addEventListener('DOMContentLoaded', () => {
    const taskId = getTaskIdFromURL();
    if (taskId) {
        fetchHistoryLog(taskId);
    }
});
