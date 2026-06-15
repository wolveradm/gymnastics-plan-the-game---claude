import json
from app.controllers.manager.base_manager import BaseTaskManager, _ThreadedWorker
from app.services import state as sm
from app.services import task as tm


class RedisTaskManager(BaseTaskManager):
    def __init__(self, redis_host: str = "localhost", redis_port: int = 6379,
                 redis_db: int = 0, max_concurrent_tasks: int = 5,
                 max_queued_tasks: int = 100):
        import redis
        self._redis = redis.Redis(
            host=redis_host, port=redis_port, db=redis_db
        )
        self._worker = _ThreadedWorker(
            max_concurrent_tasks=max_concurrent_tasks,
            max_queued_tasks=max_queued_tasks,
        )

    def start(self, task_id: str, params, stop_at: str = "video"):
        result = {}

        def _run():
            nonlocal result
            result = tm.start(task_id=task_id, params=params, stop_at=stop_at)

        self._worker.add_task(_run)
        return result

    def get_task(self, task_id: str):
        return sm.state.get_task(task_id)
