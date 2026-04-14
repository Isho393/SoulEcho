"""add_soul_echo_tables

Revision ID: a1b2c3d4e5f6
Revises: 6cc0504e83f4
Create Date: 2026-04-14

"""
from alembic import op
import sqlalchemy as sa

revision = 'a1b2c3d4e5f6'
down_revision = '6cc0504e83f4'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'user_profiles',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.String(255), nullable=False),
        sa.Column('personality_type', sa.String(10), nullable=True),
        sa.Column('life_context', sa.String(500), nullable=True),
        sa.Column('goals', sa.JSON(), nullable=True),
        sa.Column('communication_preference', sa.String(20), nullable=True),
        sa.Column('language', sa.String(5), nullable=True, server_default='fr'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_user_profiles_id', 'user_profiles', ['id'])
    op.create_index('ix_user_profiles_user_id', 'user_profiles', ['user_id'], unique=True)

    op.create_table(
        'emotional_scores',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.String(255), nullable=False),
        sa.Column('score', sa.Integer(), nullable=False),
        sa.Column('note', sa.String(200), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_emotional_scores_id', 'emotional_scores', ['id'])
    op.create_index('ix_emotional_scores_user_id', 'emotional_scores', ['user_id'])


def downgrade() -> None:
    op.drop_index('ix_emotional_scores_user_id', table_name='emotional_scores')
    op.drop_index('ix_emotional_scores_id', table_name='emotional_scores')
    op.drop_table('emotional_scores')

    op.drop_index('ix_user_profiles_user_id', table_name='user_profiles')
    op.drop_index('ix_user_profiles_id', table_name='user_profiles')
    op.drop_table('user_profiles')
