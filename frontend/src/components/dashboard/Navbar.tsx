import { Stone } from 'lucide-react'

export function Navbar() {
  return (
    <nav className="w-full h-[62px] bg-brand-navbar flex items-center px-4 md:px-8">
      <div className="flex items-center gap-[10px]">
        <Stone className="w-[22px] h-[22px] text-white"/>
        <span className="text-white text-2xl font-bold">Stone Monitoring</span>
      </div>
    </nav>
  )
}