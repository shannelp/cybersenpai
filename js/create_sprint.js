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

async function addSprint(sprint){
    try {
        if (await isActiveSprintExists() && sprint.isActive) {
            alert("Another sprint is already active! Please end the current sprint before force starting another!");
            return;
        }
        
        db.collection("sprints")
        .add(sprint)
        .then((docRef) => {
            console.log("Sprint added with ID: ", docRef.id);
            // Simulate saving task and redirect
            alert('Sprint created successfully!');
            window.location.href = '../html/sprint_backlog.html';  // Redirect back after saving
        })
        .catch((error) => {
            console.error("Error adding sprint: ", error);
            alert('Error creating sprint!');
        });
    } catch (error) {
        console.error("Error adding sprint: ", error);
        throw error;
    }
}

async function isActiveSprintExists() {
    const activeSprintQuery = await db.collection('sprints').where('isActive', '==', true).get();
    return !activeSprintQuery.empty;  // Returns true if there's at least one active sprint
}

// Handle form submission
document.getElementById('sprint-form').addEventListener('submit', (e) => {
    e.preventDefault();

    // Create new Date objects for startTime and endTime
    const sprintStart = new Date(document.getElementById('sprint-start-date').value);
    const sprintEnd = new Date(document.getElementById('sprint-end-date').value);
    const sprintStatus = document.getElementById('sprint-status').value;
    const activity = sprintStatus === "Active";

    if (sprintStart > sprintEnd) {
        alert("Sprint cannot end before start date!")
        return;
    }

    // Collect form data
    const sprintData = {
        name: document.getElementById('sprint-title').value, // data collection
        status: sprintStatus,
        startTime: sprintStart,
        endTime: sprintEnd,
        isActive: activity    // to check for the active sprint (if any)
    };
    
    console.log(sprintData); // For now, log the collected data (later, you'll send it to Firebase)
    addSprint(sprintData)// Redirect back after saving
});