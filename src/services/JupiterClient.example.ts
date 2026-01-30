/**
 * JupiterClient Usage Examples
 * 
 * This file demonstrates various ways to use the JupiterClient
 * for getting quotes and executing swaps on Solana.
 */

import { Connection, VersionedTransaction, Keypair } from '@solana/web3.js';
import { createJupiterClient } from './JupiterClient';
import type { QuoteParams, SwapParams } from '../types/jupiter';

// Common token addresses on Solana
const TOKENS = {
  SOL: 'So11111111111111111111111111111111111111112',
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  RAY: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
  BONK: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
};

// Example 1: Basic Quote Request
async function example1_BasicQuote() {
  console.log('\n=== Example 1: Basic Quote Request ===\n');

  const connection = new Connection('https://api.mainnet-beta.solana.com');
  const jupiterClient = createJupiterClient(connection);

  const quoteParams: QuoteParams = {
    inputMint: TOKENS.SOL,
    outputMint: TOKENS.USDC,
    amount: 1_000_000_000, // 1 SOL
    slippageBps: 50, // 0.5% slippage
  };

  try {
    const quote = await jupiterClient.getQuote(quoteParams);

    console.log('Quote Details:');
    console.log('- Input Amount:', parseInt(quote.inAmount) / 1e9, 'SOL');
    console.log('- Output Amount:', parseInt(quote.outAmount) / 1e6, 'USDC');
    console.log('- Price Impact:', quote.priceImpactPct + '%');
    console.log('- Slippage:', quote.slippageBps / 100 + '%');

    const minReceived = jupiterClient.calculateMinimumReceived(quote);
    console.log('- Minimum Received:', minReceived / 1e6, 'USDC');

    const route = jupiterClient.getRouteSummary(quote);
    console.log('- Route:', route.join(' → '));
  } catch (error) {
    console.error('Failed to get quote:', error);
  }
}

// Example 2: Quote with Direct Routes Only
async function example2_DirectRoutesOnly() {
  console.log('\n=== Example 2: Direct Routes Only ===\n');

  const connection = new Connection('https://api.mainnet-beta.solana.com');
  const jupiterClient = createJupiterClient(connection);

  const quoteParams: QuoteParams = {
    inputMint: TOKENS.SOL,
    outputMint: TOKENS.USDC,
    amount: 500_000_000, // 0.5 SOL
    slippageBps: 100, // 1% slippage
    onlyDirectRoutes: true, // Only direct swaps, no intermediate tokens
  };

  try {
    const quote = await jupiterClient.getQuote(quoteParams);

    console.log('Direct Route Quote:');
    console.log('- Output Amount:', parseInt(quote.outAmount) / 1e6, 'USDC');
    console.log('- Route Steps:', quote.routePlan.length);
    console.log('- DEXes Used:', jupiterClient.getRouteSummary(quote));
  } catch (error) {
    console.error('Failed to get direct route quote:', error);
  }
}

// Example 3: Comparing Multiple Slippage Tolerances
async function example3_CompareSlippage() {
  console.log('\n=== Example 3: Compare Slippage Tolerances ===\n');

  const connection = new Connection('https://api.mainnet-beta.solana.com');
  const jupiterClient = createJupiterClient(connection);

  const slippageOptions = [50, 100, 200]; // 0.5%, 1%, 2%

  for (const slippageBps of slippageOptions) {
    try {
      const quote = await jupiterClient.getQuote({
        inputMint: TOKENS.SOL,
        outputMint: TOKENS.USDC,
        amount: 1_000_000_000,
        slippageBps,
      });

      const minReceived = jupiterClient.calculateMinimumReceived(quote);

      console.log(`Slippage ${slippageBps / 100}%:`);
      console.log('  - Expected Output:', parseInt(quote.outAmount) / 1e6, 'USDC');
      console.log('  - Minimum Received:', minReceived / 1e6, 'USDC');
      console.log('  - Difference:', (parseInt(quote.outAmount) - minReceived) / 1e6, 'USDC');
      console.log('');
    } catch (error) {
      console.error(`Failed for ${slippageBps}bps:`, error);
    }
  }
}

// Example 4: Execute Swap (Mock Wallet)
async function example4_ExecuteSwap() {
  console.log('\n=== Example 4: Execute Swap (Mock) ===\n');

  const connection = new Connection('https://api.mainnet-beta.solana.com');
  const jupiterClient = createJupiterClient(connection);

  // Step 1: Get quote
  const quote = await jupiterClient.getQuote({
    inputMint: TOKENS.SOL,
    outputMint: TOKENS.USDC,
    amount: 100_000_000, // 0.1 SOL
    slippageBps: 50,
  });

  console.log('Quote obtained:');
  console.log('- Expected Output:', parseInt(quote.outAmount) / 1e6, 'USDC');
  console.log('- Price Impact:', quote.priceImpactPct + '%');

  // Step 2: Check price impact
  const priceImpact = jupiterClient.calculatePriceImpact(quote);
  if (priceImpact > 1.0) {
    console.warn('⚠️  High price impact detected:', priceImpact + '%');
    console.log('Consider reducing swap amount or increasing slippage');
    return;
  }

  // Step 3: Prepare swap parameters
  const mockWallet = Keypair.generate();
  const swapParams: SwapParams = {
    quoteResponse: quote,
    userPublicKey: mockWallet.publicKey.toString(),
    wrapAndUnwrapSol: true,
    dynamicComputeUnitLimit: true,
  };

  // Mock sign transaction function
  const mockSignTransaction = async (tx: VersionedTransaction) => {
    console.log('📝 Signing transaction...');
    // In real usage, this would be: await wallet.signTransaction(tx)
    return tx;
  };

  try {
    console.log('🔄 Executing swap...');
    const result = await jupiterClient.executeSwap(swapParams, mockSignTransaction);

    console.log('\n✅ Swap Result:');
    console.log('- Status:', result.status);
    console.log('- Signature:', result.signature);
    console.log('- Input Amount:', result.inputAmount / 1e9, 'SOL');
    console.log('- Output Amount:', result.outputAmount / 1e6, 'USDC');
    console.log('- Timestamp:', new Date(result.timestamp).toISOString());

    if (result.error) {
      console.error('❌ Error:', result.error);
    }
  } catch (error) {
    console.error('Failed to execute swap:', error);
  }
}

// Example 5: Multi-Hop Swap (SOL → USDC → RAY)
async function example5_MultiHopSwap() {
  console.log('\n=== Example 5: Multi-Hop Swap ===\n');

  const connection = new Connection('https://api.mainnet-beta.solana.com');
  const jupiterClient = createJupiterClient(connection);

  // Get quote for SOL → RAY (may route through USDC)
  const quote = await jupiterClient.getQuote({
    inputMint: TOKENS.SOL,
    outputMint: TOKENS.RAY,
    amount: 1_000_000_000, // 1 SOL
    slippageBps: 100,
  });

  console.log('Multi-Hop Route:');
  console.log('- Input:', parseInt(quote.inAmount) / 1e9, 'SOL');
  console.log('- Output:', parseInt(quote.outAmount) / 1e6, 'RAY');
  console.log('- Route Steps:', quote.routePlan.length);
  console.log('- DEXes:', jupiterClient.getRouteSummary(quote).join(' → '));
  console.log('- Price Impact:', quote.priceImpactPct + '%');

  // Show each step in the route
  console.log('\nRoute Details:');
  quote.routePlan.forEach((step, index) => {
    console.log(`  Step ${index + 1}:`);
    console.log(`    - DEX: ${step.swapInfo.label}`);
    console.log(`    - In: ${step.swapInfo.inAmount}`);
    console.log(`    - Out: ${step.swapInfo.outAmount}`);
    console.log(`    - Percent: ${step.percent}%`);
  });
}

// Example 6: Price Impact Warning
async function example6_PriceImpactWarning() {
  console.log('\n=== Example 6: Price Impact Warning ===\n');

  const connection = new Connection('https://api.mainnet-beta.solana.com');
  const jupiterClient = createJupiterClient(connection);

  // Try a large swap that might have high price impact
  const largeAmount = 100_000_000_000; // 100 SOL

  try {
    const quote = await jupiterClient.getQuote({
      inputMint: TOKENS.SOL,
      outputMint: TOKENS.BONK,
      amount: largeAmount,
      slippageBps: 100,
    });

    const priceImpact = jupiterClient.calculatePriceImpact(quote);

    console.log('Large Swap Analysis:');
    console.log('- Input Amount:', largeAmount / 1e9, 'SOL');
    console.log('- Price Impact:', priceImpact + '%');

    if (priceImpact > 5.0) {
      console.log('\n🚨 CRITICAL: Price impact > 5%');
      console.log('   Consider splitting into smaller swaps');
    } else if (priceImpact > 1.0) {
      console.log('\n⚠️  WARNING: Price impact > 1%');
      console.log('   Review carefully before proceeding');
    } else {
      console.log('\n✅ Price impact acceptable');
    }
  } catch (error) {
    console.error('Failed to get quote:', error);
  }
}

// Example 7: Error Handling
async function example7_ErrorHandling() {
  console.log('\n=== Example 7: Error Handling ===\n');

  const connection = new Connection('https://api.mainnet-beta.solana.com');
  const jupiterClient = createJupiterClient(connection);

  // Try invalid token address
  try {
    await jupiterClient.getQuote({
      inputMint: 'invalid-address',
      outputMint: TOKENS.USDC,
      amount: 1_000_000_000,
      slippageBps: 50,
    });
  } catch (error) {
    console.log('❌ Expected error for invalid address:');
    console.log('  ', error instanceof Error ? error.message : error);
  }

  // Try zero amount
  try {
    await jupiterClient.getQuote({
      inputMint: TOKENS.SOL,
      outputMint: TOKENS.USDC,
      amount: 0,
      slippageBps: 50,
    });
  } catch (error) {
    console.log('\n❌ Expected error for zero amount:');
    console.log('  ', error instanceof Error ? error.message : error);
  }
}

// Run all examples
async function runAllExamples() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║   Jupiter Client Usage Examples       ║');
  console.log('╚════════════════════════════════════════╝');

  try {
    await example1_BasicQuote();
    await example2_DirectRoutesOnly();
    await example3_CompareSlippage();
    await example4_ExecuteSwap();
    await example5_MultiHopSwap();
    await example6_PriceImpactWarning();
    await example7_ErrorHandling();
  } catch (error) {
    console.error('Example execution failed:', error);
  }

  console.log('\n✅ All examples completed!');
}

// Export examples for individual execution
export {
  example1_BasicQuote,
  example2_DirectRoutesOnly,
  example3_CompareSlippage,
  example4_ExecuteSwap,
  example5_MultiHopSwap,
  example6_PriceImpactWarning,
  example7_ErrorHandling,
  runAllExamples,
};

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllExamples();
}
