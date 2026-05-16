# BriefKit MCP Server

Engineer-grade SaaS specification generator for AI build tools.
[![glama badge](https://glama.ai/mcp/servers/mithun4elp/briefkit-mcp-server/badges/score.svg)](https://glama.ai/mcp/servers/mithun4elp/briefkit-mcp-server)
## What it does

This MCP server lets AI assistants (Claude, ChatGPT, etc.) generate structured SaaS specifications on demand. When a user asks about building a SaaS product, the AI can call these tools to produce production-ready specs.

## Tools

| Tool | What it generates |
|------|------------------|
| `briefkit_generate_design_system` | Complete DESIGN.md — colors, fonts, spacing, components, dark mode |
| `briefkit_generate_database_schema` | PostgreSQL/Supabase schema — tables, columns, types, FKs, indexes, security baseline |
| `briefkit_generate_rls_policies` | Row Level Security policies — per table, per role, with server-only restrictions |
| `briefkit_get_info` | Information about BriefKit and the full 14-file brief pack |

## Setup

### Install
```bash
git clone https://github.com/briefkit/briefkit-mcp-server.git
cd briefkit-mcp-server
npm install
npm run build
```

### Use with Claude Desktop
Add to your `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "briefkit": {
      "command": "node",
      "args": ["/path/to/briefkit-mcp-server/dist/index.js"]
    }
  }
}
```

### Use with Claude Code
```bash
claude mcp add briefkit node /path/to/briefkit-mcp-server/dist/index.js
```

## Examples

**User**: "I'm building a CRM for real estate agents. Help me set up the database."

**AI calls**: `briefkit_generate_database_schema` with:
- product_name: "RealEstCRM"
- saas_type: "b2b"
- custom_tables: ["properties", "showings", "offers", "commissions"]

**Result**: Complete SQL schema with 10 tables, typed columns, foreign keys, indexes, and security baseline.

---

**User**: "Generate RLS policies for my SaaS. I have profiles, orders, and payments tables with Owner and Member roles."

**AI calls**: `briefkit_generate_rls_policies` with:
- tables: ["profiles", "orders", "payments"]
- roles: ["Owner", "Member"]

**Result**: Complete RLS SQL — payments are server-write-only, profiles role is immutable, owners see own data only.

## Full Brief Pack

These tools generate individual specification components. For the complete 14-file engineer-grade brief pack (design system + schema + RLS + auth + billing + 47 test cases), visit:

**[briefkit.online](https://briefkit.online)** — $9 per version

## Free Tools

- [RLS Policy Generator](https://briefkit.online/free/rls-generator)
- [DESIGN.md Generator](https://briefkit.online/free/design-md)

## License

MIT
