import React from "react";

export default function Modal({ orderId, onClose }) {
  return (
    <div
      id="payment-gateway-modal"
      data-test-id="payment-modal"
      className="modal-overlay"
    >
      <div className="modal-content">
        <iframe
          data-test-id="payment-iframe"
          src={`http://localhost:3001/checkout?order_id=${orderId}&embedded=true`}
          title="Payment Checkout"
        />
        <button
          data-test-id="close-modal-button"
          className="close-button"
          onClick={() =>
            window.parent.postMessage({ type: "close_modal" }, "*")
          }
        >
          ×
        </button>
      </div>
    </div>
  );
}
