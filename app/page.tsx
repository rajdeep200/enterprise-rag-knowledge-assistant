import Link from "next/link";
import {
  ArrowRight,
  FileText,
  MessagesSquare,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  Search,
  Quote,
  Database,
  Cpu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: UploadCloud,
    title: "Upload any document",
    desc: "PDF policies, SOPs, onboarding guides, product manuals and technical docs.",
  },
  {
    icon: Search,
    title: "Semantic search",
    desc: "pgvector-powered retrieval finds the most relevant passages for every question.",
  },
  {
    icon: Quote,
    title: "Source-backed answers",
    desc: "Every answer cites the document and page it came from — no hallucinations.",
  },
  {
    icon: ShieldCheck,
    title: "Multi-tenant & secure",
    desc: "Strict company isolation. Role-based access for admins and members.",
  },
  {
    icon: Cpu,
    title: "Background processing",
    desc: "Documents are chunked and embedded asynchronously with a job queue.",
  },
  {
    icon: MessagesSquare,
    title: "Chat history & feedback",
    desc: "Revisit past conversations and rate answers as helpful or not.",
  },
];

const steps = [
  { n: "1", title: "Upload documents", desc: "Admins upload company PDFs into their private workspace." },
  { n: "2", title: "Automatic processing", desc: "Text is extracted, chunked, and embedded in the background." },
  { n: "3", title: "Ask questions", desc: "Employees chat in natural language and get instant answers." },
  { n: "4", title: "Get cited answers", desc: "Each answer links back to the exact source passages." },
];

const stack = [
  { icon: Sparkles, label: "Next.js 14 · TypeScript · Tailwind · shadcn/ui" },
  { icon: Database, label: "PostgreSQL · pgvector · Prisma" },
  { icon: Cpu, label: "Redis · BullMQ workers" },
  { icon: FileText, label: "OpenAI embeddings + chat (RAG)" },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </span>
            RAG Knowledge Assistant
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container flex flex-col items-center py-24 text-center">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          Source-backed answers from your internal knowledge
        </div>
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
          Turn company documents into an AI knowledge assistant.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
          Upload policies, SOPs, manuals, and internal docs. Let your team get instant
          source-backed answers.
        </p>
        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <Button size="lg" asChild>
            <Link href="/register">
              Start free <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/login">Open dashboard</Link>
          </Button>
        </div>
      </section>

      {/* Problem / Solution */}
      <section className="border-y bg-muted/30 py-20">
        <div className="container grid gap-8 md:grid-cols-2">
          <Card>
            <CardContent className="p-8">
              <h2 className="text-xl font-semibold">The problem</h2>
              <p className="mt-3 text-muted-foreground">
                Company knowledge is scattered across PDFs, wikis, and shared drives. Employees
                waste hours searching for answers, and generic AI chatbots hallucinate because they
                have never seen your internal documents.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-8">
              <h2 className="text-xl font-semibold">The solution</h2>
              <p className="mt-3 text-muted-foreground">
                A private, multi-tenant RAG assistant grounded only in your uploaded documents. It
                retrieves the most relevant passages and answers with citations — and clearly says
                when an answer isn&apos;t in your documents.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features */}
      <section className="container py-20">
        <h2 className="text-center text-3xl font-bold">Everything you need</h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
          A production-grade RAG pipeline, wrapped in a clean SaaS dashboard.
        </p>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <Card key={f.title}>
              <CardContent className="p-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-y bg-muted/30 py-20">
        <div className="container">
          <h2 className="text-center text-3xl font-bold">How it works</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-4">
            {steps.map((s) => (
              <div key={s.n} className="relative rounded-xl border bg-background p-6">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground">
                  {s.n}
                </div>
                <h3 className="font-semibold">{s.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech / architecture */}
      <section className="container py-20">
        <h2 className="text-center text-3xl font-bold">Built on a modern stack</h2>
        <div className="mx-auto mt-10 grid max-w-3xl gap-4 sm:grid-cols-2">
          {stack.map((s) => (
            <div key={s.label} className="flex items-center gap-3 rounded-lg border bg-card p-4">
              <s.icon className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container pb-24">
        <div className="rounded-2xl bg-primary px-8 py-14 text-center text-primary-foreground">
          <h2 className="text-3xl font-bold">Ready to chat with your documents?</h2>
          <p className="mx-auto mt-3 max-w-lg opacity-90">
            Spin up a workspace, upload your first PDF, and ask a question in minutes.
          </p>
          <Button size="lg" variant="secondary" className="mt-8" asChild>
            <Link href="/register">
              Create your workspace <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <footer className="border-t py-8">
        <div className="container text-center text-sm text-muted-foreground">
          Enterprise RAG Knowledge Assistant — a full-stack portfolio project.
        </div>
      </footer>
    </div>
  );
}
