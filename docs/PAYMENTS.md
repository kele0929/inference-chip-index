# Payment guide

The Lucid runtime always loads `@lucid-agents/payments` through `paymentsFromEnv()`. Free entrypoints boot with no payment variables.

## Free

- `get-dataset-status`
- `preview-inference-chips`

## Paid (fail closed)

- `rank-inference-chips` advertised price `$0.02`
- `compare-inference-chips` advertised price `$0.03`

If `PAYMENTS_FACILITATOR_URL`, `PAYMENTS_NETWORK`, and `PAYMENTS_RECEIVABLE_ADDRESS` are absent or incomplete, priced invokes must not return ranking JSON. Expect HTTP 402 or 503. They never silently become free.

## Base Sepolia

```dotenv
PAYMENTS_FACILITATOR_URL=https://x402.org/facilitator
PAYMENTS_NETWORK=eip155:84532
PAYMENTS_DESTINATION=static
PAYMENTS_RECEIVABLE_ADDRESS=0xYOUR_EVM_ADDRESS
```

`eip155:84532` is Base Sepolia. The x402.org facilitator is testnet-only.

Flow:

1. Discover `/api/agent/.well-known/agent-card.json` and `/api/agent/entrypoints`
2. POST a priced invoke
3. Read `PAYMENT-REQUIRED`
4. Complete the exact x402 payment
5. Retry the invoke with the payment proof
