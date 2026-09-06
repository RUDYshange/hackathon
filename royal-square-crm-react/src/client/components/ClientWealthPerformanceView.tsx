import React, { useState } from 'react';
import { useClient } from '../context/ClientContext';
import {
  TrendingUp,
  TrendingDown,
  Landmark,
  Building2,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Car,
  FileCheck2
} from 'lucide-react';
import { CURRENT_CLIENT_MOCK } from '../mockClientData';

interface ClientWealthPerformanceViewProps {
  onNavigateToReport?: () => void;
  onNavigateToPolicies?: () => void;
}

export const ClientWealthPerformanceView: React.FC<ClientWealthPerformanceViewProps> = ({
  onNavigateToReport,
  onNavigateToPolicies
}) => {
  const { client } = useClient();
  const [filter, setFilter] = useState<'ALL' | 'WIN' | 'LOSS'>('ALL');

  // Robust defensive fallbacks to guarantee zero runtime crashes
  const wealth = client?.wealth || CURRENT_CLIENT_MOCK.wealth;
  const holdings = Array.isArray(client?.holdings) ? client.holdings : CURRENT_CLIENT_MOCK.holdings;

  const filteredHoldings = holdings.filter((h) => {
    if (filter === 'WIN') return h.outcome === 'WIN';
    if (filter === 'LOSS') return h.outcome === 'LOSS';
    return true;
  });

  const totalWins = holdings.filter((h) => h.outcome === 'WIN');
  const totalLosses = holdings.filter((h) => h.outcome === 'LOSS');

  const winsSum = totalWins.reduce((acc, h) => acc + h.pnlAmount, 0);
  const lossesSum = Math.abs(totalLosses.reduce((acc, h) => acc + h.pnlAmount, 0));

  return (
    <div className="wealth-performance-view">
      {/* Quick Action Banner: Go to Report Incident or View Policies */}
      <div className="client-dashboard-quick-actions">
        <div className="quick-actions-left">
          <span className="qa-badge">
            <CheckCircle2 size={13} className="text-emerald" /> Real-Time Portfolio & Wealth Sync
          </span>
          <h2 className="qa-title">Kagiso & Lerato Mokoena Portfolio Overview</h2>
          <p className="qa-subtitle">
            Consolidated net worth, investment performance, asset distribution, and direct incident intake.
          </p>
        </div>
        <div className="quick-actions-buttons">
          {onNavigateToReport && (
            <button
              type="button"
              className="btn-go-to-report"
              onClick={onNavigateToReport}
              title="Report a new motor accident or incident with Google Maps and Smart Transcribe"
            >
              <Car size={16} />
              <span>Report Motor Incident / Claim</span>
            </button>
          )}
          {onNavigateToPolicies && (
            <button
              type="button"
              className="btn-go-to-policies"
              onClick={onNavigateToPolicies}
              title="View your 7 active underwriting policies"
            >
              <FileCheck2 size={16} />
              <span>View All 7 Policies</span>
            </button>
          )}
        </div>
      </div>

      {/* 1. Executive Wealth KPI Cards (Matching Institutional Mandate) */}
      <div className="wealth-hero-row">
        <div className="wealth-kpi-card total-net-worth">
          <div className="kpi-header">
            <span className="kpi-label">Total Family Net Worth</span>
            <span className="badge-tier">{client?.tier || 'HNW TIER 1'}</span>
          </div>
          <div className="kpi-value-hero">
            R {wealth.totalNetWorth.toLocaleString()}
          </div>
          <div className="kpi-meta-row">
            <span className="badge-growth-up">
              <ArrowUpRight size={14} /> +{wealth.yoyGrowth}% YoY
            </span>
            <span className="kpi-subtext">FAIS Tier High-Wealth Discretionary</span>
          </div>
        </div>

        <div className="wealth-kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Investments & RA</span>
            <Landmark size={18} className="text-gold" />
          </div>
          <div className="kpi-value">
            R {wealth.investmentsAndRA.toLocaleString()}
          </div>
          <div className="composition-track">
            <div className="composition-bar" style={{ width: '60.7%' }} />
          </div>
          <span className="kpi-subtext">60.7% Total Composition</span>
        </div>

        <div className="wealth-kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Real Estate & Assets</span>
            <Building2 size={18} className="text-gold" />
          </div>
          <div className="kpi-value">
            R {wealth.realEstateAndAssets.toLocaleString()}
          </div>
          <div className="composition-track">
            <div className="composition-bar" style={{ width: '32%' }} />
          </div>
          <span className="kpi-subtext">Primary Residence & Craft</span>
        </div>

        <div className="wealth-kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Liabilities & Bonds</span>
            <Wallet size={18} className="text-muted" />
          </div>
          <div className="kpi-value">
            R {wealth.liabilitiesAndBonds.toLocaleString()}
          </div>
          <div className="composition-track">
            <div className="composition-bar liability" style={{ width: '6.77%' }} />
          </div>
          <span className="kpi-subtext">LTV Ratio: {wealth.ltvRatio}% (Very Low)</span>
        </div>
      </div>

      {/* 2. Wins & Losses Performance Breakdown (Wealth Creation) */}
      <section className="wealth-section" aria-labelledby="heading-wins-losses">
        <div className="wealth-section-head">
          <div>
            <div className="flex items-center gap-2">
              <h2 id="heading-wins-losses" className="wealth-section-title">
                Wealth Generation: Wins & Pullbacks
              </h2>
              <span className="badge-live-sync">
                <CheckCircle2 size={12} /> Live JSE & Offshore P&L
              </span>
            </div>
            <p className="wealth-section-desc">
              Transparent tracking of investment performance, capital growth, and market cycle drivers across your portfolio.
            </p>
          </div>

          {/* Performance Summary Pill */}
          <div className="pnl-aggregate-card">
            <div className="pnl-stat">
              <span className="pnl-label">Cumulative Gains (Wins)</span>
              <span className="pnl-val win">+R {winsSum.toLocaleString()}</span>
            </div>
            <div className="pnl-divider" />
            <div className="pnl-stat">
              <span className="pnl-label">Market Pullbacks (Losses)</span>
              <span className="pnl-val loss">-R {lossesSum.toLocaleString()}</span>
            </div>
            <div className="pnl-divider" />
            <div className="pnl-stat">
              <span className="pnl-label">Net Fiscal P&L</span>
              <span className="pnl-val net">+R {wealth.totalGainAmount.toLocaleString()} ({wealth.totalGainPercentage}%)</span>
            </div>
          </div>
        </div>

        {/* Filter Controls: All / Wins / Losses */}
        <div className="pnl-filter-bar">
          <div className="filter-buttons-group">
            <button
              type="button"
              className={`pnl-filter-btn ${filter === 'ALL' ? 'active' : ''}`}
              onClick={() => setFilter('ALL')}
            >
              All Asset Holdings ({holdings.length})
            </button>
            <button
              type="button"
              className={`pnl-filter-btn win ${filter === 'WIN' ? 'active' : ''}`}
              onClick={() => setFilter('WIN')}
            >
              <TrendingUp size={14} /> Profitable Wins ({totalWins.length})
            </button>
            <button
              type="button"
              className={`pnl-filter-btn loss ${filter === 'LOSS' ? 'active' : ''}`}
              onClick={() => setFilter('LOSS')}
            >
              <TrendingDown size={14} /> Market Pullbacks ({totalLosses.length})
            </button>
          </div>
          <span className="text-xs text-muted">
            Annual Advisory Review: <strong>{client?.advisor?.annualReview || 'Q1 2026'}</strong>
          </span>
        </div>

        {/* Holdings Cards Grid */}
        <div className="holdings-grid">
          {filteredHoldings.map((holding) => {
            const isWin = holding.outcome === 'WIN';
            return (
              <div
                key={holding.id}
                className={`holding-card ${isWin ? 'outcome-win' : 'outcome-loss'}`}
              >
                <div className="holding-top">
                  <div>
                    <span className="holding-provider-badge">{holding.provider}</span>
                    <h3 className="holding-name">{holding.name}</h3>
                  </div>
                  <div className="holding-outcome-tag">
                    {isWin ? (
                      <span className="badge-outcome win">
                        <ArrowUpRight size={14} /> WIN +{holding.pnlPercentage}%
                      </span>
                    ) : (
                      <span className="badge-outcome loss">
                        <ArrowDownRight size={14} /> LOSS {holding.pnlPercentage}%
                      </span>
                    )}
                  </div>
                </div>

                <div className="holding-numbers-row">
                  <div className="num-col">
                    <span className="num-lbl">Current Valuation</span>
                    <span className="num-val">R {holding.currentValue.toLocaleString()}</span>
                  </div>
                  <div className="num-col">
                    <span className="num-lbl">Cost Base</span>
                    <span className="num-val-sub">R {holding.investedAmount.toLocaleString()}</span>
                  </div>
                  <div className="num-col right">
                    <span className="num-lbl">Realized / Unrealized</span>
                    <span className={`num-pnl ${isWin ? 'text-emerald' : 'text-crimson'}`}>
                      {isWin ? '+' : ''}R {holding.pnlAmount.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Human-Readable Market Explanation for Client */}
                <div className="market-driver-box">
                  <span className="driver-label">Market Context & Thesis:</span>
                  <p className="driver-text">{holding.marketDriver}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. Asset Composition & Pass-Through Architecture */}
      <section className="wealth-section">
        <div className="wealth-section-head">
          <div>
            <h2 className="wealth-section-title">Asset Allocation & Institutional Mandate</h2>
            <p className="wealth-section-desc">
              Targeted discretionary balancing under FAIS Category I & II licensing.
            </p>
          </div>
          <div className="sla-badge-box">
            <span className="sla-pct">100%</span>
            <div>
              <strong>Comprehensive Mandate</strong>
              <p className="text-xs text-muted">Signed 14 Jan 2025</p>
            </div>
          </div>
        </div>

        <div className="asset-composition-distribution">
          <div className="distribution-item">
            <div className="dist-head">
              <span className="dot dot-blue" />
              <span className="dist-name">Onshore & Global Equities</span>
              <span className="dist-pct font-bold">61%</span>
            </div>
            <div className="dist-bar-track">
              <div className="dist-bar bg-blue" style={{ width: '61%' }} />
            </div>
            <span className="text-xs text-muted mt-1 block">R 11,254,500 invested</span>
          </div>

          <div className="distribution-item">
            <div className="dist-head">
              <span className="dot dot-gold" />
              <span className="dist-name">Fixed Property & Craft</span>
              <span className="dist-pct font-bold">32%</span>
            </div>
            <div className="dist-bar-track">
              <div className="dist-bar bg-gold" style={{ width: '32%' }} />
            </div>
            <span className="text-xs text-muted mt-1 block">R 5,904,000 asset value</span>
          </div>

          <div className="distribution-item">
            <div className="dist-head">
              <span className="dot dot-emerald" />
              <span className="dist-name">Liquidity & Gap Cash</span>
              <span className="dist-pct font-bold">7%</span>
            </div>
            <div className="dist-bar-track">
              <div className="dist-bar bg-emerald" style={{ width: '7%' }} />
            </div>
            <span className="text-xs text-muted mt-1 block">R 1,291,500 emergency buffer</span>
          </div>
        </div>
      </section>
    </div>
  );
};
