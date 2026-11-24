const STORAGE_KEY = "resolve-dsa-ticket-demo-v1";
const PRIORITY_WEIGHT = { High: 3, Medium: 2, Low: 1 };
const VALID_STATUSES = ["New", "In Progress", "Resolved"];
const VALID_PRIORITIES = ["High", "Medium", "Low"];

const elements = {
  complaintForm: document.querySelector("#complaint-form"),
  trackForm: document.querySelector("#track-form"),
  trackInput: document.querySelector("#track-id"),
  trackResult: document.querySelector("#track-result"),
  ticketList: document.querySelector("#ticket-list"),
  ticketTotal: document.querySelector("#ticket-total"),
  newCount: document.querySelector("#stat-new"),
  progressCount: document.querySelector("#stat-progress"),
  resolvedCount: document.querySelector("#stat-resolved"),
  search: document.querySelector("#search-tickets"),
  statusFilter: document.querySelector("#status-filter"),
  sortOrder: document.querySelector("#sort-order"),
  resetButton: document.querySelector("#reset-demo"),
  dialog: document.querySelector("#history-dialog"),
  dialogTitle: document.querySelector("#dialog-title"),
  dialogMeta: document.querySelector("#dialog-ticket-meta"),
  historyList: document.querySelector("#history-list"),
  closeDialog: document.querySelector("#close-dialog"),
  toast: document.querySelector("#toast"),
};

function daysAgo(days, hours = 10) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hours, (days * 7) % 60, 0, 0);
  return date.toISOString();
}

function initialTickets() {
  return [
    {
      id: "RSL-1001",
      name: "Karan Lubhana",
      category: "Network",
      title: "Wi-Fi keeps dropping in Lab 2",
      description: "The connection drops every few minutes during the afternoon lab session.",
      priority: "High",
      status: "In Progress",
      createdAt: daysAgo(0, 9),
      history: [
        { at: daysAgo(0, 9), message: "Complaint submitted and added to the intake queue." },
        { at: daysAgo(0, 9, 15), message: "Reviewed and moved to In Progress." },
      ],
    },
    {
      id: "RSL-1002",
      name: "Kabir Mehta",
      category: "Facilities",
      title: "Projector remote missing in Seminar Room B",
      description: "The room is booked for a presentation, but the projector remote is not at the desk.",
      priority: "Medium",
      status: "New",
      createdAt: daysAgo(0, 11),
      history: [{ at: daysAgo(0, 11), message: "Complaint submitted and added to the intake queue." }],
    },
    {
      id: "RSL-1003",
      name: "Diya Rao",
      category: "Accounts",
      title: "Unable to reset the student portal password",
      description: "The reset link expires before the new password can be saved.",
      priority: "Low",
      status: "Resolved",
      createdAt: daysAgo(1, 13),
      history: [
        { at: daysAgo(1, 13), message: "Complaint submitted and added to the intake queue." },
        { at: daysAgo(0, 8), message: "Password reset flow was checked with the student." },
        { at: daysAgo(0, 8, 20), message: "Marked Resolved after the student confirmed access." },
      ],
    },
    {
      id: "RSL-1004",
      name: "Rehan Kapoor",
      category: "Academics",
      title: "Lab slot overlaps with the practical lecture",
      description: "The timetable shows the same group in two rooms at 2:00 pm on Thursday.",
      priority: "Medium",
      status: "New",
      createdAt: daysAgo(2, 15),
      history: [{ at: daysAgo(2, 15), message: "Complaint submitted and added to the intake queue." }],
    },
  ];
}

function loadTickets() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return initialTickets();
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return initialTickets();
    return parsed.filter((ticket) => ticket && typeof ticket.id === "string");
  } catch (error) {
    console.warn("Could not read the saved demo tickets. Starting with the sample set.", error);
    return initialTickets();
  }
}

let tickets = loadTickets();
let toastTimer;

function saveTickets() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
  } catch (error) {
    showToast("This browser could not save the demo data. The current page will still work.");
    console.error("Could not save ticket data.", error);
  }
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

function formatDate(value, includeTime = false) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat("en-GB", includeTime
    ? { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }
    : { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function nextTicketId() {
  const highest = tickets.reduce((max, ticket) => {
    const match = String(ticket.id).match(/RSL-(\d+)/i);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 1000);
  return `RSL-${String(highest + 1).padStart(4, "0")}`;
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("is-visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => elements.toast.classList.remove("is-visible"), 3200);
}

function priorityOptions(selected) {
  return VALID_PRIORITIES.map((priority) => `<option value="${priority}" ${priority === selected ? "selected" : ""}>${priority}</option>`).join("");
}

function statusOptions(selected) {
  return VALID_STATUSES.map((status) => `<option value="${status}" ${status === selected ? "selected" : ""}>${status === "In Progress" ? "In progress" : status}</option>`).join("");
}

function getVisibleTickets() {
  const query = elements.search.value.trim().toLowerCase();
  const status = elements.statusFilter.value;
  const result = tickets.filter((ticket) => {
    const matchesStatus = status === "All" || ticket.status === status;
    const haystack = [ticket.id, ticket.title, ticket.category, ticket.description, ticket.name].join(" ").toLowerCase();
    return matchesStatus && (!query || haystack.includes(query));
  });

  if (elements.sortOrder.value === "newest") {
    result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } else {
    result.sort((a, b) => (PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority]) || (new Date(a.createdAt) - new Date(b.createdAt)));
  }
  return result;
}

function renderTickets() {
  const visible = getVisibleTickets();
  elements.ticketTotal.textContent = String(tickets.length);
  elements.newCount.textContent = String(tickets.filter((ticket) => ticket.status === "New").length);
  elements.progressCount.textContent = String(tickets.filter((ticket) => ticket.status === "In Progress").length);
  elements.resolvedCount.textContent = String(tickets.filter((ticket) => ticket.status === "Resolved").length);

  if (visible.length === 0) {
    elements.ticketList.innerHTML = '<div class="ticket-empty">No tickets match that view.</div>';
    return;
  }

  elements.ticketList.innerHTML = visible.map((ticket) => `
    <article class="ticket-row" data-ticket="${escapeHtml(ticket.id)}">
      <div class="ticket-primary">
        <div class="ticket-ident"><span class="ticket-id">${escapeHtml(ticket.id)}</span><span class="ticket-category">/ ${escapeHtml(ticket.category)}</span></div>
        <h3 class="ticket-title">${escapeHtml(ticket.title)}</h3>
        <p class="ticket-description">${escapeHtml(ticket.description)}</p>
      </div>
      <label class="priority-wrap"><span class="mobile-label" hidden>PRIORITY</span>
        <select class="priority-select" data-action="priority" data-ticket-id="${escapeHtml(ticket.id)}" data-priority="${escapeHtml(ticket.priority)}" aria-label="Priority for ${escapeHtml(ticket.id)}">${priorityOptions(ticket.priority)}</select>
      </label>
      <label class="status-wrap"><span class="mobile-label" hidden>STATUS</span>
        <select class="status-select" data-action="status" data-ticket-id="${escapeHtml(ticket.id)}" data-status="${escapeHtml(ticket.status)}" aria-label="Status for ${escapeHtml(ticket.id)}">${statusOptions(ticket.status)}</select>
      </label>
      <button class="history-button" type="button" data-action="history" data-ticket-id="${escapeHtml(ticket.id)}">View history ↗</button>
    </article>
  `).join("");
  elements.ticketList.querySelectorAll(".mobile-label").forEach((label) => { label.hidden = false; });
}

function findTicket(id) {
  const normalized = id.trim().toUpperCase();
  return tickets.find((ticket) => ticket.id.toUpperCase() === normalized);
}

function showTrackingResult(ticket) {
  if (!ticket) {
    elements.trackResult.innerHTML = '<p class="track-result-error">We could not find that ID. Check it and try again.</p>';
    return;
  }
  elements.trackResult.innerHTML = `
    <div class="track-result-card">
      <strong>${escapeHtml(ticket.id)} · ${escapeHtml(ticket.status)}</strong>
      <span>${escapeHtml(ticket.title)} · ${escapeHtml(ticket.priority)} priority · updated ${escapeHtml(formatDate(ticket.history?.at(-1)?.at || ticket.createdAt))}</span>
    </div>`;
}

function openHistory(ticket) {
  elements.dialogTitle.textContent = ticket.title;
  elements.dialogMeta.textContent = `${ticket.id} / ${ticket.category} / ${ticket.status} / ${ticket.priority} priority`;
  const history = Array.isArray(ticket.history) ? ticket.history : [];
  elements.historyList.innerHTML = history.length
    ? history.map((entry) => `<li><time datetime="${escapeHtml(entry.at)}">${escapeHtml(formatDate(entry.at, true))}</time><p>${escapeHtml(entry.message)}</p></li>`).join("")
    : "<li><p>No history has been recorded yet.</p></li>";
  elements.dialog.showModal();
}

function recordHistory(ticket, message) {
  if (!Array.isArray(ticket.history)) ticket.history = [];
  ticket.history.push({ at: new Date().toISOString(), message });
}

function handleComplaintSubmit(event) {
  event.preventDefault();
  const formData = new FormData(elements.complaintForm);
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!title || !description) return;

  const ticket = {
    id: nextTicketId(),
    name: String(formData.get("name") ?? "").trim(),
    category: String(formData.get("category") ?? "").trim(),
    title,
    description,
    priority: String(formData.get("priority") ?? "Medium"),
    status: "New",
    createdAt: new Date().toISOString(),
    history: [],
  };
  recordHistory(ticket, "Complaint submitted and added to the intake queue.");
  tickets.unshift(ticket);
  saveTickets();
  renderTickets();
  if (typeof sim !== "undefined" && sim.ticketsMap) {
    const copy = {
      id: ticket.id,
      name: ticket.name,
      category: ticket.category,
      title: ticket.title,
      description: ticket.description,
      priority: ticket.priority,
      status: ticket.status,
      createdAt: ticket.createdAt.slice(0, 16).replace("T", " "),
      priorityVersion: 0,
      history: [{ timestamp: new Date().toISOString().slice(0, 16).replace("T", " "), message: "Complaint submitted and added to the FIFO intake queue." }]
    };
    sim.ticketsMap.set(ticket.id, copy);
    sim.intakeQueue.push(ticket.id);
  }
  elements.complaintForm.reset();
  elements.trackInput.value = ticket.id;
  showTrackingResult(ticket);
  showToast(`Ticket ${ticket.id} is on the record.`);
  document.querySelector("#tickets").scrollIntoView({ behavior: "smooth", block: "start" });
}

function handleTrackSubmit(event) {
  event.preventDefault();
  showTrackingResult(findTicket(elements.trackInput.value));
}

function handleTicketChange(event) {
  const control = event.target.closest("select[data-action]");
  if (!control) return;
  const ticket = findTicket(control.dataset.ticketId);
  if (!ticket) return;

  if (control.dataset.action === "status" && VALID_STATUSES.includes(control.value) && control.value !== ticket.status) {
    const previous = ticket.status;
    ticket.status = control.value;
    recordHistory(ticket, `Status changed from ${previous} to ${ticket.status}.`);
    showToast(`${ticket.id} status updated to ${ticket.status}.`);
  } else if (control.dataset.action === "priority" && VALID_PRIORITIES.includes(control.value) && control.value !== ticket.priority) {
    const previous = ticket.priority;
    ticket.priority = control.value;
    recordHistory(ticket, `Priority changed from ${previous} to ${ticket.priority}.`);
    showToast(`${ticket.id} priority updated to ${ticket.priority}.`);
  }

  saveTickets();
  renderTickets();
}

function handleTicketClick(event) {
  const button = event.target.closest('button[data-action="history"]');
  if (!button) return;
  const ticket = findTicket(button.dataset.ticketId);
  if (ticket) openHistory(ticket);
}

function resetDemo() {
  if (!window.confirm("Restore the original four sample tickets? Your locally created demo tickets will be removed.")) return;
  tickets = initialTickets();
  saveTickets();
  renderTickets();
  elements.trackResult.replaceChildren();
  showToast("The original sample tickets have been restored.");
}

elements.complaintForm.addEventListener("submit", handleComplaintSubmit);
elements.trackForm.addEventListener("submit", handleTrackSubmit);
elements.ticketList.addEventListener("change", handleTicketChange);
elements.ticketList.addEventListener("click", handleTicketClick);
elements.search.addEventListener("input", renderTickets);
elements.statusFilter.addEventListener("change", renderTickets);
elements.sortOrder.addEventListener("change", renderTickets);
elements.resetButton.addEventListener("click", resetDemo);
elements.closeDialog.addEventListener("click", () => elements.dialog.close());
elements.dialog.addEventListener("click", (event) => {
  if (event.target === elements.dialog) elements.dialog.close();
});
elements.trackInput.addEventListener("input", () => { elements.trackInput.value = elements.trackInput.value.toUpperCase(); });

document.querySelectorAll('a[href="#submit"]').forEach((anchor) => {
  anchor.addEventListener("click", (event) => {
    event.preventDefault();
    const section = document.querySelector("#submit");
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
      const firstInput = section.querySelector("input[name='name']");
      if (firstInput) {
        setTimeout(() => firstInput.focus(), 350);
      }
    }
  });
});

/* ==========================================================================
   Interactive DSA Console Simulator (For Web & Vercel)
   Mirrors the C++ console implementation (cpp/complaint_system.cpp):
   - FIFO Queue (intake)
   - Max-Heap Priority Queue (urgency dispatch)
   - Hash Map (O(1) ID lookup)
   - Linked List (timestamped history trail)
   ========================================================================== */

const termDialog = document.querySelector("#dsa-terminal-dialog");
const termOutput = document.querySelector("#terminal-output");
const termInputForm = document.querySelector("#terminal-input-form");
const termInput = document.querySelector("#terminal-input");
const openTermBtn = document.querySelector("#open-dsa-terminal");
const closeTermBtn = document.querySelector("#close-terminal");
const termButtons = document.querySelectorAll(".term-btn");

class DSASimulator {
  constructor() {
    this.intakeQueue = []; // FIFO Queue
    this.dispatchHeap = []; // Priority Queue: array of {id, priority, arrivalOrder, version}
    this.ticketsMap = new Map(); // Hash Map: ticketId -> Ticket
    this.nextId = 1005;
    this.nextArrivalOrder = 0;
    this.initFromDemo();
  }

  initFromDemo() {
    this.intakeQueue = [];
    this.dispatchHeap = [];
    this.ticketsMap = new Map();
    this.nextArrivalOrder = 0;

    for (const t of tickets) {
      const copy = {
        id: t.id,
        name: t.name,
        category: t.category,
        title: t.title,
        description: t.description,
        priority: t.priority,
        status: t.status,
        createdAt: t.createdAt.slice(0, 16).replace("T", " "),
        priorityVersion: 0,
        history: (t.history || []).map(h => ({
          timestamp: h.at ? h.at.slice(0, 16).replace("T", " ") : "2026-11-24 10:00",
          message: h.message
        }))
      };
      this.ticketsMap.set(copy.id, copy);
      if (copy.status === "New") {
        this.intakeQueue.push(copy.id);
      } else if (copy.status === "In Progress" || copy.status === "Queued") {
        this.pushHeap(copy);
      }
    }
  }

  pushHeap(ticket) {
    this.dispatchHeap.push({
      ticketId: ticket.id,
      priority: ticket.priority,
      rank: PRIORITY_WEIGHT[ticket.priority] || 2,
      arrivalOrder: this.nextArrivalOrder++,
      version: ticket.priorityVersion
    });
    // Sort max-heap: higher rank first, then earlier arrivalOrder first
    this.dispatchHeap.sort((a, b) => {
      if (b.rank !== a.rank) return b.rank - a.rank;
      return a.arrivalOrder - b.arrivalOrder;
    });
  }

  addHistory(ticket, msg) {
    const timeStr = new Date().toISOString().slice(0, 16).replace("T", " ");
    ticket.history.push({ timestamp: timeStr, message: msg });
  }

  addComplaint(name, category, title, description, priority) {
    const id = `RSL-${String(this.nextId++).padStart(4, "0")}`;
    const timeStr = new Date().toISOString().slice(0, 16).replace("T", " ");
    const complaint = {
      id,
      name,
      category,
      title,
      description,
      priority,
      status: "New",
      createdAt: timeStr,
      priorityVersion: 0,
      history: []
    };
    this.addHistory(complaint, "Complaint submitted and added to the FIFO intake queue.");
    this.ticketsMap.set(id, complaint);
    this.intakeQueue.push(id);
    return id;
  }

  processIntakeQueue() {
    if (this.intakeQueue.length === 0) return 0;
    let moved = 0;
    while (this.intakeQueue.length > 0) {
      const id = this.intakeQueue.shift();
      const ticket = this.ticketsMap.get(id);
      if (!ticket || ticket.status !== "New") continue;

      ticket.status = "Queued";
      this.addHistory(ticket, "Reviewed in FIFO order and moved to the priority dispatch queue.");
      this.pushHeap(ticket);
      moved++;
    }
    return moved;
  }

  assignHighestPriority() {
    while (this.dispatchHeap.length > 0) {
      const item = this.dispatchHeap.shift();
      const ticket = this.ticketsMap.get(item.ticketId);
      if (!ticket || (ticket.status !== "Queued" && ticket.status !== "In Progress") || item.version !== ticket.priorityVersion) {
        continue;
      }
      ticket.status = "In Progress";
      this.addHistory(ticket, "Assigned next by the priority queue.");
      return ticket;
    }
    return null;
  }

  searchTicket(id) {
    return this.ticketsMap.get(id.toUpperCase().trim()) || null;
  }

  updateStatus(id, newStatus) {
    const ticket = this.searchTicket(id);
    if (!ticket) return "NOT_FOUND";
    if (ticket.status === newStatus) return "SAME_STATUS";

    const prev = ticket.status;
    ticket.status = newStatus;
    ticket.priorityVersion++;
    this.addHistory(ticket, `Status changed from ${prev} to ${newStatus}.`);
    if (newStatus === "New") this.intakeQueue.push(ticket.id);
    return "OK";
  }

  updatePriority(id, newPriority) {
    const ticket = this.searchTicket(id);
    if (!ticket) return "NOT_FOUND";
    if (ticket.priority === newPriority) return "SAME_PRIORITY";

    const prev = ticket.priority;
    ticket.priority = newPriority;
    ticket.priorityVersion++;
    this.addHistory(ticket, `Priority changed from ${prev} to ${newPriority}.`);
    if (ticket.status === "Queued") {
      this.pushHeap(ticket);
    }
    return "OK";
  }
}

const sim = new DSASimulator();

function termPrint(text, className = "") {
  if (!termOutput) return;
  const line = document.createElement("div");
  if (className) line.className = className;
  line.textContent = text;
  termOutput.appendChild(line);
  termOutput.scrollTop = termOutput.scrollHeight;
}

function showWelcome() {
  termOutput.innerHTML = "";
  termPrint("==============================================", "term-dim");
  termPrint(" Resolve | Complaint & Ticket Management", "term-highlight");
  termPrint(" C++ DSA Console Demonstration (Vercel Edition)", "term-highlight");
  termPrint("==============================================", "term-dim");
  termPrint("\nData structures active in this demonstration:");
  termPrint("- FIFO Queue: intake queue for initial fairness");
  termPrint("- Priority Queue (Heap): urgency-based dispatch");
  termPrint("- Hash Map: O(1) lookup by ticket ID");
  termPrint("- Linked List: append-only timestamped audit trail\n");
  termPrint("Choose an action below or enter a number (0-8):\n", "term-accent");
}

let inputMode = null; // for multi-step prompts
let promptState = {};

function handleTermChoice(choice) {
  choice = choice.trim();
  if (choice === "clear") {
    showWelcome();
    return;
  }

  termPrint(`\n> Option ${choice}`, "term-accent");

  switch (choice) {
    case "1": {
      termPrint("--- 1. Submit New Complaint ---", "term-dim");
      const title = window.prompt("Short title:", "Network latency spike");
      if (!title) { termPrint("Cancelled."); return; }
      const name = window.prompt("Your name:", "Pooja Verma") || "Anonymous";
      const cat = window.prompt("Category (Network/Facilities/Accounts/Academics):", "Network") || "General";
      const desc = window.prompt("Description:", "High packet loss observed in block 4.") || title;
      const prioChoice = window.prompt("Priority (1. High  2. Medium  3. Low):", "1");
      const prio = prioChoice === "1" ? "High" : (prioChoice === "3" ? "Low" : "Medium");

      const id = sim.addComplaint(name, cat, title, desc, prio);
      termPrint(`Created ${id}. It is waiting in the FIFO intake queue.`, "term-highlight");
      break;
    }
    case "2": {
      termPrint("--- 2. Process FIFO Intake Queue ---", "term-dim");
      const count = sim.processIntakeQueue();
      if (count === 0) {
        termPrint("The FIFO intake queue is currently empty.", "term-warn");
      } else {
        termPrint(`Moved ${count} ticket(s) from FIFO intake queue to priority dispatch queue.`, "term-highlight");
      }
      break;
    }
    case "3": {
      termPrint("--- 3. Assign Highest-Priority Ticket (Max-Heap) ---", "term-dim");
      const assigned = sim.assignHighestPriority();
      if (!assigned) {
        termPrint("No tickets waiting in the priority dispatch queue.", "term-warn");
      } else {
        termPrint(`Assigned ${assigned.id} (${assigned.priority} priority) to In Progress.`, "term-highlight");
      }
      break;
    }
    case "4": {
      termPrint("--- 4. Search Ticket by ID (Hash Map O(1)) ---", "term-dim");
      const id = window.prompt("Enter Ticket ID (e.g. RSL-1001):", "RSL-1001");
      if (!id) return;
      const t = sim.searchTicket(id);
      if (!t) {
        termPrint(`No ticket found for ${id.toUpperCase()}.`, "term-warn");
      } else {
        termPrint(`Ticket: ${t.id}\nTitle: ${t.title}\nCategory: ${t.category}\nReported by: ${t.name}\nPriority: ${t.priority}\nStatus: ${t.status}\nCreated: ${t.createdAt}\nDetails: ${t.description}`);
      }
      break;
    }
    case "5": {
      termPrint("--- 5. Update Ticket Status ---", "term-dim");
      const id = window.prompt("Enter Ticket ID:", "RSL-1001");
      if (!id) return;
      const t = sim.searchTicket(id);
      if (!t) { termPrint(`No ticket found for ${id}.`, "term-warn"); return; }
      const statChoice = window.prompt("Choose Status:\n1. New\n2. In Progress\n3. Resolved", "3");
      const nextStat = statChoice === "1" ? "New" : (statChoice === "2" ? "In Progress" : "Resolved");
      const res = sim.updateStatus(id, nextStat);
      if (res === "OK") termPrint(`Status for ${t.id} updated to ${nextStat}.`, "term-highlight");
      else if (res === "SAME_STATUS") termPrint(`Ticket already has status ${nextStat}.`, "term-warn");
      break;
    }
    case "6": {
      termPrint("--- 6. View History (Linked-List Audit Trail) ---", "term-dim");
      const id = window.prompt("Enter Ticket ID:", "RSL-1001");
      if (!id) return;
      const t = sim.searchTicket(id);
      if (!t) { termPrint(`No ticket found for ${id}.`, "term-warn"); return; }
      termPrint(`History for ${t.id}:`, "term-highlight");
      t.history.forEach(h => termPrint(`- ${h.timestamp} | ${h.message}`));
      break;
    }
    case "7": {
      termPrint("--- 7. List All Tickets ---", "term-dim");
      if (sim.ticketsMap.size === 0) {
        termPrint("No tickets found.");
        return;
      }
      const sorted = Array.from(sim.ticketsMap.values()).sort((a, b) => a.id.localeCompare(b.id));
      let header = "TICKET       STATUS         PRIORITY  TITLE";
      termPrint(header, "term-dim");
      sorted.forEach(t => {
        const idCol = t.id.padEnd(12, " ");
        const statCol = t.status.padEnd(14, " ");
        const prioCol = t.priority.padEnd(9, " ");
        termPrint(`${idCol} ${statCol} ${prioCol} ${t.title}`);
      });
      break;
    }
    case "8": {
      termPrint("--- 8. Update Ticket Priority ---", "term-dim");
      const id = window.prompt("Enter Ticket ID:", "RSL-1002");
      if (!id) return;
      const t = sim.searchTicket(id);
      if (!t) { termPrint(`No ticket found for ${id}.`, "term-warn"); return; }
      const prioChoice = window.prompt("Choose Priority:\n1. High\n2. Medium\n3. Low", "1");
      const nextPrio = prioChoice === "1" ? "High" : (prioChoice === "3" ? "Low" : "Medium");
      const res = sim.updatePriority(id, nextPrio);
      if (res === "OK") termPrint(`Priority for ${t.id} updated to ${nextPrio}.`, "term-highlight");
      else if (res === "SAME_PRIORITY") termPrint(`Ticket already has priority ${nextPrio}.`, "term-warn");
      break;
    }
    case "0": {
      termPrint("Good luck with your presentation! Resetting session...", "term-highlight");
      sim.initFromDemo();
      break;
    }
    default:
      termPrint(`Unknown option '${choice}'. Please enter 0 to 8.`, "term-warn");
  }
}

if (openTermBtn && termDialog) {
  openTermBtn.addEventListener("click", () => {
    sim.initFromDemo();
    showWelcome();
    termDialog.showModal();
  });
}

if (closeTermBtn && termDialog) {
  closeTermBtn.addEventListener("click", () => termDialog.close());
}

if (termDialog) {
  termDialog.addEventListener("click", (e) => {
    if (e.target === termDialog) termDialog.close();
  });
}

termButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    handleTermChoice(btn.dataset.choice);
  });
});

if (termInputForm && termInput) {
  termInputForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const val = termInput.value.trim();
    if (!val) return;
    termInput.value = "";
    handleTermChoice(val);
  });
}

renderTickets();
