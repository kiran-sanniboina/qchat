"""
Attack Simulation Engine
Provides controlled scenario generators for demonstration of quantum & classical threat detection.
"""

from typing import Dict, Any, Optional
import uuid
from .threat_engine import ThreatType
from .qds import QDSCore
from .e91 import DynamicE91

class AttackSimulator:
    def __init__(self, qds_core: QDSCore, e91: DynamicE91):
        self.qds = qds_core
        self.e91 = e91

    def run_simulation(
        self,
        attack_type: str,
        chat_id: str = "demo_chat",
        sample_message: str = "Confidential financial transfer: $500,000 to Account #8492"
    ) -> Dict[str, Any]:
        """
        Executes an end-to-end attack simulation scenario:
        1. Signs a legitimate baseline message
        2. Applies the specified attack perturbation
        3. Runs verification through the deterministic threat engine
        4. Returns the verdict, evidence, and explanation for UI display
        """
        session_id = f"sim_sess_{uuid.uuid4().hex[:8]}"
        nonce = f"nonce_{uuid.uuid4().hex[:8]}"
        signer_id = "alice_sim"
        verifier_id = "bob_sim"
        key_ab = "sim_shared_secret_quantum_key_2026"

        # Baseline legitimate sign
        signed = self.qds.sign_message(
            message=sample_message,
            session_id=session_id,
            nonce=nonce,
            recipient_id=verifier_id,
            key_material=key_ab,
            num_qubits=32
        )

        # Baseline healthy E91 channel
        channel_eval = self.e91.evaluate_channel()

        # Run verification with simulated attack
        verification = self.qds.verify_message(
            encrypted_message=signed["encryptedMessage"],
            message_hash=signed["messageHash"],
            signature_meta=signed["signatureMeta"],
            session_id=session_id,
            nonce=nonce,
            signer_id=signer_id,
            verifier_id=verifier_id,
            key_material=key_ab,
            e91_status=channel_eval["channelStatus"],
            chsh_s=channel_eval["chshS"],
            qber=channel_eval["qberEstimate"],
            simulate_attack=attack_type
        )

        attack_explanations = {
            ThreatType.CHANNEL_MANIPULATION: "An active eavesdropper attempted to intercept or tamper with entangled Bell pairs on the quantum link. CHSH inequality fell below classical limit (S < 2.0).",
            ThreatType.PASSIVE_EAVESDROP: "Passive eavesdropper was detected on the quantum channel during E91 monitoring (QBER increased, CHSH degraded) before message tampering.",
            ThreatType.FORGERY: "Adversary attempted to forge Alice's Pauli eigenstate quantum signature. Bob's basis measurements produced an unacceptable mismatch rate exceeding tau.",
            ThreatType.REPLAY: "Adversary replayed a previously captured valid signed packet. Caught by the atomic Nonce registry.",
            ThreatType.IMPERSONATION: "Adversary tried to forge the message originating from an unauthorized or spoofed sender identity.",
            ThreatType.UNAUTHORIZED_VERIFICATION: "An unauthorized third party intercepted the packet and attempted verification.",
            ThreatType.TAMPERING: "Adversary tampered with the classical encrypted ciphertext in transit. Caught by SHA-256 integrity check."
        }

        return {
            "attackType": attack_type,
            "simulatedAt": uuid.uuid4().hex,
            "sessionContext": {
                "chatId": chat_id,
                "sessionId": session_id,
                "nonce": nonce,
                "signerId": signer_id,
                "verifierId": verifier_id
            },
            "originalMessage": sample_message,
            "verificationResult": verification,
            "educationalExplanation": attack_explanations.get(attack_type, "Simulated security evaluation"),
            "threatDetected": verification["decision"] == "REJECT",
            "detectedThreatType": verification["detectedAttack"]
        }

