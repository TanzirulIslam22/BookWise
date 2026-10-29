# UI Wireframe / Prototype (planned before implementation)

Low-fidelity layout sketch of the planned interface. This is a **planning
artefact** â€” it is not proof that the application works. The real screenshots
must be taken after running the application.

## Shared layout

```
+---------------------------+----------------------------------------+
|  Smart Library            |                                        |
|  Fine Management System   |          <page content>                |
|                           |                                        |
|  [Dashboard]              |   (main area, scrolls)                 |
|  [Members]                |                                        |
|  [Book Catalog]           |                                        |
|  [Issue / Return]         |                                        |
|  [Fines]                  |                                        |
|  [Audit History]          |                                        |
+---------------------------+----------------------------------------+
   dark sidebar                light content area
```

## Dashboard

```
  Dashboard
  Library overview at a glance.
  +------------+ +------------+ +------------+ +------------+
  | Members    | | Book Titles| | Available  | | Active     |
  | 12         | | 40         | | Copies 78  | | Borrows 9  |
  +------------+ +------------+ +------------+ +------------+
  +------------+ +------------+ +------------+
  | Overdue    | | Overdue    | | Fines      |
  | Books 3    | | Est. 210BDT| | Coll. 150BDT|
  +------------+ +------------+ +------------+
```

## Members

```
  Register Member             |  Search [________] Role [All v]
  Member ID  [CSE-2203001 ]  |  +----------+-------+------+------+
  Full Name  [____________ ]  |  | ID       | Name  | Role | Email|
  Email      [____________ ]  |  +----------+-------+------+------+
  Role       [Student    v]   |  | ...      | ...   | ...  | ...  |
  [      Add Member       ]  |  +----------+-------+------+------+
```

## Book Catalog

```
  Add Book                   |  Search [____________]
  ISBN  [____________]       |  +------+------------------+--------+--+
  Title [____________]       |  | ISBN | Title            | Total  |Av|
  Author[____________]       |  +------+------------------+--------+--+
  Copies [1             ]    |  | ...  | ...              | ...    |..|
  [      Add Book       ]    |  +------+------------------+--------+--+
```

## Issue / Return

```
  Issue a Book               |  Active Borrowing Records
  Member [Choose v]          |  +---------+---------+--------+------+--------+
  Book   [Choose v]          |  | Member  | Book    | Borrow | Due  | Action |
  [     Issue Book      ]    |  +---------+---------+--------+------+--------+
  (limits hint text)         |  | ...     | ...     | ...    | ...  | [Ret]  |
                             |  +---------+---------+--------+------+--------+
```

## Fines

```
  Policy cards: Student 10/day | Heavy after day 7: 20/day | Faculty 0
  Overdue Records            Total live fine: 210 BDT
  +---------+------+--------+------+------+
  | Member  | Role | Due    | Days | Fine |
  +---------+------+--------+------+------+
  | ...     | ...  | ...    | ...  | ...  |
  +---------+------+--------+------+------+
```

## Audit History

```
  Filter [All events v]
  (BOOK_ISSUED)   12/11/2026 10:03   "Clean Code" issued to Tanvir (due ...)
  (FINE_CALCULATED) 12/11/2026 10:05 Fine of 50 BDT charged to Tanvir ...
  (BOOK_RETURNED) 12/11/2026 10:05  "Clean Code" returned by Tanvir (5 overdue...)
```

Toast notifications appear bottom-right for every success/error.
