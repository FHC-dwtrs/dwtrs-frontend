Customer / Public Portal

The customer basically has one job:

"I want to know what happened to my case."

So I would make the public frontend very clean, friendly, and simple.

1. 🌐 Public Home / Tracking Page

The customer sees something like:

┌──────────────────────────────────────────────────────────┐
│ FHC                                  🌐 EN  |  About      │
├──────────────────────────────────────────────────────────┤
│                                                          │
│                 Track Your Application                   │
│                                                          │
│       Enter your tracking number to see the              │
│       current status of your case.                       │
│                                                          │
│       ┌────────────────────────────────────────┐         │
│       │ FHC-2026-001                           │         │
│       └────────────────────────────────────────┘         │
│                                                          │
│                    [ 🔍 Track Case ]                     │
│                                                          │
│                                                          │
│       Example: FHC-2026-001                             │
│                                                          │
└──────────────────────────────────────────────────────────┘

No complicated dashboard.

No customer account.

No username/password.

Just:

Tracking Number
      ↓
[ Track Case ]
2. 🔎 When they search

If the tracking number is valid, they get the case result.

For example:

┌──────────────────────────────────────────────────────────┐
│                                                          │
│  Case Tracking                                           │
│                                                          │
│  Tracking Number                                         │
│  FHC-2026-001                                            │
│                                                          │
│  Status                                                   │
│  🟡 Under Review                                         │
│                                                          │
│  Your application is currently being reviewed.           │
│                                                          │
│  Last Updated                                            │
│  August 15, 2026                                         │
│                                                          │
│  [ Track Another Case ]                                  │
│                                                          │
└──────────────────────────────────────────────────────────┘
3. 🟢 Active cases

Remember your definition:

Active
Submitted
Under Review
In Progress
Pending Clarification
Sent Back for Correction

The customer sees the current status.

For example:

FHC-2026-001


🟡 In Progress


Your application is currently being processed.

They should NOT see:

❌ Directorate A
❌ Group A1
❌ Employee name
❌ Internal remarks
❌ Internal transfer
❌ Who rejected something internally

That's internal information.

4. 🟡 Pending Clarification

If the case needs clarification:

FHC-2026-001


🟡 Pending Clarification


Additional information may be required
to continue processing your application.


Please follow the instructions provided
by FHC if you have been contacted.

If FHC decides that customers should see a specific clarification request, that can be displayed, but I would not automatically expose internal remarks.

5. 🟢 Approved case

If Sector approves:

FHC-2026-001


🟢 Approved


Your application has been approved.


Last Updated:
August 15, 2026

The customer doesn't need to know:

Sector → Directorate → Group → Sector

They just see the meaningful public result.

6. 🔴 Rejected case

This is the one you specifically confirmed.

If Sector rejects:

┌──────────────────────────────────────────┐
│                                          │
│ FHC-2026-001                             │
│                                          │
│ Status:                                  │
│ 🔴 Rejected                              │
│                                          │
│ Reason:                                  │
│                                          │
│ Your application was rejected because    │
│ the required supporting documentation    │
│ was incomplete.                          │
│                                          │
│ Last Updated:                            │
│ August 15, 2026                          │
│                                          │
└──────────────────────────────────────────┘

The rejection remark is mandatory internally and is displayed to the customer.

7. 🗃 Archived cases

Since you clarified that:

Archived does not mean the case is sent back to Records & Archive.

It means the case is now in its final/archived state.

The customer can still search the tracking number.

For example:

FHC-2026-001


Status:
🟢 Approved


Case: Archived

Or:

FHC-2026-002


Status:
🔴 Rejected


Case: Archived


Reason:
...

So archived doesn't mean invisible.

8. 🕒 Should customers see workflow history?

I would not show the internal workflow history.

Internally you have:

Records & Archive
      ↓
Sector
      ↓
Directorate A
      ↓
Group A1
      ↓
Directorate A
      ↓
Sector

The customer should not see that.

Instead, they see something simple:

Application received
        ✓


Application under review
        ✓


Application being processed
        ●


Final decision
        ○

This gives them useful progress information without exposing internal organization.

9. 📄 Should customers see documents?

I would not expose internal documents by default.

The public portal should primarily provide:

Tracking number
Current public status
Last updated date
Rejection reason when rejected
Possibly a public message/instruction when necessary

Internal documents remain protected.