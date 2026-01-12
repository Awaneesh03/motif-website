import { motion } from 'motion/react';
import { Lightbulb, Target, Rocket, BarChart3, FileText } from 'lucide-react';

import { Button } from '../ui/button';
import { ImageWithFallback } from '../figma/ImageWithFallback';

const tools = [
  {
    icon: Lightbulb,
    title: 'AI Idea Analyzer',
    description:
      'Get comprehensive analysis of your startup idea including market potential, competitive landscape, and viability scores. Our AI considers hundreds of data points to give you actionable insights.',
    image: 'https://images.unsplash.com/photo-1752650733352-aa3e47a1f3d6?w=600&h=400&fit=crop',
  },
  {
    icon: Target,
    title: 'Market Fit Finder',
    description:
      'Discover your ideal customer profile, understand market size, and identify the perfect positioning for your product. Get detailed demographic and psychographic insights powered by real market data.',
    image: 'https://images.unsplash.com/photo-1759884247134-89b8fc25f726?w=600&h=400&fit=crop',
  },
  {
    icon: Rocket,
    title: 'Prototype Generator',
    description:
      'Transform your idea into visual prototypes, wireframes, and mockups. Our AI understands your concept and generates professional-looking designs that you can share with stakeholders.',
    image: 'https://images.unsplash.com/photo-1758876022213-fbf6e54ad52e?w=600&h=400&fit=crop',
  },
  {
    icon: BarChart3,
    title: 'SWOT Planner',
    description:
      'Automatically generate detailed SWOT analysis for your startup idea. Understand your strengths, weaknesses, opportunities, and threats before you invest time and resources.',
    image: 'https://images.unsplash.com/photo-1758873268631-fa944fc5cad2?w=600&h=400&fit=crop',
  },
  {
    icon: FileText,
    title: 'Pitch Deck Assistant',
    description:
      'Create investor-ready pitch decks in minutes. Our AI helps structure your story, suggests compelling content, and generates professional slides based on proven frameworks.',
    image: 'https://images.unsplash.com/photo-1749068372588-39d41a281e22?w=600&h=400&fit=crop',
  },
];

export function FeaturesPage() {
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
              Powerful Tools for Every Stage
            </h1>
            <p className="mx-auto max-w-2xl text-xl text-white/90">
              From initial concept to investor pitch, we've got you covered with AI-powered tools
            </p>
          </motion.div>
        </div>
      </section>

      {/* Tools Showcase */}
      <section className="bg-background py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="space-y-32">
            {tools.map((tool, index) => (
              <motion.div
                key={tool.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className={`grid items-center gap-12 md:grid-cols-2 ${
                  index % 2 === 1 ? 'md:flex-row-reverse' : ''
                }`}
              >
                {index % 2 === 0 ? (
                  <>
                    <div className="space-y-6">
                      <div className="from-primary/10 to-secondary/10 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br">
                        <tool.icon className="text-primary h-8 w-8" />
                      </div>
                      <h2>{tool.title}</h2>
                      <p className="text-muted-foreground text-lg">{tool.description}</p>
                      <Button className="gradient-lavender shadow-lavender rounded-[16px] hover:opacity-90">
                        Try It Now
                      </Button>
                    </div>
                    <div className="relative">
                      <div className="bg-primary/20 absolute inset-0 rounded-3xl blur-3xl"></div>
                      <ImageWithFallback
                        src={tool.image}
                        alt={tool.title}
                        className="relative h-auto w-full rounded-3xl shadow-2xl"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="relative md:order-1">
                      <div className="bg-primary/20 absolute inset-0 rounded-3xl blur-3xl"></div>
                      <ImageWithFallback
                        src={tool.image}
                        alt={tool.title}
                        className="relative h-auto w-full rounded-3xl shadow-2xl"
                      />
                    </div>
                    <div className="space-y-6 md:order-2">
                      <div className="bg-primary/10 flex h-16 w-16 items-center justify-center rounded-2xl">
                        <tool.icon className="text-primary h-8 w-8" />
                      </div>
                      <h2>{tool.title}</h2>
                      <p className="text-muted-foreground text-lg">{tool.description}</p>
                      <Button className="gradient-lavender shadow-lavender rounded-[16px] hover:opacity-90">
                        Try It Now
                      </Button>
                    </div>
                  </>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="gradient-lavender relative overflow-hidden py-16">
        <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-4 text-white">Ready to validate your idea?</h2>
          <p className="mb-8 text-white/90">Start using all features for free today</p>
          <Button size="lg" className="text-primary rounded-full bg-white px-8 hover:bg-white/90">
            Get Started Free
          </Button>
        </div>
      </section>
    </div>
  );
}
