import React, { Component } from 'react';
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import './App.css';
import MuiThemeProvider from "@material-ui/core/styles/MuiThemeProvider";
import createMuiTheme from "@material-ui/core/styles/createMuiTheme";

//Components
import Navbar from "./components/Navbar";

//Pages
import Home from "./pages/home";
import Login from "./pages/login";
import Signup from "./pages/signup";

const theme = createMuiTheme({
  palette: {
    primary: {
      light: '#8fffff',
      main: '#54e2e2',
      dark: '#00b0b0',
      contrastText: '#000000'
    },
    secondary: {
      light: '#ba5a2c',
      main: '#842d00',
      dark: '#530000',
      contrastText: '#ffffff'
    }
  }
});

class App extends Component {
  
  render() {
    return (
      <MuiThemeProvider theme={theme}>
        <div className="App">
          <Router>
            <Navbar/>
            <div className="container">
              <Switch>
                <Route exact path="/" component={Home} />
                <Route exact path="/login" component={Login} />
                <Route exact path="/registro" component={Signup} />
              </Switch>
            </div>
          </Router>
        </div>  
      </MuiThemeProvider>
    );
  }
}

export default App;
