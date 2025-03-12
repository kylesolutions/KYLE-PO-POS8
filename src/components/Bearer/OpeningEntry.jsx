import React, { useContext, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import UserContext from '../../Context/UserContext';
import { useSelector } from 'react-redux';

function OpeningEntry() {
  const { setCartItems } = useContext(UserContext);
  const navigate = useNavigate();
  const location = useLocation();
  const userData = useSelector((state) => state.user);

  const [periodStartDate, setPeriodStartDate] = useState('');
  const [postingDate, setPostingDate] = useState(new Date().toISOString().split('T')[0]);
  const [company, setCompany] = useState('');
  const [user, setUser] = useState('');
  const [posProfile, setPosProfile] = useState('');
  const [balanceDetails, setBalanceDetails] = useState([{ mode_of_payment: '', opening_amount: '' }]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const { user: navUser, pos_profile: navPosProfile, company: navCompany } = location.state || {};
    const reduxUser = userData?.user || localStorage.getItem('user') || '';
    const reduxPosProfile = userData?.posProfile || localStorage.getItem('pos_profile') || '';
    const reduxCompany = userData?.company || localStorage.getItem('company') || '';

    setUser(navUser || reduxUser);
    setPosProfile(navPosProfile || reduxPosProfile);
    setCompany(navCompany || reduxCompany);
    console.log('OpeningEntry - posProfile:', reduxPosProfile);
  }, [location.state, userData]);

  const handleAddBalanceDetail = () => {
    setBalanceDetails((prev) => [...prev, { mode_of_payment: '', opening_amount: '' }]);
  };

  const handleBalanceDetailChange = (index, field, value) => {
    setBalanceDetails((prev) =>
      prev.map((detail, i) => (i === index ? { ...detail, [field]: value } : detail))
    );
  };

  const handleRemoveBalanceDetail = (index) => {
    setBalanceDetails((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    const missingFields = [];
    if (!periodStartDate) missingFields.push('Period Start Date');
    if (!postingDate) missingFields.push('Posting Date');
    if (!company) missingFields.push('Company');
    if (!user) missingFields.push('User');
    if (!posProfile) missingFields.push('POS Profile');
    if (balanceDetails.length === 0 || balanceDetails.some((d) => !d.mode_of_payment || !d.opening_amount)) {
      missingFields.push('Balance Details (complete all rows)');
    }

    if (missingFields.length > 0) {
      alert(`Please fill in the following required fields: ${missingFields.join(', ')}`);
      return;
    }

    setLoading(true);
    const payload = {
      period_start_date: periodStartDate,
      posting_date: postingDate,
      company,
      user,
      pos_profile: posProfile,
      balance_details: balanceDetails,
      status: 'Draft', // Explicitly set as draft
      docstatus: 0,    // Ensure Frappe recognizes it as draft
    };
    console.log('OpeningEntry - Payload:', payload);

    try {
      const response = await fetch('/api/method/kylepos8.kylepos8.kyle_api.Kyle_items.create_opening_entry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'token 0bde704e8493354:5709b3ab1a1cb1a',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      console.log("OpeningEntry API Response:", { status: response.status, result });

      const responseData = result.message || result;

      if (response.status >= 200 && response.status < 300 && responseData.status === 'success') {
        const posOpeningEntry = responseData.name;
        localStorage.setItem('posOpeningEntry', posOpeningEntry);
        alert(`Opening Entry created successfully: ${posOpeningEntry}`);
        navigate('/firsttab', { state: { posOpeningEntry } });
      } else {
        const errorMessage = responseData.message || 'Unknown error occurred';
        alert(`Failed: ${errorMessage}`);
      }
    } catch (error) {
      console.error('OpeningEntry Network Error:', error);
      alert('Network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid opening-entry-container">
      <h2 className="text-center my-4">Create Opening Entry</h2>
      <div className="row">
        <div className="col-lg-12">
          <div className="row mb-3">
            <div className="col-md-4">
              <label htmlFor="periodStartDate" className="form-label">Period Start Date</label>
              <input
                type="date"
                id="periodStartDate"
                className="form-control"
                value={periodStartDate}
                onChange={(e) => setPeriodStartDate(e.target.value)}
              />
            </div>
            <div className="col-md-4">
              <label htmlFor="postingDate" className="form-label">Posting Date</label>
              <input
                type="date"
                id="postingDate"
                className="form-control"
                value={postingDate}
                onChange={(e) => setPostingDate(e.target.value)}
              />
            </div>
            <div className="col-md-4">
              <label htmlFor="company" className="form-label">Company</label>
              <input
                type="text"
                id="company"
                className="form-control"
                value={company}
                disabled
              />
            </div>
          </div>

          <div className="row mb-3">
            <div className="col-md-6">
              <label htmlFor="user" className="form-label">User</label>
              <input
                type="text"
                id="user"
                className="form-control"
                value={user}
                disabled
              />
            </div>
            <div className="col-md-6">
              <label htmlFor="posProfile" className="form-label">POS Profile</label>
              <input
                type="text"
                id="posProfile"
                className="form-control"
                value={posProfile}
                disabled
              />
            </div>
          </div>

          <div className="table-responsive mb-3">
            <table className="table border text-start">
              <thead>
                <tr>
                  <th>Mode of Payment</th>
                  <th>Opening Amount</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {balanceDetails.map((detail, index) => (
                  <tr key={index}>
                    <td>
                      <select
                        className="form-control"
                        value={detail.mode_of_payment}
                        onChange={(e) => handleBalanceDetailChange(index, 'mode_of_payment', e.target.value)}
                      >
                        <option value="">-- Select --</option>
                        <option value="Cash">Cash</option>
                        <option value="Credit Card">Credit Card</option>
                        <option value="UPI">UPI</option>
                      </select>
                    </td>
                    <td>
                      <input
                        type="number"
                        className="form-control"
                        value={detail.opening_amount}
                        onChange={(e) => handleBalanceDetailChange(index, 'opening_amount', e.target.value)}
                        min="0"
                        step="0.01"
                      />
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleRemoveBalanceDetail(index)}
                        disabled={balanceDetails.length === 1}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button className="btn btn-primary" onClick={handleAddBalanceDetail}>
              Add Payment Mode
            </button>
          </div>

          <div className="row">
            <div className="col-md-6">
              <div className="grand-tot-div">
                <span>Total Opening Amount:</span>
                <span>
                  ${balanceDetails.reduce((sum, detail) => sum + (parseFloat(detail.opening_amount) || 0), 0).toFixed(2)}
                </span>
              </div>
            </div>
            <div className="col-md-6 text-end">
              <button
                className="btn btn-success"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? 'Submitting...' : 'Submit Opening Entry'}
              </button>
              <button
                className="btn btn-secondary ms-2"
                onClick={() => navigate('/')}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OpeningEntry;