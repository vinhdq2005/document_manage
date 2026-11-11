from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    email: str
    full_name: str
    role: str
    is_admin: bool
    can_upload: bool

class UserMeResponse(BaseModel):
    id: int
    email: str
    full_name: str
    department_id: int
    department_name: Optional[str] = None
    role: str
    is_admin: bool
    can_upload: bool
    is_active: bool

    model_config = {"from_attributes": True}

class DepartmentCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)

class DepartmentUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=150)

class DepartmentResponse(BaseModel):
    id: int
    name: str
    created_at: datetime

    model_config = {"from_attributes": True}

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: str = Field(..., min_length=1, max_length=150)
    department_id: int
    role: str = "employee"
    is_admin: bool = False
    can_upload: bool = False
    is_active: bool = True

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    password: Optional[str] = Field(default=None, min_length=6)
    full_name: Optional[str] = Field(default=None, min_length=1, max_length=150)
    department_id: Optional[int] = None
    role: Optional[str] = None
    is_admin: Optional[bool] = None
    can_upload: Optional[bool] = None
    is_active: Optional[bool] = None

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    department_id: int
    role: str
    is_admin: bool
    can_upload: bool
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}

class DocumentCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    category: Optional[str] = Field(default=None, max_length=100)

class DocumentUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=255)
    description: Optional[str] = None
    category: Optional[str] = Field(default=None, max_length=100)

class DocumentDetailResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    owner_department_id: int
    uploaded_by: int
    original_filename: str
    content_type: str
    size_bytes: int
    storage_path: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    deleted_at: Optional[datetime] = None

    model_config = {"from_attributes": True}

class DocumentAdminResponse(BaseModel):
    id: int
    title: str
    owner_department_id: int
    uploaded_by: int
    created_at: datetime

    model_config = {"from_attributes": True}

class DocumentListResponse(BaseModel):
    items: list[DocumentDetailResponse]
    page: int
    page_size: int
    total: int

class DocumentGrantCreate(BaseModel):
    user_id: int

class DocumentGrantResponse(BaseModel):
    document_id: int
    user_id: int
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    granted_by: int
    created_at: datetime

    model_config = {"from_attributes": True}

class GrantRequest(BaseModel):
    user_id: int