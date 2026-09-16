import { redirect } from 'next/navigation';

// This bare route was always an empty stub with no implementation and
// nothing else in the app links to it. The real page lives at
// /admin/prebid-queries.
export default function PrebidQueryRedirect() {
  redirect('/admin/prebid-queries');
}
