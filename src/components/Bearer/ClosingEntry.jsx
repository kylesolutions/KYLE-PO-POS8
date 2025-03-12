import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import UserContext from '../../Context/UserContext';

function ClosingEntry() {
  const { setCartItems } = useContext(UserContext);
  const navigate = useNavigate();
  const { state } = useLocation();
  const userData = useSelector((state) => state.user);

  const [posOpeningEntry, setPosOpeningEntry] = useState(state?.posOpeningEntry || localStorage.getItem('posOpeningEntry') || '');
  const [periodStartDate, setPeriodStartDate] = useState('');
  const [postingDate, setPostingDate] = useState(new Date().toISOString().split('T')[0]);
  const [periodEndDate, setPeriodEndDate] = useState(new Date().toISOString().slice(0, 16));
  const [company, setCompany] = useState('');
  const [user, setUser] = useState('');
  const [posProfile, setPosProfile] = useState('');
  const [posTransactions, setPosTransactions] = useState([{ pos_invoice: '', grand_total: '', posting_date: '', customer: '' }]);
  const [paymentReconciliation, setPaymentReconciliation] = useState([]); // Changed to empty array
  const [taxes, setTaxes] = useState([{ account_head: '', rate: '', amount: '' }]);
  const [grandTotal, setGrandTotal] = useState('');
  const [netTotal, setNetTotal] = useState('');
  const [totalQuantity, setTotalQuantity] = useState('');
  const [loading, setLoading] = useState(false);
  const [openingEntries, setOpeningEntries] = useState([]);

  // Initialize basic fields from Redux or localStorage
  useEffect(() => {
    const reduxPosProfile = userData?.posProfile || localStorage.getItem('pos_profile') || '';
    const reduxUser = userData?.user || localStorage.getItem('user') || '';
    const reduxCompany = userData?.company || localStorage.getItem('company') || '';
    setPosProfile(reduxPosProfile);
    setUser(reduxUser);
    setCompany(reduxCompany);
    console.log('ClosingEntry - posProfile from Redux/localStorage:', reduxPosProfile);
  }, [userData]);

  // Fetch POS Opening Entries only when posProfile is set
  useEffect(() => {
    const fetchOpeningEntries = async () => {
      if (!posProfile) {
        console.warn('posProfile is not set. Skipping fetch.');
        return;
      }
      try {
        console.log('Fetching POS Opening Entries for pos_profile:', posProfile);
        const response = await fetch('/api/method/kylepos8.kylepos8.kyle_api.Kyle_items.get_pos_opening_entries', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'token 0bde704e8493354:5709b3ab1a1cb1a',
          },
          body: JSON.stringify({ pos_profile: posProfile }),
        });
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const result = await response.json();
        console.log('Fetched Opening Entries Raw:', result);
        const entries = Array.isArray(result.message) ? result.message : (Array.isArray(result) ? result : []);
        setOpeningEntries(entries);
        console.log('Processed openingEntries:', entries);
        if (entries.length === 0) {
          console.warn('No POS Opening Entries found for pos_profile:', posProfile);
        }
      } catch (error) {
        console.error('Error fetching POS Opening Entries:', error);
        setOpeningEntries([]);
      }
    };
    if (posProfile) fetchOpeningEntries();
  }, [posProfile]);

  // Fetch POS Invoices and Payment Reconciliation based on POS Opening Entry
  useEffect(() => {
    const fetchPosInvoices = async () => {
      if (!posOpeningEntry || !openingEntries.length) return;

      const selectedEntry = openingEntries.find(entry => entry.name === posOpeningEntry);
      if (!selectedEntry) {
        console.warn('Selected POS Opening Entry not found:', posOpeningEntry);
        return;
      }

      const formattedStartDate = selectedEntry.period_start_date.split(' ')[0];
      setPeriodStartDate(formattedStartDate);
      setPostingDate(selectedEntry.posting_date);
      setCompany(selectedEntry.company || '');
      setUser(selectedEntry.user || '');
      setPosProfile(selectedEntry.pos_profile || '');
      console.log('Selected Opening Entry Data:', selectedEntry);

      // Set Payment Reconciliation from balance_details
      const openingPayment = selectedEntry.balance_details || [];
      console.log('Opening Payment Details:', openingPayment);
      if (openingPayment.length > 0) {
        setPaymentReconciliation(openingPayment.map(detail => ({
          mode_of_payment: detail.mode_of_payment || '',
          opening_amount: detail.opening_amount ? detail.opening_amount.toString() : '0',
          expected_amount: '',
          closing_amount: ''
        })));
      } else {
        setPaymentReconciliation([{ mode_of_payment: '', opening_amount: '0', expected_amount: '', closing_amount: '' }]);
      }

      try {
        const payload = { pos_opening_entry: posOpeningEntry };
        console.log('Fetching POS Invoices for:', payload);
        const response = await fetch('/api/method/kylepos8.kylepos8.kyle_api.Kyle_items.get_pos_invoices', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'token 0bde704e8493354:5709b3ab1a1cb1a',
          },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const result = await response.json();
        console.log('POS Invoices Response:', result);

        if (result.message && result.message.status === 'success') {
          const invoices = result.message.invoices || [];
          console.log('Fetched Invoices:', invoices);
          setPosTransactions(invoices.length > 0 ? invoices.map(inv => ({
            pos_invoice: inv.pos_invoice,
            grand_total: inv.grand_total,
            posting_date: inv.posting_date,
            customer: inv.customer,
          })) : [{ pos_invoice: '', grand_total: '', posting_date: '', customer: '' }]);

          setTaxes(invoices.length > 0 && invoices.some(inv => inv.taxes?.length)
            ? invoices.flatMap(inv => inv.taxes || []).map(tax => ({
                account_head: tax.account_head,
                rate: tax.rate,
                amount: tax.amount,
              }))
            : [{ account_head: '', rate: '', amount: '' }]);

          setGrandTotal(result.message.grand_total ? result.message.grand_total.toString() : '');
          setNetTotal(result.message.net_total ? result.message.net_total.toString() : '');
          setTotalQuantity(result.message.total_quantity ? result.message.total_quantity.toString() : '');
        } else {
          console.warn('No success status in POS Invoices response:', result);
          setPosTransactions([{ pos_invoice: '', grand_total: '', posting_date: '', customer: '' }]);
          setTaxes([{ account_head: '', rate: '', amount: '' }]);
          setGrandTotal('');
          setNetTotal('');
          setTotalQuantity('');
        }
      } catch (error) {
        console.error('Error fetching POS Invoices:', error);
        setPosTransactions([{ pos_invoice: '', grand_total: '', posting_date: '', customer: '' }]);
        setTaxes([{ account_head: '', rate: '', amount: '' }]);
        setGrandTotal('');
        setNetTotal('');
        setTotalQuantity('');
      }
    };
    fetchPosInvoices();
  }, [posOpeningEntry, openingEntries]);

  const handleAddPosTransaction = () => {
    setPosTransactions((prev) => [...prev, { pos_invoice: '', grand_total: '', posting_date: '', customer: '' }]);
  };

  const handlePosTransactionChange = (index, field, value) => {
    setPosTransactions((prev) =>
      prev.map((tx, i) => (i === index ? { ...tx, [field]: value } : tx))
    );
  };

  const handleRemovePosTransaction = (index) => {
    setPosTransactions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddPaymentReconciliation = () => {
    setPaymentReconciliation((prev) => [...prev, { mode_of_payment: '', opening_amount: '0', expected_amount: '', closing_amount: '' }]);
  };

  const handlePaymentReconciliationChange = (index, field, value) => {
    setPaymentReconciliation((prev) =>
      prev.map((pr, i) => (i === index ? { ...pr, [field]: value } : pr))
    );
  };

  const handleRemovePaymentReconciliation = (index) => {
    setPaymentReconciliation((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddTax = () => {
    setTaxes((prev) => [...prev, { account_head: '', rate: '', amount: '' }]);
  };

  const handleTaxChange = (index, field, value) => {
    setTaxes((prev) =>
      prev.map((tax, i) => (i === index ? { ...tax, [field]: value } : tax))
    );
  };

  const handleRemoveTax = (index) => {
    setTaxes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    const missingFields = [];
    if (!posOpeningEntry) missingFields.push('POS Opening Entry');
    if (!postingDate) missingFields.push('Posting Date');
    if (!periodEndDate) missingFields.push('Period End Date');
    if (!grandTotal) missingFields.push('Grand Total');
    if (!netTotal) missingFields.push('Net Total');
    if (!totalQuantity) missingFields.push('Total Quantity');
    if (posTransactions.some((tx) => !tx.pos_invoice || !tx.grand_total || !tx.posting_date || !tx.customer)) {
      missingFields.push('POS Transactions (complete all rows)');
    }
    if (paymentReconciliation.some((pr) => !pr.mode_of_payment || !pr.opening_amount || !pr.expected_amount || !pr.closing_amount)) {
      missingFields.push('Payment Reconciliation (complete all rows)');
    }
    if (taxes.some((tax) => !tax.account_head || !tax.rate || !tax.amount)) {
      missingFields.push('Taxes (complete all rows)');
    }

    if (missingFields.length > 0) {
      alert(`Please fill in the following required fields: ${missingFields.join(', ')}`);
      return;
    }

    setLoading(true);
    const payload = {
      pos_opening_entry: posOpeningEntry,
      posting_date: postingDate,
      period_end_date: periodEndDate,
      pos_transactions: posTransactions,
      payment_reconciliation: paymentReconciliation,
      taxes: taxes,
      grand_total: grandTotal,
      net_total: netTotal,
      total_quantity: totalQuantity,
    };
    console.log('ClosingEntry - Payload:', payload);

    try {
      const response = await fetch('/api/method/kylepos8.kylepos8.kyle_api.Kyle_items.create_closing_entry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'token 0bde704e8493354:5709b3ab1a1cb1a',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      console.log('ClosingEntry API Response:', { status: response.status, result });

      const responseData = result.message || result;
      if (response.status >= 200 && response.status < 300 && responseData.status === 'success') {
        alert(responseData.message || 'POS Closing Entry created successfully!');
        navigate('/');
      } else {
        const errorMessage = responseData.message || 'Unknown error occurred';
        alert(`Failed: ${errorMessage}`);
      }
    } catch (error) {
      console.error('ClosingEntry Network Error:', error);
      alert('Network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid closing-entry-container">
      <h2 className="text-center my-4">Create POS Closing Entry</h2>
      <div className="row">
        <div className="col-lg-12">
          <div className="row mb-3">
            <div className="col-md-4">
              <label htmlFor="posOpeningEntry" className="form-label">POS Opening Entry</label>
              <select
                id="posOpeningEntry"
                className="form-control"
                value={posOpeningEntry}
                onChange={(e) => setPosOpeningEntry(e.target.value)}
              >
                <option value="">-- Select --</option>
                {openingEntries.length > 0 ? (
                  openingEntries.map((entry) => (
                    <option key={entry.name} value={entry.name}>{entry.name}</option>
                  ))
                ) : (
                  <option value="">No Opening Entries Available</option>
                )}
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
                value={postingDate}
                onChange={(e) => setPostingDate(e.target.value)}
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

          <h5>POS Transactions</h5>
          <div className="table-responsive mb-3">
            <table className="table border text-start">
              <thead>
                <tr>
                  <th>POS Invoice</th>
                  <th>Grand Total</th>
                  <th>Posting Date</th>
                  <th>Customer</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {posTransactions.map((tx, index) => (
                  <tr key={index}>
                    <td>
                      <input
                        type="text"
                        className="form-control"
                        value={tx.pos_invoice}
                        onChange={(e) => handlePosTransactionChange(index, 'pos_invoice', e.target.value)}
                        disabled
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="form-control"
                        value={tx.grand_total}
                        onChange={(e) => handlePosTransactionChange(index, 'grand_total', e.target.value)}
                        min="0"
                        step="0.01"
                        disabled
                      />
                    </td>
                    <td>
                      <input
                        type="date"
                        className="form-control"
                        value={tx.posting_date}
                        onChange={(e) => handlePosTransactionChange(index, 'posting_date', e.target.value)}
                        disabled
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className="form-control"
                        value={tx.customer}
                        onChange={(e) => handlePosTransactionChange(index, 'customer', e.target.value)}
                        disabled
                      />
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleRemovePosTransaction(index)}
                        disabled={posTransactions.length === 1}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button className="btn btn-primary" onClick={handleAddPosTransaction}>
              Add Transaction
            </button>
          </div>

          <h5>Payment Reconciliation</h5>
          <div className="table-responsive mb-3">
            <table className="table border text-start">
              <thead>
                <tr>
                  <th>Mode of Payment</th>
                  <th>Opening Amount</th>
                  <th>Expected Amount</th>
                  <th>Closing Amount</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {paymentReconciliation.map((pr, index) => (
                  <tr key={index}>
                    <td>
                      <input
                        type="text"
                        className="form-control"
                        value={pr.mode_of_payment}
                        onChange={(e) => handlePaymentReconciliationChange(index, 'mode_of_payment', e.target.value)}
                        disabled
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="form-control"
                        value={pr.opening_amount}
                        onChange={(e) => handlePaymentReconciliationChange(index, 'opening_amount', e.target.value)}
                        min="0"
                        step="0.01"
                        disabled
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="form-control"
                        value={pr.expected_amount}
                        onChange={(e) => handlePaymentReconciliationChange(index, 'expected_amount', e.target.value)}
                        min="0"
                        step="0.01"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="form-control"
                        value={pr.closing_amount}
                        onChange={(e) => handlePaymentReconciliationChange(index, 'closing_amount', e.target.value)}
                        min="0"
                        step="0.01"
                      />
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleRemovePaymentReconciliation(index)}
                        disabled={paymentReconciliation.length === 1}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button className="btn btn-primary" onClick={handleAddPaymentReconciliation}>
              Add Payment
            </button>
          </div>

          <h5>Taxes</h5>
          <div className="table-responsive mb-3">
            <table className="table border text-start">
              <thead>
                <tr>
                  <th>Account Head</th>
                  <th>Rate (%)</th>
                  <th>Amount</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {taxes.map((tax, index) => (
                  <tr key={index}>
                    <td>
                      <input
                        type="text"
                        className="form-control"
                        value={tax.account_head}
                        onChange={(e) => handleTaxChange(index, 'account_head', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="form-control"
                        value={tax.rate}
                        onChange={(e) => handleTaxChange(index, 'rate', e.target.value)}
                        min="0"
                        step="0.01"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="form-control"
                        value={tax.amount}
                        onChange={(e) => handleTaxChange(index, 'amount', e.target.value)}
                        min="0"
                        step="0.01"
                      />
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleRemoveTax(index)}
                        disabled={taxes.length === 1}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button className="btn btn-primary" onClick={handleAddTax}>
              Add Tax
            </button>
          </div>

          <div className="row mb-3">
            <div className="col-md-4">
              <label htmlFor="grandTotal" className="form-label">Grand Total</label>
              <input
                type="number"
                id="grandTotal"
                className="form-control"
                value={grandTotal}
                onChange={(e) => setGrandTotal(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>
            <div className="col-md-4">
              <label htmlFor="netTotal" className="form-label">Net Total</label>
              <input
                type="number"
                id="netTotal"
                className="form-control"
                value={netTotal}
                onChange={(e) => setNetTotal(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>
            <div className="col-md-4">
              <label htmlFor="totalQuantity" className="form-label">Total Quantity</label>
              <input
                type="number"
                id="totalQuantity"
                className="form-control"
                value={totalQuantity}
                onChange={(e) => setTotalQuantity(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div className="row">
            <div className="col-md-6 text-end">
              <button
                className="btn btn-success"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? 'Submitting...' : 'Submit Closing Entry'}
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

export default ClosingEntry;