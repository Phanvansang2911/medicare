import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import PatientBooking from './pages/PatientBooking';
import Profile from './pages/Profile';
import DoctorDashboard from './pages/DoctorDashboard';
import PatientHistory from './pages/PatientHistory';
import DoctorSchedule from './pages/DoctorSchedule';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  return (
      <Router>
        <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
          <Navbar />

          {/* Thay thế div container cũ bằng thẻ main */}
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/patient" element={<PatientBooking />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/doctor" element={<DoctorDashboard />} />
              <Route path="/patient/history" element={<PatientHistory />} />
              <Route path="/doctor/schedules" element={<DoctorSchedule />} />
              <Route path="/admin" element={<AdminDashboard />} />
            </Routes>
          </main>
        </div>
      </Router>
  );
}

export default App;