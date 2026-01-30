import React, { useEffect, useState } from 'react';
import { ArrowUpRight, TrendingUp, Sparkles, ArrowRight } from 'lucide-react';
import { geckoTerminalClient } from '../services/GeckoTerminalClient';
import { TrendingToken, TokenPair } from '../types/birdeye';

const DashboardHome: React.FC = () => {
    return (
        <div className="flex flex-col gap-12 animate-fade-in">
            {/* Hero Section */}
            <section className="mt-8">
                <h1 className="text-5xl font-bold text-primary-DEFAULT mb-4 tracking-tight">
                    Hey, I'm <span className="text-primary-muted">Alpha Hunter.</span><br />
                    I find <span className="text-primary-DEFAULT">gems.</span>
                </h1>
                <p className="text-primary-muted text-lg max-w-2xl mb-8 leading-relaxed">
                    The ultimate crypto discovery dashboard. Real-time monitoring of new pairs,
                    trending tokens, and market movers on Solana.
                </p>
                <div className="flex gap-4">
                    <button className="px-6 py-2 bg-primary-DEFAULT text-dark-bg font-semibold rounded-lg hover:bg-white transition-colors">
                        Start Hunting
                    </button>
                    <button className="px-6 py-2 border border-dark-border text-primary-DEFAULT font-medium rounded-lg hover:bg-dark-card transition-colors">
                        View Strategy
                    </button>
                </div>
            </section>

            {/* Featured Section - Trending */}
            <section>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-sm font-semibold text-primary-DEFAULT uppercase tracking-wider">Market Movers</h2>
                    <button className="text-xs text-primary-muted hover:text-primary-DEFAULT flex items-center gap-1 transition-colors">
                        View All <ArrowRight size={12} />
                    </button>
                </div>
                <TrendingCards />
            </section>

            {/* Secondary Section - New Pairs */}
            <section>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-sm font-semibold text-primary-DEFAULT uppercase tracking-wider">New Drops</h2>
                    <button className="text-xs text-primary-muted hover:text-primary-DEFAULT flex items-center gap-1 transition-colors">
                        View Feed <ArrowRight size={12} />
                    </button>
                </div>
                <NewPairsList />
            </section>
        </div>
    );
};

// --- Sub-components for Data Display ---

const TrendingCards = () => {
    const [tokens, setTokens] = useState<TrendingToken[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            try {
                const pools = await geckoTerminalClient.getTrendingPools(3);
                const mapped = pools.map(pool => ({
                    address: pool.relationships.base_token.data.id.replace('solana_', ''),
                    pairAddress: pool.attributes.address,
                    symbol: pool.attributes.name.split(' / ')[0],
                    name: pool.attributes.name,
                    price: parseFloat(pool.attributes.base_token_price_usd),
                    priceChange24h: parseFloat(pool.attributes.price_change_percentage.h24),
                    volume24h: parseFloat(pool.attributes.volume_usd.h24),
                    volumeChange24h: 0,
                    marketCap: parseFloat(pool.attributes.market_cap_usd || '0'),
                }));
                setTokens(mapped);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    if (loading) return <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
        {[1, 2, 3].map(i => <div key={i} className="h-48 bg-dark-card rounded-xl border border-dark-border"></div>)}
    </div>;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tokens.map((token) => (
                <div
                    key={token.address}
                    className="group bg-dark-card border border-dark-border rounded-xl p-6 hover:border-primary-muted/30 transition-all cursor-pointer"
                    onClick={() => window.open(`https://www.dextools.io/app/en/solana/pair-explorer/${token.pairAddress || token.address}`, '_blank')}
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500/10 to-purple-500/10 flex items-center justify-center border border-indigo-500/20">
                            <TrendingUp size={20} className="text-indigo-400" />
                        </div>
                        <span className={`flex items-center text-xs font-semibold px-2 py-1 rounded bg-dark-bg border border-dark-border ${token.priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {token.priceChange24h >= 0 ? '+' : ''}{token.priceChange24h.toFixed(2)}%
                        </span>
                    </div>
                    <h3 className="text-xl font-bold text-primary-DEFAULT mb-1">{token.symbol}</h3>
                    <p className="text-sm text-primary-muted mb-6 line-clamp-1">{token.name}</p>
                    <div className="flex justify-between items-end">
                        <div>
                            <p className="text-xs text-primary-muted uppercase mb-1">Price</p>
                            <p className="text-lg font-mono text-primary-DEFAULT">${token.price < 0.01 ? token.price.toFixed(6) : token.price.toFixed(2)}</p>
                        </div>
                        <ArrowUpRight size={18} className="text-primary-muted group-hover:text-primary-DEFAULT transition-colors" />
                    </div>
                </div>
            ))}
        </div>
    );
};

const NewPairsList = () => {
    const [pairs, setPairs] = useState<TokenPair[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            try {
                const pools = await geckoTerminalClient.getNewPools(4); // limit 4
                const mapped = pools.map(pool => ({
                    pairAddress: pool.attributes.address,
                    baseToken: {
                        address: pool.relationships.base_token.data.id.replace('solana_', ''),
                        symbol: pool.attributes.name.split(' / ')[0],
                        name: pool.attributes.name.split(' / ')[0],
                        decimals: 9
                    },
                    quoteToken: {
                        address: '', symbol: '', name: '', decimals: 0
                    },
                    liquidity: parseFloat(pool.attributes.reserve_in_usd || '0'),
                    volume24h: parseFloat(pool.attributes.volume_usd.h24 || '0'),
                    priceChange24h: parseFloat(pool.attributes.price_change_percentage.h24 || '0'),
                    createdAt: new Date(pool.attributes.pool_created_at).getTime()
                }));
                setPairs(mapped);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    if (loading) return <div className="flex flex-col gap-4 animate-pulse">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-dark-card rounded-xl border border-dark-border"></div>)}
    </div>;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pairs.map(pair => {
                const isNew = (Date.now() - pair.createdAt) < 24 * 60 * 60 * 1000;
                return (
                    <div
                        key={pair.pairAddress}
                        className="flex items-center p-4 bg-dark-card border border-dark-border rounded-xl hover:bg-dark-hover transition-colors cursor-pointer group"
                        onClick={() => window.open(`https://www.dextools.io/app/en/solana/pair-explorer/${pair.pairAddress}`, '_blank')}
                    >
                        <div className="w-12 h-12 rounded-lg bg-dark-bg border border-dark-border flex items-center justify-center mr-4">
                            <Sparkles size={20} className="text-yellow-500/70" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-bold text-primary-DEFAULT truncate">{pair.baseToken.symbol}</h4>
                                {isNew && <span className="text-[10px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20">NEW</span>}
                            </div>
                            <p className="text-xs text-primary-muted truncate">Vol: ${pair.volume24h.toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-mono text-primary-DEFAULT mb-1">${pair.liquidity.toLocaleString()}</p>
                            <p className="text-xs text-primary-muted uppercase">Liq</p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default DashboardHome;
