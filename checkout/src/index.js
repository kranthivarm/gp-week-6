import React from "react";
import { createRoot } from "react-dom/client";
import PaymentGateway from "./sdk/PaymentGateway";

/**
 * This file exists mainly for local testing & bundling.
 * The actual exported SDK is PaymentGateway (UMD).
 */

const container = document.getElementById("root");

if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <div>
        <h3>Checkout SDK Loaded</h3>
        <button
          onClick={() => {
            const checkout = new PaymentGateway({
              key: "key_test_123",
              orderId: "order_test_456",
              onSuccess: (res) => alert("SUCCESS: " + res.paymentId),
              onFailure: (err) => alert("FAILED"),
              onClose: () => alert("CLOSED")
            });

            checkout.open();
          }}
        >
          Open Checkout
        </button>
      </div>
    </React.StrictMode>
  );
}

export default PaymentGateway;
