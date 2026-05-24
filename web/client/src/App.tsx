import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ProjectList from './components/ProjectList';
import ProjectDetail from './components/ProjectDetail';
import BomView from './components/BomView';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<ProjectList />} />
          <Route path="/projects/:projectName" element={<ProjectDetail />} />
          <Route path="/projects/:projectName/bom" element={<BomView />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
