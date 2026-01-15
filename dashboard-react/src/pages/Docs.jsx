export default function Docs() {
  return (
    <div data-test-id="api-docs">
      <h2>Integration Guide</h2>

      <pre data-test-id="code-snippet-sdk">
{`<script src="http://localhost:3001/checkout.js"></script>
<script>
const checkout = new PaymentGateway({
  key: 'key_test_abc123',
  orderId: 'order_xyz',
  onSuccess: (res) => console.log(res)
});
checkout.open();
</script>`}
      </pre>
    </div>
  );
}
