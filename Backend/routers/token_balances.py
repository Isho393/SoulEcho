import json
import logging
from typing import List, Optional

from datetime import datetime, date

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.token_balances import Token_balancesService
from dependencies.auth import get_current_user
from schemas.auth import UserResponse

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/entities/token_balances", tags=["token_balances"])


# ---------- Pydantic Schemas ----------
class Token_balancesData(BaseModel):
    """Entity data schema (for create/update)"""
    balance: int
    total_purchased: int = None
    total_used: int = None
    updated_at: Optional[datetime] = None


class Token_balancesUpdateData(BaseModel):
    """Update entity data (partial updates allowed)"""
    balance: Optional[int] = None
    total_purchased: Optional[int] = None
    total_used: Optional[int] = None
    updated_at: Optional[datetime] = None


class Token_balancesResponse(BaseModel):
    """Entity response schema"""
    id: int
    user_id: str
    balance: int
    total_purchased: Optional[int] = None
    total_used: Optional[int] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Token_balancesListResponse(BaseModel):
    """List response schema"""
    items: List[Token_balancesResponse]
    total: int
    skip: int
    limit: int


class Token_balancesBatchCreateRequest(BaseModel):
    """Batch create request"""
    items: List[Token_balancesData]


class Token_balancesBatchUpdateItem(BaseModel):
    """Batch update item"""
    id: int
    updates: Token_balancesUpdateData


class Token_balancesBatchUpdateRequest(BaseModel):
    """Batch update request"""
    items: List[Token_balancesBatchUpdateItem]


class Token_balancesBatchDeleteRequest(BaseModel):
    """Batch delete request"""
    ids: List[int]


# ---------- Routes ----------
@router.get("", response_model=Token_balancesListResponse)
async def query_token_balancess(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Query token_balancess with filtering, sorting, and pagination (user can only see their own records)"""
    logger.debug(f"Querying token_balancess: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")
    
    service = Token_balancesService(db)
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
            user_id=str(current_user.id),
        )
        logger.debug(f"Found {result['total']} token_balancess")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying token_balancess: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/all", response_model=Token_balancesListResponse)
async def query_token_balancess_all(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    # Query token_balancess with filtering, sorting, and pagination without user limitation
    logger.debug(f"Querying token_balancess: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")

    service = Token_balancesService(db)
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
        logger.debug(f"Found {result['total']} token_balancess")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying token_balancess: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/{id}", response_model=Token_balancesResponse)
async def get_token_balances(
    id: int,
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single token_balances by ID (user can only see their own records)"""
    logger.debug(f"Fetching token_balances with id: {id}, fields={fields}")
    
    service = Token_balancesService(db)
    try:
        result = await service.get_by_id(id, user_id=str(current_user.id))
        if not result:
            logger.warning(f"Token_balances with id {id} not found")
            raise HTTPException(status_code=404, detail="Token_balances not found")
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching token_balances {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("", response_model=Token_balancesResponse, status_code=201)
async def create_token_balances(
    data: Token_balancesData,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new token_balances"""
    logger.debug(f"Creating new token_balances with data: {data}")
    
    service = Token_balancesService(db)
    try:
        result = await service.create(data.model_dump(), user_id=str(current_user.id))
        if not result:
            raise HTTPException(status_code=400, detail="Failed to create token_balances")
        
        logger.info(f"Token_balances created successfully with id: {result.id}")
        return result
    except ValueError as e:
        logger.error(f"Validation error creating token_balances: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating token_balances: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/batch", response_model=List[Token_balancesResponse], status_code=201)
async def create_token_balancess_batch(
    request: Token_balancesBatchCreateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create multiple token_balancess in a single request"""
    logger.debug(f"Batch creating {len(request.items)} token_balancess")
    
    service = Token_balancesService(db)
    results = []
    
    try:
        for item_data in request.items:
            result = await service.create(item_data.model_dump(), user_id=str(current_user.id))
            if result:
                results.append(result)
        
        logger.info(f"Batch created {len(results)} token_balancess successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch create: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch create failed: {str(e)}")


@router.put("/batch", response_model=List[Token_balancesResponse])
async def update_token_balancess_batch(
    request: Token_balancesBatchUpdateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update multiple token_balancess in a single request (requires ownership)"""
    logger.debug(f"Batch updating {len(request.items)} token_balancess")
    
    service = Token_balancesService(db)
    results = []
    
    try:
        for item in request.items:
            # Only include non-None values for partial updates
            update_dict = {k: v for k, v in item.updates.model_dump().items() if v is not None}
            result = await service.update(item.id, update_dict, user_id=str(current_user.id))
            if result:
                results.append(result)
        
        logger.info(f"Batch updated {len(results)} token_balancess successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch update: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch update failed: {str(e)}")


@router.put("/{id}", response_model=Token_balancesResponse)
async def update_token_balances(
    id: int,
    data: Token_balancesUpdateData,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update an existing token_balances (requires ownership)"""
    logger.debug(f"Updating token_balances {id} with data: {data}")

    service = Token_balancesService(db)
    try:
        # Only include non-None values for partial updates
        update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
        result = await service.update(id, update_dict, user_id=str(current_user.id))
        if not result:
            logger.warning(f"Token_balances with id {id} not found for update")
            raise HTTPException(status_code=404, detail="Token_balances not found")
        
        logger.info(f"Token_balances {id} updated successfully")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error updating token_balances {id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating token_balances {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.delete("/batch")
async def delete_token_balancess_batch(
    request: Token_balancesBatchDeleteRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete multiple token_balancess by their IDs (requires ownership)"""
    logger.debug(f"Batch deleting {len(request.ids)} token_balancess")
    
    service = Token_balancesService(db)
    deleted_count = 0
    
    try:
        for item_id in request.ids:
            success = await service.delete(item_id, user_id=str(current_user.id))
            if success:
                deleted_count += 1
        
        logger.info(f"Batch deleted {deleted_count} token_balancess successfully")
        return {"message": f"Successfully deleted {deleted_count} token_balancess", "deleted_count": deleted_count}
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch delete: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch delete failed: {str(e)}")


@router.delete("/{id}")
async def delete_token_balances(
    id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a single token_balances by ID (requires ownership)"""
    logger.debug(f"Deleting token_balances with id: {id}")
    
    service = Token_balancesService(db)
    try:
        success = await service.delete(id, user_id=str(current_user.id))
        if not success:
            logger.warning(f"Token_balances with id {id} not found for deletion")
            raise HTTPException(status_code=404, detail="Token_balances not found")
        
        logger.info(f"Token_balances {id} deleted successfully")
        return {"message": "Token_balances deleted successfully", "id": id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting token_balances {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")