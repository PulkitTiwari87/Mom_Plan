"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Brain,
  FileCheck,
  LayoutDashboard,
  Bell,
  HeadphonesIcon,
  ArrowRight,
  CheckCircle2,
  Star,
  Shield,
  Zap,
  Users,
  TrendingUp,
  Heart,
  ChevronRight,
  FileText,
  Check,
  Sparkles,
  BookOpen,
  Sprout,
  Building2,
  Globe2,
  Landmark,
  Minus,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { PricingCta } from "@/components/landing/PricingCta";
import { HeroCarousel } from "@/components/landing/HeroCarousel";

type PricingFeature = {
  text: string;
  included: boolean;
};

type PricingPlan = {
  name: string;
  planId: "community" | "partner" | "network" | "enterprise";
  icon: LucideIcon;
  price: string;
  period?: string;
  description: string;
  billing?: string;
  seatPill?: string;
  featureHeader: string;
  features: PricingFeature[];
  cta: string;
  href: string;
  popular?: boolean;
  badge?: string;
  ctaVariant?: "outline" | "solid";
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: "easeOut" },
  }),
};

// Static icon color classes themed to match the design system
const featureIconClasses = [
  "bg-primary-50 text-primary-600",
  "bg-secondary-50 text-secondary-600",
  "bg-emerald-50 text-emerald-600",
  "bg-amber-50 text-amber-600",
  "bg-blue-50 text-blue-600",
  "bg-primary-100 text-primary-700",
];

const features = [
  {
    icon: Brain,
    title: "Smart Eligibility Engine",
    description:
      "Our AI algorithm scans over 200 state and federal programs simultaneously. Enter your details once, find everything you qualify for instantly.",
  },
  {
    icon: FileCheck,
    title: "Step-by-Step Applications",
    description:
      "We pre-fill up to 80% of application forms using your profile data, saving you hours of repetitive data entry.",
  },
  {
    icon: LayoutDashboard,
    title: "Unified Benefits Tracker",
    description:
      "One dashboard to see the status of every application, from submission to final approval.",
  },
  {
    icon: Bell,
    title: "Zero Missed Deadlines",
    description:
      "Automated SMS and email alerts ensure you never miss a renewal window or a request for additional documentation.",
  },
  {
    icon: HeadphonesIcon,
    title: "Expert Support",
    description:
      "Real case managers available via chat to help you navigate complex denials or appeals processes.",
  },
  {
    icon: Shield,
    title: "Bank-Level Security",
    description:
      "HIPAA-compliant encryption protects your sensitive family information at every step.",
  },
];

const steps = [
  {
    number: "01",
    title: "Tell Us Your Story",
    description: "Securely input basic family and income information in our intake tool.",
    icon: Users,
  },
  {
    number: "02",
    title: "See Your Matches",
    description: "Review a personalized list of programs with estimated monthly value.",
    icon: Brain,
  },
  {
    number: "03",
    title: "Apply in One Click",
    description: "Submit multiple applications at once with our concierge service.",
    icon: Zap,
  },
];

const testimonials = [
  {
    quote:
      "I never knew I qualified for child care assistance. MomPlan found the program and helped me apply. It saved our family $600 a month.",
    author: "Maria S.",
    location: "Texas",
    stars: 5,
    program: "CCAP",
  },
  {
    quote:
      "The deadline alerts are a lifesaver. Before MomPlan, I'd always forget to renew my SNAP benefits until they were cut off. Never again.",
    author: "Jessica T.",
    location: "Ohio",
    stars: 5,
    program: "SNAP",
  },
  {
    quote:
      "Having an expert to chat with during my appeal was incredible. They knew exactly which documents I needed to submit. Highly recommend!",
    author: "Priya M.",
    location: "California",
    stars: 5,
    program: "Medicaid",
  },
];

const pricingPlans: PricingPlan[] = [
  {
    name: "Community",
    planId: "community",
    icon: Sprout,
    price: "$0",
    period: "/month",
    description: "For small grassroots orgs & DV shelters getting started",
    billing: "Free forever for qualifying 501(c)(3)s",
    seatPill: "Up to 2 caseworker seats · 50 active cases/mo",
    featureHeader: "INCLUDES",
    features: [
      { text: "Basic caseworker case queue", included: true },
      { text: "Mother profile viewer", included: true },
      { text: "Application status tracking", included: true },
      { text: "Renewal deadline alerts", included: true },
      { text: "Referral send (no inbox)", included: true },
      { text: "Admin dashboard", included: false },
      { text: "Outcomes reporting", included: false },
      { text: "Custom report export", included: false },
    ],
    cta: "Apply free",
    href: "/register?plan=community",
    ctaVariant: "outline",
  },
  {
    name: "Partner org",
    planId: "partner",
    icon: Building2,
    price: "$299",
    period: "/month",
    badge: "Most common",
    description: "For established nonprofits with active caseworker teams",
    billing: "Billed annually ($3,588/yr) · $349 month-to-month",
    seatPill: "Up to 8 caseworker seats · $35/seat/mo additional",
    featureHeader: "EVERYTHING IN COMMUNITY, PLUS",
    features: [
      { text: "Full caseworker dashboard", included: true },
      { text: "Organization admin dashboard", included: true },
      { text: "Outcomes reporting (mothers served, $ unlocked)", included: true },
      { text: "Two-way referral network access", included: true },
      { text: "SMS renewal reminders for mothers", included: true },
      { text: "Program performance breakdown", included: true },
      { text: "Standard data export (CSV)", included: true },
      { text: "Custom report builder", included: false },
    ],
    cta: "Get started",
    href: "/register?plan=partner",
    popular: true,
    ctaVariant: "outline",
  },
  {
    name: "Network",
    planId: "network",
    icon: Globe2,
    price: "$749",
    period: "/month",
    description: "For multi-site orgs, coalitions & legal aid networks",
    billing: "Billed annually ($8,988/yr) · $899 month-to-month",
    seatPill: "Up to 20 caseworker seats · $30/seat/mo additional",
    featureHeader: "EVERYTHING IN PARTNER, PLUS",
    features: [
      { text: "Unlimited active cases", included: true },
      { text: "Custom report builder", included: true },
      { text: "Multi-site / branch management", included: true },
      { text: "Referral network map & analytics", included: true },
      { text: "Funder-ready grant report exports", included: true },
      { text: "Priority email & phone support", included: true },
      { text: "Dedicated onboarding session", included: true },
      { text: "Research data dashboard", included: false },
    ],
    cta: "Get Network",
    href: "/register?plan=network",
    ctaVariant: "solid",
  },
  {
    name: "Government & enterprise",
    planId: "enterprise",
    icon: Landmark,
    price: "Custom",
    description: "For state agencies, county human services & health systems",
    billing: "Annual contract - typically $24K–$75K/yr",
    seatPill: "Unlimited seats · State-wide deployment",
    featureHeader: "EVERYTHING IN NETWORK, PLUS",
    features: [
      { text: "Research data dashboard (WISER access)", included: true },
      { text: "Geographic needs heatmap", included: true },
      { text: "Demographic breakdown by race & geography", included: true },
      { text: "Data Export API for agency systems", included: true },
      { text: "Custom eligibility rules for your state", included: true },
      { text: "SLA-backed uptime guarantee", included: true },
      { text: "Dedicated implementation manager", included: true },
    ],
    cta: "Contact us",
    href: "/contact",
    ctaVariant: "outline",
  },
];

function PricingFeatureIcon({ included }: { included: boolean }) {
  if (included) {
    return (
      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-50 mt-0.5">
        <Check className="h-2.5 w-2.5 text-emerald-600" strokeWidth={3} />
      </span>
    );
  }

  return (
    <span className="flex h-4 w-4 shrink-0 items-center justify-center mt-0.5">
      <Minus className="h-3 w-3 text-outline-variant" strokeWidth={2} />
    </span>
  );
}

const stats = [
  { value: "200+", label: "Federal & State Programs" },
  { value: "$8,400", label: "Avg. Monthly Benefits Found" },
  { value: "94%", label: "Eligibility Match Rate" },
  { value: "52,000+", label: "Families Helped" },
];

// Reusable CTA link styled like a primary button — avoids asChild + multi-child issue
function PrimaryLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg px-8 py-3.5 text-base font-semibold text-white",
        "bg-gradient-primary shadow-primary hover:shadow-primary-lg",
        "transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400",
        className
      )}
    >
      {children}
    </Link>
  );
}

function GhostLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg px-8 py-3.5 text-base font-semibold",
        "text-on-surface hover:bg-surface-container-high transition-all duration-200",
        className
      )}
    >
      {children}
    </Link>
  );
}

export default function LandingPage() {
  return (
    <main className="overflow-hidden" suppressHydrationWarning>
      <HeroCarousel />

      {/* ── Hero ── */}
      <section className="relative flex min-h-[calc(100vh-240px)] items-center justify-center pb-16 pt-12 sm:min-h-[calc(100vh-320px)] md:min-h-[calc(100vh-400px)] lg:min-h-[calc(100vh-460px)]">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="absolute top-20 right-0 w-[600px] h-[600px] bg-primary-100/40 rounded-full blur-[120px] -translate-y-1/4 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-secondary-100/30 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative container-max section-padding text-center">
          {/* Pill Badge */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 border border-primary-200 text-primary-700 text-sm font-medium mb-8"
          >
            <Zap className="w-3.5 h-3.5" />
            AI-Powered Benefits Eligibility Scanning
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={1}
            className="font-display font-bold text-5xl sm:text-6xl lg:text-7xl text-on-surface leading-tight mb-6 max-w-4xl mx-auto"
          >
            Find Every Benefit
            <br />
            <span className="text-gradient">Your Family Deserves</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={2}
            className="text-xl text-on-surface-variant max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            MomPlan scans 200+ federal and state programs to match you with{" "}
            <strong className="text-on-surface">thousands in hidden benefits</strong>. From
            childcare subsidies to nutrition assistance, we handle the complexity so you can
            focus on family.
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={3}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <PrimaryLink href="/eligibility">
              Scan My Eligibility Free
              <ArrowRight className="w-5 h-5" />
            </PrimaryLink>
            <GhostLink href="#how-it-works">
              How it Works
              <ChevronRight className="w-5 h-5" />
            </GhostLink>
          </motion.div>

          {/* Stats Row */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={4}
            className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto"
          >
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="glass-card py-6 px-4 text-center hover:shadow-glass-lg transition-shadow duration-300"
              >
                <div className="font-display font-bold text-3xl text-gradient mb-1">
                  {stat.value}
                </div>
                <div className="text-xs text-on-surface-variant font-medium">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Trust Bar ── */}
      <section className="bg-white border-y border-outline-variant/10 py-8">
        <div className="container-max section-padding">
          <p className="text-center text-sm text-on-surface-variant mb-6 font-medium">
            TRUSTED BY GOVERNMENT PROGRAM PARTNERS
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 opacity-60">
            {["WIC", "SNAP", "Medicaid", "CHIP", "CCAP", "SSI", "TANF", "Head Start"].map(
              (program) => (
                <span key={program} className="font-display font-bold text-lg text-on-surface-variant">
                  {program}
                </span>
              )
            )}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24">
        <div className="container-max section-padding">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 border border-primary-200 text-primary-700 text-sm font-medium mb-6">
              <TrendingUp className="w-3.5 h-3.5" />
              Why Families Love MomPlan
            </div>
            <h2 className="font-display font-bold text-4xl lg:text-5xl text-on-surface mb-4">
              Complex paperwork, <span className="text-gradient">simplified</span>
            </h2>
            <p className="text-lg text-on-surface-variant max-w-2xl mx-auto">
              Automated eligibility scanning and application management — we do the heavy lifting for you.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i * 0.05}
              >
                <Card hover className="h-full">
                  <div className={`w-12 h-12 rounded-xl ${featureIconClasses[i]} flex items-center justify-center mb-4`}>
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-display font-semibold text-lg text-on-surface mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed">
                    {feature.description}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-24 bg-gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-primary-50/30 pointer-events-none" />
        <div className="container-max section-padding relative">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display font-bold text-4xl lg:text-5xl text-on-surface mb-4">
              Three Steps to Support
            </h2>
            <p className="text-lg text-on-surface-variant">
              Our streamlined process takes less than 10 minutes from start to finish.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-16 left-1/4 right-1/4 h-px bg-gradient-to-r from-primary-200 via-secondary-200 to-primary-200" />

            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i * 0.1}
                className="text-center"
              >
                <div className="relative inline-flex">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-primary mb-6 mx-auto">
                    <step.icon className="w-8 h-8 text-white" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-secondary-500 text-white text-xs font-bold flex items-center justify-center">
                    {step.number}
                  </span>
                </div>
                <h3 className="font-display font-semibold text-xl text-on-surface mb-3">
                  {step.title}
                </h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <PrimaryLink href="/eligibility" className="px-10">
              Start My Free Eligibility Scan
              <ArrowRight className="w-5 h-5" />
            </PrimaryLink>
          </motion.div>
        </div>
      </section>

      {/* ── Essential Programs Preview ── */}
      <section id="programs-preview" className="py-24 bg-white border-y border-outline-variant/10 relative overflow-hidden">
        <div className="absolute top-1/2 left-0 w-96 h-96 bg-primary-100/30 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />
        <div className="container-max section-padding relative">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary-50 border border-secondary-200 text-secondary-700 text-sm font-medium mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              Benefit Directory Preview
            </div>
            <h2 className="font-display font-bold text-4xl lg:text-5xl text-on-surface mb-4">
              Explore <span className="text-gradient">Essential Programs</span>
            </h2>
            <p className="text-lg text-on-surface-variant max-w-2xl mx-auto">
              Personalized support for every stage of your family&apos;s journey. Discover what you qualify for.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {[
              {
                title: "SNAP (Food Stamps)",
                category: "Food & Nutrition",
                desc: "Monthly benefits for fresh groceries at participating retail stores and farmers markets.",
                value: "Up to $973/mo",
                tagColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
              },
              {
                title: "WIC Nutrition Program",
                category: "Healthcare & Food",
                desc: "Special supplemental food, healthcare referrals, and nutrition education for mothers and babies.",
                value: "Up to $150/mo",
                tagColor: "bg-blue-50 text-blue-700 border-blue-200",
              },
              {
                title: "Childcare Assistance (CCAP)",
                category: "Family Support",
                desc: "Financial assistance to help cover the cost of licensed childcare while working or studying.",
                value: "Avg. $600/mo saved",
                tagColor: "bg-primary-50 text-primary-700 border-primary-200",
              },
            ].map((prog, i) => (
              <motion.div
                key={prog.title}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i * 0.1}
                className="group relative"
              >
                <div className="absolute inset-0 bg-gradient-primary rounded-card opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm pointer-events-none" />
                <Card hover className="h-full relative z-10 flex flex-col justify-between bg-white border border-outline-variant/30">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${prog.tagColor}`}>
                        {prog.category}
                      </span>
                      <span className="text-sm font-bold text-gradient">{prog.value}</span>
                    </div>
                    <h3 className="font-display font-semibold text-xl text-on-surface mb-2 group-hover:text-primary-600 transition-colors duration-200">
                      {prog.title}
                    </h3>
                    <p className="text-sm text-on-surface-variant leading-relaxed mb-6">
                      {prog.desc}
                    </p>
                  </div>
                  <Link
                    href="/programs"
                    className="inline-flex items-center gap-1 text-sm font-semibold text-primary-500 hover:text-primary-700 transition-colors duration-200"
                  >
                    Explore program details
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center"
          >
            <Link
              href="/programs"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold text-primary-500 bg-primary-50 hover:bg-primary-100 transition-all duration-200"
            >
              Browse All Programs
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Document Checklist Library ── */}
      <section id="documents-preview" className="py-24 bg-gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-primary-50/20 pointer-events-none" />
        <div className="container-max section-padding relative">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="lg:col-span-5"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 border border-primary-200 text-primary-700 text-sm font-medium mb-6">
                <FileText className="w-3.5 h-3.5" />
                Document Checklist
              </div>
              <h2 className="font-display font-bold text-4xl lg:text-5xl text-on-surface mb-6">
                Ready Your <span className="text-gradient">Documentation</span>
              </h2>
              <p className="text-lg text-on-surface-variant leading-relaxed mb-6">
                A curated library of everything you need for a successful application. Securely prepare your files beforehand to submit claims with confidence.
              </p>
              <p className="text-sm text-on-surface-variant leading-relaxed mb-8">
                Upload your files once to your encrypted MomPlan locker. We automatically map and securely pre-fill applications across federal, state, and county assistance plans.
              </p>
              <Link
                href="/documents"
                className="inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3.5 text-sm font-semibold text-white bg-gradient-primary shadow-primary hover:shadow-primary-lg hover:-translate-y-0.5 transition-all duration-200"
              >
                Access Document Library
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>

            {/* Right Card / Interactive Preview */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="lg:col-span-7"
            >
              <div className="glass-card p-6 md:p-8 hover:shadow-glass-lg transition-shadow duration-300">
                <div className="flex justify-between items-center mb-6 border-b border-outline-variant/20 pb-4">
                  <div>
                    <h3 className="font-display font-semibold text-lg text-on-surface">Core Verification Checklist</h3>
                    <p className="text-xs text-on-surface-variant">Recommended files for most benefits</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-primary-50 text-primary-700">
                    Required for 85% of programs
                  </span>
                </div>

                <div className="space-y-4">
                  {[
                    {
                      name: "Proof of Identity",
                      details: "Driver's license, Passport, or Birth Certificate",
                      status: "Essential",
                    },
                    {
                      name: "Verification of Income",
                      details: "Paystubs (last 30 days), W2, or Tax Returns",
                      status: "Essential",
                    },
                    {
                      name: "Residence Documents",
                      details: "Utility bills, Lease Agreement, or Mortgage statement",
                      status: "Highly Recommended",
                    },
                    {
                      name: "Household Verification",
                      details: "Children's birth certificates or school registration records",
                      status: "For Family Programs",
                    },
                  ].map((doc, idx) => (
                    <div
                      key={doc.name}
                      className="flex items-start gap-4 p-4 rounded-xl bg-white/50 border border-outline-variant/10 hover:bg-white hover:border-primary-200 transition-all duration-200"
                    >
                      <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-semibold text-sm text-on-surface">{doc.name}</span>
                          <span className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">
                            {doc.status}
                          </span>
                        </div>
                        <p className="text-xs text-on-surface-variant leading-relaxed">{doc.details}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="testimonials" className="py-24">
        <div className="container-max section-padding">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display font-bold text-4xl lg:text-5xl text-on-surface mb-4">
              Stories of Impact
            </h2>
            <p className="text-lg text-on-surface-variant">
              Real feedback from mothers across the country.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.author}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i * 0.1}
              >
                <Card hover className="h-full flex flex-col">
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: t.stars }).map((_, j) => (
                      <Star key={j} className="w-4 h-4 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-on-surface-variant leading-relaxed flex-1 mb-4 italic">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold text-sm">
                      {t.author.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium text-sm text-on-surface">{t.author}</div>
                      <div className="text-xs text-on-surface-variant">
                        {t.location} &bull; {t.program} recipient
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-24 bg-gradient-hero">
        <div className="container-max section-padding">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display font-bold text-4xl lg:text-5xl text-on-surface mb-4">
              Choose Your Support Level
            </h2>
            <p className="text-lg text-on-surface-variant">No hidden fees. Cancel anytime.</p>
          </motion.div>

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4 items-stretch pt-6">
            {pricingPlans.map((plan, i) => {
              const Icon = plan.icon;

              return (
                <motion.div
                  key={plan.name}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  custom={i * 0.08}
                  className="relative flex flex-col"
                >
                  {plan.popular && (
                    <div className="absolute -top-3.5 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-gradient-primary px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg shadow-primary/20">
                      {plan.badge ?? "Most common"}
                    </div>
                  )}

                  <Card
                    glass={false}
                    padding="none"
                    className={cn(
                      "flex h-full flex-col p-5",
                      plan.popular
                        ? "border-2 border-primary-300 shadow-xl shadow-primary/10 ring-4 ring-primary-50"
                        : "border-outline-variant/30"
                    )}
                  >
                    <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg border border-primary-100 bg-primary-50">
                      <Icon className="h-4 w-4 text-primary-600" strokeWidth={1.5} />
                    </div>

                    <h3 className="font-display text-lg font-bold text-on-surface">{plan.name}</h3>
                    <p className="mt-1.5 min-h-[2.5rem] text-xs leading-relaxed text-on-surface-variant">
                      {plan.description}
                    </p>

                    <div className="mt-5 flex items-end gap-1">
                      <span className="font-display text-3xl font-bold tracking-tight text-on-surface">
                        {plan.price}
                      </span>
                      {plan.period && (
                        <span className="mb-1 text-sm text-on-surface-variant">{plan.period}</span>
                      )}
                    </div>

                    {plan.billing && (
                      <p className="mt-2 text-[11px] leading-relaxed text-on-surface-variant">
                        {plan.billing}
                      </p>
                    )}

                    {plan.seatPill && (
                      <div className="mt-4 rounded-lg border border-outline-variant/30 bg-surface-container-low px-3 py-2.5">
                        <p className="text-[11px] font-medium leading-snug text-on-surface">
                          {plan.seatPill}
                        </p>
                      </div>
                    )}

                    <p className="mb-3 mt-6 text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant/70">
                      {plan.featureHeader}
                    </p>

                    <ul className="mb-6 flex-1 space-y-2.5">
                      {plan.features.map((feature) => (
                        <li key={feature.text} className="flex items-start gap-2.5">
                          <PricingFeatureIcon included={feature.included} />
                          <span
                            className={cn(
                              "text-[12px] leading-snug",
                              feature.included ? "text-on-surface-variant" : "text-outline"
                            )}
                          >
                            {feature.text}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <PricingCta
                      planId={plan.planId}
                      label={plan.cta}
                      href={plan.href}
                      variant={plan.ctaVariant}
                    />
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-24 bg-on-surface relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/50 to-secondary-900/30 pointer-events-none" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="container-max section-padding relative text-center">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-primary mx-auto mb-6">
              <Heart className="w-8 h-8 text-white" fill="white" />
            </div>
            <h2 className="font-display font-bold text-4xl lg:text-5xl text-white mb-4">
              Ready to find your benefits?
            </h2>
            <p className="text-lg text-white/60 max-w-xl mx-auto mb-10">
              Join 52,000+ families who&apos;ve already discovered thousands in hidden government benefits.
            </p>
            <PrimaryLink href="/register" className="px-10 py-4">
              Get Started Free Today
              <ArrowRight className="w-5 h-5" />
            </PrimaryLink>
            <p className="text-sm text-white/40 mt-4">
              No credit card required &bull; Setup in 3 minutes &bull; Cancel anytime
            </p>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
