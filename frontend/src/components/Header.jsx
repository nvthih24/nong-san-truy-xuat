import { Link } from 'react-router-dom';

function Header() {
  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between">
        <h1 className="text-xl">Traceability App</h1>
        <div>
          <Link to="/" className="mr-4">Home</Link>
          <Link to="/upload" className="mr-4">Upload</Link>
          <Link to="/trace">Trace</Link>
        </div>
      </div>
    </nav>
  );
}

export default Header;