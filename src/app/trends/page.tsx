// This route is superseded by /history — redirect there
import { redirect } from 'next/navigation'

export default function TrendsPage() {
  redirect('/history')
}
