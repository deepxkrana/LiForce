import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Clock, Send, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';

const ContactUs: React.FC = () => {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate submission
    setSubmitted(true);
  };

  const contacts = [
    {
      icon: <Mail className="w-5 h-5 text-primary" />,
      label: 'Email',
      value: 'support@liforce.in',
      href: 'mailto:support@liforce.in',
    },
    {
      icon: <Phone className="w-5 h-5 text-primary" />,
      label: 'Helpline',
      value: '1800-LIFORCE (toll-free)',
      href: 'tel:18005436723',
    },
    {
      icon: <MapPin className="w-5 h-5 text-primary" />,
      label: 'Address',
      value: 'Sector 17, Chandigarh, India — 160017',
      href: '#',
    },
    {
      icon: <Clock className="w-5 h-5 text-primary" />,
      label: 'Support Hours',
      value: 'Mon – Sat, 9 AM – 6 PM IST',
      href: '#',
    },
  ];

  return (
    <div className="min-h-screen bg-background pt-24 pb-20">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary via-[#962D22] to-[#6B1A12] py-20 px-4 text-white text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.08),transparent_60%)]" />
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative max-w-2xl mx-auto"
        >
          <div className="flex justify-center mb-5">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-xl">
              <MessageSquare className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-3">Contact Us</h1>
          <p className="text-lg text-white/80 leading-relaxed">
            Have a question, feedback, or need help? We'd love to hear from you. Reach out and our team will get back to you promptly.
          </p>
        </motion.div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-14">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h2 className="text-2xl font-black text-text-primary mb-6">Get in touch</h2>
            <div className="space-y-4 mb-8">
              {contacts.map((c, i) => (
                <a
                  key={i}
                  href={c.href}
                  className="flex items-start gap-4 bg-white rounded-xl border border-border shadow-sm p-4 hover:border-primary/50 hover:shadow-md transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary-light flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                    {c.icon}
                  </div>
                  <div>
                    <p className="text-xs text-text-secondary font-medium">{c.label}</p>
                    <p className="text-sm font-bold text-text-primary mt-0.5">{c.value}</p>
                  </div>
                </a>
              ))}
            </div>

            <div className="bg-gradient-to-r from-[#FFF5F5] to-[#FFF0EE] border border-primary/20 rounded-2xl p-5">
              <p className="text-sm font-bold text-primary mb-1">🩸 Blood Emergency?</p>
              <p className="text-xs text-text-secondary leading-relaxed">
                For critical blood requests, please use the{' '}
                <Link to="/emergency" className="text-primary font-semibold hover:underline">
                  Emergency Request
                </Link>{' '}
                feature for real-time matching. Do not rely solely on this contact form in emergencies.
              </p>
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {submitted ? (
              <div className="h-full flex flex-col items-center justify-center text-center bg-white rounded-2xl border border-border shadow-sm p-10">
                <div className="w-16 h-16 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center mb-4">
                  <Send className="w-7 h-7 text-accent" />
                </div>
                <h3 className="text-xl font-black text-text-primary mb-2">Message Sent! 🎉</h3>
                <p className="text-text-secondary text-sm leading-relaxed">
                  Thank you for reaching out. Our team will respond to <span className="font-semibold text-primary">{form.email}</span> within 24 hours.
                </p>
                <button
                  type="button"
                  onClick={() => { setSubmitted(false); setForm({ name: '', email: '', subject: '', message: '' }); }}
                  className="mt-6 text-sm text-primary font-bold hover:underline"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-border shadow-sm p-6 space-y-4">
                <h2 className="text-2xl font-black text-text-primary mb-2">Send a message</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">Your Name</label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="Aarav Singh"
                      className="w-full border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="you@example.com"
                      className="w-full border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Subject</label>
                  <input
                    type="text"
                    required
                    value={form.subject}
                    onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                    placeholder="How can we help?"
                    className="w-full border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Message</label>
                  <textarea
                    required
                    rows={5}
                    value={form.message}
                    onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                    placeholder="Describe your issue or feedback in detail..."
                    className="w-full border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-primary text-white font-bold py-3 rounded-xl hover:bg-primary/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" /> Send Message
                </button>
              </form>
            )}
          </motion.div>
        </div>

        <div className="text-center mt-10">
          <Link to="/" className="inline-block text-primary font-bold hover:underline text-sm">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;
