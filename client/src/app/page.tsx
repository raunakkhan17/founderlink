import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
            F
          </div>
          <span className="font-bold text-xl tracking-tight text-blue-600 dark:text-blue-400">FounderLink</span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost">Sign In</Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">Join FounderLink</Button>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto px-6 py-16 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800 mb-6">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          FounderLink Platform Live
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-3xl leading-tight">
          Where <span className="text-blue-600 dark:text-blue-400">Founders</span> pitch and <span className="text-blue-600 dark:text-blue-400">Investors</span> discover tomorrow&apos;s unicorns.
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl">
          Showcase traction, share pitch decks, communicate in real time, and schedule investor meetings — all in one connected network.
        </p>

        <div className="mt-8 flex flex-wrap gap-4 justify-center">
          <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 text-base shadow-sm">
            I am a Founder
          </Button>
          <Button size="lg" variant="outline" className="font-medium px-6 py-3 text-base border-slate-300 dark:border-slate-700">
            I am an Investor
          </Button>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 text-left w-full">
          <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <h3 className="font-semibold text-lg mb-2 text-slate-900 dark:text-slate-100">🚀 Verified Pitch Decks</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Upload and manage secure pitch decks powered by encrypted signed URLs on Cloudflare R2 / AWS S3.
            </p>
          </div>
          <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <h3 className="font-semibold text-lg mb-2 text-slate-900 dark:text-slate-100">⚡ Real-time Deal Flow</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Real-time messaging, direct investor Q&amp;A sessions, and dynamic instant updates powered by Socket.io.
            </p>
          </div>
          <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <h3 className="font-semibold text-lg mb-2 text-slate-900 dark:text-slate-100">🔒 Role-Based Security</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Enterprise-grade dual-token JWT auth, Redis session tracking, rate limiting, and RBAC middleware.
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} FounderLink Inc. All rights reserved.
      </footer>
    </div>
  );
}
