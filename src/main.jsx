import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/theme.css';
import './styles/responsive.css';
import './styles/widget.css';
import App from './App.jsx';

// Set REM base font size based on viewport width
function setRemBase() {
  const width = window.innerWidth;
  let fontSize = '14px';

  if (width < 768) {
    fontSize = '10px';
  } else if (width < 1024) {
    fontSize = '12px';
  }

  document.documentElement.style.fontSize = fontSize;
}

setRemBase();
window.addEventListener('resize', setRemBase);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
