# Interview Forge

**Build interview confidence, one question at a time.**

Interview Forge is a lightweight, browser-based practice app for technical interview preparation. Choose the topics and question types you want to practise, work through a randomized session, and review your results. The current question bank focuses on frontend engineering, with a structure ready to grow to backend, AI engineering, and more.

## Features

- **456 questions** across JavaScript, TypeScript, CSS, HTML & accessibility, React, state & data, frameworks, performance, browser & network, security, testing, tooling, architecture, and coding.
- **Three question formats:** single choice, select all that apply, and short written answers.
- **Custom sessions:** choose 10, 20, 30, or 50 questions and filter by type and topic.
- **Progress tracking:** remembers seen questions, completed sessions, and your best score in your browser.
- **Results and review:** see your score by topic, revisit answers, and retry questions you didn't fully get right.
- **Light and dark themes**, with the initial appearance following your system preference.
- **Keyboard support:** use the number keys to choose an option and Ctrl+Enter (or Cmd+Enter) to check a written answer.

## Run locally

No build step or package installation is required.

1. Download or clone this repository.
2. Open `index.html` in a modern browser.

Alternatively, start a local static server from the project directory:

```bash
python3 -m http.server 8000
```

Then visit [http://localhost:8000](http://localhost:8000).

## Project files

| File | Purpose |
| --- | --- |
| `index.html` | Page structure and asset references |
| `styles.css` | Layout, components, and theme styles |
| `question-bank.js` | Interview question and answer data |
| `quiz-app.js` | Session setup, quiz interactions, scoring, and review |

## Privacy and progress

The app does not require an account or backend. Quiz progress and theme preference are stored in the browser's `localStorage` on your device. Use **Reset progress** on the setup screen to clear saved quiz progress.

The app loads its display fonts from Google Fonts when a network connection is available; system font fallbacks are provided.

## License

No license has been specified yet. Add a `LICENSE` file before publishing if you want to grant others explicit permission to use, modify, or distribute the project.
