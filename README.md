# QChat: WhatsApp Web–Style Messenger Secured by a Quantum Digital Signature (QDS) Layer

QChat is a full-stack, real-time web messenger that replicates the user experience of **WhatsApp Web** (QR-linked sessions, contacts list, 1:1 and group chats, media sharing, delivery/read receipts, typing indicators, and online presence) while replacing conventional digital signature authentication with a **simulated teleportation-based Quantum Digital Signature (QDS)** system, backed by a **Dynamic E91 quantum entanglement monitor** and an explainable, **deterministic rule-based threat-detection engine**.

---

## ⚠️ Security Claims to Avoid (Important Disclaimer)

> **Protocal & Simulation Notice:**
> - **Simulated Hardware:** All quantum circuits, Bell pairs, Pauli eigenstates, and teleportation operations run inside a **Qiskit Aer** statevector simulator in a Python microservice. There is **no physical quantum hardware** involved.
> - **No "Unconditional Security" Claims:** Do not claim that this system provides "unconditional," "unbreakable," or "absolute" physical quantum security. Security is achieved **under the assumed mathematical protocol, noise models, and classical cryptographic primitives (AES-256-GCM, SHA-256)**.
> - **CHSH & E91 Bounds:** Violation of the classical Bell inequality ($|S| > 2.0$, approaching Tsirelson's bound $2\sqrt{2} \approx 2.828$) indicates quantum correlation in the mathematical simulation. In real-world physical systems, Bell tests require loophole-free detection apparatus and trusted measurement devices to prevent side-channel leakage.

---

## High-Level Architecture

```
┌────────────────────────────────────────────────────────┐
│               REACT FRONTEND (Vite + SPA)              │
│  - WhatsApp Web UI (chats, 1:1, groups, media, ticks)  │
│  - Real-time Socket.io client & presence / typing      │
│  - QDS Delivery states: Sent / Delivered / Read / 🛡️  │
│  - Security & Threat Dashboard + Attack Simulator      │
└───────────────────────────▲────────────────────────────┘
                            │ HTTPS / WSS
┌───────────────────────────▼────────────────────────────┐
│             NODE.JS / EXPRESS BACKEND (Port 5000)      │
│  - JWT Auth (bcrypt), Chats, Messages, Media (multer)  │
│  - Socket.io Server (real-time events, presence)       │
│  - AES-256-GCM + SHA-256 classical crypto pipeline    │
│  - Atomic Nonce Registry for Replay Attack detection   │
│  - MongoDB (Users, Chats, Messages, Threats, Sessions) │
└───────────────────────────▲────────────────────────────┘
                            │ REST (Internal: Port 8000)
┌───────────────────────────▼────────────────────────────┐
│            PYTHON "QDS CORE" SERVICE (FastAPI)         │
│  - Dynamic E91 Entanglement & CHSH S-value & QBER      │
│  - 3-Qubit Quantum Teleportation (Bell + Pauli Corr)   │
│  - QDS Message Binding: SHA256 -> Pauli Eigenstates    │
│  - Bob Verification in matching bases & mismatch rate  │
│  - Deterministic Rule-based Threat Detection Engine    │
│  - 7 Attack Simulators (Forgery, Replay, etc.)         │
│  - Qiskit & Qiskit Aer Statevector Simulation          │
└────────────────────────────────────────────────────────┘
```

---

## The Security Protocol

### 1. Dual-Layer Protection (Classical + Quantum)
- **Classical Integrity:** `message_hash = SHA256(message)` (one-way, deterministic).
- **Classical Confidentiality:** `encrypted_message = AES-GCM-Encrypt(message, key_AB)` with 96-bit unique IV and 128-bit authentication tag.
- Only the ciphertext and integrity hash travel across the wire; plaintext is kept local.

### 2. Message-to-Signature Binding
```
binding_value = SHA256(message || session_id || nonce || recipient_id)
```
The 256-bit hash digest is split into 2-bit chunks and mapped to Pauli eigenstates:
- `00` $\to |0\rangle$
- `01` $\to |1\rangle$
- `10` $\to |+\rangle = \frac{|0\rangle + |1\rangle}{\sqrt{2}}$
- `11` $\to |-\rangle = \frac{|0\rangle - |1\rangle}{\sqrt{2}}$

### 3. Simulated 3-Qubit Teleportation
Each signature qubit is transferred from Alice to Bob using an entangled Bell state $|\Phi^+\rangle = \frac{|00\rangle + |11\rangle}{\sqrt{2}}$:
1. Alice performs a Bell measurement on her signature qubit and her half of the Bell pair $\to$ yields 2 classical correction bits $(c_0, c_1)$.
2. The 2 classical bits are transmitted to Bob.
3. Bob applies the deterministic Pauli correction:
   - `00` $\to I$
   - `01` $\to X$
   - `10` $\to Z$
   - `11` $\to XZ$

### 4. Dynamic E91 Channel Monitoring
- Run per session to establish quantum channel baseline.
- Alice angles: $a_1 = 0$, $a_2 = \pi/4$.
- Bob angles: $b_1 = \pi/8$, $b_2 = -\pi/8$.
- CHSH correlation: $S = E(a_1,b_1) + E(a_1,b_2) + E(a_2,b_1) - E(a_2,b_2)$.
- Bound: $|S| \le 2.0$ (classical bound / eavesdropping); $|S| \to 2\sqrt{2} \approx 2.828$ (healthy quantum channel).
- Calculates Quantum Bit Error Rate (QBER) on sifted key bits.

### 5. Deterministic Threat Detection Engine
Evaluated strictly in priority order (100% explainable, zero black-box ML):
```python
if not e91_channel_secure:
    if is_hash_matching and mismatch_rate <= threshold:
        # CHSH degraded & QBER elevated, but message signature uncorrupted
        -> "PASSIVE_EAVESDROP"
    else:
        -> "CHANNEL_MANIPULATION"
elif verifier_not_authorized:
    -> "UNAUTHORIZED_VERIFICATION"
elif nonce_already_seen:
    -> "REPLAY"
elif signer_identity_invalid:
    -> "IMPERSONATION"
elif message_hash_mismatch_after_decrypt:
    -> "TAMPERING"
elif mismatch_rate > threshold:
    -> "FORGERY"
else:
    -> "VALID" (ACCEPT)
```

---

## 4-Tier Delivery States (WhatsApp Web Extended)

Messages in QChat progress through four delivery states indicated by ticks:
1. **Sent:** Single gray tick (&check;)
2. **Delivered:** Double gray ticks (&check;&check;)
3. **Read:** Double blue ticks (&check;&check;)
4. **QDS State:**
   - **Verified (&check;&check; 🛡️✅):** Quantum digital signature and classical integrity verified with mismatch rate $\le \tau$.
   - **Rejected (🛡️⚠️):** Threat detected by the deterministic engine.

---

## Running the Application

### Option A: Local Development (Instant)

#### 1. Start Python QDS Core
```bash
cd qds-service
python -m pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

#### 2. Start Node.js Backend
Ensure MongoDB is running (e.g. `mongodb://localhost:27017/qchat`):
```bash
cd backend
npm install
npm run dev
```

#### 3. Start React Frontend
```bash
cd frontend
npm install
npm run dev
```

Open your browser at `http://localhost:5173`.

> **Convenience Script (Windows):** Simply double-click `start-dev.bat` in the root directory to launch all three services automatically!

---

### Option B: Docker Compose
```bash
docker-compose up --build
```
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000`
- Python QDS Core: `http://localhost:8000`
- MongoDB: `localhost:27017`

---

## Testing & Automated Verifications

Run the comprehensive unit test suite in `qds-service`:
```bash
cd qds-service
python -m pytest test_qds_core.py -v
```

This suite verifies:
1. **Dynamic E91 Ideal Channel:** $S \approx 2.828 \pm 0.05$ (Tsirelson bound) and QBER $\le 0.05$.
2. **Dynamic E91 Under Eavesdropping:** $S$ degradation and high QBER ($> 20\%$).
3. **Teleportation Pauli Fidelity:** 100% reconstruction on all 4 states ($|0\rangle, |1\rangle, |+\rangle, |-\rangle$) with Pauli corrections.
4. **End-to-End QDS Sign & Verify:** Deterministic state generation and zero mismatch verification.
5. **Deterministic Threat Cascade:** Validates that each of the 7 attacks (`FORGERY`, `REPLAY`, `IMPERSONATION`, `CHANNEL_MANIPULATION`, `PASSIVE_EAVESDROP`, `UNAUTHORIZED_VERIFICATION`, `TAMPERING`) is strictly classified according to the priority hierarchy.

