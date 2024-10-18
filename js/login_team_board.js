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

let email; // Declare email in an outer scope to use it in the admin login function
let globalUser;

// Listen for changes in the user's authentication state
firebase.auth().onAuthStateChanged((user) => {
    // Check if a user is signed in
    if (user) {
        console.log("User is signed in:", user); // Log the user object for debugging
        globalUser = user
        email = user.email; // Get the email of the currently logged-in user
        console.log('Logged in user email:', email);
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

// Default password for admin
let defaultAdminPassword = '';

// Function to retrieve admin password from Firestore
async function getAdminPassword() {
    try {
        const adminConfigRef = db.collection('adminConfig').doc('adminPassword');
        const adminConfigDoc = await adminConfigRef.get();

        if (adminConfigDoc.exists) {
            const adminConfigData = adminConfigDoc.data();
            defaultAdminPassword = adminConfigData.password;  // Update the global admin password
            console.log('Admin password fetched from Firestore:', defaultAdminPassword);
        } else {
            console.log('No admin password found in Firestore.');
        }
    } catch (error) {
        console.error('Error fetching admin password from Firestore:', error);
    }
}

// Call the function to fetch the password as soon as the page loads
getAdminPassword();

// Function to wipe all documents in admin_security_answers
async function wipeAdminSecurityAnswersCollection() {
    const adminAnswersRef = db.collection('admin_security_answers');
    
    try {
        const snapshot = await adminAnswersRef.get();
        if (!snapshot.empty) {
            const batch = db.batch();
            snapshot.forEach((doc) => {
                batch.delete(doc.ref); // Delete each document
            });
            await batch.commit();  // Commit the batch delete
            console.log("All documents wiped from admin_security_answers collection.");
        } else {
            console.log("No documents to delete.");
        }
    } catch (error) {
        console.error("Error wiping admin_security_answers collection:", error);
    }
}

// Handle admin login
document.getElementById('admin-login').addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('error-message');

    try {

        // Step 1: Retrieve the user document from the 'users' collection using their email
        const usersSnapshot = await db.collection('users').where('email', '==', email).get();

        if (usersSnapshot.empty) {
            throw new Error("User not found");
        }

        // Step 2: Check if the entered password matches the default admin password
        if (password !== defaultAdminPassword) {
            throw new Error("Incorrect admin password");
        }

        // Step 3: If the password is correct, update the current user's isAdmin field to true
        const userDoc = usersSnapshot.docs[0];  // We assume there's only one user with the provided email
        const userId = userDoc.id;
        
        await db.collection('users').doc(userId).update({
            isAdmin: true
        });

        // Step 4: Set all other users' isAdmin field to false
        const allUsersSnapshot = await db.collection('users').get();
        allUsersSnapshot.forEach(async (doc) => {
            if (doc.id !== userId) {  // Skip the current admin
                await db.collection('users').doc(doc.id).update({
                    isAdmin: false
                });
            }
        });

        // Check if the email exists in the admin_security_answers collection
        const answersDoc = await db.collection('admin_security_answers').doc(email).get();

        if (answersDoc.exists) {
            // Email found, redirect to team_board_options.html
            window.location.href = '../html/team_board_options.html';
        } else {
            // Email not found, wipe the entire collection and redirect to admin_security_questions.html
            await wipeAdminSecurityAnswersCollection();  // Wipe all documents from the collection
            window.location.href = '../html/admin_security_questions.html';
        }
    } catch (error) {
        console.error("Login failed:", error);
        errorMessage.style.display = 'block';
        errorMessage.textContent = 'Incorrect password!';
    }
});