import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Trace from './pages/Trace';
import Upload from './pages/Upload';
import './App.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/trace" element={<Trace />} />
            <Route path="/upload" element={<Upload />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;