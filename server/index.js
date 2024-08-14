import express from 'express';
import cors from 'cors';
import admin from './firebaseAdmin.js';
import 'dotenv/config';

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/login', async (req, res) => {
  const idToken = req.headers.authorization?.split('Bearer ')[1];

  if (!idToken) {
    return res.status(400).send({ message: 'Token not provided' });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    res.status(200).send({ message: 'Login successful', uid });
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(401).send({ message: 'Unauthorized' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
