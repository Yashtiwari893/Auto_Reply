// Prevent static prerendering — auth pages need Supabase env vars at runtime
export const dynamic = 'force-dynamic'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
