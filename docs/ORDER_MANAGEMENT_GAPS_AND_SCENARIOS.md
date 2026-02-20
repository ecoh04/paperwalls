# Order management: gaps, integration checklist, first 3 months

What we have, what’s missing vs top systems, and every scenario you’ll hit in the first 3 months so the factory stays on track.

---

## Part 1: What top factory / order systems have that we don’t

Systems like **Shopify**, **ShipBob**, **Cin7**, **Fishbowl**, **Extensiv** typically include:

| Capability | We have it? | Notes |
|------------|-------------|--------|
| **Edit order (address, customer, phone)** | ❌ No | Wrong address / typo = no way to fix in app. |
| **Edit order (dimensions, finish, application)** | ❌ No | Wrong spec from customer = can’t correct. |
| **Cancel order** | ❌ No | No “cancelled” status or cancel flow. |
| **Delete / archive order** | ❌ No | No DELETE in app; no soft-delete. |
| **Refund / payment status** | ❌ No | Payment handled in Stitch; we don’t mark “refunded” or “payment failed”. |
| **Replace / re-upload print file** | ❌ No | Wrong file uploaded at checkout = no in-app fix. |
| **Status change from list** | ❌ No | Must open each order to change status. |
| **Search (order #, customer)** | ❌ No | Only filters (factory, status, date). |
| **Sort columns** | ❌ No | Fixed sort (newest first). |
| **Bulk actions** | ❌ No | No multi-select → status/assign. |
| **Product/spec summary on list** | ❌ No | Can’t see “1 wall · Matte” without opening. |
| **Last activity on list** | ❌ No | Activity only on detail page. |
| **Print order / pick list** | ❌ No | No one-click print for production. |
| **Export (CSV)** | ❌ No | No export for reporting. |
| **Internal notes** | ✅ Yes | Notes in activity log. |
| **Activity log (who, when, what)** | ✅ Yes | Status, assign, notes. |
| **Factory assignment + filter** | ✅ Yes | JHB/CPT/KZN + unassigned. |
| **Key dates (created, updated, shipped, delivered)** | ✅ Yes | Stored and shown. |

So we’re missing: **edit order**, **cancel**, **delete/archive**, **refund/payment flag**, **replace print file**, plus the list UX (status from list, search, sort, bulk, summary, last activity, print, export).

---

## Part 2: Integration checklist – “can we fix it in the app?”

For each “something went wrong” question: can the factory or admin fix it **inside** the admin today?

| Scenario | Can do it today? | How / gap |
|----------|-------------------|-----------|
| **Wrong shipping address** | ❌ No | Address is read-only. Need “Edit order” (at least address + customer + phone). |
| **Customer name/email/phone typo** | ❌ No | Same; need edit order. |
| **Wrong dimensions (customer mistake)** | ❌ No | Dimensions/specs read-only. Need edit order (and possibly re-quote; see below). |
| **Wrong finish or application** | ❌ No | Read-only. Need edit order. |
| **Wrong print file (wrong image uploaded)** | ❌ No | No “replace print file” or “re-upload”. Need upload + replace image_url(s). |
| **Order should be cancelled** | ❌ No | No cancel; can only add a note. Need “Cancel order” (status + maybe refund in Stitch manually). |
| **Duplicate order – need to remove one** | ❌ No | No delete/archive. Need “Delete” or “Archive” (prefer soft-delete so we keep history). |
| **Payment failed / refunded in Stitch** | ⚠️ Partial | We have status; we could add “Refunded” or “Payment failed” and filter them out. Today you’d use a note. |
| **Reassign to another factory** | ✅ Yes | Factory dropdown on order detail. |
| **Mark shipped / delivered** | ✅ Yes | Status dropdown; sets shipped_at / delivered_at. |
| **Record a delay or issue** | ✅ Yes | Add note in activity log. |
| **See who did what** | ✅ Yes | Activity log with user and time. |

So for “everything integrated” and “fix problems in the app”, we’re missing:

1. **Edit order** – address, customer (name, email, phone), and ideally specs (dimensions, finish, application). Money (subtotal/shipping/total) is trickier if you don’t want to recalc automatically.
2. **Cancel order** – status “cancelled” + note; optionally “reason” and “refund status”.
3. **Delete or archive order** – soft-delete (e.g. `deleted_at` or status “cancelled” + “hide from default list”) so you can still audit.
4. **Replace print file(s)** – upload new file(s), update `image_url` / `image_urls`, log in activity.
5. **Payment/refund flag** – optional status or tag (“Refunded” / “Payment failed”) so factory doesn’t produce and you can filter.

---

## Part 3: First 3 months – scenarios by phase

### Week 1 – Go live, first orders

| # | Scenario | What happens | Can we handle it today? | What we need |
|---|----------|--------------|--------------------------|--------------|
| 1 | First paid order; factory needs to produce | Order appears as “New”, assigned to a factory. | ✅ Yes | — |
| 2 | Customer emails “I put wrong address” | Factory/admin need to change address before shipping. | ❌ No | Edit order (address). |
| 3 | Customer says “wrong phone number” | Need to update so courier can call. | ❌ No | Edit order (customer details). |
| 4 | Two orders for same person; one was duplicate | Want to “remove” or hide the duplicate. | ❌ No | Cancel or archive/delete. |
| 5 | Order paid but customer asked to cancel before production | Need to stop production and optionally refund. | ❌ No | Cancel order + note; refund in Stitch manually. |
| 6 | Factory not sure which orders to do first | Need to see “New” only, maybe by factory. | ✅ Yes | Optional: “Ready to produce” view or sort. |
| 7 | Wrong image uploaded at checkout | Need correct file to print. | ❌ No | Replace print file. |

### Month 1 – Routine + first problems

| # | Scenario | What happens | Can we handle it today? | What we need |
|---|----------|--------------|--------------------------|--------------|
| 8 | Many “New” orders; want to mark 5 as “In production” at once | Open each order one by one. | ❌ No | Status change from list or bulk “Mark in production”. |
| 9 | “Which order was for 14 Church Street?” | Only way is filter by date and scroll. | ❌ No | Search by address or customer name. |
| 10 | Customer says “I meant 3.2 m not 2.3 m” | Spec is wrong; need to correct and possibly re-invoice. | ❌ No | Edit order (dimensions/specs); optional re-calc and “needs re-payment” flag. |
| 11 | Stitch refunded an order; factory must not produce | Only way is to add note “REFUNDED”. | ⚠️ Partial | “Refunded” status or tag + filter. |
| 12 | Need to print a sheet for production (order + address + specs) | Copy/paste or open and print browser. | ❌ No | “Print order” / “Print pick list”. |
| 13 | End of week: how many shipped? | Count by hand or filter status “Shipped”. | ⚠️ Partial | Export or simple “Shipped this week” count. |
| 14 | New factory staff; need to see only their factory | Filter by factory. | ✅ Yes | — |

### Month 2–3 – Scale and edge cases

| # | Scenario | What happens | Can we handle it today? | What we need |
|---|----------|--------------|--------------------------|--------------|
| 15 | 50+ orders; find “PW-20260315-…” | Scroll or narrow date. | ❌ No | Search by order number. |
| 16 | Batch of unassigned orders; assign all to CPT | Change one by one. | ❌ No | Bulk assign factory. |
| 17 | Order shipped but address was wrong; parcel returned | Need to fix address and re-ship. | ❌ No | Edit order (address) + maybe “Re-ship” note. |
| 18 | Customer disputes; we cancelled and refunded | Need to mark order cancelled and refunded so it doesn’t show as “to produce”. | ❌ No | Cancel + refund flag. |
| 19 | Audit: “Who changed this order to Shipped?” | Activity log has it. | ✅ Yes | — |
| 20 | Finance wants list of March orders with totals | No export. | ❌ No | Export CSV (or similar). |
| 21 | Print file link broken or wrong file in storage | No way to replace. | ❌ No | Replace print file. |
| 22 | Need to see “what’s overdue” (New for 5+ days) | No “age” or “days in status”. | ❌ No | Sort by created_at or “days in status” / overdue highlight. |

---

## Part 4: What “integrated” and “on top of everything” means

**Integrated** = when something is wrong, the factory or admin can fix it **in this app** without Supabase/Stitch/email workarounds.

Minimum for that:

- **Edit order** – Address, customer (name, email, phone). Optional: dimensions, finish, application (with clear “spec changed” in activity).
- **Cancel order** – Status “cancelled”, reason/note, optionally “Refunded” so it’s excluded from production views.
- **Replace print file** – Upload new file(s), update order, log in activity.
- **Delete or archive** – Soft-delete (e.g. “Archive” / “deleted_at”) so duplicates or test orders can be hidden, not lost.

**On top of everything** = factory always knows what to do and can do it quickly.

- **Status from list** (and optionally bulk status) so they don’t open every order.
- **Search** (order number, customer name) so they find the right order in seconds.
- **Sort** (date, status) and **product/spec summary** on the list so they can plan and prioritise.
- **Print order / pick list** so they have one place to print what production needs.
- **Clear “ready to produce”** (e.g. “New” = ready; “Awaiting payment” = don’t start).

---

## Part 5: Suggested priority (for implementation)

**Phase A – “Fix any order” (integration)**  
1. Edit order: address, customer name, email, phone.  
2. Cancel order: status “cancelled” + note; optional “Refunded” flag.  
3. Replace print file: upload new file(s), update order, log.  
4. Archive/delete: soft-delete (hide from default list, keep in DB for audit).

**Phase B – “Work fast from the list”**  
5. Status change from list (per row).  
6. Search (order number, customer name).  
7. Sort columns (created, updated, status, total).  
8. Product/spec summary on list (e.g. “1 wall · 2.5×3 m · Matte”).

**Phase C – “Batch and report”**  
9. Bulk actions: multi-select → set status or assign factory.  
10. Last activity on list (or “Updated by”).  
11. Print order / pick list.  
12. Export CSV.

**Phase D – “Money and exceptions”**  
13. Refunded / payment-failed flag (or status) + filter.  
14. Edit order: dimensions/specs (and optional “needs re-quote” note).  
15. Overdue / “days in status” (or “New &gt; 5 days”) so nothing gets stuck.

Doing **Phase A** first makes the system “fully integrated” for the main problems (wrong address, cancel, wrong file, duplicate). Then **Phase B** makes the factory’s day-to-day job easier so everyone stays clear on what needs to be done.
