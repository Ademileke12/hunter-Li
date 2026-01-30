/**
 * Example usage of the Birdeye API Client
 * 
 * This file demonstrates how to use the BirdeyeClient to fetch
 * token data, holder distribution, new pairs, and trending tokens.
 */

import { birdeyeClient, BirdeyeAPIError } from './BirdeyeClient';

// Example 1: Fetch token overview
async function exampleTokenOverview() {
  try {
    const solAddress = 'So11111111111111111111111111111111111111112';
    const tokenData = await birdeyeClient.getTokenOverview(solAddress);
    
    console.log('=== Token Overview ===');
    console.log(`Name: ${tokenData.name} (${tokenData.symbol})`);
    console.log(`Price: $${tokenData.price.toFixed(2)}`);
    console.log(`24h Change: ${tokenData.priceChange24h.toFixed(2)}%`);
    console.log(`24h Volume: $${tokenData.volume24h.toLocaleString()}`);
    console.log(`Market Cap: $${tokenData.marketCap.toLocaleString()}`);
    console.log(`Liquidity: $${tokenData.liquidity.toLocaleString()}`);
    console.log(`Supply: ${tokenData.supply.toLocaleString()}`);
    
    return tokenData;
  } catch (error) {
    if (error instanceof BirdeyeAPIError) {
      console.error('API Error:', error.message);
      console.error('Status:', error.statusCode);
      console.error('Endpoint:', error.endpoint);
    } else {
      console.error('Unexpected error:', error);
    }
    throw error;
  }
}

// Example 2: Fetch holder distribution and calculate concentration
async function exampleHolderDistribution() {
  try {
    const tokenAddress = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'; // USDC
    const holders = await birdeyeClient.getHolderDistribution(tokenAddress);
    
    console.log('\n=== Holder Distribution ===');
    console.log(`Total holders analyzed: ${holders.length}`);
    
    // Show top 5 holders
    console.log('\nTop 5 Holders:');
    holders.slice(0, 5).forEach(holder => {
      console.log(`  ${holder.rank}. ${holder.address.slice(0, 8)}...`);
      console.log(`     Balance: ${holder.balance.toLocaleString()}`);
      console.log(`     Percentage: ${holder.percentage.toFixed(2)}%`);
    });
    
    // Calculate concentration metrics
    const top10Concentration = holders
      .slice(0, 10)
      .reduce((sum, h) => sum + h.percentage, 0);
    
    const top20Concentration = holders
      .slice(0, 20)
      .reduce((sum, h) => sum + h.percentage, 0);
    
    console.log('\nConcentration Metrics:');
    console.log(`  Top 10 holders: ${top10Concentration.toFixed(2)}%`);
    console.log(`  Top 20 holders: ${top20Concentration.toFixed(2)}%`);
    
    // Risk assessment based on concentration
    if (top10Concentration > 50) {
      console.log('  ⚠️  WARNING: High concentration risk!');
    } else if (top10Concentration > 30) {
      console.log('  ⚡ CAUTION: Moderate concentration');
    } else {
      console.log('  ✅ Good distribution');
    }
    
    return holders;
  } catch (error) {
    if (error instanceof BirdeyeAPIError) {
      console.error('Failed to fetch holder data:', error.message);
    }
    throw error;
  }
}

// Example 3: Fetch new pairs and highlight recent ones
async function exampleNewPairs() {
  try {
    const pairs = await birdeyeClient.getNewPairs(10);
    
    console.log('\n=== New Token Pairs ===');
    console.log(`Found ${pairs.length} new pairs\n`);
    
    const now = Date.now();
    const ONE_HOUR = 60 * 60 * 1000;
    const ONE_DAY = 24 * ONE_HOUR;
    
    pairs.forEach((pair, index) => {
      const ageMs = now - pair.createdAt;
      const ageHours = ageMs / ONE_HOUR;
      const ageDays = ageMs / ONE_DAY;
      
      // Highlight very new pairs
      const isVeryNew = ageHours < 1;
      const isNew = ageHours < 24;
      const prefix = isVeryNew ? '🔥' : isNew ? '⭐' : '  ';
      
      console.log(`${prefix} ${index + 1}. ${pair.baseToken.symbol}/${pair.quoteToken.symbol}`);
      
      if (ageDays < 1) {
        console.log(`     Age: ${ageHours.toFixed(1)} hours`);
      } else {
        console.log(`     Age: ${ageDays.toFixed(1)} days`);
      }
      
      console.log(`     Liquidity: $${pair.liquidity.toLocaleString()}`);
      console.log(`     24h Volume: $${pair.volume24h.toLocaleString()}`);
      console.log(`     24h Change: ${pair.priceChange24h.toFixed(2)}%`);
      console.log(`     Pair Address: ${pair.pairAddress.slice(0, 8)}...`);
      console.log('');
    });
    
    return pairs;
  } catch (error) {
    if (error instanceof BirdeyeAPIError) {
      console.error('Failed to fetch new pairs:', error.message);
    }
    throw error;
  }
}

// Example 4: Fetch trending tokens and identify volume spikes
async function exampleTrendingTokens() {
  try {
    const trending = await birdeyeClient.getTrendingTokens(10);
    
    console.log('\n=== Trending Tokens ===');
    console.log(`Found ${trending.length} trending tokens\n`);
    
    trending.forEach((token, index) => {
      // Highlight tokens with significant volume spikes
      const hasVolumeSpike = token.volumeChange24h > 100;
      const hasMassiveSpike = token.volumeChange24h > 500;
      const prefix = hasMassiveSpike ? '🚀' : hasVolumeSpike ? '📈' : '  ';
      
      console.log(`${prefix} ${index + 1}. ${token.name} (${token.symbol})`);
      console.log(`     Price: $${token.price.toFixed(6)}`);
      console.log(`     24h Price Change: ${token.priceChange24h.toFixed(2)}%`);
      console.log(`     24h Volume: $${token.volume24h.toLocaleString()}`);
      console.log(`     Volume Change: ${token.volumeChange24h.toFixed(2)}%`);
      console.log(`     Market Cap: $${token.marketCap.toLocaleString()}`);
      
      if (hasMassiveSpike) {
        console.log('     🔥 MASSIVE VOLUME SPIKE!');
      } else if (hasVolumeSpike) {
        console.log('     ⚡ Significant volume increase');
      }
      
      console.log('');
    });
    
    return trending;
  } catch (error) {
    if (error instanceof BirdeyeAPIError) {
      console.error('Failed to fetch trending tokens:', error.message);
    }
    throw error;
  }
}

// Example 5: Comprehensive token analysis
async function exampleComprehensiveAnalysis(tokenAddress: string) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`COMPREHENSIVE TOKEN ANALYSIS`);
  console.log(`Token: ${tokenAddress}`);
  console.log(`${'='.repeat(60)}`);
  
  try {
    // Fetch all data in parallel
    const [overview, holders] = await Promise.all([
      birdeyeClient.getTokenOverview(tokenAddress),
      birdeyeClient.getHolderDistribution(tokenAddress),
    ]);
    
    // Display overview
    console.log('\n📊 Overview:');
    console.log(`  Name: ${overview.name} (${overview.symbol})`);
    console.log(`  Price: $${overview.price.toFixed(6)}`);
    console.log(`  24h Change: ${overview.priceChange24h.toFixed(2)}%`);
    console.log(`  Market Cap: $${overview.marketCap.toLocaleString()}`);
    console.log(`  Liquidity: $${overview.liquidity.toLocaleString()}`);
    
    // Calculate risk metrics
    const top10Concentration = holders
      .slice(0, 10)
      .reduce((sum, h) => sum + h.percentage, 0);
    
    const lpPercentage = (overview.liquidity / overview.marketCap) * 100;
    
    console.log('\n⚠️  Risk Assessment:');
    console.log(`  Top 10 Concentration: ${top10Concentration.toFixed(2)}%`);
    console.log(`  LP/MC Ratio: ${lpPercentage.toFixed(2)}%`);
    
    // Calculate risk score (simplified version)
    let riskScore = 0;
    const riskFlags: string[] = [];
    
    if (lpPercentage < 50) {
      riskScore += (50 - lpPercentage);
      riskFlags.push('Low LP');
    }
    
    if (top10Concentration > 50) {
      riskScore += (top10Concentration - 50);
      riskFlags.push('High Concentration');
    }
    
    // Categorize risk
    let riskLevel: string;
    let riskEmoji: string;
    if (riskScore > 80) {
      riskLevel = 'CRITICAL';
      riskEmoji = '🔴';
    } else if (riskScore > 60) {
      riskLevel = 'HIGH';
      riskEmoji = '🟠';
    } else if (riskScore > 30) {
      riskLevel = 'MEDIUM';
      riskEmoji = '🟡';
    } else {
      riskLevel = 'LOW';
      riskEmoji = '🟢';
    }
    
    console.log(`  Risk Score: ${riskScore.toFixed(0)}/100`);
    console.log(`  Risk Level: ${riskEmoji} ${riskLevel}`);
    
    if (riskFlags.length > 0) {
      console.log(`  Flags: ${riskFlags.join(', ')}`);
    }
    
    console.log(`\n${'='.repeat(60)}\n`);
    
    return { overview, holders, riskScore, riskLevel, riskFlags };
  } catch (error) {
    console.error('\n❌ Analysis failed:', error);
    throw error;
  }
}

// Run examples (uncomment to test)
async function runExamples() {
  try {
    // Example 1: Token overview
    await exampleTokenOverview();
    
    // Example 2: Holder distribution
    await exampleHolderDistribution();
    
    // Example 3: New pairs
    await exampleNewPairs();
    
    // Example 4: Trending tokens
    await exampleTrendingTokens();
    
    // Example 5: Comprehensive analysis
    await exampleComprehensiveAnalysis('So11111111111111111111111111111111111111112');
    
  } catch (error) {
    console.error('Examples failed:', error);
  }
}

// Export examples for use in other files
export {
  exampleTokenOverview,
  exampleHolderDistribution,
  exampleNewPairs,
  exampleTrendingTokens,
  exampleComprehensiveAnalysis,
  runExamples,
};

// Uncomment to run examples:
// runExamples();
