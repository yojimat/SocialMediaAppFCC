const functions = require('firebase-functions')
	,app = require("express")()
	,{ getAllScreams, 
		postOneScream, 
		getScream,
		commentOnScream,
		likeScream,
		unlikeScream,
		deleteScream } = require("./handlers/screams")
	,{ signup, 
		login, 
		uploadImage, 
		addUserDetails,
		getAuthenticatedUser,
		getUserDetails,
		markNotificationsRead } = require("./handlers/users")
	,fbAuth = require("./util/fbAuth")
	,{ db } = require("./util/admin");

//Screams routes
app.get('/screams', getAllScreams);
app.post('/screams', fbAuth, postOneScream);
app.get('/screams/:screamId', getScream);
app.post("/screams/:screamId/comment", fbAuth, commentOnScream);
app.get("/screams/:screamId/like", fbAuth, likeScream);
app.get("/screams/:screamId/unlike", fbAuth, unlikeScream);
app.delete("/screams/:screamId", fbAuth, deleteScream);

//Users Routes
app.post("/signup", signup);
app.post("/login", login);
app.post("/user/image", fbAuth,uploadImage);
app.post('/user', fbAuth, addUserDetails);
//Get não pega comentários.
app.get("/user", fbAuth, getAuthenticatedUser);
app.get("/user/:handle", getUserDetails);
app.post("/notifications", fbAuth, markNotificationsRead);

exports.api = functions.region("us-east1").https.onRequest(app);

exports.createNotificationOnlike = functions.region("us-east1")
	.firestore.document("likes/{id}")
	.onCreate(snapshot => {
		return db.doc(`/screams/${snapshot.data().screamId}`)
			.get()
			.then(doc => {
				if(doc.exists && doc.data().userHandle !== snapshot.data().userHandle) {

					return db.doc(`/notifications/${snapshot.id}`)
						.set({
							createdAt: new Date().toISOString(),
							recipient: doc.data().userHandle,
							sender: snapshot.data().userHandle,
							type: "like",
							read: false,
							screamId: doc.id
						});
				} else {
					throw new "Doc não existe/Like yourself";
				}
			})
			.catch(err => console.error(err));
	});

exports.deleteNotificationOnUnlike = functions.region("us-east1")
	.firestore.document("likes/{id}")
	.onDelete(snapshot => {
		return db.doc(`/notifications/${snapshot.id}`)
			.delete()
			.catch(err => console.error(err));
	});

exports.createNotificationOnComment = functions.region("us-east1")
	.firestore.document("comments/{id}")
	.onCreate(snapshot => {
		return db.doc(`/screams/${snapshot.data().screamId}`)
			.get()
			.then(doc => {
				if(doc.exists && doc.data().userHandle !== snapshot.data().userHandle) {

					return db.doc(`/notifications/${snapshot.id}`)
						.set({
							createdAt: new Date().toISOString(),
							recipient: doc.data().userHandle,
							sender: snapshot.data().userHandle,
							type: "comment",
							read: false,
							screamId: doc.id
						});
				} else {
					throw new "Doc não existe/Comment yourself";
				}
			})
			.catch(err => console.error(err));
	});

exports.onUserImageChange = functions.region("us-east1")
	.firestore.document("/users/{userId}")
	.onUpdate(change => {

		if (change.before.data().imageUrl !== change.after.data().imageUrl) {

			let batch = db.batch();

			return db.collection("screams")
				.where("userHandle", "==", change.before.data().handle)
				.get()
				.then(data => {

					data.forEach(doc => {

						const scream = db.doc(`/screams/${doc.id}`);

						batch.update(scream, { userImage: change.after.data().imageUrl });
					});
					return batch.commit();
				})
				.catch(err => console.error(err));
		} else return "Não há mudanças na imagem";
	});

exports.onScreamDelete = functions.region("us-east1")
	.firestore.document("/screams/{screamId}")
	.onDelete((snapshot, context) => {

		const screamId = context.params.screamId
			,batch = db.batch();

		return db.collection("comments")
			.where("screamId", "==", screamId)
			.get()
			.then(data => {

				data.forEach(doc => {

					batch.delete(db.doc(`/comments/${doc.id}`));
				});
				return db.collection("likes")
					.where("screamId", "==", screamId)
					.get();
			})
			.then(data => {

				data.forEach(doc => {

					batch.delete(db.doc(`/likes/${doc.id}`));
				});
				return db.collection("notifications")
					.where("screamId", "==", screamId)
					.get();
			})
			.then(data => {

				data.forEach(doc => {

					batch.delete(db.doc(`/notifications/${doc.id}`));
				});
				return batch.commit();
			})
			.catch(err => console.error(err));
	});
