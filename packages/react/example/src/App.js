import logo from './logo.svg';
import './App.css';
import { AppRoot } from "@essenza/react";
import { useApp } from '../../src/hook/corehook';

const user = {
  role: { USER: 0, WORKER: 2, OPERATOR: 4},
  group: { 
    ADMIN: "USER, ADMIN"
  },
}

function App() {

  const app = useApp();
  
  app.observe("BUILD").make(() => console.log("APP BUILD OBSERVED")).prepend();
  app.observe("BUILD").make(() => console.log("APP BUILT OBSERVED"));
  app.observe("LOADED").make(() => console.log("APP LOADED OBSERVED"));
  app.observe("READY").make(() => console.log("APP READY OBSERVED")).once();
  app.observe("LOGIN").make(() => console.log("APP LOGIN OBSERVED"));

  //app.configureService({ITask: app})

  //ready (start)
  return (
    <div className="App">
      <AppRoot  guest>
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
