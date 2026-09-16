export function StatCard({
  icon,
  value,
  label,
  border,
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  border: string;
}) {
  return (
    <div className={`bg-white rounded-lg shadow-md p-4 border-l-4 ${border}`}>
      <div className="flex items-center justify-between mb-2">
        {icon}
        <span className="text-xl font-bold text-gray-900">{value}</span>
      </div>
      <h3 className="text-xs font-medium text-gray-600">{label}</h3>
    </div>
  );
}
