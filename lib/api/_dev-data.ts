/**
 * Dev-mock data for frontend development without a backend.
 * Gated behind NEXT_PUBLIC_DEV_AUTH=true && NODE_ENV !== "production".
 */

import type {
  Project,
  Interview,
  ChatMessage,
  ChatSource,
  InsightTheme,
} from "@/types";
import type { InsightsResponse } from "./insights";

export const DEV_MODE =
  process.env.NEXT_PUBLIC_DEV_AUTH === "true" &&
  process.env.NODE_ENV !== "production";

/* ------------------------------------------------------------------ */
/*  Projects                                                           */
/* ------------------------------------------------------------------ */

let _projects: Project[] = [
  {
    id: "proj-001",
    name: "Q4 Customer Discovery",
    description: "Interviews with enterprise prospects about workflow pain points and feature gaps.",
    status: "active",
    created_at: "2025-11-14T10:30:00Z",
    updated_at: "2026-01-20T09:15:00Z",
    interview_count: 4,
  },
  {
    id: "proj-002",
    name: "Onboarding UX Research",
    description: "Usability tests of the new onboarding flow with 8 participants.",
    status: "complete",
    created_at: "2025-12-01T08:00:00Z",
    updated_at: "2026-01-05T14:30:00Z",
    interview_count: 8,
  },
  {
    id: "proj-003",
    name: "Pricing Page A/B Test Interviews",
    status: "processing",
    created_at: "2026-01-28T15:45:00Z",
    interview_count: 2,
  },
];

let _nextProjectNum = 4;

export function devGetProjects(): Project[] {
  return [..._projects];
}

export function devGetProject(id: string): Project | undefined {
  return _projects.find((p) => p.id === id);
}

export function devCreateProject(name: string, description?: string): Project {
  const project: Project = {
    id: `proj-${String(_nextProjectNum++).padStart(3, "0")}`,
    name,
    description,
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    interview_count: 0,
  };
  _projects = [project, ..._projects];
  return project;
}

export function devUpdateProject(id: string, data: { name?: string; description?: string }): Project | undefined {
  _projects = _projects.map((p) =>
    p.id === id ? { ...p, ...data, updated_at: new Date().toISOString() } : p
  );
  return _projects.find((p) => p.id === id);
}

export function devDeleteProject(id: string): void {
  _projects = _projects.filter((p) => p.id !== id);
  delete _interviews[id];
}

/* ------------------------------------------------------------------ */
/*  Interviews                                                         */
/* ------------------------------------------------------------------ */

const _interviews: Record<string, Interview[]> = {
  "proj-001": [
    {
      id: "int-001",
      project_id: "proj-001",
      file_name: "sarah_enterprise_interview.mp3",
      duration_seconds: 1842,
      status: "complete",
      created_at: "2025-11-15T09:00:00Z",
    },
    {
      id: "int-002",
      project_id: "proj-001",
      file_name: "mike_workflow_review.mp4",
      duration_seconds: 2460,
      status: "complete",
      created_at: "2025-11-18T14:30:00Z",
    },
    {
      id: "int-003",
      project_id: "proj-001",
      file_name: "team_lead_feedback.wav",
      duration_seconds: 960,
      status: "transcribing",
      created_at: "2026-01-19T11:00:00Z",
    },
    {
      id: "int-004",
      project_id: "proj-001",
      file_name: "product_manager_call.mp3",
      duration_seconds: 3120,
      status: "complete",
      created_at: "2025-12-02T16:00:00Z",
    },
  ],
  "proj-002": [
    {
      id: "int-010",
      project_id: "proj-002",
      file_name: "participant_01_onboarding.mp4",
      duration_seconds: 780,
      status: "complete",
      created_at: "2025-12-03T10:00:00Z",
    },
    {
      id: "int-011",
      project_id: "proj-002",
      file_name: "participant_02_onboarding.mp4",
      duration_seconds: 920,
      status: "complete",
      created_at: "2025-12-03T11:30:00Z",
    },
    {
      id: "int-012",
      project_id: "proj-002",
      file_name: "participant_03_onboarding.mp4",
      duration_seconds: 650,
      status: "complete",
      created_at: "2025-12-04T09:00:00Z",
    },
  ],
  "proj-003": [
    {
      id: "int-020",
      project_id: "proj-003",
      file_name: "pricing_feedback_user_a.mp3",
      duration_seconds: 1200,
      status: "embedding",
      created_at: "2026-01-29T10:00:00Z",
    },
    {
      id: "int-021",
      project_id: "proj-003",
      file_name: "pricing_feedback_user_b.mp3",
      duration_seconds: 1500,
      status: "uploaded",
      created_at: "2026-01-30T14:00:00Z",
    },
  ],
};

let _nextIntNum = 100;

export function devGetInterviews(projectId: string): Interview[] {
  return _interviews[projectId] ?? [];
}

export function devGetInterview(projectId: string, interviewId: string): Interview | undefined {
  return (_interviews[projectId] ?? []).find((i) => i.id === interviewId);
}

export function devCreateInterview(projectId: string, fileName: string, fileSize: number): Interview {
  const interview: Interview = {
    id: `int-${String(_nextIntNum++).padStart(3, "0")}`,
    project_id: projectId,
    file_name: fileName,
    duration_seconds: null,
    status: "uploaded",
    created_at: new Date().toISOString(),
  };
  if (!_interviews[projectId]) _interviews[projectId] = [];
  _interviews[projectId].push(interview);
  // Update project interview count
  _projects = _projects.map((p) =>
    p.id === projectId ? { ...p, interview_count: (_interviews[projectId] ?? []).length } : p
  );
  return interview;
}

export function devDeleteInterview(projectId: string, interviewId: string): void {
  if (_interviews[projectId]) {
    _interviews[projectId] = _interviews[projectId].filter((i) => i.id !== interviewId);
  }
}

/**
 * Simulate processing: advance the interview status after a delay.
 */
export function devSimulateProcessing(projectId: string, interviewId: string): void {
  const advance = (from: string, to: string, delay: number) => {
    setTimeout(() => {
      if (!_interviews[projectId]) return;
      _interviews[projectId] = _interviews[projectId].map((i) =>
        i.id === interviewId && i.status === from ? { ...i, status: to as Interview["status"] } : i
      );
    }, delay);
  };
  advance("uploaded", "transcribing", 2000);
  advance("transcribing", "embedding", 5000);
  advance("embedding", "complete", 8000);
}

/* ------------------------------------------------------------------ */
/*  Chat                                                               */
/* ------------------------------------------------------------------ */

const _chatHistory: Record<string, ChatMessage[]> = {};

export function devGetChatHistory(projectId: string): ChatMessage[] {
  return _chatHistory[projectId] ?? [];
}

export function devClearChat(projectId: string): void {
  _chatHistory[projectId] = [];
}

/** Simulate a streaming AI response for a user message. */
export function devGenerateChatResponse(
  projectId: string,
  userMessage: string
): { userMsg: ChatMessage; aiResponse: string; sources: ChatSource[] } {
  const userMsg: ChatMessage = {
    id: `msg-${Date.now()}-user`,
    role: "user",
    content: userMessage,
    created_at: new Date().toISOString(),
  };

  if (!_chatHistory[projectId]) _chatHistory[projectId] = [];
  _chatHistory[projectId].push(userMsg);

  // Generate a contextual mock response
  const lower = userMessage.toLowerCase();
  let aiResponse: string;
  let sources: ChatSource[];

  if (lower.includes("feature") || lower.includes("request")) {
    aiResponse =
      "Based on your interviews, the most requested features are:\n\n" +
      "1. **Bulk export to CSV** — mentioned by 6 out of 8 participants, especially in the context of quarterly reporting workflows.\n\n" +
      "2. **Real-time collaboration** — 5 participants described wanting to work on documents simultaneously with teammates.\n\n" +
      "3. **Custom dashboard widgets** — 4 participants wanted the ability to build personalized views of their data.\n\n" +
      "These requests were consistent across both enterprise and mid-market segments.";
    sources = [
      { quote: "I spend hours every quarter exporting data one report at a time. A bulk export would save me at least a full day.", interview_id: "int-001", interview_name: "sarah_enterprise_interview.mp3", timestamp: "12:34" },
      { quote: "We need to be able to edit the same doc together, like Google Docs but within the platform.", interview_id: "int-002", interview_name: "mike_workflow_review.mp4", timestamp: "8:15" },
      { quote: "Let me drag and drop widgets to build my own dashboard. The default view doesn't match how I actually work.", interview_id: "int-004", interview_name: "product_manager_call.mp3", timestamp: "22:47" },
    ];
  } else if (lower.includes("frustration") || lower.includes("pain") || lower.includes("problem")) {
    aiResponse =
      "The most common frustrations mentioned across interviews are:\n\n" +
      "1. **Slow search performance** — Users reported waiting 10-15 seconds for search results, especially when filtering across large datasets.\n\n" +
      "2. **Confusing navigation** — Multiple participants got lost when trying to find settings or return to their previous view.\n\n" +
      "3. **No offline support** — Field researchers mentioned losing work when internet connectivity dropped during site visits.";
    sources = [
      { quote: "I type in my query and just sit there watching the spinner. It's painful when I'm trying to find something fast.", interview_id: "int-001", interview_name: "sarah_enterprise_interview.mp3", timestamp: "18:22" },
      { quote: "I clicked settings and ended up somewhere completely different. Had to use the browser back button three times.", interview_id: "int-002", interview_name: "mike_workflow_review.mp4", timestamp: "15:03" },
    ];
  } else if (lower.includes("onboarding")) {
    aiResponse =
      "Onboarding feedback revealed several patterns:\n\n" +
      "- **Step 3 of the wizard is a drop-off point** — 6 of 8 participants hesitated or needed help at the team invitation step.\n\n" +
      "- **The welcome video was appreciated** but felt too long at 4 minutes. Participants suggested 90 seconds max.\n\n" +
      "- **First-run tooltips were helpful** but disappeared too quickly. Several users wanted the ability to replay them.\n\n" +
      "Overall sentiment toward onboarding was moderately positive (0.6 avg), with the biggest improvement opportunities around reducing friction in the team setup step.";
    sources = [
      { quote: "I didn't know what to put for 'team workspace name' — is this something my admin has to set up first?", interview_id: "int-010", interview_name: "participant_01_onboarding.mp4", timestamp: "3:42" },
      { quote: "The intro video was nice but I skipped to the end. Just show me the product.", interview_id: "int-011", interview_name: "participant_02_onboarding.mp4", timestamp: "1:15" },
    ];
  } else if (lower.includes("theme") || lower.includes("summary") || lower.includes("summarize")) {
    aiResponse =
      "Here are the key themes across all your interviews:\n\n" +
      "**Positive:**\n- Users love the core analytics dashboard (8/8 positive mentions)\n- Mobile app was praised for its responsiveness\n- Customer support was rated highly\n\n" +
      "**Negative:**\n- Performance issues with large datasets (6/8 interviews)\n- Navigation complexity as feature set grows\n- Lack of integrations with existing tools\n\n" +
      "**Opportunities:**\n- Bulk operations across all data types\n- Better onboarding for team admins\n- API access for power users";
    sources = [
      { quote: "The analytics are genuinely the best I've seen. It's why we stay despite the other issues.", interview_id: "int-001", interview_name: "sarah_enterprise_interview.mp3", timestamp: "5:20" },
      { quote: "Every time they add a new feature, the nav gets more confusing. I can never find the thing I used last week.", interview_id: "int-004", interview_name: "product_manager_call.mp3", timestamp: "31:10" },
    ];
  } else if (lower.includes("pricing") || lower.includes("price") || lower.includes("cost")) {
    aiResponse =
      "Pricing feedback from interviews:\n\n" +
      "- Most users felt the **$49/month tier** was fair for the feature set, but wanted clarity on what's included vs. add-on.\n\n" +
      "- Enterprise users expected **volume discounts** for 50+ seats and were surprised these weren't available.\n\n" +
      "- 3 participants mentioned they'd pay more for **priority support** as a standalone add-on.\n\n" +
      "Overall, pricing sensitivity was low among power users but high among smaller teams evaluating alternatives.";
    sources = [
      { quote: "Forty-nine bucks is fine, but I shouldn't have to guess which features cost extra.", interview_id: "int-001", interview_name: "sarah_enterprise_interview.mp3", timestamp: "28:15" },
      { quote: "We have 200 people. There has to be a volume deal, right?", interview_id: "int-002", interview_name: "mike_workflow_review.mp4", timestamp: "35:00" },
    ];
  } else {
    aiResponse =
      `Great question! Here's what I found across your interviews about "${userMessage.slice(0, 60)}":\n\n` +
      "Several participants touched on this topic. The general consensus is that there's room for improvement, " +
      "particularly around workflow efficiency and team collaboration.\n\n" +
      "Key observations:\n" +
      "- Users want more control over their workspace configuration\n" +
      "- Integration with third-party tools is a recurring request\n" +
      "- The current experience works well for individual users but breaks down for team use cases\n\n" +
      "Would you like me to drill deeper into any of these areas?";
    sources = [
      { quote: "It works great when I'm the only one using it, but everything gets messy when the whole team is in there.", interview_id: "int-002", interview_name: "mike_workflow_review.mp4", timestamp: "20:10" },
    ];
  }

  const aiMsg: ChatMessage = {
    id: `msg-${Date.now()}-ai`,
    role: "assistant",
    content: aiResponse,
    supporting_quotes: sources,
    created_at: new Date().toISOString(),
  };
  _chatHistory[projectId].push(aiMsg);

  return { userMsg, aiResponse, sources };
}

/* ------------------------------------------------------------------ */
/*  Insights                                                           */
/* ------------------------------------------------------------------ */

export function devGetInsights(_projectId: string): InsightsResponse {
  return {
    feature_requests: [
      {
        id: "fr-1",
        title: "Bulk export to CSV",
        frequency: 6,
        sentiment_score: 0.3,
        quotes: [
          "I spend hours every quarter exporting data one report at a time.",
          "Just give me a 'select all and export' button, that's all I need.",
          "Our finance team keeps asking for CSV dumps and I have to do them manually.",
        ],
        type: "feature_request",
      },
      {
        id: "fr-2",
        title: "Real-time collaboration",
        frequency: 5,
        sentiment_score: 0.4,
        quotes: [
          "We need to edit the same document at the same time, not take turns.",
          "Slack plus this tool equals too many tabs. Let us work in one place.",
        ],
        type: "feature_request",
      },
      {
        id: "fr-3",
        title: "Custom dashboard widgets",
        frequency: 4,
        sentiment_score: 0.5,
        quotes: [
          "Let me build my own view — the default layout is not how I think.",
          "I'd love drag-and-drop dashboard customization like in Notion.",
        ],
        type: "feature_request",
      },
      {
        id: "fr-4",
        title: "API access for integrations",
        frequency: 3,
        sentiment_score: 0.2,
        quotes: [
          "We need to pipe this data into our existing BI stack.",
          "If there was an API, I'd build the integration myself over a weekend.",
        ],
        type: "feature_request",
      },
    ],
    frustrations: [
      {
        id: "fru-1",
        title: "Slow search performance",
        frequency: 6,
        sentiment_score: -0.7,
        quotes: [
          "I type and wait fifteen seconds. That's not search, that's patience testing.",
          "Search is basically unusable when you have more than 1,000 records.",
        ],
        type: "frustration",
      },
      {
        id: "fru-2",
        title: "Confusing navigation structure",
        frequency: 5,
        sentiment_score: -0.5,
        quotes: [
          "I get lost every single time I try to find settings.",
          "The back button is my most-used feature, and that's a problem.",
          "My new hires spend a full week just learning where things are.",
        ],
        type: "frustration",
      },
      {
        id: "fru-3",
        title: "No offline support",
        frequency: 3,
        sentiment_score: -0.6,
        quotes: [
          "I do field research in areas with no internet. I lose everything.",
          "At least let me cache my recent data for read-only access offline.",
        ],
        type: "frustration",
      },
    ],
    positive_themes: [
      {
        id: "pos-1",
        title: "Excellent analytics dashboard",
        frequency: 8,
        sentiment_score: 0.9,
        quotes: [
          "The analytics are genuinely the best I've seen. It's why we stay.",
          "When I show the dashboard to stakeholders, they immediately get it.",
          "I can answer any executive question in under 30 seconds with this.",
        ],
        type: "positive",
      },
      {
        id: "pos-2",
        title: "Responsive mobile experience",
        frequency: 5,
        sentiment_score: 0.8,
        quotes: [
          "The mobile app is surprisingly good. I check stats on my commute.",
          "I can approve requests from my phone. That used to require a laptop.",
        ],
        type: "positive",
      },
      {
        id: "pos-3",
        title: "Helpful customer support",
        frequency: 4,
        sentiment_score: 0.85,
        quotes: [
          "Support replied in under 20 minutes and actually solved my problem.",
          "The support team even jumped on a call to walk me through it.",
        ],
        type: "positive",
      },
    ],
    negative_themes: [
      {
        id: "neg-1",
        title: "Performance degradation with scale",
        frequency: 6,
        sentiment_score: -0.6,
        quotes: [
          "Everything was fast when we had 100 records. At 10k, it crawls.",
          "Page load times tripled after we onboarded the sales team.",
        ],
        type: "negative",
      },
      {
        id: "neg-2",
        title: "Lack of third-party integrations",
        frequency: 4,
        sentiment_score: -0.4,
        quotes: [
          "I need Salesforce and HubSpot integration. Without that, it's extra manual work.",
          "We're paying for Zapier just to connect this to our other tools. That shouldn't be necessary.",
        ],
        type: "negative",
      },
    ],
    onboarding_issues: [
      {
        id: "onb-1",
        title: "Team invitation step causes confusion",
        frequency: 6,
        sentiment_score: -0.4,
        quotes: [
          "I didn't know what to enter for 'team workspace name' — is that something my admin sets up?",
          "I tried to invite my team but the email invite never arrived.",
          "Step 3 of onboarding stopped me cold. I had to contact support.",
        ],
        type: "onboarding",
      },
      {
        id: "onb-2",
        title: "Welcome video too long",
        frequency: 5,
        sentiment_score: -0.2,
        quotes: [
          "The intro video was nice but four minutes is too long. Just show me the product.",
          "Skip button should be bigger. I almost missed it.",
        ],
        type: "onboarding",
      },
      {
        id: "onb-3",
        title: "Tooltips disappear too quickly",
        frequency: 4,
        sentiment_score: -0.3,
        quotes: [
          "The first-run tips were helpful but they vanished before I could read them.",
          "Can I replay the onboarding hints? I want to show them to a new colleague.",
        ],
        type: "onboarding",
      },
    ],
  };
}
