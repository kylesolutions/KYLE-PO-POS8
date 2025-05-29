import React, { useContext, useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import UserContext from '../../Context/UserContext';


function ClosingEntry() {
  const { setCartItems } = useContext(UserContext);
  const navigate = useNavigate();
  const { state } = useLocation();
  const userData = useSelector((state) => state.user);
  const closingAmountRefs = useRef([]);

  const [openingEntries, setOpeningEntries] = useState([]);
  const [posOpeningEntry, setPosOpeningEntry] = useState(state?.posOpeningEntry || localStorage.getItem('posOpeningEntry') || '');
  const [periodStartDate, setPeriodStartDate] = useState('');
  const [postingDate, setPostingDate] = useState(() => {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes in milliseconds
    const istTime = new Date(now.getTime() + istOffset);
    return istTime.toISOString().slice(0, 16); // Format as YYYY-MM-DDTHH:mm
  });
  const [periodEndDate, setPeriodEndDate] = useState(() => {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istTime = new Date(now.getTime() + istOffset);
    return istTime.toISOString().slice(0, 16);
  });
  const [company, setCompany] = useState('');
  const [user, setUser] = useState('');
  const [posProfile, setPosProfile] = useState('');
  const [posTransactions, setPosTransactions] = useState([]);
  const [paymentReconciliation, setPaymentReconciliation] = useState([]);
  const [taxes, setTaxes] = useState([]);
  const [grandTotal, setGrandTotal] = useState('');
  const [netTotal, setNetTotal] = useState('');
  const [totalQuantity, setTotalQuantity] = useState('');
  const [invoicesData, setInvoicesData] = useState(null); // Added invoicesData state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [noInvoicesMessage, setNoInvoicesMessage] = useState('');

  // Initialize company, user, and posProfile
  useEffect(() => {
    const reduxPosProfile = userData?.posProfile || localStorage.getItem('pos_profile') || '';
    const reduxUser = userData?.user || localStorage.getItem('user') || '';
    const reduxCompany = userData?.company || localStorage.getItem('company') || '';
    setPosProfile(reduxPosProfile);
    setUser(reduxUser);
    setCompany(reduxCompany);
    if (!reduxCompany) {
      setError('Company details are missing. Please log in again.');
    }
    console.log('ClosingEntry - posProfile:', reduxPosProfile);
    console.log('ClosingEntry - company:', reduxCompany);
    console.log('ClosingEntry - user:', reduxUser);
  }, [userData]);

  // Fetch POS Opening Entries
  useEffect(() => {
    const fetchOpeningEntries = async () => {
      if (!posProfile) return;
      try {
        setLoading(true);
        const response = await fetch('/api/method/kylepos8.kylepos8.kyle_api.Kyle_items.get_pos_opening_entries', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `token ${import.meta.env.VITE_FRAPPE_API_TOKEN || '0bde704e8493354:5709b3ab1a1cb1a'}`,
            'Expect': '',
          },
          body: JSON.stringify({ pos_profile: posProfile }),
        });
        if (!response.ok) throw new Error(`Failed to fetch POS Opening Entries: ${response.status}`);
        const result = await response.json();
        console.log('Fetched Opening Entries Raw:', result);
        const entries = Array.isArray(result.message) ? result.message : [];
        console.log('Processed openingEntries:', entries);
        setOpeningEntries(entries);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching POS Opening Entries:', error);
        setError(`Failed to load POS Opening Entries: ${error.message}`);
        setOpeningEntries([]);
        setLoading(false);
      }
    };
    if (posProfile) fetchOpeningEntries();
  }, [posProfile]);

  // Fetch POS Invoices
  useEffect(() => {
    const fetchPosInvoices = async () => {
      if (!posOpeningEntry || !openingEntries.length || !company) return;

      const selectedEntry = openingEntries.find(entry => entry.name === posOpeningEntry);
      if (!selectedEntry) return;

      setPeriodStartDate(selectedEntry.period_start_date.split(' ')[0]);
      setPostingDate(selectedEntry.posting_date);
      setCompany(selectedEntry.company);
      setUser(selectedEntry.user);
      setPosProfile(selectedEntry.pos_profile);

      try {
        setLoading(true);
        setError(null);
        setSuccessMessage('');
        setNoInvoicesMessage('');
        const url = `/api/method/kylepos8.kylepos8.kyle_api.Kyle_items.get_pos_invoices_openingentry?pos_opening_entry=${encodeURIComponent(posOpeningEntry)}`;
        console.log('Fetching POS Invoices with URL:', url);
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `token ${import.meta.env.VITE_FRAPPE_API_TOKEN || '0bde704e8493354:5709b3ab1a1cb1a'}`,
            'Expect': '',
          },
          body: JSON.stringify({ pos_opening_entry: posOpeningEntry }),
        });
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to fetch invoices: ${response.status}, ${errorText}`);
        }
        const data = await response.json();
        console.log('POS Invoices Response:', data);

        if (data.message?.status === 'success') {
          const { invoices, payment_totals, grand_total, net_total, total_quantity, taxes } = data.message;

          const invoiceData = {
            invoices: invoices.map(inv => ({
              name: inv.pos_invoice,
              customer_name: inv.customer,
              posting_date: inv.posting_date,
              net_total: inv.net_total,
              total_taxes_and_charges: inv.taxes?.reduce((sum, tax) => sum + tax.amount, 0) || 0,
              grand_total: inv.grand_total,
              items: inv.items || [],
            })),
            pos_transactions: invoices.map(inv => ({
              pos_invoice: inv.pos_invoice,
              grand_total: inv.grand_total,
              posting_date: inv.posting_date,
              customer: inv.customer,
            })),
            payment_reconciliation: Object.keys(payment_totals).map(mode => {
              const paymentReceived = parseFloat(payment_totals[mode] || 0);
              const openingDetail = (selectedEntry.balance_details || []).find(detail => detail.mode_of_payment === mode);
              const openingAmount = openingDetail ? parseFloat(openingDetail.opening_amount) : 0;
              const expectedAmount = openingAmount + paymentReceived;
              return {
                mode_of_payment: mode,
                opening_amount: openingAmount,
                expected_amount: expectedAmount,
                closing_amount: expectedAmount,
                difference: 0,
              };
            }),
            taxes: taxes || invoices.flatMap(inv => inv.taxes || []),
            grand_total,
            net_total,
            total_quantity,
          };

          console.log('Setting invoicesData:', invoiceData);
          setInvoicesData(invoiceData);
          setPosTransactions(invoiceData.pos_transactions);
          setPaymentReconciliation(invoiceData.payment_reconciliation);
          setTaxes(invoiceData.taxes);
          setGrandTotal(grand_total.toString());
          setNetTotal(net_total.toString());
          setTotalQuantity(total_quantity.toString());
        } else {
          setNoInvoicesMessage('No POS Invoices found for this Opening Entry.');
          setInvoicesData(null);
          setPaymentReconciliation([]);
          setPosTransactions([]);
          setTaxes([]);
          setGrandTotal('');
          setNetTotal('');
          setTotalQuantity('');
        }
        setLoading(false);
      } catch (error) {
        console.error('Fetch Invoices Error:', error);
        setError(`Failed to load invoices: ${error.message}`);
        setInvoicesData(null);
        setPaymentReconciliation([]);
        setPosTransactions([]);
        setTaxes([]);
        setNoInvoicesMessage('');
        setLoading(false);
      }
    };
    fetchPosInvoices();
  }, [posOpeningEntry, openingEntries, company]);

  // Handle closing amount input
  const handlePaymentReconciliationChange = (index, field, value) => {
    const closingAmount = parseFloat(value) || 0;
    if (closingAmount < 0) {
      alert('Closing Amount cannot be negative.');
      return;
    }
    setPaymentReconciliation(prev => {
      const newPr = [...prev];
      newPr[index] = { ...newPr[index], [field]: closingAmount };
      newPr[index].difference = flt(newPr[index].expected_amount) - flt(closingAmount);
      return newPr;
    });
  };

  // Helper function to simulate Frappe's flt (round to 2 decimals)
  const flt = value => Math.round(parseFloat(value || 0) * 100) / 100;

  // Handle form submission (save as draft or submit)
  const handleSubmit = async (saveAsDraft = false) => {
    if (!posOpeningEntry || !company || !postingDate || !periodEndDate) {
      alert('Please fill all required fields: POS Opening Entry, Posting Date, Period End Date.');
      return;
    }
    if (!invoicesData) {
      alert('No invoice data available. Please select a valid POS Opening Entry with invoices.');
      return;
    }
    if (paymentReconciliation.some(pr => pr.closing_amount === undefined || pr.closing_amount === null)) {
      alert('Please enter Closing Amount for all payment modes.');
      return;
    }

    const payload = {
      pos_opening_entry: posOpeningEntry,
      posting_date: postingDate,
      period_end_date: periodEndDate,
      pos_transactions: JSON.stringify(posTransactions),
      payment_reconciliation: JSON.stringify(paymentReconciliation),
      taxes: JSON.stringify(taxes),
      grand_total: flt(grandTotal),
      net_total: flt(netTotal),
      total_quantity: flt(totalQuantity),
      company,
      save_as_draft: saveAsDraft,
    };

    try {
      setLoading(true);
      setError(null);
      setSuccessMessage('');
      console.log('Sending payload:', JSON.stringify(payload, null, 2));
      const response = await fetch('/api/method/kylepos8.kylepos8.kyle_api.Kyle_retail.create_closing_entry', {
        method: 'POST',
        headers: {
          Authorization: `token ${import.meta.env.VITE_FRAPPE_API_TOKEN || '0bde704e8493354:5709b3ab1a1cb1a'}`,
          'Content-Type': 'application/json',
          'Expect': '',
        },
        body: JSON.stringify(payload),
      });
      console.log('Response status:', response.status, 'OK:', response.ok);
      const data = await response.json();
      console.log('Server response:', data);

      if (!response.ok) throw new Error(`Failed to create closing entry: ${data.message?.message?.message || data.message || 'Unknown error'}`);
      if (data.message?.status === 'error') throw new Error(data.message.message || 'Failed to create closing entry');

      setSuccessMessage(
        `POS Closing Entry ${saveAsDraft ? 'saved as draft' : 'created and submitted'} successfully! ` +
        `Name: ${data.message?.name || 'Unknown'}, ` +
        `Grand Total: ₹${(data.message?.grand_total || 0).toFixed(2)}, ` +
        `Status: ${data.message?.status || 'Unknown'}`
      );
      setCartItems([]);
      setInvoicesData(null);
      setPosOpeningEntry('');
      setPaymentReconciliation([]);
      setPosTransactions([]);
      setTaxes([]);
      setGrandTotal('');
      setNetTotal('');
      setTotalQuantity('');
      setNoInvoicesMessage('');
      setLoading(false);

      if (saveAsDraft) {
        try {
          const logoutResponse = await fetch('/api/method/kylepos8.kylepos8.kyle_api.Kyle_retail.user_logout', {
            method: 'POST',
            headers: {
              Authorization: `token ${import.meta.env.VITE_FRAPPE_API_TOKEN || '0bde704e8493354:5709b3ab1a1cb1a'}`,
              'Content-Type': 'application/json',
              'Expect': '',
            },
          });
          const logoutData = await logoutResponse.json();
          console.log('Logout response:', logoutData);
          if (!logoutResponse.ok || logoutData.status === 'error') {
            throw new Error(logoutData.message || 'Failed to logout');
          }
          localStorage.removeItem('email');
          localStorage.removeItem('company');
          localStorage.removeItem('pos_profile');
          localStorage.removeItem('posOpeningEntry');
          localStorage.removeItem('user');
          navigate('/');
        } catch (logoutError) {
          setError(`Failed to logout: ${logoutError.message}`);
        }
      }
    } catch (err) {
      setError(`Failed to ${saveAsDraft ? 'save' : 'create'} POS Closing Entry: ${err.message}`);
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center mt-5">Loading...</div>;
  if (error) return <div className="text-center mt-5 text-danger">Error: {error}</div>;

  return (
    <div className="container-fluid px-5 py-3">
      <h2 className="mb-4">Create POS Closing Entry</h2>
      {successMessage && (
        <div className="alert alert-success" role="alert">
          {successMessage}
        </div>
      )}
      {noInvoicesMessage && (
        <div className="alert alert-warning" role="alert">
          {noInvoicesMessage}
        </div>
      )}
      <div className="card p-4 mb-4">
        <div className="row mb-3">
          <div className="col-md-4">
            <label htmlFor="openingEntry" className="form-label">POS Opening Entry</label>
            <select
              id="openingEntry"
              className="form-select"
              value={posOpeningEntry}
              onChange={(e) => setPosOpeningEntry(e.target.value)}
            >
              <option value="">Select Opening Entry</option>
              {openingEntries.map((entry) => (
                <option key={entry.name} value={entry.name}>
                  {entry.name} ({entry.pos_profile}, {new Date(entry.period_start_date).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-4">
            <label htmlFor="periodStartDate" className="form-label">Period Start Date</label>
            <input
              type="date"
              id="periodStartDate"
              className="form-control"
              value={periodStartDate}
              disabled
            />
          </div>
          <div className="col-md-4">
            <label htmlFor="postingDate" className="form-label">Posting Date</label>
            <input
              type="date"
              id="postingDate"
              className="form-control"
              value={postingDate.split('T')[0]}
              disabled
            />
          </div>
        </div>
        <div className="row mb-3">
          <div className="col-md-4">
            <label htmlFor="periodEndDate" className="form-label">Period End Date & Time</label>
            <input
              type="datetime-local"
              id="periodEndDate"
              className="form-control"
              value={periodEndDate}
              onChange={(e) => setPeriodEndDate(e.target.value)}
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
          <div className="col-md-4">
            <label htmlFor="user" className="form-label">User</label>
            <input
              type="text"
              id="user"
              className="form-control"
              value={user}
              disabled
            />
          </div>
        </div>
        <div className="row mb-3">
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

        {invoicesData && (
          <>
            <h4 className="mt-4">POS Invoices ({invoicesData.invoices.length})</h4>
            <table className="table table-striped table-bordered mb-4">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Customer</th>
                  <th>Posting Date</th>
                  <th>Net Total</th>
                  <th>Taxes</th>
                  <th>Grand Total</th>
                  <th>Items</th>
                </tr>
              </thead>
              <tbody>
                {invoicesData.invoices.map((inv) => (
                  <tr key={inv.name}>
                    <td>{inv.name}</td>
                    <td>{inv.customer_name}</td>
                    <td>{new Date(inv.posting_date).toLocaleDateString()}</td>
                    <td>₹{inv.net_total.toFixed(2)}</td>
                    <td>₹{inv.total_taxes_and_charges.toFixed(2)}</td>
                    <td>₹{inv.grand_total.toFixed(2)}</td>
                    <td>
                      {inv.items.map((item) => (
                        <div key={item.item_code}>
                          {item.item_name} (Qty: {item.qty}, ₹{item.rate.toFixed(2)})
                        </div>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h4>Payment Reconciliation</h4>
            <table className="table table-bordered mb-4">
              <thead>
                <tr>
                  <th>Mode of Payment</th>
                  <th>Opening Amount</th>
                  <th>Expected Amount</th>
                  <th>Closing Amount</th>
                  <th>Difference</th>
                </tr>
              </thead>
              <tbody>
                {paymentReconciliation.map((pr, index) => (
                  <tr key={pr.mode_of_payment}>
                    <td>{pr.mode_of_payment}</td>
                    <td>₹{pr.opening_amount.toFixed(2)}</td>
                    <td>₹{pr.expected_amount.toFixed(2)}</td>
                    <td>
                      <input
                        type="number"
                        className="form-control"
                        value={pr.closing_amount || ''}
                        onChange={(e) => handlePaymentReconciliationChange(index, 'closing_amount', e.target.value)}
                        min="0"
                        step="0.01"
                        ref={(el) => (closingAmountRefs.current[index] = el)}
                        aria-label={`Closing Amount for ${pr.mode_of_payment}`}
                      />
                    </td>
                    <td>₹{pr.difference.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h4>Taxes</h4>
            <table className="table table-bordered mb-4">
              <thead>
                <tr>
                  <th>Account Head</th>
                  <th>Rate (%)</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {taxes.map((tax, index) => (
                  <tr key={`${tax.account_head}:${tax.rate}`}>
                    <td>{tax.account_head}</td>
                    <td>{tax.rate.toFixed(2)}%</td>
                    <td>₹{tax.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="summary-section">
              <p><strong>Net Total:</strong> ₹{netTotal}</p>
              <p><strong>Grand Total:</strong> ₹{grandTotal}</p>
              <p><strong>Total Quantity:</strong> {totalQuantity}</p>
            </div>
          </>
        )}

        <div className="d-flex justify-content-end mt-4 gap-2">
          <button
            className="btn btn-secondary"
            onClick={() => handleSubmit(true)}
            disabled={loading || !invoicesData}
            aria-label="Save as Draft"
          >
            <i className="fas fa-save"></i> Save as Draft
          </button>
          <button
            className="btn btn-primary"
            onClick={() => handleSubmit(false)}
            disabled={loading && !invoicesData}
            aria-label="Create Closing Entry"
          >
            <i className="fas fa-check"></i> Create Closing
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/frontpage')}
            disabled={loading}
            aria-label="Cancel"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default ClosingEntry;