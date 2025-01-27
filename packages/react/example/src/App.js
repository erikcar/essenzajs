import './App.css';
import { AppRoot, useApp, useBreakPoint, UrlInfo } from "@essenza/react";
import { Route, Routes } from 'react-router';
import { Home } from './widget/home';
import { ConfigureApp } from './config';
import { MainLayout } from './layout/MainLayout';
import { MobileLayout } from './layout/MobileLayout';
import { Welcome } from './vista/welcome';
import { UserVista } from './vista/profile/detail';
import { UserAdminVista } from './vista/profile/admin';
import React from 'react';
import { Mobile } from './widget/mobile';
import { ProfileVista } from './vista/profile/profile';
import { InviteVista } from './vista/profile/invitein';
import { LoginVista } from './vista/profile/login';

const init = app => {
  ConfigureApp(app);

  app.observe("BUILD").make(() => console.log("APP BUILD OBSERVED")).prepend();
  app.observe("BUILD").make(() => console.log("APP BUILT OBSERVED"));
  app.observe("LOADED").make(() => console.log("APP LOADED OBSERVED"));
  app.observe("READY").make(() => console.log("APP READY OBSERVED")).once();
  app.observe("LOGGED").make(() => app.navigate("home"));
  app.observe("AUTH").make(() => app.navigate("login"));
  app.observe("URL_REQUEST").make(({data, context}) => {
    if(data.request === "SUBSCRIBE"){
      context.navigate("/profile");
    }
  });
}

function App() {
  const app = useApp(init);
  const breakpoint = useBreakPoint('md');

  return (
    <div className="App">
      <AppRoot >
        <Routes>
          {breakpoint.md.active
            ? <Route path="/" element={<MainLayout />}>
              <Route path="home" element={<Home />} />
              <Route path="settings" element={<UserAdminVista />} />
              <Route path="user-detail" element={<UserVista />} />
              <Route path="profile" element={<ProfileVista />} />
              <Route path="invite" element={<InviteVista />} />
            </Route>
            :
            <Route path="/" element={<MobileLayout />}>
              <Route path="home" element={<Mobile />} />
            </Route>
          }
          <Route index element={<Welcome />} />
          <Route path="login" element={<LoginVista />} />
        </Routes>
      </AppRoot>
    </div>
  );
}

export default App;
