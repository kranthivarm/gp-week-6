import React from "react";

export default function CheckoutPage() {
  const success = () => {
    window.parent.postMessage(
      {
        type: "payment_success",
        data: { paymentId: "pay_test_123" }
      },
      "*"
    );
  };

  const failure = () => {
    window.parent.postMessage(
      {
        type: "payment_failed",
        data: { error: "Payment failed" }
      },
      "*"
    );
  };

  return (
    <div style={{ padding: 20 }}>
      <h3>Mock Checkout</h3>
      <button onClick={success}>Pay Success</button>
      <button onClick={failure}>Pay Fail</button>
    </div>
  );
}
