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

function getTaskIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

async function populateAssignees() {
    const selectElement = document.getElementById('task-assignee');
    
    try {
        const querySnapshot = await db.collection('users').get();
        
        selectElement.innerHTML = '';
        
        querySnapshot.forEach(doc => {
            const userData = doc.data();
            const option = document.createElement('option');
            option.value = userData.name; 
            option.textContent = userData.name; 
            selectElement.appendChild(option);
        });
    } catch (error) {
        console.error('Error fetching users: ', error);
    }
}

async function updateTask(task){
    try{
        await db.collection("task")
        .doc(task.id)
        .update(task)
        alert('Task updated successfully!');
        window.location.href = '../html/product_backlog.html';  // Redirect back after saving
    } catch (error) {
        console.error("Error adding task: ", error);
        throw error;
    }
}

const taskId = getTaskIdFromUrl();

window.onload = function() {
    populateAssignees();

    if (taskId){
        db.collection("task")
            .doc(taskId)
            .get()
            .then((doc) => {
                console.log(taskId)
                if (doc.exists) {
                    const task = doc.data();
    
                    document.getElementById('task-title').value = task.name;
                    document.getElementById('task-points').value = task.storyPoint;
                    document.getElementById('story-point-output').textContent = task.storyPoint;
                    document.getElementById('project-stage').value = task.projectStage;
                    document.getElementById('task-status').value = task.status;
                    document.getElementById('task-priority').value = task.priority;
                    document.getElementById('task-assignee').value = task.assignee;
                    document.getElementById('task-type').value = task.typeOfStory;
                    document.getElementById('task-desc').value = task.description;
    
                    const selectedTags = task.tag;
                    document.querySelectorAll('#dropdown-list input[type="checkbox"]').forEach((checkbox) => {
                        if (selectedTags.includes(checkbox.value)) {
                            checkbox.checked = true;
                        }
                    });
                } else {
                    console.log("No such document!");
                }
            })
            .catch((error) => {
                console.log("Error getting document:", error);
            });
    } 
};

// Handle form submission
document.getElementById('task-form').addEventListener('submit', (e) => {
    e.preventDefault();

    const selectedTags = [];
    const checkboxes = document.querySelectorAll('#dropdown-list input[type="checkbox"]:checked');
    checkboxes.forEach((checkbox) => {
        selectedTags.push(checkbox.value);
    });

    // Collect form data
    const taskData = {
        id: taskId,
        name: document.getElementById('task-title').value, // dats collection
        tag: selectedTags,
        storyPoint: parseInt(document.getElementById('task-points').value, 10),
        projectStage: document.getElementById('project-stage').value,
        status: document.getElementById('task-status').value,
        priority: document.getElementById('task-priority').value,
        assignee: document.getElementById('task-assignee').value,
        typeOfStory: document.getElementById('task-type').value,
        description: document.getElementById('task-desc').value,
    };
    
    console.log(taskData); // For now, log the collected data (later, you'll send it to Firebase)
    updateTask(taskData)// Redirect back after saving
});