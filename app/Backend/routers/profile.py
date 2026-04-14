"""
Router /api/v1/profile — gestion du profil utilisateur enrichi + RGPD.
"""
import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from dependencies.auth import get_current_user
from schemas.auth import UserResponse
from schemas.profile import UserProfileResponse, UserProfileUpdate
from services.profile_service import ProfileService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/profile", tags=["profile"])


@router.get("", response_model=UserProfileResponse)
async def get_profile(
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Récupère le profil de l'utilisateur connecté (créé automatiquement s'il n'existe pas)."""
    service = ProfileService(db)
    return await service.get_or_create(str(current_user.id))


@router.put("", response_model=UserProfileResponse)
async def update_profile(
    data: UserProfileUpdate,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Crée ou met à jour le profil de l'utilisateur connecté."""
    service = ProfileService(db)
    try:
        return await service.update(str(current_user.id), data)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))


@router.delete("/me")
async def delete_my_data(
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Suppression RGPD en cascade — supprime toutes les données de l'utilisateur :
    profil, scores émotionnels, conversations et messages.
    """
    service = ProfileService(db)
    return await service.delete_user_data(str(current_user.id))


@router.get("/export")
async def export_my_data(
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Export RGPD — retourne toutes les données personnelles de l'utilisateur
    au format JSON structuré (droit à la portabilité).
    """
    service = ProfileService(db)
    return await service.export_user_data(str(current_user.id))
