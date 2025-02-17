import React from 'react'
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom'

function Navbar() {
    const navigate = useNavigate()
    const user = useSelector((state) => state.user.user);
    const posProfile = useSelector((state) => state.user.pos_profile);
    return (
        <>
            <div>
                <nav className="navbar navbar-expand-lg navbar-light bg-white">
                    <div className="container-fluid">
                        <a className="navbar-brand text-black">
                            {user}
                        </a>
                        <button className="navbar-toggler bg-light" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
                            <span className="navbar-toggler-icon"></span>
                        </button>
                        <div className="collapse navbar-collapse " id="navbarSupportedContent">
                            <div className="navbar-nav mx-auto text-center">
                                <a className="nav-link active text-black cursor-pointer" aria-current="page" onClick={() => navigate('/frontpage')}>
                                    <i className="bi bi-house-fill fs-2"></i>
                                </a>
                                <a className="nav-link active text-black cursor-pointer" aria-current="page" onClick={() => navigate('/')}>
                                    <i className="bi bi-menu-button-wide fs-2"></i>
                                </a>
                                <a className="nav-link active text-black cursor-pointer" aria-current="page" onClick={() => navigate('/table')}>
                                    <i className="bi bi-border-all fs-2"></i>
                                </a>
                                <a className="nav-link active text-black cursor-pointer" aria-current="page" onClick={() => navigate('/kitchen')}>
                                <i className="bi bi-cup-hot fs-2"></i>
                                </a>
                                <a className="nav-link active text-black cursor-pointer" aria-current="page" onClick={() => navigate('/salesinvoice')}>
                                <i className="bi bi-save fs-2"></i>
                                </a>
                            </div>
                        </div>
                    </div>
                </nav>
            </div>
        </>
    )
}

export default Navbar