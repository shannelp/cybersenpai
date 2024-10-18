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


// Function to load assignees from Firestore
async function populateTeamMembers() {
  const selectElement = document.getElementById('team-member');
    
    try {
        const querySnapshot = await db.collection('users').get();
        
        selectElement.innerHTML = '';
        
        querySnapshot.forEach(doc => {
            const userData = doc.data();
            const option = document.createElement('option');
            option.value = userData.email; 
            option.textContent = userData.email; 
            selectElement.appendChild(option);
        });
    } catch (error) {
        console.error('Error fetching users: ', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
  const saveBtn = document.querySelector('.save-btn');

  saveBtn.addEventListener('click', async (event) => {
    event.preventDefault();

    const teamMemberEmail = document.getElementById('team-member').value;
    const oldPassword = document.getElementById('old-password').value;
    const newPassword = document.getElementById('new-password').value;

    if (!teamMemberEmail) {
      alert('Please select an assignee.');
      return;
  }

    if (!oldPassword || !newPassword) {
      alert('Please fill out both the old and new password fields.');
      return;
    }

    try {
      // Sign in as the assignee to update their password
      const userCredential = await auth.signInWithEmailAndPassword(teamMemberEmail, oldPassword);
      const user = userCredential.user;

      // Update the user's password
      await user.updatePassword(newPassword);
      alert('Password updated successfully.');

      // Sign out the user after updating the password
      await auth.signOut();

    } catch (error) {
      console.error('Error updating password: ', error);
      alert(error.message);
    }
  });

  populateTeamMembers()

});