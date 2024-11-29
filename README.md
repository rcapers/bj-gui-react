# Blackjack React Game

Welcome to the Blackjack React Game! This is a simple yet engaging implementation of the classic Blackjack game using React and Zustand for state management.

## Features
- **Interactive Gameplay:** Enjoy a smooth and interactive experience with animations and sound effects.
- **Sound Effects:** Optional sound effects for card dealing, winning, losing, and more.
- **Hints System:** Get basic strategy hints to improve your gameplay (optional).
- **Statistics Tracking:** Track your wins, losses, and other game statistics.

## Gameplay Rules
- The goal is to beat the dealer's hand without going over 21.
- Face cards (King, Queen, Jack) are worth 10 points.
- Aces are worth 1 or 11 points, whichever is more favorable.
- Each player starts with two cards, one of the dealer's cards is hidden until the end.
- "Hit" to ask for another card. "Stand" to hold your total and end your turn.
- If you go over 21 you bust, and the dealer wins regardless of the dealer's hand.
- If you are dealt 21 from the start (Ace & 10), you got a blackjack.
- Dealer will hit until their cards total 17 or higher.

## Setup Instructions

### Prerequisites
- Node.js (version 16 or higher)
- npm (version 8 or higher)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/rcapers/bj-gui-react.git
   ```
2. Navigate into the project directory:
   ```bash
   cd bj-gui-react
   ```
3. Install the dependencies:
   ```bash
   npm install
   ```

### Running the Game
To start the development server, run:
```bash
npm run dev
```
This will open the game in your default web browser. You can now play the game and make changes to the code, which will automatically reload the game.

### Building for Production
To build the app for production, run:
```bash
npm run build
```
This will create an optimized build of the game in the `build` folder.

## Contributing
Feel free to fork the repository and submit pull requests. Any contributions are welcome!

## License
This project is licensed under the MIT License.
