-- -- Create merchants table
-- CREATE TABLE IF NOT EXISTS merchants (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     email VARCHAR(255) UNIQUE NOT NULL,
--     api_key VARCHAR(64) UNIQUE NOT NULL,
--     api_secret VARCHAR(64) NOT NULL,
--     webhook_url TEXT,
--     webhook_secret VARCHAR(64),
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- -- Create orders table
-- CREATE TABLE IF NOT EXISTS orders (
--     id VARCHAR(64) PRIMARY KEY,
--     merchant_id UUID NOT NULL REFERENCES merchants(id),
--     amount INTEGER NOT NULL,
--     currency VARCHAR(3) NOT NULL DEFAULT 'INR',
--     receipt VARCHAR(255),
--     status VARCHAR(20) NOT NULL DEFAULT 'created',
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     CONSTRAINT orders_merchant_fk FOREIGN KEY (merchant_id) REFERENCES merchants(id)
-- );

-- -- Create payments table
-- CREATE TABLE IF NOT EXISTS payments (
--     id VARCHAR(64) PRIMARY KEY,
--     order_id VARCHAR(64) NOT NULL REFERENCES orders(id),
--     merchant_id UUID NOT NULL REFERENCES merchants(id),
--     amount INTEGER NOT NULL,
--     currency VARCHAR(3) NOT NULL DEFAULT 'INR',
--     method VARCHAR(20) NOT NULL,
--     vpa VARCHAR(255),
--     card_number VARCHAR(20),
--     card_expiry VARCHAR(7),
--     card_cvv VARCHAR(4),
--     status VARCHAR(20) NOT NULL DEFAULT 'pending',
--     captured BOOLEAN DEFAULT FALSE,
--     error_code VARCHAR(50),
--     error_description TEXT,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     CONSTRAINT payments_order_fk FOREIGN KEY (order_id) REFERENCES orders(id),
--     CONSTRAINT payments_merchant_fk FOREIGN KEY (merchant_id) REFERENCES merchants(id)
-- );

-- -- Create refunds table
-- CREATE TABLE IF NOT EXISTS refunds (
--     id VARCHAR(64) PRIMARY KEY,
--     payment_id VARCHAR(64) NOT NULL REFERENCES payments(id),
--     merchant_id UUID NOT NULL REFERENCES merchants(id),
--     amount INTEGER NOT NULL,
--     reason TEXT,
--     status VARCHAR(20) NOT NULL DEFAULT 'pending',
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     processed_at TIMESTAMP,
--     CONSTRAINT refunds_payment_fk FOREIGN KEY (payment_id) REFERENCES payments(id),
--     CONSTRAINT refunds_merchant_fk FOREIGN KEY (merchant_id) REFERENCES merchants(id)
-- );

-- -- Create webhook_logs table
-- CREATE TABLE IF NOT EXISTS webhook_logs (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     merchant_id UUID NOT NULL REFERENCES merchants(id),
--     event VARCHAR(50) NOT NULL,
--     payload JSONB NOT NULL,
--     status VARCHAR(20) NOT NULL DEFAULT 'pending',
--     attempts INTEGER DEFAULT 0,
--     last_attempt_at TIMESTAMP,
--     next_retry_at TIMESTAMP,
--     response_code INTEGER,
--     response_body TEXT,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     CONSTRAINT webhook_logs_merchant_fk FOREIGN KEY (merchant_id) REFERENCES merchants(id)
-- );

-- -- Create idempotency_keys table
-- CREATE TABLE IF NOT EXISTS idempotency_keys (
--     key VARCHAR(255) NOT NULL,
--     merchant_id UUID NOT NULL REFERENCES merchants(id),
--     response JSONB NOT NULL,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     expires_at TIMESTAMP NOT NULL,
--     PRIMARY KEY (key, merchant_id),
--     CONSTRAINT idempotency_keys_merchant_fk FOREIGN KEY (merchant_id) REFERENCES merchants(id)
-- );

-- -- Create indexes
-- CREATE INDEX IF NOT EXISTS idx_refunds_payment_id ON refunds(payment_id);
-- CREATE INDEX IF NOT EXISTS idx_webhook_logs_merchant_id ON webhook_logs(merchant_id);
-- CREATE INDEX IF NOT EXISTS idx_webhook_logs_status ON webhook_logs(status);
-- CREATE INDEX IF NOT EXISTS idx_webhook_logs_next_retry ON webhook_logs(next_retry_at) WHERE status = 'pending';
-- CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
-- CREATE INDEX IF NOT EXISTS idx_orders_merchant_id ON orders(merchant_id);

-- -- Insert test merchant
-- INSERT INTO merchants (email, api_key, api_secret, webhook_url, webhook_secret)
-- VALUES (
--     'test@example.com',
--     'key_test_abc123',
--     'secret_test_xyz789',
--     'http://host.docker.internal:4000/webhook',
--     'whsec_test_abc123'
-- )
-- ON CONFLICT (email) DO NOTHING;


-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create merchants table
CREATE TABLE IF NOT EXISTS merchants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    api_key VARCHAR(64) UNIQUE NOT NULL,
    api_secret VARCHAR(64) NOT NULL,
    webhook_url TEXT,
    webhook_secret VARCHAR(64),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(64) PRIMARY KEY,
    merchant_id UUID NOT NULL REFERENCES merchants(id),
    amount INTEGER NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    receipt VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'created',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
    id VARCHAR(64) PRIMARY KEY,
    order_id VARCHAR(64) NOT NULL REFERENCES orders(id),
    merchant_id UUID NOT NULL REFERENCES merchants(id),
    amount INTEGER NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    method VARCHAR(20) NOT NULL,
    vpa VARCHAR(255),
    card_number VARCHAR(20),
    card_expiry VARCHAR(7),
    card_cvv VARCHAR(4),
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    captured BOOLEAN DEFAULT FALSE,
    error_code VARCHAR(50),
    error_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create refunds table
CREATE TABLE IF NOT EXISTS refunds (
    id VARCHAR(64) PRIMARY KEY,
    payment_id VARCHAR(64) NOT NULL REFERENCES payments(id),
    merchant_id UUID NOT NULL REFERENCES merchants(id),
    amount INTEGER NOT NULL,
    reason TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP
);

-- Create webhook_logs table
CREATE TABLE IF NOT EXISTS webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id),
    event VARCHAR(50) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    attempts INTEGER DEFAULT 0,
    last_attempt_at TIMESTAMP,
    next_retry_at TIMESTAMP,
    response_code INTEGER,
    response_body TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create idempotency_keys table
CREATE TABLE IF NOT EXISTS idempotency_keys (
    key VARCHAR(255) NOT NULL,
    merchant_id UUID NOT NULL REFERENCES merchants(id),
    response JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    PRIMARY KEY (key, merchant_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_refunds_payment_id ON refunds(payment_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_merchant_id ON webhook_logs(merchant_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_status ON webhook_logs(status);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_next_retry ON webhook_logs(next_retry_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_merchant_id ON orders(merchant_id);

-- Seed test merchant
INSERT INTO merchants (email, api_key, api_secret, webhook_url, webhook_secret)
VALUES (
    'test@example.com',
    'key_test_abc123',
    'secret_test_xyz789',
    'http://host.docker.internal:4000/webhook',
    'whsec_test_abc123'
)
ON CONFLICT (email) DO NOTHING;
