"use client";

import FeatureSpotlight from "./FeatureSpotlight";

const FeaturedWork = () => {
    return (
        <div className="space-y-0" id="experience">
            <FeatureSpotlight
                title="Project Case Study: Fintech App"
                description="A deep dive into how I architected a secure fintech application handling thousands of transactions. Implemented real-time fraud detection and encrypted data storage."
                linkText="View Case Study"
                linkHref="#"
                alignment="left"
            >
                <div className="p-6 sm:p-8 h-full flex flex-col justify-center gap-5">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold tracking-wide text-foreground">Fintech Risk Dashboard</h3>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="h-2 w-2 rounded-full bg-foreground" />
                            Live Monitor
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <div className="rounded-lg border border-border bg-secondary/40 p-3">
                            <p className="text-[11px] text-muted-foreground">Daily Txns</p>
                            <p className="text-lg font-semibold text-foreground mt-1">24.8K</p>
                        </div>
                        <div className="rounded-lg border border-border bg-secondary/40 p-3">
                            <p className="text-[11px] text-muted-foreground">Fraud Blocked</p>
                            <p className="text-lg font-semibold text-foreground mt-1">99.2%</p>
                        </div>
                        <div className="rounded-lg border border-border bg-secondary/40 p-3">
                            <p className="text-[11px] text-muted-foreground">Avg Latency</p>
                            <p className="text-lg font-semibold text-foreground mt-1">118ms</p>
                        </div>
                    </div>

                    <div className="rounded-lg border border-border bg-card p-4">
                        <p className="text-xs text-muted-foreground mb-3">Transaction Volume Trend</p>
                        <div className="flex items-end gap-2 h-20">
                            {[28, 40, 36, 52, 60, 55, 68, 72, 65, 78, 74, 82].map((v, i) => (
                                <div key={i} className="flex-1 bg-secondary border border-border rounded-sm" style={{ height: `${v}%` }} />
                            ))}
                        </div>
                    </div>

                    <div className="rounded-lg border border-border bg-secondary/40 p-4 text-xs text-foreground space-y-2">
                        <div className="flex items-center justify-between">
                            <span>Rule Engine</span>
                            <span className="text-muted-foreground">Active</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span>Encryption</span>
                            <span className="text-muted-foreground">AES-256</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span>Alert Channel</span>
                            <span className="text-muted-foreground">Real-time</span>
                        </div>
                    </div>
                </div>
            </FeatureSpotlight>
        </div>
    );
};

export default FeaturedWork;

