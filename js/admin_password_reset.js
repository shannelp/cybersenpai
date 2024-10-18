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

let globalEmail; // Declare email in an outer scope to use it in the admin login function
let globalUser;

// Listen for changes in the user's authentication state
firebase.auth().onAuthStateChanged((user) => {
    // Check if a user is signed in
    if (user) {
        console.log("User is signed in:", user); // Log the user object for debugging
        globalUser = user;
        globalEmail = user.email;

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
        fetchSecurityQuestions(user.email);

    } else {
        // If no user is signed in, redirect to the login page
        window.location.href = "../html/login_page.html"; 
    }
});

// Function to fetch security questions from Firestore and display them
async function fetchSecurityQuestions(email) {
    try {
        const answersDoc = await db.collection('admin_security_answers').doc(email).get();

        if (answersDoc.exists) {
            const answersData = answersDoc.data();
            
            // Populate the security questions in the textareas
            document.getElementById('display-question1').value = answersData.question1.question;
            document.getElementById('display-question2').value = answersData.question2.question;
            document.getElementById('display-question3').value = answersData.question3.question;

        } else {
            alert('No security questions found for this email.');
        }
    } catch (error) {
        console.error('Error fetching security questions:', error);
    }
}



// Function to handle form submission and password reset
document.getElementById('password-reset-form').addEventListener('submit', async (e) => {
    e.preventDefault(); // Prevent form from submitting the default way

    const answer1 = document.getElementById('answer1').value;
    const answer2 = document.getElementById('answer2').value;
    const answer3 = document.getElementById('answer3').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (newPassword !== confirmPassword) {
        alert('Passwords do not match.');
        return;
    }

    try {
        // Fetch the user's security answers
        const answersDoc = await db.collection('admin_security_answers').doc(globalEmail).get();
        
        if (!answersDoc.exists) {
            throw new Error("No security answers found for this email.");
        }

        const answersData = answersDoc.data();

        // Check if the provided answers match
        if (answersData.question1.answer === answer1 && 
            answersData.question2.answer === answer2 && 
            answersData.question3.answer === answer3) {
            
            // Answers match, update the admin password in the Firestore users collection
            const adminConfigRef = db.collection('adminConfig').doc('adminPassword');
            await adminConfigRef.set({
                password: newPassword
            });

            alert('Password has been reset successfully.');
            window.location.href = '../html/login_team_board.html'; // Redirect after success

        } else {
            alert('Security answers do not match.');
        }

    } catch (error) {
        console.error('Error resetting password:', error);
        alert('Failed to reset password. Please try again.');
    }
});

// Listen for changes in the user's authentication state
firebase.auth().onAuthStateChanged((user) => {
    // Check if a user is signed in
    if (user) {
        console.log("User is signed in:", user); // Log the user object for debugging

        // Update the user info section in the HTML to display the user's email
        document.getElementById('user-info').innerHTML = `
            <p>${user.email}<br><small>Admin</small></p>
        `;
    } else {
        // If no user is signed in, redirect to the login page
        window.location.href = "../html/login_page.html"; 
    }
});