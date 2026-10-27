import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-display-md text-ink sm:text-display-lg">{title}</h1>
        {description && <p className="mt-2 text-body-lg text-ink-secondary">{description}</p>}
      </div>
      {action}
    </div>
  );
}
