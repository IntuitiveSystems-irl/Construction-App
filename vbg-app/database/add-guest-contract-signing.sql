-- Add guest contract signing fields to contracts table
-- This allows contracts to be sent to anyone via email without requiring an account

ALTER TABLE contracts ADD COLUMN guest_token TEXT UNIQUE;
ALTER TABLE contracts ADD COLUMN guest_email TEXT;
ALTER TABLE contracts ADD COLUMN guest_name TEXT;
ALTER TABLE contracts ADD COLUMN token_expires_at DATETIME;
ALTER TABLE contracts ADD COLUMN guest_signed_at DATETIME;

-- Create index for fast token lookups
CREATE INDEX IF NOT EXISTS idx_contracts_guest_token ON contracts(guest_token);
CREATE INDEX IF NOT EXISTS idx_contracts_guest_email ON contracts(guest_email);

-- Add comments for documentation
-- guest_token: Unique cryptographic token for guest access (UUID)
-- guest_email: Email address of the guest signer
-- guest_name: Name of the guest signer
-- token_expires_at: Expiration timestamp for the guest token (default 30 days)
-- guest_signed_at: Timestamp when guest signed the contract
