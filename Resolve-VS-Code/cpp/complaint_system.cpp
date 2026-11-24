#include <ctime>
#include <iomanip>
#include <iostream>
#include <limits>
#include <list>
#include <queue>
#include <sstream>
#include <string>
#include <unordered_map>
#include <vector>

using namespace std;

enum class Priority { Low = 1, Medium = 2, High = 3 };

string toString(Priority priority) {
    switch (priority) {
        case Priority::High: return "High";
        case Priority::Medium: return "Medium";
        case Priority::Low: return "Low";
    }
    return "Unknown";
}

int priorityRank(Priority priority) {
    return static_cast<int>(priority);
}

string currentTime() {
    const time_t now = time(nullptr);
    const tm* local = localtime(&now);
    if (local == nullptr) return "time unavailable";
    ostringstream output;
    output << put_time(local, "%Y-%m-%d %H:%M");
    return output.str();
}

struct HistoryEntry {
    string timestamp;
    string message;
};

struct Complaint {
    string id;
    string name;
    string category;
    string title;
    string description;
    Priority priority = Priority::Medium;
    string status = "New";
    string createdAt;
    unsigned int priorityVersion = 0;
    list<HistoryEntry> history;
};

struct PriorityItem {
    string ticketId;
    Priority priority;
    unsigned long long arrivalOrder;
    unsigned int version;
};

struct HigherPriorityFirst {
    bool operator()(const PriorityItem& left, const PriorityItem& right) const {
        if (priorityRank(left.priority) != priorityRank(right.priority)) {
            return priorityRank(left.priority) < priorityRank(right.priority);
        }
        // For equal priorities, the earlier ticket is served first.
        return left.arrivalOrder > right.arrivalOrder;
    }
};

class ComplaintSystem {
private:
    // FIFO intake: the first submitted ticket is reviewed first.
    queue<string> intakeQueue;

    // Urgency-based dispatch: High before Medium before Low.
    priority_queue<PriorityItem, vector<PriorityItem>, HigherPriorityFirst> dispatchHeap;

    // Ticket ID -> complaint record; average-case lookup is O(1).
    unordered_map<string, Complaint> tickets;

    int nextId = 1001;
    unsigned long long nextArrivalOrder = 0;

    void addHistory(Complaint& complaint, const string& message) {
        complaint.history.push_back({currentTime(), message});
    }

    string readNonEmptyLine(const string& prompt) {
        string value;
        do {
            cout << prompt;
            getline(cin, value);
            if (cin.eof()) return "";
            if (value.empty()) cout << "Please enter a value.\n";
        } while (value.empty());
        return value;
    }

    int readNumber(const string& prompt, int minimum, int maximum) {
        int value;
        while (true) {
            cout << prompt;
            if (cin >> value && value >= minimum && value <= maximum) {
                cin.ignore(numeric_limits<streamsize>::max(), '\n');
                return value;
            }
            if (cin.eof()) return minimum;
            cout << "Choose a number from " << minimum << " to " << maximum << ".\n";
            cin.clear();
            cin.ignore(numeric_limits<streamsize>::max(), '\n');
        }
    }

    Priority choosePriority() {
        cout << "1. High  2. Medium  3. Low\n";
        const int choice = readNumber("Priority: ", 1, 3);
        if (choice == 1) return Priority::High;
        if (choice == 3) return Priority::Low;
        return Priority::Medium;
    }

    Complaint* findTicket(const string& id) {
        const auto found = tickets.find(id);
        return found == tickets.end() ? nullptr : &found->second;
    }

    void printComplaint(const Complaint& complaint) const {
        cout << "\nTicket: " << complaint.id
             << "\nTitle: " << complaint.title
             << "\nCategory: " << complaint.category
             << "\nReported by: " << complaint.name
             << "\nPriority: " << toString(complaint.priority)
             << "\nStatus: " << complaint.status
             << "\nCreated: " << complaint.createdAt
             << "\nDetails: " << complaint.description << "\n";
    }

public:
    void addComplaint() {
        Complaint complaint;
        ostringstream id;
        id << "RSL-" << setw(4) << setfill('0') << nextId++;
        complaint.id = id.str();
        complaint.name = readNonEmptyLine("Name: ");
        complaint.category = readNonEmptyLine("Category: ");
        complaint.title = readNonEmptyLine("Short title: ");
        complaint.description = readNonEmptyLine("Description: ");
        complaint.priority = choosePriority();
        complaint.status = "New";
        complaint.createdAt = currentTime();
        addHistory(complaint, "Complaint submitted and added to the FIFO intake queue.");

        const string ticketId = complaint.id;
        tickets.emplace(ticketId, complaint);
        intakeQueue.push(ticketId);

        cout << "\nCreated " << ticketId << ". It is waiting in the intake queue.\n";
    }

    void processIntakeQueue() {
        if (intakeQueue.empty()) {
            cout << "The intake queue is empty.\n";
            return;
        }

        int moved = 0;
        while (!intakeQueue.empty()) {
            const string id = intakeQueue.front();
            intakeQueue.pop();
            Complaint* complaint = findTicket(id);
            if (complaint == nullptr || complaint->status != "New") continue;

            complaint->status = "Queued";
            addHistory(*complaint, "Reviewed in FIFO order and moved to the priority dispatch queue.");
            dispatchHeap.push({complaint->id, complaint->priority, nextArrivalOrder++, complaint->priorityVersion});
            ++moved;
        }
        cout << "Moved " << moved << " new ticket(s) from the FIFO queue to priority dispatch.\n";
    }

    void assignHighestPriority() {
        while (!dispatchHeap.empty()) {
            const PriorityItem item = dispatchHeap.top();
            dispatchHeap.pop();
            Complaint* complaint = findTicket(item.ticketId);

            // Skip stale heap entries if a ticket was updated while queued.
            if (complaint == nullptr || complaint->status != "Queued" || item.version != complaint->priorityVersion) continue;

            complaint->status = "In Progress";
            addHistory(*complaint, "Assigned next by the priority queue.");
            cout << "Assigned " << complaint->id << " (" << toString(complaint->priority) << " priority).\n";
            return;
        }
        cout << "No ticket is waiting in the priority dispatch queue.\n";
    }

    void searchTicket() {
        const string id = readNonEmptyLine("Ticket ID (example RSL-1001): ");
        const Complaint* complaint = findTicket(id);
        if (complaint == nullptr) {
            cout << "No ticket found for " << id << ".\n";
            return;
        }
        printComplaint(*complaint);
    }

    void updateStatus() {
        const string id = readNonEmptyLine("Ticket ID: ");
        Complaint* complaint = findTicket(id);
        if (complaint == nullptr) {
            cout << "No ticket found for " << id << ".\n";
            return;
        }

        cout << "1. New  2. In Progress  3. Resolved\n";
        const int choice = readNumber("New status: ", 1, 3);
        const string nextStatus = choice == 1 ? "New" : (choice == 2 ? "In Progress" : "Resolved");
        const string previousStatus = complaint->status;
        if (previousStatus == nextStatus) {
            cout << "Ticket already has that status.\n";
            return;
        }

        // Invalidate a queued heap entry. Reopening places it back in FIFO intake.
        ++complaint->priorityVersion;
        complaint->status = nextStatus;
        addHistory(*complaint, "Status changed from " + previousStatus + " to " + nextStatus + ".");
        if (nextStatus == "New") intakeQueue.push(complaint->id);
        cout << "Status updated to " << nextStatus << ".\n";
    }

    void updatePriority() {
        const string id = readNonEmptyLine("Ticket ID: ");
        Complaint* complaint = findTicket(id);
        if (complaint == nullptr) {
            cout << "No ticket found for " << id << ".\n";
            return;
        }

        const Priority previous = complaint->priority;
        const Priority next = choosePriority();
        if (previous == next) {
            cout << "Ticket already has that priority.\n";
            return;
        }

        complaint->priority = next;
        ++complaint->priorityVersion;
        addHistory(*complaint, "Priority changed from " + toString(previous) + " to " + toString(next) + ".");
        if (complaint->status == "Queued") {
            dispatchHeap.push({complaint->id, complaint->priority, nextArrivalOrder++, complaint->priorityVersion});
        }
        cout << "Priority updated to " << toString(next) << ".\n";
    }

    void showHistory() {
        const string id = readNonEmptyLine("Ticket ID: ");
        const Complaint* complaint = findTicket(id);
        if (complaint == nullptr) {
            cout << "No ticket found for " << id << ".\n";
            return;
        }

        cout << "\nHistory for " << complaint->id << ":\n";
        for (const HistoryEntry& entry : complaint->history) {
            cout << "- " << entry.timestamp << " | " << entry.message << "\n";
        }
    }

    void listTickets() const {
        if (tickets.empty()) {
            cout << "No tickets have been submitted yet.\n";
            return;
        }

        vector<const Complaint*> ordered;
        ordered.reserve(tickets.size());
        for (const auto& item : tickets) ordered.push_back(&item.second);
        // The unordered_map is used for lookup; sorting is only for a readable console list.
        for (size_t i = 0; i < ordered.size(); ++i) {
            for (size_t j = i + 1; j < ordered.size(); ++j) {
                if (ordered[j]->id < ordered[i]->id) swap(ordered[i], ordered[j]);
            }
        }

        cout << "\n--- All tickets ---\n";
        for (const Complaint* complaint : ordered) {
            cout << left << setw(12) << complaint->id
                 << setw(14) << complaint->status
                 << setw(9) << toString(complaint->priority)
                 << complaint->title << "\n";
        }
    }

    void run() {
        cout << "==============================================\n"
             << " Resolve | Complaint & Ticket Management\n"
             << " C++ DSA console demonstration\n"
             << "==============================================\n";

        while (true) {
            cout << "\n1. Submit complaint\n"
                 << "2. Process FIFO intake queue\n"
                 << "3. Assign highest-priority ticket\n"
                 << "4. Search ticket by ID\n"
                 << "5. Update ticket status\n"
                 << "6. View linked-list history\n"
                 << "7. List all tickets\n"
                 << "8. Update ticket priority\n"
                 << "0. Exit\n";
            const int choice = readNumber("Choose: ", 0, 8);
            switch (choice) {
                case 1: addComplaint(); break;
                case 2: processIntakeQueue(); break;
                case 3: assignHighestPriority(); break;
                case 4: searchTicket(); break;
                case 5: updateStatus(); break;
                case 6: showHistory(); break;
                case 7: listTickets(); break;
                case 8: updatePriority(); break;
                case 0:
                    cout << "Good luck with the presentation. Goodbye!\n";
                    return;
            }
        }
    }
};

int main() {
    ComplaintSystem system;
    system.run();
    return 0;
}
