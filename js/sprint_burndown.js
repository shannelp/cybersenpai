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
// project_management.js
const ctx = document.getElementById('burndownChart').getContext('2d');

// Example data: x-axis is days, y-axis is remaining tasks
// const labels = ['Oct 2', 'Oct 3', 'Oct 4', 'Oct 5', 'Oct 6', 'Oct 7', 'Oct 8', 'Oct 9', 'Oct 10', 'Oct 11']; // Days of the sprint
// const idealData = [100, 90, 80, 70, 60, 50, 40, 30, 20, 10, 0]; // Ideal remaining tasks (linear)
// const actualData = [100, 85, 75, 70, 65, 55, 45, 35, 30, 20]; // Actual remaining tasks (example)

function getSprintIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('sprintId');
}

async function getBurndownData(sprintId) {
    const tasksRef = firebase.firestore().collection('task');
    try {
        // Get all tasks for the sprint
        const querySnapshot = await tasksRef.where('sprintId', '==', sprintId).get();
        const tasks = [];
        querySnapshot.forEach((doc) => {
            tasks.push({ id: doc.id, ...doc.data() });
        });

        // Get start and end time of the sprint (assuming you have these stored in the sprint)
        const sprint = await getSprintData(sprintId); // Implement this function to fetch sprint data
        const startTime = sprint.startTime.toDate();
        const endTime = sprint.endTime.toDate();

        const dateRangeElem = document.getElementById('date-range');
        dateRangeElem.value = `${startTime.toLocaleDateString()} => ${endTime.toLocaleDateString()}`;

        // Generate date range
        const dateRange = getDateRange(startTime, endTime); // Helper to generate all dates between start and end

        // Calculate the burndown data
        const totalStoryPoints = tasks.reduce((sum, task) => sum + (task.storyPoint || 0), 0); // Total story points

        const remainingStoryPointsPerDay = dateRange.map((date) => {
            const completedPoints = tasks
                .filter(task => task.completedAt && task.completedAt.toDate() <= date)
                .reduce((sum, task) => sum + (task.storyPoint || 0), 0);

            return totalStoryPoints - completedPoints; // Remaining story points for that day
        });

        // Create ideal line data (linear decrease)
        const idealLineData = dateRange.map((date, index) => {
            const totalDays = dateRange.length - 1; // Total number of days
            return totalStoryPoints - (totalStoryPoints / totalDays) * index; // Linear decrease
        });

        return {
            labels: dateRange.map(date => date.toLocaleDateString()), // Format the dates for x-axis
            remainingStoryPoints: remainingStoryPointsPerDay,
            idealLine: idealLineData // Ideal line data
        };
    } catch (error) {
        console.error("Error retrieving burndown data: ", error);
        return { labels: [], remainingStoryPoints: [], idealLine: [] };
    }
}

// Helper function to generate date range (1-day intervals)
function getDateRange(startDate, endDate) {
    const dates = [];
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1); // Move to the next day
    }

    return dates;
}

// Fetch sprint data (example function to fetch sprint details)
async function getSprintData(sprintId) {
    const sprintDoc = await firebase.firestore().collection('sprints').doc(sprintId).get();
    return sprintDoc.exists ? sprintDoc.data() : null;
}

// Load the chart with actual data
async function loadBurndownChart(sprintId) {
    const burndownData = await getBurndownData(sprintId);

    const burndownChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: burndownData.labels,
            datasets: [
                {
                    label: 'Remaining Story Points',
                    data: burndownData.remainingStoryPoints,
                    fill: false,
                    borderColor: 'rgba(255, 99, 132, 1)',
                    tension: 0.1
                },
                {
                    label: 'Ideal Line',
                    data: burndownData.idealLine,
                    fill: false,
                    borderColor: 'rgba(75, 192, 192, 1)', // Change color for the ideal line
                    borderDash: [5, 5], // Dashed line
                    tension: 0.1
                }
            ]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Remaining Story Points'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Day'
                    },
                    ticks: {
                        autoSkip: false // Show every day on the x-axis
                    }
                }
            }
        }
    });
}

const sprintId = getSprintIdFromUrl(); // Assuming you get sprintId from URL
if (sprintId) {
    loadBurndownChart(sprintId);
}
