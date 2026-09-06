"""
Dynamic E91 Quantum Entanglement Module
Simulates Ekert91 protocol for channel-security monitoring, CHSH inequality verification,
and Quantum Bit Error Rate (QBER) estimation using Qiskit.
"""

import numpy as np
from typing import Dict, Any, Tuple
from qiskit import QuantumCircuit
from qiskit_aer import AerSimulator

class DynamicE91:
    """
    Implements dynamic Bell-pair generation, basis rotation, correlation computation,
    CHSH S-value evaluation, and QBER analysis.
    """
    def __init__(self, shots_per_setting: int = 1000):
        self.shots = shots_per_setting
        self.simulator = AerSimulator()

        # Alice's measurement angles (radians in X-Z plane)
        self.a1 = 0.0
        self.a2 = np.pi / 4.0

        # Bob's measurement angles
        self.b1 = np.pi / 8.0
        self.b2 = -np.pi / 8.0

        # Coincident key-generation angle (for QBER computation)
        self.key_basis = np.pi / 4.0

    def _create_bell_pair(self) -> QuantumCircuit:
        """Creates Bell state |Phi+> = (|00> + |11>) / sqrt(2)"""
        qc = QuantumCircuit(2, 2)
        qc.h(0)
        qc.cx(0, 1)
        return qc

    def _measure_correlation(self, theta_a: float, theta_b: float, noise_rate: float = 0.0, intercept_prob: float = 0.0) -> float:
        """
        Measures correlation E(a, b) = (N_same - N_diff) / N_total
        where measurement at angle theta is performed by rotating by -2*theta around Y before Z measurement.
        """
        qc = self._create_bell_pair()

        # Alice basis rotation
        if theta_a != 0.0:
            qc.ry(-2.0 * theta_a, 0)

        # Bob basis rotation
        if theta_b != 0.0:
            qc.ry(-2.0 * theta_b, 1)

        qc.measure(0, 0)
        qc.measure(1, 1)

        result = self.simulator.run(qc, shots=self.shots).result()
        counts = result.get_counts()

        n_00 = counts.get('00', 0)
        n_11 = counts.get('11', 0)
        n_01 = counts.get('01', 0)
        n_10 = counts.get('10', 0)

        # Apply intercept-resend degradation:
        # If Eve intercepts with probability p, entanglement is broken for those pairs,
        # reducing quantum correlation towards 0
        if intercept_prob > 0.0:
            n_intercepted = int(self.shots * intercept_prob)
            # Intercepted pairs produce uncorrelated random classical outcomes
            n_00 = int(n_00 * (1.0 - intercept_prob) + n_intercepted * 0.25)
            n_11 = int(n_11 * (1.0 - intercept_prob) + n_intercepted * 0.25)
            n_01 = int(n_01 * (1.0 - intercept_prob) + n_intercepted * 0.25)
            n_10 = int(n_10 * (1.0 - intercept_prob) + n_intercepted * 0.25)

        # Add depolarizing channel noise
        if noise_rate > 0.0:
            flip_00 = np.random.binomial(n_00, noise_rate)
            flip_11 = np.random.binomial(n_11, noise_rate)
            flip_01 = np.random.binomial(n_01, noise_rate)
            flip_10 = np.random.binomial(n_10, noise_rate)
            n_00 = n_00 - flip_00 + flip_01
            n_11 = n_11 - flip_11 + flip_10
            n_01 = n_01 - flip_01 + flip_00
            n_10 = n_10 - flip_10 + flip_11

        total = n_00 + n_11 + n_01 + n_10
        if total == 0:
            return 0.0

        n_same = n_00 + n_11
        n_diff = n_01 + n_10
        return (n_same - n_diff) / total

    def _measure_qber(self, noise_rate: float = 0.0, intercept_prob: float = 0.0) -> float:
        """
        Calculates Quantum Bit Error Rate (QBER) on sifted key bits measured in coincident bases.
        For |Phi+>, identical measurements should yield identical outcomes (00 or 11).
        QBER is the proportion of discordant outcomes (01 or 10).
        """
        qc = self._create_bell_pair()

        # Both measure in the coincident key basis (Ry(-2*theta))
        qc.ry(-2.0 * self.key_basis, 0)
        qc.ry(-2.0 * self.key_basis, 1)

        qc.measure(0, 0)
        qc.measure(1, 1)

        result = self.simulator.run(qc, shots=self.shots).result()
        counts = result.get_counts()

        n_00 = counts.get('00', 0)
        n_11 = counts.get('11', 0)
        n_01 = counts.get('01', 0)
        n_10 = counts.get('10', 0)

        # When Eve intercepts with intercept_prob, her measurement collapses the state,
        # inducing 25-50% error rate on those sifted bits
        if intercept_prob > 0.0:
            n_intercepted = int(self.shots * intercept_prob)
            n_00 = int(n_00 * (1.0 - intercept_prob) + n_intercepted * 0.25)
            n_11 = int(n_11 * (1.0 - intercept_prob) + n_intercepted * 0.25)
            n_01 = int(n_01 * (1.0 - intercept_prob) + n_intercepted * 0.25)
            n_10 = int(n_10 * (1.0 - intercept_prob) + n_intercepted * 0.25)

        if noise_rate > 0.0:
            flip_00 = np.random.binomial(n_00, noise_rate)
            flip_11 = np.random.binomial(n_11, noise_rate)
            flip_01 = np.random.binomial(n_01, noise_rate)
            flip_10 = np.random.binomial(n_10, noise_rate)
            n_00 = n_00 - flip_00 + flip_01
            n_11 = n_11 - flip_11 + flip_10
            n_01 = n_01 - flip_01 + flip_00
            n_10 = n_10 - flip_10 + flip_11

        total = n_00 + n_11 + n_01 + n_10
        if total == 0:
            return 0.0

        errors = n_01 + n_10
        return errors / total
        if total == 0:
            return 0.0

        errors = n_01 + n_10
        return errors / total

    def evaluate_channel(self, noise_rate: float = 0.0, intercept_prob: float = 0.0) -> Dict[str, Any]:
        """
        Performs full Dynamic E91 protocol test:
        1. Computes CHSH correlation values for settings (a1,b1), (a1,b2), (a2,b1), (a2,b2)
        2. Calculates S = E(a1,b1) + E(a1,b2) + E(a2,b1) - E(a2,b2)
        3. Measures QBER
        4. Classifies channel_status: PASS | SUSPICIOUS | FAIL
        """
        e_a1_b1 = self._measure_correlation(self.a1, self.b1, noise_rate, intercept_prob)
        e_a1_b2 = self._measure_correlation(self.a1, self.b2, noise_rate, intercept_prob)
        e_a2_b1 = self._measure_correlation(self.a2, self.b1, noise_rate, intercept_prob)
        e_a2_b2 = self._measure_correlation(self.a2, self.b2, noise_rate, intercept_prob)

        chsh_s = e_a1_b1 + e_a1_b2 + e_a2_b1 - e_a2_b2
        abs_s = abs(chsh_s)
        qber = self._measure_qber(noise_rate, intercept_prob)

        # Classification rules:
        # |S| >= 2.4 and QBER <= 0.08 -> PASS (Approaching Tsirelson bound 2.828)
        # 2.0 <= |S| < 2.4 or 0.08 < QBER <= 0.15 -> SUSPICIOUS
        # |S| < 2.0 or QBER > 0.15 -> FAIL (Classical bound or high eavesdropping)
        if abs_s >= 2.4 and qber <= 0.08:
            status = "PASS"
        elif abs_s >= 2.0 and qber <= 0.15:
            status = "SUSPICIOUS"
        else:
            status = "FAIL"

        return {
            "chshS": round(float(chsh_s), 4),
            "absS": round(float(abs_s), 4),
            "theoreticalMax": 2.8284,
            "classicalBound": 2.0,
            "channelStatus": status,
            "qberEstimate": round(float(qber), 4),
            "correlations": {
                "E_a1_b1": round(float(e_a1_b1), 4),
                "E_a1_b2": round(float(e_a1_b2), 4),
                "E_a2_b1": round(float(e_a2_b1), 4),
                "E_a2_b2": round(float(e_a2_b2), 4)
            },
            "parameters": {
                "shots": self.shots,
                "noiseRate": noise_rate,
                "interceptProb": intercept_prob
            }
        }
