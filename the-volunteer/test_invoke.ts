import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFunctions, httpsCallable } from "firebase/functions";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const functions = getFunctions(app, "us-central1");

async function main() {
  try {
    const cred = await signInWithEmailAndPassword(auth, "testuser1@mail.com", "Password123!");
    console.log("Logged in as:", cred.user.uid);
    
    console.log("Calling completeTaskWithRating...");
    const completeTaskWithRating = httpsCallable(functions, "completeTaskWithRating");
    await completeTaskWithRating({
      taskId: "test-task-123",
      rating: 5
    });
    console.log("Call successful!");

  } catch (error: any) {
    console.error("Error occurred:", error?.code, error?.message, error?.details);
  }
  process.exit(0);
}

main();
