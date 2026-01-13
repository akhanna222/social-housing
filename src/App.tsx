import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard, Applications, ApplicationDetail, NewApplication } from './pages';
import './App.css';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/applications" element={<Applications />} />
          <Route path="/applications/:id" element={<ApplicationDetail />} />
          <Route path="/new-application" element={<NewApplication />} />
          {/* Placeholder routes */}
          <Route path="/team" element={<PlaceholderPage title="Team" />} />
          <Route path="/reports" element={<PlaceholderPage title="Reports" />} />
          <Route path="/settings" element={<PlaceholderPage title="Settings" />} />
          <Route path="/help" element={<PlaceholderPage title="Help & Support" />} />
        </Routes>
      </Layout>
    </Router>
  );
}

// Placeholder for future pages
function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="placeholder-page">
      <div className="placeholder-page__content">
        <h2>{title}</h2>
        <p>This page is coming soon.</p>
      </div>
    </div>
  );
}

export default App;
