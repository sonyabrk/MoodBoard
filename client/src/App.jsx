import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Background from './components/Background';
import Home from './pages/Home';
import AdminDashboard from './pages/AdminDashboard';
import SetPassword from './pages/SetPassword';
import AdminLogin from './pages/AdminLogin';

function App() {
  return (
    <Router>
      <Background />
      <div className="app-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/set-password" element={<SetPassword />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;