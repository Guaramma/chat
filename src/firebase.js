import firebase from "firebase/app";
import "firebase/auth";
import "firebase/database";
import "firebase/storage";
import "firebase/analytics";
import "firebase/firestore";

let config = {
  apiKey: "AIzaSyCptXWFEhrcVzUVECFYqoaZCnmRyK38hzo",
  authDomain: "chat-90824.firebaseapp.com",
  databaseURL: "https://chat-90824.firebaseio.com",
  projectId: "chat-90824",
  storageBucket: "chat-90824.appspot.com",
  messagingSenderId: "254429822399",
  appId: "1:254429822399:web:d1432c0022d05ba92fb50a",
  measurementId: "G-KWZXNW65EL",
};
// Initialize Firebase
firebase.initializeApp(config);
// firebase.analytics();

export default firebase;
