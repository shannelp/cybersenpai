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
            <p>${user.email}<br><small>Admin</small></p>
        `;

    } else {
        // If no user is signed in, redirect to the login page
        window.location.href = "../html/login_page.html"; 
    }
});

// Wait for the DOM to load, then attach the event listener
document.addEventListener('DOMContentLoaded', () => {
    const saveButton = document.getElementById('save-btn');
    saveButton.addEventListener('click', addTeamMember); // Attach the event listener to call addTeamMember when clicked
});

// Function to add a new team member to the 'users' collection
async function addTeamMember() {
    const name = document.getElementById('userName').value;
    const email = document.getElementById('emailAddress').value;

    // Validate input fields
    if (!name || !email) {
        alert("Please fill in all fields.");
        return;
    }

    try {
        // Check if the email already exists in the uid-email collection
        const uidEmailDoc = await db.collection("uid-email").where("email", "==", email).get();
        
        let uid;

        if (!uidEmailDoc.empty) {
            // Email already exists, get the corresponding UID
            uid = uidEmailDoc.docs[0].data().uid;
            console.log(`Email already exists with UID: ${uid}`);
        } else {
            // Email doesn't exist, create a new user in Firebase Authentication
            const userCredential = await auth.createUserWithEmailAndPassword(email, 'password12345');
            const user = userCredential.user;
            uid = user.uid;

            // Add the UID and email to the uid-email collection
            await db.collection("uid-email").doc(uid).set({
                email: email,
                uid: uid
            });

            console.log(`New user created with UID: ${uid}`);
        }

        // Prepare the user entry for Firestore
        const memberEntry = {
            name: name,
            email: email,
            uid: uid
        };

        // Add the team member to the users collection in Firestore
        await db.collection("users").doc(uid).set(memberEntry);

        alert("Team member added successfully!");
        // Optionally, clear the form fields after a successful entry
        document.getElementById('userName').value = '';
        document.getElementById('emailAddress').value = '';

    } catch (error) {
        console.error("Error adding team member:", error.message);
        alert("Failed to add team member: " + error.message);
    }
}
