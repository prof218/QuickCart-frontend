import { Suspense } from 'react';
import OrderDetail from './OrderDetail';
import LoadingState from '@/components/states/LoadingState';

async function ParamResolver({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <OrderDetail id={id} />;
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<LoadingState label="Loading order…" />}>
      <ParamResolver params={params} />
    </Suspense>
  );
}
