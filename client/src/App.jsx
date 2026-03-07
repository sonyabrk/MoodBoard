import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Background from './components/Background';
import Home from './pages/Home';

function App() {
  return (
    <Router>
      {/* Фиксированный анимационный фон */}
      <Background />
      
      {/* Контент поверх фона */}
      <div className="app-content">
        <Routes>
          <Route path="/" element={<Home />} />
          {/* Здесь будут другие страницы */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;