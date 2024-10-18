const auth = firebase.auth();

document.addEventListener('DOMContentLoaded', () => {
  // Handle email/password login
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;

      try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        console.log('User signed in:', userCredential.user);
        window.location.href = "../html/product_backlog.html"; // Redirect on success
      } catch (error) {
        console.error('Error signing in:', error.message);
        alert(`Login failed: ${error.message}`);
      }
    });
  }

  // Google Sign-In
  const googleSignInBtn = document.querySelector('.google-signin');
  if (googleSignInBtn) {
    googleSignInBtn.addEventListener('click', async () => {
      const provider = new firebase.auth.GoogleAuthProvider();

      try {
        const result = await auth.signInWithPopup(provider);
        console.log('Google user signed in:', result.user);
        window.location.href = "../html/product_backlog.html"; // Redirect on success
      } catch (error) {
        console.error('Google Sign-In Error:', error.message);
        alert(`Google Sign-In failed: ${error.message}`);
      }
    });
  }
});
