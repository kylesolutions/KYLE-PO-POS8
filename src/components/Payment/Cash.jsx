import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import './cash.css';

function Cash() {
    const location = useLocation();
    const navigate = useNavigate();
    const [billDetails, setBillDetails] = useState(null);
    const [cashGiven, setCashGiven] = useState(""); // Optional field
    const [change, setChange] = useState(0);
    const [taxRate, setTaxRate] = useState(null);
    const [taxCategory, setTaxCategory] = useState(""); // New state for tax category
    const [taxTemplateName, setTaxTemplateName] = useState("");
    const [company, setCompany] = useState(""); // Default company, can be dynamic if passed via state

    useEffect(() => {
        if (location.state?.billDetails) {
            setBillDetails(location.state.billDetails);
            console.log("Bill Details in Cash.jsx:", location.state.billDetails); // Debug log
        } else {
            console.warn("No billDetails received in Cash.jsx");
        }

        // Fetch tax details when component mounts
        fetchTaxDetails();
    }, [location]);

    const fetchTaxDetails = async () => {
        try {
            const companyResponse = await fetch('/api/method/frappe.client.get_value', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: 'token 0bde704e8493354:5709b3ab1a1cb1a',
                },
                body: JSON.stringify({
                    doctype: "Company",
                    name: company,
                    fieldname: ["default_income_account", "custom_tax_type"]
                }),
            });
            const companyData = await companyResponse.json();
            if (companyData.message) {
                const taxTemplate = companyData.message.custom_tax_type;
                setTaxTemplateName(taxTemplate || "");
                fetchTaxRate(taxTemplate);
            } else {
                fetchTaxRate(null);
            }
        } catch (error) {
            console.error("Error fetching company details in Cash.jsx:", error);
            fetchTaxRate(null);
        }
    };

    const fetchTaxRate = async (templateName) => {
        try {
            const response = await fetch('/api/method/kylepos8.kylepos8.kyle_api.Kyle_items.get_sales_taxes_details', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: 'token 0bde704e8493354:5709b3ab1a1cb1a',
                },
            });
            const data = await response.json();
            if (data.message && Array.isArray(data.message)) {
                if (templateName) {
                    const tax = data.message.find(t => t.name === templateName);
                    if (tax && tax.sales_tax && tax.sales_tax.length > 0) {
                        const rate = parseFloat(tax.sales_tax[0].rate) || 0;
                        setTaxRate(rate);
                        setTaxCategory(tax.tax_category || "Unknown"); // Set tax_category
                        setTaxTemplateName(templateName);
                    } else {
                        console.warn(`No tax rate or category found for ${templateName}. Using first available template.`);
                    }
                }
                if (!templateName || !data.message.some(t => t.name === templateName)) {
                    const defaultTax = data.message[0];
                    if (defaultTax && defaultTax.sales_tax && defaultTax.sales_tax.length > 0) {
                        const rate = parseFloat(defaultTax.sales_tax[0].rate) || 0;
                        setTaxRate(rate);
                        setTaxCategory(defaultTax.tax_category || "Unknown"); // Set tax_category for default
                        setTaxTemplateName(defaultTax.name);
                    } else {
                        setTaxRate(0);
                        setTaxCategory("N/A");
                        setTaxTemplateName("");
                    }
                }
            } else {
                setTaxRate(0);
                setTaxCategory("N/A");
                setTaxTemplateName("");
            }
        } catch (error) {
            console.error("Error fetching tax rate in Cash.jsx:", error);
            setTaxRate(0);
            setTaxCategory("N/A");
            setTaxTemplateName("");
        }
    };

    const handleCashChange = (e) => {
        const givenAmount = parseFloat(e.target.value) || 0;
        setCashGiven(e.target.value);

        if (billDetails) {
            const totalAmount = parseFloat(billDetails.grand_total) || 0;
            setChange(givenAmount - totalAmount);
        }
    };

    const handleConfirmPayment = () => {
        if (!billDetails) {
            alert("No bill details available.");
            return;
        }

        const grandTotal = parseFloat(billDetails.grand_total) || 0;
        const cash = cashGiven ? parseFloat(cashGiven) || 0 : grandTotal;

        if (cashGiven && cash < grandTotal) {
            alert("Cash given is less than the grand total!");
            return;
        }

        const calculatedChange = cashGiven ? (cash - grandTotal) : 0;
        alert("Payment confirmed!");
        navigate("/frontpage");
    };

    // Calculate tax amount based on fetched tax rate and subtotal
    const getSubTotal = () => parseFloat(billDetails?.total) || 0;
    const getTaxAmount = () => {
        const subTotal = getSubTotal();
        const rate = taxRate !== null ? parseFloat(taxRate) : 0;
        return subTotal > 0 && rate > 0 ? (subTotal * rate) / 100 : (parseFloat(billDetails?.grand_total) - subTotal) || 0;
    };
    const getGrandTotal = () => getSubTotal() + getTaxAmount();

    return (
        <div className="cash-container">
  <i
    className="bi bi-arrow-left-circle-fill back-button"
    onClick={() => navigate("/frontpage")}
    title="Back to Frontpage"
  ></i>
  <div className="container mt-4">
    <div className="row justify-content-center">
      <div className="col-lg-7 col-md-9 col-sm-11">
        <div className="card shadow-xl border-0 rounded-4">
          <div className="card-header bg-gradient-primary text-white text-center py-4">
            <h3 className="mb-0 font-dubai-medium">Cash Payment</h3>
          </div>
          <div className="card-body p-4">
            {billDetails ? (
              <div>
                <div className="customer-info mb-4">
                  <h5 className="fw-bold font-dubai-medium">
                    Customer: <span className="text-primary">{billDetails.customer || "N/A"}</span>
                  </h5>
                  <p className="mb-1"><strong>Phone:</strong> {billDetails.contact_mobile || "N/A"}</p>
                  {billDetails.custom_table_number && (
                    <p className="mb-1"><strong>Table No:</strong> {billDetails.custom_table_number}</p>
                  )}
                  {billDetails.custom_delivery_type && billDetails.custom_delivery_type !== "DINE IN" && (
                    <>
                      <p className="mb-1"><strong>Delivery Type:</strong> {billDetails.custom_delivery_type}</p>
                      <p className="mb-1"><strong>Address:</strong> {billDetails.customer_address || "N/A"}</p>
                    </>
                  )}
                </div>

                <h6 className="fw-bold mb-3 font-dubai-medium">Items Ordered:</h6>
                <div className="items-list mb-4">
                  {billDetails.items && billDetails.items.length > 0 ? (
                    billDetails.items.map((item, index) => (
                      <div key={index} className="item-card p-3 mb-3 rounded-lg shadow-sm">
                        <div className="d-flex justify-content-between align-items-center">
                          <strong className="font-dubai-medium">{item.item_name || "Unnamed Item"}</strong>
                          <small className="text-muted">
                          ₹{(parseFloat(item.rate) || 0).toFixed(2)} x {item.qty || 1}
                        </small>
                          <span className="text-primary">₹{(parseFloat(item.amount) || (parseFloat(item.rate) * item.qty)).toFixed(2)}</span>
                        </div>
                        
                        {(item.custom_size_variants || item.custom_other_variants) && (
                          <ul className="addon-list mt-2">
                            {item.custom_size_variants && <li>Size: {item.custom_size_variants}</li>}
                            {item.custom_other_variants && <li>Variant: {item.custom_other_variants}</li>}
                          </ul>
                        )}
                        <div className="item-total mt-2 fw-bold text-success text-end">
                          Total: ₹{(parseFloat(item.amount) || (parseFloat(item.rate) * item.qty) || 0).toFixed(2)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted">No items available for this invoice.</p>
                  )}
                </div>

                <div className="totals-section mb-4 p-4 bg-light rounded-lg">
                  <div className="row gy-2">
                    <div className="col-6 text-start fw-semibold">Subtotal:</div>
                    <div className="col-6 text-end">₹{getSubTotal().toFixed(2)}</div>
                    <div className="col-6 text-start fw-semibold">
                      {taxCategory} ({taxRate !== null ? `${taxRate}%` : "N/A"}):
                    </div>
                    <div className="col-6 text-end">₹{getTaxAmount().toFixed(2)}</div>
                    <div className="col-6 text-start fw-bold font-dubai-medium">Grand Total:</div>
                    <div className="col-6 text-end fw-bold">₹{getGrandTotal().toFixed(2)}</div>
                  </div>
                </div>

                <div className="payment-section">
                  <div className="mb-4">
                    <label className="form-label fw-bold font-dubai-medium">Cash Given by Customer (Optional):</label>
                    <input
                      type="number"
                      className="form-control form-control-lg"
                      placeholder="Enter amount (₹)"
                      value={cashGiven}
                      onChange={handleCashChange}
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="form-label fw-bold font-dubai-medium">Return Change:</label>
                    <h5 className={`fw-bold ${change >= 0 ? 'text-success' : 'text-danger'}`}>
                      ₹ {change.toFixed(2)}
                    </h5>
                  </div>

                  <button
                    className="btn btn-success btn-lg w-100 py-3"
                    onClick={handleConfirmPayment}
                  >
                    Confirm Payment
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-5">
                <i className="bi bi-exclamation-circle text-warning fs-1"></i>
                <p className="mt-3 text-muted">No bill details available.</p>
                <button className="btn btn-outline-primary" onClick={() => navigate("/frontpage")}>
                  Back to Frontpage
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
    );
}

export default Cash;