import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
reportWebVitals();
//Chuột phải vào folder sbe-demo mở Terminal
//chạy lệnh: npm i
//chạy lệnh: json-server --watch db.json --port 3001
//Mở 1 Terminal nữa
//chạy lệnh: npm start