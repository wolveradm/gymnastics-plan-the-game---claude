"""Application configuration - root APIRouter."""

from fastapi import APIRouter

from app.controllers.v1 import llm, video

root_api_router = APIRouter()
root_api_router.include_router(video.router)
root_api_router.include_router(llm.router)
