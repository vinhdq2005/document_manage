from sqlalchemy import Column, BigInteger, String, Text, Boolean, DateTime, Enum, ForeignKey
from sqlalchemy.sql import func
from app.db.database import Base

class Department(Base):
    __tablename__ = "departments"
    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    name = Column(String(150), unique=True, nullable=False)
    created_at = Column(DateTime(), server_default=func.now())

class User(Base):
    __tablename__ = "users"
    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    email = Column(String(254), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(150), nullable=False)
    department_id = Column(BigInteger, ForeignKey("departments.id"), nullable=False)
    role = Column(Enum('employee', 'department_head', 'director'), nullable=False, default='employee')
    is_admin = Column(Boolean, nullable=False, default=False)
    can_upload = Column(Boolean, nullable=False, default=False)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(), server_default=func.now())

class Document(Base):
    __tablename__ = "documents"
    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(100), nullable=True)
    owner_department_id = Column(BigInteger, ForeignKey("departments.id"), nullable=False)
    uploaded_by = Column(BigInteger, ForeignKey("users.id"), nullable=False)
    original_filename = Column(String(255), nullable=False)
    content_type = Column(String(255), nullable=False)
    size_bytes = Column(BigInteger, nullable=False)
    storage_path = Column(String(512), unique=True, nullable=False)
    created_at = Column(DateTime(), server_default=func.now())
    updated_at = Column(DateTime(), server_default=func.now(), onupdate=func.now())
    deleted_at = Column(DateTime(), nullable=True)

class DocumentUserGrant(Base):
    __tablename__ = "document_user_grants"
    document_id = Column(BigInteger, ForeignKey("documents.id", ondelete="CASCADE"), primary_key=True)
    user_id = Column(BigInteger, ForeignKey("users.id"), primary_key=True)
    granted_by = Column(BigInteger, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(), server_default=func.now())