import { Link } from "wouter";
import { AlertTriangle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center" data-testid="not-found-page">
      <AlertTriangle className="w-12 h-12 text-[#ff9100]/50 mb-4" />
      <h1 className="font-display text-xl font-bold text-white/80 mb-2">Signal Lost</h1>
      <p className="text-sm text-white/40 mb-6">The requested route does not exist in the Onyx system.</p>
      <Link href="/">
        <span className="text-sm text-[#00e5ff] hover:text-[#00e5ff]/80 cursor-pointer transition-colors">
          Return to Command Center
        </span>
      </Link>
    </div>
  );
}
