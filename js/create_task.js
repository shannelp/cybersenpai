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

//task: name, tag, storyPoint, projectStage, status, priority, assignee, typeOfStory

function addTask(task){
    try{
        db.collection("task")
        .add(task)
        .then((docRef) => {
            console.log("Task added with ID: ", docRef.id);
            // Simulate saving task and redirect
            alert('Task created successfully!');
            window.location.href = '../html/product_backlog.html';  // Redirect back after saving
        })
        .catch((error) => {
            console.error("Error adding task: ", error);
            alert('Error creating task!');
        });
    } catch (error) {
        console.error("Error adding task: ", error);
        throw error;
    }
}

const testTask = {
    name: "Implement create_task.js", 
    tag: "Back-end", 
    storyPoint: 3, 
    projectStage: "development", 
    status: "In progress", 
    priority: "Urgent",
    assignee: "AbcDef", 
    typeOfStory: "?",
    description: "this is for a test",
    createdAt: firebase.firestore.FieldValue.serverTimestamp() // Add timestamp for creation date
}

// addTask(testTask)

// Update Story Point display based on slider value
const taskPoints = document.getElementById('task-points');
const output = document.getElementById('story-point-output');
taskPoints.oninput = function() {
    output.textContent = this.value;
};

window.onload = function() {
    populateAssignees();
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
        name: document.getElementById('task-title').value, // dats collection
        tag: selectedTags,
        storyPoint: parseInt(document.getElementById('task-points').value, 10),
        projectStage: document.getElementById('project-stage').value,
        status: document.getElementById('task-status').value,
        priority: document.getElementById('task-priority').value,
        assignee: document.getElementById('task-assignee').value,
        typeOfStory: document.getElementById('task-type').value,
        description: document.getElementById('task-desc').value,
        createdAt: firebase.firestore.FieldValue.serverTimestamp() // Add current timestamp
    };
    
    console.log(taskData); // For now, log the collected data (later, you'll send it to Firebase)
    addTask(taskData)// Redirect back after saving
});