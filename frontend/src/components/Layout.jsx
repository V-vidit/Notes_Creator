import { useSelector } from 'react-redux';
import Navbar from './Navbar';

function Layout({ children }) {
  const { error, success } = useSelector((state) => state.app);

  return (
    <div className="app">
      <Navbar />
      <main className="main-container">
        {/* Error/Success Messages */}
        {error && <div className="alert alert-error">{error}</div>}
        {success && !error && (
          <div className="alert alert-success">{success}</div>
        )}
        {children}
      </main>
    </div>
  );
}

export default Layout;
