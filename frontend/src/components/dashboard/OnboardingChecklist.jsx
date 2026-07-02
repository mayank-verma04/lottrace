import { CheckCircle2, Circle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';

export function OnboardingChecklist({ stats }) {
  if (!stats) return null;

  const steps = [
    {
      id: 'location',
      label: 'Add your first location',
      isCompleted: stats.activeLocations > 0,
      href: '/locations'
    },
    {
      id: 'product',
      label: 'Add your first product',
      isCompleted: stats.activeProducts > 0,
      href: '/products'
    },
    {
      id: 'user',
      label: 'Invite a teammate',
      isCompleted: stats.totalUsers > 1,
      href: '/settings/users'
    },
    {
      id: 'event',
      label: 'Record your first event',
      isCompleted: stats.totalEvents > 0,
      href: '/events/record'
    }
  ];

  const completedSteps = steps.filter(s => s.isCompleted).length;
  const totalSteps = steps.length;
  const progress = (completedSteps / totalSteps) * 100;

  // Hide entirely if 100% complete so it doesn't clutter the dashboard
  if (completedSteps === totalSteps) {
    return null;
  }

  return (
    <Card className="mb-6 border-indigo-200 bg-indigo-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex justify-between items-center">
          <span>Getting Started</span>
          <span className="text-sm font-normal text-muted-foreground">
            {completedSteps} of {totalSteps} completed
          </span>
        </CardTitle>
        <Progress value={progress} className="h-2 mt-2" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {steps.map((step) => (
            <Link
              key={step.id}
              to={step.href}
              className={`flex items-center gap-3 p-3 rounded-md transition-colors ${
                step.isCompleted 
                  ? 'bg-transparent cursor-default'
                  : 'bg-white hover:bg-gray-50 border shadow-sm'
              }`}
              onClick={(e) => {
                if (step.isCompleted) {
                  e.preventDefault();
                }
              }}
            >
              {step.isCompleted ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <Circle className="h-5 w-5 text-gray-300" />
              )}
              <span
                className={`text-sm font-medium ${
                  step.isCompleted ? 'text-gray-400 line-through' : 'text-gray-900'
                }`}
              >
                {step.label}
              </span>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
