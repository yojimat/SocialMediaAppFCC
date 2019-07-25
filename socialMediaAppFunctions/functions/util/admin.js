const admin = require("firebase-admin")
	,firebaseConfig = require("../util/firebaseConfig");

admin.initializeApp(firebaseConfig);

const db = admin.firestore();

module.exports = { admin, db };