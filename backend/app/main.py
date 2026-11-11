import os
from datetime import datetime
from pathlib import Path
from typing import Optional

from fastapi import Depends, FastAPI, File, Form, HTTPException, Query, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.models import Department, Document, DocumentUserGrant, User
from app.schemas.schemas import (
    DepartmentCreate,
    DepartmentResponse,
    DepartmentUpdate,
    DocumentAdminResponse,
    DocumentDetailResponse,
    DocumentGrantCreate,
    DocumentGrantResponse,
    DocumentListResponse,
    DocumentUpdate,
    LoginRequest,
    TokenResponse,
    UserCreate,
    UserMeResponse,
    UserResponse,
    UserUpdate,
)
from app.services.auth import create_access_token, get_current_user, get_password_hash, verify_password

app = FastAPI(title="Document Management System API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BACKEND_ROOT = Path(__file__).resolve().parents[1]
UPLOAD_ROOT = (BACKEND_ROOT / "uploads").resolve()
UPLOAD_ROOT.mkdir(parents=True, exist_ok=True)


def has_document_read_access(current_user: User, document: Document, db: Session) -> bool:
    if current_user.is_admin:
        return False
    if document.deleted_at is not None:
        return False
    if current_user.role == "director":
        return True
    if document.owner_department_id == current_user.department_id:
        return True
    grant = (
        db.query(DocumentUserGrant)
        .filter(
            DocumentUserGrant.document_id == document.id,
            DocumentUserGrant.user_id == current_user.id,
        )
        .first()
    )
    return grant is not None


def require_document_access(current_user: User, document: Document, db: Session, action: str = "xem") -> None:
    if not has_document_read_access(current_user, document, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Bạn không có quyền {action} tài liệu này.",
        )


def build_accessible_document_query(db: Session, current_user: User, q: Optional[str] = None):
    if current_user.is_admin:
        query = db.query(Document).filter(Document.deleted_at.is_(None))
    elif current_user.role == "director":
        query = db.query(Document).filter(Document.deleted_at.is_(None))
    else:
        granted_subquery = (
            db.query(DocumentUserGrant.document_id)
            .filter(DocumentUserGrant.user_id == current_user.id)
            .subquery()
        )
        query = db.query(Document).filter(
            Document.deleted_at.is_(None),
            or_(
                Document.owner_department_id == current_user.department_id,
                Document.id.in_(granted_subquery),
            ),
        )

    if q:
        keyword = f"%{q.strip()}%"
        query = query.filter(or_(Document.title.ilike(keyword), Document.description.ilike(keyword)))
    return query


@app.get("/api/v1/health")
def health_check():
    return {"status": "ok"}


@app.post("/api/v1/auth/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email hoặc mật khẩu không chính xác.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tài khoản chưa được kích hoạt hoặc đã bị khóa.",
        )

    token = create_access_token({"sub": user.email})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user_id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        is_admin=user.is_admin,
        can_upload=user.can_upload,
    )


@app.get("/api/v1/auth/me", response_model=UserMeResponse)
def get_current_user_info(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    department = db.query(Department).filter(Department.id == current_user.department_id).first()
    return UserMeResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        department_id=current_user.department_id,
        department_name=department.name if department else None,
        role=current_user.role,
        is_admin=current_user.is_admin,
        can_upload=current_user.can_upload,
        is_active=current_user.is_active,
    )


@app.get("/api/v1/documents", response_model=DocumentListResponse)
def list_documents(
    q: Optional[str] = Query(default=None, description="Tìm trong tiêu đề và mô tả"),
    department_id: Optional[int] = Query(default=None),
    category: Optional[str] = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = build_accessible_document_query(db, current_user, q)

    if department_id is not None:
        if current_user.is_admin or current_user.role == "director":
            query = query.filter(Document.owner_department_id == department_id)
        else:
            query = query.filter(
                Document.owner_department_id == current_user.department_id,
                Document.owner_department_id == department_id,
            )

    if category:
        query = query.filter(Document.category == category)

    total = query.count()
    items = query.order_by(Document.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()

    return DocumentListResponse(
        items=[DocumentDetailResponse.model_validate(item) for item in items],
        page=page,
        page_size=page_size,
        total=total,
    )


@app.post("/api/v1/documents", response_model=DocumentDetailResponse)
def upload_document(
    title: str = Form(...),
    description: Optional[str] = Form(default=None),
    category: Optional[str] = Form(default=None),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin không có quyền upload tài liệu theo quy định MVP.",
        )
    if not current_user.can_upload:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bạn không có quyền upload tài liệu.",
        )
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Thiếu tên tệp upload.",
        )

    safe_name = f"{datetime.utcnow().strftime('%Y%m%d%H%M%S')}_{current_user.id}_{abs(hash(file.filename))}{Path(file.filename).suffix}"
    storage_relative = f"uploads/{safe_name}"
    abs_target_path = (BACKEND_ROOT / storage_relative).resolve()
    if not str(abs_target_path).startswith(str(UPLOAD_ROOT)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Đường dẫn lưu trữ không hợp lệ.",
        )

    raw_content = file.file.read()
    try:
        abs_target_path.parent.mkdir(parents=True, exist_ok=True)
        with abs_target_path.open("wb") as buffer:
            buffer.write(raw_content)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Không thể lưu tệp: {str(exc)}") from exc

    document = Document(
        title=title.strip(),
        description=description.strip() if description else None,
        category=category.strip() if category else None,
        owner_department_id=current_user.department_id,
        uploaded_by=current_user.id,
        original_filename=file.filename,
        content_type=file.content_type or "application/octet-stream",
        size_bytes=len(raw_content),
        storage_path=storage_relative,
    )

    try:
        db.add(document)
        db.commit()
        db.refresh(document)
    except Exception as exc:
        try:
            abs_target_path.unlink(missing_ok=True)
        except Exception:
            pass
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Không thể lưu metadata tài liệu: {str(exc)}",
        ) from exc

    return DocumentDetailResponse.model_validate(document)


@app.get("/api/v1/documents/{id}", response_model=DocumentDetailResponse)
def get_document_detail(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    document = db.query(Document).filter(Document.id == id).first()
    if not document or document.deleted_at is not None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy tài liệu.")

    if current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin không được xem nội dung hoặc tải tài liệu theo quy định MVP.",
        )

    require_document_access(current_user, document, db, action="xem")
    return DocumentDetailResponse.model_validate(document)


@app.get("/api/v1/documents/{id}/download")
def download_document(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    document = db.query(Document).filter(Document.id == id).first()
    if not document or document.deleted_at is not None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy tài liệu.")

    if current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin không được tải tài liệu theo quy định MVP.",
        )

    require_document_access(current_user, document, db, action="tải xuống")

    file_path = (BACKEND_ROOT / document.storage_path).resolve()
    if not file_path.exists() or not str(file_path).startswith(str(UPLOAD_ROOT)):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tệp tin không tồn tại trên hệ thống lưu trữ.")

    return FileResponse(path=str(file_path), filename=document.original_filename, media_type=document.content_type)


@app.patch("/api/v1/documents/{id}", response_model=DocumentDetailResponse)
def update_document_metadata(
    id: int,
    payload: DocumentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    document = db.query(Document).filter(Document.id == id).first()
    if not document or document.deleted_at is not None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy tài liệu.")

    if not current_user.is_admin and document.uploaded_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bạn không có quyền sửa metadata tài liệu này.",
        )

    if payload.title is not None:
        document.title = payload.title.strip()
    if payload.description is not None:
        document.description = payload.description.strip()
    if payload.category is not None:
        document.category = payload.category.strip()

    db.commit()
    db.refresh(document)
    return DocumentDetailResponse.model_validate(document)


@app.delete("/api/v1/documents/{id}")
def delete_document(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    document = db.query(Document).filter(Document.id == id).first()
    if not document or document.deleted_at is not None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy tài liệu.")

    if not current_user.is_admin and document.uploaded_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bạn không có quyền xóa tài liệu này.",
        )

    document.deleted_at = datetime.utcnow()
    db.commit()
    return {"message": "Tài liệu đã được xóa mềm thành công."}


@app.get("/api/v1/admin/documents", response_model=list[DocumentAdminResponse])
def admin_list_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Chỉ quản trị viên mới có quyền xem danh sách tài liệu tối thiểu.",
        )

    documents = db.query(Document).filter(Document.deleted_at.is_(None)).order_by(Document.created_at.desc()).all()
    return [DocumentAdminResponse.model_validate(item) for item in documents]


@app.get("/api/v1/documents/{id}/grants", response_model=list[DocumentGrantResponse])
def list_document_grants(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Chỉ quản trị viên mới quản lý quyền đọc tài liệu.",
        )

    document = db.query(Document).filter(Document.id == id).first()
    if not document or document.deleted_at is not None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy tài liệu.")

    grants = (
        db.query(DocumentUserGrant)
        .filter(DocumentUserGrant.document_id == id)
        .order_by(DocumentUserGrant.created_at.desc())
        .all()
    )

    result = []
    for grant in grants:
        user = db.query(User).filter(User.id == grant.user_id).first()
        result.append(
            DocumentGrantResponse(
                document_id=grant.document_id,
                user_id=grant.user_id,
                user_name=user.full_name if user else None,
                user_email=user.email if user else None,
                granted_by=grant.granted_by,
                created_at=grant.created_at,
            )
        )
    return result


@app.post("/api/v1/documents/{id}/grants", response_model=DocumentGrantResponse)
def grant_document_access(
    id: int,
    payload: DocumentGrantCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Chỉ quản trị viên mới cấp quyền đọc tài liệu.",
        )

    document = db.query(Document).filter(Document.id == id).first()
    if not document or document.deleted_at is not None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy tài liệu.")

    target_user = db.query(User).filter(User.id == payload.user_id).first()
    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Người dùng cần cấp quyền không tồn tại.")
    if target_user.is_admin or target_user.role == "director":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Không cấp quyền đọc cho admin hoặc giám đốc.",
        )
    if target_user.department_id == document.owner_department_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Chỉ cấp quyền ngoài phòng sở hữu của tài liệu.",
        )

    existing = (
        db.query(DocumentUserGrant)
        .filter(DocumentUserGrant.document_id == id, DocumentUserGrant.user_id == payload.user_id)
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Người dùng này đã được cấp quyền đọc tài liệu.",
        )

    grant = DocumentUserGrant(document_id=id, user_id=payload.user_id, granted_by=current_user.id)
    db.add(grant)
    db.commit()
    db.refresh(grant)

    return DocumentGrantResponse(
        document_id=grant.document_id,
        user_id=grant.user_id,
        user_name=target_user.full_name,
        user_email=target_user.email,
        granted_by=grant.granted_by,
        created_at=grant.created_at,
    )


@app.delete("/api/v1/documents/{id}/grants/{user_id}")
def revoke_document_access(
    id: int,
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Chỉ quản trị viên mới thu hồi quyền đọc tài liệu.",
        )

    grant = (
        db.query(DocumentUserGrant)
        .filter(DocumentUserGrant.document_id == id, DocumentUserGrant.user_id == user_id)
        .first()
    )
    if not grant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy quyền đọc cần thu hồi.")

    db.delete(grant)
    db.commit()
    return {"message": "Đã thu hồi quyền đọc tài liệu thành công."}


@app.get("/api/v1/departments", response_model=list[DepartmentResponse])
def list_departments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Chỉ quản trị viên mới xem danh sách phòng ban.",
        )
    departments = db.query(Department).order_by(Department.id).all()
    return [DepartmentResponse.model_validate(item) for item in departments]


@app.post("/api/v1/departments", response_model=DepartmentResponse)
def create_department(
    payload: DepartmentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Chỉ quản trị viên mới quản lý phòng ban.",
        )

    existing = db.query(Department).filter(Department.name == payload.name.strip()).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tên phòng ban đã tồn tại.")

    department = Department(name=payload.name.strip())
    db.add(department)
    db.commit()
    db.refresh(department)
    return DepartmentResponse.model_validate(department)


@app.patch("/api/v1/departments/{id}", response_model=DepartmentResponse)
def update_department(
    id: int,
    payload: DepartmentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Chỉ quản trị viên mới quản lý phòng ban.",
        )

    department = db.query(Department).filter(Department.id == id).first()
    if not department:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy phòng ban.")

    if payload.name is not None:
        department.name = payload.name.strip()

    db.commit()
    db.refresh(department)
    return DepartmentResponse.model_validate(department)


@app.get("/api/v1/users", response_model=list[UserResponse])
def list_users(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Chỉ quản trị viên mới xem danh sách người dùng.",
        )

    users = db.query(User).order_by(User.id).all()
    return [UserResponse.model_validate(item) for item in users]


@app.post("/api/v1/users", response_model=UserResponse)
def create_user(
    payload: UserCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Chỉ quản trị viên mới quản lý người dùng.",
        )

    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email đã tồn tại trong hệ thống.")

    user = User(
        email=payload.email,
        password_hash=get_password_hash(payload.password),
        full_name=payload.full_name,
        department_id=payload.department_id,
        role=payload.role,
        is_admin=payload.is_admin,
        can_upload=payload.can_upload,
        is_active=payload.is_active,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return UserResponse.model_validate(user)


@app.patch("/api/v1/users/{id}", response_model=UserResponse)
def update_user(
    id: int,
    payload: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Chỉ quản trị viên mới quản lý người dùng.",
        )

    user = db.query(User).filter(User.id == id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy người dùng.")

    if payload.email is not None:
        user.email = payload.email
    if payload.full_name is not None:
        user.full_name = payload.full_name
    if payload.department_id is not None:
        user.department_id = payload.department_id
    if payload.role is not None:
        user.role = payload.role
    if payload.is_admin is not None:
        user.is_admin = payload.is_admin
    if payload.can_upload is not None:
        user.can_upload = payload.can_upload
    if payload.is_active is not None:
        user.is_active = payload.is_active
    if payload.password is not None:
        user.password_hash = get_password_hash(payload.password)

    db.commit()
    db.refresh(user)
    return UserResponse.model_validate(user)