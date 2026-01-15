import { motion } from 'motion/react';
import { ShieldCheck, Clock, Mail } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function VCPendingPage() {
  return (
    <div className="min-h-screen bg-background">
      <section className="border-border bg-gradient-to-br from-[#C9A7EB]/20 via-background to-background border-b py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 mb-2">
              <ShieldCheck className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-semibold">VC Verification In Progress</h1>
            </div>
            <p className="text-muted-foreground">
              Thanks for applying. Our team is reviewing your credentials and will notify you once
              your VC access is approved.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-10">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <Card className="border-border/50 bg-card/60">
            <CardContent className="p-8">
              <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-3">
                  <Clock className="h-6 w-6 text-primary" />
                  <h3 className="text-lg font-semibold">Typical review time</h3>
                  <p className="text-sm text-muted-foreground">24–48 hours for most applicants.</p>
                </div>
                <div className="space-y-3">
                  <Mail className="h-6 w-6 text-primary" />
                  <h3 className="text-lg font-semibold">We’ll notify you</h3>
                  <p className="text-sm text-muted-foreground">
                    Keep an eye on your email for an approval update.
                  </p>
                </div>
                <div className="space-y-3">
                  <ShieldCheck className="h-6 w-6 text-primary" />
                  <h3 className="text-lg font-semibold">Data stays secure</h3>
                  <p className="text-sm text-muted-foreground">
                    Your details are only used for verification.
                  </p>
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button className="rounded-xl">Contact Support</Button>
                <Button variant="outline" className="rounded-xl">
                  View Application Status
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
