from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.auth import create_access_token, hash_password, verify_password
from backend.database import get_db
from backend.dependencies import get_current_user
from backend.models import CodigoRegistro, Usuario
from backend.schemas import Token, UserCreate, UserLogin, UserRead


router = APIRouter()


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: Session = Depends(get_db)) -> Usuario:
    code = db.query(CodigoRegistro).filter(CodigoRegistro.codigo == payload.codigo_registro, CodigoRegistro.activo.is_(True)).first()
    if code is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Codigo de registro invalido o inactivo")

    if db.query(Usuario).filter(Usuario.email == payload.email).first() is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El correo ya esta registrado")

    user = Usuario(
        nombre=payload.nombre,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        rol=code.rol,
    )
    db.add(user)
    db.flush()
    code.activo = False
    code.usado_por = user.id
    code.usado_en = datetime.now(timezone.utc)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=Token)
def login(payload: UserLogin, db: Session = Depends(get_db)) -> Token:
    user = db.query(Usuario).filter(Usuario.email == payload.email).first()
    if user is None or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales invalidas")
    if not user.activo:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Usuario inactivo")

    access_token = create_access_token({"sub": str(user.id), "role": user.rol}, expires_delta=timedelta(minutes=120))
    return Token(access_token=access_token)


@router.get("/me", response_model=UserRead)
def me(user: Usuario = Depends(get_current_user)) -> Usuario:
    return user