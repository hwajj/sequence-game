import admin from 'firebase-admin';

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: process.env.GOOGLE_PROJECT_ID,
  databaseURL: 'https://sequence-game-ad037.firebaseio.com',
});

export default admin;
