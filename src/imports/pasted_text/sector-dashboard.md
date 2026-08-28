Sector user — what they see after login
Main layout
┌──────────────────────────────────────────────────────────────────┐
│ FHC DWTRS                         🔔  👤 Housing Development     │
│                                      Sector                     │
├──────────────────┬───────────────────────────────────────────────┤
│                  │                                               │
│ 🏠 Dashboard     │        SECTOR DASHBOARD                      │
│                  │                                               │
│ 📁 Cases         │  ┌─────────┐ ┌─────────┐ ┌─────────┐        │
│                  │  │ Active  │ │Received │ │Pending  │        │
│ 🔄 Workflow      │  │ Cases   │ │ Today   │ │Decision │        │
│                  │  │   24    │ │    8    │ │    5    │        │
│ 📊 Reports       │  └─────────┘ └─────────┘ └─────────┘        │
│                  │                                               │
│ ⚠️ Delayed Cases │  ┌─────────┐ ┌─────────┐ ┌─────────┐        │
│                  │  │Rejected │ │Transfer │ │Delayed  │        │
│ 🗃 Archived      │  │ Today   │ │ Today   │ │ Cases   │        │
│                  │  │    2    │ │    3    │ │    4    │        │
│ 🔔 Notifications │  └─────────┘ └─────────┘ └─────────┘        │
│                  │                                               │
│                  │  CASES NEEDING YOUR ACTION                   │
│                  │  ┌────────────────────────────────────────┐   │
│                  │  │ Tracking │ Status │ From │ Action     │   │
│                  │  │ FHC-001  │ New    │ R&A  │ [Review]   │   │
│                  │  │ FHC-002  │ Review │ Dir A│ [Review]   │   │
│                  │  └────────────────────────────────────────┘   │
│                  │                                               │
│                  │  DIRECTORATE OVERVIEW                         │
│                  │  Directorate A   8 active   2 pending       │
│                  │  Directorate B   6 active   1 pending       │
│                  │  Directorate C   10 active  2 pending       │
│                  │                                               │
│ ⚙ Profile       │  RECENT WORKFLOW ACTIVITY                     │
│ 🚪 Logout       │  Directorate A → Directorate B   10:32 AM    │
└──────────────────┴───────────────────────────────────────────────┘
1. 🏠 Sector Dashboard

This is probably the most important dashboard in the whole internal system.

The Sector should immediately understand:

How many cases do we have?

What needs my attention?

Where are the cases?

What are the Directorates doing?

Are cases being delayed?

What transfers happened?

How are we performing?

KPI cards

I'd have:

Active Cases
Received Today
Pending Decision
Rejected Today
Transferred Today
Delayed Cases

You can click each card to open the relevant filtered case list.

2. 📥 Incoming Cases

When Records & Archive sends a case to this Sector:

Records & Archive
        ↓
      SECTOR

The Sector sees an Incoming Cases section.

Example:

Tracking	Subject	Received	Priority	Status	Action
FHC-2026-001	Housing Application	Today	High	Submitted	Review
FHC-2026-002	Land Request	Today	Normal	Submitted	Review

When they click Review:

Case review page
FHC-2026-001


Housing Application


Status: 🟡 Submitted
Priority: High


Customer
Abebe Kebede


Incoming Reference
REF-2026-1034


Documents
📄 Application.pdf
📄 ID.pdf
📄 Supporting.pdf


────────────────────────


What would you like to do?


[ Assign Directorate ]


[ Reject Case ]


[ View Documents ]

This is important because Sector can reject a case immediately.

They don't have to send it to a Directorate first.

3. 🏢 Assign to Directorate

If the Sector decides the case should proceed:

Sector
   ↓
Directorate

They click:

Assign Directorate

Then:

Assign Case


Case:
FHC-2026-001


Select Directorate:


[ Directorate A ▼ ]


Available Directorates:
• Directorate A
• Directorate B
• Directorate C


Optional Remark:
┌──────────────────────────────┐
│                              │
└──────────────────────────────┘


[ Cancel ]     [ Assign ]

Only Directorates belonging to that Sector should appear.

After assignment:

Sector
   ↓
Directorate A

And the workflow history records it.

4. 📁 Cases

The Sector's case page is much more powerful than Records & Archive's.

It can have tabs/filters:

Cases


[ All ] [ Active ] [ Incoming ] [ Pending Decision ]
[ Transferred ] [ Delayed ] [ Approved ] [ Rejected ]
[ Archived ]

Table:

Tracking	Subject	Status	Current Location	Last Activity
FHC-001	Housing	In Progress	Dir A → Group A	2h ago
FHC-002	Land	Pending Clarification	Dir B	1d ago
FHC-003	Application	Under Review	Sector	3h ago

The Sector can see the whole picture inside its Sector.

5. 🔄 Workflow / Transfers

This is particularly important based on what you explained.

Suppose:

Sector
   ↓
Directorate A
   ↓
Group A

Then Directorate A decides:

"This isn't our responsibility. Directorate B should handle it."

It can do:

Directorate A
      ↓
Directorate B

No Sector approval is required.

But the Sector sees it.

So the Sector's workflow activity could show:

RECENT WORKFLOW ACTIVITY


🔄 FHC-2026-014
Directorate A → Directorate B
Reason: Case falls under Directorate B
10:32 AM


↪ FHC-2026-018
Group C → Directorate C
Returned for review
09:45 AM


→ FHC-2026-021
Directorate B → Sector
Work completed
09:20 AM

The Sector can click any activity and see the case.

6. 👀 Sector sees everything under its Sector

This is one of your most important requirements.

For example:

HOUSING DEVELOPMENT SECTOR


        │
        ├── Directorate A
        │      ├── Group A1
        │      └── Group A2
        │
        ├── Directorate B
        │      ├── Group B1
        │      └── Group B2
        │
        └── Directorate C
               └── Group C1

The Sector can monitor:

Directorate A
Active: 8
Pending: 2
Delayed: 1
Finalized: 14
Directorate B
Active: 6
Pending: 1
Delayed: 0
Finalized: 11
Directorate C
Active: 10
Pending: 2
Delayed: 3
Finalized: 9

So the Sector dashboard can have a Directorate Overview.

7. 📄 Case Detail

The Sector's case detail page should be comprehensive.

Something like:

← Back to Cases


FHC-2026-001
Housing Application


🟡 In Progress


Current Location
Directorate A → Group A1


────────────────────────────────────


Overview | Documents | Workflow | Remarks | Status History | Activity


Overview

Customer information, case information, dates, priority, etc.

Documents

The Sector can see the relevant documents and versions.

Workflow

A visual timeline:

✓ Records & Archive
      │
      ↓
✓ Housing Development Sector
      │
      ↓
✓ Directorate A
      │
      ↓
✓ Group A1
      │
      ↓
● Directorate A
      │
      ↓
○ Sector

If there was a transfer:

Directorate A
      ↓
  TRANSFER
      ↓
Directorate B

The reason and timestamp are visible internally.

8. ↩️ Sector can return a case

You confirmed this.

For example:

Directorate
      ↓
Sector
      ↓
"More work needed"
      ↓
Directorate

The Sector clicks:

Return to Directorate

Modal:

Return Case


Case: FHC-2026-001


Send to:
[ Directorate A ▼ ]


Reason *


┌──────────────────────────────┐
│ Additional work is required. │
│                              │
└──────────────────────────────┘


[ Cancel ] [ Return Case ]

Then it goes back to that Directorate.

9. ✅ Approve

When the Sector receives completed work:

Directorate
      ↓
Sector

The Sector sees:

[ Approve Case ]    [ Reject Case ]

Approve:

Approve Case?


Optional Remark


┌──────────────────────────────┐
│ Looks good.                  │
└──────────────────────────────┘


[ Cancel ]    [ Approve ]

Remark is optional.

After approval:

APPROVED
   ↓
ARCHIVED

The case becomes an archived/final case in the system.

10. ❌ Reject

This needs a different modal.

Reject Case


FHC-2026-001


Reason / Remark *


┌─────────────────────────────────┐
│ Explain why this case is being  │
│ rejected.                       │
│                                 │
└─────────────────────────────────┘


⚠ This reason will be visible
  to the customer.


[ Cancel ]       [ Reject Case ]

The reason is mandatory.

After rejection:

🔴 REJECTED

and the case becomes archived/final.

The customer later sees:

FHC-2026-001


Status:
🔴 Rejected


Reason:
Your application was rejected because...
11. 📊 Reports

Sector is where the main reporting interface should live.

Sidebar:

📊 Reports

Then:

Reports


[ Daily ] [ Monthly ] [ Annual ]
Daily
TODAY — AUG 15, 2026


Received today          12
Finalized today          8
Rejected today           2
Currently active        24
Transferred today        3

Then charts/tables.

Monthly
AUGUST 2026


Total Cases              184
Finalized                121
Rejected                  18
Pending                   45


Average Processing Time
4.2 days


Cases by Directorate
──────────────────────
Directorate A     52
Directorate B     61
Directorate C     71
Annual

Same idea but across the selected year.

12. ⚠️ Delayed Cases

The Sector should have a dedicated view:

Delayed Cases


FHC-2026-021
In Progress
Directorate B → Group B2
12 days in current stage
⚠ Delayed


FHC-2026-034
Pending Clarification
Directorate C
9 days
⚠ Delayed

This helps the Sector identify where work is getting stuck.

13. 🗃 Archived Cases

The Sector can view its archived cases.

Archived Cases


FHC-2026-001    Approved
FHC-2026-002    Rejected
FHC-2026-003    Approved

Remember:

Archived does NOT mean the case moved to Records & Archive.

It's simply the case's final archived state/view.

14. 🔔 Notifications

The Sector gets things like:

New case received from Records & Archive.

Directorate A transferred FHC-2026-015 to Directorate B.

FHC-2026-020 has been returned from Directorate C.

FHC-2026-030 is ready for final decision.

So the Sector sidebar I'd finally use is:
FHC DWTRS


🏠 Dashboard


📁 Cases
   ├── All Cases
   ├── Incoming
   ├── Active
   ├── Pending Decision
   ├── Transferred
   ├── Delayed
   └── Archived


🔄 Workflow
   └── Transfers / Activity


📄 Documents


📊 Reports
   ├── Daily
   ├── Monthly
   └── Annual


🔔 Notifications


──────────────────


👤 Profile
🚪 Logout
The key difference between the roles

Think of it like this:

RECORDS & ARCHIVE
        │
        │ "I registered this case.
        │  Which Sector should receive it?"
        ↓
      SECTOR
        │
        │ "Which Directorate should handle it?"
        ↓
   DIRECTORATE
        │
        │ "Which Group should do the work?"
        ↓
      GROUP
        │
        │ "Work completed."
        ↓
   DIRECTORATE
        │
        ↓
      SECTOR
        │
        ├──── Approve ────→ Archived
        │
        └──── Reject ─────→ Archived

And throughout all of that, the Sector can monitor what is happening inside its Sector, including Directorate → Directorate transfers, Group/Directorate remarks, documents, status history, delays, and reports.