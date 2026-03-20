import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Background from './components/Background/Background';
import Home from './pages/Home';
import AdminDashboard from './pages/AdminDashboard';
import CreatorDashboard from './pages/CreatorDashboard';
import SetPassword from './pages/SetPassword';
import AdminLogin from './pages/AdminLogin';
import Search from './pages/Search';

function App() {
  return (
    <Router>
      <Background />
      <div className="app-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/creator" element={<CreatorDashboard />} />
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