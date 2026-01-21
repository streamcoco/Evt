
import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA_2dlwzoC0F96FELi_0ikaL1XDdxuuJAY", 
  authDomain: "everything-app-ec8a6.firebaseapp.com",
  projectId: "everything-app-ec8a6",
  storageBucket: "everything-app-ec8a6.firebasestorage.app",
  messagingSenderId: "281636746923",
  appId: "1:281636746923:web:faac8ee48007505fed29ee"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Set persistence to LOCAL (survives browser restart, indefinite until logout)
// This effectively satisfies "remember for 1 month" as it stays until cleared.
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error("Error setting persistence:", error);
});

export { auth };
export const db = getFirestore(app);
export default app;
