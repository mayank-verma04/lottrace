export const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    {Icon && <Icon className="h-12 w-12 text-muted-foreground mb-4" />}
    <h3 className="text-base font-semibold text-gray-900">{title}</h3>
    <p className="mt-1 text-sm text-muted-foreground max-w-sm">{description}</p>
    {action && <div className="mt-4">{action}</div>}
  </div>
);
