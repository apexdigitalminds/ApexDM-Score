import React from 'react';

const RetentionChartPlaceholder: React.FC = () => {
    const weeks = ['Week 0', 'Week 1', 'Week 2', 'Week 3', 'Week 4'];
    const cohorts = [
        { date: 'Jun 10 - Jun 16', values: [100, 88, 75, 68, 60] },
        { date: 'Jun 17 - Jun 23', values: [100, 91, 80, 71] },
        { date: 'Jun 24 - Jun 30', values: [100, 85, 72] },
        { date: 'Jul 1 - Jul 7', values: [100, 93] },
        { date: 'Jul 8 - Jul 14', values: [100] },
    ];
    
    const getColor = (value: number) => {
        if (value > 85) return 'bg-teal-500';
        if (value > 70) return 'bg-teal-600';
        if (value > 55) return 'bg-teal-700';
        if (value > 0) return 'bg-teal-800';
        return 'bg-slate-700';
    };

    return (
        <div className="mt-4 p-4 bg-slate-700/30 rounded-lg overflow-x-auto">
            <table className="w-full text-sm text-left border-separate border-spacing-1">
                <thead>
                    <tr>
                        <th className="p-2 font-normal text-slate-400">Cohort</th>
                        {weeks.map(week => (
                            <th key={week} className="p-2 font-normal text-slate-400 text-center w-1/6">{week}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {cohorts.map(cohort => (
                        <tr key={cohort.date}>
                            <td className="p-2 text-slate-300">{cohort.date}</td>
                            {cohort.values.map((value, index) => (
                                <td 
                                    key={index}
                                    className={`p-2 rounded text-white text-center font-semibold ${getColor(value)}`}
                                >
                                    {value}%
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default RetentionChartPlaceholder;