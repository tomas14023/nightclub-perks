import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AmberBackdrop } from "@/components/AmberBackdrop";
import { Brand } from "@/components/Brand";
import { QrCode, Wine, BarChart3, ShieldCheck } from "lucide-react";

const Index = () => {
  return (
    <>
      <AmberBackdrop />
      <main className="min-h-dvh flex flex-col">
        {/* Top bar */}
        <header className="container flex items-center justify-between py-6">
          <Brand label="Velvet" />
          <nav className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/auth">Staff Login</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/c/nocturne">Demo Check-in</Link>
            </Button>
          </nav>
        </header>

        {/* Hero */}
        <section className="container flex-1 flex flex-col items-center justify-center text-center py-20">
          <span className="inline-block text-primary tracking-luxe text-xs uppercase mb-8 animate-fade-up">
            QR Benefits Platform
          </span>
          <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl text-foreground max-w-4xl text-balance leading-[0.95] animate-fade-up">
            Scan. Get the code.<br />
            <span className="text-gold italic">Slip past the rope.</span>
          </h1>
          <p className="mt-8 max-w-xl text-muted-foreground text-lg leading-relaxed animate-fade-up">
            A frictionless check-in system for nightclubs. Customers scan, claim a perk, and redeem at the bar in seconds.
          </p>
          <div className="mt-10 flex flex-wrap gap-3 justify-center animate-fade-up">
            <Button asChild variant="gold" size="lg">
              <Link to="/c/nocturne">Try the Check-in</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/auth">Open Dashboard</Link>
            </Button>
          </div>
        </section>

        {/* Feature trio */}
        <section className="container grid grid-cols-1 md:grid-cols-3 gap-px bg-border/40 border-y border-border/40 mb-16 rounded-2xl overflow-hidden">
          {[
            { icon: QrCode, title: "QR Check-in", text: "Customer scans, enters phone, gets a code in under 10 seconds." },
            { icon: Wine, title: "Bar Validator", text: "Staff types code, taps validate, marks redeemed. Under 5 seconds." },
            { icon: BarChart3, title: "CRM & Campaigns", text: "Track visits, build a database, blast WhatsApp invites." },
          ].map((f) => (
            <div key={f.title} className="bg-card p-8 flex flex-col gap-4">
              <f.icon className="text-primary" size={28} />
              <h3 className="font-serif text-2xl">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.text}</p>
            </div>
          ))}
        </section>

        <footer className="container pb-8 flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground tracking-wider-luxe uppercase">
          <span className="flex items-center gap-2"><ShieldCheck size={14} /> Built on Lovable Cloud</span>
          <span>21+ Only · Strict Door Policy</span>
        </footer>
      </main>
    </>
  );
};

export default Index;
