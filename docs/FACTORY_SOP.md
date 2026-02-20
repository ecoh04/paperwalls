# PaperWalls Factory – Standard Operating Procedure (SOP)

How to produce and fulfill orders using the factory dashboard.

---

## 1. Access

- **URL:** `https://paperwalls.vercel.app/admin` (or your live domain + `/admin`).
- **Login:** Sign in with your **email** and **password** (your account is created by the site owner). You stay signed in until you click **Log out**.
- **Your view:** If you’re assigned to a factory (JHB, CPT, or KZN), you only see orders for your factory plus **Unassigned** orders. Admins see all orders and can assign orders to a factory.

---

## 2. Daily workflow

### 2.1 View orders

1. Go to **Orders** (or open `/admin/orders`).
2. **Factory filter** (admins only): **All**, **Unassigned**, **Johannesburg**, **Cape Town**, **KwaZulu-Natal**.
3. **Status filter:** **All**, **New**, **In production**, **Shipped**, **Delivered**, **Awaiting payment**.
4. **Date range:** Use **From** and **To** and click **Apply** to filter by order date.
5. The table shows: Order number, Customer, Factory (admins), Status, Total, **Created**, **Updated**, **Shipped**, and **Open**.
6. **New** = paid and ready to produce. Start here each day.

### 2.2 Open an order

1. Click **Open →** on the order row.
2. You’ll see:
   - **Print specs** (highlighted box): wall size(s), finish, application, and **Print files**.
   - **Customer & delivery**: name, email, phone, full address.
   - **Order totals & dates**: subtotal, shipping, total; **Created**, **Updated**, **Shipped**, **Delivered** (when set).
   - **Activity log**: who changed status, who assigned the factory, and any notes. You can **Add a note** at the bottom.
3. **Admins:** You can change **Factory** (dropdown) to assign or reassign the order.

### 2.3 Produce the order

1. **Download print file(s)**  
   In the **Print specs** section, click **Download print file** (or **Wall 1**, **Wall 2**, etc. when there are multiple walls).  
   Use these exact files for printing; one file per wall when the order has multiple walls with different designs.

2. **Check specs**  
   - **Wall(s):** Dimensions in metres (e.g. 2.50 m × 3.00 m).  
   - **Finish:** Matte, Satin, Textured linen, or Premium fabric.  
   - **Application:** DIY, DIY kit, or Pro installer.

3. **Update status**  
   Use the **Status** dropdown at the top right:  
   - **New** → **In production** when you start printing.  
   - **In production** → **Shipped** when the order is dispatched (this sets **Shipped** date).  
   - **Shipped** → **Delivered** when the customer has received it (sets **Delivered** date; optional).

4. **Add a note** (optional)  
   In **Activity log**, type a note (e.g. “Waiting for stock”, “Shipped via X”) and click **Add note**. It appears in the timeline with your name and time.

### 2.4 Ship the order

1. Pack the printed wallpaper according to your shipping process.
2. Send to the **Customer & delivery** address shown on the order.
3. In the dashboard, set status to **Shipped** (and add a note if useful).

---

## 3. Status meanings

| Status | Meaning |
|--------|--------|
| **Awaiting payment** | Customer has not paid yet. Do not produce. |
| **New** | Paid; ready to produce. |
| **In production** | Currently being printed/fulfilled. |
| **Shipped** | Dispatched to customer. **Shipped** date is set. |
| **Delivered** | Customer has received. **Delivered** date is set (optional). |

---

## 4. Tips

- **Print files:** Always use the file(s) from the dashboard link. Do not use screenshots or emails.
- **Multiple walls:** If there are several “Wall 1”, “Wall 2” links, print each file for the correct wall size.
- **Activity log:** Use notes for delays, carrier, or anything the next person should know.
- **Contact:** Use the customer email or phone on the order if you need to clarify address or delivery.

---

## 5. Troubleshooting

- **Can’t log in:** Use the email and password for your factory account. If you don’t have an account or forgot your password, contact the site owner (they manage users in Supabase).
- **Order not loading:** Refresh the page. If it still fails, check your internet and try again.
- **Print file won’t open:** Copy the link and open it in a new tab, or try another browser.
- **Don’t see some orders:** If you’re not an admin, you only see orders for your factory and unassigned orders. If you think an order should be yours, ask an admin to assign it to your factory.

For technical or access issues, contact the site owner.
