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

// let tasks = []; // To store the current sprint tasks

function priorityMapping(priority) {
    const colourMapping = {
        Low: 'priority-low',
        Medium: 'priority-medium',
        Important: 'priority-high',
        Urgent: 'priority-urgent'
    };
    return colourMapping[priority];
}

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

async function getCurrentSprintTasks() {
    try {
        // Fetch tasks from only sprint_tasks collection
        const currentSprint = await getCurrentSprint();
        if (currentSprint){
            const querySnapshot = await db.collection("task")
                .where('sprintId', '==', currentSprint.id)
                .get();

            const sprintTasks = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            console.log("Sprint tasks:", sprintTasks);  // Debugging
            return sprintTasks;
        } else {
            console.log("No active sprint, no tasks to fetch.");
            return [];
        }
    } catch (error) {
        console.error("Error fetching sprint tasks:", error);
        throw error;
    }
}

function displaySprintTasks(tasks) {
    const tasksByStatus = {
        'Not-started': [],
        'In-progress': [],
        'Completed': []
    };

    // Clear the DOM for each column before re-populating
    const columns = document.querySelectorAll('#task-table-body td');
    columns.forEach(column => column.innerHTML = ''); // Ensure each column is cleared

    // Organize tasks by status
    tasks.forEach(task => {
        tasksByStatus[task.status].push(task);
    });

    // Populate the columns with tasks
    for (const status in tasksByStatus) {
        tasksByStatus[status].forEach(task => {
            console.log("Task:", task); // Debugging
            const taskElement = document.createElement('div');
            taskElement.className = `task-item ${priorityMapping(task.priority)}`;
            taskElement.textContent = task.name;
            taskElement.setAttribute('draggable', true);
            taskElement.setAttribute('data-task-id', task.id); // Add task ID for drag-and-drop
            taskElement.addEventListener('dragstart', drag);
            taskElement.addEventListener('click', () => {
                window.location.href = `../html/task_details.html?taskId=${task.id}`;
            });

            const statusIndex = {
                'Not-started': 0,
                'In-progress': 1,
                'Completed': 2
            }[task.status];

            const currentCell = document.querySelectorAll('#task-table-body td')[statusIndex];
            currentCell.appendChild(taskElement);
        });
    }
}

function allowDrop(event) {
    event.preventDefault();
}

function drag(event) {
    const taskId = event.target.getAttribute('data-task-id');
    console.log("Dragging task ID:", taskId); // Debugging
    event.dataTransfer.setData("task-id", taskId);
}

async function drop(event, newStatus) {
    event.preventDefault();
    const taskId = event.dataTransfer.getData("task-id"); // Retrieve the dragged task ID
    console.log("Dropped task ID:", taskId); // Debugging

    try {
        // Query by the "id" field in Firestore
        const tasks = await getCurrentSprintTasks()
        const taskToUpdate = tasks.find(task => task.id === taskId);

        if (taskToUpdate) {
            console.log("Found task to update:", taskToUpdate); // Debugging
            // Update the task status
            await db.collection("task").doc(taskId).update({ status: newStatus });
            const now = new Date();
            await db.collection("task").doc(taskId).update({ completedAt : now });
            // Refresh the UI with updated tasks
            const updatedTasks = await getCurrentSprintTasks();
            displaySprintTasks(updatedTasks);
        } else {
            console.log(`Task with ID ${taskId} not found in sprint_tasks.`);
        }
    } catch (error) {
        console.error("Error updating task status:", error);
    }
}

// Load the tasks into the sprint board when the page is loaded
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const sprintTasks = await getCurrentSprintTasks();
        console.log("Sprint tasks:", sprintTasks); // Debugging
        displaySprintTasks(sprintTasks); // Display the sprint tasks
    } catch (error) {
        console.error("Error displaying tasks:", error);
    }
});
