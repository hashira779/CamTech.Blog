import time
from enum import Enum
from typing import Dict, Any, Optional

class CircuitState(str, Enum):
    CLOSED = "CLOSED"        # Normal operation: requests pass through
    OPEN = "OPEN"            # Tripped: requests fail fast without calling external system
    HALF_OPEN = "HALF_OPEN"  # Testing: limited probe requests allowed to test recovery

class CircuitBreakerOpenException(Exception):
    pass

class CircuitBreaker:
    def __init__(
        self,
        name: str,
        failure_threshold: int = 5,
        recovery_timeout_seconds: float = 30.0,
        half_open_success_threshold: int = 2
    ):
        self.name = name
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout_seconds
        self.half_open_success_threshold = half_open_success_threshold

        self.state: CircuitState = CircuitState.CLOSED
        self.failure_count: int = 0
        self.success_count: int = 0
        self.last_failure_time: float = 0.0
        self.last_state_change: float = time.time()

    def can_execute(self) -> bool:
        now = time.time()
        if self.state == CircuitState.CLOSED:
            return True

        if self.state == CircuitState.OPEN:
            if now - self.last_failure_time >= self.recovery_timeout:
                # Transition to HALF_OPEN to test recovery
                self.state = CircuitState.HALF_OPEN
                self.success_count = 0
                self.last_state_change = now
                return True
            return False

        if self.state == CircuitState.HALF_OPEN:
            return True

        return False

    def record_success(self):
        if self.state == CircuitState.HALF_OPEN:
            self.success_count += 1
            if self.success_count >= self.half_open_success_threshold:
                # Fully recovered
                self.state = CircuitState.CLOSED
                self.failure_count = 0
                self.success_count = 0
                self.last_state_change = time.time()
        elif self.state == CircuitState.CLOSED:
            self.failure_count = 0

    def record_failure(self):
        now = time.time()
        self.last_failure_time = now
        self.failure_count += 1

        if self.state == CircuitState.HALF_OPEN:
            # Probe failed; trip right back to OPEN
            self.state = CircuitState.OPEN
            self.last_state_change = now
        elif self.state == CircuitState.CLOSED and self.failure_count >= self.failure_threshold:
            # Trip to OPEN
            self.state = CircuitState.OPEN
            self.last_state_change = now

    def get_status(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "state": self.state.value,
            "failure_count": self.failure_count,
            "success_count": self.success_count,
            "last_failure_time": self.last_failure_time,
            "last_state_change": self.last_state_change,
            "is_available": self.state != CircuitState.OPEN
        }

# Global registry of circuit breakers
_CIRCUIT_BREAKERS: Dict[str, CircuitBreaker] = {}

def get_circuit_breaker(name: str, failure_threshold: int = 5, recovery_timeout: float = 30.0) -> CircuitBreaker:
    if name not in _CIRCUIT_BREAKERS:
        _CIRCUIT_BREAKERS[name] = CircuitBreaker(
            name=name,
            failure_threshold=failure_threshold,
            recovery_timeout_seconds=recovery_timeout
        )
    return _CIRCUIT_BREAKERS[name]

def get_all_circuit_breakers_status() -> Dict[str, Any]:
    return {name: cb.get_status() for name, cb in _CIRCUIT_BREAKERS.items()}
