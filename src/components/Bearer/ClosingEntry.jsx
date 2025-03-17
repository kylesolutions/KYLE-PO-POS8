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
  const [periodEndDate, setPeriodEndDate] = useState(() => {
    const now = new Date();
    return now.toLocaleString('sv', { timeZone: 'Asia/Kolkata' }).replace(' ', 'T').slice(0, 16);
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
  const [loading, setLoading] = useState(false);
  const [openingEntries, setOpeningEntries] = useState([]);

  useEffect(() => {
    const reduxPosProfile = userData?.posProfile || localStorage.getItem('pos_profile') || '';
    const reduxUser = userData?.user || localStorage.getItem('user') || '';
    const reduxCompany = userData?.company || localStorage.getItem('company') || '';
    setPosProfile(reduxPosProfile);
    setUser(reduxUser);
    setCompany(reduxCompany);
    console.log('ClosingEntry - posProfile:', reduxPosProfile);
    console.log('ClosingEntry - company:', reduxCompany);
  }, [userData]);

  useEffect(() => {
    const fetchOpeningEntries = async () => {
      if (!posProfile) return;
      try {
        const response = await fetch('/api/method/kylepos8.kylepos8.kyle_api.Kyle_items.get_pos_opening_entries', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'token 0bde704e8493354:5709b3ab1a1cb1a',
            'Expect': '', // Prevent 417 error
          },
          body: JSON.stringify({ pos_profile: posProfile }),
        });
        const result = await response.json();
        console.log('Fetched Opening Entries Raw:', result);
        const entries = Array.isArray(result.message) ? result.message : [];
        console.log('Processed openingEntries:', entries);
        setOpeningEntries(entries);
      } catch (error) {
        console.error('Error fetching POS Opening Entries:', error);
        setOpeningEntries([]);
      }
    };
    if (posProfile) fetchOpeningEntries();
  }, [posProfile]);

  useEffect(() => {
    const fetchPosInvoices = async () => {
      if (!posOpeningEntry || !openingEntries.length) return;

      const selectedEntry = openingEntries.find(entry => entry.name === posOpeningEntry);
      if (!selectedEntry) return;

      setPeriodStartDate(selectedEntry.period_start_date.split(' ')[0]);
      setPostingDate(selectedEntry.posting_date);
      setCompany(selectedEntry.company);
      setUser(selectedEntry.user);
      setPosProfile(selectedEntry.pos_profile);

      const openingPayment = selectedEntry.balance_details || [];
      console.log('Opening Payment Details:', openingPayment);

      try {
        console.log('Fetching POS Invoices for:', { pos_opening_entry: posOpeningEntry });
        const response = await fetch('/api/method/kylepos8.kylepos8.kyle_api.Kyle_items.get_pos_invoices', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'token 0bde704e8493354:5709b3ab1a1cb1a',
            'Expect': '', // Prevent 417 error
          },
          body: JSON.stringify({ pos_opening_entry: posOpeningEntry }),
        });
        const result = await response.json();
        console.log('POS Invoices Response:', result);

        if (result.message && result.message.status === 'success') {
          const { invoices, payment_totals, grand_total, net_total, total_quantity } = result.message;

          setPosTransactions(invoices.map(inv => ({
            pos_invoice: inv.pos_invoice,
            grand_total: inv.grand_total,
            posting_date: inv.posting_date,
            customer: inv.customer,
          })));

          const initialPaymentReconciliation = openingPayment.map(detail => {
            const paymentReceived = parseFloat(payment_totals[detail.mode_of_payment] || 0);
            const openingAmount = parseFloat(detail.opening_amount);
            const expectedAmount = openingAmount + paymentReceived;
            return {
              mode_of_payment: detail.mode_of_payment,
              opening_amount: detail.opening_amount.toString(),
              expected_amount: expectedAmount.toString(),
              closing_amount: expectedAmount.toString(),
              difference: '0'
            };
          });

          Object.keys(payment_totals).forEach(mode => {
            if (!initialPaymentReconciliation.some(pr => pr.mode_of_payment === mode)) {
              const paymentReceived = parseFloat(payment_totals[mode] || 0);
              initialPaymentReconciliation.push({
                mode_of_payment: mode,
                opening_amount: '0',
                expected_amount: paymentReceived.toString(),
                closing_amount: paymentReceived.toString(),
                difference: '0'
              });
            }
          });

          console.log('Updated Payment Reconciliation:', initialPaymentReconciliation);
          setPaymentReconciliation(initialPaymentReconciliation);
          setTaxes(invoices.flatMap(inv => inv.taxes || []).map(tax => ({
            account_head: tax.account_head,
            rate: tax.rate,
            amount: tax.amount,
          })) || []);

          setGrandTotal(grand_total.toString());
          setNetTotal(net_total.toString());
          setTotalQuantity(total_quantity.toString());
        } else {
          console.log('No success status in POS Invoices response:', result);
        }
      } catch (error) {
        console.error('Error fetching POS Invoices:', error);
      }
    };
    fetchPosInvoices();
  }, [posOpeningEntry, openingEntries]);

  const handlePaymentReconciliationChange = (index, field, value) => {
    setPaymentReconciliation(prev =>
      prev.map((pr, i) => {
        if (i !== index) return pr;
        const updatedPr = { ...pr, [field]: value };
        if (field === 'closing_amount') {
          const expected = parseFloat(updatedPr.expected_amount) || 0;
          const closing = parseFloat(updatedPr.closing_amount || 0);
          updatedPr.difference = (closing - expected).toString();
        }
        return updatedPr;
      })
    );
  };

  const handleSubmit = async () => {
    const payload = {
      pos_opening_entry: posOpeningEntry,
      posting_date: postingDate,
      period_end_date: periodEndDate,
      company: company, // Explicitly include company
      pos_transactions: posTransactions,
      payment_reconciliation: paymentReconciliation,
      taxes: taxes,
      grand_total: grandTotal,
      net_total: netTotal,
      total_quantity: totalQuantity,
    };

    console.log('Submitting Payload:', payload);

    try {
      setLoading(true);
      const response = await fetch('/api/method/kylepos8.kylepos8.kyle_api.Kyle_items.create_closing_entry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'token 0bde704e8493354:5709b3ab1a1cb1a',
          'Expect': '', // Prevent 417 error
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      console.log('Closing Entry Response:', result);

      if (result.message && result.message.status === 'success') {
        alert('POS Closing Entry created successfully!');
        setCartItems([]); // Clear cart on success
        navigate('/');
      } else {
        console.error('Closing Entry Submission Failed:', result.message);
        alert(`Failed: ${result.message?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('ClosingEntry Network Error:', error);
      alert('Network error occurred. Please check your connection and try again.');
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
              <label>POS Opening Entry</label>
              <select
                className="form-control"
                value={posOpeningEntry}
                onChange={(e) => setPosOpeningEntry(e.target.value)}
              >
                <option value="">-- Select --</option>
                {openingEntries.map(entry => (
                  <option key={entry.name} value={entry.name}>{entry.name}</option>
                ))}
              </select>
            </div>
            <div className="col-md-4">
              <label>Period Start Date</label>
              <input type="date" className="form-control" value={periodStartDate} disabled />
            </div>
            <div className="col-md-4">
              <label>Posting Date</label>
              <input type="date" className="form-control" value={postingDate} disabled />
            </div>
          </div>

          <div className="row mb-3">
            <div className="col-md-4">
              <label>Period End Date & Time</label>
              <input
                type="datetime-local"
                className="form-control"
                value={periodEndDate}
                onChange={(e) => setPeriodEndDate(e.target.value)}
              />
            </div>
            <div className="col-md-4">
              <label>Company</label>
              <input type="text" className="form-control" value={company} disabled />
            </div>
            <div className="col-md-4">
              <label>User</label>
              <input type="text" className="form-control" value={user} disabled />
            </div>
          </div>

          <div className="row mb-3">
            <div className="col-md-6">
              <label>POS Profile</label>
              <input type="text" className="form-control" value={posProfile} disabled />
            </div>
          </div>

          <h5>POS Transactions</h5>
          <div className="table-responsive mb-3">
            <table className="table border">
              <thead>
                <tr>
                  <th>POS Invoice</th>
                  <th>Grand Total</th>
                  <th>Posting Date</th>
                  <th>Customer</th>
                </tr>
              </thead>
              <tbody>
                {posTransactions.map((tx, index) => (
                  <tr key={index}>
                    <td><input className="form-control" value={tx.pos_invoice} disabled /></td>
                    <td><input className="form-control" value={tx.grand_total} disabled /></td>
                    <td><input className="form-control" value={tx.posting_date} disabled /></td>
                    <td><input className="form-control" value={tx.customer} disabled /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h5>Payment Reconciliation</h5>
          <div className="table-responsive mb-3">
            <table className="table border">
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
                  <tr key={index}>
                    <td><input className="form-control" value={pr.mode_of_payment} disabled /></td>
                    <td><input className="form-control" value={pr.opening_amount} disabled /></td>
                    <td><input className="form-control" value={pr.expected_amount} disabled /></td>
                    <td>
                      <input
                        className="form-control"
                        value={pr.closing_amount}
                        onChange={(e) => handlePaymentReconciliationChange(index, 'closing_amount', e.target.value)}
                        type="number"
                        min="0"
                        step="0.01"
                      />
                    </td>
                    <td><input className="form-control" value={pr.difference} disabled /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h5>Taxes</h5>
          <div className="table-responsive mb-3">
            <table className="table border">
              <thead>
                <tr>
                  <th>Account Head</th>
                  <th>Rate (%)</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {taxes.map((tax, index) => (
                  <tr key={index}>
                    <td><input className="form-control" value={tax.account_head} disabled /></td>
                    <td><input className="form-control" value={tax.rate} disabled /></td>
                    <td><input className="form-control" value={tax.amount} disabled /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="row mb-3">
            <div className="col-md-4">
              <label>Grand Total</label>
              <input className="form-control" value={grandTotal} disabled />
            </div>
            <div className="col-md-4">
              <label>Net Total</label>
              <input className="form-control" value={netTotal} disabled />
            </div>
            <div className="col-md-4">
              <label>Total Quantity</label>
              <input className="form-control" value={totalQuantity} disabled />
            </div>
          </div>

          <div className="row">
            <div className="col-md-12 text-end">
              <button className="btn btn-success" onClick={handleSubmit} disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Closing Entry'}
              </button>
              <button className="btn btn-secondary ms-2" onClick={() => navigate('/frontpage')}>
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