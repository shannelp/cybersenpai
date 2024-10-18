document.addEventListener('DOMContentLoaded', function () {
    // Firebase configuration
    const firebaseConfig = {
        apiKey: "AIzaSyDM1NW5KnuQBjAvhmyZNGw2IPryX-XkVIc",
        authDomain: "fit2101-team4-33a7c.firebaseapp.com",
        databaseURL: "https://fit2101-team4-33a7c-default-rtdb.asia-southeast1.firebasedatabase.app",
        projectId: "fit2101-team4-33a7c",
        storageBucket: "fit2101-team4-33a7c.appspot.com",
        messagingSenderId: "994238089468",
        appId: "1:994238089468:web:aab8b310b1c9317c6e6f79",
        measurementId: "G-MKHL29F6MM"
    };

    // Initialize Firebase
    try {
        firebase.initializeApp(firebaseConfig);
        console.log("Firebase initialized successfully!");
    } catch (error) {
        console.log("Error initializing Firebase:", error);
    }

    // Force log out when the page loads
    firebase.auth().signOut().then(() => {
        console.log("User has been logged out.");
    }).catch((error) => {
        console.log("Error logging out:", error);
    });

    // Handle form submission for email/password login
    document.getElementById('loginForm').addEventListener('submit', function (event) {
        event.preventDefault(); // Prevent form refresh
        loginWithEmailPassword(); // Call the email/password login function
    });

    // Login function for email/password authentication using Firebase Auth
    function loginWithEmailPassword() {
        let email = document.getElementById("email").value.trim();
        let password = document.getElementById("password").value.trim();
        let errorMessageElement = document.getElementById('error-message');
        let snackbarContainer = document.querySelector('#snackbar');

        if (email && password) {
            console.log("Email:", email);

            // Use Firebase Authentication to sign in with email and password
            firebase.auth().signInWithEmailAndPassword(email, password)
                .then((userCredential) => {
                    // Successfully signed in
                    const user = userCredential.user;
                    console.log("User signed in:", user);

                    // Redirect to product backlog page after successful login
                    window.location.href = "../html/sprint_backlog.html";
                })
                .catch((error) => {
                    console.error("Error signing in:", error.message);
                    document.getElementById('password').value = '';
                    errorMessageElement.style.display = 'block';

                    showSnackbar(snackbarContainer, error.message); // Show error in snackbar
                });
        } else {
            showSnackbar(snackbarContainer, "Please enter an email and password");
        }
    }

    // Utility function to store data in local storage
    function updateLocalStorage(key, value) {
        localStorage.setItem(key, value);
    }

    // Utility function to show snackbar messages
    function showSnackbar(container, message) {
        let snackbarMessage = { message: message };
        container.MaterialSnackbar.showSnackbar(snackbarMessage);
    }

    // Initialize Firebase Google Auth provider
    const provider = new firebase.auth.GoogleAuthProvider();

    // Attach click event to the Google Sign-In button
    document.getElementById('googleSignInBtn').addEventListener('click', function () {
        firebase.auth().signInWithPopup(provider).then((result) => {
            const user = result.user;
            console.log("Google user signed in:", user);

            // Store user info in localStorage
            updateLocalStorage("googleUserEmail", user.email);

            // Redirect or handle successful login
            window.location.href = "../html/sprint_backlog.html"; // Redirect to product backlog page after successful login
        }).catch((error) => {
            console.error("Google Sign-In error:", error);
            alert("Google Sign-In failed: " + error.message);
        });
    });

    // Track auth state and redirect if signed in
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            console.log("User is already signed in:", user);
            // Redirect to product backlog page if the user is already signed in
            window.location.href = "../html/sprint_backlog.html";
        } else {
            // No user is signed in, remain on the login page
            console.log("No user signed in, showing login page.");
        }
    });
});
