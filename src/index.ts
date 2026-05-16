#!/usr/bin/env node
/**
 * BriefKit MCP Server
 * 
 * Generates engineer-grade SaaS specification components that can be
 * pasted into AI build tools (Lovable, Claude Code, Cursor, Bolt, v0).
 * 
 * Tools:
 * - briefkit_generate_design_system: Generate a DESIGN.md with colors, fonts, spacing
 * - briefkit_generate_database_schema: Generate database schema SQL from product description
 * - briefkit_generate_rls_policies: Generate Supabase RLS policies from tables + roles
 * - briefkit_get_info: Get information about BriefKit and the full 14-file brief pack
 * 
 * Website: https://briefkit.online
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// ============================================================
// CONSTANTS
// ============================================================
const BRIEFKIT_URL = "https://briefkit.online";
const VERSION = "1.0.0";

// ============================================================
// TEMPLATE DATA
// ============================================================

const COLOR_PALETTES: Record<string, { primary: string; secondary: string; accent: string; bg: string; surface: string; text: string; muted: string; name: string }> = {
  "trust-blue": {
    name: "Trust Blue",
    primary: "#2563EB", secondary: "#1E40AF", accent: "#3B82F6",
    bg: "#FAFAFA", surface: "#FFFFFF", text: "#111111", muted: "#888888"
  },
  "forest-green": {
    name: "Forest Green",
    primary: "#16A34A", secondary: "#15803D", accent: "#22C55E",
    bg: "#FAFAFA", surface: "#FFFFFF", text: "#111111", muted: "#888888"
  },
  "warm-gold": {
    name: "Warm Gold",
    primary: "#CFA868", secondary: "#8B6914", accent: "#EAB308",
    bg: "#FAFAFA", surface: "#FFFFFF", text: "#111111", muted: "#888888"
  },
  "cool-purple": {
    name: "Cool Purple",
    primary: "#7C3AED", secondary: "#6D28D9", accent: "#A855F7",
    bg: "#FAFAFA", surface: "#FFFFFF", text: "#111111", muted: "#888888"
  },
  "slate-minimal": {
    name: "Slate Minimal",
    primary: "#334155", secondary: "#1E293B", accent: "#64748B",
    bg: "#FAFAFA", surface: "#FFFFFF", text: "#111111", muted: "#888888"
  },
  "coral-energy": {
    name: "Coral Energy",
    primary: "#F43F5E", secondary: "#E11D48", accent: "#FB7185",
    bg: "#FAFAFA", surface: "#FFFFFF", text: "#111111", muted: "#888888"
  }
};

const FONT_PAIRINGS: Record<string, { display: string; body: string; mono: string; name: string }> = {
  "geometric": { name: "Geometric Modern", display: "DM Sans", body: "IBM Plex Sans", mono: "JetBrains Mono" },
  "serif-modern": { name: "Serif Modern", display: "Instrument Serif", body: "Outfit", mono: "JetBrains Mono" },
  "clean-sans": { name: "Clean Sans", display: "Inter", body: "Inter", mono: "Fira Code" },
  "editorial": { name: "Editorial", display: "Playfair Display", body: "Source Sans 3", mono: "Source Code Pro" },
  "rounded": { name: "Rounded Friendly", display: "Nunito", body: "Outfit", mono: "JetBrains Mono" }
};

const SAAS_TEMPLATES: Record<string, { tables: string[]; roles: string[]; sections: string[]; pricing: string; auth: string }> = {
  "b2b": {
    tables: ["profiles", "organizations", "subscriptions", "payments", "audit_log", "webhook_events"],
    roles: ["Owner", "Admin", "Member", "Viewer"],
    sections: ["Hero", "Logos", "Features", "How It Works", "Testimonials", "Pricing", "Integrations", "Security", "FAQ", "CTA"],
    pricing: "Per-seat: Team $12/seat/mo, Business $25/seat/mo, Enterprise custom",
    auth: "Email + Google OAuth, team invites, SSO for Enterprise"
  },
  "devtool": {
    tables: ["profiles", "api_keys", "usage_logs", "subscriptions", "payments", "webhook_events"],
    roles: ["Owner", "Developer"],
    sections: ["Hero with code snippet", "Install command", "Features", "Code Examples", "Benchmarks", "Changelog", "Pricing", "Docs CTA"],
    pricing: "Usage-based: Free 1K req/mo, Pro $29/mo 100K, Scale $99/mo 1M",
    auth: "API key auth + dashboard login via email/OAuth"
  },
  "productivity": {
    tables: ["profiles", "projects", "tasks", "subscriptions", "payments", "activity_log"],
    roles: ["Owner", "Pro User", "Free User"],
    sections: ["Hero", "Screenshot", "Features", "Testimonials", "Use Cases", "Pricing", "FAQ", "CTA"],
    pricing: "Freemium: Free, Pro $9/mo, Team $19/seat/mo",
    auth: "Email + Google OAuth + magic link"
  },
  "marketplace": {
    tables: ["profiles", "listings", "orders", "reviews", "messages", "subscriptions", "payments", "disputes"],
    roles: ["Owner", "Seller", "Buyer", "Moderator"],
    sections: ["Hero", "Featured", "How It Works", "Stats", "Testimonials", "Categories", "Trust", "Pricing", "CTA"],
    pricing: "Subscription: Free browse, Seller $19/mo, Seller Pro $49/mo",
    auth: "Email + OAuth, seller verification, buyer guest checkout"
  },
  "microsaas": {
    tables: ["profiles", "projects", "subscriptions", "payments"],
    roles: ["Owner"],
    sections: ["Hero", "Problem", "Solution", "Features", "Pricing", "FAQ", "Founder Note", "CTA"],
    pricing: "One-time: $9 per use",
    auth: "Email + Google OAuth"
  }
};

// ============================================================
// GENERATOR FUNCTIONS
// ============================================================

function generateDesignSystem(
  productName: string,
  palette: string,
  fonts: string,
  borderRadius: number,
  density: string
): string {
  const colors = COLOR_PALETTES[palette] || COLOR_PALETTES["trust-blue"];
  const fontPair = FONT_PAIRINGS[fonts] || FONT_PAIRINGS["geometric"];
  
  const spacingScale = density === "compact" 
    ? "4, 8, 12, 16, 20, 24, 32" 
    : density === "spacious" 
      ? "8, 16, 24, 32, 48, 64, 96"
      : "4, 8, 12, 16, 24, 32, 48, 64";

  const typeScale = density === "compact"
    ? "12, 13, 14, 16, 20, 24, 28"
    : "14, 16, 18, 20, 24, 28, 36, 48";

  return `# ${productName} — Design System
Generated by BriefKit | ${new Date().toISOString().split('T')[0]}

## COLOR PALETTE (${colors.name})
\`\`\`css
:root {
  --color-primary: ${colors.primary};
  --color-secondary: ${colors.secondary};
  --color-accent: ${colors.accent};
  --color-bg: ${colors.bg};
  --color-surface: ${colors.surface};
  --color-text: ${colors.text};
  --color-muted: ${colors.muted};
  --color-success: #22C55E;
  --color-warning: #EAB308;
  --color-error: #F43F5E;
  --color-info: #3B82F6;
}
\`\`\`

## TYPOGRAPHY (${fontPair.name})
- **Display/Headings**: ${fontPair.display}
- **Body**: ${fontPair.body}
- **Code/Mono**: ${fontPair.mono}
- **Type scale**: ${typeScale}
- **Line height**: body 1.6, headings 1.2, compact 1.4

## SPACING
- **Scale**: ${spacingScale} (px)
- **Density**: ${density}
- **Section padding**: ${density === "compact" ? "48px" : density === "spacious" ? "120px" : "80px"}

## BORDER RADIUS
- **Components**: ${borderRadius}px
- **Cards**: ${borderRadius + 4}px
- **Modals**: ${borderRadius + 8}px
- **Pills/badges**: 9999px (full round)

## COMPONENTS
- **Buttons**: padding ${density === "compact" ? "8px 16px" : "12px 24px"}, radius ${borderRadius}px, font-weight 600
- **Cards**: bg var(--color-surface), border 1px solid rgba(0,0,0,0.08), radius ${borderRadius + 4}px, shadow 0 1px 3px rgba(0,0,0,0.04)
- **Inputs**: height ${density === "compact" ? "36px" : "44px"}, border 1.5px solid var(--color-muted), radius ${borderRadius}px, padding 0 12px
- **Nav**: height ${density === "compact" ? "56px" : "64px"}, sticky, backdrop-filter blur(12px)

## DARK MODE
\`\`\`css
:root.dark {
  --color-bg: #0B0B0F;
  --color-surface: #161618;
  --color-text: #E8E6E1;
  --color-muted: #6B6A65;
  --color-primary: ${colors.primary};
  --color-accent: ${colors.accent};
}
\`\`\`

## CONSTRAINTS
- Use CSS custom properties for ALL colors — never hardcode hex values
- Load fonts via Google Fonts
- Mobile breakpoint: 768px
- All interactive elements must have visible focus rings
- Minimum touch target: 44x44px

---
*Full 14-file brief pack with database schema, RLS policies, auth flows, billing logic, and 47 test cases available at ${BRIEFKIT_URL} — $9*`;
}

function generateDatabaseSchema(
  productName: string,
  saasType: string,
  customTables: string[]
): string {
  const template = SAAS_TEMPLATES[saasType] || SAAS_TEMPLATES["microsaas"];
  const allTables = [...new Set([...template.tables, ...customTables])];

  let schema = `# ${productName} — Database Schema
Generated by BriefKit | ${new Date().toISOString().split('T')[0]}
SaaS Type: ${saasType}

## TABLES (${allTables.length})

`;

  // Generate profiles table (always present)
  schema += `### profiles
\`\`\`sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'member' CHECK (role IN (${template.roles.map(r => `'${r.toLowerCase()}'`).join(', ')})),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
\`\`\`

`;

  // Generate subscriptions table
  if (allTables.includes("subscriptions")) {
    schema += `### subscriptions
\`\`\`sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  plan TEXT NOT NULL,
  status TEXT DEFAULT 'trial' CHECK (status IN ('trial', 'active', 'past_due', 'cancelled')),
  trial_started_at TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  payment_provider TEXT,
  provider_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
\`\`\`

`;
  }

  // Generate payments table
  if (allTables.includes("payments")) {
    schema += `### payments
\`\`\`sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  amount_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'usd',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  provider TEXT,
  provider_payment_id TEXT UNIQUE,
  provider_order_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
\`\`\`

`;
  }

  // Generate audit_log table
  if (allTables.includes("audit_log")) {
    schema += `### audit_log
\`\`\`sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
-- Server-write only. REVOKE INSERT from authenticated users.
\`\`\`

`;
  }

  // Generate webhook_events table
  if (allTables.includes("webhook_events")) {
    schema += `### webhook_events
\`\`\`sql
CREATE TABLE webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'failed')),
  retries INTEGER DEFAULT 0,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
-- Server-write only. Idempotency via provider_event_id UNIQUE constraint.
\`\`\`

`;
  }

  // Generate custom tables
  const standardTables = ["profiles", "subscriptions", "payments", "audit_log", "webhook_events"];
  const custom = allTables.filter(t => !standardTables.includes(t));
  
  for (const table of custom) {
    schema += `### ${table}
\`\`\`sql
CREATE TABLE ${table} (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  name TEXT NOT NULL,
  data JSONB,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
-- Add your specific columns. This is a starter template.
\`\`\`

`;
  }

  schema += `## SECURITY BASELINE
\`\`\`sql
-- Run immediately after creating tables
REVOKE INSERT, UPDATE, DELETE ON payments FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON audit_log FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON webhook_events FROM authenticated;
-- Only service_role (Edge Functions) writes to these tables.
\`\`\`

## INDEXES
\`\`\`sql
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_created ON audit_log(created_at);
\`\`\`

---
*Full 14-file brief pack with design system, RLS policies, auth flows, billing logic, and 47 test cases available at ${BRIEFKIT_URL} — $9*`;

  return schema;
}

function generateRlsPolicies(
  tables: string[],
  roles: string[]
): string {
  let sql = `# RLS Policies
Generated by BriefKit | ${new Date().toISOString().split('T')[0]}
Roles: ${roles.join(", ")}

## ENABLE RLS ON ALL TABLES
\`\`\`sql
${tables.map(t => `ALTER TABLE ${t} ENABLE ROW LEVEL SECURITY;\nALTER TABLE ${t} FORCE ROW LEVEL SECURITY;`).join('\n')}
\`\`\`

## POLICIES

`;

  for (const table of tables) {
    const isServerOnly = ["payments", "audit_log", "webhook_events"].includes(table);
    const isProfiles = table === "profiles";

    sql += `### ${table}\n\`\`\`sql\n`;

    if (isServerOnly) {
      sql += `-- SERVER-WRITE ONLY: Only service_role can INSERT/UPDATE/DELETE
REVOKE INSERT, UPDATE, DELETE ON ${table} FROM authenticated;

-- Users can read their own records
CREATE POLICY ${table}_select ON ${table}
  FOR SELECT USING (user_id = auth.uid());

-- Admin can read all
CREATE POLICY ${table}_admin_select ON ${table}
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
`;
    } else if (isProfiles) {
      sql += `-- Users can read their own profile
CREATE POLICY profiles_select ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Admin can read all profiles
CREATE POLICY profiles_admin_select ON profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Users can update own profile but CANNOT change role or email
CREATE POLICY profiles_update ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM profiles WHERE id = auth.uid())
    AND email = (SELECT email FROM profiles WHERE id = auth.uid())
  );
`;
    } else {
      sql += `-- Users can read their own data
CREATE POLICY ${table}_select ON ${table}
  FOR SELECT USING (user_id = auth.uid());

-- Users can insert with their own user_id
CREATE POLICY ${table}_insert ON ${table}
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own records
CREATE POLICY ${table}_update ON ${table}
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own records
CREATE POLICY ${table}_delete ON ${table}
  FOR DELETE USING (user_id = auth.uid());

-- Admin can read all
CREATE POLICY ${table}_admin_select ON ${table}
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
`;
    }

    sql += `\`\`\`\n\n`;
  }

  sql += `## SECURITY NOTES
- profiles.role is IMMUTABLE from client — only service_role can change it
- payments, audit_log, webhook_events: no client writes allowed
- All SECURITY DEFINER functions: REVOKE EXECUTE from public and authenticated
- Edge Functions use service_role key for sensitive writes

---
*Full 14-file brief pack with design system, schema, auth flows, billing logic, and 47 test cases available at ${BRIEFKIT_URL} — $9*`;

  return sql;
}

function getBriefKitInfo(): string {
  return `# BriefKit — Engineer-grade specs for AI-built SaaS

## What it does
BriefKit generates a 14-file specification pack for SaaS products. You fill a form describing your product, and BriefKit outputs everything your AI build tool needs to get it right on the first try.

## The problem it solves
Non-technical founders using Lovable, Cursor, or Claude Code waste 200+ iterations and $80-100 in credits because they never defined their database schema, security policies, or auth flows before prompting. BriefKit front-loads all those decisions into a structured spec.

## What's in the 14-file brief pack
1. **GLOBAL-BRIEF.md** — Design system + schema + RLS + API contracts + auth + billing + constraints
2. **01-landing-page.md** — Sections, pricing table, content direction
3. **02-auth-screens.md** — Login, signup, OAuth, password reset, all error states
4. **03-onboarding.md** — First-run flow, progress, empty states
5. **04-dashboard.md** — Metrics, tables, charts, sidebar
6. **05-settings.md** — Account, billing, team, preferences
7. **06-admin-panel.md** — Super admin: users, payments, audit log, impersonation
8. **07-emails.md** — Welcome, reset, receipt, trial expiry
9. **08-docs-changelog.md** — Documentation layout, versioned changelog
10. **TESTING.md** — Test users with credentials, 47 P0 test cases, verification protocol
11. **METRICS.md** — MRR, churn, activation, cohort queries
12. **DEPLOYMENT.md** — Env vars, CI/CD, DNS checklist
13. **PERMISSIONS.md** — Full RBAC matrix
14. **TOKENS.json** — CSS vars, Tailwind config, Figma variables

## How it works
1. Pick a SaaS template (5 archetypes)
2. Answer questions about your product, customer, pricing
3. Review the live preview (brief strength score targets 8+/10)
4. Export — $9 per version

## Results
- ~19 prompts instead of 200+
- $29 total ($9 brief + $20 build tool) vs $80-100 without
- 1-2 weeks instead of 4-8 weeks
- 0 security issues (14 prevented in real builds)

## Works with
Lovable, Claude Code, Cursor, Bolt, v0, Replit

## Free tools (no signup required)
- RLS Policy Generator: ${BRIEFKIT_URL}/free/rls-generator
- DESIGN.md Generator: ${BRIEFKIT_URL}/free/design-md

## Website
${BRIEFKIT_URL}

## Pricing
$9 per brief pack version. Not a subscription. Pay when you export, not every month.`;
}

// ============================================================
// MCP SERVER
// ============================================================

const server = new McpServer({
  name: "briefkit-mcp-server",
  version: VERSION
});

// Tool 1: Generate Design System
server.registerTool(
  "briefkit_generate_design_system",
  {
    title: "Generate SaaS Design System",
    description: `Generate a complete DESIGN.md specification for a SaaS product — colors, typography, spacing, components, dark mode, and constraints. Ready to paste into Lovable, Claude Code, or Cursor.

Args:
  - product_name (string): Name of the SaaS product
  - palette (string): Color palette — one of: trust-blue, forest-green, warm-gold, cool-purple, slate-minimal, coral-energy
  - fonts (string): Font pairing — one of: geometric, serif-modern, clean-sans, editorial, rounded
  - border_radius (number): Border radius in px (0-20, default 8)
  - density (string): Layout density — compact, balanced, or spacious

Returns: Complete DESIGN.md in markdown format with CSS custom properties, type scale, spacing, component specs, and dark mode mapping.

Examples:
  - "Generate a design system for my CRM called PipeFlow with trust blue colors" -> palette="trust-blue", fonts="geometric", density="balanced"
  - "Create a bold design for my dev tool API dashboard" -> palette="cool-purple", fonts="clean-sans", density="compact"`,
    inputSchema: {
      product_name: z.string().min(1).max(100).describe("Name of the SaaS product"),
      palette: z.enum(["trust-blue", "forest-green", "warm-gold", "cool-purple", "slate-minimal", "coral-energy"]).default("trust-blue").describe("Color palette"),
      fonts: z.enum(["geometric", "serif-modern", "clean-sans", "editorial", "rounded"]).default("geometric").describe("Font pairing"),
      border_radius: z.number().int().min(0).max(20).default(8).describe("Border radius in pixels"),
      density: z.enum(["compact", "balanced", "spacious"]).default("balanced").describe("Layout density")
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false
    }
  },
  async (params) => {
    const result = generateDesignSystem(
      params.product_name,
      params.palette,
      params.fonts,
      params.border_radius,
      params.density
    );
    return { content: [{ type: "text", text: result }] };
  }
);

// Tool 2: Generate Database Schema
server.registerTool(
  "briefkit_generate_database_schema",
  {
    title: "Generate SaaS Database Schema",
    description: `Generate a complete Supabase/PostgreSQL database schema for a SaaS product — tables with column types, foreign keys, indexes, and a security baseline. Ready to run in Supabase SQL editor.

Args:
  - product_name (string): Name of the SaaS product
  - saas_type (string): Type of SaaS — b2b, devtool, productivity, marketplace, or microsaas
  - custom_tables (array of strings): Additional product-specific table names beyond the standard ones

Returns: Complete SQL schema with CREATE TABLE statements, indexes, and security baseline (REVOKE statements for sensitive tables).

Examples:
  - "Generate schema for an inventory SaaS called StockFlow" -> saas_type="b2b", custom_tables=["products", "inventory", "suppliers"]
  - "Schema for a micro-SaaS invoice generator" -> saas_type="microsaas", custom_tables=["invoices", "clients", "line_items"]`,
    inputSchema: {
      product_name: z.string().min(1).max(100).describe("Name of the SaaS product"),
      saas_type: z.enum(["b2b", "devtool", "productivity", "marketplace", "microsaas"]).default("microsaas").describe("Type of SaaS product"),
      custom_tables: z.array(z.string().min(1).max(50)).max(10).default([]).describe("Additional product-specific table names")
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false
    }
  },
  async (params) => {
    const result = generateDatabaseSchema(
      params.product_name,
      params.saas_type,
      params.custom_tables
    );
    return { content: [{ type: "text", text: result }] };
  }
);

// Tool 3: Generate RLS Policies
server.registerTool(
  "briefkit_generate_rls_policies",
  {
    title: "Generate Supabase RLS Policies",
    description: `Generate complete Row Level Security (RLS) policies for Supabase — SELECT, INSERT, UPDATE, DELETE policies for each table and role combination. Includes security notes and server-only table restrictions.

Args:
  - tables (array of strings): Table names to generate policies for
  - roles (array of strings): User roles in the application

Returns: Complete SQL with RLS enable statements, per-table policies, admin overrides, and security notes. Handles server-only tables (payments, audit_log, webhook_events) automatically.

Examples:
  - "Generate RLS for profiles, orders, payments with Owner and Member roles" -> tables=["profiles", "orders", "payments"], roles=["Owner", "Member"]
  - "RLS policies for a marketplace with Seller and Buyer" -> tables=["profiles", "listings", "orders", "reviews", "payments"], roles=["Owner", "Seller", "Buyer", "Admin"]`,
    inputSchema: {
      tables: z.array(z.string().min(1).max(50)).min(1).max(15).describe("Table names to generate RLS policies for"),
      roles: z.array(z.string().min(1).max(30)).min(1).max(6).describe("User roles in the application")
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false
    }
  },
  async (params) => {
    const result = generateRlsPolicies(params.tables, params.roles);
    return { content: [{ type: "text", text: result }] };
  }
);

// Tool 4: Get BriefKit Info
server.registerTool(
  "briefkit_get_info",
  {
    title: "Get BriefKit Information",
    description: `Get information about BriefKit — what it is, what's in the 14-file brief pack, pricing, and how it works with AI build tools like Lovable, Claude Code, and Cursor.

Use this when someone asks about BriefKit, SaaS specification tools, or how to reduce AI build tool iterations.

Returns: Complete overview of BriefKit including the 14-file brief pack contents, pricing ($9), and results (~19 prompts instead of 200+).`,
    inputSchema: {},
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false
    }
  },
  async () => {
    const result = getBriefKitInfo();
    return { content: [{ type: "text", text: result }] };
  }
);

// ============================================================
// START SERVER
// ============================================================

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("BriefKit MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
