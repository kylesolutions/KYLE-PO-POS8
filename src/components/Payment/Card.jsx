import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import './card.css';

function Card() {
    const [transactionNumber, setTransactionNumber] = useState("");
    const [errors, setErrors] = useState({});
    const [billDetails, setBillDetails] = useState(null);
    const [taxRate, setTaxRate] = useState(null);
    const [taxCategory, setTaxCategory] = useState(""); // New state for tax category
    const [taxTemplateName, setTaxTemplateName] = useState("");
    const [company, setCompany] = useState(""); // Default company, can be dynamic if passed via state
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (location.state?.billDetails) {
            setBillDetails(location.state.billDetails);
            console.log("Bill Details in Card.jsx:", location.state.billDetails); // Debug log
        } else {
            console.warn("No billDetails received in Card.jsx");
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
            console.error("Error fetching company details in Card.jsx:", error);
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
                        setTaxCategory(tax.tax_category || "Unknown");
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
                        setTaxCategory(defaultTax.tax_category || "Unknown");
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
            console.error("Error fetching tax rate in Card.jsx:", error);
            setTaxRate(0);
            setTaxCategory("N/A");
            setTaxTemplateName("");
        }
    };

    const validateFields = () => {
        let newErrors = {};

        if (!transactionNumber || !/^[a-zA-Z0-9]{6,20}$/.test(transactionNumber)) {
            newErrors.transactionNumber = "Enter a valid transaction number (6-20 characters).";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleCardSubmit = (e) => {
        e.preventDefault();
        if (!validateFields()) return;

        if (!billDetails) {
            alert("No bill details available to process payment.");
            return;
        }

        alert(`Card Payment Confirmed! Transaction Number: ${transactionNumber} | Amount: AED ${(parseFloat(billDetails.grand_total) || 0).toFixed(2)}`);
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
        <div className="card-container">
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
            <h3 className="mb-0 font-dubai-medium">Card Payment</h3>
          </div>
          <div className="card-body p-4">
            {billDetails ? (
              <div className="mb-4">
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
                          <div className="text-end">
                            <small className="text-muted d-block">
                              AED {(parseFloat(item.rate) || 0).toFixed(2)} x {item.qty || 1}
                            </small>
                            <span className="text-primary">AED {(parseFloat(item.amount) || (parseFloat(item.rate) * item.qty)).toFixed(2)}</span>
                          </div>
                        </div>
                        {(item.custom_size_variants || item.custom_other_variants) && (
                          <ul className="addon-list mt-2">
                            {item.custom_size_variants && <li>Size: {item.custom_size_variants}</li>}
                            {item.custom_other_variants && <li>Variant: {item.custom_other_variants}</li>}
                          </ul>
                        )}
                        <div className="item-total mt-2 fw-bold text-success text-end">
                          Total: AED {(parseFloat(item.amount) || (parseFloat(item.rate) * item.qty) || 0).toFixed(2)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted">No items available for this invoice.</p>
                  )}
                </div>

                <div className="totals-section p-4 bg-light rounded-lg">
                  <div className="row gy-2">
                    <div className="col-6 text-start fw-semibold">Subtotal:</div>
                    <div className="col-6 text-end">AED {getSubTotal().toFixed(2)}</div>
                    <div className="col-6 text-start fw-semibold">
                      {taxCategory} ({taxRate !== null ? `${taxRate}%` : "N/A"}):
                    </div>
                    <div className="col-6 text-end">AED {getTaxAmount().toFixed(2)}</div>
                    <div className="col-6 text-start fw-bold font-dubai-medium">Grand Total:</div>
                    <div className="col-6 text-end fw-bold">AED {getGrandTotal().toFixed(2)}</div>
                  </div>
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

            <form onSubmit={handleCardSubmit}>
              <div className="mb-4">
                <label htmlFor="transactionNumber" className="form-label fw-bold font-dubai-medium">
                  Transaction Number
                </label>
                <input
                  type="text"
                  id="transactionNumber"
                  className={`form-control form-control-lg ${errors.transactionNumber ? "is-invalid" : ""}`}
                  placeholder="Swipe card or enter transaction number"
                  value={transactionNumber}
                  onChange={(e) => setTransactionNumber(e.target.value)}
                  maxLength="20"
                  required
                />
                {errors.transactionNumber && (
                  <div className="invalid-feedback">{errors.transactionNumber}</div>
                )}
              </div>

              <div className="text-center">
                <button type="submit" className="btn btn-success btn-lg w-100 py-3">
                  Confirm Card Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
    );
}

export default Card;