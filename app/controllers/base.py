import uuid

from fastapi import Request
from loguru import logger

from app.config import config
from app.models.exception import HttpException


def get_task_id(request: Request):
    task_id = request.headers.get("x-task-id", "")
    if not task_id:
        task_id = str(uuid.uuid4()).replace("-", "")
    return task_id


def get_api_key(request: Request):
    return request.headers.get("x-api-key", "")


def verify_token(request: Request):
    token = config.app.get("token", "")
    if not token:
        return
    api_key = get_api_key(request)
    if api_key != token:
        raise HttpException(status_code=401, message="Unauthorized")
