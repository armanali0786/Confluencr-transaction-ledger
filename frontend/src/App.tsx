import { Route, Routes } from 'react-router-dom';

import { AppLayout } from '@/components/layout/app-layout';
import { AccountDetailPage } from '@/pages/account-detail-page';
import { AccountsPage } from '@/pages/accounts-page';
import { NotFoundPage } from '@/pages/not-found-page';
import { TransferPage } from '@/pages/transfer-page';

export function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<AccountsPage />} />
        <Route path="accounts/:accountId" element={<AccountDetailPage />} />
        <Route path="transfer" element={<TransferPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
