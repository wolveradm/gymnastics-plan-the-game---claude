from fastapi import APIRouter


def new_router(**kwargs) -> APIRouter:
    return APIRouter(prefix="/api/v1", **kwargs)
