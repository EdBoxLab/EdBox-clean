'use client';

import { ActivityDay } from '@/lib/services/skill-score-calculator';

interface ActivityHeatmapProps {
    data: ActivityDay[];
}

function getIntensityClass(count: number): string {
    if (count === 0) return 'bg-slate-800/60';
    if (count <= 2) return 'bg-blue-900/70';
    if (count <= 5) return 'bg-blue-700/80';
    if (count <= 10) return 'bg-blue-500/90';
    return 'bg-blue-400';
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function ActivityHeatmap({ data }: ActivityHeatmapProps) {
    if (!data || data.length === 0) {
        return <div className="h-24 flex items-center justify-center text-slate-600 text-sm">No activity data yet</div>;
    }

    // Pad start so the first day lines up with the correct day of week
    const firstDate = new Date(data[0].date);
    const startDayOfWeek = firstDate.getDay(); // 0=Sun
    const padded: (ActivityDay | null)[] = [
        ...Array.from({ length: startDayOfWeek }, () => null),
        ...data
    ];

    // Build weeks
    const weeks: (ActivityDay | null)[][] = [];
    for (let i = 0; i < padded.length; i += 7) {
        weeks.push(padded.slice(i, i + 7));
    }

    // Month labels: find week index where month changes
    const monthLabels: { weekIdx: number; label: string }[] = [];
    let lastMonth = -1;
    weeks.forEach((week, wi) => {
        const firstDay = week.find(d => d !== null);
        if (firstDay) {
            const m = new Date(firstDay.date).getMonth();
            if (m !== lastMonth) {
                monthLabels.push({ weekIdx: wi, label: MONTHS[m] });
                lastMonth = m;
            }
        }
    });

    const totalEvents = data.reduce((sum, d) => sum + d.count, 0);
    const activeDays = data.filter(d => d.count > 0).length;

    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Activity</span>
                <span className="text-xs text-slate-500">{totalEvents} interactions across {activeDays} days</span>
            </div>

            <div className="overflow-x-auto">
                <div className="inline-flex flex-col gap-0 min-w-max">
                    {/* Month labels */}
                    <div className="flex gap-[3px] mb-1 ml-8">
                        {weeks.map((_, wi) => {
                            const label = monthLabels.find(m => m.weekIdx === wi);
                            return (
                                <div key={wi} className="w-3 text-[9px] text-slate-600 font-medium">
                                    {label?.label || ''}
                                </div>
                            );
                        })}
                    </div>

                    {/* Day rows */}
                    {[0, 1, 2, 3, 4, 5, 6].map(dayIdx => (
                        <div key={dayIdx} className="flex items-center gap-[3px]">
                            {/* Day label (only for Mon, Wed, Fri) */}
                            <div className="w-6 text-[9px] text-slate-600 text-right mr-1 shrink-0">
                                {dayIdx % 2 === 1 ? DAYS[dayIdx] : ''}
                            </div>
                            {weeks.map((week, wi) => {
                                const cell = week[dayIdx];
                                if (!cell) {
                                    return <div key={wi} className="w-3 h-3 rounded-[2px]" />;
                                }
                                return (
                                    <div
                                        key={wi}
                                        title={`${cell.date}: ${cell.count} interaction${cell.count !== 1 ? 's' : ''}`}
                                        className={`w-3 h-3 rounded-[2px] transition-all duration-200 hover:scale-125 hover:ring-1 hover:ring-blue-400/50 cursor-default ${getIntensityClass(cell.count)}`}
                                    />
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-2 mt-3">
                <span className="text-[10px] text-slate-600">Less</span>
                {[0, 2, 5, 8, 12].map(v => (
                    <div key={v} className={`w-3 h-3 rounded-[2px] ${getIntensityClass(v)}`} />
                ))}
                <span className="text-[10px] text-slate-600">More</span>
            </div>
        </div>
    );
}
