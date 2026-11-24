"""
Resolve - Complaint & Ticket Management System
Python DSA Console Demonstration (Equivalent to cpp/complaint_system.cpp)

Data Structures Used:
- Queue (collections.deque): FIFO intake queue
- Priority Queue (heapq): Urgency-based dispatch (High > Medium > Low, FIFO on tie)
- Hash Map (dict): O(1) ticket lookup by ID
- Linked List (list): Append-only history trail
"""

import datetime
import heapq
from collections import deque
from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, List, Optional


class Priority(Enum):
    Low = 1
    Medium = 2
    High = 3


def to_string(priority: Priority) -> str:
    if priority == Priority.High:
        return "High"
    if priority == Priority.Medium:
        return "Medium"
    if priority == Priority.Low:
        return "Low"
    return "Unknown"


def priority_rank(priority: Priority) -> int:
    return priority.value


def current_time() -> str:
    return datetime.datetime.now().strftime("%Y-%m-%d %H:%M")


@dataclass
class HistoryEntry:
    timestamp: str
    message: str


@dataclass
class Complaint:
    id: str
    name: str
    category: str
    title: str
    description: str
    priority: Priority = Priority.Medium
    status: str = "New"
    created_at: str = ""
    priority_version: int = 0
    history: List[HistoryEntry] = field(default_factory=list)


class ComplaintSystem:
    def __init__(self):
        # FIFO intake: first submitted ticket is reviewed first (queue<string>)
        self.intake_queue: deque = deque()

        # Urgency-based dispatch: High before Medium before Low (priority_queue)
        # Store (-priority_rank, arrival_order, ticket_id, version)
        self.dispatch_heap: List = []

        # Ticket ID -> complaint record: average-case lookup is O(1) (unordered_map)
        self.tickets: Dict[str, Complaint] = {}

        self.next_id = 1001
        self.next_arrival_order = 0

    def add_history(self, complaint: Complaint, message: str) -> None:
        complaint.history.append(HistoryEntry(current_time(), message))

    def read_non_empty_line(self, prompt: str) -> str:
        while True:
            try:
                value = input(prompt).strip()
            except (EOFError, KeyboardInterrupt):
                return ""
            if value:
                return value
            print("Please enter a value.")

    def read_number(self, prompt: str, minimum: int, maximum: int) -> int:
        while True:
            try:
                raw = input(prompt).strip()
                val = int(raw)
                if minimum <= val <= maximum:
                    return val
            except (ValueError, EOFError, KeyboardInterrupt):
                pass
            print(f"Choose a number from {minimum} to {maximum}.")

    def choose_priority(self) -> Priority:
        print("1. High  2. Medium  3. Low")
        choice = self.read_number("Priority: ", 1, 3)
        if choice == 1:
            return Priority.High
        if choice == 3:
            return Priority.Low
        return Priority.Medium

    def find_ticket(self, ticket_id: str) -> Optional[Complaint]:
        return self.tickets.get(ticket_id)

    def print_complaint(self, complaint: Complaint) -> None:
        print(f"\nTicket: {complaint.id}")
        print(f"Title: {complaint.title}")
        print(f"Category: {complaint.category}")
        print(f"Reported by: {complaint.name}")
        print(f"Priority: {to_string(complaint.priority)}")
        print(f"Status: {complaint.status}")
        print(f"Created: {complaint.created_at}")
        print(f"Details: {complaint.description}")

    def add_complaint(self) -> None:
        ticket_id = f"RSL-{self.next_id:04d}"
        self.next_id += 1

        name = self.read_non_empty_line("Name: ")
        category = self.read_non_empty_line("Category: ")
        title = self.read_non_empty_line("Short title: ")
        description = self.read_non_empty_line("Description: ")
        priority = self.choose_priority()

        complaint = Complaint(
            id=ticket_id,
            name=name,
            category=category,
            title=title,
            description=description,
            priority=priority,
            status="New",
            created_at=current_time(),
        )
        self.add_history(complaint, "Complaint submitted and added to the FIFO intake queue.")
        self.tickets[ticket_id] = complaint
        self.intake_queue.append(ticket_id)

        print(f"\nCreated {ticket_id}. It is waiting in the intake queue.")

    def process_intake_queue(self) -> None:
        if not self.intake_queue:
            print("The intake queue is empty.")
            return

        moved = 0
        while self.intake_queue:
            ticket_id = self.intake_queue.popleft()
            complaint = self.find_ticket(ticket_id)
            if complaint is None or complaint.status != "New":
                continue

            complaint.status = "Queued"
            self.add_history(complaint, "Reviewed in FIFO order and moved to the priority dispatch queue.")
            heapq.heappush(
                self.dispatch_heap,
                (-priority_rank(complaint.priority), self.next_arrival_order, complaint.id, complaint.priority_version)
            )
            self.next_arrival_order += 1
            moved += 1

        print(f"Moved {moved} new ticket(s) from the FIFO queue to priority dispatch.")

    def assign_highest_priority(self) -> None:
        while self.dispatch_heap:
            neg_prio, arrival, ticket_id, version = heapq.heappop(self.dispatch_heap)
            complaint = self.find_ticket(ticket_id)

            # Skip stale heap entries if updated while queued
            if complaint is None or complaint.status != "Queued" or version != complaint.priority_version:
                continue

            complaint.status = "In Progress"
            self.add_history(complaint, "Assigned next by the priority queue.")
            print(f"Assigned {complaint.id} ({to_string(complaint.priority)} priority).")
            return

        print("No ticket is waiting in the priority dispatch queue.")

    def search_ticket(self) -> None:
        ticket_id = self.read_non_empty_line("Ticket ID (example RSL-1001): ")
        complaint = self.find_ticket(ticket_id)
        if complaint is None:
            print(f"No ticket found for {ticket_id}.")
            return
        self.print_complaint(complaint)

    def update_status(self) -> None:
        ticket_id = self.read_non_empty_line("Ticket ID: ")
        complaint = self.find_ticket(ticket_id)
        if complaint is None:
            print(f"No ticket found for {ticket_id}.")
            return

        print("1. New  2. In Progress  3. Resolved")
        choice = self.read_number("New status: ", 1, 3)
        next_status = "New" if choice == 1 else ("In Progress" if choice == 2 else "Resolved")
        previous_status = complaint.status

        if previous_status == next_status:
            print("Ticket already has that status.")
            return

        complaint.priority_version += 1
        complaint.status = next_status
        self.add_history(complaint, f"Status changed from {previous_status} to {next_status}.")
        if next_status == "New":
            self.intake_queue.append(complaint.id)
        print(f"Status updated to {next_status}.")

    def update_priority(self) -> None:
        ticket_id = self.read_non_empty_line("Ticket ID: ")
        complaint = self.find_ticket(ticket_id)
        if complaint is None:
            print(f"No ticket found for {ticket_id}.")
            return

        previous = complaint.priority
        next_prio = self.choose_priority()
        if previous == next_prio:
            print("Ticket already has that priority.")
            return

        complaint.priority = next_prio
        complaint.priority_version += 1
        self.add_history(complaint, f"Priority changed from {to_string(previous)} to {to_string(next_prio)}.")
        if complaint.status == "Queued":
            heapq.heappush(
                self.dispatch_heap,
                (-priority_rank(complaint.priority), self.next_arrival_order, complaint.id, complaint.priority_version)
            )
            self.next_arrival_order += 1
        print(f"Priority updated to {to_string(next_prio)}.")

    def show_history(self) -> None:
        ticket_id = self.read_non_empty_line("Ticket ID: ")
        complaint = self.find_ticket(ticket_id)
        if complaint is None:
            print(f"No ticket found for {ticket_id}.")
            return

        print(f"\nHistory for {complaint.id}:")
        for entry in complaint.history:
            print(f"- {entry.timestamp} | {entry.message}")

    def list_tickets(self) -> None:
        if not self.tickets:
            print("No tickets have been submitted yet.")
            return

        ordered = sorted(self.tickets.values(), key=lambda c: c.id)
        print("\n--- All tickets ---")
        for c in ordered:
            print(f"{c.id:<12} {c.status:<14} {to_string(c.priority):<9} {c.title}")

    def run(self) -> None:
        print("==============================================")
        print(" Resolve | Complaint & Ticket Management")
        print(" DSA Console Demonstration")
        print("==============================================")

        while True:
            print("\n1. Submit complaint")
            print("2. Process FIFO intake queue")
            print("3. Assign highest-priority ticket")
            print("4. Search ticket by ID")
            print("5. Update ticket status")
            print("6. View linked-list history")
            print("7. List all tickets")
            print("8. Update ticket priority")
            print("0. Exit")

            choice = self.read_number("Choose: ", 0, 8)
            if choice == 1:
                self.add_complaint()
            elif choice == 2:
                self.process_intake_queue()
            elif choice == 3:
                self.assign_highest_priority()
            elif choice == 4:
                self.search_ticket()
            elif choice == 5:
                self.update_status()
            elif choice == 6:
                self.show_history()
            elif choice == 7:
                self.list_tickets()
            elif choice == 8:
                self.update_priority()
            elif choice == 0:
                print("Good luck with the presentation. Goodbye!")
                break


if __name__ == "__main__":
    system = ComplaintSystem()
    system.run()
