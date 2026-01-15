import React from "react";
import { createRoot } from "react-dom/client";
import Modal from "./Modal";
import "./styles.css";

class PaymentGateway {
  constructor(options) {
    if (!options.key || !options.orderId) {
      throw new Error("key and orderId are required");
    }

    this.options = options;
    this.container = document.createElement("div");
    document.body.appendChild(this.container);

    this.handleMessage = this.handleMessage.bind(this);
  }

  open() {
    this.root = createRoot(this.container);
    this.root.render(
      <Modal
        orderId={this.options.orderId}
        onClose={() => this.close()}
      />
    );

    window.addEventListener("message", this.handleMessage);
  }

  close() {
    if (this.root) this.root.unmount();
    this.container.remove();
    window.removeEventListener("message", this.handleMessage);

    if (this.options.onClose) this.options.onClose();
  }

  handleMessage(event) {
    const { type, data } = event.data || {};

    if (type === "payment_success") {
      this.options.onSuccess?.(data);
      this.close();
    }

    if (type === "payment_failed") {
      this.options.onFailure?.(data);
    }

    if (type === "close_modal") {
      this.close();
    }
  }
}

window.PaymentGateway = PaymentGateway;
export default PaymentGateway;
