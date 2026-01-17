const express = require('express');
const crypto = require('crypto');
const app = express();

app.use(express.json());

const WEBHOOK_SECRET = 'whsec_test_abc123';

app.post('/webhook', (req, res) => {
    const signature = req.headers['x-webhook-signature'];
    
    // 1. Recreate signature from raw body
    const expectedSignature = crypto
        .createHmac('sha256', WEBHOOK_SECRET)
        .update(JSON.stringify(req.body))
        .digest('hex');

    if (signature === expectedSignature) {
        console.log("✅ Verified Webhook:", req.body.event);
        res.status(200).send("Success");
    } else {
        console.error("❌ Signature Mismatch!");
        res.status(401).send("Invalid Signature");
    }
});

app.listen(4000, () => console.log("Merchant receiving on port 4000"));