export const PageHeader = ({ title, subtitle, action }) => (
  <div className="flex items-start justify-between">
    <div>
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
    </div>
    {action && <div>{action}</div>}
  </div>
);
