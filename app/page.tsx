'use client'

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { AuthProvider, LoginForm, RegisterForm, ProtectedRoute, UserMenu } from 'lyzr-architect-pg/client'
import { Toaster, toast as sonnerToast } from 'sonner'
import { callAIAgent } from '@/lib/aiAgent'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Bot,
  Box,
  Braces,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Circle,
  CircleAlert,
  ClipboardCheck,
  Cloud,
  Code2,
  Command,
  Copy,
  Database,
  ExternalLink,
  FileCode2,
  FileText,
  Folder,
  FolderOpen,
  Gauge,
  Github,
  GitBranch,
  Globe2,
  Grid2X2,
  HardDrive,
  Hexagon,
  History,
  Home,
  Info,
  LayoutDashboard,
  Link2,
  List,
  Loader2,
  Lock,
  Menu,
  MessageSquare,
  Minus,
  Moon,
  MoreHorizontal,
  Network,
  PanelLeft,
  Play,
  Plus,
  RefreshCw,
  Rocket,
  Search,
  Send,
  Server,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Table2,
  Terminal,
  Upload,
  User,
  Users,
  Wand2,
  X,
  Zap,
} from 'lucide-react'

const AGENT_ID = '6ab645510a41e423f3726283'
const PROJECT_PATH = '/app/project/expense-intelligence'
const DEFAULT_PROMPT = 'Build an AI expense management platform where employees can upload receipts, automatically extract information, categorize expenses, and submit them for approval.'
const DEMO_URL = 'expense-intelligence.architect.app'

const sampleExpenses = [
  { merchant: 'AWS', category: 'Software', amount: '₹12,420', date: 'Sep 23', status: 'Approved' },
  { merchant: 'Air India', category: 'Travel', amount: '₹8,230', date: 'Sep 22', status: 'Pending' },
  { merchant: 'Amazon', category: 'Office', amount: '₹3,240', date: 'Sep 20', status: 'Approved' },
  { merchant: 'Taj Hotels', category: 'Accommodation', amount: '₹14,200', date: 'Sep 18', status: 'Approved' },
]

const architectureNodes = [
  { id: 'user', label: 'USER', description: 'Employee, finance manager, administrator', icon: Users, group: 'platform' },
  { id: 'web', label: 'WEB APPLICATION', description: 'Next.js responsive application', icon: LayoutDashboard, group: 'platform' },
  { id: 'gateway', label: 'API GATEWAY', description: 'Authentication and request validation', icon: Network, group: 'platform' },
  { id: 'orchestrator', label: 'AI ORCHESTRATOR', description: 'Routes tasks and enforces policies', icon: Bot, group: 'platform' },
  { id: 'receipt', label: 'RECEIPT AGENT', description: 'Extract structured receipt data', icon: FileText, group: 'agent' },
  { id: 'categorization', label: 'CATEGORIZATION AGENT', description: 'Classify expense categories', icon: Grid2X2, group: 'agent' },
  { id: 'approval', label: 'APPROVAL AGENT', description: 'Apply approval policies', icon: ShieldCheck, group: 'agent' },
  { id: 'notification', label: 'NOTIFICATION AGENT', description: 'Send workflow updates', icon: MessageSquare, group: 'agent' },
  { id: 'postgres', label: 'POSTGRESQL', description: 'Application records and audit history', icon: Database, group: 'data' },
  { id: 'notifications', label: 'NOTIFICATION SERVICE', description: 'Email and in-app notifications', icon: Zap, group: 'data' },
]

const appAgents = [
  {
    id: 'receipt-agent',
    name: 'Receipt Agent',
    purpose: 'Extract structured information from uploaded receipts and validate it before categorization.',
    model: 'GPT-5.6',
    status: 'Configured',
    color: 'text-primary',
    tools: ['OCR', 'Expense Database', 'Validation Service'],
    guardrails: ['Structured output', 'Confidence threshold', 'PII handling'],
    trigger: 'When a receipt is uploaded',
  },
  {
    id: 'categorization-agent',
    name: 'Categorization Agent',
    purpose: 'Classify expenses against the company chart of accounts and explain uncertain matches.',
    model: 'GPT-5.6',
    status: 'Configured',
    color: 'text-cyan-300',
    tools: ['Expense Database', 'Category Rules'],
    guardrails: ['Known categories only', 'Confidence threshold'],
    trigger: 'After receipt extraction',
  },
  {
    id: 'approval-agent',
    name: 'Approval Agent',
    purpose: 'Apply policy thresholds and route expenses to the correct finance manager.',
    model: 'GPT-5.6',
    status: 'Configured',
    color: 'text-amber-300',
    tools: ['Policy Store', 'User Directory'],
    guardrails: ['No self-approval', 'Policy trace required'],
    trigger: 'When an expense is submitted',
  },
  {
    id: 'notification-agent',
    name: 'Notification Agent',
    purpose: 'Write concise workflow updates for employees and finance stakeholders.',
    model: 'GPT-5.6',
    status: 'Configured',
    color: 'text-emerald-300',
    tools: ['Notification Service', 'Audit History'],
    guardrails: ['No sensitive receipt data', 'Delivery status recorded'],
    trigger: 'When workflow state changes',
  },
]

const dataTables = [
  { id: 'users', name: 'users', description: 'People who submit or review expenses', columns: ['id · uuid', 'name · text', 'role · enum', 'email · text'], relation: 'owns many expenses' },
  { id: 'expenses', name: 'expenses', description: 'Canonical expense record and workflow state', columns: ['id · uuid', 'user_id · uuid', 'amount · decimal', 'category · text', 'status · enum'], relation: 'references users and receipts' },
  { id: 'receipts', name: 'receipts', description: 'Original asset and extracted receipt fields', columns: ['id · uuid', 'expense_id · uuid', 'merchant · text', 'confidence · decimal'], relation: 'belongs to expenses' },
  { id: 'approvals', name: 'approvals', description: 'Policy decisions and reviewer history', columns: ['id · uuid', 'expense_id · uuid', 'reviewer_id · uuid', 'decision · enum'], relation: 'belongs to expenses' },
  { id: 'notifications', name: 'notifications', description: 'In-app updates with delivery status', columns: ['id · uuid', 'recipient_id · uuid', 'event · text', 'read_at · timestamp'], relation: 'references users' },
]

const integrationCatalog = [
  { id: 'github', name: 'GitHub', description: 'Source control, branches, pull requests, and commit history.', icon: Github, type: 'Source control', connected: true, detail: 'architect-labs/expense-intelligence' },
  { id: 'postgresql', name: 'PostgreSQL', description: 'Relational data model for expenses, approvals, and audit history.', icon: Database, type: 'Data', connected: true, detail: 'expense_intelligence · Mumbai' },
  { id: 'slack', name: 'Slack', description: 'Send approval updates to finance channels.', icon: MessageSquare, type: 'Communication', connected: false, detail: 'Ready to simulate' },
  { id: 'drive', name: 'Google Drive', description: 'Store receipt source files and finance exports.', icon: HardDrive, type: 'Storage', connected: false, detail: 'Ready to simulate' },
  { id: 'aws', name: 'AWS', description: 'Deploy the generated application with managed infrastructure.', icon: Cloud, type: 'Cloud', connected: false, detail: 'Ready to simulate' },
  { id: 'stripe', name: 'Stripe', description: 'Optional billing and spend controls for a future workspace.', icon: Box, type: 'Payments', connected: false, detail: 'Ready to simulate' },
]

const buildTasks = [
  'Web application and API gateway',
  'AI orchestrator and policy routing',
  'Four specialized agents',
  'PostgreSQL and notification service',
  'Expense dashboard and upload flow',
  'Workspace preview and test fixtures',
]

const deploymentSteps = ['Preparing build', 'Installing dependencies', 'Running tests', 'Building application', 'Provisioning environment', 'Deploying']

const codeFiles = [
  { type: 'folder', name: 'expense-intelligence', depth: 0 },
  { type: 'folder', name: 'src', depth: 1 },
  { type: 'folder', name: 'agents', depth: 2 },
  { type: 'file', name: 'ReceiptAgent.ts', depth: 3 },
  { type: 'file', name: 'CategorizationAgent.ts', depth: 3 },
  { type: 'file', name: 'ApprovalAgent.ts', depth: 3 },
  { type: 'folder', name: 'components', depth: 2 },
  { type: 'file', name: 'Dashboard.tsx', depth: 3 },
  { type: 'file', name: 'ExpenseCard.tsx', depth: 3 },
  { type: 'file', name: 'UploadReceipt.tsx', depth: 3 },
  { type: 'folder', name: 'api', depth: 2 },
  { type: 'file', name: 'expenses.ts', depth: 3 },
  { type: 'folder', name: 'database', depth: 2 },
  { type: 'file', name: 'schema.ts', depth: 3 },
  { type: 'folder', name: 'config', depth: 2 },
]

const staticTimestamp = '2026-09-25T10:00:00Z'

type ThemeMode = 'dark' | 'light'
type OnboardingStage = 'idle' | 'analyzing' | 'review'
type ReceiptState = 'idle' | 'analyzing' | 'complete'
type PushState = 'idle' | 'pushing' | 'pushed'
type DeploymentState = 'idle' | 'running' | 'live'
type WorkspacePanel = 'explorer' | 'ai' | 'preview'
type CenterTab = 'code' | 'ai' | 'architecture' | 'diff'
type Tone = 'neutral' | 'success' | 'warning' | 'error'

type CopilotChange = {
  action: string
  area: string
  files_or_surfaces: string[]
  rationale: string
}

type CopilotPayload = {
  understood: string
  plan: string[]
  changes: CopilotChange[]
  next_step: string
  confidence: number
  metadata: { agent_name: string; timestamp: string }
}

type ToastState = { title: string; description: string; tone: Tone }

const copilotFixture: CopilotPayload = {
  understood: 'You want an inspectable Expense Intelligence workspace that turns receipt uploads into governed, reviewable expense workflows without hiding technical decisions.',
  plan: [
    'Map the dashboard request to the expense aggregation query and its visualization surface.',
    'Preserve the existing expense and approval data model while grouping monthly spend by category.',
    'Show the proposed code change first, then update the live preview only after approval.',
  ],
  changes: [
    {
      action: 'Update aggregation',
      area: 'Data query',
      files_or_surfaces: ['src/api/expenses.ts', 'Monthly spend resolver'],
      rationale: 'Return category buckets for each month so the dashboard can explain spend composition.',
    },
    {
      action: 'Replace chart surface',
      area: 'Dashboard UI',
      files_or_surfaces: ['src/components/Dashboard.tsx', 'CategorySpendChart'],
      rationale: 'Make category movement visible without changing the underlying expense record.',
    },
    {
      action: 'Preserve auditability',
      area: 'Workspace state',
      files_or_surfaces: ['Diff review', 'Applied change history'],
      rationale: 'Keep a review step and a reversible local demo state before applying the proposal.',
    },
  ],
  next_step: 'Review the diff, apply the proposal, and confirm the category chart in the live preview.',
  confidence: 0.96,
  metadata: { agent_name: 'Architect Product Copilot', timestamp: staticTimestamp },
}

function normalizeCopilotResponse(response: unknown): CopilotPayload | null {
  const envelope = response as { result?: unknown; metadata?: { agent_name?: string; timestamp?: string } }
  let raw = envelope?.result
  if (typeof raw === 'string') {
    const cleaned = raw.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()
    try { raw = JSON.parse(cleaned) } catch { return null }
  }
  if (!raw || typeof raw !== 'object') return null
  const data = raw as Partial<CopilotPayload>
  if (typeof data.understood !== 'string' || !Array.isArray(data.plan) || !Array.isArray(data.changes) || typeof data.next_step !== 'string') return null
  return {
    understood: data.understood,
    plan: data.plan,
    changes: data.changes,
    next_step: data.next_step,
    confidence: typeof data.confidence === 'number' ? data.confidence : 0.8,
    metadata: {
      agent_name: envelope.metadata?.agent_name || data.metadata?.agent_name || 'Architect Product Copilot',
      timestamp: envelope.metadata?.timestamp || data.metadata?.timestamp || 'Live response',
    },
  }
}

function renderMarkdown(text: string) {
  if (!text) return null
  return (
    <div className="space-y-2">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('### ')) return <h4 key={i} className="mt-3 text-sm font-semibold text-foreground">{line.slice(4)}</h4>
        if (line.startsWith('## ')) return <h3 key={i} className="mt-3 text-base font-semibold text-foreground">{line.slice(3)}</h3>
        if (line.startsWith('# ')) return <h2 key={i} className="mt-4 text-lg font-bold text-foreground">{line.slice(2)}</h2>
        if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="ml-4 list-disc text-sm text-muted-foreground">{formatInline(line.slice(2))}</li>
        if (/^\d+\.\s/.test(line)) return <li key={i} className="ml-4 list-decimal text-sm text-muted-foreground">{formatInline(line.replace(/^\d+\.\s/, ''))}</li>
        if (!line.trim()) return <div key={i} className="h-1" />
        return <p key={i} className="text-sm leading-6 text-muted-foreground">{formatInline(line)}</p>
      })}
    </div>
  )
}

function formatInline(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  if (parts.length === 1) return text
  return parts.map((part, i) => i % 2 === 1 ? <strong key={i} className="font-semibold text-foreground">{part}</strong> : part)
}

function StatusDot({ tone = 'success', pulse = false }: { tone?: 'success' | 'active' | 'warning' | 'muted'; pulse?: boolean }) {
  const toneClass = tone === 'success' ? 'bg-emerald-400' : tone === 'active' ? 'bg-cyan-300' : tone === 'warning' ? 'bg-amber-300' : 'bg-muted-foreground'
  return <span className={`inline-block h-1.5 w-1.5 rounded-full ${toneClass} ${pulse ? 'animate-pulse' : ''}`} aria-hidden="true" />
}

function BrandMark() {
  return <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20">A</span>
}

function Logo({ compact = false }: { compact?: boolean }) {
  return <div className="flex items-center gap-3"><BrandMark />{!compact && <span className="text-sm font-semibold tracking-[0.18em] text-foreground">ARCHITECT</span>}</div>
}

function ThemeToggle({ theme, onToggle }: { theme: ThemeMode; onToggle: () => void }) {
  return <Button aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground" onClick={onToggle}>{theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</Button>
}

function SampleToggle({ enabled, onChange }: { enabled: boolean; onChange: (next: boolean) => void }) {
  return <label className="flex min-h-10 items-center gap-2 rounded-xl border border-border bg-card/70 px-3 text-xs text-muted-foreground shadow-sm"><Switch checked={enabled} onCheckedChange={onChange} aria-label="Sample Data" /><span className="whitespace-nowrap">Sample Data</span></label>
}

function StatusBadge({ children, tone = 'neutral' }: { children: ReactNode; tone?: Tone }) {
  const classes = tone === 'success' ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300' : tone === 'warning' ? 'border-amber-300/20 bg-amber-300/10 text-amber-200' : tone === 'error' ? 'border-destructive/30 bg-destructive/10 text-destructive' : 'border-border bg-muted/60 text-muted-foreground'
  return <span className={`inline-flex min-h-7 items-center gap-1.5 rounded-full border px-2.5 text-[10px] font-medium ${classes}`}>{children}</span>
}

function PageEyebrow({ children, icon: Icon = Sparkles }: { children: ReactNode; icon?: typeof Sparkles }) {
  return <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-primary"><Icon className="h-3.5 w-3.5" />{children}</div>
}

function SectionHeading({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return <div className="flex flex-col gap-4 border-b border-border/70 pb-6 md:flex-row md:items-end md:justify-between"><div className="min-w-0">{eyebrow && <PageEyebrow>{eyebrow}</PageEyebrow>}<h1 className="mt-2 text-balance text-2xl font-semibold tracking-tight text-foreground md:text-3xl">{title}</h1>{description && <p className="mt-2 max-w-2xl text-pretty text-sm leading-6 text-muted-foreground">{description}</p>}</div>{action && <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div>}</div>
}

function AgentPresence({ activeAgentId }: { activeAgentId: string | null }) {
  const active = activeAgentId === 'architect-product-copilot'
  return <div className="hidden items-center gap-2 rounded-xl border border-border bg-card/60 px-3 py-2 xl:flex"><StatusDot tone={active ? 'active' : 'success'} pulse={active} /><div className="min-w-0"><p className="truncate text-[11px] font-medium text-foreground">Architect Product Copilot</p><p className="truncate text-[10px] text-muted-foreground">Interprets requests · {active ? 'working' : 'ready'}</p></div></div>
}

function JourneyRail({ current }: { current: 'idea' | 'requirements' | 'architecture' | 'build' | 'workspace' | 'release' }) {
  const stages = [
    { id: 'idea', label: 'Idea' },
    { id: 'requirements', label: 'Requirements' },
    { id: 'architecture', label: 'Architecture' },
    { id: 'build', label: 'Build' },
    { id: 'workspace', label: 'Workspace' },
    { id: 'release', label: 'Release' },
  ] as const
  const currentIndex = stages.findIndex((stage) => stage.id === current)
  return <div className="mb-6 flex min-w-0 items-center gap-1 overflow-x-auto pb-1 text-[10px] text-muted-foreground"><span className="mr-2 shrink-0 font-mono uppercase tracking-[0.14em] text-muted-foreground">Journey</span>{stages.map((stage, index) => <div key={stage.id} className="flex shrink-0 items-center gap-1"><span className={`flex min-h-8 items-center gap-1.5 rounded-full border px-2.5 ${index === currentIndex ? 'border-primary/40 bg-primary/10 text-primary' : index < currentIndex ? 'border-emerald-400/20 bg-emerald-400/5 text-emerald-300' : 'border-border bg-card/60'}`}>{index < currentIndex ? <Check className="h-3 w-3" /> : <span className="font-mono">0{index + 1}</span>}{stage.label}</span>{index < stages.length - 1 && <ArrowRight className="h-3 w-3 text-border" />}</div>)}</div>
}

function PublicChrome({ theme, onToggleTheme, sampleData, onToggleSample, onNavigate }: { theme: ThemeMode; onToggleTheme: () => void; sampleData: boolean; onToggleSample: (next: boolean) => void; onNavigate: (path: string) => void }) {
  return <header className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-5 py-5 lg:px-8"><button className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" onClick={() => onNavigate('/')} aria-label="Go to Architect home"><Logo /></button><div className="flex items-center gap-2"><SampleToggle enabled={sampleData} onChange={onToggleSample} /><ThemeToggle theme={theme} onToggle={onToggleTheme} /><Button variant="outline" className="hidden h-10 rounded-xl border-border bg-card/70 px-4 text-xs hover:border-primary/50 hover:bg-muted md:inline-flex" onClick={() => onNavigate('/login')}>Login</Button></div></header>
}

function PublicFooter() {
  return <footer className="mx-auto flex w-full max-w-7xl flex-col gap-2 border-t border-border/70 px-5 py-6 text-[11px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between lg:px-8"><span>Architect 2.0 · Local product creation demo</span><span className="font-mono text-[10px]">NO EXTERNAL CALLS · DETERMINISTIC STATE</span></footer>
}

function LandingScreen({ onNavigate, theme, onToggleTheme, sampleData, onToggleSample }: { onNavigate: (path: string) => void; theme: ThemeMode; onToggleTheme: () => void; sampleData: boolean; onToggleSample: (next: boolean) => void }) {
  const pipeline = ['Idea', 'Requirements', 'Architecture', 'Build', 'Deploy']
  return <div className="min-h-screen bg-background text-foreground"><PublicChrome theme={theme} onToggleTheme={onToggleTheme} sampleData={sampleData} onToggleSample={onToggleSample} onNavigate={onNavigate} /><main className="mx-auto max-w-7xl px-5 pb-12 pt-8 lg:px-8 lg:pt-16"><section className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16"><div className="animate-in fade-in slide-in-from-bottom-2 motion-reduce:animate-none"><PageEyebrow icon={Hexagon}>Architect 2.0 · AI software creation</PageEyebrow><h1 className="mt-6 max-w-3xl text-balance text-5xl font-semibold tracking-[-0.06em] text-foreground sm:text-6xl lg:text-7xl">From product idea to <span className="text-primary italic">production-ready software.</span></h1><p className="mt-6 max-w-xl text-pretty text-base leading-7 text-muted-foreground">Architect keeps the reasoning visible while it turns your product intent into requirements, architecture, specialized agents, code, and a deployable application.</p><div className="mt-8 flex flex-col gap-3 sm:flex-row"><Button className="h-12 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-transform hover:bg-primary/90 active:scale-[0.98]" onClick={() => onNavigate('/login')}><Sparkles className="mr-2 h-4 w-4" />Start demo <ArrowRight className="ml-1 h-4 w-4" /></Button><Button variant="outline" className="h-12 rounded-xl border-border bg-card px-5 text-sm hover:border-primary/50 hover:bg-muted active:scale-[0.98]" onClick={() => onNavigate('/app')}><Play className="mr-2 h-4 w-4" />Explore Expense Intelligence</Button></div><div className="mt-7 flex flex-wrap items-center gap-4 text-xs text-muted-foreground"><span className="inline-flex items-center gap-2"><StatusDot tone="success" />Local demo state</span><span className="inline-flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5 text-primary" />Transparent decisions</span><span className="inline-flex items-center gap-2"><Lock className="h-3.5 w-3.5 text-primary" />No account required</span></div></div><div className="relative animate-in fade-in slide-in-from-bottom-2 delay-150 motion-reduce:animate-none"><div className="absolute -inset-8 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" /><div className="relative overflow-hidden rounded-3xl border border-border bg-card p-3 shadow-2xl shadow-black/20"><div className="flex items-center gap-2 border-b border-border px-3 pb-3"><div className="flex gap-1.5"><span className="h-2 w-2 rounded-full bg-destructive/70" /><span className="h-2 w-2 rounded-full bg-amber-300/70" /><span className="h-2 w-2 rounded-full bg-emerald-300/70" /></div><div className="ml-3 flex min-w-0 flex-1 items-center justify-center rounded-md border border-border bg-background px-3 py-1.5 font-mono text-[9px] text-muted-foreground">expense-intelligence.local</div><StatusBadge tone="success"><StatusDot tone="success" />Live preview</StatusBadge></div><div className="grid gap-3 p-4 sm:grid-cols-[0.82fr_1.18fr]"><div className="space-y-3"><div className="rounded-xl border border-border bg-background p-3"><div className="flex items-center justify-between"><span className="text-[10px] font-medium">Workspace build</span><span className="font-mono text-[9px] text-emerald-300">100%</span></div><div className="mt-2 h-1.5 rounded-full bg-muted"><span className="block h-full w-full rounded-full bg-primary" /></div></div><div className="rounded-xl border border-border bg-background p-3"><div className="mb-3 flex items-center gap-2"><Bot className="h-4 w-4 text-primary" /><span className="text-[10px] font-medium">Architect AI</span></div><div className="space-y-2"><div className="h-2 w-full rounded bg-muted" /><div className="h-2 w-4/5 rounded bg-muted" /><div className="h-2 w-11/12 rounded bg-primary/30" /></div><div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-2 text-[9px] leading-4 text-muted-foreground">Category chart proposal is ready for review.</div></div><div className="rounded-xl border border-border bg-background p-3"><div className="flex items-center gap-2 text-[10px] font-medium"><GitBranch className="h-3.5 w-3.5 text-primary" /> GitHub sync</div><div className="mt-3 flex items-center justify-between text-[9px] text-muted-foreground"><span>12 files prepared</span><span className="font-mono text-emerald-300">a8f32d1</span></div></div></div><div className="rounded-xl border border-border bg-background p-4"><div className="flex items-center justify-between"><div><p className="text-[10px] font-medium">Expense Intelligence</p><p className="mt-1 text-[9px] text-muted-foreground">Good morning, Alex</p></div><div className="rounded-lg bg-primary px-2.5 py-1.5 text-[9px] font-medium text-primary-foreground">+ Receipt</div></div><div className="mt-4 grid grid-cols-3 gap-2"><div className="rounded-lg border border-border p-2"><span className="block text-[8px] text-muted-foreground">Total spend</span><span className="mt-1 block text-sm font-semibold tabular-nums">₹24.5k</span></div><div className="rounded-lg border border-border p-2"><span className="block text-[8px] text-muted-foreground">Pending</span><span className="mt-1 block text-sm font-semibold tabular-nums">₹8.2k</span></div><div className="rounded-lg border border-border p-2"><span className="block text-[8px] text-muted-foreground">Approved</span><span className="mt-1 block text-sm font-semibold tabular-nums">₹16.2k</span></div></div><div className="mt-3 rounded-xl border border-border p-3"><div className="flex items-center justify-between"><span className="text-[10px] font-medium">Monthly spending by category</span><span className="font-mono text-[8px] text-muted-foreground">6 months</span></div><div className="mt-5 flex h-28 items-end gap-2 border-b border-border px-2"><span className="h-[35%] flex-1 rounded-t bg-primary/50" /><span className="h-[60%] flex-1 rounded-t bg-cyan-300/60" /><span className="h-[45%] flex-1 rounded-t bg-primary/70" /><span className="h-[82%] flex-1 rounded-t bg-cyan-300/70" /><span className="h-[66%] flex-1 rounded-t bg-primary" /><span className="h-[92%] flex-1 rounded-t bg-primary/80" /></div><div className="mt-2 flex justify-between font-mono text-[8px] text-muted-foreground"><span>Travel</span><span>Food</span><span>Software</span><span>Office</span></div></div></div></div></div></div></section><section className="mt-24 border-y border-border/70 py-8"><div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><PageEyebrow icon={ArrowRight}>One continuous creation journey</PageEyebrow><p className="text-xs text-muted-foreground">Pause, inspect, and decide at every meaningful handoff.</p></div><div className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-5">{pipeline.map((stage, index) => <div key={stage} className="group relative bg-card px-4 py-4 transition-colors hover:bg-muted"><div className="flex items-center justify-between"><span className="font-mono text-[10px] text-primary">0{index + 1}</span>{index < pipeline.length - 1 && <ArrowRight className="hidden h-3.5 w-3.5 text-muted-foreground sm:block" />}</div><p className="mt-4 text-sm font-medium">{stage}</p><p className="mt-1 text-[11px] leading-5 text-muted-foreground">{['Shape the intent', 'Review the shared model', 'Inspect system decisions', 'Watch the build happen', 'Release with confidence'][index]}</p></div>)}</div></section><AudienceSection /><section className="grid gap-5 py-20 md:grid-cols-3"><div className="md:col-span-2"><PageEyebrow icon={Wand2}>Built for considered software</PageEyebrow><h2 className="mt-4 max-w-xl text-3xl font-semibold tracking-tight">A creation environment that explains itself.</h2><p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">The demo is deliberately transparent: AI proposes, the builder reviews, and the product surface makes every transition legible.</p></div><div className="space-y-4"><div className="flex gap-3 border-b border-border pb-4"><div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary"><ClipboardCheck className="h-4 w-4" /></div><div><p className="text-sm font-medium">Review before mutation</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Diffs, findings, and recommendations stay visible.</p></div></div><div className="flex gap-3"><div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary"><Activity className="h-4 w-4" /></div><div><p className="text-sm font-medium">A believable live loop</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Changes move from intent to preview, GitHub, and production.</p></div></div></div></section></main><PublicFooter /></div>
}

function LoginScreen({ onNavigate, theme, onToggleTheme, sampleData, onToggleSample }: { onNavigate: (path: string) => void; theme: ThemeMode; onToggleTheme: () => void; sampleData: boolean; onToggleSample: (next: boolean) => void }) {
  const [email, setEmail] = useState('alex@architect.local')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const continueDemo = () => {
    if (!email.trim()) {
      setError('Enter an email-shaped name for the local demo.')
      return
    }
    setError('')
    setPending(true)
    window.setTimeout(() => onNavigate('/app/new'), 650)
  }
  return <div className="min-h-screen bg-background text-foreground"><PublicChrome theme={theme} onToggleTheme={onToggleTheme} sampleData={sampleData} onToggleSample={onToggleSample} onNavigate={onNavigate} /><main className="mx-auto flex min-h-[calc(100vh-150px)] max-w-7xl items-center justify-center px-5 py-10 lg:px-8"><div className="grid w-full max-w-4xl overflow-hidden rounded-3xl border border-border bg-card shadow-2xl shadow-black/20 lg:grid-cols-[0.9fr_1.1fr]"><div className="hidden flex-col justify-between border-r border-border bg-muted/30 p-8 lg:flex"><div><PageEyebrow icon={Hexagon}>Local demo environment</PageEyebrow><h1 className="mt-6 text-3xl font-semibold tracking-tight">Keep the build conversation open.</h1><p className="mt-4 text-sm leading-6 text-muted-foreground">Enter the Expense Intelligence journey with a preconfigured project, transparent AI fixtures, and reversible client-side state.</p></div><div className="space-y-3 text-xs text-muted-foreground"><div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-300" />No external identity provider</div><div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-300" />No data leaves this demo</div><div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-300" />Every action is simulated</div></div></div><div className="p-6 sm:p-10"><button className="mb-10 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" onClick={() => onNavigate('/')}><Logo compact /></button><PageEyebrow icon={Lock}>Demo access</PageEyebrow><h2 className="mt-4 text-3xl font-semibold tracking-tight">Enter Architect</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">Use any email-shaped label. This is a local prototype, not an account system.</p><div className="mt-8 space-y-2"><label htmlFor="demo-email" className="text-xs font-medium text-foreground">Your workspace name</label><Input id="demo-email" value={email} onChange={(event) => setEmail(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') continueDemo() }} className="h-12 rounded-xl border-border bg-background" placeholder="alex@architect.local" />{error && <p className="flex items-center gap-2 text-xs text-destructive"><AlertCircle className="h-3.5 w-3.5" />{error}</p>}</div><Button className="mt-5 h-12 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/15 hover:bg-primary/90 active:scale-[0.98]" onClick={continueDemo} disabled={pending}>{pending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Opening local workspace</> : <>Continue in local demo <ArrowRight className="ml-2 h-4 w-4" /></>}</Button><div className="mt-7 rounded-xl border border-border bg-muted/30 p-4"><div className="flex items-start gap-3"><Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><p className="text-xs leading-5 text-muted-foreground">Social sign-in, OAuth, SSO, and remote services are intentionally not part of this experience.</p></div></div></div></div></main><PublicFooter /></div>
}

function AuthLoginScreen({ onNavigate, theme, onToggleTheme, sampleData, onToggleSample }: { onNavigate: (path: string) => void; theme: ThemeMode; onToggleTheme: () => void; sampleData: boolean; onToggleSample: (next: boolean) => void }) {
  const [showLogin, setShowLogin] = useState(true)
  return <div className="min-h-screen bg-background text-foreground"><PublicChrome theme={theme} onToggleTheme={onToggleTheme} sampleData={sampleData} onToggleSample={onToggleSample} onNavigate={onNavigate} /><main className="mx-auto grid min-h-[calc(100vh-150px)] max-w-5xl items-center gap-8 px-5 py-10 lg:grid-cols-[0.9fr_1.1fr] lg:px-8"><section className="rounded-3xl border border-border bg-muted/20 p-8"><PageEyebrow icon={Lock}>Real account session</PageEyebrow><h1 className="mt-5 text-3xl font-semibold tracking-tight">Build inside a protected workspace.</h1><p className="mt-4 text-sm leading-6 text-muted-foreground">This remains a demo product, but your Architect session now uses real email and password authentication backed by PostgreSQL.</p><div className="mt-7 space-y-3 text-xs text-muted-foreground"><div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-300" />Secure package-managed password handling</div><div className="flex items-center gap-2"><Database className="h-4 w-4 text-primary" />Persistent account and session verification</div><div className="flex items-center gap-2"><Lock className="h-4 w-4 text-primary" />All app routes require authentication</div></div></section><section className="rounded-3xl border border-border bg-card p-6 shadow-2xl shadow-black/20 sm:p-9"><div className="mb-6"><PageEyebrow icon={User}>{showLogin ? 'Welcome back' : 'Create an account'}</PageEyebrow><h2 className="mt-3 text-2xl font-semibold">{showLogin ? 'Sign in to Architect' : 'Start your Architect workspace'}</h2><p className="mt-2 text-xs leading-5 text-muted-foreground">Use email and password. Social OAuth is managed by the platform and is not duplicated here.</p></div>{showLogin ? <LoginForm className="space-y-4" onSuccess={() => onNavigate('/app/new')} onSwitchToRegister={() => setShowLogin(false)} /> : <RegisterForm className="space-y-4" onSuccess={() => onNavigate('/app/new')} onSwitchToLogin={() => setShowLogin(true)} />}</section></main><PublicFooter /></div>
}

function AudienceSection() {
  const audiences = [
    { title: 'For builders', subtitle: 'Move beyond one-shot generation', icon: Wand2, points: ['Review requirements before code is produced', 'See agent and system architecture instead of a black box', 'Ship with real PostgreSQL auth rather than a mock-only shell'] },
    { title: 'For developers', subtitle: 'Keep control without stitching tools together', icon: Code2, points: ['Inspect reviewable diffs before applying changes', 'Trace agent tools, guardrails, and execution paths', 'Carry one visible thread from architecture to GitHub and deployment'] },
  ]
  return <section className="border-t border-border/70 py-20"><div className="mb-8 max-w-2xl"><PageEyebrow icon={Users}>Built for both sides of the build</PageEyebrow><h2 className="mt-4 text-3xl font-semibold tracking-tight">More control than app generators. More product context than coding copilots.</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">Architect connects intent, technical decisions, implementation, and release in one reviewable workflow.</p></div><div className="grid gap-5 md:grid-cols-2">{audiences.map(({ title, subtitle, icon: Icon, points }) => <article key={title} className="rounded-3xl border border-border bg-card p-6 sm:p-8"><span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></span><h3 className="mt-5 text-xl font-semibold">{title}</h3><p className="mt-1 text-xs text-primary">{subtitle}</p><div className="mt-6 space-y-3">{points.map((point) => <div key={point} className="flex items-start gap-3 text-sm leading-6 text-muted-foreground"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-300" />{point}</div>)}</div></article>)}</div></section>
}

function SidebarNavItem({ active, icon: Icon, label, onClick }: { active: boolean; icon: typeof Home; label: string; onClick: () => void }) {
  return <Button variant="ghost" className={`min-h-10 w-full justify-start rounded-xl px-3 text-xs transition-colors ${active ? 'bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`} onClick={onClick}><Icon className="mr-3 h-4 w-4" />{label}</Button>
}

function ProjectSidebar({ path, onNavigate, onClose }: { path: string; onNavigate: (path: string) => void; onClose?: () => void }) {
  const projectRoute = path.startsWith(PROJECT_PATH)
  const go = (next: string) => { onNavigate(next); onClose?.() }
  return <aside className="flex h-full w-64 shrink-0 flex-col border-r border-border bg-card/70 p-4"><div className="flex items-center justify-between px-2"><button className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" onClick={() => go('/app')}><Logo /></button>{onClose && <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl lg:hidden" onClick={onClose} aria-label="Close navigation"><X className="h-4 w-4" /></Button>}</div>{projectRoute ? <><div className="mt-8 px-2 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">Current project</div><div className="mt-2 rounded-2xl border border-border bg-background p-3"><div className="flex items-center gap-2"><span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary"><LayoutDashboard className="h-3.5 w-3.5" /></span><div className="min-w-0"><p className="truncate text-xs font-semibold">Expense Intelligence</p><p className="mt-0.5 truncate text-[10px] text-muted-foreground">Build with me</p></div></div></div><div className="mt-7 px-2 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">Project</div><nav className="mt-2 space-y-1"><SidebarNavItem active={path === PROJECT_PATH || path.endsWith('/build')} icon={Code2} label="Build" onClick={() => go(`${PROJECT_PATH}`)} /><SidebarNavItem active={path.endsWith('/architecture')} icon={Network} label="Architecture" onClick={() => go(`${PROJECT_PATH}/architecture`)} /><SidebarNavItem active={path.endsWith('/agents')} icon={Bot} label="Agents" onClick={() => go(`${PROJECT_PATH}/agents`)} /><SidebarNavItem active={path.endsWith('/data')} icon={Database} label="Data model" onClick={() => go(`${PROJECT_PATH}/data`)} /><SidebarNavItem active={path.endsWith('/integrations')} icon={Link2} label="Integrations" onClick={() => go(`${PROJECT_PATH}/integrations`)} /><SidebarNavItem active={path.endsWith('/deploy')} icon={Rocket} label="Deployments" onClick={() => go(`${PROJECT_PATH}/deploy`)} /></nav></> : <><div className="mt-8 px-2 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">Workspace</div><nav className="mt-2 space-y-1"><SidebarNavItem active={path === '/app'} icon={Home} label="Home" onClick={() => go('/app')} /><SidebarNavItem active={path === '/app/new'} icon={Plus} label="New project" onClick={() => go('/app/new')} /><SidebarNavItem active={false} icon={Grid2X2} label="Templates" onClick={() => go('/app/new')} /><SidebarNavItem active={false} icon={Link2} label="Integrations" onClick={() => go(`${PROJECT_PATH}/integrations`)} /></nav></>}
  <div className="mt-auto space-y-1"><SidebarNavItem active={false} icon={Settings} label="Settings" onClick={() => go('/app')} /><div className="flex items-center gap-3 rounded-xl border border-border bg-background px-3 py-3"><span className="grid h-8 w-8 place-items-center rounded-full bg-primary/15 text-xs font-semibold text-primary">AM</span><div className="min-w-0"><p className="truncate text-xs font-medium">Alex Morgan</p><p className="truncate text-[10px] text-muted-foreground">Local builder</p></div><MoreHorizontal className="ml-auto h-4 w-4 text-muted-foreground" /></div></div></aside>
}

function AppShell({ children, path, mode, onNavigate, sampleData, onToggleSample, theme, onToggleTheme, onAskArchitect, onOpenPalette, activeAgentId, topActions, title }: { children: ReactNode; path: string; mode: 'autopilot' | 'collaborative'; onNavigate: (path: string) => void; sampleData: boolean; onToggleSample: (next: boolean) => void; theme: ThemeMode; onToggleTheme: () => void; onAskArchitect: () => void; onOpenPalette: () => void; activeAgentId: string | null; topActions?: ReactNode; title: string }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const project = path.startsWith(PROJECT_PATH)
  return <div className="min-h-screen bg-background text-foreground"><div className={`fixed inset-0 z-40 bg-black/60 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`} onClick={() => setSidebarOpen(false)} aria-hidden="true" /><div className={`fixed inset-y-0 left-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}><ProjectSidebar path={path} onNavigate={onNavigate} onClose={() => setSidebarOpen(false)} /></div><div className="flex min-h-screen"><div className="hidden lg:block"><ProjectSidebar path={path} onNavigate={onNavigate} /></div><main className="min-w-0 flex-1"><header className="sticky top-0 z-30 flex min-h-16 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur-md sm:px-6"><Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl lg:hidden" onClick={() => setSidebarOpen(true)} aria-label="Open navigation"><Menu className="h-4 w-4" /></Button><div className="min-w-0"><p className="truncate text-sm font-semibold">{title}</p><p className="hidden truncate text-[10px] text-muted-foreground sm:block">{project ? 'Expense Intelligence workspace' : 'Product creation workspace'}</p></div>{project && <div className="hidden items-center gap-2 md:flex"><StatusDot tone="success" /><span className="text-[10px] text-muted-foreground">{path.endsWith('/deploy') ? 'All changes saved' : 'Live workspace'}</span><StatusBadge tone={mode === 'autopilot' ? 'warning' : 'neutral'}>{mode === 'autopilot' ? 'Build for me' : 'Build with me'}</StatusBadge></div>}<div className="ml-auto flex min-w-0 items-center gap-2"><AgentPresence activeAgentId={activeAgentId} /><div className="hidden items-center gap-2 sm:flex"><SampleToggle enabled={sampleData} onChange={onToggleSample} /><ThemeToggle theme={theme} onToggle={onToggleTheme} /></div><Button variant="outline" className="hidden h-10 rounded-xl border-border bg-card px-3 text-xs hover:border-primary/50 hover:bg-muted sm:inline-flex" onClick={onOpenPalette}><Command className="mr-2 h-3.5 w-3.5" />K</Button><Button variant="ghost" className="h-10 rounded-xl px-3 text-xs text-muted-foreground hover:bg-muted hover:text-foreground" onClick={onAskArchitect}><Sparkles className="mr-2 h-3.5 w-3.5 text-primary" />Ask Architect</Button><UserMenu className="hidden sm:block" />{topActions}</div></header><div className="sm:hidden flex items-center justify-between border-b border-border/70 px-4 py-2"><SampleToggle enabled={sampleData} onChange={onToggleSample} /><ThemeToggle theme={theme} onToggle={onToggleTheme} /></div>{children}</main></div></div>
}

function HomeScreen({ sampleData, onNavigate }: { sampleData: boolean; onNavigate: (path: string) => void }) {
  return <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-10"><SectionHeading eyebrow="Workspace home" title="Build software with a visible path." description="Continue the flagship demo or start a new product idea. Temporary demo state resets when the page is refreshed." action={<Button className="h-10 rounded-xl bg-primary text-xs text-primary-foreground hover:bg-primary/90" onClick={() => onNavigate('/app/new')}><Plus className="mr-2 h-4 w-4" />New project</Button>} /><div className="mt-8">{sampleData ? <div className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]"><button className="group rounded-3xl border border-primary/30 bg-card p-6 text-left shadow-xl shadow-primary/5 transition-colors hover:border-primary/60" onClick={() => onNavigate(PROJECT_PATH)}><div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex items-center gap-2"><StatusBadge tone="success"><StatusDot tone="success" />Live workspace</StatusBadge><span className="font-mono text-[10px] text-muted-foreground">updated just now</span></div><h2 className="mt-5 text-2xl font-semibold tracking-tight">Expense Intelligence</h2><p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">AI-assisted expense operations for employees, finance managers, and administrators.</p></div><span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary transition-transform group-hover:translate-x-1"><ArrowUpRight className="h-5 w-5" /></span></div><div className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-3"><div className="bg-background p-4"><p className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Build status</p><p className="mt-2 text-lg font-semibold">Ready</p><p className="mt-1 text-[10px] text-emerald-300">Preview available</p></div><div className="bg-background p-4"><p className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Architecture</p><p className="mt-2 text-lg font-semibold">10 nodes</p><p className="mt-1 text-[10px] text-muted-foreground">Inspectable system</p></div><div className="bg-background p-4"><p className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Release</p><p className="mt-2 text-lg font-semibold">Draft</p><p className="mt-1 text-[10px] text-muted-foreground">Review pending</p></div></div><div className="mt-5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground"><span className="inline-flex items-center gap-1.5"><Bot className="h-3.5 w-3.5 text-primary" />4 simulated agents</span><span className="inline-flex items-center gap-1.5"><GitBranch className="h-3.5 w-3.5 text-primary" />GitHub prepared</span><span className="inline-flex items-center gap-1.5"><Database className="h-3.5 w-3.5 text-primary" />5 entities</span></div></button><div className="space-y-5"><div className="rounded-3xl border border-border bg-card p-6"><PageEyebrow icon={Sparkles}>Suggested next step</PageEyebrow><h3 className="mt-4 text-lg font-semibold">Inspect the architecture</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Open the receipt agent, then accept the system design to begin the staged build.</p><Button variant="outline" className="mt-5 h-10 rounded-xl border-border text-xs hover:border-primary/50 hover:bg-muted" onClick={() => onNavigate(`${PROJECT_PATH}/architecture`)}>Open architecture <ArrowRight className="ml-2 h-3.5 w-3.5" /></Button></div><div className="rounded-3xl border border-border bg-card p-6"><div className="flex items-center justify-between"><p className="text-sm font-semibold">Recent activity</p><History className="h-4 w-4 text-muted-foreground" /></div><div className="mt-4 space-y-4"><ActivityRow icon={CheckCircle2} title="Workspace preview ready" detail="Expense Intelligence" /><ActivityRow icon={Bot} title="Receipt Agent configured" detail="4 guardrails enabled" /><ActivityRow icon={GitBranch} title="Repository connected" detail="12 files prepared" /></div></div></div></div> : <div className="rounded-3xl border border-dashed border-border bg-card/50 px-6 py-16 text-center"><div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary"><Plus className="h-6 w-6" /></div><h2 className="mt-5 text-xl font-semibold">Start a new product workspace</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">Sample data is off. Describe an idea to create the next local project, or turn Sample Data back on to revisit Expense Intelligence.</p><Button className="mt-6 h-11 rounded-xl bg-primary text-xs text-primary-foreground hover:bg-primary/90" onClick={() => onNavigate('/app/new')}><Sparkles className="mr-2 h-4 w-4" />Describe an idea</Button></div>}</div></div>
}

function ActivityRow({ icon: Icon, title, detail }: { icon: typeof CheckCircle2; title: string; detail: string }) {
  return <div className="flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-lg bg-muted text-primary"><Icon className="h-4 w-4" /></span><div className="min-w-0"><p className="truncate text-xs font-medium">{title}</p><p className="truncate text-[10px] text-muted-foreground">{detail}</p></div><StatusDot tone="success" /></div>
}

function RequirementsSummary({ sampleData }: { sampleData: boolean }) {
  const users = ['Employee', 'Finance Manager', 'Administrator']
  const workflows = ['Upload receipt', 'Extract information', 'Categorize expense', 'Submit expense', 'Manager approval', 'Finance review']
  const capabilities = ['Receipt OCR', 'AI categorization', 'Audit history']
  if (!sampleData) return <div className="rounded-2xl border border-dashed border-border bg-background/60 p-6 text-center"><Info className="mx-auto h-5 w-5 text-primary" /><h3 className="mt-3 text-sm font-semibold">Requirements appear after your idea.</h3><p className="mt-2 text-xs leading-5 text-muted-foreground">Keep Sample Data off to write your own prompt, then let the local copilot structure it.</p></div>
  return <div className="overflow-hidden rounded-2xl border border-border bg-background"><div className="flex items-center gap-3 border-b border-border p-4"><span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary"><Sparkles className="h-4 w-4" /></span><div><p className="text-sm font-semibold">Expense Intelligence</p><p className="text-[10px] text-muted-foreground">AI-assisted expense operations</p></div><StatusBadge tone="success"><Check className="h-3 w-3" />Analysis complete</StatusBadge></div><div className="space-y-5 p-5"><div><p className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Users</p><div className="mt-2 flex flex-wrap gap-2">{users.map((user) => <span key={user} className="rounded-lg border border-border bg-card px-2.5 py-1.5 text-[11px] text-foreground">{user}</span>)}</div></div><div><p className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Core workflows</p><div className="mt-2 grid gap-2 sm:grid-cols-2">{workflows.map((workflow, index) => <div key={workflow} className="flex items-center gap-2 text-xs text-muted-foreground"><span className="font-mono text-[10px] text-primary">0{index + 1}</span>{workflow}</div>)}</div></div><div><p className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Capabilities</p><div className="mt-2 flex flex-wrap gap-2">{capabilities.map((capability) => <span key={capability} className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/20 bg-emerald-400/5 px-2.5 py-1.5 text-[11px] text-emerald-200"><Check className="h-3 w-3" />{capability}</span>)}</div></div></div></div>
}

function NewProjectScreen({ prompt, setPrompt, mode, setMode, stage, sampleData, formError, onBuild, onLooksGood }: { prompt: string; setPrompt: (value: string) => void; mode: 'autopilot' | 'collaborative'; setMode: (mode: 'autopilot' | 'collaborative') => void; stage: OnboardingStage; sampleData: boolean; formError: string; onBuild: () => void; onLooksGood: () => void }) {
  return <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-10"><JourneyRail current={stage === 'review' ? 'requirements' : 'idea'} />{stage === 'analyzing' ? <div className="mx-auto max-w-2xl py-20 text-center"><div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary"><Loader2 className="h-7 w-7 animate-spin" /></div><PageEyebrow icon={Bot}>Architect Product Copilot is working</PageEyebrow><h1 className="mt-4 text-3xl font-semibold tracking-tight">Understanding your idea...</h1><p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-muted-foreground">The local copilot is mapping users, workflows, and capabilities before it proposes a system design.</p><div className="mx-auto mt-8 max-w-md space-y-3 text-left">{['Reading the product intent', 'Identifying users and workflows', 'Preparing a reviewable handoff'].map((step, index) => <div key={step} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 text-xs"><span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 font-mono text-[10px] text-primary">0{index + 1}</span><span className={index === 0 ? 'text-foreground' : 'text-muted-foreground'}>{step}</span>{index === 0 ? <Loader2 className="ml-auto h-3.5 w-3.5 animate-spin text-primary" /> : <Circle className="ml-auto h-3.5 w-3.5 text-muted-foreground" />}</div>)}</div></div> : <><SectionHeading eyebrow="01 · Discover and define" title={stage === 'review' ? 'Here is what Architect understood.' : 'What are you building?'} description={stage === 'review' ? 'Review the shared understanding before the system design becomes concrete.' : 'Describe the outcome. Architect will turn it into requirements, system design, agents, and a working application.'} action={<StatusBadge tone="success"><StatusDot tone="success" />Build with control</StatusBadge>} /><div className="mt-8 grid gap-6 xl:grid-cols-[1.03fr_0.97fr]"><section className="rounded-3xl border border-border bg-card p-6 shadow-xl shadow-black/10 sm:p-8"><div className="flex items-center justify-between gap-3"><label htmlFor="idea-prompt" className="text-sm font-semibold">Product intent</label><span className="font-mono text-[10px] text-muted-foreground">{prompt.length}/500</span></div><Textarea id="idea-prompt" value={prompt} onChange={(event) => setPrompt(event.target.value.slice(0, 500))} placeholder="Describe the product outcome, users, and the workflow you want to improve." className="mt-4 min-h-48 resize-none rounded-2xl border-border bg-background p-4 text-sm leading-6 focus-visible:ring-primary" />{formError && <p className="mt-3 flex items-center gap-2 text-xs text-destructive"><AlertCircle className="h-3.5 w-3.5" />{formError}</p>}<div className="mt-7"><p className="text-xs font-semibold">How much control do you want?</p><div className="mt-3 grid gap-3 sm:grid-cols-2"><button className={`rounded-2xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${mode === 'autopilot' ? 'border-primary/50 bg-primary/10' : 'border-border bg-background hover:border-primary/30'}`} onClick={() => setMode('autopilot')}><div className="flex items-center justify-between"><span className="text-sm font-semibold">Build for me</span><span className={`h-4 w-4 rounded-full border-2 ${mode === 'autopilot' ? 'border-primary bg-primary/20' : 'border-muted-foreground'}`} /></div><span className="mt-2 block text-xs leading-5 text-muted-foreground">Architect handles most technical decisions and keeps you moving.</span></button><button className={`rounded-2xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${mode === 'collaborative' ? 'border-primary/50 bg-primary/10' : 'border-border bg-background hover:border-primary/30'}`} onClick={() => setMode('collaborative')}><div className="flex items-center justify-between"><span className="text-sm font-semibold">Build with me</span><span className={`h-4 w-4 rounded-full border-2 ${mode === 'collaborative' ? 'border-primary bg-primary/20' : 'border-muted-foreground'}`} /></div><span className="mt-2 block text-xs leading-5 text-muted-foreground">Review architecture, agents, and implementation before anything changes.</span></button></div></div><div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center"><Button className="h-11 rounded-xl bg-primary px-5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 active:scale-[0.98]" onClick={onBuild}><Sparkles className="mr-2 h-4 w-4" />{stage === 'review' ? 'Re-run understanding' : 'Build application'}<ArrowRight className="ml-2 h-4 w-4" /></Button><span className="text-[11px] text-muted-foreground">{sampleData ? 'Expense Intelligence is ready as a starting point.' : 'Your prompt stays in this browser session only.'}</span></div></section><section className="rounded-3xl border border-border bg-muted/20 p-6 sm:p-8"><div className="flex items-start justify-between gap-3"><div><PageEyebrow icon={Sparkles}>Transparent handoff</PageEyebrow><h2 className="mt-3 text-xl font-semibold">{stage === 'review' ? 'Review the requirements' : 'The output you will review'}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Architect pauses before it commits to a technical direction.</p></div><StatusBadge tone={stage === 'review' ? 'success' : 'neutral'}>{stage === 'review' ? <><Check className="h-3 w-3" />Ready</> : 'Preview'}</StatusBadge></div><div className="mt-6"><RequirementsSummary sampleData={sampleData || stage === 'review'} /></div>{stage === 'review' && <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end"><Button variant="outline" className="h-10 rounded-xl border-border text-xs hover:bg-muted" onClick={onBuild}><ArrowLeft className="mr-2 h-3.5 w-3.5" />Edit requirements</Button><Button className="h-10 rounded-xl bg-primary text-xs text-primary-foreground hover:bg-primary/90" onClick={onLooksGood}>Looks good <ArrowRight className="ml-2 h-3.5 w-3.5" /></Button></div>}</section></div></>}</div>
}

function BuildScreen({ progress, onOpenWorkspace }: { progress: number; onOpenWorkspace: () => void }) {
  const taskCount = Math.min(buildTasks.length, Math.max(1, Math.ceil(progress / 16.7)))
  return <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-10"><JourneyRail current="build" /><SectionHeading eyebrow="03 · Design and build" title="Architect is building the application." description="The build is staged so you can see what changes, where it lands, and what is ready next." action={<StatusBadge tone="success"><StatusDot tone="active" pulse />Simulated build</StatusBadge>} /><div className="mx-auto mt-10 grid max-w-5xl gap-5 lg:grid-cols-[0.85fr_1.15fr]"><div className="rounded-3xl border border-border bg-card p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-semibold">Application architecture</p><p className="mt-1 text-[11px] text-muted-foreground">Inspectable system · 10 nodes</p></div><StatusBadge tone="success">{progress}%</StatusBadge></div><div className="mt-6 space-y-3">{buildTasks.map((task, index) => <div key={task} className="flex items-center gap-3 text-xs"><span className={`grid h-6 w-6 place-items-center rounded-lg ${index < taskCount ? 'bg-emerald-400/10 text-emerald-300' : index === taskCount ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>{index < taskCount ? <Check className="h-3.5 w-3.5" /> : index === taskCount ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Circle className="h-3.5 w-3.5" />}</span><span className={index < taskCount ? 'text-foreground' : 'text-muted-foreground'}>{task}</span></div>)}</div><div className="mt-7 h-2 overflow-hidden rounded-full bg-muted"><span className="block h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${progress}%` }} /></div><div className="mt-3 flex justify-between font-mono text-[10px] text-muted-foreground"><span>Build progress</span><span className="tabular-nums">{progress}%</span></div></div><div className="rounded-3xl border border-border bg-card p-4 sm:p-6"><div className="flex items-center justify-between px-1"><div><p className="text-sm font-semibold">Workspace preview</p><p className="mt-1 text-[11px] text-muted-foreground">The live surface will appear after the final check.</p></div><Terminal className="h-4 w-4 text-primary" /></div><div className="mt-5 grid min-h-64 grid-cols-[0.65fr_1.15fr_1fr] overflow-hidden rounded-2xl border border-border bg-background"><div className="space-y-3 border-r border-border p-4"><span className="block h-2 w-3/4 rounded bg-muted" /><span className="block h-2 w-full rounded bg-muted" /><span className="block h-2 w-5/6 rounded bg-primary/30" /><span className="block h-2 w-2/3 rounded bg-muted" /><span className="block h-2 w-4/5 rounded bg-muted" /></div><div className="border-r border-border p-4"><div className="rounded-xl border border-primary/20 bg-primary/5 p-3"><div className="flex items-center gap-2"><Bot className="h-4 w-4 text-primary" /><span className="text-[10px] font-medium">Building Receipt Agent</span></div><p className="mt-2 text-[10px] leading-5 text-muted-foreground">Adding validation and confidence handling.</p></div><div className="mt-4 space-y-3"><span className="block h-2 w-full rounded bg-muted" /><span className="block h-2 w-4/5 rounded bg-muted" /><span className="block h-2 w-11/12 rounded bg-muted" /></div></div><div className="bg-background p-4"><div className="grid grid-cols-3 gap-2"><span className="h-9 rounded-lg bg-muted" /><span className="h-9 rounded-lg bg-muted" /><span className="h-9 rounded-lg bg-muted" /></div><div className="mt-4 flex h-28 items-end gap-2 border-b border-border"><span className="h-1/3 flex-1 rounded-t bg-primary/50" /><span className="h-2/3 flex-1 rounded-t bg-cyan-300/60" /><span className="h-1/2 flex-1 rounded-t bg-primary/70" /><span className="h-5/6 flex-1 rounded-t bg-primary" /><span className="h-3/4 flex-1 rounded-t bg-cyan-300/70" /></div></div></div>{progress >= 100 && <Button className="mt-5 h-11 w-full rounded-xl bg-primary text-xs text-primary-foreground hover:bg-primary/90" onClick={onOpenWorkspace}>Open workspace <ArrowRight className="ml-2 h-4 w-4" /></Button>}</div></div></div>
}

function ArchitectureNodeCard({ node, selected, onSelect }: { node: typeof architectureNodes[number]; selected: boolean; onSelect: () => void }) {
  const Icon = node.icon
  return <button onClick={onSelect} className={`group min-h-28 rounded-2xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${selected ? 'border-primary/60 bg-primary/10 shadow-lg shadow-primary/10' : 'border-border bg-card hover:border-primary/40 hover:bg-muted/60'}`}><div className="flex items-start justify-between gap-3"><span className={`grid h-8 w-8 place-items-center rounded-lg ${selected ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground group-hover:text-primary'}`}><Icon className="h-4 w-4" /></span><StatusDot tone="success" /></div><p className="mt-4 text-[10px] font-semibold tracking-wide text-foreground">{node.label}</p><p className="mt-1 text-[11px] leading-5 text-muted-foreground">{node.description}</p></button>
}

function ArchitectureDetail({ selectedNode, onSelectAgent, onAccept }: { selectedNode: typeof architectureNodes[number]; onSelectAgent: () => void; onAccept: () => void }) {
  const Icon = selectedNode.icon
  return <aside className="flex min-h-[540px] flex-col rounded-3xl border border-border bg-card p-6 shadow-xl shadow-black/10"><div className="flex items-start gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl border border-primary/20 bg-primary/10 text-primary"><Icon className="h-5 w-5" /></span><div className="min-w-0"><p className="text-lg font-semibold">{selectedNode.label.replace(' AGENT', ' Agent')}</p><div className="mt-1 flex items-center gap-2"><StatusDot tone="success" /><span className="text-[10px] text-emerald-300">Configured</span></div></div></div><div className="mt-8 space-y-6"><div><p className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Purpose</p><p className="mt-2 text-sm leading-6 text-muted-foreground">{selectedNode.id === 'receipt' ? 'Extract structured information from uploaded receipts and validate the result before categorization.' : selectedNode.description}</p></div><div><p className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Model</p><div className="mt-2 flex items-center justify-between rounded-xl border border-border bg-background px-3 py-3 text-xs"><span className="font-medium">GPT-5.6</span><span className="font-mono text-[10px] text-muted-foreground">Temperature 0.2</span></div></div><div><p className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Tools</p><div className="mt-2 flex flex-wrap gap-2"><span className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-[10px]">OCR</span><span className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-[10px]">Expense Database</span><span className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-[10px]">Validation Service</span></div></div><div><p className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Guardrails</p><div className="mt-2 space-y-2">{['Structured output', 'Confidence threshold', 'PII handling'].map((guardrail) => <div key={guardrail} className="flex items-center gap-2 text-xs text-muted-foreground"><Check className="h-3.5 w-3.5 text-emerald-300" />{guardrail}</div>)}</div></div></div><div className="mt-auto flex flex-col gap-2 pt-8 sm:flex-row"><Button variant="outline" className="h-10 flex-1 rounded-xl border-border text-xs hover:bg-muted" onClick={onSelectAgent}><Settings className="mr-2 h-3.5 w-3.5" />Configure</Button><Button className="h-10 flex-1 rounded-xl bg-primary text-xs text-primary-foreground hover:bg-primary/90" onClick={onSelectAgent}><Play className="mr-2 h-3.5 w-3.5" />Test agent</Button><Button className="h-10 rounded-xl bg-primary text-xs text-primary-foreground hover:bg-primary/90 sm:hidden" onClick={onAccept}>Accept architecture</Button></div></aside>
}

function ArchitectureScreen({ selectedNodeId, onSelectNode, onOpenAgent, onAccept, onShare }: { selectedNodeId: string; onSelectNode: (id: string) => void; onOpenAgent: () => void; onAccept: () => void; onShare: () => void }) {
  const [zoom, setZoom] = useState(85)
  const selectedNode = architectureNodes.find((node) => node.id === selectedNodeId) ?? architectureNodes[4]
  const platformNodes = architectureNodes.filter((node) => node.group === 'platform')
  const agentNodes = architectureNodes.filter((node) => node.group === 'agent')
  const dataNodes = architectureNodes.filter((node) => node.group === 'data')
  return <div className="mx-auto max-w-[1500px] px-5 py-8 lg:px-8 lg:py-10"><JourneyRail current="architecture" /><SectionHeading eyebrow="02 · Design and inspect" title="Application Architecture" description="Architect designed this system from your approved requirements. Open any node to inspect its purpose, model, tools, and guardrails." action={<><Button variant="outline" className="h-10 rounded-xl border-border text-xs hover:bg-muted" onClick={onShare}><Copy className="mr-2 h-3.5 w-3.5" />Share</Button><Button className="h-10 rounded-xl bg-primary text-xs text-primary-foreground hover:bg-primary/90" onClick={onAccept}>Accept architecture <ArrowRight className="ml-2 h-3.5 w-3.5" /></Button></>} /><div className="mt-8 grid gap-5 xl:grid-cols-[minmax(0,1fr)_350px]"><section className="relative overflow-hidden rounded-3xl border border-border bg-muted/10 p-5 shadow-xl shadow-black/10 sm:p-7"><div className="pointer-events-none absolute inset-0 bg-[radial-gradient(hsl(var(--border))_1px,transparent_1px)] bg-[length:22px_22px] opacity-30" /><div className="relative"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">System canvas</p><p className="mt-2 text-sm text-muted-foreground">Connected decisions from request to governed data.</p></div><div className="flex items-center gap-1 rounded-xl border border-border bg-card p-1"><Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" aria-label="Zoom out" onClick={() => setZoom((current) => Math.max(50, current - 10))}><Minus className="h-3.5 w-3.5" /></Button><span className="px-2 font-mono text-[10px] text-muted-foreground">{zoom}%</span><Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" aria-label="Zoom in" onClick={() => setZoom((current) => Math.min(125, current + 10))}><Plus className="h-3.5 w-3.5" /></Button></div></div><div className="mt-8 grid gap-3 md:grid-cols-2 xl:grid-cols-4">{platformNodes.map((node, index) => <div key={node.id} className="relative"><ArchitectureNodeCard node={node} selected={selectedNodeId === node.id} onSelect={() => onSelectNode(node.id)} />{index < platformNodes.length - 1 && <ArrowRight className="absolute -right-3 top-1/2 z-10 hidden h-5 w-5 -translate-y-1/2 text-primary/60 xl:block" />}</div>)}</div><div className="mx-auto flex h-12 w-px items-end justify-center bg-gradient-to-b from-primary to-transparent"><ArrowDown className="mb-[-7px] h-4 w-4 text-primary" /></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{agentNodes.map((node) => <ArchitectureNodeCard key={node.id} node={node} selected={selectedNodeId === node.id} onSelect={() => onSelectNode(node.id)} />)}</div><div className="mt-5 grid gap-3 md:grid-cols-2">{dataNodes.map((node) => <ArchitectureNodeCard key={node.id} node={node} selected={selectedNodeId === node.id} onSelect={() => onSelectNode(node.id)} />)}</div><div className="mt-6 flex flex-wrap items-center gap-4 border-t border-border/70 pt-5 text-[10px] text-muted-foreground"><span className="inline-flex items-center gap-2"><StatusDot tone="success" />Configured node</span><span className="inline-flex items-center gap-2"><StatusDot tone="active" />Interactive detail</span><span className="inline-flex items-center gap-2"><Network className="h-3.5 w-3.5 text-primary" />Directional system flow</span></div></div></section><ArchitectureDetail selectedNode={selectedNode} onSelectAgent={onOpenAgent} onAccept={onAccept} /></div></div>
}

function CopilotResponseCard({ data, compact = false }: { data: CopilotPayload; compact?: boolean }) {
  return <div className={`rounded-2xl border border-border bg-background ${compact ? 'p-4' : 'p-5'}`}><div className="flex items-start justify-between gap-3"><div className="flex items-start gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary"><Sparkles className="h-4 w-4" /></span><div><p className="text-xs font-semibold">Architect Product Copilot</p><p className="mt-1 text-[10px] text-muted-foreground">{data.metadata.agent_name} · {data.metadata.timestamp}</p></div></div><StatusBadge tone="success">{Math.round(data.confidence * 100)}% confidence</StatusBadge></div><div className="mt-5 space-y-5"><div><p className="font-mono text-[9px] uppercase tracking-[0.14em] text-primary">Understood</p><div className="mt-2">{renderMarkdown(data.understood)}</div></div><div><p className="font-mono text-[9px] uppercase tracking-[0.14em] text-primary">Plan</p><ol className="mt-2 space-y-2">{Array.isArray(data.plan) && data.plan.map((item, index) => <li key={item} className="flex gap-2 text-xs leading-5 text-muted-foreground"><span className="font-mono text-[10px] text-primary">0{index + 1}</span><span>{item}</span></li>)}</ol></div><div><p className="font-mono text-[9px] uppercase tracking-[0.14em] text-primary">Changes</p><div className="mt-2 space-y-2">{Array.isArray(data.changes) && data.changes.map((change) => <div key={`${change.area}-${change.action}`} className="rounded-xl border border-border p-3"><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs font-medium">{change.action}</span><StatusBadge>{change.area}</StatusBadge></div><p className="mt-2 text-xs leading-5 text-muted-foreground">{change.rationale}</p><div className="mt-2 flex flex-wrap gap-1.5">{Array.isArray(change.files_or_surfaces) && change.files_or_surfaces.map((surface) => <span key={surface} className="rounded-md bg-muted px-2 py-1 font-mono text-[9px] text-muted-foreground">{surface}</span>)}</div></div>)}</div></div><div className="rounded-xl border border-primary/20 bg-primary/5 p-3"><p className="font-mono text-[9px] uppercase tracking-[0.14em] text-primary">Next</p><p className="mt-2 text-xs leading-5 text-muted-foreground">{data.next_step}</p></div></div></div>
}

function WorkspaceExplorer({ selectedFile, onSelectFile }: { selectedFile: string; onSelectFile: (file: string) => void }) {
  return <aside className="min-w-0 rounded-2xl border border-border bg-card p-3"><div className="flex items-center justify-between px-2 py-2"><span className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Project explorer</span><FolderOpen className="h-3.5 w-3.5 text-muted-foreground" /></div><div className="mt-2 space-y-0.5">{codeFiles.map((item) => <button key={`${item.type}-${item.name}`} onClick={() => item.type === 'file' && onSelectFile(item.name)} className={`flex min-h-8 w-full items-center gap-2 rounded-lg px-2 text-left font-mono text-[10px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${item.type === 'file' && selectedFile === item.name ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'} ${item.depth === 0 ? 'pl-2' : item.depth === 1 ? 'pl-5' : item.depth === 2 ? 'pl-8' : 'pl-11'}`}>{item.type === 'folder' ? <Folder className="h-3.5 w-3.5 shrink-0" /> : <FileCode2 className="h-3.5 w-3.5 shrink-0" />}{item.name}{item.type === 'folder' && <ChevronDown className="ml-auto h-3 w-3" />}</button>)}</div><div className="mt-5 border-t border-border/70 pt-4"><p className="px-2 font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Workspace status</p><div className="mt-3 space-y-2 px-2 text-[10px] text-muted-foreground"><div className="flex items-center justify-between"><span>Files</span><span className="font-mono tabular-nums text-foreground">12</span></div><div className="flex items-center justify-between"><span>Changed</span><span className="font-mono tabular-nums text-primary">3</span></div><div className="flex items-center justify-between"><span>Branch</span><span className="font-mono text-foreground">main</span></div></div></div></aside>
}

function WorkspaceCenter({ centerTab, setCenterTab, selectedFile, appliedChanges, request, setRequest, onPlan, onApply, planReady, onReviewDiff, planningError }: { centerTab: CenterTab; setCenterTab: (tab: CenterTab) => void; selectedFile: string; appliedChanges: boolean; request: string; setRequest: (value: string) => void; onPlan: () => void; onApply: () => void; planReady: boolean; onReviewDiff: () => void; planningError: string }) {
  const [copied, setCopied] = useState(false)
  const tabs: { id: CenterTab; label: string; icon: typeof Code2 }[] = [{ id: 'code', label: 'Code', icon: Code2 }, { id: 'ai', label: 'AI', icon: Sparkles }, { id: 'architecture', label: 'Architecture', icon: Network }, { id: 'diff', label: 'Diff', icon: GitBranch }]
  return <section className="min-w-0 overflow-hidden rounded-2xl border border-border bg-card"><div className="flex min-w-0 overflow-x-auto border-b border-border px-2 sm:px-3">{tabs.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => setCenterTab(id)} className={`flex min-h-12 shrink-0 items-center gap-2 border-b-2 px-3 text-[11px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary ${centerTab === id ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}><Icon className="h-3.5 w-3.5" />{label}{id === 'diff' && <span className="rounded-full bg-primary/10 px-1.5 py-0.5 font-mono text-[9px] text-primary">3</span>}</button>)}</div>{centerTab === 'code' && <div className="min-h-[620px] overflow-x-auto p-4 sm:p-6"><div className="flex items-center justify-between border-b border-border/70 pb-4"><div><p className="font-mono text-[10px] text-primary">src/components/{selectedFile}</p><p className="mt-1 text-[11px] text-muted-foreground">Read-only generated surface</p></div><Button variant="outline" className="h-10 rounded-xl border-border text-[10px] hover:bg-muted" onClick={() => { setCopied(true); window.setTimeout(() => setCopied(false), 1400) }}><Copy className="mr-2 h-3.5 w-3.5" />{copied ? 'Copied' : 'Copy'}</Button></div><pre className="mt-5 min-w-[540px] font-mono text-[10px] leading-6 text-muted-foreground"><code>{`01  import { CategorySpendChart } from './CategorySpendChart'\n02  import { getMonthlySpendByCategory } from '../api/expenses'\n03\n04  export async function ExpenseDashboard() {\n05    const data = await getMonthlySpendByCategory({\n06      range: 'last-six-months',\n07      includePending: true,\n08    })\n09\n10    return (\n11      <DashboardShell title="Expense Intelligence">\n12        <SummaryCards data={data.summary} />\n13        <CategorySpendChart data={data.categories} />\n14        <RecentExpenses items={data.recent} />\n15      </DashboardShell>\n16    )\n17  }`}</code></pre></div>}{centerTab === 'ai' && <div className="min-h-[620px] p-4 sm:p-6"><div className="flex items-start gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary"><Sparkles className="h-4 w-4" /></span><div><h2 className="text-sm font-semibold">Architect AI</h2><div className="mt-1 flex items-center gap-2 text-[10px] text-emerald-300"><StatusDot tone="success" />Context aware · local fixture</div></div></div><div className="mt-6 rounded-2xl border border-border bg-background p-4"><p className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Your request</p><Textarea value={request} onChange={(event) => setRequest(event.target.value)} className="mt-3 min-h-20 resize-none rounded-xl border-border bg-card text-xs leading-5" /><div className="mt-3 flex flex-wrap items-center gap-2"><Button className="h-10 rounded-xl bg-primary px-3 text-[10px] text-primary-foreground hover:bg-primary/90" onClick={onPlan}><Sparkles className="mr-2 h-3.5 w-3.5" />Plan change</Button>{planningError && <span className="flex items-center gap-1.5 text-[10px] text-destructive"><AlertCircle className="h-3 w-3" />{planningError}</span>}</div></div><div className="mt-5 rounded-2xl border border-primary/20 bg-primary/5 p-4"><div className="flex items-start gap-3"><Bot className="mt-0.5 h-4 w-4 text-primary" /><div>{renderMarkdown('I found the dashboard visualization and expense aggregation query. I can update both while preserving the existing data model.')}</div></div></div>{planReady && <div className="mt-5"><div className="flex items-center justify-between gap-3"><p className="text-xs font-semibold">Proposed changes</p>{appliedChanges ? <StatusBadge tone="success"><Check className="h-3 w-3" />Applied</StatusBadge> : <StatusBadge>Review required</StatusBadge>}</div><div className="mt-3 space-y-2">{copilotFixture.changes.map((change) => <div key={change.action} className="flex items-start gap-3 rounded-xl border border-border bg-background p-3"><Check className="mt-0.5 h-3.5 w-3.5 text-emerald-300" /><div><p className="text-xs font-medium">{change.action}</p><p className="mt-1 text-[10px] leading-5 text-muted-foreground">{change.files_or_surfaces.join(' · ')}</p></div></div>)}</div><div className="mt-4 flex flex-wrap gap-2"><Button className="h-10 rounded-xl bg-primary px-3 text-[10px] text-primary-foreground hover:bg-primary/90" onClick={onApply} disabled={appliedChanges}>{appliedChanges ? <><Check className="mr-2 h-3.5 w-3.5" />Changes applied</> : <>Apply changes <ArrowRight className="ml-2 h-3.5 w-3.5" /></>}</Button><Button variant="outline" className="h-10 rounded-xl border-border px-3 text-[10px] hover:bg-muted" onClick={onReviewDiff}><GitBranch className="mr-2 h-3.5 w-3.5" />Review diff</Button></div></div>}</div>}{centerTab === 'architecture' && <div className="min-h-[620px] p-4 sm:p-6"><PageEyebrow icon={Network}>Workspace topology</PageEyebrow><h2 className="mt-3 text-lg font-semibold">The request stays inside the current system.</h2><p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">The dashboard reads from the existing expense resolver, while the categorization and approval agents remain unchanged.</p><div className="mt-8 space-y-3"><MiniTopologyRow icon={Database} label="Expense aggregation" detail="src/api/expenses.ts" /><ArrowDown className="ml-5 h-4 w-4 text-primary" /><MiniTopologyRow icon={Code2} label="Dashboard visualization" detail="src/components/Dashboard.tsx" /><ArrowDown className="ml-5 h-4 w-4 text-primary" /><MiniTopologyRow icon={Activity} label="Live preview" detail="expense-intelligence.local" /></div><div className="mt-8 rounded-2xl border border-border bg-background p-4"><div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-300" /><span className="text-xs font-medium">No schema migration required</span></div><p className="mt-2 text-xs leading-5 text-muted-foreground">The category grouping is computed from existing expense records and preserves audit history.</p></div></div>}{centerTab === 'diff' && <div className="min-h-[620px] overflow-x-auto p-4 sm:p-6"><div className="flex items-center justify-between gap-3"><div><PageEyebrow icon={GitBranch}>Reviewable diff</PageEyebrow><p className="mt-2 text-sm font-semibold">3 surfaces change · 0 data migrations</p></div><StatusBadge tone={appliedChanges ? 'success' : 'warning'}>{appliedChanges ? 'Applied locally' : 'Awaiting review'}</StatusBadge></div><div className="mt-6 min-w-[540px] overflow-hidden rounded-2xl border border-border font-mono text-[10px]"><div className="border-b border-border bg-muted/50 px-4 py-3 text-muted-foreground">src/components/Dashboard.tsx</div><div className="bg-destructive/10 px-4 py-2 text-red-200">− const data = await getMonthlySpend()</div><div className="bg-emerald-400/10 px-4 py-2 text-emerald-200">+ const data = await getMonthlySpendByCategory()</div><div className="bg-emerald-400/10 px-4 py-2 text-emerald-200">+ &lt;CategorySpendChart data={'{data.categories}'} /&gt;</div><div className="border-t border-border bg-muted/30 px-4 py-3 text-muted-foreground">src/api/expenses.ts</div><div className="bg-emerald-400/10 px-4 py-2 text-emerald-200">+ groupBy: ['category', 'month']</div></div><div className="mt-5 rounded-2xl border border-primary/20 bg-primary/5 p-4"><p className="text-xs font-semibold">Architect’s rationale</p><p className="mt-2 text-xs leading-5 text-muted-foreground">The change adds explanation to the existing dashboard without changing the record lifecycle or approval policy.</p></div></div>}</section>
}

function MiniTopologyRow({ icon: Icon, label, detail }: { icon: typeof Database; label: string; detail: string }) {
  return <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"><span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary"><Icon className="h-4 w-4" /></span><div><p className="text-xs font-medium">{label}</p><p className="mt-1 font-mono text-[10px] text-muted-foreground">{detail}</p></div><Check className="ml-auto h-4 w-4 text-emerald-300" /></div>
}

function WorkspacePreview({ sampleData, appliedChanges, expenses, onUpload }: { sampleData: boolean; appliedChanges: boolean; expenses: typeof sampleExpenses; onUpload: () => void }) {
  const hasData = sampleData || expenses.length > 0
  return <aside className="min-w-0 rounded-2xl border border-border bg-card p-3"><div className="flex items-center gap-2 border-b border-border px-2 pb-3"><div className="flex gap-1.5"><span className="h-2 w-2 rounded-full bg-destructive/70" /><span className="h-2 w-2 rounded-full bg-amber-300/70" /><span className="h-2 w-2 rounded-full bg-emerald-300/70" /></div><div className="ml-2 min-w-0 flex-1 truncate rounded-md border border-border bg-background px-2 py-1.5 text-center font-mono text-[9px] text-muted-foreground">expense-intelligence.local</div><StatusDot tone="success" /></div>{hasData ? <div className="p-3"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold">Expense Intelligence</p><p className="mt-1 text-[10px] text-muted-foreground">Good morning, Alex</p></div><Button className="h-9 rounded-lg bg-primary px-2.5 text-[9px] text-primary-foreground hover:bg-primary/90" onClick={onUpload}><Upload className="mr-1.5 h-3 w-3" />Receipt</Button></div><div className="mt-4 grid grid-cols-3 gap-2"><PreviewStat label="Total spend" value={sampleData ? '₹24,530' : '₹842'} /><PreviewStat label="Pending" value={sampleData ? '₹8,240' : '₹842'} /><PreviewStat label="Approved" value={sampleData ? '₹16,290' : '₹0'} /></div><div className="mt-3 rounded-xl border border-border bg-background p-3"><div className="flex items-center justify-between gap-2"><p className="text-[10px] font-semibold">{appliedChanges ? 'Monthly spending by category' : 'Monthly spending overview'}</p><span className="font-mono text-[8px] text-muted-foreground">Last 6 months</span></div><div className="mt-5 flex h-28 items-end gap-2 border-b border-border px-1">{[35, 58, 44, appliedChanges ? 88 : 72, appliedChanges ? 66 : 55, appliedChanges ? 96 : 78].map((height, index) => <span key={index} className={`flex-1 rounded-t ${index % 2 === 1 ? 'bg-cyan-300/70' : 'bg-primary/80'} ${height === 35 ? 'h-[35%]' : height === 58 ? 'h-[58%]' : height === 44 ? 'h-[44%]' : height === 88 ? 'h-[88%]' : height === 72 ? 'h-[72%]' : height === 66 ? 'h-[66%]' : height === 55 ? 'h-[55%]' : height === 96 ? 'h-[96%]' : height === 78 ? 'h-[78%]' : 'h-1/2'}`} />)}</div><div className="mt-2 flex justify-between font-mono text-[8px] text-muted-foreground"><span>Travel</span><span>Food</span><span>Software</span><span>Office</span></div></div><div className="mt-3 rounded-xl border border-border bg-background p-3"><div className="flex items-center justify-between"><p className="text-[10px] font-semibold">Recent expenses</p><List className="h-3.5 w-3.5 text-muted-foreground" /></div><div className="mt-2">{expenses.length === 0 ? <p className="py-4 text-center text-[10px] text-muted-foreground">No local expenses yet.</p> : expenses.slice(0, 5).map((expense) => <div key={`${expense.merchant}-${expense.amount}`} className="flex items-center justify-between border-t border-border/70 py-2 text-[9px]"><div><p className="font-medium">{expense.merchant}</p><p className="mt-0.5 text-muted-foreground">{expense.category} · {expense.date}</p></div><div className="text-right"><p className="font-semibold tabular-nums">{expense.amount}</p><p className="mt-0.5 text-emerald-300">{expense.status}</p></div></div>)}</div></div></div> : <div className="flex min-h-[580px] flex-col items-center justify-center p-6 text-center"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary"><Upload className="h-5 w-5" /></span><h3 className="mt-4 text-sm font-semibold">Your preview is ready for data.</h3><p className="mt-2 max-w-xs text-xs leading-5 text-muted-foreground">Sample Data is off. Upload the mock Uber receipt to create your first local expense record.</p><Button className="mt-5 h-10 rounded-xl bg-primary px-4 text-xs text-primary-foreground hover:bg-primary/90" onClick={onUpload}><Upload className="mr-2 h-3.5 w-3.5" />Upload receipt</Button></div>}</aside>
}

function PreviewStat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-border bg-background p-2"><span className="block text-[8px] text-muted-foreground">{label}</span><span className="mt-1 block text-xs font-semibold tabular-nums">{value}</span></div>
}

function WorkspaceScreen({ mode, sampleData, workspacePanel, setWorkspacePanel, centerTab, setCenterTab, selectedFile, setSelectedFile, appliedChanges, request, setRequest, planReady, onPlan, onApply, onUpload, expenses, planningError, onOpenDeploy }: { mode: 'autopilot' | 'collaborative'; sampleData: boolean; workspacePanel: WorkspacePanel; setWorkspacePanel: (panel: WorkspacePanel) => void; centerTab: CenterTab; setCenterTab: (tab: CenterTab) => void; selectedFile: string; setSelectedFile: (file: string) => void; appliedChanges: boolean; request: string; setRequest: (value: string) => void; planReady: boolean; onPlan: () => void; onApply: () => void; onUpload: () => void; expenses: typeof sampleExpenses; planningError: string; onOpenDeploy: () => void }) {
  return <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-5 lg:px-8 lg:py-8"><JourneyRail current="workspace" />{mode === 'autopilot' && <div className="mb-5 rounded-2xl border border-primary/25 bg-primary/5 p-4"><div className="flex items-start gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Sparkles className="h-4 w-4" /></span><div><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-semibold">Here is what I built and why</p><StatusBadge tone="warning">Build for me</StatusBadge></div><p className="mt-2 text-xs leading-5 text-muted-foreground">Architect selected a Next.js workspace, PostgreSQL-backed account security, four focused expense agents, and a reviewable deployment path so the product is usable immediately without hiding its technical decisions.</p></div></div></div>}<div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between"><div><PageEyebrow icon={Code2}>03 · Inspect, modify, and test</PageEyebrow><h1 className="mt-2 text-2xl font-semibold tracking-tight">Expense Intelligence workspace</h1><p className="mt-2 text-sm text-muted-foreground">Browse the generated project, collaborate with Architect, and see changes in the live preview.</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" className="h-10 rounded-xl border-border text-xs hover:bg-muted" onClick={onOpenDeploy}><Rocket className="mr-2 h-3.5 w-3.5" />Review & deploy</Button><Button variant="outline" className="h-10 rounded-xl border-border text-xs hover:bg-muted" onClick={onUpload}><Upload className="mr-2 h-3.5 w-3.5" />Upload receipt</Button></div></div><div className="mb-4 flex overflow-x-auto rounded-xl border border-border bg-card p-1 lg:hidden">{([['explorer', 'Explorer', FolderOpen], ['ai', 'Architect AI', Sparkles], ['preview', 'Live preview', Globe2]] as const).map(([id, label, Icon]) => <button key={id} onClick={() => setWorkspacePanel(id)} className={`flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg px-3 text-[10px] font-medium ${workspacePanel === id ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}`}><Icon className="h-3.5 w-3.5" />{label}</button>)}</div><div className="grid min-w-0 gap-4 lg:grid-cols-[210px_minmax(0,1fr)] xl:grid-cols-[210px_minmax(390px,1fr)_minmax(340px,0.9fr)]"><div className={`${workspacePanel === 'explorer' ? 'block' : 'hidden'} lg:block`}><WorkspaceExplorer selectedFile={selectedFile} onSelectFile={setSelectedFile} /></div><div className={`${workspacePanel === 'ai' ? 'block' : 'hidden'} min-w-0 lg:block`}><WorkspaceCenter centerTab={centerTab} setCenterTab={setCenterTab} selectedFile={selectedFile} appliedChanges={appliedChanges} request={request} setRequest={setRequest} onPlan={onPlan} onApply={onApply} planReady={planReady} onReviewDiff={() => setCenterTab('diff')} planningError={planningError} /></div><div className={`${workspacePanel === 'preview' ? 'block' : 'hidden'} min-w-0 lg:col-span-2 xl:col-span-1 xl:block`}><WorkspacePreview sampleData={sampleData} appliedChanges={appliedChanges} expenses={expenses} onUpload={onUpload} /></div></div></div>
}

function AgentsScreen({ selectedAgentId, onSelectAgent, playgroundRunning, playgroundStep, onRunPlayground, onConfigure }: { selectedAgentId: string; onSelectAgent: (id: string) => void; playgroundRunning: boolean; playgroundStep: number; onRunPlayground: () => void; onConfigure: () => void }) {
  const selectedAgent = appAgents.find((agent) => agent.id === selectedAgentId) ?? appAgents[0]
  const traceSteps = ['Receipt image received', 'OCR extracted merchant and amount', 'Fields normalized to schema', 'Confidence and PII guardrails passed', 'Expense payload ready for categorization']
  return <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-10"><JourneyRail current="workspace" /><SectionHeading eyebrow="04 · Specialized intelligence" title="Agents" description="Inspect the agents that belong to Expense Intelligence, then run a deterministic trace in the playground." action={<StatusBadge tone="success"><StatusDot tone="success" />4 configured agents</StatusBadge>} /><div className="mt-8 grid gap-5 xl:grid-cols-[0.82fr_1.18fr]"><section className="space-y-3">{appAgents.map((agent) => <button key={agent.id} onClick={() => onSelectAgent(agent.id)} className={`w-full rounded-2xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${selectedAgent.id === agent.id ? 'border-primary/50 bg-primary/10' : 'border-border bg-card hover:border-primary/30 hover:bg-muted/50'}`}><div className="flex items-start gap-3"><span className={`grid h-9 w-9 place-items-center rounded-xl bg-muted ${agent.color}`}><Bot className="h-4 w-4" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-semibold">{agent.name}</p><StatusBadge tone="success"><StatusDot tone="success" />{agent.status}</StatusBadge></div><p className="mt-2 text-xs leading-5 text-muted-foreground">{agent.purpose}</p><p className="mt-3 font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">Trigger · {agent.trigger}</p></div></div></button>)}<div className="rounded-2xl border border-primary/20 bg-primary/5 p-4"><div className="flex items-start gap-3"><Sparkles className="mt-0.5 h-4 w-4 text-primary" /><div><p className="text-xs font-semibold">Powering agent</p><p className="mt-1 text-[11px] leading-5 text-muted-foreground">Architect Product Copilot explains changes across the project. These four agents execute inside the product being created.</p><p className="mt-2 font-mono text-[9px] text-primary">Agent ID · {AGENT_ID}</p></div></div></div></section><section className="rounded-3xl border border-border bg-card p-6 shadow-xl shadow-black/10 sm:p-8"><div className="flex flex-col gap-5 border-b border-border pb-6 sm:flex-row sm:items-start sm:justify-between"><div className="flex items-start gap-3"><span className={`grid h-11 w-11 place-items-center rounded-2xl bg-muted ${selectedAgent.color}`}><Bot className="h-5 w-5" /></span><div><h2 className="text-xl font-semibold">{selectedAgent.name}</h2><p className="mt-1 text-xs text-muted-foreground">{selectedAgent.model} · Temperature 0.2 · top_p 0.9</p></div></div><div className="flex gap-2"><Button variant="outline" className="h-10 rounded-xl border-border text-xs hover:bg-muted" onClick={onConfigure}><Settings className="mr-2 h-3.5 w-3.5" />Configure</Button><Button className="h-10 rounded-xl bg-primary text-xs text-primary-foreground hover:bg-primary/90" onClick={onRunPlayground} disabled={playgroundRunning}>{playgroundRunning ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Running</> : <><Play className="mr-2 h-3.5 w-3.5" />Run test</>}</Button></div></div><div className="grid gap-5 py-6 md:grid-cols-2"><div><p className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Purpose</p><p className="mt-2 text-sm leading-6 text-muted-foreground">{selectedAgent.purpose}</p></div><div><p className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Tools & data sources</p><div className="mt-2 flex flex-wrap gap-2">{selectedAgent.tools.map((tool) => <span key={tool} className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-[10px]">{tool}</span>)}</div></div></div><div className="rounded-2xl border border-border bg-background p-4"><div className="flex items-center justify-between"><div><p className="text-xs font-semibold">Execution playground</p><p className="mt-1 text-[10px] text-muted-foreground">OCR → extraction → validation → classification</p></div><StatusBadge tone={playgroundStep >= traceSteps.length ? 'success' : playgroundRunning ? 'warning' : 'neutral'}>{playgroundStep >= traceSteps.length ? 'Complete' : playgroundRunning ? 'Executing' : 'Ready'}</StatusBadge></div><div className="mt-5 space-y-2">{traceSteps.map((step, index) => <div key={step} className={`flex items-center gap-3 rounded-xl border px-3 py-3 text-xs ${index < playgroundStep ? 'border-emerald-400/20 bg-emerald-400/5' : index === playgroundStep && playgroundRunning ? 'border-primary/30 bg-primary/5' : 'border-border'}`}><span className="grid h-6 w-6 place-items-center rounded-lg bg-muted font-mono text-[9px] text-muted-foreground">{index < playgroundStep ? <Check className="h-3.5 w-3.5 text-emerald-300" /> : index === playgroundStep && playgroundRunning ? <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" /> : `0${index + 1}`}</span><span className={index < playgroundStep ? 'text-foreground' : 'text-muted-foreground'}>{step}</span><span className="ml-auto font-mono text-[9px] text-muted-foreground">{index < playgroundStep ? 'done' : index === playgroundStep && playgroundRunning ? 'running' : 'queued'}</span></div>)}</div>{playgroundStep >= traceSteps.length && <div className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-4"><div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-300" /><span className="text-xs font-semibold">Structured output passed</span></div><div className="mt-3 grid gap-2 text-[10px] text-muted-foreground sm:grid-cols-2"><span>merchant · Uber</span><span>amount · ₹842</span><span>category · Travel</span><span>confidence · 0.98</span></div></div>}</div><div className="mt-6"><p className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Guardrails</p><div className="mt-3 flex flex-wrap gap-2">{selectedAgent.guardrails.map((guardrail) => <StatusBadge key={guardrail} tone="success"><Check className="h-3 w-3" />{guardrail}</StatusBadge>)}</div></div></section></div></div>
}

function DataScreen({ selectedTableId, onSelectTable }: { selectedTableId: string; onSelectTable: (id: string) => void }) {
  const [tableNotice, setTableNotice] = useState(false)
  const selected = dataTables.find((table) => table.id === selectedTableId) ?? dataTables[1]
  return <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-10"><JourneyRail current="workspace" /><SectionHeading eyebrow="05 · Relational foundation" title="Data model" description="A simulated relational model for the product being created. Inspect the entities, columns, and workflow relationships." action={<StatusBadge tone="success"><Database className="h-3 w-3" />PostgreSQL · Mumbai</StatusBadge>} /><div className="mt-8 grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]"><section className="relative overflow-hidden rounded-3xl border border-border bg-muted/10 p-5 sm:p-7"><div className="pointer-events-none absolute inset-0 bg-[radial-gradient(hsl(var(--border))_1px,transparent_1px)] bg-[length:22px_22px] opacity-20" /><div className="relative"><div className="flex items-center justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Entity relationship canvas</p><p className="mt-2 text-sm text-muted-foreground">Click an entity to inspect its contract.</p></div><Button variant="outline" className="h-10 rounded-xl border-border text-xs hover:bg-muted" onClick={() => setTableNotice(true)}><Plus className="mr-2 h-3.5 w-3.5" />Add table</Button></div>{tableNotice && <div className="mt-4 flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-[11px] text-muted-foreground"><Info className="h-3.5 w-3.5 text-primary" />Table creation is staged for the next local schema review.</div>}<div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{dataTables.map((table, index) => <div key={table.id} className="relative"><button onClick={() => onSelectTable(table.id)} className={`w-full rounded-2xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${selected.id === table.id ? 'border-primary/60 bg-primary/10' : 'border-border bg-card hover:border-primary/30'}`}><div className="flex items-center justify-between"><span className="flex items-center gap-2"><Table2 className="h-4 w-4 text-primary" /><span className="font-mono text-xs font-semibold">{table.name}</span></span><MoreHorizontal className="h-4 w-4 text-muted-foreground" /></div><p className="mt-3 text-[11px] leading-5 text-muted-foreground">{table.description}</p><div className="mt-4 space-y-1.5">{table.columns.slice(0, 3).map((column) => <div key={column} className="rounded-md bg-background px-2 py-1.5 font-mono text-[9px] text-muted-foreground">{column}</div>)}</div><p className="mt-3 text-[10px] text-primary">{table.relation}</p></button>{index < dataTables.length - 1 && <div className="pointer-events-none absolute -bottom-5 left-1/2 hidden h-5 w-px bg-primary/30 xl:block" />}</div>)}</div><div className="mt-7 flex flex-wrap items-center gap-4 border-t border-border/70 pt-5 text-[10px] text-muted-foreground"><span className="inline-flex items-center gap-2"><Link2 className="h-3.5 w-3.5 text-primary" />Foreign key relation</span><span className="inline-flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />Audit history enabled</span></div></div></section><aside className="rounded-3xl border border-border bg-card p-6"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><Table2 className="h-4 w-4" /></span><div><p className="font-mono text-[10px] text-primary">Selected entity</p><h2 className="mt-1 text-lg font-semibold">{selected.name}</h2></div></div><p className="mt-5 text-sm leading-6 text-muted-foreground">{selected.description}</p><div className="mt-7"><p className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Columns</p><div className="mt-3 space-y-2">{selected.columns.map((column, index) => <div key={column} className="flex items-center justify-between rounded-xl border border-border bg-background px-3 py-3"><span className="font-mono text-[10px] text-foreground">{column.split(' · ')[0]}</span><span className="font-mono text-[9px] text-muted-foreground">{column.split(' · ')[1]}</span></div>)}</div></div><div className="mt-7 rounded-xl border border-primary/20 bg-primary/5 p-4"><p className="text-xs font-semibold">Relationship</p><p className="mt-2 text-xs leading-5 text-muted-foreground">This entity {selected.relation}. Changes remain local to the demo and do not provision a database.</p></div></aside></div></div>
}

function IntegrationsScreen({ connected, pushState, onConnect, onPush }: { connected: Record<string, boolean>; pushState: PushState; onConnect: (id: string) => void; onPush: () => void }) {
  const github = integrationCatalog[0]
  return <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-10"><JourneyRail current="release" /><SectionHeading eyebrow="06 · Connect the release surface" title="Integrations" description="Inspect the simulated connections that support the Expense Intelligence workflow. Nothing reaches an external service." action={<StatusBadge tone="success"><StatusDot tone="success" />Local simulation</StatusBadge>} /><div className="mt-8 grid gap-5 xl:grid-cols-[1.15fr_0.85fr]"><section className="rounded-3xl border border-border bg-card p-6 sm:p-8"><div className="flex items-start justify-between gap-3"><div><PageEyebrow icon={Github}>Source control</PageEyebrow><h2 className="mt-3 text-xl font-semibold">GitHub repository</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Push the generated project when your local review is complete.</p></div><StatusBadge tone="success"><Check className="h-3 w-3" />Connected</StatusBadge></div><div className="mt-6 rounded-2xl border border-border bg-background p-4"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-muted"><Github className="h-5 w-5" /></span><div><p className="text-sm font-semibold">{github.detail}</p><p className="mt-1 text-[10px] text-muted-foreground">main · private demo repository</p></div><GitBranch className="ml-auto h-4 w-4 text-muted-foreground" /></div><div className="mt-5 grid gap-3 sm:grid-cols-3"><div className="rounded-xl border border-border p-3"><p className="font-mono text-[9px] text-muted-foreground">Prepared files</p><p className="mt-2 text-lg font-semibold tabular-nums">12</p></div><div className="rounded-xl border border-border p-3"><p className="font-mono text-[9px] text-muted-foreground">Branch</p><p className="mt-2 font-mono text-sm">main</p></div><div className="rounded-xl border border-border p-3"><p className="font-mono text-[9px] text-muted-foreground">Latest commit</p><p className="mt-2 font-mono text-sm">{pushState === 'pushed' ? 'a8f32d1' : 'draft'}</p></div></div>{pushState === 'pushed' && <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-3 text-xs text-emerald-200"><CheckCircle2 className="h-4 w-4" />12 files pushed with commit a8f32d1.</div>}<Button className="mt-5 h-11 w-full rounded-xl bg-primary text-xs text-primary-foreground hover:bg-primary/90" onClick={onPush} disabled={pushState === 'pushing'}>{pushState === 'pushing' ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Pushing local commit</> : pushState === 'pushed' ? <><RefreshCw className="mr-2 h-4 w-4" />Push another simulated commit</> : <><Github className="mr-2 h-4 w-4" />Push 12 files to GitHub</>}</Button></div></section><section><div className="mb-4 flex items-center justify-between"><div><p className="text-sm font-semibold">Integration marketplace</p><p className="mt-1 text-[11px] text-muted-foreground">Connection states are reversible local fixtures.</p></div><SlidersHorizontal className="h-4 w-4 text-muted-foreground" /></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">{integrationCatalog.slice(1).map((integration) => { const Icon = integration.icon; const isConnected = connected[integration.id] ?? integration.connected; return <div key={integration.id} className="rounded-2xl border border-border bg-card p-4"><div className="flex items-start gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-muted text-primary"><Icon className="h-4 w-4" /></span><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><p className="text-sm font-medium">{integration.name}</p><StatusBadge tone={isConnected ? 'success' : 'neutral'}>{isConnected ? <><Check className="h-3 w-3" />Connected</> : 'Available'}</StatusBadge></div><p className="mt-2 text-xs leading-5 text-muted-foreground">{integration.description}</p><div className="mt-3 flex items-center justify-between gap-2"><span className="font-mono text-[9px] text-muted-foreground">{integration.type}</span><Button variant="outline" className="h-9 rounded-lg border-border px-2.5 text-[10px] hover:bg-muted" onClick={() => onConnect(integration.id)}>{isConnected ? 'Disconnect' : 'Simulate connection'}</Button></div></div></div></div> })}</div></section></div></div>
}

function DeployScreen({ recommendationApplied, uploadLimitApplied, deploymentState, deploymentStep, pushState, onApplyRecommendation, onApplyUploadLimit, onDeploy, onPush, onViewLogs, onOpenApplication }: { recommendationApplied: boolean; uploadLimitApplied: boolean; deploymentState: DeploymentState; deploymentStep: number; pushState: PushState; onApplyRecommendation: () => void; onApplyUploadLimit: () => void; onDeploy: () => void; onPush: () => void; onViewLogs: () => void; onOpenApplication: () => void }) {
  const readyToDeploy = recommendationApplied
  return <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-10"><JourneyRail current="release" /><SectionHeading eyebrow="07 · Review and release" title={deploymentState === 'live' ? 'Your application is live.' : 'Deploy your application'} description={deploymentState === 'live' ? 'The production sequence completed in the local demo environment.' : 'Architect reviewed the system before production. Resolve the meaningful findings, then run the staged deployment.'} action={<StatusBadge tone={deploymentState === 'live' ? 'success' : readyToDeploy ? 'success' : 'warning'}>{deploymentState === 'live' ? <><Check className="h-3 w-3" />Production</> : readyToDeploy ? 'Ready' : 'Review required'}</StatusBadge>} /><div className="mt-8 grid gap-5 xl:grid-cols-[1.1fr_0.9fr]"><section className="overflow-hidden rounded-3xl border border-border bg-card"><div className="flex items-center justify-between border-b border-border px-6 py-5"><div><p className="text-sm font-semibold">Architecture review</p><p className="mt-1 text-[10px] text-muted-foreground">Findings are deterministic and action-oriented.</p></div><span className="font-mono text-[10px] text-emerald-300">{recommendationApplied ? '9 checks passed' : '8 checks passed'}</span></div><div className="divide-y divide-border">{[{ severity: recommendationApplied ? 'RESOLVED' : 'MEDIUM', title: 'Missing AI retry policy', description: 'AI requests do not currently have a retry strategy.', recommendation: 'Add exponential backoff.', resolved: recommendationApplied, action: onApplyRecommendation }, { severity: uploadLimitApplied ? 'RESOLVED' : 'LOW', title: 'Receipt upload size', description: 'Receipt uploads should have a maximum file size.', recommendation: 'Limit uploads to 10MB.', resolved: uploadLimitApplied, action: onApplyUploadLimit }].map((finding) => <div key={finding.title} className="p-6"><div className={`flex items-center gap-2 font-mono text-[9px] ${finding.resolved ? 'text-emerald-300' : finding.severity === 'MEDIUM' ? 'text-amber-200' : 'text-muted-foreground'}`}>{finding.resolved ? <Check className="h-3.5 w-3.5" /> : finding.severity === 'MEDIUM' ? <AlertTriangle className="h-3.5 w-3.5" /> : <CircleAlert className="h-3.5 w-3.5" />}{finding.severity}</div><h3 className="mt-3 text-sm font-semibold">{finding.title}</h3><p className="mt-2 text-xs leading-5 text-muted-foreground">{finding.description}</p>{finding.resolved ? <div className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-3 text-xs text-emerald-200"><CheckCircle2 className="mr-2 inline h-3.5 w-3.5" />Recommendation applied to the local project.</div> : <div className="mt-4 flex flex-col gap-3 rounded-xl border border-border bg-background p-3 sm:flex-row sm:items-center"><span className="text-xs leading-5 text-muted-foreground"><strong className="font-semibold text-foreground">Recommendation</strong><br />{finding.recommendation}</span><Button className="h-10 shrink-0 rounded-xl bg-primary px-3 text-[10px] text-primary-foreground hover:bg-primary/90 sm:ml-auto" onClick={finding.action}>Apply recommendation</Button></div>}</div>)}</div><div className="border-t border-border p-6"><div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-4 w-4 text-emerald-300" /><div><p className="text-xs font-semibold">Authentication boundaries</p><p className="mt-1 text-[11px] leading-5 text-muted-foreground">Protected application routes require a valid user session in the generated architecture.</p></div><Check className="ml-auto h-4 w-4 text-emerald-300" /></div></div></section><section className="space-y-5"><div className="overflow-hidden rounded-3xl border border-border bg-card"><div className="flex items-center justify-between border-b border-border px-6 py-5"><div><p className="text-sm font-semibold">Production configuration</p><p className="mt-1 text-[10px] text-muted-foreground">The release target is simulated.</p></div><StatusBadge tone={readyToDeploy ? 'success' : 'warning'}>{readyToDeploy ? 'Ready' : 'Blocked'}</StatusBadge></div><div className="space-y-0 px-6">{[['Environment', 'Production'], ['Framework', 'Next.js'], ['Database', 'PostgreSQL'], ['Region', 'Mumbai'], ['Domain', DEMO_URL]].map(([label, value]) => <div key={label} className="flex min-h-12 items-center justify-between gap-4 border-b border-border/70 text-xs last:border-0"><span className="text-muted-foreground">{label}</span><span className="font-mono text-[10px] text-foreground">{value}</span></div>)}</div><div className="px-6 pb-6"><Button className="mt-5 h-11 w-full rounded-xl bg-primary text-xs text-primary-foreground hover:bg-primary/90" onClick={onDeploy} disabled={!readyToDeploy || deploymentState === 'running' || deploymentState === 'live'}>{deploymentState === 'running' ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Running production sequence</> : deploymentState === 'live' ? <><Check className="mr-2 h-4 w-4" />Deployment complete</> : <><Rocket className="mr-2 h-4 w-4" />Deploy application</>}</Button>{!readyToDeploy && <p className="mt-3 text-center text-[10px] text-amber-200">Apply the retry policy recommendation before deploying.</p>}</div><div className="border-t border-border px-6 py-4">{deploymentSteps.map((step, index) => <div key={step} className="flex min-h-9 items-center gap-3 text-[10px] text-muted-foreground"><span className={`grid h-5 w-5 place-items-center rounded-md ${index < deploymentStep || deploymentState === 'live' ? 'bg-emerald-400/10 text-emerald-300' : index === deploymentStep && deploymentState === 'running' ? 'bg-primary/10 text-primary' : 'bg-muted'}`}>{index < deploymentStep || deploymentState === 'live' ? <Check className="h-3 w-3" /> : index === deploymentStep && deploymentState === 'running' ? <Loader2 className="h-3 w-3 animate-spin" /> : <span className="font-mono text-[9px]">0{index + 1}</span>}</span><span>{step}</span><span className="ml-auto font-mono text-[9px]">{index < deploymentStep || deploymentState === 'live' ? 'done' : index === deploymentStep && deploymentState === 'running' ? 'running' : 'queued'}</span></div>)}</div></div><div className="rounded-3xl border border-border bg-card p-6"><div className="flex items-start gap-3"><Github className="mt-0.5 h-4 w-4 text-primary" /><div><p className="text-xs font-semibold">Source control</p><p className="mt-1 text-[11px] leading-5 text-muted-foreground">Push the reviewed workspace before production. {pushState === 'pushed' ? 'Commit a8f32d1 is ready.' : '12 files are prepared.'}</p></div></div><Button variant="outline" className="mt-4 h-10 w-full rounded-xl border-border text-xs hover:bg-muted" onClick={onPush} disabled={pushState === 'pushing'}>{pushState === 'pushing' ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Pushing</> : pushState === 'pushed' ? <><Check className="mr-2 h-3.5 w-3.5 text-emerald-300" />Commit a8f32d1 pushed</> : <><Github className="mr-2 h-3.5 w-3.5" />Push to GitHub</>}</Button></div>{deploymentState === 'live' && <div className="rounded-3xl border border-emerald-400/30 bg-emerald-400/5 p-6"><div className="flex items-start gap-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-emerald-400/10 text-emerald-300"><Check className="h-5 w-5" /></span><div><p className="text-sm font-semibold">Your application is live.</p><p className="mt-1 font-mono text-[10px] text-emerald-200">{DEMO_URL}</p></div></div><div className="mt-5 flex flex-col gap-2 sm:flex-row"><Button variant="outline" className="h-10 flex-1 rounded-xl border-border text-xs hover:bg-muted" onClick={onViewLogs}><Terminal className="mr-2 h-3.5 w-3.5" />View logs</Button><Button className="h-10 flex-1 rounded-xl bg-primary text-xs text-primary-foreground hover:bg-primary/90" onClick={onOpenApplication}><ExternalLink className="mr-2 h-3.5 w-3.5" />Open application</Button></div></div>}</section></div></div>
}

function CommandPalette({ open, query, setQuery, onClose, onNavigate, onAsk }: { open: boolean; query: string; setQuery: (value: string) => void; onClose: () => void; onNavigate: (path: string) => void; onAsk: () => void }) {
  if (!open) return null
  const commands = [
    { label: 'Open workspace', detail: 'Browse code, AI, and preview', icon: Code2, action: () => onNavigate(PROJECT_PATH) },
    { label: 'Open architecture', detail: 'Inspect system nodes', icon: Network, action: () => onNavigate(`${PROJECT_PATH}/architecture`) },
    { label: 'Open agents', detail: 'Test specialized agents', icon: Bot, action: () => onNavigate(`${PROJECT_PATH}/agents`) },
    { label: 'Open data model', detail: 'Inspect relational entities', icon: Database, action: () => onNavigate(`${PROJECT_PATH}/data`) },
    { label: 'Open integrations', detail: 'Review GitHub and marketplace', icon: Link2, action: () => onNavigate(`${PROJECT_PATH}/integrations`) },
    { label: 'Open deployment review', detail: 'Resolve risks and release', icon: Rocket, action: () => onNavigate(`${PROJECT_PATH}/deploy`) },
    { label: 'Ask Architect', detail: 'Open contextual guidance', icon: Sparkles, action: onAsk },
  ]
  const filtered = commands.filter((command) => `${command.label} ${command.detail}`.toLowerCase().includes(query.toLowerCase()))
  return <div className="fixed inset-0 z-[70] flex items-start justify-center bg-black/60 px-4 pt-[12vh] backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><div className="w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-black/40" role="dialog" aria-modal="true" aria-label="Command palette"><div className="flex items-center gap-3 border-b border-border px-4"><Search className="h-4 w-4 text-muted-foreground" /><Input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === 'Escape') onClose() }} placeholder="Search commands..." className="h-14 border-0 bg-transparent px-0 text-sm focus-visible:ring-0" /><kbd className="hidden rounded-md border border-border bg-muted px-2 py-1 font-mono text-[10px] text-muted-foreground sm:block">ESC</kbd></div><div className="max-h-[55vh] overflow-y-auto p-2">{filtered.length === 0 ? <div className="px-4 py-10 text-center text-sm text-muted-foreground">No command matches that search.</div> : filtered.map((command) => { const Icon = command.icon; return <button key={command.label} onClick={() => { command.action(); onClose() }} className="flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary"><Icon className="h-4 w-4" /></span><span className="min-w-0"><span className="block text-xs font-medium">{command.label}</span><span className="mt-0.5 block truncate text-[10px] text-muted-foreground">{command.detail}</span></span><ArrowRight className="ml-auto h-3.5 w-3.5 text-muted-foreground" /></button> })}</div><div className="flex items-center justify-between border-t border-border px-4 py-3 font-mono text-[9px] text-muted-foreground"><span>Navigate from anywhere</span><span>⌘K / Ctrl K</span></div></div></div>
}

function AssistantDrawer({ open, onClose, prompt, setPrompt, busy, error, response, onSend }: { open: boolean; onClose: () => void; prompt: string; setPrompt: (value: string) => void; busy: boolean; error: string; response: CopilotPayload | null; onSend: () => void }) {
  if (!open) return null
  return <div className="fixed inset-0 z-[65] bg-black/55 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><aside className="absolute inset-y-0 right-0 flex w-full max-w-xl flex-col border-l border-border bg-card shadow-2xl shadow-black/40" role="dialog" aria-modal="true" aria-label="Ask Architect"><div className="flex items-start justify-between border-b border-border px-5 py-5 sm:px-6"><div className="flex items-start gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><Sparkles className="h-5 w-5" /></span><div><p className="text-sm font-semibold">Ask Architect</p><p className="mt-1 text-[10px] text-muted-foreground">Contextual guidance from Architect Product Copilot</p></div></div><Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl" onClick={onClose} aria-label="Close assistant"><X className="h-4 w-4" /></Button></div><div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6"><div className="rounded-2xl border border-primary/20 bg-primary/5 p-4"><div className="flex items-center gap-2"><StatusDot tone="active" pulse={busy} /><span className="text-xs font-medium">Architect Product Copilot</span><span className="ml-auto font-mono text-[9px] text-primary">{AGENT_ID}</span></div><p className="mt-3 text-xs leading-5 text-muted-foreground">Ask about the current journey, a proposed change, or the next technical decision. This drawer calls the live Architect Product Copilot and renders its structured response.</p></div><div className="mt-5"><label htmlFor="assistant-prompt" className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Your question</label><Textarea id="assistant-prompt" value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="What should I inspect before deployment?" className="mt-2 min-h-24 resize-none rounded-xl border-border bg-background text-sm leading-6" />{error && <p className="mt-2 flex items-center gap-2 text-xs text-destructive"><AlertCircle className="h-3.5 w-3.5" />{error}</p>}<Button className="mt-3 h-10 rounded-xl bg-primary px-4 text-xs text-primary-foreground hover:bg-primary/90" onClick={onSend} disabled={busy}>{busy ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Architect is thinking</> : <><Send className="mr-2 h-3.5 w-3.5" />Ask Architect</>}</Button></div><div className="mt-7"><div className="mb-3 flex items-center justify-between"><p className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Transparent response</p><StatusBadge tone="success">Structured output</StatusBadge></div>{busy ? <div className="rounded-2xl border border-border bg-background p-6"><div className="flex items-center gap-3 text-xs text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin text-primary" />Mapping context and preparing next step.</div><div className="mt-5 space-y-2"><div className="h-2 w-full animate-pulse rounded bg-muted" /><div className="h-2 w-5/6 animate-pulse rounded bg-muted" /><div className="h-2 w-2/3 animate-pulse rounded bg-muted" /></div></div> : response ? <CopilotResponseCard data={response} /> : <div className="rounded-2xl border border-dashed border-border bg-background p-6 text-center"><MessageSquare className="mx-auto h-5 w-5 text-primary" /><p className="mt-3 text-xs font-medium">Ask a question to start a live copilot response.</p><p className="mt-2 text-[11px] leading-5 text-muted-foreground">Architect will return what it understood, its plan, affected surfaces, and the next recommended action.</p></div>}</div></div><div className="border-t border-border px-5 py-4 sm:px-6"><div className="flex items-center gap-2 text-[10px] text-muted-foreground"><ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />Live copilot call · authenticated app session · review before action</div></div></aside></div>
}

function ReceiptModal({ open, state, onClose, onAnalyze }: { open: boolean; state: ReceiptState; onClose: () => void; onAnalyze: () => void }) {
  if (!open) return null
  return <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget && state !== 'analyzing') onClose() }}><div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl shadow-black/40 sm:p-8" role="dialog" aria-modal="true" aria-label="Upload receipt"><div className="flex items-start justify-between gap-3"><div><PageEyebrow icon={Upload}>Receipt analysis</PageEyebrow><h2 className="mt-3 text-xl font-semibold">Upload a mock receipt</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Architect will simulate OCR, extraction, validation, and categorization for the Uber receipt fixture.</p></div><Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl" onClick={onClose} disabled={state === 'analyzing'} aria-label="Close receipt dialog"><X className="h-4 w-4" /></Button></div>{state === 'analyzing' ? <div className="py-10 text-center"><div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary"><Loader2 className="h-6 w-6 animate-spin" /></div><h3 className="mt-5 text-sm font-semibold">Receipt Agent is analyzing...</h3><div className="mx-auto mt-5 max-w-xs space-y-2 text-left">{['Reading receipt image', 'Extracting merchant and amount', 'Validating structured output'].map((step, index) => <div key={step} className="flex items-center gap-3 rounded-xl border border-border bg-background p-3 text-[11px]"><span className="grid h-6 w-6 place-items-center rounded-lg bg-primary/10 font-mono text-[9px] text-primary">0{index + 1}</span>{step}<Loader2 className="ml-auto h-3 w-3 animate-spin text-primary" /></div>)}</div></div> : state === 'complete' ? <div className="py-6"><div className="flex items-center gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-4"><span className="grid h-10 w-10 place-items-center rounded-full bg-emerald-400/10 text-emerald-300"><Check className="h-5 w-5" /></span><div><p className="text-sm font-semibold">Uber expense added</p><p className="mt-1 text-xs text-muted-foreground">₹842 · Travel · confidence 0.98</p></div></div><div className="mt-5 grid gap-2 sm:grid-cols-2">{['merchant · Uber', 'date · Sep 24, 2026', 'amount · ₹842', 'category · Travel', 'currency · INR', 'status · Pending'].map((item) => <div key={item} className="rounded-xl border border-border bg-background px-3 py-3 font-mono text-[10px] text-muted-foreground">{item}</div>)}</div><Button className="mt-6 h-11 w-full rounded-xl bg-primary text-xs text-primary-foreground hover:bg-primary/90" onClick={onClose}>Return to live preview <ArrowRight className="ml-2 h-4 w-4" /></Button></div> : <><div className="mt-7 rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-8 text-center"><span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary"><FileText className="h-5 w-5" /></span><p className="mt-4 text-sm font-semibold">uber-receipt-sep-24.png</p><p className="mt-1 text-xs text-muted-foreground">Mock asset · 1.2 MB · image/png</p></div><div className="mt-5 rounded-xl border border-border bg-background p-4"><div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-300" /><p className="text-xs font-medium">What will happen next</p></div><p className="mt-2 text-xs leading-5 text-muted-foreground">Receipt Agent extracts fields, validates confidence, and adds a pending expense to the local preview.</p></div><div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button variant="outline" className="h-10 rounded-xl border-border text-xs hover:bg-muted" onClick={onClose}>Cancel</Button><Button className="h-10 rounded-xl bg-primary text-xs text-primary-foreground hover:bg-primary/90" onClick={onAnalyze}><Sparkles className="mr-2 h-3.5 w-3.5" />Analyze receipt</Button></div></>}</div></div>
}

function ConfigDrawer({ agent, open, onClose, onSave }: { agent: typeof appAgents[number]; open: boolean; onClose: () => void; onSave: () => void }) {
  if (!open) return null
  return <div className="fixed inset-0 z-[55] bg-black/55 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><aside className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-border bg-card shadow-2xl shadow-black/40" role="dialog" aria-modal="true" aria-label={`Configure ${agent.name}`}><div className="flex items-start justify-between border-b border-border px-5 py-5"><div><PageEyebrow icon={Settings}>Agent configuration</PageEyebrow><h2 className="mt-3 text-xl font-semibold">{agent.name}</h2><p className="mt-1 text-xs text-muted-foreground">Changes are local to this demo.</p></div><Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl" onClick={onClose} aria-label="Close configuration"><X className="h-4 w-4" /></Button></div><div className="flex-1 overflow-y-auto p-5"><div className="space-y-5"><div><label className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Model</label><div className="mt-2 flex items-center justify-between rounded-xl border border-border bg-background px-3 py-3 text-xs"><span>{agent.model}</span><ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /></div></div><div><label className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Temperature</label><div className="mt-2 flex items-center gap-3"><input type="range" min="0" max="1" step="0.1" defaultValue="0.2" className="h-2 flex-1 accent-primary" /><span className="font-mono text-xs">0.2</span></div></div><div><label className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Tools & data sources</label><div className="mt-2 space-y-2">{agent.tools.map((tool) => <div key={tool} className="flex min-h-10 items-center gap-2 rounded-xl border border-border bg-background px-3 text-xs"><Check className="h-3.5 w-3.5 text-emerald-300" />{tool}<SlidersHorizontal className="ml-auto h-3.5 w-3.5 text-muted-foreground" /></div>)}</div></div><div><label className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Guardrails</label><div className="mt-2 space-y-2">{agent.guardrails.map((guardrail) => <div key={guardrail} className="flex min-h-10 items-center gap-2 rounded-xl border border-border bg-background px-3 text-xs"><ShieldCheck className="h-3.5 w-3.5 text-primary" />{guardrail}<StatusDot tone="success" /></div>)}</div></div></div></div><div className="border-t border-border p-5"><Button className="h-11 w-full rounded-xl bg-primary text-xs text-primary-foreground hover:bg-primary/90" onClick={onSave}><Check className="mr-2 h-4 w-4" />Save configuration</Button></div></aside></div>
}

function GitHubModal({ open, pushState, onClose, onPush }: { open: boolean; pushState: PushState; onClose: () => void; onPush: () => void }) {
  const [message, setMessage] = useState('feat: add category spending insights')
  if (!open) return null
  return <div className="fixed inset-0 z-[55] flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget && pushState !== 'pushing') onClose() }}><div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl shadow-black/40 sm:p-8" role="dialog" aria-modal="true" aria-label="Push to GitHub"><div className="flex items-start justify-between gap-3"><div className="flex items-start gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-muted"><Github className="h-5 w-5" /></span><div><h2 className="text-xl font-semibold">Push to GitHub</h2><p className="mt-1 text-xs text-muted-foreground">Simulate the reviewed workspace commit.</p></div></div><Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl" onClick={onClose} disabled={pushState === 'pushing'} aria-label="Close GitHub dialog"><X className="h-4 w-4" /></Button></div><div className="mt-6 rounded-2xl border border-border bg-background p-4"><div className="flex items-center justify-between text-xs"><span className="text-muted-foreground">Repository</span><span className="font-mono">architect-labs/expense-intelligence</span></div><div className="mt-3 flex items-center justify-between text-xs"><span className="text-muted-foreground">Branch</span><span className="font-mono">main</span></div><div className="mt-3 flex items-center justify-between text-xs"><span className="text-muted-foreground">Files</span><span className="font-mono">12 changed</span></div></div><label htmlFor="commit-message" className="mt-6 block font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Commit message</label><Input id="commit-message" value={message} onChange={(event) => setMessage(event.target.value)} className="mt-2 h-11 rounded-xl border-border bg-background text-sm" disabled={pushState === 'pushing'} /><div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs leading-5 text-muted-foreground"><GitBranch className="mr-2 inline h-3.5 w-3.5 text-primary" />This local push resolves to commit <span className="font-mono text-foreground">a8f32d1</span>.</div>{pushState === 'pushed' && <div className="mt-4 flex items-center gap-2 text-xs text-emerald-200"><CheckCircle2 className="h-4 w-4" />Commit simulated successfully.</div>}<div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button variant="outline" className="h-10 rounded-xl border-border text-xs hover:bg-muted" onClick={onClose} disabled={pushState === 'pushing'}>Cancel</Button><Button className="h-10 rounded-xl bg-primary text-xs text-primary-foreground hover:bg-primary/90" onClick={onPush} disabled={pushState === 'pushing' || !message.trim()}>{pushState === 'pushing' ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Pushing 12 files</> : pushState === 'pushed' ? <><RefreshCw className="mr-2 h-3.5 w-3.5" />Push again</> : <><Github className="mr-2 h-3.5 w-3.5" />Push commit</>}</Button></div></div></div>
}

function LogsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null
  const logs = ['10:42:08  build  Starting production build', '10:42:14  test   28 checks passed', '10:42:19  infra  Provisioned Mumbai environment', '10:42:23  deploy Published expense-intelligence.architect.app']
  return <div className="fixed inset-0 z-[55] flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><div className="w-full max-w-2xl rounded-3xl border border-border bg-card p-6 shadow-2xl shadow-black/40"><div className="flex items-center justify-between"><div><PageEyebrow icon={Terminal}>Deployment logs</PageEyebrow><h2 className="mt-3 text-xl font-semibold">Production sequence</h2></div><Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl" onClick={onClose} aria-label="Close deployment logs"><X className="h-4 w-4" /></Button></div><div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-background p-4 font-mono text-[10px] leading-7 text-muted-foreground">{logs.map((log) => <div key={log}><span className="text-emerald-300">✓</span> {log}</div>)}</div><Button className="mt-5 h-10 w-full rounded-xl bg-primary text-xs text-primary-foreground hover:bg-primary/90" onClick={onClose}>Close logs</Button></div></div>
}

function ToastBanner({ toast, onClose }: { toast: ToastState | null; onClose: () => void }) {
  if (!toast) return null
  const Icon = toast.tone === 'success' ? CheckCircle2 : toast.tone === 'error' ? AlertCircle : toast.tone === 'warning' ? AlertTriangle : Info
  return <div className="fixed bottom-5 left-1/2 z-[80] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-2xl border border-border bg-card p-4 shadow-2xl shadow-black/40" role="status"><div className="flex items-start gap-3"><span className={`grid h-8 w-8 place-items-center rounded-lg ${toast.tone === 'success' ? 'bg-emerald-400/10 text-emerald-300' : toast.tone === 'error' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}><Icon className="h-4 w-4" /></span><div className="min-w-0 flex-1"><p className="text-xs font-semibold">{toast.title}</p><p className="mt-1 text-[11px] leading-5 text-muted-foreground">{toast.description}</p></div><Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={onClose} aria-label="Dismiss notification"><X className="h-3.5 w-3.5" /></Button></div></div>
}

export default function Page() {
  const [path, setPath] = useState('/')
  const [theme, setTheme] = useState<ThemeMode>('dark')
  const [sampleData, setSampleData] = useState(true)
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT)
  const [mode, setMode] = useState<'autopilot' | 'collaborative'>('collaborative')
  const [onboardingStage, setOnboardingStage] = useState<OnboardingStage>('idle')
  const [formError, setFormError] = useState('')
  const [buildProgress, setBuildProgress] = useState(0)
  const [selectedNodeId, setSelectedNodeId] = useState('receipt')
  const [selectedFile, setSelectedFile] = useState('Dashboard.tsx')
  const [centerTab, setCenterTab] = useState<CenterTab>('ai')
  const [workspacePanel, setWorkspacePanel] = useState<WorkspacePanel>('ai')
  const [workspaceRequest, setWorkspaceRequest] = useState('Change the dashboard to show monthly spending by category.')
  const [planReady, setPlanReady] = useState(true)
  const [planningError, setPlanningError] = useState('')
  const [appliedChanges, setAppliedChanges] = useState(false)
  const [receiptOpen, setReceiptOpen] = useState(false)
  const [receiptState, setReceiptState] = useState<ReceiptState>('idle')
  const [userExpenses, setUserExpenses] = useState<typeof sampleExpenses>([])
  const [selectedAgentId, setSelectedAgentId] = useState('receipt-agent')
  const [playgroundRunning, setPlaygroundRunning] = useState(false)
  const [playgroundStep, setPlaygroundStep] = useState(0)
  const [configOpen, setConfigOpen] = useState(false)
  const [selectedTableId, setSelectedTableId] = useState('expenses')
  const [connected, setConnected] = useState<Record<string, boolean>>({ github: true, postgresql: true })
  const [pushState, setPushState] = useState<PushState>('idle')
  const [githubModalOpen, setGithubModalOpen] = useState(false)
  const [recommendationApplied, setRecommendationApplied] = useState(false)
  const [uploadLimitApplied, setUploadLimitApplied] = useState(false)
  const [deploymentState, setDeploymentState] = useState<DeploymentState>('idle')
  const [deploymentStep, setDeploymentStep] = useState(0)
  const [logsOpen, setLogsOpen] = useState(false)
  const [assistantOpen, setAssistantOpen] = useState(false)
  const [assistantPrompt, setAssistantPrompt] = useState('How should I prepare this project for release?')
  const [assistantBusy, setAssistantBusy] = useState(false)
  const [assistantError, setAssistantError] = useState('')
  const [assistantResponse, setAssistantResponse] = useState<CopilotPayload | null>(null)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [paletteQuery, setPaletteQuery] = useState('')
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)
  const [toast, setToast] = useState<ToastState | null>(null)

  const navigate = useCallback((nextPath: string) => {
    if (typeof window !== 'undefined') window.history.pushState({}, '', nextPath)
    setPath(nextPath)
  }, [])

  const notify = useCallback((nextToast: ToastState) => setToast(nextToast), [])

  useEffect(() => {
    const syncPath = () => setPath(window.location.pathname || '/')
    syncPath()
    window.addEventListener('popstate', syncPath)
    return () => window.removeEventListener('popstate', syncPath)
  }, [])

  useEffect(() => {
    const storedTheme = window.localStorage.getItem('architect-theme')
    if (storedTheme === 'light' || storedTheme === 'dark') setTheme(storedTheme)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    window.localStorage.setItem('architect-theme', theme)
  }, [theme])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 4200)
    return () => window.clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    if (onboardingStage !== 'analyzing') return
    const timer = window.setTimeout(() => {
      setOnboardingStage('review')
      setActiveAgentId(null)
      notify({ title: 'Requirements understood', description: 'Review the structured handoff before the architecture is generated.', tone: 'success' })
    }, 1100)
    return () => window.clearTimeout(timer)
  }, [onboardingStage, notify])

  useEffect(() => {
    if (!path.endsWith('/build') || buildProgress >= 100) return
    const timer = window.setTimeout(() => setBuildProgress((current) => Math.min(100, current + 20)), 550)
    return () => window.clearTimeout(timer)
  }, [path, buildProgress])

  useEffect(() => {
    if (!path.endsWith('/build') || buildProgress < 100) return
    const timer = window.setTimeout(() => {
      setActiveAgentId(null)
      navigate(PROJECT_PATH)
      notify({ title: 'Workspace ready', description: 'The generated project is available for inspection.', tone: 'success' })
    }, 750)
    return () => window.clearTimeout(timer)
  }, [path, buildProgress, navigate, notify])

  useEffect(() => {
    if (receiptState !== 'analyzing') return
    const timer = window.setTimeout(() => {
      setReceiptState('complete')
      setUserExpenses((current) => current.some((expense) => expense.merchant === 'Uber') ? current : [{ merchant: 'Uber', category: 'Travel', amount: '₹842', date: 'Sep 24', status: 'Pending' }, ...current])
      setActiveAgentId(null)
      notify({ title: 'Receipt analyzed', description: 'Uber · ₹842 was added to the local expense preview.', tone: 'success' })
    }, 1200)
    return () => window.clearTimeout(timer)
  }, [receiptState, notify])

  useEffect(() => {
    if (!playgroundRunning) return
    if (playgroundStep >= 5) {
      setPlaygroundRunning(false)
      setActiveAgentId(null)
      notify({ title: 'Receipt Agent test complete', description: 'Structured output passed all local guardrails.', tone: 'success' })
      return
    }
    const timer = window.setTimeout(() => setPlaygroundStep((current) => current + 1), 560)
    return () => window.clearTimeout(timer)
  }, [playgroundRunning, playgroundStep, notify])

  useEffect(() => {
    if (pushState !== 'pushing') return
    const timer = window.setTimeout(() => {
      setPushState('pushed')
      setGithubModalOpen(false)
      setActiveAgentId(null)
      notify({ title: 'GitHub push simulated', description: '12 files pushed to main with commit a8f32d1.', tone: 'success' })
    }, 1100)
    return () => window.clearTimeout(timer)
  }, [pushState, notify])

  useEffect(() => {
    if (deploymentState !== 'running') return
    if (deploymentStep >= deploymentSteps.length) {
      const timer = window.setTimeout(() => {
        setDeploymentState('live')
        setActiveAgentId(null)
        notify({ title: 'Application deployed', description: `${DEMO_URL} is live in the local demo environment.`, tone: 'success' })
      }, 600)
      return () => window.clearTimeout(timer)
    }
    const timer = window.setTimeout(() => setDeploymentStep((current) => current + 1), 650)
    return () => window.clearTimeout(timer)
  }, [deploymentState, deploymentStep, notify])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setPaletteOpen(true)
      }
      if (event.key === 'Escape') {
        setPaletteOpen(false)
        setAssistantOpen(false)
        setGithubModalOpen(false)
        setLogsOpen(false)
        setReceiptOpen(false)
        setConfigOpen(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const handleToggleSample = (next: boolean) => {
    setSampleData(next)
    if (!next && prompt === DEFAULT_PROMPT) setPrompt('')
    if (next && !prompt.trim()) setPrompt(DEFAULT_PROMPT)
    notify({ title: next ? 'Sample Data on' : 'Sample Data off', description: next ? 'Expense Intelligence examples are visible.' : 'Examples are hidden. Your local actions remain available.', tone: 'neutral' })
  }

  const handleToggleTheme = () => setTheme((current) => current === 'dark' ? 'light' : 'dark')

  const handleBuild = () => {
    if (!prompt.trim()) {
      setFormError('Describe the product outcome before starting the build.')
      return
    }
    setFormError('')
    setOnboardingStage('analyzing')
    setActiveAgentId('architect-product-copilot')
  }

  const handleLooksGood = () => {
    setBuildProgress(0)
    setActiveAgentId(null)
    if (mode === 'autopilot') {
      setActiveAgentId('architect-product-copilot')
      navigate(`${PROJECT_PATH}/build`)
      notify({ title: 'Autopilot build started', description: 'Architect is handling architecture and agent decisions, then will explain what it built in the workspace.', tone: 'success' })
      return
    }
    navigate(`${PROJECT_PATH}/architecture`)
    notify({ title: 'Requirements accepted', description: 'The architecture canvas is ready to inspect.', tone: 'success' })
  }

  const handleAcceptArchitecture = () => {
    setActiveAgentId(null)
    navigate(`${PROJECT_PATH}/agents`)
    notify({ title: 'Architecture accepted', description: 'Review and test the generated agents, then continue to the staged build.', tone: 'success' })
  }

  const handleContinueFromAgents = () => {
    setBuildProgress(0)
    setActiveAgentId('architect-product-copilot')
    navigate(`${PROJECT_PATH}/build`)
  }

  const handlePlan = () => {
    if (!workspaceRequest.trim()) {
      setPlanningError('Add a request so Architect can prepare a plan.')
      return
    }
    setPlanningError('')
    setPlanReady(true)
    setActiveAgentId('architect-product-copilot')
    window.setTimeout(() => setActiveAgentId(null), 500)
    notify({ title: 'Change plan ready', description: 'Review the affected surfaces before applying the proposal.', tone: 'success' })
  }

  const handleApply = () => {
    setAppliedChanges(true)
    setActiveAgentId(null)
    notify({ title: 'Changes applied', description: 'The category chart is now reflected in the live preview.', tone: 'success' })
  }

  const handleStartReceipt = () => {
    setReceiptState('analyzing')
    setReceiptOpen(true)
    setActiveAgentId('receipt-agent')
  }

  const handleRunPlayground = () => {
    setPlaygroundStep(0)
    setPlaygroundRunning(true)
    setActiveAgentId('receipt-agent')
  }

  const handlePush = () => {
    setPushState('pushing')
    setActiveAgentId('architect-product-copilot')
  }

  const handleDeploy = () => {
    if (!recommendationApplied) {
      notify({ title: 'Recommendation required', description: 'Apply the retry policy finding before deploying.', tone: 'warning' })
      return
    }
    setDeploymentStep(0)
    setDeploymentState('running')
    setActiveAgentId('architect-product-copilot')
  }

  const handleAsk = () => {
    setAssistantError('')
    setAssistantOpen(true)
  }

  const handleSendAssistant = async () => {
    if (!assistantPrompt.trim()) {
      setAssistantError('Ask a question about the current project or next step.')
      return
    }
    setAssistantError('')
    setAssistantResponse(null)
    setAssistantBusy(true)
    setActiveAgentId('architect-product-copilot')
    try {
      const result = await callAIAgent(assistantPrompt.trim(), AGENT_ID)
      if (!result.success || result.response?.status === 'error') throw new Error(result.response?.message || result.error || 'Architect could not answer this request.')
      const parsed = normalizeCopilotResponse(result.response)
      if (!parsed) throw new Error('Architect returned a response that did not match the expected guidance format.')
      setAssistantResponse(parsed)
      sonnerToast.success('Architect response ready')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Architect could not answer this request.'
      setAssistantError(message)
      sonnerToast.error(message)
    } finally {
      setAssistantBusy(false)
      setActiveAgentId(null)
    }
  }

  const expenses = useMemo(() => sampleData ? [...sampleExpenses, ...userExpenses] : userExpenses, [sampleData, userExpenses])
  const isPublic = path === '/' || path === '/login'
  const isNewProject = path === '/app/new'
  const isHome = path === '/app'
  const isProject = path.startsWith(PROJECT_PATH)
  const isArchitecture = path.endsWith('/architecture')
  const isBuild = path.endsWith('/build')
  const isAgents = path.endsWith('/agents')
  const isData = path.endsWith('/data')
  const isIntegrations = path.endsWith('/integrations')
  const isDeploy = path.endsWith('/deploy')
  const title = isNewProject ? 'New project' : isHome ? 'Workspace' : isProject ? 'Expense Intelligence' : 'Workspace'
  const shellActions = isProject ? <>{isDeploy ? <Button variant="outline" className="hidden h-10 rounded-xl border-border px-3 text-xs hover:bg-muted md:inline-flex" onClick={() => setGithubModalOpen(true)}><Github className="mr-2 h-3.5 w-3.5" />GitHub</Button> : <Button variant="outline" className="hidden h-10 rounded-xl border-border px-3 text-xs hover:bg-muted md:inline-flex" onClick={() => setGithubModalOpen(true)}><Github className="mr-2 h-3.5 w-3.5" />Push</Button>}{!isDeploy && <Button className="hidden h-10 rounded-xl bg-primary px-3 text-xs text-primary-foreground hover:bg-primary/90 md:inline-flex" onClick={() => navigate(`${PROJECT_PATH}/deploy`)}><Rocket className="mr-2 h-3.5 w-3.5" />Deploy</Button>}</> : null

  let screen: ReactNode
  if (isPublic) {
    screen = path === '/' ? <LandingScreen onNavigate={navigate} theme={theme} onToggleTheme={handleToggleTheme} sampleData={sampleData} onToggleSample={handleToggleSample} /> : <AuthLoginScreen onNavigate={navigate} theme={theme} onToggleTheme={handleToggleTheme} sampleData={sampleData} onToggleSample={handleToggleSample} />
  } else {
    let content: ReactNode
    if (isNewProject) content = <NewProjectScreen prompt={prompt} setPrompt={setPrompt} mode={mode} setMode={setMode} stage={onboardingStage} sampleData={sampleData} formError={formError} onBuild={handleBuild} onLooksGood={handleLooksGood} />
    else if (isHome) content = <HomeScreen sampleData={sampleData} onNavigate={navigate} />
    else if (isBuild) content = <BuildScreen progress={buildProgress} onOpenWorkspace={() => navigate(PROJECT_PATH)} />
    else if (isArchitecture) content = <ArchitectureScreen selectedNodeId={selectedNodeId} onSelectNode={setSelectedNodeId} onOpenAgent={() => navigate(`${PROJECT_PATH}/agents`)} onAccept={handleAcceptArchitecture} onShare={() => notify({ title: 'Architecture link copied', description: 'The current canvas is ready to share inside this local demo.', tone: 'success' })} />
    else if (isAgents) content = <><AgentsScreen selectedAgentId={selectedAgentId} onSelectAgent={setSelectedAgentId} playgroundRunning={playgroundRunning} playgroundStep={playgroundStep} onRunPlayground={handleRunPlayground} onConfigure={() => setConfigOpen(true)} />{mode === 'collaborative' && <div className="fixed bottom-5 right-5 z-30"><Button className="h-11 rounded-xl bg-primary px-5 text-xs text-primary-foreground shadow-xl hover:bg-primary/90" onClick={handleContinueFromAgents}>Continue to build <ArrowRight className="ml-2 h-4 w-4" /></Button></div>}</>
    else if (isData) content = <DataScreen selectedTableId={selectedTableId} onSelectTable={setSelectedTableId} />
    else if (isIntegrations) content = <IntegrationsScreen connected={connected} pushState={pushState} onConnect={(id) => { setConnected((current) => ({ ...current, [id]: !(current[id] ?? false) })); notify({ title: 'Integration state updated', description: 'The connection is simulated locally.', tone: 'success' }) }} onPush={() => setGithubModalOpen(true)} />
    else if (isDeploy) content = <DeployScreen recommendationApplied={recommendationApplied} uploadLimitApplied={uploadLimitApplied} deploymentState={deploymentState} deploymentStep={deploymentStep} pushState={pushState} onApplyRecommendation={() => { setRecommendationApplied(true); notify({ title: 'Retry policy applied', description: 'AI requests now have deterministic exponential backoff in the local project.', tone: 'success' }) }} onApplyUploadLimit={() => { setUploadLimitApplied(true); notify({ title: 'Upload limit applied', description: 'Receipt uploads are capped at 10MB in the local project.', tone: 'success' }) }} onDeploy={handleDeploy} onPush={() => setGithubModalOpen(true)} onViewLogs={() => setLogsOpen(true)} onOpenApplication={() => notify({ title: 'Application URL ready', description: `Open ${DEMO_URL} from this local preview.`, tone: 'success' })} />
    else content = <WorkspaceScreen mode={mode} sampleData={sampleData} workspacePanel={workspacePanel} setWorkspacePanel={setWorkspacePanel} centerTab={centerTab} setCenterTab={setCenterTab} selectedFile={selectedFile} setSelectedFile={setSelectedFile} appliedChanges={appliedChanges} request={workspaceRequest} setRequest={setWorkspaceRequest} planReady={planReady} onPlan={handlePlan} onApply={handleApply} onUpload={handleStartReceipt} expenses={expenses} planningError={planningError} onOpenDeploy={() => navigate(`${PROJECT_PATH}/deploy`)} />
    screen = <ProtectedRoute unauthenticatedFallback={<AuthLoginScreen onNavigate={navigate} theme={theme} onToggleTheme={handleToggleTheme} sampleData={sampleData} onToggleSample={handleToggleSample} />} loadingFallback={<div className="grid min-h-screen place-items-center bg-background text-foreground"><div className="flex items-center gap-3 text-sm text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin text-primary" />Verifying your Architect session</div></div>}><AppShell path={path} mode={mode} onNavigate={navigate} sampleData={sampleData} onToggleSample={handleToggleSample} theme={theme} onToggleTheme={handleToggleTheme} onAskArchitect={handleAsk} onOpenPalette={() => setPaletteOpen(true)} activeAgentId={activeAgentId} topActions={shellActions} title={title}>{content}</AppShell></ProtectedRoute>
  }

  return <AuthProvider><Toaster richColors position="top-right" />{screen}<CommandPalette open={paletteOpen} query={paletteQuery} setQuery={setPaletteQuery} onClose={() => { setPaletteOpen(false); setPaletteQuery('') }} onNavigate={navigate} onAsk={() => { setPaletteOpen(false); handleAsk() }} /><AssistantDrawer open={assistantOpen} onClose={() => setAssistantOpen(false)} prompt={assistantPrompt} setPrompt={setAssistantPrompt} busy={assistantBusy} error={assistantError} response={assistantResponse} onSend={handleSendAssistant} /><ReceiptModal open={receiptOpen} state={receiptState} onClose={() => { setReceiptOpen(false); if (receiptState === 'complete') setReceiptState('idle') }} onAnalyze={handleStartReceipt} /><ConfigDrawer agent={appAgents.find((agent) => agent.id === selectedAgentId) ?? appAgents[0]} open={configOpen} onClose={() => setConfigOpen(false)} onSave={() => { setConfigOpen(false); notify({ title: 'Agent configuration saved', description: 'Receipt Agent settings remain local to this demo.', tone: 'success' }) }} /><GitHubModal open={githubModalOpen} pushState={pushState} onClose={() => setGithubModalOpen(false)} onPush={handlePush} /><LogsModal open={logsOpen} onClose={() => setLogsOpen(false)} /><ToastBanner toast={toast} onClose={() => setToast(null)} /></AuthProvider>
}
