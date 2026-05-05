from datetime import datetime, timedelta, timezone
from secrets import token_urlsafe

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.dependencies import require_admin
from backend.models import CodigoRegistro, Usuario
from backend.schemas import RegistrationCodeCreate, RegistrationCodeRead, UserRead


router = APIRouter()


@router.post("/codigos", response_model=RegistrationCodeRead, status_code=status.HTTP_201_CREATED)
def create_code(
    payload: RegistrationCodeCreate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_admin),
) -> CodigoRegistro:
    codigo = payload.codigo or token_urlsafe(10).replace("-", "").replace("_", "")[:12].upper()
    code = CodigoRegistro(codigo=codigo, rol=payload.rol, descripcion=payload.descripcion, activo=True)
    db.add(code)
    db.commit()
    db.refresh(code)
    return code


@router.get("/codigos", response_model=list[RegistrationCodeRead])
def list_codes(
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_admin),
    activo: bool | None = Query(default=None),
) -> list[CodigoRegistro]:
    query = db.query(CodigoRegistro)
    if activo is not None:
        query = query.filter(CodigoRegistro.activo.is_(activo))
    return query.order_by(CodigoRegistro.creado_en.desc()).all()


@router.get("/usuarios", response_model=list[UserRead])
def list_users(db: Session = Depends(get_db), _: Usuario = Depends(require_admin)) -> list[Usuario]:
    return db.query(Usuario).order_by(Usuario.created_at.desc()).all()


@router.get("/resumen")
def summary(db: Session = Depends(get_db), _: Usuario = Depends(require_admin)) -> dict[str, int]:
    users = db.query(Usuario).count()
    codes = db.query(CodigoRegistro).count()
    active_codes = db.query(CodigoRegistro).filter(CodigoRegistro.activo.is_(True)).count()
    admins = db.query(Usuario).filter(Usuario.rol == "admin").count()
    return {"usuarios": users, "codigos": codes, "codigos_activos": active_codes, "admins": admins}