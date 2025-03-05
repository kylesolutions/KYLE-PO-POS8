import React from 'react';
import './firstTab.css';
import { useNavigate } from 'react-router-dom';

function FirstTab() {
    const navigate = useNavigate();

    return (
        <div className="container-fluid main">
            <button
                className="back-button"
                onClick={() => navigate('/')}
                aria-label="Go back"
            >
                <i className="bi bi-arrow-left-circle"></i>
            </button>
            <div className="row justify-content-center g-3"> {/* Added gutter (g-3) for spacing */}
                <div className="col-12 col-md-6 col-lg-4 d-flex justify-content-center">
                    <button
                        className="main-button"
                        onClick={() => navigate('/frontpage')}
                    >
                        TAKE AWAY
                    </button>
                </div>
                <div className="col-12 col-md-6 col-lg-4 d-flex justify-content-center">
                    <button
                        className="main-button"
                        onClick={() => navigate('/table')}
                    >
                        DINE IN
                    </button>
                </div>
                <div className="col-12 col-md-6 col-lg-4 d-flex justify-content-center">
                    <button
                        className="main-button"
                        onClick={() => navigate('/frontpage')}
                    >
                        ONLINE DELIVERY
                    </button>
                </div>
            </div>
        </div>
    );
}

export default FirstTab;