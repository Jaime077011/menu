# 🤖 AI WAITER ENHANCEMENT v2 – TOOL‑DRIVEN FLOW

> **Mission:** Create a trustworthy, up‑selling virtual waiter by separating **conversation** from **execution**.  The LLM only *proposes* actions; the user/UI confirms before anything touches the database.

---

## ⚙️ TOOL SCHEMA (Foundation – implement first)

| Tool           | Args                           | Purpose                           |
| -------------- | ------------------------------ | --------------------------------- |
| `AddItem`      | `itemId:number, qty:number`    | Add item(s) to the current order  |
| `RemoveItem`   | `itemId:number`                | Delete an item from order         |
| `UpdateQty`    | `itemId:number, newQty:number` | Change quantity                   |
| `ConfirmOrder` | `—`                            | Lock order and start kitchen flow |
| `CancelOrder`  | `orderId:number`               | Void an order before prep         |

> **LLM rule:** *Never call the DB.  Output only `proposedActions:[…]` JSON objects that match the schema above.*

---

## 📅 PHASE PLAN (Cursor‑friendly)

### **PHASE 1 – Tool Infrastructure**

| #   | Task                            | Micro‑steps                                                                                                                                                                 |
| --- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.1 | `/utils/tools.ts` – enums & Zod | • Define `Tool` union <br>• Define `ProposedAction` interface <br>• Create `proposedActionSchema` with Zod <br>• Export helpers `isAddItem()`, `isUpdateQty()`              |
| 1.2 | `chatRouter` hook               | • Parse `openai` response JSON <br>• Validate via `proposedActionSchema` <br>• Strip invalid entries, log error <br>• Return `{assistantMsg, proposedActions}` to front‑end |
| 1.3 | `ProposedActionButtons.tsx`     | • Props: `actions`, callback `onConfirm(action)` <br>• Render each with ✅ / ❌ buttons <br>• Style with Tailwind <br>• Emit confirmation result                              |
| 1.4 | Execute layer                   | • In chat component, on confirm → switch(action.tool) { call correct tRPC endpoint } <br>• Update `useOrderState` with response <br>• Re‑render order summary               |

### **PHASE 2 – Order Modification API**

| #   | Task                          | Micro‑steps                                                                                                                                                         |
| --- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2.1 | `orderRouter.updateItem`      | • Accept `{orderId, itemId, action, newQty?}` <br>• Guard: order must be PENDING <br>• Perform add/remove/update <br>• Recalculate total <br>• Return updated order |
| 2.2 | `orderRouter.getCurrentOrder` | • Input `tableNumber` <br>• Query latest order with status PENDING <br>• Include items & totals                                                                     |
| 2.3 | Unit tests                    | • Test happy paths for add/remove/update <br>• Test guard rejects PREPARING order                                                                                   |

### **PHASE 3 – Suggestion Engine**

| #   | Task                       | Micro‑steps                                                                                        |
| --- | -------------------------- | -------------------------------------------------------------------------------------------------- |
| 3.1 | `getSuggestedItems()` util | • Inputs: `restaurantId, hour, dietPrefs` <br>• Query top sellers <br>• Fallback: chefSpecial flag |
| 3.2 | Prompt injection           | • Append to system prompt: `"suggestedItems": [...]` <br>• Limit to 3 items to keep tokens low     |
| 3.3 | Dialogue tests             | • “Want a drink?” <br>• “Try our chef’s special!”                                                  |

### **PHASE 4 – Mood → Rive Sync**

| #   | Task                         | Micro‑steps                                                                                      |
| --- | ---------------------------- | ------------------------------------------------------------------------------------------------ |
| 4.1 | `moodDetector.ts`            | • Call OpenAI with `text-moderation`‑style sentiment <br>• Map to mood: happy, excited, confused |
| 4.2 | Extend `chatRouter`          | • Return `mood` alongside message                                                                |
| 4.3 | Update `RiveWaiterCharacter` | • Prop `mood` → animation switch <br>• Fallback to idle                                          |

### **PHASE 5 – Ambiguity & Clarification**

| #   | Task           | Micro‑steps                                                                              |
| --- | -------------- | ---------------------------------------------------------------------------------------- |
| 5.1 | Prompt rule    | • Add to system prompt: “If unsure, ask follow‑up instead of guessing.”                  |
| 5.2 | Keyword scan   | • Regex for “something”, “spicy”, “maybe” <br>• If triggered → `needsClarification` flag |
| 5.3 | Fallback tests | • “Something vegetarian” → AI asks which dish                                            |

### **PHASE 6 – Live Order Summary**

| #   | Task                    | Micro‑steps                                                             |
| --- | ----------------------- | ----------------------------------------------------------------------- |
| 6.1 | `OrderSummaryFloat.tsx` | • Show items, qty, price <br>• Sticky bottom on mobile, side on desktop |
| 6.2 | Sync `useOrderState`    | • Update after every confirmed action <br>• Show visual diff animation  |

---

## 🧪 REGRESSION SCENARIOS (run after each phase)

1. Add 2 salads → confirm → list shows 2.
2. Remove 1 salad → confirm → list shows 1.
3. AI upsells garlic bread → reject → no change.
4. “Something spicy” → AI asks which dish.

