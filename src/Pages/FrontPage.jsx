import Navbar from '../components/Navbar/Navbar';
import Front from '../components/Header/Front';
import NavIcons from '../components/Navbar/NavIcons';


function FrontPage() {
  return (
    <div className="container-fluid">
      <div className="row">
        {/* Left Sidebar: NavIcons */}
        <div className="col-lg-1 col-md-3 col-sm-4 p-0">
          <NavIcons/>
        </div>
        {/* Main Content: Navbar and Front */}
        <div className="col-lg-11 col-md-9 col-sm-8">
          <Navbar />
          <Front />
        </div>
      </div>
    </div>
  );
}

export default FrontPage;