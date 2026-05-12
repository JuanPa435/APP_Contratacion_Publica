from datetime import datetime, timedelta, timezone
from pathlib import Path
from secrets import token_urlsafe

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.dependencies import require_admin
from backend.models import CodigoRegistro, Usuario
from backend.schemas import RegistrationCodeCreate, RegistrationCodeRead, UserRead
from backend.services.secop_importer import sync_secop_csv


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


@router.patch("/usuarios/{usuario_id}", response_model=UserRead)
def update_user(
    usuario_id: int,
    rol: str | None = None,
    activo: bool | None = None,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_admin),
) -> Usuario:
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if usuario is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")

    if rol is not None:
        valid_roles = ["admin", "auditor", "empleado", "analista"]
        if rol not in valid_roles:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Rol inválido. Roles válidos: {valid_roles}")
        usuario.rol = rol

    if activo is not None:
        usuario.activo = activo

    db.commit()
    db.refresh(usuario)
    return usuario


@router.get("/resumen")
def summary(db: Session = Depends(get_db), _: Usuario = Depends(require_admin)) -> dict[str, int]:
    users = db.query(Usuario).count()
    codes = db.query(CodigoRegistro).count()
    active_codes = db.query(CodigoRegistro).filter(CodigoRegistro.activo.is_(True)).count()
    admins = db.query(Usuario).filter(Usuario.rol == "admin").count()
    return {"usuarios": users, "codigos": codes, "codigos_activos": active_codes, "admins": admins}


@router.post("/importar-secop")
def import_secop_data(db: Session = Depends(get_db), _: Usuario = Depends(require_admin)) -> dict[str, int | str]:
    secop_csv_path = Path(__file__).resolve().parents[1] / "secop" / "SECOP_II_-_Procesos_de_Contratación_20260304.csv"
    if not secop_csv_path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No se encontró el archivo SECOP")

    created, updated = sync_secop_csv(db, secop_csv_path)
    return {"archivo": secop_csv_path.name, "creados": created, "actualizados": updated}
