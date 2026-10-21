# 🎙️ Random Talk - Real-Time Video Chat Platform

A full-stack, peer-to-peer (P2P) anonymous video chat application where users can connect with random strangers worldwide.

## 🔗 Live Demo
👉 **[Click here to view the Live Project](https://random-talk-psi.vercel.app)**

## ✨ Features
- **Real-time Video/Audio:** Seamless P2P connection using WebRTC.
- **Smart Matching:** Matches users based on selected country and interests.
- **Secure Authentication:** Google OAuth & Email/Password login via Firebase.
- **Interactive UI:** Built with React and Tailwind CSS (Glassmorphism & 3D buttons).
- **Moderation System:** Auto-ban after 5 reports + interactive reporting dashboard.
- **Responsive Design:** Mobile-first UI with swipe-to-skip gestures.

## 🛠️ Tech Stack
- **Frontend:** React.js, Vite, Tailwind CSS, Socket.io-client
- **Backend:** Node.js, Express.js, Socket.io, MongoDB
- **Services:** Firebase Auth, WebRTC, Metered (TURN Server), Vercel, Render

## 🚀 How to Run Locally
1. Clone the repo: `git clone https://github.com/alok10112004/Random-talk.git`
2. Install dependencies: `npm install`
3. Setup `.env` files for both `client` and `server`.
4. Run frontend: `cd client && npm run dev`
5. Run backend: `cd server && npm run dev`
