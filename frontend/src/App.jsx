import { BrowserRouter as Router } from 'react-router-dom';
import './App.css';
import Background from './components/Background';
import Hero from './components/Hero';
import About from './components/About';

function App() {
  return (
    <Router>
      <Background />
      
      <div className="app-content">
        <Hero />
        <About />
      </div>
    </Router>
  );
}

export default App;