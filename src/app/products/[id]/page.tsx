import { Suspense } from 'react';
import ProductDetails from './ProductDetails';
import LoadingState from '@/components/states/LoadingState';

// Resolves the dynamic route param on the server, then hands the id to the client
// component. Wrapped in <Suspense> so the static shell prerenders (Cache Components)
// and the param-dependent content streams in.
async function ParamResolver({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProductDetails id={id} />;
}

export default function ProductDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<LoadingState label="Loading product…" />}>
      <ParamResolver params={params} />
    </Suspense>
  );
}
