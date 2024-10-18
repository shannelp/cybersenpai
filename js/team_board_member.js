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

let globalUser;
let globalTasks;
let myChart = null;

// Listen for changes in the user's authentication state
firebase.auth().onAuthStateChanged(async (user) => {
    if (user) {
        console.log("User is signed in:", user);
        try {
            const userDoc = await db.collection('users').doc(user.uid).get();
            if (userDoc.exists) {
                globalUser = userDoc.data();
                console.log("globalUser data:", globalUser);
                const wallpaperUrl = globalUser.wallpaper || '../images/anime-girl-short-hairs-crossing-street-on-rainy-day-pa-1920x1200.jpg';

                document.body.style.backgroundImage = `url(${wallpaperUrl})`;

                document.getElementById('user-info').innerHTML = `
                    <p>${user.email}<br><small>Team Member</small></p>
                `;

                await loadTasksAndDisplay();
            } else {
                console.error('User document not found in Firestore');
            }
        } catch (error) {
            console.error('Error fetching user document:', error);
        }
    } else {
        window.location.href = "../html/login_page.html";
    }
});

// Function to get all tasks from Firestore
async function getAllTasks() {
    try {
        const querySnapshot = await db.collection("task").get();
        const tasks = querySnapshot.docs.map(doc => {
            return {
                id: doc.id,
                ...doc.data()
            };
        });
        return tasks;
    } catch (error) {
        console.error("Error fetching tasks:", error);
        throw error;
    }
}

// Function to generate an array of all dates between startDate and endDate
function getDateRange(startDate, endDate) {
    const dateArray = [];
    let currentDate = new Date(startDate);
    while (currentDate <= new Date(endDate)) {
        dateArray.push(new Date(currentDate).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }));
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return dateArray;
}

// Update the getDataForChart to include zero hours for missing dates
function getDataForChart(user, tasks, startDate, endDate) {
    const result = [];
    const allDates = getDateRange(startDate, endDate);

    allDates.forEach(date => {
        result.push({
            date: date,
            hours: 0,
            mins: 0
        });
    });

    tasks.forEach(task => {
        if (task.assignee === user.name) {
            if (task.hoursLogged && Array.isArray(task.hoursLogged)) {
                task.hoursLogged.forEach(log => {
                    if (log && log.date) {
                        const logDate = new Date(log.date).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
                        const existingEntry = result.find(entry => entry.date === logDate);
                        if (existingEntry) {
                            existingEntry.hours += log.hours || 0;
                            existingEntry.mins += log.minutes || 0;

                            if (existingEntry.mins >= 60) {
                                existingEntry.hours += Math.floor(existingEntry.mins / 60);
                                existingEntry.mins = existingEntry.mins % 60;
                            }
                        }
                    }
                });
            }
        }
    });

    return result;
}

// Calculates the total hours and minutes worked by a user during the selected period
function getTotalHour(user, tasks, startDate, endDate) {
    let totalHours = 0;
    let totalMinutes = 0;

    tasks.forEach(task => {
        if (task.assignee === user.name) {
            if (task.hoursLogged && Array.isArray(task.hoursLogged)) {
                task.hoursLogged.forEach(log => {
                    const logDate = new Date(log.date);
                    const start = new Date(startDate);
                    const end = new Date(endDate);

                    if ((!startDate || logDate >= start) && (!endDate || logDate <= end)) {
                        totalHours += log.hours || 0;
                        totalMinutes += log.minutes || 0;
                    }
                });
            }
        }
    });

    totalHours += Math.floor(totalMinutes / 60);
    totalMinutes = totalMinutes % 60;

    return { totalHours, totalMinutes };
}

// Function to calculate average hours worked per day
function calculateAverage(totalHours, totalMinutes, startDate, endDate) {
    const dateRange = getDateRange(startDate, endDate);
    const totalDays = dateRange.length;
    const totalTimeInMinutes = totalHours * 60 + totalMinutes;
    const averageTimeInMinutes = totalTimeInMinutes / totalDays;

    const averageHours = Math.floor(averageTimeInMinutes / 60);
    const averageMinutes = Math.floor(averageTimeInMinutes % 60);

    return { averageHours, averageMinutes };
}

function displayChart(user, tasks, startDate, endDate) {
    const data = getDataForChart(user, tasks, startDate, endDate);

    const labels = data.map(entry => entry.date);
    const hoursData = data.map(entry => entry.hours + entry.mins / 60);

    const ctx = document.getElementById('myChart').getContext('2d');

    if (myChart) {
        myChart.destroy();
    }

    myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Hours Worked',
                data: hoursData,
                backgroundColor: 'rgba(54, 162, 235, 0.6)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Dates'
                    },
                    ticks: {
                        autoSkip: false,
                        maxRotation: 90,
                        minRotation: 45
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Hours Worked'
                    },
                    beginAtZero: true,
                    min: 0,
                    ticks: {
                        stepSize: 1
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: `Your average working hour in the selected timeframe: ${document.getElementById('avg-hours').textContent}`
                }
            }
        }
    });
}

// Function to set the date range and calculate the average
function setDate() {
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;

    if (!startDate || !endDate) {
        alert('Please select both a start date and an end date.');
        return;
    }

    const { totalHours, totalMinutes } = getTotalHour(globalUser, globalTasks, startDate, endDate);
    const { averageHours, averageMinutes } = calculateAverage(totalHours, totalMinutes, startDate, endDate);

    document.getElementById('avg-hours').textContent = `${averageHours}h ${averageMinutes}m`;

    displayChart(globalUser, globalTasks, startDate, endDate);
}

// Function to load tasks and display them
async function loadTasksAndDisplay() {
    try {
        globalTasks = await getAllTasks();
        const { totalHours, totalMinutes } = getTotalHour(globalUser, globalTasks, null, null);
        const { averageHours, averageMinutes } = calculateAverage(totalHours, totalMinutes, null, null);
        document.getElementById('avg-hours').textContent = `${averageHours}h ${averageMinutes}m`;

        displayChart(globalUser, globalTasks, null, null);
    } catch (error) {
        console.error("Error loading tasks:", error);
    }
}
