// Firebase SDKs
// Import Firebase modules
// import { initializeApp } from "firebase/app";
// import { getFirestore } from "firebase/firestore";
// import { collection, getDocs } from "firebase/firestore";

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

// Function to get all tasks from Firestore
async function getAllSprints() {
    try {
        const querySnapshot = await db.collection("sprints").get();
        sprints = querySnapshot.docs.map(doc => {
            return {
                id: doc.id,
                ...doc.data()
            };
        });
        return sprints;
    } catch (error) {
        console.error("Error fetching sprints:", error);
        throw error;
    }
}

// Display the sprints on the page with a details dropdown
function displaySprints(sprintsToDisplay) {
    const sprintList = document.getElementById('sprintList');
    sprintList.innerHTML = '';  // Clear the sprint list before re-populating

    sprintsToDisplay.forEach((sprint, index) => {
        const sprintElement = document.createElement('div');
        sprintElement.className = 'sprint-item';
        
        const startTime = sprint.startTime.toDate();
        const endTime = sprint.endTime.toDate();
        const activeBar = sprint.isActive ? '<div class="active-bar">ACTIVE</div>' : '';
        sprintElement.innerHTML = `
            <div class="sprint-header">
                <h3>${sprint.name} ${activeBar}</h3>
            </div>
            <div class="sprint-details" id="details-${index}">
                <p><strong></strong></p>
                <p><strong>Status:</strong> ${sprint.status}</p>
                <p><strong>Start time:</strong> ${startTime.toLocaleString()}</p>
                <p><strong>End time:</strong> ${endTime.toLocaleString()}</p>
                <button class="force-start-btn" onclick="forceStartSprint('${sprint.id}')">Force Start Sprint</button>
                <button class="remove-sprint-btn" onclick="deleteSprint('${sprint.id}')">Remove Sprint</button>
                <button class="burndown-chart-btn" 
                    onclick="redirectToBurndownChart('${sprint.id}')">See Burndown Chart</button>
            </div>
        `;
        sprintList.appendChild(sprintElement);
    });

    boardButtonCheck();
}

function redirectToBurndownChart(sprintId) {
    const url = `../html/sprint_burndown.html?sprintId=${sprintId}`;
    window.location.href = url;
}

async function forceStartSprint(sprintId) {
    try {
        const activeSprintQuery = await db.collection('sprints').where('isActive', '==', true).get();

        if (!activeSprintQuery.empty) {
            const activeName = activeSprintQuery.docs[0].data().name;
            alert(`${activeName} is already active! Please end the current sprint before force starting another!`);
            return;
        }
        
        const sprintDoc = await db.collection('sprints').doc(sprintId).get();
        const sprintData = sprintDoc.data();

        const newEndTime = sprintData.status == "Completed" ? 
            new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : sprintData.endTime;

        await db.collection('sprints').doc(sprintId).update({
            startTime: new Date(),
            endTime: newEndTime,
            status: "Active",
            isActive: true
        });
        console.log("The selected sprint has been activated.")
        alert("Sprint successfully activated!");

        const sprints = await getAllSprints();
        displaySprints(sprints);

    } catch (error) {
        console.error("Error activating sprint:", error);
        throw error;
    }
}

async function endCurrentSprint() {
    try {
        const activeSprintQuery = await db.collection('sprints').where('isActive', '==', true).get();

        if (activeSprintQuery.empty) {
            alert("There is currently no active sprint!");
            return;
        }

        const sprintId = activeSprintQuery.docs[0].id;
        await db.collection('sprints').doc(sprintId).update({
            endTime: new Date(),
            status: "Completed",
            isActive: false
        });

        const boardTasks = await db.collection('sprint_tasks').get();
        const batch = db.batch();
        boardTasks.forEach(doc => {
            batch.delete(doc.ref);
        });

        await batch.commit();
        console.log("The current sprint has been ended.")
        alert("Current sprint successfully ended!");

        const sprints = await getAllSprints();
        displaySprints(sprints);

    } catch (error) {
        console.error("Error ending current sprint:", error);
        throw error;
    }
}

async function deleteSprint(sprintId) {
    try {
        // Delete the sprint from Firestore using its ID
        await db.collection("sprints").doc(sprintId).delete();

        // Fetch the updated list of sprints from Firestore
        const updatedSprints = await getAllSprints();

        // Update the displayed sprints on the page
        displaySprints(updatedSprints);

        console.log(`Sprint with ID: ${sprintId} has been deleted.`);
    } catch (error) {
        console.error("Error deleting sprint:", error);
        alert("Failed to delete the sprint. Please try again.");
    }
}

async function checkSprintStatus() {
    try {
        const sprints = await getAllSprints();
        const now = new Date();

        // Get any active sprint
        const activeSprintQuery = await db.collection('sprints').where('isActive', '==', true).get();
        if (!activeSprintQuery.empty) {
            const activeSprint = activeSprintQuery.docs[0];
            const activeSprintData = activeSprint.data();
            const activeEndTime = activeSprintData.endTime.toDate();

            // End the current sprint if its endTime has passed
            if (now >= activeEndTime) {
                await db.collection('sprints').doc(activeSprint.id).update({
                    status: "Completed",
                    isActive: false
                });
                console.log(`Sprint ${activeSprintData.name} has ended automatically.`);
            }
        }

        for (const sprint of sprints) {
            const startTime = sprint.startTime.toDate();
            const endTime = sprint.endTime.toDate();

            if (now >= startTime && now < endTime && !sprint.isActive) {
                // End any currently active sprint
                if (!activeSprintQuery.empty) {
                    const currentActiveSprintId = activeSprintQuery.docs[0].id;
                    await db.collection('sprints').doc(currentActiveSprintId).update({
                        endTime: new Date(),
                        status: "Completed",
                        isActive: false
                    });
                    console.log("Ended the currently active sprint before starting a new one.");
                }

                await db.collection('sprints').doc(sprint.id).update({
                    status: "Active",
                    isActive: true
                });
                console.log(`Sprint ${sprint.name} has started!`);
                const updatedSprints = await getAllSprints();
                displaySprints(updatedSprints); //
            };

            if (now >= endTime && sprint.isActive) {
                await db.collection('sprints').doc(sprint.id).update({
                    status: "Completed",
                    isActive: false
                });
                console.log(`Sprint ${sprint.name} has ended!`);
                const updatedSprints = await getAllSprints();
                displaySprints(updatedSprints); //
            };
        };
        
    } catch (error) {
        console.error("Error updating sprints:", error);
    }
}

function scheduleChecks() {
    const now = new Date();
    const delayToNextMin = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();

    setTimeout(() => {
        checkSprintStatus();
        setInterval(checkSprintStatus, 60000);
    }, delayToNextMin);
}

async function boardButtonCheck() {
    try {
        const activeSprintQuery = await db.collection('sprints').where('isActive', '==', true).get();
        const sprintBoardBtn = document.getElementById('sprintBoardBtn');

        if (activeSprintQuery.empty) {
            sprintBoardBtn.disabled = true;
            sprintBoardBtn.style.opacity = 0.5;
        }

        else {
            sprintBoardBtn.disabled = false;
            sprintBoardBtn.style.opacity = 1;
        }
    } catch (error) {
        console.error("Error checking active sprint:", error);
    }
}


// Initial display of all sprints
document.addEventListener('DOMContentLoaded', async () => {
    scheduleChecks();
    try {
        const sprints = await getAllSprints();
        displaySprints(sprints);
    } catch (error) {
        console.error("Error loading sprints:", error);
        throw error;
    }
});