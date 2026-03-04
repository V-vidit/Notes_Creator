import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

function Navbar() {
  const location = useLocation();
  const { selectedModel } = useSelector((state) => state.app);

  const getLinkClass = (path) => {
    const baseClass = 'nav-link';
    return location.pathname === path ? `${baseClass} active` : baseClass;
  };

  return (
    <nav className="navbar">
      <div className="nav-left">
        <span className="nav-logo">Dr . AI-Transcribe & Summarize Any Video</span>
        {selectedModel && (
          <span className="model-indicator">{selectedModel}</span>
        )}
      </div>
      <div className="nav-right">
        <Link to="/" className={getLinkClass('/')}>
          Home
        </Link>
        <Link to="/models" className={getLinkClass('/models')}>
          Models
        </Link>
        <Link to="/result" className={getLinkClass('/result')}>
          Result
        </Link>
      </div>
    </nav>
  );
}

export default Navbar;
