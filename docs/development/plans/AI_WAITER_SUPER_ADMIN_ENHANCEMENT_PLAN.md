# AI Waiter Personality & Knowledge – Super-Admin Enhancement Plan

## 1. Objectives

1. Allow Super-Admin users to:
   • Create, edit, and delete **personality templates** (e.g. "Friendly", "Professional", …) with unlimited, custom attributes.
   • Curate **knowledge snippets** (restaurant-agnostic or industry common facts) that can be reused by any restaurant.
   • Push a default personality/knowledge set to a new restaurant on provisioning.
2. Let Restaurant Admins continue to fine-tune or override the defaults in their own *Waiter Settings* page.
3. Ensure the chat system (action detection, recommendation engine, prompt builder, etc.) automatically picks up any new personality/knowledge definitions without further code changes.
4. Preserve backwards compatibility for existing restaurants already using the enum-based approach.

---

## 2. Data-Model Changes (Prisma)

| Entity | New / Updated | Fields |
| ------ | ------------- | ------ |
| `WaiterPersonalityTemplate` | NEW | `id` (uuid), `name` (string, unique), `description` (text), `tone` (enum: FORMAL/BALANCED/CASUAL), `responseStyle` (enum: HELPFUL/CONCISE/DETAILED/PLAYFUL), `defaultWelcomeMessage` (text), `createdAt`, `updatedAt` |
| `KnowledgeSnippet` | NEW | `id`, `title`, `content` (markdown or plain text), `category`, `createdBy` (SuperAdmin ref), timestamps |
| `Restaurant` | **UPDATED** | replace `waiterPersonality` (enum) → `waiterPersonalityId` (FK → `WaiterPersonalityTemplate`) — keep old column for migration phase then drop |

> Migration Steps
> 1. `prisma migrate dev --name add_waiter_personality_template`
> 2. Back-fill: create templates for the four existing personalities and update each restaurant row to point to the correct template id.
> 3. Remove the legacy enum column after successful cut-over.

---

## 3. API Layer (tRPC)

### 3.1 Super-Admin Router (`src/server/api/routers/superAdmin.ts`)

Add:
```ts
getPersonalityTemplates()
createPersonalityTemplate(input)
updatePersonalityTemplate(id, input)
deletePersonalityTemplate(id)

getKnowledgeSnippets()
createKnowledgeSnippet(input)
updateKnowledgeSnippet(id, input)
deleteKnowledgeSnippet(id)
```
All procedures protected by `superAdminProcedure` middleware.

### 3.2 Restaurant Router Adjustments

• Replace enum validation with dynamic lookup:
```ts
.waiterPersonalityId: z.string().uuid().optional()
```
• Ensure `getWaiterSettings` joins the template to return full details (name, tone, responseStyle, defaultWelcomeMessage).

---

## 4. Frontend Updates

### 4.1 Super-Admin UI

*Location*: `pages/super-admin/waiter-templates.tsx`

1. Table list of existing templates with inline edit / delete.
2. "➕ New Template" modal with form inputs:
   • Name, Tone (select), Response Style (select), Description, Default Welcome Message.
3. Knowledge Library (`pages/super-admin/knowledge.tsx`): markdown editor & category filtering.

### 4.2 Restaurant Admin – Waiter Settings Page

1. Replace hard-coded `<select>` options with data fetched from `/superAdmin.getPersonalityTemplates` (public cacheable endpoint).
2. Show template summary (description) on selection.
3. Allow overriding of welcomeMessage & specialtyKnowledge **without** mutating the template.

---

## 5. Chat / AI Integration

1. Update `aiPromptTemplates.ts` and `aiContextBuilder.ts` to accept a `personality` object rather than enum strings.
2. Builder picks:
   • `personality.name` for flavour → "Friendly"
   • `tone` and `responseStyle` to shape system prompt.
   • `knowledgeSnippets` (global + restaurant-specific) appended to the context.
3. Ensure any downstream utilities (`aiActionDetection`, `recommendationEngine`, etc.) reference the new structure.
4. Create type: `export interface PersonalityConfig { id: string; name: string; tone: string; responseStyle: string; welcomeMessage: string; description?: string; }` in `types/aiActions.ts`.

---

## 6. Permissions & Security

• Only Super-Admin JWT/session may hit template + knowledge CRUD endpoints.
• Restaurant admins read templates but cannot modify.
• Row-level security not required (templates are global).

---

## 7. Testing Strategy

1. **Unit Tests**
   • tRPC procedure validation & authorization.
   • Prompt builder receives new personality object and outputs expected system prompt.
2. **Integration Tests** (existing `__tests__/integration` folder)
   • Super-Admin can create template → Restaurant admin sees it in dropdown.
   • Chat flow with new template affects greeting and OpenAI call payload.
3. **e2e Cypress** (if/when exists) – flow from Super-Admin to customer chat.

---

## 8. Roll-out Plan

| Phase | Description |
| ----- | ----------- |
| 1. Schema + Back-fill | Introduce new tables, migrate data, dual-write to old enum column. |
| 2. API Dual-Support | Routers accept either enum or templateId (feature flag). |
| 3. Frontend Switch | Release Super-Admin UI & update Restaurant page to use templates. |
| 4. Remove Legacy | Drop enum column & old zod enums after 2 weeks of monitoring. |

---

## 9. Monitoring & Analytics

• Log Super-Admin template and knowledge edits (who/when).
• Add metric `personality_used` to AI analytics dashboard (count messages per template).

---

## 10. Timeline & Effort Estimate

| Task | Est. hrs |
| ---- | -------- |
| Prisma schema & migration | 3 |
| tRPC endpoints | 2 |
| Super-Admin UI (templates) | 4 |
| Knowledge Library UI | 4 |
| Restaurant page refactor | 2 |
| Chat integration + prompt changes | 3 |
| Testing | 4 |
| Docs & deployment | 1 |
| **Total** | **23 hrs (~3 days)** |

---

## 11. Risks & Mitigations

| Risk | Mitigation |
| ---- | ---------- |
| Enum → FK migration corrupts data | Keep dual-write & backup prior to drop |
| Prompt regressions | Extensive integration tests with canned OpenAI mocks |
| UI confusion between global template vs. per-restaurant overrides | Clear labels & tooltips; allow preview before save |

---

## 12. Done-Definition Checklist

- [x] Schema and migrations applied on dev, staging, production.
- [x] Super-Admin can manage personality templates and knowledge snippets.
- [x] Restaurant admin selects personality from dynamic list.
- [x] Chat system uses new personality object for system prompts.
- [ ] All existing restaurants migrated & legacy enums removed.
- [ ] Unit, integration, and e2e tests passing.
- [ ] Documentation updated (`README`, `AI_WAITER_CONFIRMATION_AGENT_PLAN.md`).

## 13. Current Implementation Status

### ✅ **COMPLETED:**
1. **Database Models**: WaiterPersonalityTemplate, KnowledgeSnippet models created
2. **Super-Admin Backend**: All tRPC endpoints implemented
3. **Super-Admin UI**: 
   - Personality Templates page (`/super-admin/waiter-templates/`)
   - Knowledge Library page (`/super-admin/knowledge/`)
   - Navigation updated
4. **Restaurant Router**: Template integration endpoints added
5. **AI System Integration**: Types and prompt templates updated

### 🔄 **REMAINING TASKS:**
1. **Restaurant Admin Frontend**: Update waiter settings page to use templates
2. **Legacy Migration**: Migrate existing restaurants from enum to templates
3. **Testing**: Implement unit, integration, and e2e tests
4. **Documentation**: Update README and related docs

### 📋 **Next Steps:**
1. Test Knowledge Library UI functionality
2. Update restaurant admin waiter settings to use templates
3. Create migration script for existing restaurants
4. Implement testing suite 