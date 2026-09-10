const problems = [
  {
    id: 'parking-lot',
    title: 'Design a Parking Lot',
    difficulty: 'Medium',
    tags: ['OOP', 'Design Patterns', 'State Management'],
    description:
      'Design an object-oriented system for a multi-floor parking lot that handles vehicle entry, exit, and spot assignment. The lot supports motorcycles, cars, and trucks.',
    requirements: [
      'The lot has multiple floors, each with multiple spots of three sizes: small, medium, and large.',
      'Each vehicle type maps to a minimum spot size: motorcycle → small, car → medium, truck → large.',
      'On entry, assign the nearest available spot that fits the vehicle.',
      'On exit, free the spot and compute the parking fee based on duration and vehicle type.',
      'The system must handle a full lot gracefully (no crash, no invalid assignment).',
      'Provide a way to query available spots per floor.',
    ],
    hints: [
      'Think about what responsibilities belong to ParkingLot vs ParkingFloor vs ParkingSpot.',
      'How would you represent spot assignment and vehicle tracking?',
      'Consider an interface or strategy for fee calculation so rates can change per vehicle type.',
      'What is the contract between a Ticket and the rest of the system?',
    ],
    constraints: [
      'No need for a real database — in-memory state is fine for the prototype.',
      'Do not over-engineer: a working CLI or API is better than a polished frontend.',
      'Focus on clear class responsibilities and extension points.',
    ],
  },
  {
    id: 'elevator-system',
    title: 'Design an Elevator System',
    difficulty: 'Medium',
    tags: ['State Machine', 'Scheduling', 'OOP'],
    description:
      'Design a system that manages one or more elevators in a building. The system accepts floor requests from inside an elevator (cabin requests) and from floor panels (external requests), and dispatches elevators efficiently.',
    requirements: [
      'Support multiple elevators in a building with N floors.',
      'Accept internal requests (passenger presses a floor button inside the elevator).',
      'Accept external requests (someone presses Up or Down on a floor panel).',
      'Dispatch the most suitable elevator for each external request.',
      'An elevator has states: IDLE, MOVING_UP, MOVING_DOWN, DOOR_OPEN.',
      'Elevator doors open and close before/after each stop.',
    ],
    hints: [
      'Model the Elevator as a state machine. What are the valid transitions?',
      'The dispatcher is a separate concern — it decides which elevator to send.',
      'How do you represent a pending request queue inside an elevator?',
      'A simple nearest-elevator algorithm is fine; note how you would swap it later.',
    ],
    constraints: [
      'Single building, synchronous simulation is acceptable.',
      'Keep the dispatcher swappable — think strategy or dependency injection.',
      'Edge cases: request for current floor, elevator already full, emergency stop.',
    ],
  },
  {
    id: 'vending-machine',
    title: 'Design a Vending Machine',
    difficulty: 'Easy',
    tags: ['State Machine', 'OOP', 'Payments'],
    description:
      'Design the core logic of a vending machine that accepts coins, allows item selection, dispenses items, and returns change. The machine must handle invalid states safely.',
    requirements: [
      'The machine holds a configurable inventory of items, each with a name, price, and quantity.',
      'Accepted coins: 1, 2, 5, 10 rupee denominations.',
      'States: IDLE → HAS_MONEY → DISPENSING → RETURNING_CHANGE.',
      'If the selected item is out of stock or the inserted amount is insufficient, return an appropriate error and refund coins.',
      'After dispense, return exact change using available coin denominations.',
      'Admin operations: restock item, add coins to the change reserve.',
    ],
    hints: [
      'Start with the state machine — what events cause state transitions?',
      'Keep the change-calculation logic isolated from the dispense logic.',
      'Inventory and coin reserve are separate concerns inside the machine.',
      'How would you add a new payment method (e.g., card) without rewriting everything?',
    ],
    constraints: [
      'In-memory state only.',
      'No UI required — a clean API or test suite demonstrating all states is sufficient.',
      'Edge case: exact change not possible — what happens?',
    ],
  },
  {
    id: 'library-management',
    title: 'Design a Library Management System',
    difficulty: 'Hard',
    tags: ['OOP', 'Search', 'Relationships', 'Reservations'],
    description:
      'Design a library system that manages books, members, borrowing, returns, reservations, and overdue fines. Multiple copies of the same book can exist.',
    requirements: [
      'A Book has a title, author, ISBN, and category. Multiple physical BookItems can exist per Book.',
      'Members can borrow up to 5 books at a time; max loan period is 14 days.',
      'If a BookItem is borrowed, a member can reserve it; reservation expires after 3 days once the book is returned.',
      'Overdue fines: Rs 2 per day per book item after the due date.',
      'Search books by title, author, or ISBN.',
      'Track borrowing history per member.',
    ],
    hints: [
      'Distinguish Book (catalogue entry) from BookItem (physical copy) clearly.',
      'Who owns the borrow/return logic — the Member, the BookItem, or a BorrowingService?',
      'Reservation queue: first come, first served. How do you model expiry?',
      'Fine calculation: isolate it so the rule can change without touching Member or BookItem.',
    ],
    constraints: [
      'In-memory storage is fine.',
      'Caller should receive clear error types for: overdue, reservation conflict, limit exceeded.',
      'Focus on relationship design and responsibility distribution.',
    ],
  },
  {
    id: 'chess-game',
    title: 'Design a Chess Game',
    difficulty: 'Hard',
    tags: ['OOP', 'Design Patterns', 'Game Logic'],
    description:
      'Design the core logic of a two-player chess game: piece representation, move validation, check detection, and game-state management. A playable game loop via CLI or API.',
    requirements: [
      'All six piece types with correct movement rules: King, Queen, Rook, Bishop, Knight, Pawn.',
      'Move validation: only legal moves allowed, including castling and en passant.',
      'Detect check, checkmate, and stalemate.',
      'Alternate turns between two players; reject out-of-turn moves.',
      'Game ends on checkmate, stalemate, or resignation.',
      'Represent the board and provide a display method.',
    ],
    hints: [
      'Each piece subclass owns its movement rules — polymorphism is your friend.',
      'A MoveValidator service keeps illegal-move logic out of the Piece classes.',
      'How do you detect check without duplicating board logic?',
      'Consider the Command pattern to support undo — even if you only note the extension point.',
    ],
    constraints: [
      'No GUI needed — a text board representation is enough.',
      'Full chess variant rules (50-move rule, threefold repetition) are optional.',
      'Show clear class hierarchy and how you would add a new piece type.',
    ],
  },
];

module.exports = problems;
