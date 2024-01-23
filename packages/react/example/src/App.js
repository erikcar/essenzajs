import './App.css';
import { AppRoot, useApp, useBreakPoint } from "@essenza/react";
import { Route, Routes } from 'react-router-dom';
import { Home } from './widget/home';
import { ConfigureApp } from './config';
import { MainLayout } from './layout/MainLayout';
import { MobileLayout } from './layout/MobileLayout';
import { Welcome } from './widget/welcome';
import { UserVista } from './vista/user';
import { AdminVista } from './vista/admin';
import React from 'react';
import { Mobile } from './widget/mobile';

const init = app => {
  app.observe("BUILD").make(() => console.log("APP BUILD OBSERVED")).prepend();
  app.observe("BUILD").make(() => console.log("APP BUILT OBSERVED"));
  app.observe("LOADED").make(() => console.log("APP LOADED OBSERVED"));
  app.observe("READY").make(() => console.log("APP READY OBSERVED")).once();
  app.observe("LOGIN").make(() => console.log("APP LOGIN OBSERVED"));
}

function App() {
  const app = useApp(init);
  const breakpoint = useBreakPoint('md');
  
  ConfigureApp(app);

  return (
    <div className="App">
      <AppRoot guest >
        <Routes>
          {breakpoint.md.active
            ? <Route path="/" element={<MainLayout />}>
              <Route path="home" element={<Home />} />
              <Route path="settings" element={<AdminVista />} />
              <Route path="user-detail" element={<UserVista />} />
              <Route path="profile" element={<AdminVista />} />
            </Route>
            :
            <Route path="/" element={<MobileLayout />}>
              <Route path="home" element={<Mobile />} />
            </Route>
          }
          <Route index element={<Welcome />} />
        </Routes>
      </AppRoot>
    </div>
  );
}

export default App;
