import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from backend.database import Base, engine
from backend import models  # noqa: F401
from backend.models import CodigoRegistro, Usuario
from backend.routes.admin_routes import router as admin_router
from backend.routes.analisis_routes import router as analisis_router
from backend.routes.auth_routes import router as auth_router
from backend.routes.contratos_routes import router as contratos_router


app = FastAPI(title="APP Contratacion Publica")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)
    db = Session(bind=engine)
    try:
        admin_exists = db.query(Usuario).filter(Usuario.rol == "admin").first() is not None
        if not admin_exists:
            bootstrap_code = os.getenv("INITIAL_ADMIN_CODE", "ADMIN-BOOT-2026")
            code_exists = db.query(CodigoRegistro).filter(CodigoRegistro.codigo == bootstrap_code).first()
            if code_exists is None:
                db.add(CodigoRegistro(codigo=bootstrap_code, rol="admin", descripcion="Codigo inicial de administrador", activo=True))
                db.commit()
    finally:
        db.close()

app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(admin_router, prefix="/admin", tags=["admin"])
app.include_router(contratos_router, prefix="/contratos", tags=["contratos"])
app.include_router(analisis_router, prefix="/analisis", tags=["analisis"])


@app.get("/")
def read_root() -> dict[str, str]:
    return {"message": "API de APP Contratacion Publica"}