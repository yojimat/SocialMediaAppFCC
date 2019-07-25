const { db, admin } = require("../util/admin")
	,firebase = require("firebase")
	,firebaseConfig = require("../util/firebaseConfig")
	,{ validateSignupData, validateLoginData, reduceUserDetails } = require("../util/validators");

firebase.initializeApp(firebaseConfig);	

exports.signup = (req, res) => {

	const newUser = {

		email: req.body.email,
		password: req.body.password,
		confirmPassword: req.body.confirmPassword,
		handle: req.body.handle
	};

	const { valid, errors } = validateSignupData(newUser);

	if(!valid) return res.status(400).json(errors);

	const noImg = "no-image.png";
	
	let userId, token;

	return db.doc(`/users/${newUser.handle}`)
		.get()
		.then(doc => {

			if(doc.exists){

				return res.status(400).json({ handle: "Esse nome de usuário já está sendo usado" });
			}
			return firebase
				.auth()
				.createUserWithEmailAndPassword(newUser.email, newUser.password);
		})
		.then(data => {

			userId = data.user.uid;

			return data.user.getIdToken();
		})
		.then(idToken => {

			token = idToken;

			const userCredentials = {

				handle: newUser.handle,
				email: newUser.email,
				createdAt: new Date().toISOString(),
				imageUrl: `https://firebasestorage.googleapis.com/v0/b/${
					firebaseConfig.storageBucket
				}/o/${noImg}?alt=media`,
				userId
			};
			return db.doc(`/users/${newUser.handle}`).set(userCredentials);		
		})
		.then(() => {

			return res.status(201).json({ token });
		})
		.catch(err => {

			console.log(err);

			if(err.code === "auth/email-already-in-use") {

				return res.status(400).json({ email: "Esse e-mail já está sendo usado" });
			} 
			else if(err.code === "auth/weak-password"){

				return res.status(400).json({ password: "Senha fraca" });
			}
			return res.status(500).json({ general: "Alguma coisa deu errado, por favor tente de novo" })
		});
};

exports.login = (req, res) => {

	const user = {

		email: req.body.email,
		password: req.body.password
	};

	const { valid, errors } = validateLoginData(user);
	
	if(!valid) return res.status(400).json(errors);

	return firebase
		.auth()
		.signInWithEmailAndPassword(user.email, user.password)
		.then(data => {

			return data.user.getIdToken();
		})
		.then(token => {

			return res.json({ token });
		})
		.catch(err => {

			console.log(err);

			if(err.code === "auth/invalid-email" || err.code === "auth/wrong-password") {

				return res.status(403).json({ general: "E-mail ou senha inválidos" })
			}

			return res.status(500).json({ general: "Alguma coisa deu errado, por favor tente de novo" });
		})
};

exports.addUserDetails = (req, res) => {

	let userDetails = reduceUserDetails(req.body);

	db.doc(`/users/${req.user.handle}`).update(userDetails)
		.then(() => res.json({ message: "Detalhes adicionados com sucesso." }))
		.catch(err => res.status(500).json({ error: err.code }));
};

exports.getUserDetails = (req, res) => {
	let userData = {};

	db.doc(`/users/${req.params.handle}`)
		.get()
		.then(doc => {

			if(doc.exists) {

				userData.user = doc.data();

				return db.collection("screams")
					.where("userHandle", "==", req.params.handle)
					.orderBy("createdAt", "desc")
					.get();
			} else {

				return res.status(404).json({ error: "Error ao buscar usuário" });
			}
		})
		.then(data => {

			userData.screams = [];

			data.forEach(documentt => {

				userData.screams.push({
					body: documentt.data().body,
					createdAt: documentt.data().createdAt,
					userHandle: documentt.data().userHandle,
					userImage: documentt.data().userImage,
					likeCount: documentt.data().likeCount,
					commentCount: documentt.data().commentCount,
					screamId: documentt.id
				});
			});
			return res.json(userData);
		})
		.catch(err => {
			console.error(err);
			return res.status(500).json({ error: err.code });
		});
};

exports.getAuthenticatedUser = (req, res) => {

	let userData = {};

	db.doc(`/users/${req.user.handle}`)
		.get()
		.then(doc => {
			if(doc.exists) {

				userData.credentials = doc.data();

				return db.collection("likes")
					.where("userHandle", "==", req.user.handle)
					.get();
			} else {

				return res.status(404).json({ error: "Error ao buscar informações" });
			}
		})
		.then(data => {

			userData.likes = [];

			data.forEach(documentt => userData.likes.push(documentt.data()));

			return db.collection("notifications")
				.where("recipient", "==", req.user.handle)
				.orderBy("createdAt", "desc")
				.limit(10)
				.get();
		})
		.then(data => {

			userData.notifications = [];

			data.forEach(documentt => {

				userData.notifications.push({
					recipient: documentt.data().recipient,
					sender: documentt.data().sender,
					createdAt: documentt.data().createdAt,
					screamId: documentt.data().screamId,
					type: documentt.data().type,
					read: documentt.data().read,
					notificationId: documentt.id
				});
			});

			return res.json(userData);
		})
		.catch(err => {
			console.error(err);
			return res.status(500).json({ error: err.code })
		});
};

exports.uploadImage = (req, res) => {

	const BusBoy = require("busboy")
		,path = require("path")
		,os = require("os")
		,fs = require("fs")
		,busBoy = new BusBoy({ headers: req.headers });

	let imageFileName, imageToBeUploaded = {};

	busBoy.on("file", (fieldName, file, fileName, enconding, mimeType) => {

		if(mimeType !== "image/jpeg" && mimeType !== "image/png") {

			return res.status(400).json({ error: "Formato de imagem não suportado"});
		}

		const imageExtension = fileName.split(".")[fileName.split(".").length - 1];

		imageFileName = `${Math.round(Math.random()*1000000)}.${imageExtension}`;
		
		const imageFilePath = path.join(os.tmpdir(), imageFileName);

		imageToBeUploaded = { imageFilePath, mimeType };

		file.pipe(fs.createWriteStream(imageFilePath));
	});

	busBoy.on("finish", () => {

		admin.storage().bucket().upload(imageToBeUploaded.imageFilePath, {

			resumable: false,
			metadata: {

				metadata: {

					contentType: imageToBeUploaded.mimeType
				}
			}
		})
		.then(() => {

			const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${firebaseConfig.storageBucket}/o/${imageFileName}?alt=media`;

			return db.doc(`/users/${req.user.handle}`).update({ imageUrl });
		})
		.then(() => {

			return res.json({ message: "Imagem postada" });
		})
		.catch(err => {

			console.error(err);

			return res.status(500).json({ error: err.code });
		});
	});

	busBoy.end(req.rawBody);
};

exports.markNotificationsRead = (req, res) => {
	let batch = db.batch();

	req.body.forEach(notificationId => {

		const notification = db.doc(`/notifications/${notificationId}`);

		batch.update(notification, { read: true });
	});

	batch.commit()
		.then(() => res.json({ message: "Notificações marcadas como lidas" }))
		.catch(err => {
			console.error(err);
			return res.status(500).json({ error: err.code });
		});
};