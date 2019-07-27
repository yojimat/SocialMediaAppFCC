import React, { Component } from 'react';
import Grid from '@material-ui/core/Grid';
import axios from "axios"

import Scream from "../components/Scream";

class Home extends Component {
	
	state = {
		screams: null
	};

	componentDidMount() {
		axios.get("/screams")
			.then(res => this.setState({ screams: res.data }))
			.catch(err => console.error(err));
	};

	render() {

		let recentScreamsMarkup = this.state.screams ? (

			this.state.screams.map((scream, i) => <Scream scream={scream} key={i}/>)
		) : <p>Carregando...</p>;

		return (
			<Grid container spacing={2}>
				<Grid item sm={8} xs={12}>
					{recentScreamsMarkup}
				</Grid>
				<Grid item sm={4} xs={12}>
					<p>Perfil...</p>
				</Grid>
			</Grid>
  		);
	}
};

export default Home;
