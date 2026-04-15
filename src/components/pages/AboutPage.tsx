import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import {
  Target,
  Rocket,
  Users,
  Zap,
  Globe,
  BrainCircuit,
  ArrowRight,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

import { Card, CardContent } from '../ui/card';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

// ── Data ─────────────────────────────────────────────────────────────────────

const timeline = [
  {
    date: 'Nov 2025',
    title: 'Motif Founded',
    desc: 'Two founders, one belief: every great startup begins with a validated idea. Motif was born to give founders the AI tools they deserve.',
    color: 'from-[#C9A7EB] to-[#B084E8]',
  },
  {
    date: 'Dec 2025',
    title: 'AI Analyser Launched',
    desc: 'Shipped the first version of our AI Idea Analyser — instant market, competitor, and viability scoring for any startup concept.',
    color: 'from-[#B084E8] to-[#8B5CF6]',
  },
  {
    date: 'Jan 2026',
    title: 'Community Goes Live',
    desc: 'Founders started sharing, voting, and shaping ideas together. The community became the beating heart of the product.',
    color: 'from-[#8B5CF6] to-[#A9F5D0]',
  },
  {
    date: 'Today',
    title: 'Building the Future',
    desc: 'VC connections, funding pipelines, pitch tools — we\'re assembling every layer a founder needs to go from spark to series A.',
    color: 'from-[#A9F5D0] to-[#7FD4B3]',
  },
];

const stats = [
  {
    icon: BrainCircuit,
    value: '100K',
    suffix: '+',
    label: 'Ideas to validate',
    sub: 'Our 2026 goal',
    color: 'from-[#C9A7EB]/20 to-[#B084E8]/10',
    iconColor: 'text-[#B084E8]',
  },
  {
    icon: Globe,
    value: '50+',
    suffix: '',
    label: 'Countries represented',
    sub: 'Global founder network',
    color: 'from-[#A9F5D0]/20 to-[#7FD4B3]/10',
    iconColor: 'text-[#7FD4B3]',
  },
  {
    icon: Rocket,
    value: '24/7',
    suffix: '',
    label: 'AI-powered analysis',
    sub: 'No analyst required',
    color: 'from-[#B084E8]/20 to-[#8B5CF6]/10',
    iconColor: 'text-[#8B5CF6]',
  },
];

const values = [
  { icon: Target, text: 'Founder-first design — every feature solves a real founder pain' },
  { icon: Zap, text: 'AI that is honest, not flattering — we score ideas, not egos' },
  { icon: Users, text: 'Community intelligence beats any single expert opinion' },
  { icon: CheckCircle2, text: 'Open to every founder — experience level is irrelevant' },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function AboutPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">

      {/* ── 1. HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-border/50 bg-gradient-to-b from-[#C9A7EB]/12 via-background to-background py-24 md:py-32">
        {/* Blur blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-32 top-0 h-[500px] w-[500px] rounded-full bg-[#C9A7EB]/15 blur-[120px]" />
          <div className="absolute -right-32 bottom-0 h-[400px] w-[400px] rounded-full bg-[#A9F5D0]/10 blur-[100px]" />
        </div>

        <div className="relative mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <Badge
              variant="outline"
              className="mb-6 inline-flex items-center gap-1.5 rounded-full border-[#C9A7EB]/40 bg-[#C9A7EB]/10 px-4 py-1.5 text-xs font-medium text-[#B084E8]"
            >
              <Sparkles className="h-3 w-3" />
              Founded November 2025
            </Badge>

            <h1 className="mb-6 text-4xl font-semibold tracking-tight text-foreground md:text-5xl lg:text-6xl">
              Building the future of{' '}
              <span className="text-gradient-lavender">startup validation</span>
            </h1>

            <p className="mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
              Motif helps founders turn ideas into real, fundable startups using AI
              and community intelligence — no MBA, no connections required.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── 2. MISSION ───────────────────────────────────────────────────────── */}
      <section className="py-20 md:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 md:grid-cols-2">

            {/* Left copy */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#B084E8]">
                Our Mission
              </p>
              <h2 className="mb-5 text-3xl font-semibold tracking-tight md:text-4xl">
                Eliminate the guesswork from starting a company
              </h2>
              <p className="mb-4 leading-relaxed text-muted-foreground">
                Too many brilliant ideas never see the light of day because founders lack
                the tools to validate them properly. Motif combines AI with community
                wisdom so you can make informed, confident decisions.
              </p>
              <p className="leading-relaxed text-muted-foreground">
                Whether you're a first-time founder or a serial entrepreneur, we
                accelerate your path from spark to market — without the gatekeepers.
              </p>

              <ul className="mt-6 space-y-3">
                {values.map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#C9A7EB]/20">
                      <Icon className="h-3 w-3 text-[#B084E8]" />
                    </span>
                    <span className="text-sm leading-relaxed text-muted-foreground">{text}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Right — vision card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <div className="rounded-2xl border border-border/50 bg-muted/30 p-8 space-y-6">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-widest text-[#B084E8]">Vision</p>
                  <h3 className="text-xl font-semibold tracking-tight">A world with no wasted ideas</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    We envision a world where anyone with a great idea has the tools,
                    knowledge, and community to turn it into reality — no barriers, no
                    gatekeepers.
                  </p>
                </div>

                <div className="h-px bg-border/50" />

                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-widest text-[#7FD4B3]">5-Year Goal</p>
                  <h3 className="text-xl font-semibold tracking-tight">100,000 startups launched</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Help launch 100,000 new startups and build a global network of
                    founders who support, inspire, and learn from each other.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── 3. STATS ─────────────────────────────────────────────────────────── */}
      <section className="border-y border-border/40 bg-muted/20 py-16 md:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#B084E8]">
              Our Impact
            </p>
            <h2 className="text-3xl font-semibold tracking-tight">
              Built for founders, measured in outcomes
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {stats.map(({ icon: Icon, value, suffix, label, sub, color, iconColor }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                whileHover={{ y: -4, scale: 1.02 }}
                className="transition-all duration-300"
              >
                <Card className="h-full overflow-hidden border-border/50">
                  <CardContent className={`p-6 bg-gradient-to-br ${color}`}>
                    <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-background/60 ${iconColor}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="mb-1 flex items-end gap-0.5">
                      <span className="text-4xl font-bold tracking-tight text-foreground">
                        {value}
                      </span>
                      <span className="mb-1 text-xl font-semibold text-foreground">{suffix}</span>
                    </div>
                    <p className="text-sm font-medium text-foreground/80">{label}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. STORY TIMELINE ────────────────────────────────────────────────── */}
      <section className="py-20 md:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-14 text-center"
          >
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#B084E8]">
              Our Story
            </p>
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              The journey from idea to impact
            </h2>
          </motion.div>

          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[19px] top-0 h-full w-px bg-gradient-to-b from-[#C9A7EB]/60 via-[#A9F5D0]/60 to-transparent md:left-1/2 md:-translate-x-px" />

            <div className="space-y-10">
              {timeline.map((item, i) => (
                <motion.div
                  key={item.date}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ delay: i * 0.12, duration: 0.5 }}
                  className={`relative flex gap-6 md:gap-0 ${
                    i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                  }`}
                >
                  {/* Dot */}
                  <div className="relative z-10 mt-5 flex-shrink-0 md:absolute md:left-1/2 md:top-6 md:-translate-x-1/2">
                    <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${item.color} p-[3px] shadow-lg`}>
                      <div className="h-full w-full rounded-full bg-background" />
                    </div>
                  </div>

                  {/* Card — alternates left/right on desktop */}
                  <div className={`md:w-[46%] ${i % 2 === 0 ? 'md:ml-0' : 'md:ml-auto'}`}>
                    <motion.div
                      whileHover={{ y: -3 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Card className="group border-border/50 transition-all duration-300 hover:border-[#C9A7EB]/40 hover:shadow-lg hover:shadow-[#C9A7EB]/5">
                        <CardContent className="p-5 sm:p-6">
                          <span className={`mb-3 inline-block rounded-full bg-gradient-to-r ${item.color} px-3 py-0.5 text-xs font-bold text-white`}>
                            {item.date}
                          </span>
                          <h3 className="mb-2 text-lg font-semibold">{item.title}</h3>
                          <p className="text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. TEAM ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-t border-border/40 bg-gradient-to-br from-[#C9A7EB]/8 via-background to-[#A9F5D0]/8 py-20 md:py-24">
        {/* Ambient blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute -left-20 top-20 h-64 w-64 rounded-full bg-[#C9A7EB]/15 blur-3xl"
            animate={{ scale: [1, 1.15, 1], rotate: [0, 90, 0] }}
            transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute -right-20 bottom-20 h-64 w-64 rounded-full bg-[#A9F5D0]/15 blur-3xl"
            animate={{ scale: [1, 1.2, 1], rotate: [0, -90, 0] }}
            transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-14 text-center"
          >
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#B084E8]">
              The Team
            </p>
            <h2 className="mb-3 text-3xl font-semibold tracking-tight text-gradient-lavender md:text-4xl">
              Meet the builders
            </h2>
            <p className="mx-auto max-w-xl text-base text-muted-foreground">
              Two founders, one obsession — making startup validation accessible to everyone on earth.
            </p>
          </motion.div>

          <div className="mx-auto grid max-w-3xl grid-cols-1 gap-8 md:grid-cols-2">
            {/* Agrima */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              whileHover={{ y: -6, scale: 1.02 }}
              className="group"
            >
              <Card className="relative overflow-hidden border-2 border-transparent bg-gradient-to-br from-background to-[#C9A7EB]/5 shadow-xl transition-all duration-300 hover:border-[#C9A7EB]/40 hover:shadow-2xl hover:shadow-[#C9A7EB]/15">
                <div className="absolute inset-0 bg-gradient-to-br from-[#C9A7EB]/0 to-[#A9F5D0]/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <CardContent className="relative p-8 text-center">
                  <div className="mb-6 flex justify-center">
                    <div className="relative">
                      <div className="absolute -inset-3 rounded-full bg-gradient-to-r from-[#C9A7EB] to-[#B084E8] opacity-20 blur-xl" />
                      <Avatar className="relative h-32 w-32 border-4 border-background ring-4 ring-[#C9A7EB]/30 transition-all duration-300 group-hover:ring-[#C9A7EB]/50">
                        <AvatarFallback className="bg-gradient-to-br from-[#C9A7EB] to-[#B084E8] text-3xl font-bold text-gray-900 dark:text-white">
                          AG
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </div>
                  <h3 className="mb-2 text-xl font-bold">Agrima Gupta</h3>
                  <Badge className="mb-4 rounded-full bg-gradient-to-r from-[#C9A7EB] to-[#B084E8] px-4 py-1 text-xs font-semibold text-gray-900 shadow-md dark:text-white">
                    Co-Founder &amp; CEO
                  </Badge>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Passionate about empowering entrepreneurs with AI-driven tools. With a
                    background in product design and startup strategy, Agrima leads the vision of
                    making idea validation accessible to everyone.
                  </p>
                  <div className="absolute bottom-0 left-0 h-0.5 w-full origin-left scale-x-0 bg-gradient-to-r from-[#C9A7EB] to-[#A9F5D0] transition-transform duration-500 group-hover:scale-x-100" />
                </CardContent>
              </Card>
            </motion.div>

            {/* Awaneesh */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.15 }}
              whileHover={{ y: -6, scale: 1.02 }}
              className="group"
            >
              <Card className="relative overflow-hidden border-2 border-transparent bg-gradient-to-br from-background to-[#A9F5D0]/5 shadow-xl transition-all duration-300 hover:border-[#A9F5D0]/40 hover:shadow-2xl hover:shadow-[#A9F5D0]/15">
                <div className="absolute inset-0 bg-gradient-to-br from-[#A9F5D0]/0 to-[#C9A7EB]/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <CardContent className="relative p-8 text-center">
                  <div className="mb-6 flex justify-center">
                    <div className="relative">
                      <div className="absolute -inset-3 rounded-full bg-gradient-to-r from-[#A9F5D0] to-[#7FD4B3] opacity-20 blur-xl" />
                      <Avatar className="relative h-32 w-32 border-4 border-background ring-4 ring-[#A9F5D0]/30 transition-all duration-300 group-hover:ring-[#A9F5D0]/50">
                        <AvatarFallback className="bg-gradient-to-br from-[#A9F5D0] to-[#7FD4B3] text-3xl font-bold text-gray-900 dark:text-white">
                          AW
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </div>
                  <h3 className="mb-2 text-xl font-bold">Awaneesh Gupta</h3>
                  <Badge className="mb-4 rounded-full bg-gradient-to-r from-[#A9F5D0] to-[#7FD4B3] px-4 py-1 text-xs font-semibold text-gray-900 shadow-md dark:text-white">
                    Co-Founder &amp; CTO
                  </Badge>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    A technology enthusiast and community builder dedicated to creating platforms
                    that connect founders. Awaneesh brings expertise in AI, machine learning, and
                    building scalable systems.
                  </p>
                  <div className="absolute bottom-0 left-0 h-0.5 w-full origin-left scale-x-0 bg-gradient-to-r from-[#A9F5D0] to-[#C9A7EB] transition-transform duration-500 group-hover:scale-x-100" />
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── 6. CTA ───────────────────────────────────────────────────────────── */}
      <section className="border-t border-border/40 py-20 md:py-24">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#C9A7EB] to-[#B084E8] shadow-lg shadow-[#C9A7EB]/30 mx-auto">
              <Rocket className="h-7 w-7 text-white" />
            </div>

            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Start your journey with Motif
            </h2>
            <p className="mx-auto max-w-xl text-base leading-relaxed text-muted-foreground">
              Get AI-powered analysis, community feedback, and the tools you need
              to turn your idea into a fundable startup — in minutes.
            </p>

            <div className="flex flex-col items-center justify-center gap-3 pt-2 sm:flex-row">
              <Button
                size="lg"
                className="gradient-lavender rounded-xl px-6 shadow-lg shadow-[#C9A7EB]/20"
                onClick={() => navigate('/idea-analyser')}
              >
                <Zap className="mr-2 h-4 w-4" />
                Analyse your idea
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-xl px-6"
                onClick={() => navigate('/case-studies')}
              >
                Explore case studies
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
