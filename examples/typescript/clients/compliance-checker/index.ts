/**
 * x402 Compliance Checker — pay-per-call sanctions, IBAN, and VAT checks via Strale.
 *
 * Demonstrates using @x402/fetch to access compliance APIs that require payment.
 * Each check costs $0.01–0.02 USDC on Base. No API key needed — payment is the auth.
 *
 * Endpoints used:
 *   GET https://api.strale.io/x402/sanctions-check?name=...
 *   GET https://api.strale.io/x402/iban-validate?iban=...
 *   GET https://api.strale.io/x402/vat-validate?vat_number=...
 */

import { config } from "dotenv";
import { x402Client, wrapFetchWithPayment } from "@x402/fetch";
import { ExactEvmScheme } from "@x402/evm/exact/client";
import { privateKeyToAccount } from "viem/accounts";

config();

const STRALE_BASE = "https://api.strale.io/x402";
const evmPrivateKey = process.env.EVM_PRIVATE_KEY as `0x${string}`;

if (!evmPrivateKey) {
  console.error("Error: EVM_PRIVATE_KEY is required. Set it in .env");
  process.exit(1);
}

// Set up x402 client with EVM signer
const signer = privateKeyToAccount(evmPrivateKey);
const client = new x402Client();
client.register("eip155:*", new ExactEvmScheme(signer));
const fetchWithPayment = wrapFetchWithPayment(fetch, client);

// ─── Compliance checks ──────────────────────────────────────────────────────

async function checkSanctions(name: string): Promise<void> {
  console.log(`\n🔍 Sanctions check: "${name}"`);
  const url = `${STRALE_BASE}/sanctions-check?name=${encodeURIComponent(name)}`;
  const response = await fetchWithPayment(url);
  const data = await response.json();
  console.log(`   Result: ${data.is_sanctioned ? "⚠️  MATCH FOUND" : "✅ Clean"}`);
  if (data.risk_labels?.length > 0) {
    console.log(`   Labels: ${data.risk_labels.join(", ")}`);
  }
  console.log(`   Sources checked: ${data.lists_checked?.length ?? "N/A"}`);
}

async function checkIBAN(iban: string): Promise<void> {
  console.log(`\n🏦 IBAN validation: "${iban}"`);
  const url = `${STRALE_BASE}/iban-validate?iban=${encodeURIComponent(iban)}`;
  const response = await fetchWithPayment(url);
  const data = await response.json();
  console.log(`   Valid: ${data.valid ? "✅ Yes" : "❌ No"}`);
  if (data.bank_name) console.log(`   Bank: ${data.bank_name}`);
  if (data.country) console.log(`   Country: ${data.country}`);
  if (data.bic) console.log(`   BIC: ${data.bic}`);
}

async function checkVAT(vatNumber: string): Promise<void> {
  console.log(`\n📋 VAT validation: "${vatNumber}"`);
  const url = `${STRALE_BASE}/vat-validate?vat_number=${encodeURIComponent(vatNumber)}`;
  const response = await fetchWithPayment(url);
  const data = await response.json();
  console.log(`   Valid: ${data.valid ? "✅ Yes" : "❌ No"}`);
  if (data.company_name) console.log(`   Company: ${data.company_name}`);
  if (data.company_address) console.log(`   Address: ${data.company_address}`);
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log("x402 Compliance Checker");
  console.log("=======================");
  console.log(`Signer: ${signer.address}`);
  console.log(`Target: ${STRALE_BASE}`);

  // Run checks — each triggers a 402 → pay → result flow
  await checkSanctions("John Smith");
  await checkIBAN("DE89370400440532013000");
  await checkVAT("SE556703748501");

  console.log("\n✅ All checks complete.");
}

main().catch(error => {
  console.error(error?.response?.data?.error ?? error);
  process.exit(1);
});
