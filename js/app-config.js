// Scanimart app configuration.
// Fill in your Firebase Web App config and Razorpay Key ID to enable live
// Google sign-in and Razorpay payments. Everything still works in demo mode
// without them.
window.APP_CONFIG = {
  // The static website is hosted on Vercel, while the email-enabled API runs
  // on Render. Keep this URL explicit so exit verification reaches the same
  // backend that has the Brevo credentials configured.
  apiBaseUrl: 'https://scanimart-inventory.onrender.com',
  firebase: {
    apiKey: '',                                   // Firebase Console > Project settings > General > Your apps
    authDomain: 'scanimart-5ef87.firebaseapp.com',
    projectId: 'scanimart-5ef87',
    databaseURL: 'https://scanimart-5ef87-default-rtdb.firebaseio.com',
    storageBucket: '',
    messagingSenderId: '',
    appId: ''
  },
  razorpay: {
    key: 'rzp_test_TMyZyrr3TEnWuD'               // Razorpay Dashboard > Settings > API Keys > Key ID
  }
};
