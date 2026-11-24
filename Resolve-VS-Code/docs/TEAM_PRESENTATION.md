# Resolve — Team Presentation & Viva Guide

A structured four-member presentation guide for the Resolve Complaint & Ticket Management System DSA project.

---

<a id="member-1"></a>
## Member 01: The Problem & The Product
**Focus:** Introduction, real-world context, user journey, and web interface design.

### Key Talk Track:
1. **The Problem:** Modern service desks often suffer from opaque handling—users file complaints and have no visibility into who is handling them or in what priority order.
2. **The Product:** *Resolve* is an editorial-style complaint management system where every issue receives a unique tracking ID (e.g., `RSL-1001`) and full lifecycle traceability.
3. **User Flow Demonstration:**
   - Submitting a complaint with category, priority, and details.
   - Searching and tracking by Ticket ID.
   - Filtering and sorting by urgency and status.

### Expected Viva Questions:
- *Q: Why is localStorage used instead of a database for this demonstration?*
  **Answer:** It makes the client-side demo completely self-contained with zero external dependencies, perfect for testing, offline evaluation, and zero-latency demonstrations.

---

<a id="member-2"></a>
## Member 02: Fair Intake with a Queue (FIFO)
**Focus:** Queue data structure, O(1) enqueue/dequeue, initial triage.

### Key Talk Track:
1. **Why FIFO Queue?** Fairness at entry. When complaints arrive, they must first be reviewed and triaged strictly in the order they arrived, preventing starvation.
2. **Implementation:**
   - C++: `std::queue<std::string>` storing incoming ticket IDs.
   - Operations: `push()` (O(1)) when a complaint is created, `pop()` / `front()` (O(1)) when the triage team reviews it.
3. **State Transition:** Moves the complaint status from `New` to `Queued`, preparing it for urgency dispatch.

### Expected Viva Questions:
- *Q: What is the time complexity of the intake queue operations?*
  **Answer:** Both enqueue and dequeue are $O(1)$ constant time operations.

---

<a id="member-3"></a>
## Member 03: Urgency Gets Priority (Priority Queue / Heap)
**Focus:** Max-Heap, custom comparator, dynamic priority updates.

### Key Talk Track:
1. **Why Priority Queue?** Once complaints are triaged, critical issues (e.g., server outage, safety hazards) cannot wait behind minor issues. High priority tickets must be dispatched first.
2. **Comparator Logic (`HigherPriorityFirst`):**
   - Higher priority rank takes precedence (`High (3) > Medium (2) > Low (1)`).
   - In case of a tie, the earlier arrival order is served first (FIFO on tie).
3. **Version Number Invalidation:** When a ticket's priority or status changes while in the queue, an incremental `priorityVersion` is used so stale heap entries are cleanly skipped without an expensive $O(n)$ heap search.

### Expected Viva Questions:
- *Q: How does the priority queue handle equal priorities?*
  **Answer:** An incrementing `arrivalOrder` counter guarantees FIFO fairness among tickets with the exact same priority level.

---

<a id="member-4"></a>
## Member 04: Find It, Follow It (Hash Map & Linked-List History)
**Focus:** `std::unordered_map` for $O(1)$ lookup, linked list for immutable audit history, complexity analysis.

### Key Talk Track:
1. **Hash Map Lookup:** Using `std::unordered_map<string, Complaint>` allows searching any complaint by its Ticket ID in $O(1)$ average time.
2. **Linked-List Audit Trail:** A `std::list<HistoryEntry>` stores chronological status and priority updates with timestamps. Append is $O(1)$ and memory is allocated dynamically.
3. **Complexity Summary Table:**

| Data Structure | Project Role | Operation Cost |
| :--- | :--- | :--- |
| `queue<string>` | FIFO Intake Queue | Enqueue / Dequeue: $O(1)$ |
| `priority_queue` | Urgency Dispatch | Push / Pop: $O(\log n)$ |
| `unordered_map` | ID Lookup | Average: $O(1)$, Worst: $O(n)$ |
| `list<HistoryEntry>` | Audit History | Append: $O(1)$, Read: $O(k)$ |

### Expected Viva Questions:
- *Q: Why use a linked list for history instead of a vector?*
  **Answer:** A linked list guarantees $O(1)$ insertion at the tail without requiring memory reallocation or resizing overhead, which is ideal for an append-only audit trail.
