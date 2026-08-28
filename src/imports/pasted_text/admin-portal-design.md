anizational structure, permissions, configuration, and system monitoring.

So I would design the Admin portal around system administration, not case processing.

🛠️ Admin Portal

When Admin logs in:

FHC DWTRS
System Administration

They should immediately know:

"I manage the system, not the cases."

1. 🏠 Admin Dashboard
┌──────────────────────────────────────────────────────────────┐
│ FHC DWTRS                     🔔   👤 System Administrator  │
├──────────────────┬───────────────────────────────────────────┤
│                  │                                           │
│ 🏠 Dashboard     │       SYSTEM ADMINISTRATION              │
│                  │                                           │
│ 👥 Users         │  ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│                  │  │  Users   │ │ Active   │ │ Inactive │ │
│ 🏢 Organization  │  │   86     │ │   78     │ │    8     │ │
│                  │  └──────────┘ └──────────┘ └──────────┘ │
│ 🔐 Roles &       │                                           │
│    Permissions   │  ┌──────────┐ ┌──────────┐              │
│                  │  │ Sectors  │ │Directorates│             │
│ ⚙️ System       │  │    4     │ │    12     │              │
│    Settings      │  └──────────┘ └──────────┘              │
│                  │                                           │
│ 📋 Audit Logs    │  RECENT SYSTEM ACTIVITY                  │
│                  │                                           │
│ 🔔 Notifications │ 👤 Admin created user                   │
│                  │ 🔐 Password changed                      │
│                  │ 🏢 Directorate added                     │
│                  │ 👤 User deactivated                      │
│                  │                                           │
│                  │  SYSTEM STATUS                            │
│                  │  ● Database      Operational              │
│                  │  ● Backend       Operational              │
│                  │  ● File Storage  Operational              │
│                  │                                           │
│ 👤 Profile       │                                           │
│ 🚪 Logout        │                                           │
└──────────────────┴───────────────────────────────────────────┘
2. 👥 User Management

This is one of Admin's biggest responsibilities.

Sidebar:

👥 Users

Page:

Users


[ + Create User ]


Search users...


──────────────────────────────────────────────


Name          Username       Role          Unit        Status
──────────────────────────────────────────────
Abebe         abebe          Sector        Sector A    Active
Meron         meron          Directorate   Dir A       Active
Sara          sara           Group         Group A1    Active
Daniel        daniel         Records       R&A         Active

Admin can:

Create users
View users
Edit users
Activate users
Deactivate users
Reset credentials/password if supported
Assign role
Assign organizational unit
3. ➕ Create User

Example:

Create User


Full Name *
[________________________]


Username *
[________________________]


Email
[________________________]


Role *
[ Sector ▼ ]


Organizational Unit *
[ Housing Development Sector ▼ ]


Status
● Active


[ Cancel ]    [ Create User ]

For a Directorate:

Role:
Directorate


Sector:
Housing Development Sector


Directorate:
Directorate A

For a Group:

Role:
Group


Sector:
Housing Development Sector


Directorate:
Directorate A


Group:
Group A1

This fits your organizational structure.

4. 🏢 Organization Management

This is especially important because your ERD uses:

ORGANIZATIONAL_UNIT

with:

Sector
   ↓
Directorate
   ↓
Group

Admin should have:

Organization
FHC
│
├── Housing Development Sector
│   ├── Directorate A
│   │   ├── Group A1
│   │   └── Group A2
│   │
│   └── Directorate B
│       └── Group B1
│
├── Houses Administration Sector
│   ├── Directorate C
│   └── Directorate D
│
└── Corporate Service Sector
    └── ...

Admin can manage this structure according to their permissions.

5. Add Sector
[ + Add Organizational Unit ]


Unit Type:
[ Sector ]


Name:
[ Housing Development Sector ]


Status:
[ Active ]


[ Create ]
6. Add Directorate
Unit Type:
[ Directorate ]


Name:
[ Directorate A ]


Parent Sector:
[ Housing Development Sector ]


[ Create ]

The database then essentially creates:

Directorate A
parent_unit_id → Housing Development Sector
7. Add Group
Unit Type:
[ Group ]


Name:
[ Group A1 ]


Parent Directorate:
[ Directorate A ]


[ Create ]

So the hierarchy remains:

Sector
  ↓
Directorate
  ↓
Group
8. 🔐 Roles & Permissions

Admin should have a permissions interface.

For example:

Roles & Permissions


                 View   Edit   Approve   Reject   Transfer
──────────────────────────────────────────────────────────
Records & Archive  ✓      ✓       —        —        —
Sector             ✓      ✓       ✓        ✓        ✓
Directorate        ✓      ✓       —        —        ✓
Group              ✓      ✓       —        —        —
Admin              ✓      ✓       —        —        —

But remember:

Admin's power here is system configuration.

It doesn't mean Admin becomes part of the case workflow.

9. 📋 Audit Logs

This is VERY important because you have an AUDIT_LOG entity in your ERD.

Admin should have:

📋 Audit Logs

Example:

Date/Time	User	Action	Case/Entity
Aug 15 10:32	Admin	User created	User #23
Aug 15 10:45	Sara	Case assigned	FHC-001
Aug 15 11:20	Meron	Case transferred	FHC-002
Aug 15 12:10	Sector User	Case rejected	FHC-003

Clicking an event could show:

AUDIT EVENT


Action:
Case Transferred


Performed By:
Meron — Directorate A


Date:
Aug 15, 2026 11:20


Case:
FHC-2026-002


Previous Location:
Directorate A


New Location:
Directorate B


Reason:
Case belongs to Directorate B.

This gives you accountability.

10. ⚙️ System Settings

Admin can manage system-level settings that FHC allows.

For example:

System Settings


Tracking Number Format


FHC-{YEAR}-{SEQUENCE}


Example:
FHC-2026-001


────────────────────────


Notification Settings


☑ Enable system notifications


────────────────────────


Case Settings


☑ Enable document versioning


☑ Enable audit logging


────────────────────────


[ Save Changes ]

Don't overload this page. Only put settings that the actual system needs.

11. 🔔 Notifications

Admin could receive system-related notifications:

🔔 Notifications


New user created
User account deactivated
New Directorate created
System configuration changed
Unusual system activity

They don't need to receive every normal case movement.

12. 👤 Profile

Admin can manage their own:

Name
Email
Password
Profile information
13. What Admin should NOT see as their main workflow

I would not give Admin buttons like:

❌ Approve Case
❌ Reject Case
❌ Assign Case to Directorate
❌ Assign Case to Group
❌ Transfer Case
❌ Sector Reports

unless FHC specifically decides that administrators should have special emergency/override permissions.

The clean architecture is:

              SYSTEM ADMIN
                   │
       ┌───────────┼────────────┐
       ↓           ↓            ↓
     USERS    ORGANIZATION   PERMISSIONS
       │           │            │
       └───────────┼────────────┘
                   ↓
              SYSTEM CONFIG
                   │
                   ↓
              AUDIT LOGS




          DOCUMENT WORKFLOW
                 │
                 ↓
        RECORDS & ARCHIVE
                 ↓
              SECTOR
                 ↓
            DIRECTORATE
                 ↓
               GROUP

Admin supports the workflow but isn't a step inside it.

14. Final Admin sidebar

I'd make it:

FHC DWTRS
System Administration


🏠 Dashboard


👥 Users


🏢 Organization
   ├── Sectors
   ├── Directorates
   └── Groups


🔐 Roles & Permissions


📋 Audit Logs


⚙️ System Settings


🔔 Notifications


──────────────────


👤 My Profile
🚪 Logout