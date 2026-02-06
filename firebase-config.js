// Firebase設定
// ※ 以下の値をあなたのFirebaseプロジェクトの設定に置き換えてください
// Firebase Console (https://console.firebase.google.com/) で取得できます

const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Firebase初期化
firebase.initializeApp(firebaseConfig);

// Firestore参照
const db = firebase.firestore();
const inventoryCollection = db.collection('inventory');
