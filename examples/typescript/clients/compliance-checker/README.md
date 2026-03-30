# Compliance Checker

Pay-per-call compliance checks using x402 and [Strale](https://strale.dev).

Demonstrates the `@x402/fetch` payment flow against real compliance endpoints:
- **Sanctions screening** — OFAC, EU, UN, and 120+ sanctions lists ($0.02)
- **IBAN validation** — structure check, checksum, bank identification ($0.01)
- **VAT validation** — EU VIES verification ($0.01)

Each request triggers the standard x402 flow: GET → 402 → sign USDC transfer → retry → 200.

## Setup

```bash
pnpm install
cp .env.example .env
```

Add your EVM private key to `.env`. The signing address needs USDC on Base mainnet.

## Run

```bash
pnpm start
```

Output:

```
x402 Compliance Checker
=======================
Signer: 0x742d...

🔍 Sanctions check: "John Smith"
   Result: ✅ Clean
   Sources checked: 122

🏦 IBAN validation: "DE89370400440532013000"
   Valid: ✅ Yes
   Bank: Commerzbank
   Country: DE

📋 VAT validation: "SE556703748501"
   Valid: ✅ Yes
   Company: Spotify AB

✅ All checks complete.
```

## How it works

1. `@x402/fetch` wraps the native Fetch API
2. First request to `api.strale.io/x402/*` returns HTTP 402 with payment requirements
3. The client signs a USDC transfer on Base (eip155:8453) via the EVM scheme
4. The request is retried with an `X-Payment` header containing the signed payment
5. The Coinbase CDP facilitator verifies and settles the payment
6. Strale executes the compliance check and returns the result

## Available endpoints

Strale exposes 344 capabilities via x402. Browse the full catalog:

```bash
curl https://api.strale.io/x402/catalog
```

Discovery manifest:

```bash
curl https://api.strale.io/.well-known/x402.json
```
