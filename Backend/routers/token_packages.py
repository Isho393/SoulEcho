import json
import logging
from typing import List, Optional


from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.token_packages import Token_packagesService

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/entities/token_packages", tags=["token_packages"])


# ---------- Pydantic Schemas ----------
class Token_packagesData(BaseModel):
    """Entity data schema (for create/update)"""
    name: str
    token_amount: int
    price_cents: int
    description: str = None
    popular: bool = None


class Token_packagesUpdateData(BaseModel):
    """Update entity data (partial updates allowed)"""
    name: Optional[str] = None
    token_amount: Optional[int] = None
    price_cents: Optional[int] = None
    description: Optional[str] = None
    popular: Optional[bool] = None


class Token_packagesResponse(BaseModel):
    """Entity response schema"""
    id: int
    name: str
    token_amount: int
    price_cents: int
    description: Optional[str] = None
    popular: Optional[bool] = None

    class Config:
        from_attributes = True


class Token_packagesListResponse(BaseModel):
    """List response schema"""
    items: List[Token_packagesResponse]
    total: int
    skip: int
    limit: int


class Token_packagesBatchCreateRequest(BaseModel):
    """Batch create request"""
    items: List[Token_packagesData]


class Token_packagesBatchUpdateItem(BaseModel):
    """Batch update item"""
    id: int
    updates: Token_packagesUpdateData


class Token_packagesBatchUpdateRequest(BaseModel):
    """Batch update request"""
    items: List[Token_packagesBatchUpdateItem]


class Token_packagesBatchDeleteRequest(BaseModel):
    """Batch delete request"""
    ids: List[int]


# ---------- Routes ----------
@router.get("", response_model=Token_packagesListResponse)
async def query_token_packagess(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    """Query token_packagess with filtering, sorting, and pagination"""
    logger.debug(f"Querying token_packagess: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")
    
    service = Token_packagesService(db)
    try:
        # Parse query JSON if provided
        query_dict = None
        if query:
            try:
                query_dict = json.loads(query)
            except json.JSONDecodeError:
                raise HTTPException(status_code=400, detail="Invalid query JSON format")
        
        result = await service.get_list(
            skip=skip, 
            limit=limit,
            query_dict=query_dict,
            sort=sort,
        )
        logger.debug(f"Found {result['total']} token_packagess")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying token_packagess: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/all", response_model=Token_packagesListResponse)
async def query_token_packagess_all(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    # Query token_packagess with filtering, sorting, and pagination without user limitation
    logger.debug(f"Querying token_packagess: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")

    service = Token_packagesService(db)
    try:
        # Parse query JSON if provided
        query_dict = None
        if query:
            try:
                query_dict = json.loads(query)
            except json.JSONDecodeError:
                raise HTTPException(status_code=400, detail="Invalid query JSON format")

        result = await service.get_list(
            skip=skip,
            limit=limit,
            query_dict=query_dict,
            sort=sort
        )
        logger.debug(f"Found {result['total']} token_packagess")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying token_packagess: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/{id}", response_model=Token_packagesResponse)
async def get_token_packages(
    id: int,
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    """Get a single token_packages by ID"""
    logger.debug(f"Fetching token_packages with id: {id}, fields={fields}")
    
    service = Token_packagesService(db)
    try:
        result = await service.get_by_id(id)
        if not result:
            logger.warning(f"Token_packages with id {id} not found")
            raise HTTPException(status_code=404, detail="Token_packages not found")
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching token_packages {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("", response_model=Token_packagesResponse, status_code=201)
async def create_token_packages(
    data: Token_packagesData,
    db: AsyncSession = Depends(get_db),
):
    """Create a new token_packages"""
    logger.debug(f"Creating new token_packages with data: {data}")
    
    service = Token_packagesService(db)
    try:
        result = await service.create(data.model_dump())
        if not result:
            raise HTTPException(status_code=400, detail="Failed to create token_packages")
        
        logger.info(f"Token_packages created successfully with id: {result.id}")
        return result
    except ValueError as e:
        logger.error(f"Validation error creating token_packages: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating token_packages: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/batch", response_model=List[Token_packagesResponse], status_code=201)
async def create_token_packagess_batch(
    request: Token_packagesBatchCreateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Create multiple token_packagess in a single request"""
    logger.debug(f"Batch creating {len(request.items)} token_packagess")
    
    service = Token_packagesService(db)
    results = []
    
    try:
        for item_data in request.items:
            result = await service.create(item_data.model_dump())
            if result:
                results.append(result)
        
        logger.info(f"Batch created {len(results)} token_packagess successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch create: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch create failed: {str(e)}")


@router.put("/batch", response_model=List[Token_packagesResponse])
async def update_token_packagess_batch(
    request: Token_packagesBatchUpdateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Update multiple token_packagess in a single request"""
    logger.debug(f"Batch updating {len(request.items)} token_packagess")
    
    service = Token_packagesService(db)
    results = []
    
    try:
        for item in request.items:
            # Only include non-None values for partial updates
            update_dict = {k: v for k, v in item.updates.model_dump().items() if v is not None}
            result = await service.update(item.id, update_dict)
            if result:
                results.append(result)
        
        logger.info(f"Batch updated {len(results)} token_packagess successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch update: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch update failed: {str(e)}")


@router.put("/{id}", response_model=Token_packagesResponse)
async def update_token_packages(
    id: int,
    data: Token_packagesUpdateData,
    db: AsyncSession = Depends(get_db),
):
    """Update an existing token_packages"""
    logger.debug(f"Updating token_packages {id} with data: {data}")

    service = Token_packagesService(db)
    try:
        # Only include non-None values for partial updates
        update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
        result = await service.update(id, update_dict)
        if not result:
            logger.warning(f"Token_packages with id {id} not found for update")
            raise HTTPException(status_code=404, detail="Token_packages not found")
        
        logger.info(f"Token_packages {id} updated successfully")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error updating token_packages {id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating token_packages {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.delete("/batch")
async def delete_token_packagess_batch(
    request: Token_packagesBatchDeleteRequest,
    db: AsyncSession = Depends(get_db),
):
    """Delete multiple token_packagess by their IDs"""
    logger.debug(f"Batch deleting {len(request.ids)} token_packagess")
    
    service = Token_packagesService(db)
    deleted_count = 0
    
    try:
        for item_id in request.ids:
            success = await service.delete(item_id)
            if success:
                deleted_count += 1
        
        logger.info(f"Batch deleted {deleted_count} token_packagess successfully")
        return {"message": f"Successfully deleted {deleted_count} token_packagess", "deleted_count": deleted_count}
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch delete: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch delete failed: {str(e)}")


@router.delete("/{id}")
async def delete_token_packages(
    id: int,
    db: AsyncSession = Depends(get_db),
):
    """Delete a single token_packages by ID"""
    logger.debug(f"Deleting token_packages with id: {id}")
    
    service = Token_packagesService(db)
    try:
        success = await service.delete(id)
        if not success:
            logger.warning(f"Token_packages with id {id} not found for deletion")
            raise HTTPException(status_code=404, detail="Token_packages not found")
        
        logger.info(f"Token_packages {id} deleted successfully")
        return {"message": "Token_packages deleted successfully", "id": id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting token_packages {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")