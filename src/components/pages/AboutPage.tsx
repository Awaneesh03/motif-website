import { motion } from 'motion/react';
import { Target, Rocket, Users, Award } from 'lucide-react';

import { Card, CardContent } from '../ui/card';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';

const timeline = [
  {
    year: '2025 November',
    event: 'Motif Founded',
    desc: 'Started with a vision to democratize startup validation',
  },
];

export function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="gradient-lavender relative overflow-hidden py-20">
        <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="mb-6 font-['Poppins'] text-4xl text-white md:text-5xl">
              Empowering founders to turn ideas into action
            </h1>
            <p className="mx-auto max-w-2xl text-xl text-white/90">
              We believe every great company starts with a validated idea and a supportive
              community.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission */}
      <section className="bg-background py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="mb-6">Our Mission</h2>
              <p className="text-muted-foreground mb-4">
                At Motif, we're on a mission to eliminate the guesswork from starting a
                company. Too many brilliant ideas never see the light of day because founders lack
                the tools and community to validate them properly.
              </p>
              <p className="text-muted-foreground mb-4">
                We combine cutting-edge AI technology with the wisdom of an engaged founder
                community to help you make informed decisions about your startup journey.
              </p>
              <p className="text-muted-foreground">
                Whether you're a first-time founder or a serial entrepreneur, we're here to
                accelerate your path from idea to market.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="grid grid-cols-2 gap-6"
            >
              <Card className="border-border/50">
                <CardContent className="p-6 text-center">
                  <Target className="text-primary mx-auto mb-3 h-10 w-10" />
                  <h3 className="mb-2">10,000+</h3>
                  <p className="text-muted-foreground">Ideas Validated</p>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="p-6 text-center">
                  <Users className="text-primary mx-auto mb-3 h-10 w-10" />
                  <h3 className="mb-2">50,000+</h3>
                  <p className="text-muted-foreground">Active Founders</p>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="p-6 text-center">
                  <Rocket className="text-primary mx-auto mb-3 h-10 w-10" />
                  <h3 className="mb-2">1,200+</h3>
                  <p className="text-muted-foreground">Launched Startups</p>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="p-6 text-center">
                  <Award className="text-primary mx-auto mb-3 h-10 w-10" />
                  <h3 className="mb-2">$50M+</h3>
                  <p className="text-muted-foreground">Funding Raised</p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Story Timeline */}
      <section className="bg-muted/30 py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <h2 className="mb-4">Our Story</h2>
            <p className="text-muted-foreground">The journey from idea to impact</p>
          </motion.div>
          <div className="space-y-8">
            {timeline.map((item, index) => (
              <motion.div
                key={item.year}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex gap-6"
              >
                <div className="flex-shrink-0">
                  <div className="gradient-lavender flex h-24 w-24 items-center justify-center rounded-2xl font-['Poppins'] text-white">
                    {item.year}
                  </div>
                </div>
                <Card className="border-border/50 flex-1">
                  <CardContent className="p-6">
                    <h3 className="mb-2">{item.event}</h3>
                    <p className="text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Vision */}
      <section className="bg-muted/30 py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="mb-6">Our Vision for the Future</h2>
            <p className="text-muted-foreground mb-4">
              We envision a world where anyone with a great idea has the tools, knowledge, and
              community to turn it into reality. No barriers, no gatekeepers—just pure innovation
              powered by AI and human collaboration.
            </p>
            <p className="text-muted-foreground">
              In the next five years, we aim to help launch 100,000 new startups and create a global
              network of founders who support, inspire, and learn from each other.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Meet Our Team */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#C9A7EB]/10 via-background to-[#A9F5D0]/10 py-20">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute -left-20 top-20 h-64 w-64 rounded-full bg-gradient-to-br from-[#C9A7EB]/20 to-transparent blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <motion.div
            className="absolute -right-20 bottom-20 h-64 w-64 rounded-full bg-gradient-to-br from-[#A9F5D0]/20 to-transparent blur-3xl"
            animate={{
              scale: [1, 1.3, 1],
              rotate: [0, -90, 0],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="mb-4 text-gradient-lavender">Meet Our Team</h2>
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-muted-foreground mx-auto max-w-2xl text-lg"
            >
              The passionate minds behind Motif, working to empower founders worldwide
            </motion.p>
          </motion.div>

          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-2">
            {/* Agrima Gupta */}
            <motion.div
              initial={{ opacity: 0, x: -50, rotateY: -15 }}
              whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="group"
            >
              <Card className="relative overflow-hidden border-2 border-transparent bg-gradient-to-br from-white to-[#C9A7EB]/5 shadow-xl transition-all duration-300 hover:border-[#C9A7EB]/50 hover:shadow-2xl hover:shadow-[#C9A7EB]/20 dark:from-card dark:to-[#C9A7EB]/10">
                {/* Animated gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#C9A7EB]/0 via-[#C9A7EB]/5 to-[#A9F5D0]/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                <CardContent className="relative p-8 text-center">
                  <motion.div
                    className="mb-6 flex justify-center"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <div className="relative">
                      <motion.div
                        className="absolute -inset-4 rounded-full bg-gradient-to-r from-[#C9A7EB] to-[#B084E8] opacity-20 blur-xl"
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [0.2, 0.3, 0.2],
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                      />
                      <Avatar className="relative h-40 w-40 border-4 border-white ring-4 ring-[#C9A7EB]/30 transition-all duration-300 group-hover:border-[#C9A7EB] group-hover:ring-[#C9A7EB]/50 dark:border-card">
                        <AvatarFallback className="bg-gradient-to-br from-[#C9A7EB] to-[#B084E8] text-4xl font-bold text-gray-900 dark:text-white">
                          AG
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </motion.div>

                  <motion.h3
                    className="mb-3 text-2xl font-bold"
                    whileHover={{ scale: 1.05 }}
                  >
                    Agrima Gupta
                  </motion.h3>

                  <motion.div
                    className="mb-4 inline-block"
                    whileHover={{ scale: 1.1 }}
                  >
                    <Badge className="rounded-full bg-gradient-to-r from-[#C9A7EB] to-[#B084E8] px-4 py-1 text-sm font-semibold text-gray-900 shadow-lg dark:text-white">
                      Founder
                    </Badge>
                  </motion.div>

                  <p className="text-muted-foreground leading-relaxed">
                    Passionate about empowering entrepreneurs with AI-driven tools. With a
                    background in product design and startup strategy, Agrima leads the vision of
                    making idea validation accessible to everyone.
                  </p>

                  {/* Decorative bottom accent */}
                  <motion.div
                    className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-[#C9A7EB] to-[#A9F5D0]"
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                  />
                </CardContent>
              </Card>
            </motion.div>

            {/* Awaneesh Gupta */}
            <motion.div
              initial={{ opacity: 0, x: 50, rotateY: 15 }}
              whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="group"
            >
              <Card className="relative overflow-hidden border-2 border-transparent bg-gradient-to-br from-white to-[#A9F5D0]/5 shadow-xl transition-all duration-300 hover:border-[#A9F5D0]/50 hover:shadow-2xl hover:shadow-[#A9F5D0]/20 dark:from-card dark:to-[#A9F5D0]/10">
                {/* Animated gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#A9F5D0]/0 via-[#A9F5D0]/5 to-[#C9A7EB]/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                <CardContent className="relative p-8 text-center">
                  <motion.div
                    className="mb-6 flex justify-center"
                    whileHover={{ scale: 1.1, rotate: -5 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <div className="relative">
                      <motion.div
                        className="absolute -inset-4 rounded-full bg-gradient-to-r from-[#A9F5D0] to-[#7FD4B3] opacity-20 blur-xl"
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [0.2, 0.3, 0.2],
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: 'easeInOut',
                          delay: 0.5,
                        }}
                      />
                      <Avatar className="relative h-40 w-40 border-4 border-white ring-4 ring-[#A9F5D0]/30 transition-all duration-300 group-hover:border-[#A9F5D0] group-hover:ring-[#A9F5D0]/50 dark:border-card">
                        <AvatarFallback className="bg-gradient-to-br from-[#A9F5D0] to-[#7FD4B3] text-4xl font-bold text-gray-900 dark:text-white">
                          AW
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </motion.div>

                  <motion.h3
                    className="mb-3 text-2xl font-bold"
                    whileHover={{ scale: 1.05 }}
                  >
                    Awaneesh Gupta
                  </motion.h3>

                  <motion.div
                    className="mb-4 inline-block"
                    whileHover={{ scale: 1.1 }}
                  >
                    <Badge className="rounded-full bg-gradient-to-r from-[#A9F5D0] to-[#7FD4B3] px-4 py-1 text-sm font-semibold text-gray-900 shadow-lg dark:text-white">
                      Co-Founder
                    </Badge>
                  </motion.div>

                  <p className="text-muted-foreground leading-relaxed">
                    A technology enthusiast and community builder dedicated to creating platforms
                    that connect founders. Awaneesh brings expertise in AI, machine learning, and
                    building scalable systems.
                  </p>

                  {/* Decorative bottom accent */}
                  <motion.div
                    className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-[#A9F5D0] to-[#C9A7EB]"
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                  />
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
