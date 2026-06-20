# AI Exam Prep Platform — Complete Frontend Specification
# For: Cursor / Antigravity / Any AI Coding Assistant
# Stack: Next.js 15 App Router + TypeScript + Tailwind CSS v4
# Zero external UI libraries. Zero shadcn. Zero radix. Zero framer.
# Lucide React for icons only.

---

## ABSOLUTE RULES — READ FIRST, NEVER VIOLATE

1. Every file is TypeScript (.tsx or .ts). No .js or .jsx ever.
2. No shadcn, no radix-ui, no headlessui, no framer-motion, no react-spring.
3. No external component libraries of any kind.
4. Tailwind only for all styling. No inline style={} objects ever.
5. Lucide React for icons only. Icons are always text-[#8C8C8A], never colored.
6. No useEffect for data fetching. Use Next.js server components + async/await.
7. Client components ('use client') only when strictly needed:
   - User interaction (click, input, form state)
   - Browser APIs (localStorage is banned — never use it)
   - Hooks (useState, useContext)
8. Access token lives in memory only (module-level variable in lib/auth.ts).
   Never localStorage, never sessionStorage.
9. All navigation via next/navigation router.push(). No <a href> for internal links.
10. No page-level scroll. Only designated scroll containers scroll.

---

## DESIGN TOKENS — HARDCODED, NO DEVIATIONS

```
Background:
  Page root:     #1C1C1B   → bg-[#1C1C1B]
  Sidebar/Panel: #1F1F1E   → bg-[#1F1F1E]
  Cards/Inputs:  #2C2C2A   → bg-[#2C2C2A]
  Hover:         #333331   → hover:bg-[#333331]

Borders:
  Default:       #3A3A38   → border-[#3A3A38]
  Subtle:        #2E2E2C   → border-[#2E2E2C]
  Button:        #4A4A48   → border-[#4A4A48]

Text:
  Primary:       #ECECEA   → text-[#ECECEA]
  Secondary:     #8C8C8A   → text-[#8C8C8A]
  Muted:         #5A5A58   → text-[#5A5A58]

Destructive:
  Red (text only, never bg): text-red-400

Sidebar active item:
  bg-[#2C2C2A] border-l-2 border-l-[#ECECEA]
```

Typography:
```
Font: Inter from Google Fonts (400, 500 only — no 700, no 300)
Import in app/layout.tsx via next/font/google

Page heading:   text-[16px] font-medium text-[#ECECEA]
Section heading: text-[14px] font-medium text-[#ECECEA]
Body:           text-[14px] font-normal text-[#ECECEA] leading-relaxed
Label/Meta:     text-[12px] font-normal text-[#8C8C8A]
Tiny/Timestamp: text-[11px] font-normal text-[#5A5A58]
```

Component standards:
```
Cards:   rounded-lg border border-[#3A3A38] bg-[#2C2C2A]
Inputs:  rounded-md border border-[#3A3A38] bg-[#2C2C2A]
         focus:outline-none focus:border-[#4A4A48]
         text-[14px] text-[#ECECEA] placeholder:text-[#5A5A58]
Buttons: rounded-md border border-[#4A4A48] bg-[#2C2C2A]
         text-[14px] text-[#ECECEA] px-3 py-1.5
         hover:bg-[#333331] transition-colors duration-150
Badges:  rounded border border-[#3A3A38] px-2 py-0.5
         text-[11px] text-[#8C8C8A]
Divider: border-b border-[#2E2E2C]
```

No shadows. No gradients. No glow. No ring colors.

---

## FOLDER STRUCTURE — EXACT, BUILD THIS EXACTLY

```
app/
  layout.tsx                    ← root layout, Inter font, bg-[#1C1C1B]
  (auth)/
    login/
      page.tsx                  ← server component, renders LoginForm
    signup/
      page.tsx                  ← server component, renders SignupForm
  student/
    layout.tsx                  ← AppShell with student nav
    dashboard/
      page.tsx                  ← server component fetches stats + subjects
    questions/
      page.tsx                  ← subject list
      [subjectId]/
        page.tsx                ← exam type tabs + papers list
        [paperId]/
          page.tsx              ← questions list for this paper
  chat/
    layout.tsx                  ← AppShell same sidebar
    new/
      page.tsx                  ← new chat with step overlay
    [sessionId]/
      page.tsx                  ← existing chat session
  faculty/
    layout.tsx                  ← AppShell with faculty nav
    dashboard/
      page.tsx
    papers/
      page.tsx
      [paperId]/
        page.tsx
    generate/
      page.tsx                  ← chat-based Q/P generation
  admin/
    layout.tsx                  ← AppShell with admin nav
    dashboard/
      page.tsx
    students/
      page.tsx
    faculty/
      page.tsx
    syllabus/
      page.tsx
  super-admin/
    layout.tsx                  ← AppShell with super admin nav
    dashboard/
      page.tsx
    students/
      page.tsx
    faculty/
      page.tsx
    syllabus/
      page.tsx
    subscriptions/
      page.tsx

components/
  layout/
    AppShell.tsx                ← sidebar + main content wrapper
    Sidebar.tsx                 ← role-aware nav + recent chats + user footer
    SidebarNavItem.tsx          ← single nav item with active state
    SidebarRecentChats.tsx      ← scrollable recent chats list
    SidebarUserFooter.tsx       ← avatar initial + name + role + settings icon
    MobileTabBar.tsx            ← bottom tab bar for mobile
  chat/
    ChatContainer.tsx           ← full chat layout wrapper
    ChatHeader.tsx              ← subject name + exam type + questions remaining
    ChatMessages.tsx            ← scrollable messages list
    ChatMessage.tsx             ← single message bubble (user or assistant)
    ChatInput.tsx               ← fixed bottom input + send button + counter
    ChatStepOverlay.tsx         ← subject → exam type → mark type selection
    DiagramCard.tsx             ← "Refer: diagram name, Page X" card
    TypingIndicator.tsx         ← three dot animation
    ActionBar.tsx               ← faculty "Save as Q/P" bar below response
  dashboard/
    StatCard.tsx                ← reusable stat card (value + label + optional subtext)
    ActivityFeed.tsx            ← student notification feed
    ActivityFeedItem.tsx        ← single feed row
    TokenUsageBar.tsx           ← progress bar with usage / limit
    SubjectCard.tsx             ← subject card for student dashboard grid
    RecentChatRow.tsx           ← compact recent chat row
  questions/
    SubjectRow.tsx              ← subject list row with chevron
    ExamTypeTabs.tsx            ← CAT1 | CAT2 | Model | University tabs
    PaperRow.tsx                ← question paper row with year + badge
    QuestionRow.tsx             ← single question with mark badge
    MarkTypeFilter.tsx          ← All | 2M | 5M | 13M pills
  papers/
    PaperGroupAccordion.tsx     ← subject accordion with papers inside
    PaperTableRow.tsx           ← paper row with edit/delete/assign icons
    AssignModal.tsx             ← assign paper to cohort modal
  admin/
    StudentTableRow.tsx
    FacultyTableRow.tsx
    SubjectAccordion.tsx        ← syllabus management accordion
    CollegeCard.tsx             ← super admin college card
  auth/
    LoginForm.tsx               ← email + password form
    SignupForm.tsx              ← full signup form
  ui/
    Toast.tsx                   ← bottom-right toast notification
    ToastProvider.tsx           ← context + portal for toasts
    EmptyState.tsx              ← centered icon + heading + subtext
    Skeleton.tsx                ← animate-pulse skeleton block
    InlineConfirm.tsx           ← "Are you sure? Confirm / Cancel" inline
    Modal.tsx                   ← centered overlay modal
    ProgressBar.tsx             ← h-1.5 progress bar

lib/
  api.ts                        ← axios instance, interceptors, token attach
  auth.ts                       ← token memory store, refresh logic
  types.ts                      ← all TypeScript interfaces

hooks/
  useAuth.ts                    ← auth context consumer
  useChat.ts                    ← chat state, streaming, session management
  useToast.ts                   ← toast trigger hook

context/
  AuthContext.tsx               ← user, role, questionsToday, setters
  ToastContext.tsx              ← toast queue state
```

---

## LAYOUT SYSTEM

### AppShell.tsx
```
Props: { children, role, navItems }

Desktop layout:
  <div className="flex h-screen bg-[#1C1C1B]">
    <Sidebar />                           ← fixed, w-[240px]
    <main className="flex-1 ml-[240px] overflow-y-auto">
      {children}
    </main>
  </div>

Mobile layout (< 768px):
  Sidebar hidden (hidden md:flex)
  <main className="flex-1 pb-16">        ← pb-16 for tab bar height
    {children}
  </main>
  <MobileTabBar />                        ← fixed bottom
```

### Sidebar.tsx
```
Structure (top to bottom, full height, flex-col):

  [Logo section]
    px-4 py-4 border-b border-[#2E2E2C]
    App name or college name
    text-[14px] font-medium text-[#ECECEA]

  [Nav items — flex-col gap-0.5 px-2 pt-3]
    <SidebarNavItem> for each route
    Role determines which items render (see routes below)

  [Recent chats section — flex-1 overflow-y-auto px-2 mt-4]
    "Recent" label — text-[11px] text-[#5A5A58] uppercase tracking-wider px-2 mb-1
    <SidebarRecentChats />

  [User footer — mt-auto border-t border-[#2E2E2C] px-4 py-3]
    <SidebarUserFooter />

Sidebar bg: bg-[#1F1F1E]
Sidebar border: border-r border-[#2E2E2C]
Width: w-[240px] fixed left-0 top-0 h-full
```

### SidebarNavItem.tsx
```
Props: { href, icon: LucideIcon, label, isActive }

Render:
  <Link href={href}>
    <div className={
      isActive
        ? "flex items-center gap-2.5 px-3 py-2 rounded-md
           bg-[#2C2C2A] border-l-2 border-l-[#ECECEA] text-[#ECECEA]"
        : "flex items-center gap-2.5 px-3 py-2 rounded-md
           text-[#8C8C8A] hover:bg-[#333331] hover:text-[#ECECEA]
           transition-colors duration-150"
    }>
      <Icon size={16} />
      <span className="text-[13px]">{label}</span>
    </div>
  </Link>

isActive: use usePathname() to compare current route
```

### SidebarRecentChats.tsx
```
Props: { sessions: ChatSession[] }

Each session row:
  <div className="group flex items-center justify-between
                  px-2 py-1.5 rounded-md hover:bg-[#333331]
                  cursor-pointer transition-colors duration-150">
    <div className="flex-1 min-w-0">
      <p className="text-[13px] text-[#ECECEA] truncate">
        {session.subject_name}
      </p>
      <p className="text-[11px] text-[#5A5A58]">
        {session.exam_type} · {relativeTime(session.created_at)}
      </p>
    </div>
    [X icon — hidden normally, group-hover:block]
    <X size={12} className="hidden group-hover:block
                             text-[#5A5A58] hover:text-red-400
                             flex-shrink-0 ml-1" />
  </div>

On row click: router.push(`/chat/${session.id}`)
On X click: DELETE session, remove from list optimistically
Max 10 sessions shown
Container: overflow-y-auto scrollbar-hide
```

### SidebarUserFooter.tsx
```
<div className="flex items-center gap-2.5">
  [Avatar initial circle]
  <div className="w-7 h-7 rounded-full bg-[#3A3A38]
                  flex items-center justify-center
                  text-[12px] text-[#ECECEA]">
    {name[0].toUpperCase()}
  </div>
  [Name + role]
  <div className="flex-1 min-w-0">
    <p className="text-[13px] text-[#ECECEA] truncate">{name}</p>
    <p className="text-[11px] text-[#5A5A58] capitalize">{role}</p>
  </div>
  [Settings icon]
  <Settings size={14} className="text-[#5A5A58] hover:text-[#8C8C8A]
                                  cursor-pointer flex-shrink-0" />
</div>
```

### MobileTabBar.tsx
```
Fixed bottom, full width
bg-[#1F1F1E] border-t border-[#2E2E2C]
h-16 flex items-center justify-around px-4

Each tab icon:
  Active:   text-[#ECECEA]
  Inactive: text-[#5A5A58]
  No labels — icons only
  Icon size: 20px
  Touch target: min w-12 h-12 flex items-center justify-center
```

---

## NAV ITEMS PER ROLE

```
student:
  Home icon      → /student/dashboard     label: "Dashboard"
  BookOpen icon  → /student/questions     label: "Questions"
  MessageSquare  → /chat/new              label: "Chat"

faculty:
  Home icon      → /faculty/dashboard     label: "Dashboard"
  FileText icon  → /faculty/papers        label: "My Papers"
  Plus icon      → /faculty/generate      label: "Generate"

admin:
  Home icon         → /admin/dashboard    label: "Dashboard"
  Users icon        → /admin/students     label: "Students"
  GraduationCap     → /admin/faculty      label: "Faculty"
  BookOpen icon     → /admin/syllabus     label: "Syllabus"

super_admin:
  Home icon         → /super-admin/dashboard      label: "Dashboard"
  Users icon        → /super-admin/students       label: "Students"
  GraduationCap     → /super-admin/faculty        label: "Faculty"
  BookOpen icon     → /super-admin/syllabus       label: "Syllabus"
  CreditCard icon   → /super-admin/subscriptions  label: "Subscriptions"
```

---

## REUSABLE UI COMPONENTS

### StatCard.tsx
```
Props: {
  value: string | number
  label: string
  subtext?: string
  valueColor?: string   ← optional, defaults to text-[#ECECEA]
}

<div className="bg-[#2C2C2A] border border-[#3A3A38]
                rounded-lg px-4 py-4">
  <p className={`text-[24px] font-medium ${valueColor ?? 'text-[#ECECEA]'}`}>
    {value}
  </p>
  <p className="text-[12px] text-[#8C8C8A] mt-0.5">{label}</p>
  {subtext && (
    <p className="text-[11px] text-[#5A5A58] mt-1">{subtext}</p>
  )}
</div>
```

### EmptyState.tsx
```
Props: { icon: LucideIcon, heading: string, subtext?: string, action?: ReactNode }

Centered in parent container:
<div className="flex flex-col items-center justify-center
                py-16 px-4 text-center">
  <Icon size={28} className="text-[#3A3A38] mb-3" />
  <p className="text-[13px] text-[#8C8C8A] font-medium">{heading}</p>
  {subtext && (
    <p className="text-[12px] text-[#5A5A58] mt-1">{subtext}</p>
  )}
  {action && <div className="mt-4">{action}</div>}
</div>
```

### Skeleton.tsx
```
Props: { className?: string }

<div className={`bg-[#2C2C2A] rounded animate-pulse ${className}`} />

Usage examples:
  <Skeleton className="h-4 w-32" />        ← text line
  <Skeleton className="h-16 w-full" />     ← card
  <Skeleton className="h-8 w-24" />        ← stat number
```

### InlineConfirm.tsx
```
Props: {
  message: string
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
}

Replaces the trigger button inline:
<div className="flex items-center gap-3">
  <span className="text-[13px] text-[#8C8C8A]">{message}</span>
  <button onClick={onConfirm}
    className="text-[13px] text-red-400 hover:text-red-300">
    {confirmLabel}
  </button>
  <button onClick={onCancel}
    className="text-[13px] text-[#5A5A58] hover:text-[#8C8C8A]">
    Cancel
  </button>
</div>

Auto-cancel after 5000ms via useEffect timeout
```

### Toast.tsx + ToastProvider.tsx
```
ToastProvider wraps app in root layout
Renders toasts via React portal into document.body

Toast position: fixed bottom-4 right-4 z-50
Each toast:
  bg-[#2C2C2A] border border-[#3A3A38] rounded-lg px-4 py-3
  flex items-center gap-2.5 min-w-[260px]
  
  Success: <CheckCircle size={14} className="text-[#8C8C8A]" />
  Error:   <XCircle size={14} className="text-red-400" />
  
  Message: text-[13px] text-[#ECECEA]
  Auto-dismiss: 3000ms
  Animate in: translate-y-0 opacity-100
  Animate out: translate-y-2 opacity-0
  transition-all duration-200

useToast hook:
  const { toast } = useToast()
  toast.success("Paper assigned successfully")
  toast.error("Something went wrong")
```

### Modal.tsx
```
Props: { isOpen, onClose, title, children }

Backdrop: fixed inset-0 bg-black/50 z-40 flex items-center justify-center
Panel:
  bg-[#1F1F1E] border border-[#3A3A38] rounded-lg
  p-6 max-w-md w-full mx-4 z-50
  
Header:
  flex justify-between items-center mb-4
  Title: text-[14px] font-medium text-[#ECECEA]
  X button: <X size={16} className="text-[#8C8C8A] hover:text-[#ECECEA]" />

Close on backdrop click: yes
Close on Escape key: yes (useEffect keydown listener)
```

### ProgressBar.tsx
```
Props: { used: number, limit: number, showLabel?: boolean }

const pct = Math.min((used / limit) * 100, 100)
const isWarning = pct > 90

<div>
  {showLabel && (
    <div className="flex justify-between mb-1.5">
      <span className="text-[12px] text-[#8C8C8A]">Token Usage</span>
      <span className="text-[12px] text-[#5A5A58]">
        {formatK(used)} / {formatK(limit)}
      </span>
    </div>
  )}
  <div className="h-1.5 bg-[#3A3A38] rounded-full w-full">
    <div
      className={`h-full rounded-full transition-all duration-300
                  ${isWarning ? 'bg-red-400' : 'bg-[#ECECEA]'}`}
      style={{ width: `${pct}%` }}
    />
  </div>
  {isWarning && (
    <p className="text-[11px] text-red-400 mt-1">Approaching limit</p>
  )}
</div>
```

---

## PAGE SPECIFICATIONS

---

### AUTH PAGES

#### /login → LoginForm.tsx ('use client')
```
Page: full screen bg-[#1C1C1B] flex items-center justify-center min-h-screen

Card: bg-[#1F1F1E] border border-[#3A3A38] rounded-lg p-8 w-full max-w-sm

Content top to bottom:
  1. App name — text-[16px] font-medium text-[#ECECEA] text-center mb-8
  2. Email input — full width, label above "Email" text-[12px] text-[#8C8C8A] mb-1
  3. Password input — same pattern, type="password"
  4. Error message (conditional) — text-[12px] text-red-400 mt-2
     "Invalid email or password."
  5. "Sign in" button — full width mt-4
  6. "Don't have an account? Sign up" — text-[13px] text-[#8C8C8A] text-center mt-4
     "Sign up" is text-[#ECECEA] cursor-pointer → router.push('/signup')

State: email, password, error, isLoading
On submit:
  → POST /api/auth/login
  → On success: store access token in auth.ts memory
                router.push to role-appropriate dashboard
  → On error: set error state, show message
Loading state: button shows "Signing in..." disabled
```

#### /signup → SignupForm.tsx ('use client')
```
Same card structure as login, scrollable if needed

Fields in order:
  Full name       (text)
  Email           (email)
  Password        (password)
  College code    (text, required — "Get this from your institution")
  Department      (text)
  Branch          (text)
  Year            (select: 1st Year / 2nd Year / 3rd Year / 4th Year)
  Section         (text, optional — placeholder "Optional")

"Create account" button — full width
Below: "Already have an account? Sign in" → /login

On submit:
  → POST /api/auth/signup
  → On success: auto-login, router.push('/student/dashboard')
  → On error college code invalid:
    Show error below college code field specifically:
    "Invalid college code. Contact your institution."
  → On error email exists:
    "An account with this email already exists."
```

---

### STUDENT PAGES

#### /student/dashboard — server component
```
Fetch on server:
  - Student's subjects (by branch + year + department)
  - Today's chat stats (questions asked today)
  - Last 5 notifications for this student
  - Last 3 chat sessions

Page padding: px-6 py-6

Layout top to bottom:

  [Header]
    "Good morning, {name}" — text-[16px] font-medium text-[#ECECEA]
    Current date — text-[12px] text-[#8C8C8A] mt-0.5

  [Stats row] — mt-6 grid grid-cols-3 gap-3
    <StatCard value="{X} / 10" label="questions today"
              subtext="resets at midnight" />
    <StatCard value={activeSubjectsCount} label="subjects studied" />
    <StatCard value="{Xh Xm}" label="study time this month" />

  [Activity feed] — mt-6
    <ActivityFeed notifications={notifications} />

  [Your Subjects] — mt-6
    Section heading: "Your Subjects"
    grid grid-cols-2 gap-3 mt-3 (1 col on mobile)
    <SubjectCard> for each subject

  [Recent Chats] — mt-6
    Section heading: "Recent Chats"
    mt-3 flex flex-col gap-2
    <RecentChatRow> for each of last 3 sessions

Loading state: replace each section with matching skeletons
```

#### ActivityFeed.tsx + ActivityFeedItem.tsx
```
ActivityFeed:
  <div>
    <p className="text-[11px] text-[#5A5A58] uppercase tracking-wider mb-2">
      Recent
    </p>
    {notifications.length === 0 ? (
      <EmptyState icon={Bell}
        heading="No recent activity"
        subtext="New papers and updates will appear here" />
    ) : (
      notifications.map(n => <ActivityFeedItem key={n.id} item={n} />)
    )}
  </div>

ActivityFeedItem:
  <div className="flex items-start gap-3 py-3 border-b border-[#2E2E2C]">
    <Icon size={14} className="text-[#8C8C8A] mt-0.5 flex-shrink-0" />
    <p className="flex-1 text-[13px] text-[#ECECEA] leading-relaxed">
      {item.message}
    </p>
    <span className="text-[11px] text-[#5A5A58] flex-shrink-0">
      {relativeTime(item.created_at)}
    </span>
  </div>

Icon mapping per notification type:
  new_paper      → FileText
  syllabus_update → BookOpen
  study_recap    → MessageSquare
  general        → Bell
```

#### SubjectCard.tsx
```
Props: { subject: Subject }

<div onClick={() => router.push(`/student/questions/${subject.id}`)}
     className="bg-[#2C2C2A] border border-[#3A3A38] rounded-lg p-4
                cursor-pointer hover:bg-[#333331] transition-colors duration-150">
  <p className="text-[14px] font-medium text-[#ECECEA]">{subject.name}</p>
  <p className="text-[12px] text-[#8C8C8A] mt-0.5">{subject.code}</p>
  <p className="text-[12px] text-[#5A5A58] mt-0.5">{subject.department}</p>
</div>
```

#### /student/questions — server component
```
Fetch: all subjects for this student's cohort

Page heading: "Questions"
Subtext: "Browse by subject" — text-[12px] text-[#8C8C8A]

mt-4 flex flex-col gap-2:
  <SubjectRow> for each subject

SubjectRow.tsx:
  <div onClick={() => router.push(`/student/questions/${subject.id}`)}
       className="flex items-center justify-between
                  bg-[#2C2C2A] border border-[#3A3A38] rounded-lg
                  px-4 py-3 cursor-pointer hover:bg-[#333331]
                  transition-colors duration-150">
    <div>
      <p className="text-[14px] font-medium text-[#ECECEA]">{subject.name}</p>
      <p className="text-[12px] text-[#8C8C8A]">{subject.code}</p>
    </div>
    <ChevronRight size={16} className="text-[#5A5A58]" />
  </div>
```

#### /student/questions/[subjectId] — server component
```
Fetch: subject details + all papers grouped by exam_type

Layout:
  [Breadcrumb]
    <button onClick={() => router.back()}>
      <ChevronLeft size={16} className="text-[#8C8C8A]" />
    </button>
    <span className="text-[12px] text-[#8C8C8A]">Questions</span>

  [Page heading]
    Subject name — text-[16px] font-medium text-[#ECECEA]
    Subject code — text-[12px] text-[#8C8C8A] mt-0.5

  [Exam type tabs] — mt-4
    <ExamTypeTabs activeTab={activeTab} onChange={setActiveTab} />

  [Papers list] — mt-3
    {papers.filter(p => p.exam_type === activeTab).map(p => (
      <PaperRow key={p.id} paper={p} subjectId={subjectId} />
    ))}
    {filtered.length === 0 && (
      <EmptyState icon={FileText}
        heading="No papers yet"
        subtext="No question papers for this exam type" />
    )}

ExamTypeTabs.tsx ('use client'):
  Tabs: CAT 1 | CAT 2 | Model | University
  Active tab: border-b-2 border-[#ECECEA] text-[#ECECEA] pb-2
  Inactive: text-[#8C8C8A] pb-2 hover:text-[#ECECEA]
  transition-colors duration-150
  flex gap-6 border-b border-[#2E2E2C]

PaperRow.tsx:
  <div onClick={() => router.push(`/student/questions/${subjectId}/${paper.id}`)}
       className="flex items-center justify-between
                  bg-[#2C2C2A] border border-[#3A3A38] rounded-lg
                  px-4 py-3 mb-2 cursor-pointer hover:bg-[#333331]
                  transition-colors duration-150">
    <div>
      <p className="text-[14px] font-medium text-[#ECECEA]">
        {paper.academic_year}
      </p>
      <span className="inline-block mt-1 text-[11px] text-[#8C8C8A]
                       border border-[#3A3A38] rounded px-2 py-0.5">
        {paper.source === 'historical' ? 'Previous year' : 'This year'}
      </span>
    </div>
    <ChevronRight size={16} className="text-[#5A5A58]" />
  </div>
```

#### /student/questions/[subjectId]/[paperId] — server component
```
Fetch: all questions for this paper

Layout:
  [Breadcrumb] same pattern as above

  [Page heading]
    "{subject.name} — {paper.exam_type} {paper.academic_year}"

  [Mark type filter] — mt-4
    <MarkTypeFilter active={filter} onChange={setFilter} />
    Pills: All | 2M | 5M | 13M
    Active: bg-[#2C2C2A] border border-[#ECECEA] text-[#ECECEA]
    Inactive: border border-[#3A3A38] text-[#8C8C8A]
    rounded px-3 py-1 text-[13px] cursor-pointer

  [Questions list] — mt-4
    {filteredQuestions.map((q, i) => (
      <QuestionRow key={q.id} question={q} index={i + 1} />
    ))}

  QuestionRow.tsx:
    <div className="flex items-start gap-3 py-3 border-b border-[#2E2E2C]">
      <span className="text-[12px] text-[#5A5A58] w-6 flex-shrink-0 mt-0.5">
        Q{index}
      </span>
      <p className="flex-1 text-[14px] text-[#ECECEA] leading-relaxed">
        {question.question_text}
      </p>
    </div>

  [Fixed bottom bar]
    fixed bottom-0 left-[240px] right-0 (left-0 on mobile)
    bg-[#1F1F1E] border-t border-[#2E2E2C] px-6 py-3
    flex justify-end
    <button onClick={() => router.push(`/chat/new?paperId=${paperId}`)}>
      Study this paper in chat →
    </button>
```

---

### CHAT PAGES

#### Chat architecture overview
```
/chat/new    — renders ChatContainer with showStepOverlay=true
/chat/[id]   — renders ChatContainer with existing session data

ChatContainer.tsx ('use client') handles:
  - Step overlay state (subject → exam type → mark type)
  - Message streaming via fetch + ReadableStream
  - Session creation on first message
  - Daily limit enforcement
  - Optimistic message insertion

Never use axios for streaming. Use native fetch with ReadableStream.
```

#### ChatStepOverlay.tsx ('use client')
```
Props: {
  step: 1 | 2 | 3
  subjects: Subject[]
  onSelectSubject: (id) => void
  onSelectExamType: (type) => void
  onSelectMarkType: (type) => void
}

Full content area overlay:
  absolute inset-0 bg-[#1C1C1B] flex flex-col
  items-center justify-center px-6

Step 1 — "Which subject?"
  Heading: text-[16px] font-medium text-[#ECECEA] mb-6 text-center
  2-col grid of <SubjectCard> (same component)
  On card click: onSelectSubject(id) → moves to step 2

Step 2 — "What are you preparing for?"
  Heading same style mb-6
  flex gap-3 flex-wrap justify-center:
    Pill buttons: CAT 1 | CAT 2 | Model | University
    Each: border border-[#3A3A38] rounded-md px-4 py-2
          text-[14px] text-[#8C8C8A] hover:bg-[#333331]
          hover:text-[#ECECEA] cursor-pointer
  On pill click: onSelectExamType → step 3

Step 3 — "What type of questions?"
  Heading same style mb-6
  Same pill style:
    "2 Mark" | "5 Mark" | "13 Mark" | "Any"
  On pill click: onSelectMarkType → dismiss overlay
                 trigger session creation
                 show first assistant message
```

#### ChatContainer.tsx ('use client')
```
State:
  messages: Message[]
  isStreaming: boolean
  questionsToday: number  ← from AuthContext
  showOverlay: boolean
  selectedSubject: Subject | null
  selectedExamType: string | null
  selectedMarkType: string | null

Layout (full height, no outer scroll):
  <div className="flex flex-col h-screen bg-[#1C1C1B] relative">
    {showOverlay && <ChatStepOverlay ... />}
    <ChatHeader subject={...} examType={...} questionsToday={...} />
    <ChatMessages messages={messages} isStreaming={isStreaming} />
    <ChatInput
      onSend={handleSend}
      disabled={questionsToday >= 10 || showOverlay}
      questionsToday={questionsToday}
    />
  </div>

handleSend(content):
  1. Check questionsToday < 10, else return
  2. Optimistically append user message to messages[]
  3. Decrement questionsToday in AuthContext
  4. POST /api/chat/message with fetch
  5. Stream response via ReadableStream
  6. Append assistant message token by token
  7. On stream end: save full message to DB
```

#### ChatMessages.tsx
```
Props: { messages: Message[], isStreaming: boolean }

<div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
  {messages.map(m => <ChatMessage key={m.id} message={m} />)}
  {isStreaming && <TypingIndicator />}
  <div ref={bottomRef} />   ← auto-scroll anchor
</div>

useEffect: scroll bottomRef into view whenever messages change
```

#### ChatMessage.tsx
```
Props: { message: Message }

User message (role === 'user'):
  <div className="flex justify-end">
    <div className="max-w-[70%] bg-[#2C2C2A] border border-[#3A3A38]
                    rounded-lg px-4 py-2">
      <p className="text-[14px] text-[#ECECEA] leading-relaxed">
        {message.content}
      </p>
    </div>
  </div>

Assistant message (role === 'assistant'):
  <div className="flex justify-start">
    <div className="max-w-[85%]">
      [Rendered markdown content]
      Markdown rules:
        **bold** → <span className="font-medium text-[#ECECEA]">
        `code` → <code className="bg-[#2C2C2A] rounded px-1
                                   text-[13px] text-[#ECECEA]">
        \n\n → paragraph break with mb-3
      
      [If diagram reference in content]
      <DiagramCard diagramName={...} pageNumber={...} url={...} />
      
      [Source badge — below content]
      <p className="text-[11px] text-[#5A5A58] mt-2">
        {message.rag_used ? 'Context-matched' : 'AI generated'}
      </p>
    </div>
  </div>
```

#### DiagramCard.tsx
```
Props: { diagramName: string, pageNumber: number, url: string }

<a href={url} target="_blank" rel="noopener noreferrer"
   className="flex items-center gap-2 mt-2
              bg-[#2C2C2A] border border-[#3A3A38] rounded
              px-3 py-2 w-fit hover:bg-[#333331]
              transition-colors duration-150">
  <FileText size={13} className="text-[#8C8C8A]" />
  <span className="text-[12px] text-[#8C8C8A]">
    Refer: {diagramName}, Page {pageNumber}
  </span>
  <ExternalLink size={11} className="text-[#5A5A58]" />
</a>
```

#### ChatInput.tsx ('use client')
```
Props: { onSend, disabled, questionsToday }

Fixed to bottom of content area (not viewport — relative to ChatContainer):
  position: relative to flex parent, mt-auto

<div className="border-t border-[#2E2E2C] bg-[#1F1F1E] px-4 py-3">
  <div className="flex items-center gap-2">
    <input
      value={input}
      onChange={e => setInput(e.target.value)}
      onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
      disabled={disabled}
      placeholder={
        questionsToday >= 10
          ? "Daily limit reached — resets at midnight"
          : "Ask a question or name a topic..."
      }
      className="flex-1 bg-[#2C2C2A] border border-[#3A3A38]
                 rounded-lg px-4 py-2 text-[14px] text-[#ECECEA]
                 placeholder:text-[#5A5A58] focus:outline-none
                 focus:border-[#4A4A48] disabled:opacity-40
                 disabled:cursor-not-allowed"
    />
    <button
      onClick={handleSend}
      disabled={disabled || !input.trim()}
      className="w-8 h-8 flex items-center justify-center
                 bg-[#2C2C2A] border border-[#4A4A48] rounded-md
                 hover:bg-[#333331] disabled:opacity-40
                 disabled:cursor-not-allowed transition-colors">
      <ArrowUp size={15} className="text-[#ECECEA]" />
    </button>
  </div>
  <p className="text-[11px] text-[#5A5A58] text-center mt-2">
    {questionsToday} / 10 questions used today
  </p>
</div>
```

#### ChatHeader.tsx
```
Props: { subjectName: string, examType: string, questionsToday: number }

<div className="flex items-center justify-between
                border-b border-[#2E2E2C] bg-[#1F1F1E] px-4 py-3
                flex-shrink-0">
  <div>
    <p className="text-[14px] font-medium text-[#ECECEA]">{subjectName}</p>
    <p className="text-[12px] text-[#8C8C8A]">{examType}</p>
  </div>
  <p className="text-[12px] text-[#5A5A58]">
    {10 - questionsToday} questions remaining
  </p>
</div>
```

#### TypingIndicator.tsx
```
Three dots animation:
<div className="flex items-center gap-1 px-1 py-2">
  {[0, 1, 2].map(i => (
    <div
      key={i}
      className="w-1.5 h-1.5 bg-[#5A5A58] rounded-full
                 animate-bounce"
      style={{ animationDelay: `${i * 150}ms` }}
    />
  ))}
</div>
```

---

### FACULTY PAGES

#### /faculty/dashboard — server component
```
Fetch: papers by this faculty, assignment counts, question counts

Layout:
  [Page heading]
    "Dashboard"
    "{name} · Faculty" — text-[12px] text-[#8C8C8A]

  [Stats row] — grid grid-cols-3 gap-3 mt-6
    <StatCard value={papersGenerated} label="papers generated" subtext="all time" />
    <StatCard value={assignedThisMonth} label="assigned this month" />
    <StatCard value={totalQuestions} label="questions created" />

  [Recent papers table] — mt-6
    Section heading + "Generate new" button (right)
    
    Table:
      border border-[#3A3A38] rounded-lg overflow-hidden
      
      Header row:
        bg-[#1F1F1E] px-4 py-2.5
        text-[11px] text-[#5A5A58] uppercase tracking-wider
        Columns: Subject | Type | Year | Questions | Assigned | Date
      
      Each data row:
        border-t border-[#2E2E2C] px-4 py-3
        hover:bg-[#2C2C2A] cursor-pointer
        text-[13px] text-[#8C8C8A]
        Subject column: text-[#ECECEA]
        Assigned column:
          If assigned: branch + year — text-[#8C8C8A]
          If not: "Not assigned" — text-[#5A5A58]
        On click → /faculty/papers/[paperId]

    Empty state if no papers:
      <EmptyState icon={FileText} heading="No papers yet"
        action={<button>Generate your first paper</button>} />
```

#### /faculty/papers — ('use client' for accordion)
```
Fetch: all papers by this faculty grouped by subject

Layout:
  [Page heading] + "Generate paper" button top right

  [Accordion list] — mt-4 flex flex-col gap-2
    <PaperGroupAccordion> per subject group

PaperGroupAccordion.tsx:
  State: isOpen (default false)
  
  Header (always visible):
    <div onClick={() => setIsOpen(!isOpen)}
         className="flex items-center justify-between
                    bg-[#2C2C2A] border border-[#3A3A38]
                    rounded-lg px-4 py-3 cursor-pointer
                    hover:bg-[#333331]">
      <div>
        <span className="text-[14px] font-medium text-[#ECECEA]">
          {subject.name}
        </span>
        <span className="text-[12px] text-[#8C8C8A] ml-2">
          {subject.code}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-[#5A5A58]">
          {papers.length} papers
        </span>
        {isOpen
          ? <ChevronUp size={14} className="text-[#8C8C8A]" />
          : <ChevronDown size={14} className="text-[#8C8C8A]" />
        }
      </div>
    </div>

  Body (when isOpen):
    <div className="border border-[#3A3A38] border-t-0
                    rounded-b-lg overflow-hidden">
      {papers.map(paper => <PaperTableRow key={paper.id} paper={paper} />)}
    </div>

PaperTableRow.tsx:
  State: showConfirm (for delete)
  
  <div className="flex items-center justify-between
                  px-4 py-3 border-t border-[#2E2E2C]
                  hover:bg-[#2C2C2A]">
    <div onClick={() => router.push(`/faculty/papers/${paper.id}`)}
         className="flex-1 cursor-pointer">
      <span className="text-[13px] text-[#ECECEA]">{paper.exam_type}</span>
      <span className="text-[12px] text-[#8C8C8A] ml-3">
        {paper.academic_year}
      </span>
    </div>

    {showConfirm ? (
      <InlineConfirm
        message="Delete this paper?"
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setShowConfirm(false)}
      />
    ) : (
      <div className="flex items-center gap-3">
        <Pencil size={14} className="text-[#5A5A58] hover:text-[#ECECEA]
                                      cursor-pointer" />
        <Trash2 size={14} className="text-[#5A5A58] hover:text-red-400
                                      cursor-pointer"
                onClick={() => setShowConfirm(true)} />
        <Send size={14} className="text-[#5A5A58] hover:text-[#ECECEA]
                                    cursor-pointer"
              onClick={() => openAssignModal(paper.id)} />
      </div>
    )}
  </div>
```

#### /faculty/generate — same as chat but with ActionBar
```
Identical to ChatContainer layout with these additions:

1. After each assistant message that contains generated questions:
   <ActionBar onSave={handleSaveQP} />

ActionBar.tsx:
  <div className="mt-2 flex items-center gap-3
                  bg-[#2C2C2A] border border-[#3A3A38]
                  rounded-lg px-3 py-2">
    {!saved ? (
      <button onClick={onSave}
              className="flex items-center gap-2 text-[13px]
                         text-[#8C8C8A] hover:text-[#ECECEA]">
        <FileCheck size={14} />
        Save as question paper
      </button>
    ) : (
      <div className="flex items-center gap-4">
        <span className="text-[13px] text-[#8C8C8A]">Saved.</span>
        <button onClick={openAssignModal}
                className="text-[13px] text-[#ECECEA]">
          Assign to students →
        </button>
        <button onClick={() => setSaved(false)}
                className="text-[13px] text-[#5A5A58]">
          Continue editing
        </button>
      </div>
    )}
  </div>

AssignModal.tsx:
  Uses Modal.tsx as wrapper
  
  Fields:
    Department  → <input> full width
    Branch      → <input> full width
    Year        → <select> 1st / 2nd / 3rd / 4th Year
    Section     → <input> placeholder "Optional"
  
  Footer:
    flex justify-end gap-3
    "Cancel" → onClose
    "Assign" → POST /api/papers/assign → toast.success → onClose
```

---

### ADMIN PAGES

#### /admin/dashboard — server component
```
Fetch: counts, token usage

Layout:
  [Page heading]
    "Dashboard"
    "{college name}" — text-[12px] text-[#8C8C8A]

  [Stats row] — grid grid-cols-4 gap-3 mt-6 (2 cols on mobile)
    <StatCard value={studentCount} label="students" subtext="registered" />
    <StatCard value={facultyCount} label="faculty" subtext="active" />
    <StatCard value={subjectCount} label="subjects" subtext="uploaded" />
    <StatCard
      value={formatK(tokenUsage)}
      label={`of ${formatK(tokenLimit)} limit`}
      subtext="this month"
      valueColor={tokenUsage/tokenLimit > 0.9 ? 'text-red-400' : undefined}
    />

  [Token usage bar] — mt-4
    <TokenUsageBar used={tokenUsage} limit={tokenLimit} showLabel />

  [Two column section] — mt-6 grid grid-cols-2 gap-6 (stacked mobile)
    Left: "Recent Students"
      Last 5 signups
      Each: name + branch + year + joined timestamp
      "View all →" link

    Right: "Recent Papers"
      Last 5 assigned papers across college
      Each: subject + exam type + assigned to
      "View all →" link
```

#### /admin/students — ('use client' for filters)
```
State: yearFilter, branchFilter, sectionFilter (all strings)
Fetch: all students, filter client-side

Layout:
  [Page heading] "Students"

  [Filter row] — mt-4 flex gap-3
    Year: <select> All / 1st / 2nd / 3rd / 4th
    Branch: <input placeholder="Branch" className="w-32 ..." />
    Section: <input placeholder="Section" className="w-24 ..." />
    
    Filter onChange → instantly filters displayed list

  [Students table] — mt-4
    Header: Name | Email | Year | Branch | Section | Joined | Action
    
    Each row:
      <StudentTableRow student={s} onDelete={handleDelete} />
    
    StudentTableRow.tsx:
      State: showConfirm
      All cells text-[13px] text-[#8C8C8A]
      Name cell: text-[#ECECEA]
      Action cell:
        If showConfirm: <InlineConfirm ... />
        Else: <Trash2> icon → setShowConfirm(true)

  Empty state:
    <EmptyState icon={Users} heading="No students found"
      subtext="Try adjusting your filters" />
```

#### /admin/faculty — ('use client')
```
State: showPromoteSearch, searchEmail, searchResults

Layout:
  [Page heading] "Faculty"
  
  [Top right] "Promote student" button
    On click: setShowPromoteSearch(true)
    Shows inline search below heading:
      <input placeholder="Search by email..."
             onChange → debounced GET /api/admin/students?email={q} />
      Results dropdown:
        Each result: name + email + "Promote" button
        On Promote click:
          Show "Promote {name} to faculty?" inline confirm
          On confirm: PATCH /api/profiles/{id}/role → toast.success

  [Faculty table] — mt-4
    Header: Name | Email | Department | Joined | Action
    
    FacultyTableRow.tsx:
      State: showConfirm
      Action: "Revoke faculty" text button text-red-400
        On click: showConfirm = true
        <InlineConfirm message="Revoke {name}'s faculty access?"
                       confirmLabel="Revoke" ... />
```

#### /admin/syllabus — ('use client')
```
State: subjects[], showAddForm

Layout:
  [Page heading] "Syllabus"
  
  [Top right] "Add subject" button
    On click: showAddForm = true
    Inline form appears at top of list:
      bg-[#2C2C2A] border border-[#3A3A38] rounded-lg p-4 mb-3
      Fields in a row: Subject name | Code | Department | "Add" button
      On submit: POST /api/subjects → append to list → hide form

  [Subject list] — mt-4 flex flex-col gap-2
    <SubjectAccordion> per subject

SubjectAccordion.tsx:
  State: isOpen

  Header:
    Subject name + code + department
    Right: Edit (Pencil) | Delete (Trash2) | Toggle (ChevronDown/Up)
    Edit → inline edit fields replace text, show "Save" button
    Delete → <InlineConfirm>

  Body (when open):
    Current PDF section:
      If pdf_url exists:
        "Current PDF" label
        File name + upload date — text-[12px] text-[#8C8C8A]
        "Replace PDF" button → hidden file input (accept=".pdf")
        On file select:
          If same content (hash check) → show toast "Same PDF already uploaded"
          Else → upload, re-embed, update pdf_url
      If no pdf:
        <EmptyState icon={FileText} heading="No PDF uploaded"
          action={<button>Upload PDF</button>} />
    
    Chapters section (if PDF uploaded):
      Extracted chapters listed as:
        order_index. chapter title
        Sub-topics as indented list text-[12px] text-[#8C8C8A]
      Read-only, shown to confirm extraction was correct
```

---

### SUPER ADMIN PAGES

#### /super-admin/dashboard — server component
```
Fetch: all colleges from subscriptions DB, aggregate stats

Layout:
  [Page heading]
    "Overview"
    "Super Admin" — text-[12px] text-[#8C8C8A]

  [Stats row] — grid grid-cols-4 gap-3 mt-6
    <StatCard value={activeCount} label="active colleges"
              subtext={`of ${totalCount} total`} />
    <StatCard value={suspendedCount} label="suspended"
              valueColor={suspendedCount > 0 ? 'text-red-400' : undefined} />
    <StatCard value={formatK(totalTokens)} label="tokens used this month" />
    <StatCard value={`₹${activeCount * planPrice}`} label="monthly revenue"
              subtext="recurring" />

  [Alerts section] — mt-4 (only if alerts exist)
    bg-[#2C2C2A] border border-[#3A3A38] rounded-lg px-4 py-3
    Heading: "Needs Attention" — text-[12px] text-[#8C8C8A] mb-2
    
    Alert rows:
      <AlertTriangle> "[College] token usage at 94%"
      <Clock>         "[College] subscription expires in 3 days"
      <XCircle>       "[College] is currently suspended"
      
      Each: flex items-center gap-2.5 py-2 border-b border-[#2E2E2C]
      Right side: "Manage →" text-[12px] text-[#8C8C8A]
                  → /super-admin/subscriptions

  [Colleges table] — mt-6
    Header row: College | Status | Students | Token Usage | Expires | Action
    
    Sort order: suspended first → expiring soon → active alphabetical
    
    <CollegeCard> per college (table row style)
    
    CollegeCard.tsx:
      Status badge variants:
        active:    border border-[#3A3A38] text-[#ECECEA]
        suspended: border border-red-400 text-red-400
        expired:   border border-[#5A5A58] text-[#5A5A58]
      
      Token usage: "{used}k / {limit}k" + mini <ProgressBar>
      Expires: date, text-red-400 if within 7 days
      Action: "Manage →" text button
```

#### /super-admin/subscriptions — ('use client')
```
List of all colleges, each as expandable card

<CollegeCard> (expanded variant):
  Main row (always visible): same as dashboard table
  
  Expanded section (on click):
    bg-[#1F1F1E] border-t border-[#2E2E2C] px-4 py-4
    
    Row 1: Period — "{start} → {end}"
    
    Row 2: Token limit
      "Token limit:"
      <input type="number" value={limit} className="w-24 ..." />
      "Save" button
    
    Row 3: Extend period
      "Extend to:"
      <input type="date" ... />
      "Update" button
    
    Row 4: Actions
      If active:
        "Suspend college" → <InlineConfirm confirmLabel="Suspend">
      If suspended:
        "Reactivate" button → PATCH status active
```

---

## DATA FETCHING PATTERN

```
Server components (default, no 'use client'):
  async function fetchData() from lib/api.ts
  Pass data as props to client child components

Client components:
  Only for: forms, interactive state, streaming chat
  Use axios from lib/api.ts for mutations (POST/PATCH/DELETE)
  Use native fetch + ReadableStream for chat streaming only

lib/api.ts:
  import axios from 'axios'
  
  const api = axios.create({ baseURL: '/api' })
  
  api.interceptors.request.use(config => {
    const token = getAccessToken()  // from lib/auth.ts memory
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  })
  
  api.interceptors.response.use(
    res => res,
    async err => {
      if (err.response?.status === 401) {
        // Refresh token via httpOnly cookie
        await refreshAccessToken()
        return api(err.config)
      }
      return Promise.reject(err)
    }
  )

lib/auth.ts:
  let accessToken: string | null = null
  
  export const getAccessToken = () => accessToken
  export const setAccessToken = (t: string) => { accessToken = t }
  export const clearAccessToken = () => { accessToken = null }
  
  export async function refreshAccessToken() {
    const res = await fetch('/api/auth/refresh', { method: 'POST' })
    if (res.ok) {
      const { token } = await res.json()
      setAccessToken(token)
    } else {
      clearAccessToken()
      window.location.href = '/login'
    }
  }
```

---

## RESPONSIVE RULES

```
Sidebar:
  Desktop (md+): block
  Mobile: hidden

MobileTabBar:
  Desktop: hidden
  Mobile: fixed bottom-0 block

Content area:
  Desktop: ml-[240px]
  Mobile: ml-0 pb-16

Grids:
  Subject cards: grid-cols-2 md:grid-cols-2 (always 2 col)
  Stats: grid-cols-2 md:grid-cols-3 (student)
         grid-cols-2 md:grid-cols-4 (admin)

Tables on mobile:
  Wrap in overflow-x-auto
  min-w-[600px] on table itself

Chat:
  Content area full width on mobile
  Input stays fixed above MobileTabBar: mb-16 on mobile
```

---

## NOTIFICATIONS TABLE (add to schema)

```sql
CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  message     TEXT NOT NULL,
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_profile
  ON notifications(profile_id, created_at DESC);
CREATE INDEX idx_notifications_unread
  ON notifications(profile_id) WHERE read_at IS NULL;
```

---

## WHAT NOT TO BUILD (save for v2)

- Search across past chats
- Message-level embeddings
- Dark/light mode toggle (dark only)
- Email notifications (in-app only for v1)
- File upload for students (v2 feature)
- Analytics charts (token bar only for v1)
