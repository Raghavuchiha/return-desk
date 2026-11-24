export const sampleReturns = [
  { id: 6, customer: "Raj Mehta", email: "raj@example.com", order: "ORD-1042", reason: "Not As Described", status: "Open" },
  { id: 5, customer: "Priya Shah", email: "priya@example.com", order: "ORD-1043", reason: "Damaged", status: "In Review" },
  { id: 4, customer: "Amit Rao", email: "amit@example.com", order: "ORD-1044", reason: "Wrong Item", status: "Approved" },
  { id: 3, customer: "Neha Jain", email: "neha@example.com", order: "ORD-1045", reason: "Changed Mind", status: "Rejected" },
  { id: 2, customer: "Arjun Kale", email: "arjun@example.com", order: "ORD-1046", reason: "Size Issue", status: "Completed" },
  { id: 1, customer: "Isha Patil", email: "isha@example.com", order: "ORD-1047", reason: "Damaged", status: "Open" },
].map((item) => ({ ...item, reference: "RET-" + item.id }));