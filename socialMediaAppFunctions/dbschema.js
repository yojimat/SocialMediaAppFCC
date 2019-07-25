const db = {
	user: [
		{
			userId: "bbwzL1RJcgX5l4G9g96jukckBIu1",
			email: "vinicius2@test.com",
			handle: "vinicius2",
			createdAt: "2019-06-28T05:38:21.381Z",
			imageUrl: "https://firebasestorage.googleapis.com/v0/b/socialmediaappfcc.appspot.com/o/201626.jpg?alt=media",
			bio: "Ola meu nome é Vinícius, prazer em te conhecer",
			website: "https://github.com/yojimat",
			location: "Brasília, Brazil"
		}
	],
	screams: [
		{
			userHandle: "user",
			body: "This is the scream body",
			createdAt: "2019-06-26T02:13:21.764Z",
			likeCount: 5,
			commentCount: 2
		}
	],
	comments: [
		{
			userHandle: "user",
			screamId: "7yugerk7TsZRVD6QKm1l",
			body: "Novo Comentário",
			createdAt: "2019-06-26T02:13:21.764Z"
		}
	],
	notifications: [
		{
			recipient: "user",
			sender: "john",
			read: "true | false",
			screamId: "7yugerk7TsZRVD6QKm1l",
			type: "like | comment",
			createdAt: "2019-06-26T02:13:21.764Z"
		}
	]
};

const userDetails = {
	//Redux data
	credentials: {
		userId: "bbwzL1RJcgX5l4G9g96jukckBIu1",
		email: "vinicius2@test.com",
		handle: "vinicius2",
		createdAt: "2019-06-28T05:38:21.381Z",
		imageUrl: "https://firebasestorage.googleapis.com/v0/b/socialmediaappfcc.appspot.com/o/201626.jpg?alt=media",
		bio: "Ola meu nome é Vinícius, prazer em te conhecer",
		website: "https://github.com/yojimat",
		location: "Brasília, Brazil"
	},
	likes: [
		{
			userHandle: "vinicius2",
			screamId: "7yugerk7TsZRVD6QKm1l"
		},
		{
			userHandle: "vinicius",
			screamId: "7yugerk7TsZRVD6QKm1l"
		},
	]
}