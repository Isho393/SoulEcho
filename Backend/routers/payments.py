# @File: backend/routers/payments.py
# @Desc: Stripe payment endpoints for token purchases
import logging
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
import stripe

from core.database import get_db
from core.config import settings
from dependencies.auth import get_current_user
from schemas.auth import UserResponse
from services.orders import OrdersService
from services.token_balances import Token_balancesService
from services.token_packages import Token_packagesService

stripe.api_key = settings.stripe_secret_key

router = APIRouter(prefix="/api/v1/payment", tags=["payment"])

logger = logging.getLogger(__name__)


class CheckoutSessionRequest(BaseModel):
    package_id: int
    success_url: str
    cancel_url: str


class CheckoutSessionResponse(BaseModel):
    session_id: str
    url: str


class PaymentVerificationRequest(BaseModel):
    session_id: str


class PaymentStatusResponse(BaseModel):
    status: str
    order_id: int = None
    payment_status: str
    tokens_added: int = 0


@router.post("/create_payment_session", response_model=CheckoutSessionResponse)
async def create_payment_session(
    data: CheckoutSessionRequest,
    request: Request,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a Stripe checkout session for token purchase"""
    try:
        frontend_host = request.headers.get("App-Host")
        if frontend_host and not frontend_host.startswith(("http://", "https://")):
            frontend_host = f"https://{frontend_host}"

        # Get the token package
        pkg_service = Token_packagesService(db)
        package = await pkg_service.get_by_id(data.package_id)
        if not package:
            raise HTTPException(status_code=404, detail="Token package not found")

        # Create order in database
        order_service = OrdersService(db)
        order = await order_service.create(
            data={
                "package_id": package.id,
                "token_amount": package.token_amount,
                "price_cents": package.price_cents,
                "status": "pending",
                "stripe_session_id": "",
                "created_at": datetime.now(),
            },
            user_id=current_user.id,
        )

        # Create Stripe checkout session
        line_items = [
            {
                "price_data": {
                    "currency": "usd",
                    "product_data": {
                        "name": f"SoulEcho - {package.name} Token Package",
                        "description": f"{package.token_amount} tokens",
                    },
                    "unit_amount": package.price_cents,
                },
                "quantity": 1,
            }
        ]

        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=line_items,
            mode="payment",
            success_url=f"{frontend_host}/payment-success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{frontend_host}/tokens",
            metadata={
                "order_id": str(order.id),
                "user_id": current_user.id,
                "token_amount": str(package.token_amount),
            },
        )

        # Update order with stripe session id
        await order_service.update(
            obj_id=order.id,
            update_data={"stripe_session_id": session.id},
            user_id=current_user.id,
        )

        return CheckoutSessionResponse(session_id=session.id, url=session.url)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Payment session creation error: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to create payment session: {str(e)}"
        )


@router.post("/verify_payment", response_model=PaymentStatusResponse)
async def verify_payment(
    data: PaymentVerificationRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Verify payment status and credit tokens"""
    try:
        session = stripe.checkout.Session.retrieve(data.session_id)
        order_id = session.metadata.get("order_id")
        token_amount = int(session.metadata.get("token_amount", 0))

        status_mapping = {"complete": "paid", "open": "pending", "expired": "cancelled"}
        status = status_mapping.get(session.status, "pending")

        order_service = OrdersService(db)
        tokens_added = 0

        if order_id:
            order = await order_service.get_by_id(int(order_id), user_id=current_user.id)
            if order and order.status != "paid" and status == "paid":
                # Update order status
                await order_service.update(
                    obj_id=int(order_id),
                    update_data={"status": "paid"},
                    user_id=current_user.id,
                )
                # Credit tokens to user balance
                balance_service = Token_balancesService(db)
                balance_result = await balance_service.get_list(
                    user_id=current_user.id, limit=1
                )
                if balance_result["items"]:
                    bal = balance_result["items"][0]
                    await balance_service.update(
                        obj_id=bal.id,
                        update_data={
                            "balance": bal.balance + token_amount,
                            "total_purchased": (bal.total_purchased or 0) + token_amount,
                            "updated_at": datetime.now(),
                        },
                        user_id=current_user.id,
                    )
                else:
                    await balance_service.create(
                        data={
                            "balance": 100 + token_amount,
                            "total_purchased": token_amount,
                            "total_used": 0,
                            "updated_at": datetime.now(),
                        },
                        user_id=current_user.id,
                    )
                tokens_added = token_amount

        return PaymentStatusResponse(
            status=status,
            order_id=int(order_id) if order_id else None,
            payment_status=session.payment_status,
            tokens_added=tokens_added,
        )

    except Exception as e:
        logger.error(f"Payment verification error: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to verify payment: {str(e)}"
        )