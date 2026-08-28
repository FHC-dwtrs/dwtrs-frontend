Group Portal

When a Group user logs in, the system already knows:

Sector: Housing Development Sector
Directorate: Directorate A
Group: Group A1

They should only see cases assigned to their Group, plus cases/history they are authorized to view.

1. 🏠 Group Dashboard

I'd make it very simple:

┌──────────────────────────────────────────────────────────────┐
│ FHC DWTRS                         🔔  👤 Group A1            │
│                                      Directorate A           │
├──────────────────┬───────────────────────────────────────────┤
│                  │                                           │
│ 🏠 Dashboard     │             GROUP DASHBOARD               │
│                  │                                           │
│ 📁 My Cases      │  ┌─────────┐ ┌─────────┐ ┌─────────┐    │
│                  │  │ Active  │ │ New     │ │ Pending │    │
│ 📄 Documents     │  │ Cases   │ │ Cases   │ │ Cases   │    │
│                  │  │   8     │ │   3     │ │   2     │    │
│ 💬 Remarks       │  └─────────┘ └─────────┘ └─────────┘    │
│                  │                                           │
│ ⚠️ Delayed      │  ┌─────────┐ ┌─────────┐                 │
│                  │  │Returned │ │ Delayed │                 │
│ 🔔 Notifications│  │ Cases   │ │ Cases   │                 │
│                  │  │   2     │ │   1     │                 │
│                  │  └─────────┘ └─────────┘                 │
│                  │                                           │
│                  │  CASES NEEDING ACTION                     │
│                  │                                           │
│                  │  FHC-2026-001  New       [Open]          │
│                  │  FHC-2026-004  Returned  [Open]          │
│                  │  FHC-2026-008  In Progress [Continue]   │
│                  │                                           │
│ ⚙ Profile       │                                           │
│ 🚪 Logout       │                                           │
└──────────────────┴───────────────────────────────────────────┘

The dashboard basically answers:

"What work do I have to do?"

2. 📁 My Cases

This is the Group's main page.

Tabs:

Cases


[ All ]
[ New ]
[ In Progress ]
[ Pending Clarification ]
[ Returned ]
[ Ready for Directorate ]
[ Archived ]

Example:

Tracking	Subject	Status	Received	Action
FHC-001	Housing App	In Progress	Aug 15	Continue
FHC-002	Land Request	New	Aug 15	Open
FHC-003	Application	Returned	Aug 14	Review
FHC-004	Service Request	Pending Clarification	Aug 13	Open

The Group doesn't see every case in the Sector.

It sees the cases relevant to its Group.

3. 📥 New Case

When the Directorate assigns:

DIRECTORATE
      ↓
GROUP

the Group gets a notification:

New case assigned to Group A1

The case appears under New.

Example:

FHC-2026-001


Housing Application


Status:
🔵 Submitted


Assigned by:
Directorate A


Received:
Aug 15, 2026 — 10:32 AM


[ Open Case ]
4. 📄 Case Detail

This is where the Group spends most of its time.

I'd make the page something like:

← Back to My Cases


FHC-2026-001
Housing Application


Status: 🟡 In Progress


────────────────────────────────────────────


Customer Information
Name: Abebe Kebede
Phone: 09XXXXXXXX
Email: example@email.com


────────────────────────────────────────────


Case Information
Incoming Reference: REF-2026-1034
Submitted: Aug 15, 2026
Sector: Housing Development
Directorate: Directorate A
Group: Group A1


────────────────────────────────────────────


DOCUMENTS


📄 Application.pdf             [View]
📄 ID.pdf                      [View]
📄 Supporting_Document.pdf     [View]


────────────────────────────────────────────


REMARKS


Directorate A:
"Please review the supporting documents."


────────────────────────────────────────────


WORK ACTION


[ Start Work ]
[ Add Remark ]
[ Request Clarification ]
[ Send Back to Directorate ]
5. 🔍 Documents

The Group needs to see the documents because they are doing the actual work.

They can:

View documents
Download/view according to permissions
View attachments
View document versions
Add permitted documents if the workflow requires it

For example:

DOCUMENTS


Application.pdf
Version 2
Uploaded Aug 15


[ View Document ]


────────────────────


Supporting Document.pdf
Version 1


[ View Document ]
6. 💬 Remarks

Remarks are important for communication between:

Group
 ↕
Directorate

Example:

CASE REMARKS


Directorate A
Aug 15, 10:20


"Please verify the applicant's supporting
documentation."


────────────────────


Group A1
Aug 15, 12:40


"Supporting document has been verified."


[ + Add Remark ]

The Group can add remarks as part of the case activity.

7. ⚠️ Request Clarification

If the Group needs more information, the case can enter:

Pending Clarification

For example:

[ Request Clarification ]

opens:

Request Clarification


What information/document is needed?


┌─────────────────────────────────┐
│ Please provide the missing      │
│ supporting document.             │
└─────────────────────────────────┘


[ Send Request ]

The exact recipient/behavior should follow whatever internal clarification process FHC uses, but the system can record the status as:

PENDING CLARIFICATION
8. ↩️ Send Back to Directorate

This is very important.

Remember:

A Group does not directly transfer a case to another Group.

If Group A1 thinks another Group should handle something, it goes:

GROUP
  ↓
DIRECTORATE

So they have:

Send Back to Directorate

Example:

Send Back to Directorate


Reason *


┌─────────────────────────────────┐
│ This case requires work outside │
│ our Group's responsibility.     │
└─────────────────────────────────┘


[ Cancel ]      [ Send Back ]

Then:

Group A1
    ↓
Directorate A

The Directorate decides what happens next.

9. ✅ Finish Group Work

When the Group completes the detailed work, they don't approve the case.

Instead:

[ Mark Work Complete ]

The system asks for a final work remark:

Complete Work


Work Summary *


┌─────────────────────────────────┐
│ All required documents were     │
│ reviewed and the assessment has │
│ been completed.                 │
└─────────────────────────────────┘


[ Cancel ]      [ Complete Work ]

Then:

GROUP
   ↓
DIRECTORATE

The Directorate receives:

FHC-2026-001 — Work completed by Group A1