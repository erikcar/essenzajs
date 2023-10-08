import logo from './logo.svg';
import './App.css';
import { AppRoot } from "@essenza/react";

const user = {
  role: { USER: 0, WORKER: 2, OPERATOR: 4},
  group: { 
    ADMIN: "USER, ADMIN"
  },
}

function App() {

  const build = (app) => {
    //Define User Roles
    app.observe("READY", () => {
      app.navigate("home");
    });
  }

  const init = (app) => {
    //....
  }

  //ready (start)
  return (
    <div className="App">
      <AppRoot start={app => app.navigate("home")} onbuild={build} oninit={init} dev>
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <p>
            Edit <code>src/App.js</code> and save to reload.
          </p>
          <a
            className="App-link"
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn React
          </a>
        </header>
      </AppRoot>
    </div>
  );
}

export default App;
