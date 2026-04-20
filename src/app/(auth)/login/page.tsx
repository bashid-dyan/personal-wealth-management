'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useT } from '@/lib/i18n/context'
import { LanguageToggle } from '@/components/layout/language-toggle'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Mail, Lock, Sparkles } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const t = useT()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setError(error.message); return }
      router.push('/dashboard')
    } catch {
      setError(t('auth.error_generic'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Left Hero */}
      <div
        className="relative flex w-full flex-col items-center justify-center overflow-hidden px-8 py-16 lg:w-[55%] lg:py-0"
        style={{
          background:
            'linear-gradient(135deg, #1E1B4B 0%, #4F46E5 55%, #7C3AED 100%)',
        }}
      >
        <div
          className="animate-float absolute left-[10%] top-[18%] h-64 w-64 rounded-full blur-3xl"
          style={{ backgroundColor: 'rgba(139, 92, 246, 0.35)' }}
        />
        <div
          className="animate-float-delayed absolute bottom-[12%] right-[8%] h-80 w-80 rounded-full blur-3xl"
          style={{ backgroundColor: 'rgba(6, 182, 212, 0.28)' }}
        />
        <div
          className="animate-pulse-glow absolute left-[50%] top-[55%] h-40 w-40 rounded-full blur-3xl"
          style={{ backgroundColor: 'rgba(16, 185, 129, 0.25)' }}
        />

        <div className="relative z-10 max-w-md text-center text-white">
          <div
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl font-bold text-lg"
            style={{
              background: 'rgba(255, 255, 255, 0.12)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.20)',
            }}
          >
            PWM
          </div>

          <h1 className="mt-6 text-4xl font-bold leading-tight lg:text-5xl">
            Kendali penuh atas
            <br />
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: 'linear-gradient(90deg, #67E8F9, #A5B4FC)',
              }}
            >
              keuangan pribadi
            </span>
          </h1>
          <p
            className="mt-5 text-sm lg:text-base leading-relaxed"
            style={{ color: 'rgba(255,255,255,0.75)' }}
          >
            Pantau arus kas, aset, utang, investasi, dan kekayaan bersih Anda
            dalam satu tempat.
          </p>

          <div className="mt-8 flex justify-center gap-3">
            {[
              { label: 'Cashflow', color: '#67E8F9' },
              { label: 'Investasi', color: '#6EE7B7' },
              { label: 'Aset', color: '#A5B4FC' },
            ].map((chip) => (
              <span
                key={chip.label}
                className="pill"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.10)',
                  color: chip.color,
                  border: '1px solid rgba(255,255,255,0.15)',
                  padding: '0.25rem 0.75rem',
                }}
              >
                <Sparkles className="h-3 w-3" />
                {chip.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right Form */}
      <div
        className="flex w-full items-center justify-center px-6 py-12 lg:w-[45%] lg:px-12"
        style={{ backgroundColor: 'var(--surface)' }}
      >
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-start justify-between">
            <div>
              <p className="caps">{t('auth.login_page')}</p>
              <h2
                className="text-2xl font-semibold mt-1"
                style={{ color: 'var(--ink)' }}
              >
                {t('auth.welcome_back')}
              </h2>
              <p className="mt-1 text-sm" style={{ color: 'var(--ink-muted)' }}>
                {t('auth.login_description')}
              </p>
            </div>
            <LanguageToggle />
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            {error && (
              <div
                className="flex items-center gap-2 rounded-lg border p-3 text-sm"
                style={{
                  backgroundColor: 'var(--danger-bg)',
                  borderColor: '#FECDD3',
                  color: 'var(--danger)',
                }}
              >
                {error}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">{t('auth.email')}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--ink-soft)' }} />
                <Input
                  id="email"
                  type="email"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 pl-10"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">{t('auth.password')}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--ink-soft)' }} />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 pl-10"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="mt-2 h-11 w-full text-sm font-medium"
            >
              {loading ? t('auth.processing') : t('auth.login_button')}
            </Button>

            <p className="text-center text-sm" style={{ color: 'var(--ink-muted)' }}>
              {t('auth.no_account')}{' '}
              <Link
                href="/register"
                className="font-semibold hover:underline"
                style={{ color: 'var(--indigo-600)' }}
              >
                {t('auth.register_link')}
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
