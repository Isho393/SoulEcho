"""add ai_memory to user_profiles

Revision ID: b3c4d5e6f7a8
Revises: a1b2c3d4e5f6
Create Date: 2026-04-15
"""
from alembic import op
import sqlalchemy as sa

revision = 'b3c4d5e6f7a8'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('user_profiles', sa.Column('ai_memory', sa.String(2000), nullable=True))


def downgrade():
    op.drop_column('user_profiles', 'ai_memory')
