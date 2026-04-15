import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Background from './components/Background/Background';
import Home from './pages/Home/Home';
import AdminDashboard from './pages/AdminDashboard/AdminDashboard';
import CreatorDashboard from './pages/CreatorDashboard/CreatorDashboard';
import MoodboardEditor from './pages/MoodboardEditor/MoodboardEditor';
import BoardView from './pages/BoardView/BoardView';
import SetPassword from './pages/SetPassword/SetPassword';
import AdminLogin from './pages/AdminLogin/AdminLogin';
import Search from './pages/Search/Search';
import CreatorProfile from './pages/CreatorProfile/CreatorProfile';
import UserProfile from './pages/UserProfile/UserProfile';
import CreatorLikes from './pages/CreatorLikes/CreatorLikes';

function App() {
  return (
    <Router>
      <Background />
      <div className="app-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/creator" element={<CreatorDashboard />} />
          <Route path="/user" element={<UserProfile />} />
          <Route path="/editor" element={<MoodboardEditor />} />
          <Route path="/editor/:frameId" element={<MoodboardEditor />} />
          <Route path="/boards/:frameId" element={<BoardView />} />
          <Route path="/profile/:username" element={<CreatorProfile />} />
          <Route path="/creator/likes" element={<CreatorLikes />} />

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