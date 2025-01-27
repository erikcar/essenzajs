import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter } from 'react-router';
import { ConfigProvider } from 'antd';
import locale from 'antd/locale/it_IT';
/* CSS Variables => vedi compatibilità

ConfigProvider.config({
  theme: {
    primaryColor: '#25b864',
  },
});
*/

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(

    <ConfigProvider locale={locale}>
      <BrowserRouter basename="/">
        <App />
      </BrowserRouter>
    </ConfigProvider>

);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
