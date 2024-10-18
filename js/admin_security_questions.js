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
const auth = firebase.auth();
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

const securityQuestions = [
    "What was your childhood nickname?",
    "In what city were you born?",
    "What is the name of your favorite childhood friend?",
    "What street did you live on in third grade?",
    "What is your oldest sibling’s birthday month and year?",
    "What is the middle name of your oldest child?",
    "What is your favorite movie?",
    "What was the make and model of your first car?",
    "What is your mother’s maiden name?",
    "What was the name of your first pet?"
];

// Elements for dropdowns and displaying selected questions
const question1 = document.getElementById('question1');
const question2 = document.getElementById('question2');
const question3 = document.getElementById('question3');
const displayQuestion1 = document.getElementById('display-question1');
const displayQuestion2 = document.getElementById('display-question2');
const displayQuestion3 = document.getElementById('display-question3');

// Function to populate the dropdowns with all security questions
function populateQuestions(selectElement) {
    selectElement.innerHTML = '<option value="" disabled selected>Select a question</option>';
    securityQuestions.forEach((question) => {
        const option = document.createElement('option');
        option.value = question;
        option.textContent = question;
        selectElement.appendChild(option);
    });
}

// Populate the dropdowns initially
populateQuestions(question1);
populateQuestions(question2);
populateQuestions(question3);

// Function to update the displayed question when selected
function updateDisplayedQuestion(selectElement, displayElement) {
    const selectedValue = selectElement.options[selectElement.selectedIndex].text;
    if (selectElement.value) {
        displayElement.value = selectedValue; // Show the full selected question in the textarea
    } else {
        displayElement.value = '';  // Clear the display if no question is selected
    }
}

// Update displayed questions when a dropdown value changes
function updateDropdowns() {
    updateDisplayedQuestion(question1, displayQuestion1);
    updateDisplayedQuestion(question2, displayQuestion2);
    updateDisplayedQuestion(question3, displayQuestion3);
}

// Add event listeners to each dropdown
question1.addEventListener('change', updateDropdowns);
question2.addEventListener('change', updateDropdowns);
question3.addEventListener('change', updateDropdowns);

// Function to save answers to Firestore
async function saveAnswers() {
    const email = auth.currentUser.email;  // Get the currently logged-in user's email
    const selectedQuestion1Value = question1.value;
    const selectedQuestion2Value = question2.value;
    const selectedQuestion3Value = question3.value;
    const answer1 = document.getElementById('answer1').value;
    const answer2 = document.getElementById('answer2').value;
    const answer3 = document.getElementById('answer3').value;

    // Check if all questions and answers are filled
    if (!selectedQuestion1Value || !selectedQuestion2Value || !selectedQuestion3Value || !answer1 || !answer2 || !answer3) {
        alert("Please fill in all fields.");
        return;
    }

    const adminAnswers = {
        email: email,  // Store the email along with the answers
        question1: { question: selectedQuestion1Value, answer: answer1 },
        question2: { question: selectedQuestion2Value, answer: answer2 },
        question3: { question: selectedQuestion3Value, answer: answer3 },
        timestamp: new Date() // Save a timestamp for when the answers were saved
    };

    try {
        // Save the answers to the "admin_security_answers" collection in Firestore
        const adminAnswersRef = db.collection("admin_security_answers").doc(email);
        await adminAnswersRef.set(adminAnswers);
        alert("Security answers saved successfully.");
        window.location.href = "../html/team_board_options.html"; // Redirect to team_board_options.html
    } catch (error) {
        console.error("Error saving answers: ", error);
        alert("Failed to save answers. Please try again.");
    }
}

// Submit button event listener to save answers
document.getElementById('submit-btn').addEventListener('click', (e) => {
    e.preventDefault();
    saveAnswers();
});