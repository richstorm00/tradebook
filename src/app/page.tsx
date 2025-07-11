"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useState, useEffect } from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDownIcon } from "lucide-react";
import { Copy } from "lucide-react";

export default function DashboardPage() {
  // Placeholder values
  const totalPnL = 12450.23;
  const totalPnLPercent = 12.7;
  const numStrategies = 4;
  const openPositions = 9;
  const totalCapital = 50000;

  // Add these hooks and handlers at the top of the DashboardPage function
  const [strategyType, setStrategyType] = useState("TradingView");
  const [strategyName, setStrategyName] = useState("");
  const [aiBot, setAiBot] = useState("");
  const [tags, setTags] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [strategies, setStrategies] = useState<any[]>([]);
  const [strategiesLoading, setStrategiesLoading] = useState(true);
  const [tradeForms, setTradeForms] = useState<{ [key: number]: any }>({});

  // Fetch strategies from backend
  const fetchStrategies = async () => {
    setStrategiesLoading(true);
    try {
      const res = await fetch("/api/strategies");
      const data = await res.json();
      setStrategies(data);
    } catch {
      setStrategies([]);
    } finally {
      setStrategiesLoading(false);
    }
  };

  useEffect(() => {
    fetchStrategies();
  }, []);

  const handleCancel = () => {
    setStrategyType("TradingView");
    setStrategyName("");
    setAiBot("");
    setTags("");
  };

  // Update handleSubmit to refresh strategies after add
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    let payload: any = { type: strategyType, tags };
    if (strategyType === "TradingView") {
      payload.name = strategyName;
    } else if (strategyType === "AIBot") {
      payload.bot = aiBot;
    }
    try {
      const res = await fetch("/api/strategies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to add strategy");
      handleCancel();
      await fetchStrategies(); // Refresh list
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  // Add trade to a strategy
  const handleAddTrade = async (strategyId: number, form: any) => {
    const { symbol, entry, leverage, current, pnl, pnlPercent, win } = form;
    if (!symbol || entry === '' || leverage === '' || current === '' || pnl === '' || pnlPercent === '' || win === '') return;
    await fetch(`/api/strategies/${strategyId}/trades`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        symbol,
        entry: parseFloat(entry),
        leverage: parseInt(leverage, 10),
        current: parseFloat(current),
        pnl: parseFloat(pnl),
        pnlPercent: parseFloat(pnlPercent),
        win: win === 'true' || win === true,
      }),
    });
    setTradeForms(f => ({ ...f, [strategyId]: {} }));
    await fetchStrategies();
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0c1425] text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Dashboard Summary */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-900/60 border-white/10">
            <CardHeader>
              <CardTitle>Total PnL</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center gap-2">
                ${totalPnL.toLocaleString()} <span className={`text-sm font-medium ${totalPnLPercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{totalPnLPercent >= 0 ? '+' : ''}{totalPnLPercent}%</span>
              </div>
              <div className="text-xs text-white/60 mt-1">All strategies</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/60 border-white/10">
            <CardHeader>
              <CardTitle>Strategies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{numStrategies}</div>
              <div className="text-xs text-white/60 mt-1">Active</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/60 border-white/10">
            <CardHeader>
              <CardTitle>Open Positions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{openPositions}</div>
              <div className="text-xs text-white/60 mt-1">Currently open</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/60 border-white/10">
            <CardHeader>
              <CardTitle>Total Capital</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalCapital.toLocaleString()}</div>
              <div className="text-xs text-white/60 mt-1">USD Deployed</div>
            </CardContent>
          </Card>
        </section>
        {/* More dashboard sections will go here */}
        {/* Strategies & Positions Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Strategies & Positions</h2>
            {/* Add Strategy button and modal */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="default">Add Strategy</Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900 border-white/10">
                <DialogHeader>
                  <DialogTitle>Add New Strategy</DialogTitle>
                </DialogHeader>
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div>
                    <Label htmlFor="strategy-type">Strategy Type</Label>
                    <select
                      id="strategy-type"
                      className="mt-1 w-full bg-slate-800 border border-white/10 rounded-md px-3 py-2 text-white"
                      value={strategyType}
                      onChange={e => setStrategyType(e.target.value)}
                    >
                      <option value="TradingView">TradingView</option>
                      <option value="AIBot">AIBot</option>
                    </select>
                  </div>
                  {strategyType === "TradingView" && (
                    <div>
                      <Label htmlFor="strategy-name">Strategy Name</Label>
                      <Input id="strategy-name" placeholder="e.g. BTC Trend Rider" className="mt-1" value={strategyName} onChange={e => setStrategyName(e.target.value)} />
                    </div>
                  )}
                  {strategyType === "AIBot" && (
                    <div>
                      <Label htmlFor="ai-bot">AI Bot Strategy</Label>
                      <select
                        id="ai-bot"
                        className="mt-1 w-full bg-slate-800 border border-white/10 rounded-md px-3 py-2 text-white"
                        value={aiBot}
                        onChange={e => setAiBot(e.target.value)}
                      >
                        <option value="">Select a bot...</option>
                        <option value="MeanReversion">Mean Reversion</option>
                        <option value="Momentum">Momentum</option>
                        <option value="Arbitrage">Arbitrage</option>
                      </select>
                    </div>
                  )}
                  <div>
                    <Label htmlFor="tags">Tags</Label>
                    <Input id="tags" placeholder="e.g. BTC, trend, EMA" className="mt-1" value={tags} onChange={e => setTags(e.target.value)} />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="secondary" onClick={handleCancel} disabled={loading}>Cancel</Button>
                    <Button type="submit" variant="default" disabled={loading}>{loading ? "Adding..." : "Add"}</Button>
                  </div>
                  {error && <div className="text-red-400 text-sm pt-2">{error}</div>}
                </form>
              </DialogContent>
            </Dialog>
          </div>
          <TooltipProvider>
          <Accordion type="multiple" className="space-y-4">
            {/* Show loading or empty state */}
            {strategiesLoading ? (
              <div className="text-white/60 text-sm px-6 py-4">Loading strategies...</div>
            ) : strategies.length === 0 ? (
              <div className="text-white/60 text-sm px-6 py-4">No strategies found.</div>
            ) : (
              strategies.map((strategy) => (
              <AccordionItem key={strategy.id} value={String(strategy.id)} className="bg-slate-900/60 border border-white/10 rounded-xl">
                <AccordionTrigger className="flex items-center px-6 py-4 gap-2 w-full">
                    <span className="font-semibold text-base truncate">{strategy.name || strategy.bot || "Unnamed Strategy"}</span>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1 min-w-0">
                      {strategy.webhook && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span
                          role="button"
                          tabIndex={0}
                          className="ml-2 p-2 rounded hover:bg-slate-800 transition cursor-pointer inline-flex items-center justify-center"
                          aria-label="Copy Webhook URL"
                          onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(strategy.webhook); }}
                          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); navigator.clipboard.writeText(strategy.webhook); } }}
                        >
                          <Copy className="h-4 w-4" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        Copy Webhook URL
                        <div className="text-xs mt-1 break-all max-w-xs">{strategy.webhook}</div>
                      </TooltipContent>
                    </Tooltip>
                      )}
                      <Badge variant="secondary" className="text-xs font-medium bg-slate-800/80 border border-white/10 text-white/80">{strategy.type}</Badge>
                      {strategy.tags && <Badge variant="secondary" className="text-xs font-medium bg-slate-800/80 border border-white/10 text-white/80">{strategy.tags}</Badge>}
                      {/* KPIs */}
                      <Badge variant="secondary" className="text-xs font-medium bg-slate-800/80 border border-white/10 text-white/80">PnL: ${strategy.netPnl}</Badge>
                      <Badge variant="secondary" className="text-xs font-medium bg-slate-800/80 border border-white/10 text-white/80">Win Rate: {strategy.winRate}</Badge>
                      <Badge variant="secondary" className="text-xs font-medium bg-slate-800/80 border border-white/10 text-white/80">Trades: {strategy.numTrades}</Badge>
                      <Badge variant="secondary" className="text-xs font-medium bg-slate-800/80 border border-white/10 text-white/80">Max DD: {strategy.maxDrawdown}</Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4">
                  <div className="space-y-3">
                      {/* Trades Table */}
                      {strategy.trades && strategy.trades.length > 0 ? (
                        <table className="w-full text-sm mb-4">
                          <thead className="text-white/60">
                            <tr>
                              <th className="py-2 text-left">Symbol</th>
                              <th className="py-2 text-left">Entry</th>
                              <th className="py-2 text-left">Leverage</th>
                              <th className="py-2 text-left">Current</th>
                              <th className="py-2 text-left">PnL</th>
                              <th className="py-2 text-left">PnL %</th>
                              <th className="py-2 text-left">Win</th>
                              <th className="py-2 text-left">Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {strategy.trades.map((trade: any) => (
                              <tr key={trade.id} className="border-t border-white/5">
                                <td className="py-2">{trade.symbol}</td>
                                <td className="py-2">${trade.entry}</td>
                                <td className="py-2">{trade.leverage}x</td>
                                <td className="py-2">${trade.current}</td>
                                <td className={`py-2 font-semibold ${trade.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{trade.pnl >= 0 ? '+' : ''}${trade.pnl}</td>
                                <td className={`py-2 font-semibold ${trade.pnlPercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{trade.pnlPercent >= 0 ? '+' : ''}{trade.pnlPercent}%</td>
                                <td className="py-2">{trade.win ? '✅' : '❌'}</td>
                                <td className="py-2">{new Date(trade.createdAt).toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div className="text-white/60 text-sm">No trades yet.</div>
                      )}
                    </div>
                  </AccordionContent>
              </AccordionItem>
              ))
            )}
          </Accordion>
          </TooltipProvider>
        </section>
      </div>
    </main>
  );
}
