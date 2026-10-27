import { Compass } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';

export function NotFoundPage() {
  return (
    <Card>
      <EmptyState
        icon={Compass}
        title="Page not found"
        description="The page you are looking for does not exist."
        action={
          <Link to="/" className="text-body-md text-primary hover:text-primary-deep">
            Back to accounts
          </Link>
        }
      />
    </Card>
  );
}
