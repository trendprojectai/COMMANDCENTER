import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { Agents } from './pages/Agents';
import { Tasks } from './pages/Tasks';
import { VideoReview } from './pages/VideoReview';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/office" element={<Agents />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/videos" element={<VideoReview />} />
          <Route path="/agents" element={<Navigate to="/office" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
