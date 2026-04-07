import os

import httpx
from fastapi import HTTPException
from pydantic import BaseModel

from shared.services.redis_service import redis_service


class ServiceHealth(BaseModel):
    status: str
    message: str


class DetailedHealthResponse(BaseModel):
    status: str
    services: dict[str, ServiceHealth]


class BasicHealthResponse(BaseModel):
    status: str
    message: str


async def home_success_message() -> BasicHealthResponse:
    """
    Root endpoint to verify API is running.
    """
    return BasicHealthResponse(status="healthy", message="API is running")


async def health_check() -> BasicHealthResponse:
    """
    Basic health check endpoint to verify service status.
    """
    return BasicHealthResponse(status="healthy", message="Service is running")


async def detailed_health_check() -> DetailedHealthResponse:
    """
    Detailed health check endpoint that verifies all service dependencies.
    """
    health_status = {
        "api": ServiceHealth(status="healthy", message="Service is running"),
        "redis": ServiceHealth(status="healthy", message="Connected"),
        "supabase": ServiceHealth(status="healthy", message="Connected"),
    }

    try:
        # Test Redis connection
        if redis_service.redis_client:
            await redis_service.redis_client.ping()
        else:
            health_status["redis"] = ServiceHealth(status="unhealthy", message="Not connected")

        # Test Supabase connection
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{os.getenv('SUPABASE_URL')}/rest/v1/", headers={"apikey": os.getenv("SUPABASE_SERVICE_KEY")}
            )
            if response.status_code != 200:
                health_status["supabase"] = ServiceHealth(
                    status="unhealthy", message=f"Status code: {response.status_code}"
                )

    except Exception as e:
        raise HTTPException(status_code=503, detail=str(e))

    # Check if any service is unhealthy
    overall_status = "healthy"
    if any(service.status == "unhealthy" for service in health_status.values()):
        overall_status = "unhealthy"

    return DetailedHealthResponse(status=overall_status, services=health_status)
