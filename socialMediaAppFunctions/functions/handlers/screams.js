const { db } = require("../util/admin");

exports.getAllScreams = (req, res) => {

	db.collection("screams")
		.orderBy("createdAt", "desc")
	  	.get()
	  	.then(data => {

	  		let screams = [];

	  		data.forEach(doc => {

	  			screams.push({
	  				screamId: doc.id,
	  				body: doc.data().body,
	  				userHandle: doc.data().userHandle,
	  				createdAt: doc.data().createdAt,
	  				commentCount: doc.data().commentCount,
	  				likeCount: doc.data().likeCount,
            userImage: doc.data().userImage
	  			});
	  		});
	  		return res.json(screams);
	  	})
  		.catch(err => {
  			console.log(err);
  			return res.status(500).json({ error: err.code});
  		});
};

exports.postOneScream = (request, response) => {

  if (request.body.body.trim() === "") {

  	return response.status(400).json({ body: "Messagem do post não pode ser vazia"})
  }

  const newScream = {
  	body: request.body.body,
  	userHandle: request.user.handle,
    userImage: request.user.imageUrl,
  	createdAt: new Date().toISOString(),
    likeCount: 0,
    commentCount: 0
  };

  db.collection("screams")
  	.add(newScream)
  	.then(doc => {

      const resScream = newScream;
      resScream.screamId = doc.id;

      return response.json(resScream);
    })
  	.catch(err => {

  		console.log(err);
  		
  		return response.status(500).json({ error: "Alguma coisa deu errado com o post" });
  	});
};

exports.getScream = (req, res) => {

  let screamData = {};

  db.doc(`/screams/${req.params.screamId}`)
    .get()
    .then(doc => {

      if(!doc.exists) {

        return res.status(404).json({ error: "Grito não achado"});
      }

      screamData = doc.data();
      screamData.screamId = doc.id;

      return db.collection("comments")
        .orderBy("createdAt", "desc")
        .where("screamId", "==", req.params.screamId)
        .get();
    })
    .then(data => {

      screamData.comments = [];

      data.forEach(doc => {

        screamData.comments.push(doc.data());
      });

      return res.json(screamData);
    })
    .catch(err => {
      console.log(err);
      return res.status(500).json({ error: err.code })
    });
};

exports.commentOnScream = (req, res) => {

  if(req.body.body.trim() === "") return res.status(400).json({ comment: "Não pode estar vazio"});

  const newComment = {
    body: req.body.body,
    createdAt: new Date().toISOString(),
    screamId: req.params.screamId,
    userHandle: req.user.handle,
    userImage: req.user.imageUrl
  };

  db.doc(`/screams/${req.params.screamId}`)
    .get()
    .then(doc => {

      if(!doc.exists) return res.status(404).json({ error: "Grito não achado" });

      return doc.ref.update({ commentCount: doc.data().commentCount+1 })
    })
    .then(() => {

      return db.collection("comments").add(newComment);
    })
    .then(() => res.json(newComment))
    .catch(err => {
      console.error(err)
      return res.status(500).json({ error: "Alguma coisa deu errado!" });  
    });
};

exports.likeScream = (req, res) => {

  const likeDocument = db.collection("likes")
    .where("userHandle", "==", req.user.handle)
    .where("screamId", "==", req.params.screamId)
    .limit(1)
    ,screamDocument = db.doc(`/screams/${req.params.screamId}`);

  let screamData = {};

  screamDocument.get()
    .then(doc => {

      if(doc.exists) {

        screamData = doc.data();
        screamData.screamId = doc.id;

        return likeDocument.get();
      } else {

        return res.status(404).json({ error: "Grito não encontrado" });
      }
    })
    .then(data => {

      if(data.empty) {

        return db.collection("likes")
          .add({
            screamId: req.params.screamId,
            userHandle: req.user.handle
          })
          .then(() => {

            screamData.likeCount++;

            return screamDocument.update({ likeCount: screamData.likeCount });
          })
          .then(() => res.json(screamData))
          .catch(err => {
            console.error(err);
            return res.status(500).json({ error : err.code });
          });
      } else {

        return res.status(400).json({ error: "Scream já tem o like" });
      }
    })
    .catch(err => {
      console.error(err);
      return res.status(500).json({ error : err.code });
    });
};

exports.unlikeScream = (req, res) => {
  const likeDocument = db.collection("likes")
    .where("userHandle", "==", req.user.handle)
    .where("screamId", "==", req.params.screamId)
    .limit(1)
    ,screamDocument = db.doc(`/screams/${req.params.screamId}`);

  let screamData = {};

  screamDocument.get()
    .then(doc => {

      if(doc.exists) {

        screamData = doc.data();
        screamData.screamId = doc.id;

        return likeDocument.get();
      } else {

        return res.status(404).json({ error: "Grito não encontrado" });
      }
    })
    .then(data => {

      if(data.empty) {

        return res.status(400).json({ error: "Scream já está sem like" });        
      } else {

        return db.doc(`/likes/${data.docs[0].id}`)
          .delete()
          .then(() => {

            screamData.likeCount--;

            return screamDocument.update({ likeCount: screamData.likeCount });
          })
          .then(() => res.json(screamData))
          .catch(err => {
            console.error(err);
            return res.status(500).json({ error : err.code });
          });
      }
    })
    .catch(err => {
      console.error(err);
      return res.status(500).json({ error : err.code });
    });
};

exports.deleteScream = (req, res) => {

  const documento = db.doc(`/screams/${req.params.screamId}`);

  documento.get()
    .then(doc => {

      if(!doc.exists) return res.status(404).json({ error: "Grito não encontrado" });
      
      if(doc.data().userHandle !== req.user.handle) return res.status(403).json({ error: "Não autorizado" })

      return documento.delete();
    })
    .then(() => res.json({ message: "Grito deletado com sucesso" }))
    .catch(err => {
      console.error(err);
      return res.status(500).json({ error : err.code });
    });
};