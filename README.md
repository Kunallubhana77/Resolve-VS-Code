# Resolve — Complaint & Ticket Management System

Resolve is a DSA subject project that models a service desk workflow. It includes a web dashboard for submitting and tracking complaints, a C++17 console program that demonstrates the underlying data structures, and an interactive in-browser console simulation.

**Live Demo:** [Resolve — Complaint & Ticket Management](https://tcmresolve.vercel.app/)

---

## Live Preview

You can test the deployed application directly at:
**[https://tcmresolve.vercel.app/](https://tcmresolve.vercel.app/)**

The live site includes both the editorial ticket desk and an in-browser **Interactive DSA Console** under Section 03 (*DSA Approach*), allowing full testing of the queue and heap mechanics on desktop and mobile without installing anything locally.

---

## Overview

Most help desks deal with two conflicting requirements: intake should be fair (first come, first served), but assignment must be urgent (critical outages before minor queries). Resolve handles this using four core data structures across ticket intake, dispatch, lookup, and audit logging.

The web frontend stores data in the browser's `localStorage` for testing with zero backend dependencies. The C++ program implements the same ticket lifecycle in a terminal CLI.

---

## Data Structures Used

| Structure | Role in System | Operation Complexity |
| :--- | :--- | :--- |
| **FIFO Queue** (`queue<string>`) | Holds incoming tickets in arrival order for initial review. | $O(1)$ enqueue, $O(1)$ dequeue |
| **Priority Queue / Max-Heap** (`priority_queue`) | Dispatches reviewed tickets by urgency (`High` > `Medium` > `Low`). Breaks priority ties using arrival order (FIFO on tie). | $O(\log n)$ push, $O(\log n)$ pop |
| **Hash Map** (`unordered_map<string, Complaint>`) | Direct $O(1)$ lookup for tracking tickets by ID (`RSL-1001`). | $O(1)$ average, $O(n)$ worst case |
| **Linked List** (`list<HistoryEntry>`) | Maintains a timestamped, append-only history log of status and priority changes. | $O(1)$ append, $O(k)$ traversal for $k$ events |

### Queue Invalidation Strategy
When a ticket's priority or status changes while waiting in the dispatch heap, searching a binary heap is an $O(n)$ operation. Instead, each ticket carries an incremental `priorityVersion` counter. When the heap pops a ticket with an outdated version number, it skips the stale entry in $O(1)$ time.

---

## Features

- **Complaint Submission:** Generate tracking IDs (`RSL-1001`, `RSL-1002`) with title, category, description, and urgency.
- **ID Tracking & Search:** Look up ticket status, assigned priority, and full history by ID.
- **Urgency Filtering:** Filter by status (`New`, `In Progress`, `Resolved`) and sort by date or priority.
- **Live DSA Console (In-Browser):** An interactive terminal modal on the live site simulating the exact C++ DSA operations directly in JavaScript.
- **C++17 Standalone CLI:** Native terminal program implementing the queue, heap, map, and list.
- **Python DSA CLI:** Identical console implementation in Python (`cpp/complaint_system.py`) for environments without a C++ compiler.

---

## Project Structure

```text
├── index.html                  Main web interface & ticket desk
├── styles.css                  Styling & typography system
├── app.js                      Frontend logic, localStorage demo & browser DSA simulator
├── run.bat                     One-click local runner (starts server + opens browser + launches CLI)
├── vercel.json                 Vercel static deployment configuration
├── branding/
│   └── resolve-icon.svg        Project mark
├── cpp/
│   ├── complaint_system.cpp    C++17 DSA implementation
│   └── complaint_system.py     Python mirror of the C++ DSA logic
└── docs/
    └── TEAM_PRESENTATION.md    Viva preparation notes and team role talk tracks
```

---

## Running Locally

### 1. One-Click Runner (Windows)
Double-click `run.bat` from the root folder. It starts the local HTTP server, opens `http://localhost:3000` in your browser, and opens the DSA console window.

### 2. Manual Setup

#### Web Dashboard
Start any local static file server:
```powershell
python -m http.server 3000
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

#### C++ Console Program
Compile with any C++17 compiler (`g++`, `clang++`, or `cl`):
```powershell
# Windows PowerShell
g++ -std=c++17 -Wall -Wextra -pedantic cpp\complaint_system.cpp -o complaint-system.exe
.\complaint-system.exe

# macOS / Linux
g++ -std=c++17 -Wall -Wextra -pedantic cpp/complaint_system.cpp -o complaint-system
./complaint-system
```

#### Python Console Program (if no C++ compiler is installed)
```powershell
python cpp/complaint_system.py
```

---

## Live Deployment

- **Vercel URL:** [https://tcmresolve.vercel.app/](https://tcmresolve.vercel.app/)
- **Repository:** [https://github.com/Kunallubhana77/Resolve-VS-Code](https://github.com/Kunallubhana77/Resolve-VS-Code)
