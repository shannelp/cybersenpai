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

const teamMemberSelect = document.getElementById('team-member-select');
const taskDropdown = document.getElementById('task-dropdown');
const warningMessage = document.getElementById('warning-message');
const saveButton = document.querySelector('.save-btn');

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

function populateTeamMembers() {
    db.collection('users').get()
        .then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
                const userData = doc.data();
                const option = document.createElement('option');
                option.value = userData.name;
                option.textContent = userData.name;
                teamMemberSelect.appendChild(option);
            });
        })
        .catch((error) => {
            console.error('Error fetching users:', error);
        });
}

// add members to the drop down list
populateTeamMembers();

// Save button click event
saveButton.addEventListener('click', async function () {
    const selectedUserName = teamMemberSelect.value;
    
    if (selectedUserName) {
        try {
            const hasTask = await checkAssignedTasks(selectedUserName); // await to get the boolean result
            console.log(hasTask);

            if (!hasTask) {
                removeUser(selectedUserName);
            }
        } catch (error) {
            console.error('Error checking tasks:', error);
        }
    } else {
        alert("Please select a team member.");
    }
});

// check if the user to remove is assigned to tasks
async function checkAssignedTasks(userName) {
    try {
        const querySnapshot = await db.collection('task').where('assignee', '==', userName).get();

        if (!querySnapshot.empty) {
            taskDropdown.style.display = 'block';
            warningMessage.style.display = 'block';

            const assignedTasksSelect = document.getElementById('assigned-tasks');
            assignedTasksSelect.innerHTML = '';

            querySnapshot.forEach((doc) => {
                const taskData = doc.data();
                const option = document.createElement('option');
                option.value = taskData.id;
                option.textContent = taskData.name;
                assignedTasksSelect.appendChild(option);
            });

            return true;
        } else {
            taskDropdown.style.display = 'none';
            warningMessage.style.display = 'none';
            return false;
        }
    } catch (error) {
        console.error('Error fetching tasks for user:', error);
        return false;
    }
}

async function removeUser(name) {
    try {
        const userSnapshot = await firebase.firestore().collection('users').where('name', '==', name).get();

        if (userSnapshot.empty) {
            console.log(`user "${name}" not found.`);
            return;
        }

        const userDoc = userSnapshot.docs[0];
        const uid = userDoc.data().uid;

        await firebase.firestore().collection('users').doc(uid).delete();
        console.log(`user "${name}" has been deleted from firestore.`);
        window.location.href = "../html/remove_team_member.html";
    } catch (error) {
        console.error("Error deleting user:", error);
        alert("Failed to delete the user. Please try again.");
    }
}