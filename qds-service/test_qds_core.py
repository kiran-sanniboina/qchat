"""
Unit Test Suite for QDS Core & Quantum Security Modules
Tests:
1. Dynamic E91 CHSH correlation and Tsirelson bound violation (|S| ~ 2.828)
2. E91 under simulated eavesdropping/noise (|S| < 2.0, high QBER)
3. Quantum teleportation state fidelity across all 4 Pauli eigenstates (|0>, |1>, |+>, |->)
4. Message-to-signature binding determinism and Bob verification
5. Deterministic Threat Engine priority cascade & all 6 attack simulations
"""

import pytest
import numpy as np
from quantum.e91 import DynamicE91
from quantum.teleportation import QuantumTeleporter
from quantum.threat_engine import DeterministicThreatEngine, ThreatType
from quantum.qds import QDSCore

def test_dynamic_e91_ideal_channel():
    """Verify healthy quantum channel achieves S > 2.4 and QBER < 0.05"""
    e91 = DynamicE91(shots_per_setting=800)
    result = e91.evaluate_channel(noise_rate=0.0, intercept_prob=0.0)

    assert result["chshS"] > 2.4, f"CHSH S was {result['chshS']}, expected > 2.4"
    assert result["channelStatus"] == "PASS"
    assert result["qberEstimate"] <= 0.05
    assert result["theoreticalMax"] == 2.8284

def test_dynamic_e91_eavesdropping():
    """Verify intercept-resend attack degrades CHSH and drives up QBER"""
    e91 = DynamicE91(shots_per_setting=800)
    result = e91.evaluate_channel(noise_rate=0.1, intercept_prob=0.85)

    assert result["channelStatus"] in ["SUSPICIOUS", "FAIL"]
    assert result["qberEstimate"] > 0.20, f"QBER was {result['qberEstimate']}, expected > 0.20"

def test_teleportation_pauli_eigenstates():
    """Verify all 4 Pauli eigenstates are correctly teleported and reconstructed"""
    teleporter = QuantumTeleporter()
    states = ["00", "01", "10", "11"]

    for state in states:
        rec = teleporter.teleport_qubit(state)
        assert rec["isMatch"] is True, f"Teleportation mismatch on state {state}"
        assert rec["fidelity"] == 1.0

def test_qds_sign_and_verify_valid():
    """Verify valid sign-verify flow accepts without any threat"""
    qds = QDSCore(default_num_qubits=32)
    message = "Secret meeting at 18:00 UTC"
    session_id = "sess_alpha_99"
    nonce = "nonce_1002"
    recipient_id = "user_bob_42"
    key = "super_secure_preshared_key_2026"

    # Alice signs
    signed = qds.sign_message(
        message=message,
        session_id=session_id,
        nonce=nonce,
        recipient_id=recipient_id,
        key_material=key
    )

    assert signed["messageHash"] is not None
    assert "ciphertext" in signed["encryptedMessage"]
    assert signed["signatureMeta"]["qubitCount"] == 32

    # Bob verifies
    ver = qds.verify_message(
        encrypted_message=signed["encryptedMessage"],
        message_hash=signed["messageHash"],
        signature_meta=signed["signatureMeta"],
        session_id=session_id,
        nonce=nonce,
        signer_id="user_alice_01",
        verifier_id=recipient_id,
        key_material=key
    )

    assert ver["decision"] == "ACCEPT"
    assert ver["detectedAttack"] is None
    assert ver["mismatchRate"] == 0.0
    assert ver["decryptedPlaintext"] == message

def test_threat_engine_attacks():
    """Verify each of the 6 attack types (plus tampering) triggers its exact deterministic label"""
    qds = QDSCore(default_num_qubits=32)
    signed = qds.sign_message(
        message="Deploy the contracts",
        session_id="session_01",
        nonce="nonce_test_88",
        recipient_id="bob",
        key_material="key_material_abc"
    )

    attacks = [
        ThreatType.CHANNEL_MANIPULATION,
        ThreatType.PASSIVE_EAVESDROP,
        ThreatType.UNAUTHORIZED_VERIFICATION,
        ThreatType.REPLAY,
        ThreatType.IMPERSONATION,
        ThreatType.TAMPERING,
        ThreatType.FORGERY,
    ]

    for attack in attacks:
        ver = qds.verify_message(
            encrypted_message=signed["encryptedMessage"],
            message_hash=signed["messageHash"],
            signature_meta=signed["signatureMeta"],
            session_id="session_01",
            nonce="nonce_test_88",
            signer_id="alice",
            verifier_id="bob",
            key_material="key_material_abc",
            simulate_attack=attack
        )

        assert ver["decision"] == "REJECT", f"Attack {attack} was not rejected!"
        assert ver["detectedAttack"] == attack, f"Expected {attack}, got {ver['detectedAttack']}"
        assert ver["severity"] in ["CRITICAL", "HIGH"]
        assert ver["reason"] is not None

if __name__ == "__main__":
    pytest.main(["-v", __file__])

