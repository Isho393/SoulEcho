import logging
from typing import Optional, Dict, Any, List

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from models.token_packages import Token_packages

logger = logging.getLogger(__name__)


# ------------------ Service Layer ------------------
class Token_packagesService:
    """Service layer for Token_packages operations"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, data: Dict[str, Any]) -> Optional[Token_packages]:
        """Create a new token_packages"""
        try:
            obj = Token_packages(**data)
            self.db.add(obj)
            await self.db.commit()
            await self.db.refresh(obj)
            logger.info(f"Created token_packages with id: {obj.id}")
            return obj
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error creating token_packages: {str(e)}")
            raise

    async def get_by_id(self, obj_id: int) -> Optional[Token_packages]:
        """Get token_packages by ID"""
        try:
            query = select(Token_packages).where(Token_packages.id == obj_id)
            result = await self.db.execute(query)
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error fetching token_packages {obj_id}: {str(e)}")
            raise

    async def get_list(
        self, 
        skip: int = 0, 
        limit: int = 20, 
        query_dict: Optional[Dict[str, Any]] = None,
        sort: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Get paginated list of token_packagess"""
        try:
            query = select(Token_packages)
            count_query = select(func.count(Token_packages.id))
            
            if query_dict:
                for field, value in query_dict.items():
                    if hasattr(Token_packages, field):
                        query = query.where(getattr(Token_packages, field) == value)
                        count_query = count_query.where(getattr(Token_packages, field) == value)
            
            count_result = await self.db.execute(count_query)
            total = count_result.scalar()

            if sort:
                if sort.startswith('-'):
                    field_name = sort[1:]
                    if hasattr(Token_packages, field_name):
                        query = query.order_by(getattr(Token_packages, field_name).desc())
                else:
                    if hasattr(Token_packages, sort):
                        query = query.order_by(getattr(Token_packages, sort))
            else:
                query = query.order_by(Token_packages.id.desc())

            result = await self.db.execute(query.offset(skip).limit(limit))
            items = result.scalars().all()

            return {
                "items": items,
                "total": total,
                "skip": skip,
                "limit": limit,
            }
        except Exception as e:
            logger.error(f"Error fetching token_packages list: {str(e)}")
            raise

    async def update(self, obj_id: int, update_data: Dict[str, Any]) -> Optional[Token_packages]:
        """Update token_packages"""
        try:
            obj = await self.get_by_id(obj_id)
            if not obj:
                logger.warning(f"Token_packages {obj_id} not found for update")
                return None
            for key, value in update_data.items():
                if hasattr(obj, key):
                    setattr(obj, key, value)

            await self.db.commit()
            await self.db.refresh(obj)
            logger.info(f"Updated token_packages {obj_id}")
            return obj
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error updating token_packages {obj_id}: {str(e)}")
            raise

    async def delete(self, obj_id: int) -> bool:
        """Delete token_packages"""
        try:
            obj = await self.get_by_id(obj_id)
            if not obj:
                logger.warning(f"Token_packages {obj_id} not found for deletion")
                return False
            await self.db.delete(obj)
            await self.db.commit()
            logger.info(f"Deleted token_packages {obj_id}")
            return True
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error deleting token_packages {obj_id}: {str(e)}")
            raise

    async def get_by_field(self, field_name: str, field_value: Any) -> Optional[Token_packages]:
        """Get token_packages by any field"""
        try:
            if not hasattr(Token_packages, field_name):
                raise ValueError(f"Field {field_name} does not exist on Token_packages")
            result = await self.db.execute(
                select(Token_packages).where(getattr(Token_packages, field_name) == field_value)
            )
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error fetching token_packages by {field_name}: {str(e)}")
            raise

    async def list_by_field(
        self, field_name: str, field_value: Any, skip: int = 0, limit: int = 20
    ) -> List[Token_packages]:
        """Get list of token_packagess filtered by field"""
        try:
            if not hasattr(Token_packages, field_name):
                raise ValueError(f"Field {field_name} does not exist on Token_packages")
            result = await self.db.execute(
                select(Token_packages)
                .where(getattr(Token_packages, field_name) == field_value)
                .offset(skip)
                .limit(limit)
                .order_by(Token_packages.id.desc())
            )
            return result.scalars().all()
        except Exception as e:
            logger.error(f"Error fetching token_packagess by {field_name}: {str(e)}")
            raise