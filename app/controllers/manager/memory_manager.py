from app.controllers.manager.base_manager import BaseTaskManager, _ThreadedWorker, TaskQueueFullError
from app.services import state as sm
from app.services import task as tm


class InMemoryTaskManager(BaseTaskManager):
    def __init__(self, max_concurrent_tasks: int = 5, max_queued_tasks: int = 100):
        self._worker = _ThreadedWorker(
            max_concurrent_tasks=max_concurrent_tasks,
            max_queued_tasks=max_queued_tasks,
        )

    def add_task(self, func, *args, **kwargs):
        self._worker.add_task(func, *args, **kwargs)

    def start(self, task_id: str, params, stop_at: str = "video"):
        result = {}

        def _run():
            nonlocal result
            result = tm.start(task_id=task_id, params=params, stop_at=stop_at)

        self._worker.add_task(_run)
        return result

    def get_task(self, task_id: str):
        return sm.state.get_task(task_id)
