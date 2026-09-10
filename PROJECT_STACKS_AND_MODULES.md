# QChat: Stacks and Modules

## Purpose

QChat is a full-stack, WhatsApp Web-style messenger with realtime chat, media sharing, authentication, delivery states, and an explainable quantum-security demonstration layer. The application is split into three services so the chat platform, persistence, and quantum simulation responsibilities remain independently deployable.

## 1. Stack at a Glance

| Area | Technology | Why it is used |
| --- | --- | --- |
| Frontend | React 19 | Builds the interactive single-page messenger UI from reusable components. |
| Frontend tooling | Vite 8 | Provides fast local development, module bundling, and production builds. |
| Frontend styling | Tailwind CSS 3, PostCSS, Autoprefixer | Provides utility-first responsive styling and browser-compatible CSS processing. |
| Frontend API | Axios | Centralizes REST calls, base URL handling, JWT attachment, and 401 handling. |
| Frontend realtime | Socket.IO Client | Receives messages, presence, typing, delivery, reaction, and security events without polling. |
| Backend runtime | Node.js 20 | Runs the high-throughput chat API and realtime gateway. |
| Backend API | Express 4 | Exposes authenticated REST endpoints for users, chats, messages, media, and security. |
| Backend database layer | MongoDB 6 with Mongoose 8 | Stores flexible chat-oriented documents and provides schemas, validation, and queries. |
| Backend realtime | Socket.IO 4 | Manages authenticated websocket-style connections, rooms, presence, and event delivery. |
| Quantum service | Python 3.12 with FastAPI | Exposes the QDS simulation through a small, typed HTTP microservice. |
| Quantum simulation | Qiskit 1.x and Qiskit Aer 0.14+ | Models Bell pairs, E91 measurements, and teleportation circuits in a simulator. |
| Numerical work | NumPy | Performs measurement, noise, sampling, and matrix-related calculations. |
| Classical cryptography | AES-GCM and SHA-256 | Provides message confidentiality and integrity alongside the simulated QDS layer. |
| Deployment | Docker Compose, Docker, Render | Runs the services locally as a coordinated stack and supports cloud deployment. |
| Static hosting | Nginx | Serves the compiled React application in the production frontend container. |

## 2. Runtime and Service Architecture

### Frontend service

The React/Vite single-page application runs the WhatsApp Web-style experience in `frontend/`. It manages authentication state, chat selection, message rendering, media and voice interactions, security dashboards, and modal workflows. It talks to the Node backend over REST and Socket.IO.

### Node.js backend service

The Express service in `backend/` is the application orchestrator. It owns user accounts, chats, messages, file uploads, JWT authentication, MongoDB persistence, realtime events, email integrations, and calls to the QDS service. It listens on port 5000 by default.

### Python QDS service

The FastAPI service in `qds-service/` is responsible for the quantum-security demonstration. It evaluates Dynamic E91 channel health, signs and verifies messages, simulates quantum teleportation, classifies threats, runs attack simulations, and returns benchmark data. It listens on port 8000 by default.

### MongoDB

MongoDB stores users, chats, messages, security sessions, threat logs, and nonce records. Mongoose schemas keep the document shapes and common indexes close to the application code.

### Service communication

The browser calls the Node API through Axios and opens a Socket.IO connection for realtime events. The Node service calls the Python QDS service through Axios for session initialization, message signing and verification, E91 refreshes, attack simulations, teleportation playback, and benchmark queries. Docker Compose connects all services on a private `qchat-network`.

## 3. Direct Dependencies and Why They Are Used

### Node.js backend dependencies

| Package | Role in QChat |
| --- | --- |
| `express` | HTTP server, middleware pipeline, and REST route handling. |
| `mongoose` | MongoDB connection, schemas, models, validation, and document queries. |
| `socket.io` | Realtime bidirectional events, chat rooms, presence, typing indicators, and delivery updates. |
| `jsonwebtoken` | Creates and verifies bearer tokens used to protect API and Socket.IO connections. |
| `bcryptjs` | Hashes passwords and compares login credentials without storing plaintext passwords. |
| `cors` | Allows the separately hosted frontend to call the backend. |
| `dotenv` | Loads local environment configuration such as database URLs, JWT secrets, and service URLs. |
| `axios` | Calls the QDS microservice and optional external email providers. |
| `multer` | Parses multipart file uploads and writes uploaded media to the backend upload directory. |
| `uuid` | Creates unique identifiers for uploads and message/security metadata. |
| `nodemailer` | Sends password-reset mail through configured SMTP or provider integrations. |

### Frontend dependencies

| Package | Role in QChat |
| --- | --- |
| `react` | Component model and stateful UI for the messenger. |
| `react-dom` | Mounts the React application into the browser document. |
| `axios` | REST client with a shared API instance and JWT interceptor. |
| `socket.io-client` | Connects the browser to the authenticated realtime backend. |
| `lucide-react` | Supplies consistent icons for chat, security, media, navigation, and status controls. |
| `qrcode.react` | Renders the QR code used by the device-pairing authentication flow. |
| `tailwindcss` | Utility classes and custom QChat/quantum color tokens for the UI. |
| `postcss` | CSS transformation pipeline used by Tailwind. |
| `autoprefixer` | Adds browser vendor prefixes during CSS processing. |
| `@tailwindcss/postcss` | Integrates the Tailwind CSS processor with the PostCSS pipeline. |

### Frontend development dependencies

| Package | Role in QChat |
| --- | --- |
| `vite` | Development server, dependency pre-bundling, and production bundling. |
| `@vitejs/plugin-react` | Enables React support and JSX transformation in Vite. |
| `oxlint` | Fast linting for the frontend source. |
| `@types/react` and `@types/react-dom` | Type metadata for React packages and editor/tooling support, even though the app source is JSX. |

### Python QDS dependencies

| Package | Role in QChat |
| --- | --- |
| `fastapi` | Defines the quantum-security HTTP API and health endpoints. |
| `uvicorn` | ASGI server used to run the FastAPI application. |
| `pydantic` | Validates and documents request payloads for signing, verification, E91, attack, and teleportation endpoints. |
| `qiskit` | Provides quantum circuits and quantum-information primitives. |
| `qiskit-aer` | Runs the quantum circuits locally through the Aer simulator; no physical quantum hardware is required. |
| `numpy` | Supports probability, sampling, noise, correlation, and QBER calculations. |
| `cryptography` | Supplies the `AESGCM` implementation used by the QDS message pipeline. |

### Test dependencies used by the QDS test suite

| Package | Role in QChat |
| --- | --- |
| `pytest` | Runs the QDS verification tests. It is imported by `qds-service/test_qds_core.py`. |
| `numpy` | Supports numerical assertions and expected quantum-state calculations in tests. |

## 4. Backend Modules

### Application entry point and transport

| Module | Responsibility and reason for use |
| --- | --- |
| `backend/src/server.js` | Creates the Express app and HTTP server, enables CORS and JSON parsing, serves uploads, mounts route groups, connects MongoDB, exposes health checks, and initializes Socket.IO. |
| `backend/src/socket.js` | Authenticates Socket.IO clients with JWTs, joins user/chat rooms, broadcasts presence changes, and handles typing and disconnect events. |
| `backend/src/middleware/auth.js` | Reusable JWT middleware that protects REST endpoints and attaches the authenticated user to the request. |

### Routes

| Module | Responsibility and reason for use |
| --- | --- |
| `backend/src/routes/authRoutes.js` | Groups registration, login, password reset, email status, QR pairing, profile, user search, and block/unblock endpoints. |
| `backend/src/routes/chatRoutes.js` | Groups chat creation, chat retrieval, message retrieval, read state, backup/restore, pin/mute, and storage operations. |
| `backend/src/routes/messageRoutes.js` | Groups message creation, editing, deletion, reactions, starring, forwarding, and starred-message retrieval. |
| `backend/src/routes/securityRoutes.js` | Groups security status, threats, E91 refresh, attack simulation, benchmark, and teleportation playback endpoints. |
| `backend/src/routes/mediaRoutes.js` | Protects the media upload endpoint and applies Multer to multipart form data. |

### Controllers

| Module | Responsibility and reason for use |
| --- | --- |
| `backend/src/controllers/authController.js` | Implements account registration/login, password recovery, QR-linked sessions, profile updates, user search, and blocking. |
| `backend/src/controllers/chatController.js` | Implements chat creation and retrieval, group operations, backups, storage management, pin/mute behavior, and QDS session initialization. |
| `backend/src/controllers/messageController.js` | Implements message send/edit/delete, read receipts, reactions, starring, forwarding, AES-GCM handling, nonce registration, and QDS sign/verify calls. |
| `backend/src/controllers/mediaController.js` | Validates and stores uploaded files, assigns unique filenames, and returns media URLs for messages and profiles. |
| `backend/src/controllers/securityController.js` | Adapts QDS service results for the security dashboard, persists threat logs and sessions, and exposes simulations and benchmark results. |

### Data models

| Module | Responsibility and reason for use |
| --- | --- |
| `backend/src/models/User.js` | Stores identity, profile fields, authentication-related state, blocked users, and account preferences. |
| `backend/src/models/Chat.js` | Stores direct/group chat membership, names, avatars, pin/mute state, and chat metadata. |
| `backend/src/models/Message.js` | Stores message content, sender, attachments, delivery/read state, reactions, stars, edits, forwards, and QDS metadata. |
| `backend/src/models/SecuritySession.js` | Stores the E91/QDS security state associated with a chat session. |
| `backend/src/models/ThreatLog.js` | Records detected attack type, severity, reason, and related verification context for the dashboard. |
| `backend/src/models/NonceRegistry.js` | Provides persistent replay protection by recording message nonces that have already been consumed. |

### Utilities

| Module | Responsibility and reason for use |
| --- | --- |
| `backend/src/utils/cryptoHelper.js` | Wraps Node's built-in crypto APIs for SHA-256 hashing, key derivation, and AES-256-GCM encryption/decryption. |
| `backend/src/utils/mailer.js` | Provides a provider-aware password-reset mailer with SMTP and HTTP-provider options, while reporting configuration status. |

## 5. Python Quantum Modules

| Module | Main class or role | Why it is used |
| --- | --- | --- |
| `qds-service/main.py` | FastAPI application and request models | Provides the QDS HTTP contract, health checks, session cache, signing/verification routes, attack routes, E91 routes, teleportation playback, and benchmark matrix. |
| `qds-service/quantum/e91.py` | `DynamicE91` | Creates Bell pairs, measures the four CHSH settings, estimates QBER, applies simulated noise/interception, and reports channel status. |
| `qds-service/quantum/teleportation.py` | `QuantumTeleporter` | Builds the three-qubit teleportation circuit, prepares Pauli eigenstates, applies corrections, measures fidelity, and exposes step-by-step data for the UI visualizer. |
| `qds-service/quantum/qds.py` | `QDSCore` | Binds a message to session, nonce, and recipient metadata; derives a key; hashes and encrypts the message; maps hash chunks to Pauli states; and verifies the returned signature. |
| `qds-service/quantum/threat_engine.py` | `DeterministicThreatEngine`, `ThreatType` | Applies a strict, explainable priority cascade for channel manipulation, passive eavesdropping, unauthorized verification, replay, impersonation, tampering, forgery, and valid messages. |
| `qds-service/quantum/attack_sim.py` | `AttackSimulator` | Creates reproducible demonstration scenarios for the supported attack types and feeds them through the same verification/threat logic used by normal messages. |
| `qds-service/test_qds_core.py` | QDS test suite | Verifies E91 behavior, teleportation fidelity, end-to-end signing/verification, and deterministic classification of the attack scenarios. |

### Quantum protocol building blocks

- Dynamic E91 monitoring uses Bell-pair correlations, the CHSH S-value, and QBER to estimate whether the simulated channel remains healthy.
- QDS message binding uses SHA-256 over message and session metadata, then converts two-bit chunks into Pauli eigenstate labels.
- Teleportation uses Qiskit circuits and Pauli corrections to move each signature qubit through the simulated channel.
- AES-256-GCM protects message confidentiality and authenticity at the classical layer.
- The threat engine remains rule-based so every security decision can be explained in the dashboard and tested deterministically.

## 6. Frontend Modules

### Application shell and integration

| Module | Responsibility and reason for use |
| --- | --- |
| `frontend/src/main.jsx` | Mounts React in `StrictMode`, installs the error boundary, and loads global CSS. |
| `frontend/src/App.jsx` | Owns top-level authentication, chat selection, message state, realtime event subscriptions, security alerts, and modal visibility. |
| `frontend/src/api.js` | Creates the Axios client, normalizes the API base URL, attaches the JWT, and clears stale credentials after a 401 response. |
| `frontend/src/socket.js` | Creates and tears down the authenticated Socket.IO client and sets reconnection behavior. |
| `frontend/src/index.css` | Loads Tailwind layers and defines the global WhatsApp-style theme, scrollbar treatment, chat background, and security animations. |
| `frontend/src/App.css` | Holds application-level CSS that is separate from the global Tailwind entry point. |
| `frontend/src/utils/avatarHelper.js` | Resolves avatar and media URLs and provides image-error fallback helpers. |

### UI components

| Module | Responsibility and reason for use |
| --- | --- |
| `AuthModal.jsx` | Login, registration, password reset, and QR-pairing entry flow. |
| `Sidebar.jsx` | Chat list, search/navigation actions, profile access, security access, storage, starred messages, and logout. |
| `ChatWindow.jsx` | Main conversation surface, messages, attachments, reactions, editing, forwarding, voice messages, location/contact sharing, and verification indicators. |
| `SecurityDashboard.jsx` | Displays E91 health, threats, benchmarks, attack simulation, and quantum-security status. |
| `TeleportationCircuitVisualizer.jsx` | Animates and explains the simulated teleportation stages used by the security flow. |
| `VerificationDetailModal.jsx` | Shows message-level QDS verification details and threat results. |
| `ErrorBoundary.jsx` | Prevents a component error from taking down the entire UI and provides recovery actions. |

### Supporting workflows and modals

| Module | Responsibility and reason for use |
| --- | --- |
| `NewChatModal.jsx` | Searches users and creates direct or group chats. |
| `ChatProfileModal.jsx` | Shows chat/contact information and chat actions such as backup, clear, mute, pin, and block. |
| `UserProfileModal.jsx` | Edits profile information and avatar data. |
| `ChatBackupModal.jsx` | Downloads or restores encrypted chat backup data. |
| `StorageManagerModal.jsx` | Reports storage usage and clears chat media/storage. |
| `StarredMessagesModal.jsx` | Finds and opens starred messages. |
| `ForwardModal.jsx` | Selects chats and forwards an existing message. |
| `VoiceRecorder.jsx` | Captures browser audio and uploads it through the message flow. |
| `EmojiStickerPicker.jsx` | Provides emoji and quantum-themed sticker selection. |
| `LocationShareModal.jsx` | Requests browser location and prepares a location message. |
| `ContactShareModal.jsx` | Selects or composes contact details for sharing in a chat. |

## 7. Configuration and Deployment Modules

| File or module | Why it is used |
| --- | --- |
| `package.json` at the repository root | Provides convenience scripts for starting the QDS service, backend, and frontend, plus the QDS test command. |
| `frontend/vite.config.js` | Enables the React plugin in Vite. |
| `frontend/tailwind.config.js` | Defines scanned source paths, dark-mode behavior, WhatsApp color tokens, quantum colors, and the sans-serif font stack. |
| `frontend/postcss.config.js` | Connects Tailwind and Autoprefixer to the CSS build. |
| `docker-compose.yml` | Starts MongoDB, the QDS service, backend, and frontend together with service dependencies, ports, network, and persistent database volume. |
| `backend/Dockerfile` | Packages the Node backend on Node 20 Alpine. |
| `qds-service/Dockerfile` | Packages the FastAPI service on Python 3.12 slim and installs its quantum dependencies. |
| `frontend/Dockerfile` | Builds the React bundle with Node 20, then serves it from Nginx Alpine. |
| `render.yaml` | Describes the three Render services and their environment-variable wiring for cloud deployment. |
| `backend/.env` | Holds local backend environment values such as MongoDB, JWT, frontend, QDS, and mail configuration. |

## 8. Data and Platform Facilities

- MongoDB is the primary durable data store for application and security records.
- The backend `uploads/` directory is the local media store for uploaded profile images, chat attachments, and voice files.
- Browser `localStorage` keeps the current JWT and cached user object so a browser refresh can restore the authenticated session.
- Environment variables keep deployment-specific URLs and secrets outside the source code during normal operation.
- Docker volumes preserve MongoDB data across container restarts in local Compose development.

## 9. Testing and Operational Checks

- The QDS suite exercises channel evaluation, teleportation fidelity, signing and verification, and the threat cascade.
- FastAPI and Node health endpoints are provided for service status checks and deployment probes.
- The QDS benchmark endpoint caches its experiment matrix in memory for five minutes to make dashboard requests responsive.
- The backend includes a QDS keep-alive/status check so the orchestrator can detect when the quantum service is unavailable.

## 10. End-to-End Message Flow

1. The React client authenticates through the Node API and opens a Socket.IO connection using the JWT.
2. The backend stores users, chats, and message metadata in MongoDB.
3. When a message is sent, the backend creates a nonce, computes classical protection data, and requests QDS signing from the Python service.
4. The Python service encrypts and hashes the message, maps the binding to Pauli states, and simulates teleportation.
5. The backend stores the signed message and emits realtime events to the relevant Socket.IO rooms.
6. On receipt, the backend or receiving path invokes QDS verification, checks nonce and identity conditions, and records any threat.
7. The frontend renders delivery state, verification status, and security alerts in the chat and Security Dashboard.

## 11. Important Scope Note

The quantum layer is a software simulation implemented with Qiskit Aer. It demonstrates the protocol, measurements, threat logic, and user experience; it does not connect to physical quantum hardware or claim unconditional security.

