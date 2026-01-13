"""
HireLens AI API Application Entry Point

This module initializes the FastAPI application and registers all API routers.
"""

from fastapi import FastAPI

from src.api.routers import analyze, analysis, health, validate

app = FastAPI(
    title="HireLens AI",
    description="Explainable AI resume and interview intelligence platform",
    version="1.0.0",
)

app.include_router(analyze.router, prefix="/api/v1", tags=["analyze"])
app.include_router(analysis.router, prefix="/api/v1", tags=["analysis"])
app.include_router(validate.router, prefix="/api/v1", tags=["validate"])
app.include_router(health.router, prefix="/api/v1", tags=["health"])

