export function getRiskColor(riskLevel: string): string {
  switch (riskLevel) {
    case 'critical':
      return 'hsl(0, 100%, 50%)';
    case 'high':
      return 'hsl(38, 100%, 50%)';
    case 'medium':
      return 'hsl(38, 92%, 50%)';
    case 'low':
      return 'hsl(142, 71%, 45%)';
    default:
      return 'hsl(210, 20%, 30%)';
  }
}

export function getRiskBgClass(riskLevel: string): string {
  switch (riskLevel) {
    case 'critical':
      return 'bg-[hsl(0,100%,50%)]';
    case 'high':
      return 'bg-[hsl(38,100%,50%)]';
    case 'medium':
      return 'bg-[hsl(38,92%,50%)]';
    case 'low':
      return 'bg-[hsl(142,71%,45%)]';
    default:
      return 'bg-[hsl(210,20%,30%)]';
  }
}

export function getRiskTextClass(riskLevel: string): string {
  switch (riskLevel) {
    case 'critical':
      return 'text-red-400';
    case 'high':
      return 'text-orange-400';
    case 'medium':
      return 'text-yellow-400';
    case 'low':
      return 'text-green-400';
    default:
      return 'text-gray-400';
  }
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toFixed(0);
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function calculateScoreColor(score: number): string {
  if (score >= 80) return 'hsl(0, 100%, 50%)';
  if (score >= 60) return 'hsl(38, 100%, 50%)';
  if (score >= 40) return 'hsl(38, 92%, 50%)';
  if (score >= 20) return 'hsl(142, 71%, 45%)';
  return 'hsl(210, 20%, 30%)';
}

export function exportToCSV(data: any[], filename: string): void {
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map((row) =>
      headers.map((header) => {
        const value = row[header];
        // Escape quotes and wrap in quotes if contains comma
        const stringValue = String(value).replace(/"/g, '""');
        return stringValue.includes(',') ? `"${stringValue}"` : stringValue;
      }).join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
