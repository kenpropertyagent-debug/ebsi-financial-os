import { createClient } from '@/lib/supabase/server'
import CommissionsClient from '@/components/commissions/CommissionsClient'
export const metadata = { title: 'Commission Pipeline' }

export default async function CommissionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: deals } = await supabase.from('commission_deals').select('*')
    .eq('user_id', user.id).order('created_at', { ascending: false })
  return <CommissionsClient deals={deals || []} userId={user.id} />
}
