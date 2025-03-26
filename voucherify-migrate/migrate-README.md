# VoucherAI Migration Tool

This tool migrates voucher data from a CSV file to a VoucherAI instance using the VoucherAI API.

## Features

- Reads voucher data from CSV file
- Maps CSV data to VoucherAI API format
- Authenticates with API key
- Processes vouchers in configurable batches
- Provides detailed progress reporting
- Supports dry run mode for validation without API calls


## Usage

Run the script with the required parameters:

```bash
node migrate-vouchers.js --url <voucherai-url> --api-key <your-api-key>
```

### Required Parameters

- `--url, -u`: VoucherAI instance URL (e.g., http://localhost:3000)
- `--api-key, -k`: API key for authentication

### Optional Parameters

- `--file, -f`: Path to CSV file (default: ./exp_NxhFksqUV97XvZe1rwdfaANc.csv)
- `--batch-size, -b`: Number of vouchers to process in each batch (default: 10)
- `--dry-run, -d`: Validate data without making API calls

### Examples

Basic usage:
```bash
node migrate-vouchers.js -u http://localhost:3000 -k your-api-key
```

Specify custom CSV file:
```bash
node migrate-vouchers.js -u http://localhost:3000 -k your-api-key -f ./your-vouchers.csv
```

Dry run to validate without creating vouchers:
```bash
node migrate-vouchers.js -u http://localhost:3000 -k your-api-key --dry-run
```

Process in larger batches:
```bash
node migrate-vouchers.js -u http://localhost:3000 -k your-api-key -b 20
```

## CSV Format

The script expects a CSV file with the following columns:
- Code
- Value
- Discount Type (AMOUNT or PERCENT)
- Redemption Limit
- Redemption Count
- Start Date
- Expiration Date
- Active
- Customer ID (optional)
- Discount Amount Limit (for percentage discounts)

## Error Handling

The script provides detailed error reporting for:
- Missing or invalid CSV file
- API connection issues
- Invalid voucher data
- API errors during voucher creation
