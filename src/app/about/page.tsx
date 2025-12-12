import { Metadata } from 'next';
import { seoConfig } from '@/lib/seo/config';
import { FAQSchema, ArticleSchema } from '@/lib/seo/structured-data';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About EdBox - The Future of AI-Powered Learning',
  description: 'Learn about EdBox, the revolutionary AI-powered education platform transforming how students learn. Discover our mission to democratize quality education worldwide with personalized, adaptive, and engaging learning experiences.',
  keywords: [
    ...seoConfig.defaultKeywords,
    'about edbox',
    'education mission',
    'AI education platform',
    'learning technology',
    'edtech innovation',
    'personalized education',
  ],
  openGraph: {
    title: 'About EdBox - The Future of AI-Powered Learning',
    description: 'Discover how EdBox is revolutionizing education with AI-powered personalized learning',
    url: `${seoConfig.siteUrl}/about`,
  },
};

const faqData = [
  {
    question: 'What is EdBox?',
    answer: 'EdBox is the most advanced AI-powered learning platform that provides personalized education experiences. We combine cutting-edge artificial intelligence with proven pedagogical methods to create custom courses, interactive study materials, and adaptive learning paths for students of all levels.',
  },
  {
    question: 'How is EdBox different from Coursera, Udemy, or Khan Academy?',
    answer: 'Unlike traditional online learning platforms, EdBox uses advanced AI to create fully personalized learning experiences. Our 10+ specialized learning engines (MathLab, CodeStudio, BioNexus, etc.) adapt to your learning style, provide real-time AI tutoring, generate custom content, and track your skill mastery. Best of all, EdBox is completely free and accessible to everyone.',
  },
  {
    question: 'What subjects can I learn on EdBox?',
    answer: 'EdBox covers all major subjects including Mathematics, Physics, Chemistry, Biology, Computer Science, Programming, Languages, Finance, History, Writing, and Art & Design. Our AI engines can generate courses on virtually any topic you want to learn.',
  },
  {
    question: 'Is EdBox really free?',
    answer: 'Yes! EdBox is completely free to use. We believe quality education should be accessible to everyone, regardless of their financial situation. Our mission is to democratize learning and make world-class education available to all.',
  },
  {
    question: 'How does AI-powered learning work?',
    answer: 'EdBox uses state-of-the-art AI models to analyze your learning patterns, strengths, and areas for improvement. The AI creates personalized study paths, generates custom practice problems, provides instant feedback, and adapts the difficulty level in real-time to optimize your learning efficiency.',
  },
  {
    question: 'Can I create my own courses on EdBox?',
    answer: 'Absolutely! EdBox empowers both learners and educators. You can create custom courses using our 10+ specialized engines, share your knowledge with the community, and even collaborate with others in study circles. Our AI assists you in building comprehensive, engaging educational content.',
  },
  {
    question: 'Does EdBox work offline?',
    answer: 'Yes! EdBox is a Progressive Web App (PWA) that caches essential content and study materials for offline access. You can continue learning even without an internet connection, and your progress will sync automatically when you reconnect.',
  },
  {
    question: 'How does EdBox track my progress?',
    answer: 'EdBox uses a sophisticated competency-based tracking system that monitors your skill development across subjects. You earn XP, unlock achievements, and can visualize your learning journey through interactive skill graphs and progress analytics.',
  },
];

export default function AboutPage() {
  return (
    <>
      <FAQSchema questions={faqData} />
      <ArticleSchema
        title="About EdBox - The Future of AI-Powered Learning"
        description="Learn about EdBox's mission to revolutionize education"
        datePublished="2024-01-01"
        dateModified={new Date().toISOString()}
        author="EdBox Team"
      />
      
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <header className="text-center mb-16">
            <h1 className="text-5xl font-bold text-white mb-6">
              Welcome to EdBox
            </h1>
            <p className="text-xl text-blue-200">
              The Future of AI-Powered Learning
            </p>
          </header>

          <section className="mb-16 bg-white/10 backdrop-blur-sm rounded-2xl p-8">
            <h2 className="text-3xl font-bold text-white mb-6">Our Mission</h2>
            <p className="text-lg text-gray-200 mb-4">
              At EdBox, we believe that <strong className="text-blue-300">quality education should be accessible to everyone, everywhere, at any time</strong>. We're revolutionizing online learning by combining cutting-edge artificial intelligence with proven educational methodologies to create the most personalized, engaging, and effective learning platform in the world.
            </p>
            <p className="text-lg text-gray-200">
              Our mission is to <strong className="text-blue-300">democratize education</strong> and empower learners of all ages, backgrounds, and skill levels to achieve their full potential through AI-powered personalized learning experiences.
            </p>
          </section>

          <section className="mb-16 bg-white/10 backdrop-blur-sm rounded-2xl p-8">
            <h2 className="text-3xl font-bold text-white mb-6">Why EdBox?</h2>
            <div className="grid gap-6">
              <div className="border-l-4 border-blue-400 pl-6">
                <h3 className="text-xl font-semibold text-blue-300 mb-2">🤖 Advanced AI-Powered Learning</h3>
                <p className="text-gray-200">
                  Our proprietary AI analyzes your learning patterns and creates fully customized educational experiences that adapt to your unique needs, learning style, and pace.
                </p>
              </div>
              <div className="border-l-4 border-green-400 pl-6">
                <h3 className="text-xl font-semibold text-green-300 mb-2">🎯 Personalized Learning Paths</h3>
                <p className="text-gray-200">
                  No two learners are alike. EdBox generates personalized study paths based on your goals, current knowledge, and preferred learning methods.
                </p>
              </div>
              <div className="border-l-4 border-purple-400 pl-6">
                <h3 className="text-xl font-semibold text-purple-300 mb-2">🚀 10+ Specialized Learning Engines</h3>
                <p className="text-gray-200">
                  MathLab, CodeStudio, BioNexus, ChemLab, FinLab, LinguaLab, PhysicsSim, WritingStudio, HistoryMach, and ArtStudio - each optimized for its subject domain.
                </p>
              </div>
              <div className="border-l-4 border-yellow-400 pl-6">
                <h3 className="text-xl font-semibold text-yellow-300 mb-2">💡 Real-Time AI Tutoring</h3>
                <p className="text-gray-200">
                  Get instant help whenever you're stuck. Our AI tutors provide step-by-step explanations, alternative approaches, and personalized hints.
                </p>
              </div>
              <div className="border-l-4 border-pink-400 pl-6">
                <h3 className="text-xl font-semibold text-pink-300 mb-2">🌐 Completely Free & Accessible</h3>
                <p className="text-gray-200">
                  Unlike paid platforms like Coursera or Udemy, EdBox is 100% free. No hidden fees, no premium tiers - just unlimited learning for everyone.
                </p>
              </div>
              <div className="border-l-4 border-cyan-400 pl-6">
                <h3 className="text-xl font-semibold text-cyan-300 mb-2">📱 Works Offline</h3>
                <p className="text-gray-200">
                  Our Progressive Web App technology lets you learn anywhere, even without internet. Your progress syncs automatically when you reconnect.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-16 bg-white/10 backdrop-blur-sm rounded-2xl p-8">
            <h2 className="text-3xl font-bold text-white mb-6">EdBox vs. Traditional Platforms</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-gray-200">
                <thead className="border-b border-blue-400">
                  <tr>
                    <th className="pb-3">Feature</th>
                    <th className="pb-3">EdBox</th>
                    <th className="pb-3">Coursera/Udemy</th>
                    <th className="pb-3">Khan Academy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  <tr>
                    <td className="py-3">AI-Personalized Learning</td>
                    <td className="text-green-400 font-bold">✓ Advanced</td>
                    <td className="text-red-400">✗</td>
                    <td className="text-yellow-400">Limited</td>
                  </tr>
                  <tr>
                    <td className="py-3">Custom Course Creation</td>
                    <td className="text-green-400 font-bold">✓ Full Control</td>
                    <td className="text-yellow-400">Instructor Only</td>
                    <td className="text-red-400">✗</td>
                  </tr>
                  <tr>
                    <td className="py-3">Real-Time AI Tutoring</td>
                    <td className="text-green-400 font-bold">✓</td>
                    <td className="text-red-400">✗</td>
                    <td className="text-red-400">✗</td>
                  </tr>
                  <tr>
                    <td className="py-3">Adaptive Practice</td>
                    <td className="text-green-400 font-bold">✓ AI-Generated</td>
                    <td className="text-yellow-400">Static</td>
                    <td className="text-yellow-400">Limited</td>
                  </tr>
                  <tr>
                    <td className="py-3">Cost</td>
                    <td className="text-green-400 font-bold">FREE</td>
                    <td className="text-red-400">$$$</td>
                    <td className="text-green-400">FREE</td>
                  </tr>
                  <tr>
                    <td className="py-3">Offline Access</td>
                    <td className="text-green-400 font-bold">✓ Full PWA</td>
                    <td className="text-yellow-400">Limited</td>
                    <td className="text-red-400">✗</td>
                  </tr>
                  <tr>
                    <td className="py-3">Subject Coverage</td>
                    <td className="text-green-400 font-bold">Unlimited</td>
                    <td className="text-green-400">Wide</td>
                    <td className="text-yellow-400">K-12 Focus</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="mb-16 bg-white/10 backdrop-blur-sm rounded-2xl p-8">
            <h2 className="text-3xl font-bold text-white mb-6">Frequently Asked Questions</h2>
            <div className="space-y-6">
              {faqData.map((faq, index) => (
                <details key={index} className="group">
                  <summary className="text-lg font-semibold text-blue-300 cursor-pointer list-none flex items-center justify-between">
                    {faq.question}
                    <span className="text-2xl group-open:rotate-180 transition-transform">›</span>
                  </summary>
                  <p className="mt-3 text-gray-200 pl-4 border-l-2 border-blue-400">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </section>

          <section className="mb-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to Transform Your Learning?</h2>
            <p className="text-xl text-blue-100 mb-6">
              Join thousands of learners who are already experiencing the future of education with EdBox.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/signup" className="bg-white text-blue-600 px-8 py-3 rounded-lg font-bold hover:bg-blue-50 transition">
                Get Started Free
              </Link>
              <Link href="/fyp" className="bg-blue-800 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 transition">
                Explore Features
              </Link>
            </div>
          </section>

          <footer className="text-center text-gray-400">
            <p>EdBox © 2024 - Empowering learners worldwide with AI-powered education</p>
          </footer>
        </div>
      </div>
    </>
  );
}
