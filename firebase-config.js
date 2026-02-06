// Firebase設定
const firebaseConfig = {
    apiKey: "AIzaSyAF2mD90cdwJ52cNZCVjklzlAngXegim2Q",
    authDomain: "bihin-kanri-8a4eb.firebaseapp.com",
    projectId: "bihin-kanri-8a4eb",
    storageBucket: "bihin-kanri-8a4eb.firebasestorage.app",
    messagingSenderId: "775786834450",
    appId: "1:775786834450:web:a215c766c9e7a68f8406cb"
};

// Firebase初期化
firebase.initializeApp(firebaseConfig);

// Firestore参照
const db = firebase.firestore();
const inventoryCollection = db.collection('inventory');
