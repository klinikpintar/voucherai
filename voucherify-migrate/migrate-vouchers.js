#!/usr/bin/env node
/**
 * migrate-vouchers.js
 * 2025-03-26: Created script to migrate vouchers from CSV file to VoucherAI instance
 * - Reads voucher data from CSV file using built-in modules
 * - Maps CSV data to VoucherAI API format
 * - Posts vouchers to VoucherAI API using native fetch
 * - Handles authentication with API key
 * - Provides progress reporting and error handling
 * - No external dependencies
 */

import fs from 'fs';
import { createReadStream } from 'fs';
import { createInterface } from 'readline';

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    url: null,
    apiKey: null,
    file: './exp_NxhFksqUV97XvZe1rwdfaANc.csv',
    batchSize: '10',
    dryRun: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--url' || arg === '-u') {
      options.url = args[++i];
    } else if (arg === '--api-key' || arg === '-k') {
      options.apiKey = args[++i];
    } else if (arg === '--file' || arg === '-f') {
      options.file = args[++i];
    } else if (arg === '--batch-size' || arg === '-b') {
      options.batchSize = args[++i];
    } else if (arg === '--dry-run' || arg === '-d') {
      options.dryRun = true;
    } else if (arg === '--help' || arg === '-h') {
      showHelp();
      process.exit(0);
    }
  }

  // Validate required options
  if (!options.url) {
    console.error('Error: Missing required option: --url');
    showHelp();
    process.exit(1);
  }

  if (!options.apiKey) {
    console.error('Error: Missing required option: --api-key');
    showHelp();
    process.exit(1);
  }

  return options;
}

function showHelp() {
  console.log(`
Usage: node migrate-vouchers.js [options]

Options:
  -u, --url <url>          VoucherAI instance URL (e.g., http://localhost:3000)
  -k, --api-key <key>      API key for authentication
  -f, --file <file>        CSV file path (default: ./exp_NxhFksqUV97XvZe1rwdfaANc.csv)
  -b, --batch-size <size>  Number of vouchers to process in each batch (default: 10)
  -d, --dry-run            Validate data without making API calls
  -h, --help               Display this help message
`);
}

const options = parseArgs();

// Set up API headers
const apiHeaders = {
  'Authorization': `Bearer ${options.apiKey}`,
  'Content-Type': 'application/json'
};

// Main migration function
async function migrateVouchers() {
  console.log('Starting voucher migration...');
  console.log(`Target API: ${options.url}`);
  console.log(`CSV File: ${options.file}`);
  console.log(`Batch Size: ${options.batchSize}`);
  console.log(`Dry Run: ${options.dryRun ? 'Yes' : 'No'}`);
  console.log('-----------------------------------');

  // Check if file exists
  if (!fs.existsSync(options.file)) {
    console.error(`Error: File not found - ${options.file}`);
    process.exit(1);
  }

  try {
    // Read and parse CSV file
    const records = await parseCSV(options.file);
    console.log(`Found ${records.length} vouchers in CSV file`);

    // Process vouchers in batches
    const batchSize = parseInt(options.batchSize);
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(records.length / batchSize)}`);
      
      const results = await Promise.allSettled(
        batch.map(record => processVoucher(record))
      );
      
      const batchResults = results.reduce((acc, result, index) => {
        if (result.status === 'fulfilled') {
          successCount++;
          acc.success.push({ 
            code: batch[index].Code,
            id: result.value?.id || 'unknown'
          });
        } else {
          failCount++;
          acc.failed.push({ 
            code: batch[index].Code,
            error: result.reason?.message || 'Unknown error'
          });
        }
        return acc;
      }, { success: [], failed: [] });

      console.log(`Batch results: ${batchResults.success.length} successful, ${batchResults.failed.length} failed`);
      
      if (batchResults.failed.length > 0) {
        console.log('Failed vouchers:');
        batchResults.failed.forEach(v => console.log(`- ${v.code}: ${v.error}`));
      }
    }

    console.log('-----------------------------------');
    console.log(`Migration completed: ${successCount} successful, ${failCount} failed`);
    
    // Show curl example if this was a dry run
    if (options.dryRun && records.length > 0) {
      const sampleVoucher = mapVoucherData(records[0]);
      console.log('\nSample curl command to create a voucher:');
      console.log('```');
      console.log(`curl -X POST ${options.url}/api/vouchers \\
  -H 'Content-Type: application/json' \\
  -H 'Authorization: Bearer ${options.apiKey}' \\
  -d '${JSON.stringify(sampleVoucher, null, 2)}'`);
      console.log('```');
    }
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  }
}

// Parse CSV file and return records using built-in modules
async function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    try {
      const records = [];
      const headers = [];
      let headersParsed = false;
      
      const rl = createInterface({
        input: createReadStream(filePath),
        crlfDelay: Infinity
      });
      
      rl.on('line', (line) => {
        // Skip empty lines
        if (line.trim() === '') return;
        
        // Parse CSV line (handle quoted values and commas within quotes)
        const values = parseCSVLine(line);
        
        if (!headersParsed) {
          // First line contains headers
          headers.push(...values);
          headersParsed = true;
        } else {
          // Create record object from values
          const record = {};
          values.forEach((value, index) => {
            if (index < headers.length) {
              record[headers[index]] = value;
            }
          });
          records.push(record);
        }
      });
      
      rl.on('close', () => {
        resolve(records);
      });
      
      rl.on('error', (error) => {
        reject(error);
      });
    } catch (error) {
      reject(error);
    }
  });
}

// Helper function to parse a CSV line with proper handling of quoted values
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      // Handle quotes
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        // Double quotes inside quotes - add a single quote
        current += '"';
        i++;
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current);
      current = '';
    } else {
      // Add character to current field
      current += char;
    }
  }
  
  // Add the last field
  result.push(current);
  return result;
}

// Process a single voucher record
async function processVoucher(record) {
  // Map CSV record to VoucherAI API format
  const voucherData = mapVoucherData(record);
  
  // Validate the voucher data
  validateVoucherData(voucherData);
  
  // If dry run, just log the data
  if (options.dryRun) {
    console.log(`[DRY RUN] Would create voucher: ${voucherData.code}`);
    return { id: 'dry-run', code: voucherData.code };
  }
  
  // Create the voucher via API
  try {
    const response = await fetch(`${options.url}/api/vouchers`, {
      method: 'POST',
      headers: apiHeaders,
      body: JSON.stringify(voucherData)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      const errorMessage = errorData.error || `HTTP error ${response.status}`;
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    console.log(`Created voucher: ${voucherData.code} (ID: ${data.id})`);
    return data;
  } catch (error) {
    console.error(`Failed to create voucher ${voucherData.code}: ${error.message}`);
    throw new Error(error.message);
  }
}

// Map CSV record to VoucherAI API format
function mapVoucherData(record) {
  // Determine discount type and amount
  let discount = {};
  if (record['Discount Type'] === 'PERCENT') {
    discount = {
      type: 'PERCENTAGE',
      percent_off: parseFloat(record.Value)
    };
    
    // Only add amount_limit if it exists and is not null/undefined
    if (record['Discount Amount Limit']) {
      discount.amount_limit = parseFloat(record['Discount Amount Limit']);
    }
  } else {
    discount = {
      type: 'AMOUNT',
      amount_off: parseFloat(record.Value)
    };
  }

  // Format dates properly
  const startDate = new Date(record['Start Date']);
  const expirationDate = new Date(record['Expiration Date']);

  // Create redemption object
  const redemption = {
    redeemed_count: parseInt(record['Redemption Count']) || 0
  };
  
  // Only add quantity if it exists and is not null/undefined
  if (record['Redemption Limit']) {
    redemption.quantity = parseInt(record['Redemption Limit']);
  }

  // Create the base voucher data object
  const voucherData = {
    name: record.Code, // Using code as name if no name is provided
    code: record.Code,
    discount: discount,
    redemption: redemption,
    start_date: startDate.toISOString(),
    expiration_date: expirationDate.toISOString(),
    is_active: record.Active === 'true'
  };
  
  // Only add customer_id if it exists
  if (record['Customer ID']) {
    voucherData.customer_id = record['Customer ID'];
  }
  
  return voucherData;
}

// Validate voucher data before sending to API
function validateVoucherData(voucher) {
  // Required fields
  const requiredFields = ['name', 'code', 'discount', 'redemption', 'start_date', 'expiration_date'];
  for (const field of requiredFields) {
    if (!voucher[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  // Validate discount
  if (!['AMOUNT', 'PERCENTAGE'].includes(voucher.discount.type)) {
    throw new Error(`Invalid discount type: ${voucher.discount.type}`);
  }

  if (voucher.discount.type === 'AMOUNT' && !voucher.discount.amount_off) {
    throw new Error('Missing amount_off for AMOUNT discount type');
  }

  if (voucher.discount.type === 'PERCENTAGE' && !voucher.discount.percent_off) {
    throw new Error('Missing percent_off for PERCENTAGE discount type');
  }

  // Validate dates
  const startDate = new Date(voucher.start_date);
  const expirationDate = new Date(voucher.expiration_date);
  
  if (isNaN(startDate.getTime())) {
    throw new Error(`Invalid start_date: ${voucher.start_date}`);
  }
  
  if (isNaN(expirationDate.getTime())) {
    throw new Error(`Invalid expiration_date: ${voucher.expiration_date}`);
  }
  
  if (startDate > expirationDate) {
    throw new Error('start_date cannot be after expiration_date');
  }
}

// Run the migration
migrateVouchers().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
