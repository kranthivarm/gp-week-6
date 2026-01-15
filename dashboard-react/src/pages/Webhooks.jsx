import React, { useEffect, useState } from "react";

export default function Webhooks() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    fetch("/api/v1/webhooks")
      .then(res => res.json())
      .then(data => setLogs(data.data));
  }, []);

  return (
    <div data-test-id="webhook-config">
      <h2>Webhook Configuration</h2>

      <form data-test-id="webhook-config-form">
        <input
          data-test-id="webhook-url-input"
          placeholder="https://yoursite.com/webhook"
        />
        <span data-test-id="webhook-secret">
          whsec_test_abc123
        </span>
        <button data-test-id="save-webhook-button">
          Save
        </button>
      </form>

      <table data-test-id="webhook-logs-table">
        <tbody>
          {logs.map(log => (
            <tr
              key={log.id}
              data-test-id="webhook-log-item"
            >
              <td data-test-id="webhook-event">{log.event}</td>
              <td data-test-id="webhook-status">{log.status}</td>
              <td data-test-id="webhook-attempts">{log.attempts}</td>
              <td data-test-id="webhook-response-code">
                {log.response_code}
              </td>
              <td>
                <button
                  data-test-id="retry-webhook-button"
                >
                  Retry
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
