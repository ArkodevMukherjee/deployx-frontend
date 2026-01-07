import { Routes, Route } from 'react-router'
import LogIn from "./pages/LogIn"
import SignUp from "./pages/SignUp"
import Dashboard from "./pages/Dashboard"
import Project from "./pages/Project"
import SendOTP from './pages/SendOtp'
import VerifyOTP from './pages/VerifyOtp'
// import GithubInstalled from './pages/DeployForm.jsx'  // ← import
import DeployForm from "./pages/DeployForm";

function App() {
  return (
    <Routes>
      <Route path="/" element={<SignUp />} />
      <Route path="/login" element={<LogIn />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/deploy" element={<DeployForm />} />
      <Route path="/project" element={<Project />} />
      <Route path="/send-otp" element={<SendOTP />} />
      <Route path="/verify-otp" element={<VerifyOTP />} />
    </Routes>
  )
}

export default App;
