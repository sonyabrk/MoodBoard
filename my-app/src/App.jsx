import { BrowserRouter as Router, Routes, Route, Link} from 'react-router-dom';
import './App.css'
import { FRAMES } from './Frames/frames.js';
import { WINDOW } from './Window/window.js';
import Frame1 from "./Frames/Frame1.jsx";
import Frame234 from "./Frames/Frame234.jsx";
import Window from "./Window/Window.jsx";

function App() {
  return (
    <>
      <Router>
      <Routes>
        <Route path="/" element={
          <div className="app-container">
            <Frame1 />
            <div className="app-frame">
              {FRAMES.map((frame) => (
                <Frame234 
                  key={frame.id}
                  id={frame.id} 
                  title={frame.title}
                  text={frame.text}
                  imgs={frame.imgs}
                />
              ))}
            </div>
          </div>
        } />
        
        {WINDOW.map((window) => (
          <Route 
            key={window.id}
            path={`/window/${window.id}`}
            element={ <Window id={window.id} title={window.title} text={window.text} cards={window.cards}/>} />
        ))}
      </Routes>
    </Router>
    </>
  );
}

export default App;
