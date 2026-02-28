'use client';

import { ActivityDay } from '@/lib/services/skill-score-calculator';

interface ActivityHeatmapProps {
    data: ActivityDay[];
}

function getIntensityStyle(count: number): React.CSSProperties {
    if (count === 0) return { background: '#1E293B', boxShadow: 'inset 0 0 0 1px rgba(51,65,85,0.5)' };
    if (count <= 2) return { background: 'rgba(30,58,138,0.5)', boxShadow: 'inset 0 0 0 1px rgba(30,58,138,0.7)' };
    if (count <= 5) return { background: 'rgba(30,64,175,0.65)', boxShadow: 'inset 0 0 0 1px rgba(37,99,235,0.5)' };
    if (count <= 10) return { background: 'rgba(37,99,235,0.8)', boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.15), 0 0 8px rgba(37,99,235,0.3)' };
    return { background: '#3B82F6', boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.25), 0 0 12px rgba(59,130,246,0.5)' };
}

const DAYS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const CELL_SIZE = 14;
const GAP = 3;

export default function ActivityHeatmap({ data }: ActivityHeatmapProps) {
    if (!data || data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-48 bg-slate-900/20 border border-slate-800/50 rounded-2xl w-full">
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center mb-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                </div>
                <span className="text-sm font-medium text-slate-500">No activity yet</span>
            </div>
        );
    }

    const firstDate = new Date(data[0].date);
    const startDayOfWeek = firstDate.getUTCDay();

    const startPadding = Array.from({ length: startDayOfWeek }, () => null);
    const initialPadded = [...startPadding, ...data];
    const endPaddingLength = (7 - (initialPadded.length % 7)) % 7;
    const endPadding = Array.from({ length: endPaddingLength }, () => null);

    const padded: (ActivityDay | null)[] = [...initialPadded, ...endPadding];

    const weeks: (ActivityDay | null)[][] = [];
    for (let i = 0; i < padded.length; i += 7) {
        weeks.push(padded.slice(i, i + 7));
    }

    const monthLabels: { weekIdx: number; label: string }[] = [];
    let lastMonth = -1;

    weeks.forEach((week, wi) => {
        const firstDay = week.find(d => d !== null);
        if (firstDay) {
            const m = new Date(firstDay.date).getUTCMonth();
            if (m !== lastMonth) {
                monthLabels.push({ weekIdx: wi, label: MONTHS[m] });
                lastMonth = m;
            }
        }
    });

    const totalEvents = data.reduce((sum, d) => sum + d.count, 0);
    const activeDays = data.filter(d => d.count > 0).length;
    const numWeeks = weeks.length;

    const dayLabelWidth = 28;
    const gridWidth = dayLabelWidth + numWeeks * (CELL_SIZE + GAP);

    return (
        <div className="w-full bg-card border border-border/40 rounded-2xl p-6 shadow-sm">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-2">
                <div>
                    <h3 className="text-sm font-bold text-foreground tracking-tight">Learning Activity</h3>
                    <p className="text-xs font-medium text-muted-foreground mt-0.5">Your daily interactions and code executions</p>
                </div>
                <div className="flex items-center gap-4 bg-background/50 rounded-lg px-3 py-1.5 border border-border/40">
                    <div className="text-sm font-bold font-mono text-foreground">{totalEvents}</div>
                    <div className="w-px h-5 bg-border/40" />
                    <div className="text-sm font-bold font-mono text-blue-400">
                        {activeDays} <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Days</span>
                    </div>
                </div>
            </div>

            {/* Scrollable heatmap */}
            <div style={{ minWidth: 0, width: '100%' }}>
                <div className="overflow-x-auto overflow-y-hidden pb-3 rounded-lg" style={{ minWidth: 0 }}>
                    <div style={{ width: gridWidth }}>
                        {/* Month labels row */}
                        <div style={{ display: 'flex', gap: GAP, marginLeft: dayLabelWidth, marginBottom: 4 }}>
                            {weeks.map((_, wi) => {
                                const label = monthLabels.find(m => m.weekIdx === wi);
                                return (
                                    <div
                                        key={`month-${wi}`}
                                        style={{ width: CELL_SIZE, fontSize: 10, flexShrink: 0, whiteSpace: 'nowrap' }}
                                        className="text-slate-500 font-semibold"
                                    >
                                        {label?.label || ''}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Day rows */}
                        {[0, 1, 2, 3, 4, 5, 6].map(dayIdx => (
                            <div key={`day-${dayIdx}`} style={{ display: 'flex', alignItems: 'center', gap: GAP, marginBottom: GAP }}>
                                {/* Day label */}
                                <div
                                    style={{ width: dayLabelWidth - GAP, flexShrink: 0, fontSize: 10 }}
                                    className="text-slate-500 font-medium text-right pr-1"
                                >
                                    {DAYS[dayIdx]}
                                </div>

                                {/* Week cells */}
                                {weeks.map((week, wi) => {
                                    const cell = week[dayIdx];
                                    return (
                                        <div
                                            key={`cell-${dayIdx}-${wi}`}
                                            title={cell ? `${cell.date}: ${cell.count} interaction${cell.count !== 1 ? 's' : ''}` : ''}
                                            style={{
                                                width: CELL_SIZE,
                                                height: CELL_SIZE,
                                                flexShrink: 0,
                                                borderRadius: 3,
                                                ...(cell ? getIntensityStyle(cell.count) : { background: 'transparent' }),
                                            }}
                                            className="cursor-default transition-transform duration-200 hover:scale-150 hover:z-10"
                                        />
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-end gap-2.5 mt-2 pt-4 border-t border-border/30">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Less</span>
                <div className="flex gap-1.5">
                    {[0, 2, 5, 8, 12].map(v => (
                        <div
                            key={`legend-${v}`}
                            className="rounded-[3px]"
                            style={{ width: 12, height: 12, ...getIntensityStyle(v) }}
                        />
                    ))}
                </div>
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">More</span>
            </div>
        </div>
    );
}