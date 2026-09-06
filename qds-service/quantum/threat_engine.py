"""
Deterministic Threat-Detection Engine
Implements strict rule-based, priority-ordered threat evaluation for QDS and E91 channel security.
No ML/AI - 100% explainable and deterministic.
"""

from typing import Dict, Any, Optional

class ThreatType:
    CHANNEL_MANIPULATION = "CHANNEL_MANIPULATION"
    PASSIVE_EAVESDROP = "PASSIVE_EAVESDROP"
    UNAUTHORIZED_VERIFICATION = "UNAUTHORIZED_VERIFICATION"
    REPLAY = "REPLAY"
    IMPERSONATION = "IMPERSONATION"
    TAMPERING = "TAMPERING"
    FORGERY = "FORGERY"
    VALID = "VALID"

class DeterministicThreatEngine:
    """
    Evaluates message verification context strictly in the specified priority order:
    1. Quantum channel security (E91 CHSH & QBER) -> Channel Manipulation vs Passive Eavesdropping
    2. Verifier authorization
    3. Nonce replay
    4. Signer identity validity
    5. Classical message tampering (SHA-256 hash mismatch)
    6. Quantum signature forgery (mismatch rate > threshold)
    7. Valid
    """

    @staticmethod
    def evaluate(
        e91_status: str,
        chsh_s: float,
        qber: float,
        is_verifier_authorized: bool,
        is_nonce_valid: bool,
        is_signer_valid: bool,
        is_hash_matching: bool,
        mismatch_rate: float,
        threshold: float = 0.05
    ) -> Dict[str, Any]:
        """
        Executes deterministic evaluation cascade and returns structured verdict and diagnostic evidence.
        """
        # 1. Quantum Channel Integrity Check
        if e91_status == "FAIL" or chsh_s < 2.0 or qber > 0.15:
            # Check Passive Eavesdropping distinction:
            # If E91 is abnormal (CHSH down, QBER up) but classical hash matches
            # and QDS mismatch rate is still below threshold (Eve listened without intercepting current signature):
            if is_hash_matching and mismatch_rate <= threshold:
                return {
                    "decision": "REJECT",
                    "detectedAttack": ThreatType.PASSIVE_EAVESDROP,
                    "severity": "CRITICAL",
                    "reason": "Possible passive eavesdropping on the quantum channel detected. Bell inequality violated (S < 2.0 or QBER > 15%) while classical payload remains untampered.",
                    "evidence": {
                        "chshS": chsh_s,
                        "qber": qber,
                        "e91Status": e91_status,
                        "mismatchRate": mismatch_rate,
                        "hashMatches": is_hash_matching
                    }
                }
            else:
                return {
                    "decision": "REJECT",
                    "detectedAttack": ThreatType.CHANNEL_MANIPULATION,
                    "severity": "CRITICAL",
                    "reason": "Quantum channel manipulation or severe decoherence detected. CHSH value falls below the classical bound (S < 2.0), indicating active quantum interception or channel jamming.",
                    "evidence": {
                        "chshS": chsh_s,
                        "qber": qber,
                        "e91Status": e91_status,
                        "mismatchRate": mismatch_rate
                    }
                }

        # 2. Verifier Authorization Check
        if not is_verifier_authorized:
            return {
                "decision": "REJECT",
                "detectedAttack": ThreatType.UNAUTHORIZED_VERIFICATION,
                "severity": "HIGH",
                "reason": "Unauthorized party attempted to verify this quantum-signed payload. Recipient ID does not match intended target.",
                "evidence": {
                    "isVerifierAuthorized": False
                }
            }

        # 3. Nonce Replay Check
        if not is_nonce_valid:
            return {
                "decision": "REJECT",
                "detectedAttack": ThreatType.REPLAY,
                "severity": "HIGH",
                "reason": "Replay attack detected: Nonce has already been consumed or registered for this session.",
                "evidence": {
                    "isNonceValid": False
                }
            }

        # 4. Signer Identity Validity Check
        if not is_signer_valid:
            return {
                "decision": "REJECT",
                "detectedAttack": ThreatType.IMPERSONATION,
                "severity": "CRITICAL",
                "reason": "Impersonation attack detected: Signer identity or public credentials could not be validated for this channel.",
                "evidence": {
                    "isSignerValid": False
                }
            }

        # 5. Message Tampering (Classical Integrity) Check
        if not is_hash_matching:
            return {
                "decision": "REJECT",
                "detectedAttack": ThreatType.TAMPERING,
                "severity": "CRITICAL",
                "reason": "Classical message tampering detected: SHA-256 integrity hash does not match decrypted ciphertext.",
                "evidence": {
                    "isHashMatching": False
                }
            }

        # 6. Quantum Signature Forgery Check
        if mismatch_rate > threshold:
            return {
                "decision": "REJECT",
                "detectedAttack": ThreatType.FORGERY,
                "severity": "CRITICAL",
                "reason": f"Quantum signature forgery or quantum-state manipulation detected. Measured Pauli eigenstate mismatch rate ({mismatch_rate:.4f}) exceeds tolerance threshold ({threshold}).",
                "evidence": {
                    "mismatchRate": mismatch_rate,
                    "threshold": threshold
                }
            }

        # 7. Valid - All checks passed
        return {
            "decision": "ACCEPT",
            "detectedAttack": None,
            "severity": "LOW",
            "reason": "Quantum Digital Signature and classical payload verified successfully. Channel secure (CHSH > 2.0), identity authenticated, zero tampering detected.",
            "evidence": {
                "chshS": chsh_s,
                "qber": qber,
                "mismatchRate": mismatch_rate,
                "threshold": threshold
            }
        }

