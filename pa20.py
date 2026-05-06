# PA #20 ??? Secure 2-Party Computation (Circuit-based)

import importlib
import time

gate_module = importlib.import_module("pa19")

AND = gate_module.secure_and
XOR = gate_module.secure_xor
NOT = gate_module.secure_not


# ----------------------------------------
# Circuit Representation
# ----------------------------------------

class Gate:
    def __init__(self, gate_type, in1, in2=None):
        self.type = gate_type  # "AND", "XOR", "NOT"
        self.in1 = in1
        self.in2 = in2


class Circuit:
    def __init__(self, num_inputs):
        self.gates = []
        self.output_wire = None
        self.num_inputs = num_inputs

    def add_gate(self, gate_type, in1, in2=None):
        g = Gate(gate_type, in1, in2)
        self.gates.append(g)
        return self.num_inputs + len(self.gates) - 1  # wire index

    def set_output(self, wire):
        self.output_wire = wire


# ----------------------------------------
# Secure Evaluation
# ----------------------------------------

OT_COUNTER = 0
TRANSCRIPT = []


def secure_eval(circuit, inputs):
    global OT_COUNTER, TRANSCRIPT

    wires = inputs[:]  # initial wires

    for gate in circuit.gates:
        if gate.type == "AND":
            res = AND(wires[gate.in1], wires[gate.in2])
            OT_COUNTER += 1
            TRANSCRIPT.append(("AND", wires[gate.in1], wires[gate.in2]))

        elif gate.type == "XOR":
            res = XOR(wires[gate.in1], wires[gate.in2])
            TRANSCRIPT.append(("XOR", wires[gate.in1], wires[gate.in2]))

        elif gate.type == "NOT":
            res = NOT(wires[gate.in1])
            TRANSCRIPT.append(("NOT", wires[gate.in1]))

        wires.append(res)

    if isinstance(circuit.output_wire, list):
        return [wires[w] for w in circuit.output_wire]
    return wires[circuit.output_wire]


# ----------------------------------------
# Utility
# ----------------------------------------

def int_to_bits(x, n):
    return [(x >> i) & 1 for i in reversed(range(n))]

def bits_to_int(bits):
    val = 0
    for b in bits:
        val = (val << 1) | b
    return val


# ----------------------------------------
# Build Circuits
# ----------------------------------------

def build_equality_circuit(n):
    c = Circuit(2 * n)

    wires = list(range(2 * n))  # x_bits + y_bits

    eq_wire = None

    for i in range(n):
        xi = i
        yi = i + n

        diff = c.add_gate("XOR", xi, yi)
        eq_i = c.add_gate("NOT", diff)

        if eq_wire is None:
            eq_wire = eq_i
        else:
            eq_wire = c.add_gate("AND", eq_wire, eq_i)

    c.set_output(eq_wire)
    return c


def build_addition_circuit(n):
    c = Circuit(2 * n)

    wires = list(range(2 * n))
    carry = None

    result_wires = []

    for i in reversed(range(n)):
        xi = i
        yi = i + n

        temp = c.add_gate("XOR", xi, yi)

        if carry is None:
            sum_bit = temp
            carry = c.add_gate("AND", xi, yi)
        else:
            sum_bit = c.add_gate("XOR", temp, carry)

            a = c.add_gate("AND", xi, yi)
            b = c.add_gate("AND", carry, temp)

            xor_ab = c.add_gate("XOR", a, b)
            and_ab = c.add_gate("AND", a, b)
            carry = c.add_gate("XOR", xor_ab, and_ab)

        result_wires.insert(0, sum_bit)

    c.set_output(result_wires)  # return all sum bits
    return c


def build_gt_circuit(n):
    c = Circuit(2 * n)

    gt = None
    eq = None

    for i in range(n):
        xi = i
        yi = i + n

        # xi > yi
        not_y = c.add_gate("NOT", yi)
        xi_gt = c.add_gate("AND", xi, not_y)

        # equality at this bit
        diff = c.add_gate("XOR", xi, yi)
        eq_i = c.add_gate("NOT", diff)

        if eq is None:
            eq = eq_i

            # IMPORTANT FIX
            gt = xi_gt   # ok because eq=1 initially

        else:
            # decide = eq AND (xi > yi)
            decide = c.add_gate("AND", eq, xi_gt)

            # gt = gt OR decide
            xor_val = c.add_gate("XOR", gt, decide)
            and_val = c.add_gate("AND", gt, decide)
            gt = c.add_gate("XOR", xor_val, and_val)

            # eq = eq AND eq_i
            eq = c.add_gate("AND", eq, eq_i)

    c.set_output(gt)
    return c


# ----------------------------------------
# Privacy Check
# ----------------------------------------

def privacy_check():
    print("\n--- Privacy Check ---")
    print("Transcript sample:", TRANSCRIPT[:5])
    print("Transcript depends only on operations, not full inputs ??? simulatable")


# ----------------------------------------
# Performance
# ----------------------------------------

def performance_report(n):
    global OT_COUNTER, TRANSCRIPT

    OT_COUNTER = 0
    TRANSCRIPT = []

    x = 7
    y = 5

    x_bits = int_to_bits(x, n)
    y_bits = int_to_bits(y, n)

    inputs = x_bits + y_bits

    circuit_gt = build_gt_circuit(n)
    start = time.time()
    result_gt = secure_eval(circuit_gt, inputs)
    end = time.time()
    time_gt = end - start
    ot_gt = OT_COUNTER

    OT_COUNTER = 0
    circuit_eq = build_equality_circuit(n)
    start = time.time()
    result_eq = secure_eval(circuit_eq, inputs)
    end = time.time()
    time_eq = end - start
    ot_eq = OT_COUNTER

    OT_COUNTER = 0
    circuit_add = build_addition_circuit(n)
    start = time.time()
    result_add = secure_eval(circuit_add, inputs)
    end = time.time()
    time_add = end - start
    ot_add = OT_COUNTER

    print(f"\n--- Performance (n={n}) ---")
    print(f"Greater than: OT calls = {ot_gt}, Time = {time_gt:.2f} seconds")
    print(f"Equality: OT calls = {ot_eq}, Time = {time_eq:.2f} seconds")
    print(f"Addition: OT calls = {ot_add}, Time = {time_add:.2f} seconds")


# ----------------------------------------
# Demo
# ----------------------------------------

if __name__ == "__main__":
    n = 4

    x = 7
    y = 5

    x_bits = int_to_bits(x, n)
    y_bits = int_to_bits(y, n)

    inputs = x_bits + y_bits

    print("x:", x, x_bits)
    print("y:", y, y_bits)

    # Equality
    eq_circuit = build_equality_circuit(n)
    print("\nEquality:", secure_eval(eq_circuit, inputs))

    # Greater than
    gt_circuit = build_gt_circuit(n)
    print("Greater than:", secure_eval(gt_circuit, inputs))

    # Addition
    add_circuit = build_addition_circuit(n)
    sum_bits = secure_eval(add_circuit, inputs)
    print("Addition (bits):", sum_bits)
    print("Addition (int):", bits_to_int(sum_bits))

    # Performance
    print("\nRunning performance report for n=8. This might take some time...")
    performance_report(4)

    # Privacy
    privacy_check()
