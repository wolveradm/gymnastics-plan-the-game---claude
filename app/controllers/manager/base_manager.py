import threading
from abc import ABC, abstractmethod
from queue import Queue, Full
from typing import Callable


class TaskQueueFullError(Exception):
    """Raised when the task queue has reached its capacity limit."""
    pass


class BaseTaskManager(ABC):
    @abstractmethod
    def start(self, task_id: str, params, stop_at: str = "video"):
        pass

    @abstractmethod
    def get_task(self, task_id: str):
        pass


class _ThreadedWorker:
    def __init__(self, max_concurrent_tasks: int = 1, max_queued_tasks: int = 10):
        self._max_concurrent = max_concurrent_tasks
        self._semaphore = threading.Semaphore(max_concurrent_tasks)
        self._queue: Queue = Queue(maxsize=max_queued_tasks)
        self._lock = threading.Lock()

    def add_task(self, func: Callable, *args, **kwargs):
        try:
            self._queue.put_nowait((func, args, kwargs))
        except Full:
            raise TaskQueueFullError(
                f"Task queue is full (max_queued_tasks={self._queue.maxsize}). "
                "Please wait for running tasks to complete."
            )
        thread = threading.Thread(
            target=self._run_task, daemon=True
        )
        thread.start()

    def _run_task(self):
        try:
            func, args, kwargs = self._queue.get_nowait()
        except Exception:
            return

        self._semaphore.acquire()
        try:
            func(*args, **kwargs)
        finally:
            self._semaphore.release()
            self._queue.task_done()
