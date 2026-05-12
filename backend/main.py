import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from backend.auth import hash_password, verify_password
from backend.database import Base, engine
from backend import models  # noqa: F401
from backend.models import CodigoRegistro, Contrato, Usuario
from backend.routes.admin_routes import router as admin_router
from backend.routes.analisis_routes import router as analisis_router
from backend.routes.auth_routes import router as auth_router
from backend.routes.contratos_routes import router as contratos_router
from backend.routes.secop_routes import router as secop_router
from backend.schemas import ContractBase
from backend.services.secop_importer import load_secop_csv, upsert_contracts

from backend.routes.auditorias_routes import router as auditorias_router
from backend.routes.reportes_routes import router as reportes_router

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
        test_user = db.query(Usuario).filter(Usuario.email == "test@example.com").first()
        if test_user is None:
            db.add(Usuario(
                nombre="Usuario Test",
                email="test@example.com",
                hashed_password=hash_password("test123"),
                rol="auditor",
                activo=True,
            ))
            db.commit()

        jp_admin = db.query(Usuario).filter(Usuario.email == "jp@admin.com").first()
        if jp_admin is None:
            db.add(Usuario(
                nombre="jp admin",
                email="jp@admin.com",
                hashed_password=hash_password("admin"),
                rol="admin",
                activo=True,
            ))
            db.commit()
        elif not verify_password("admin", jp_admin.hashed_password):
            jp_admin.hashed_password = hash_password("admin")
            jp_admin.activo = True
            jp_admin.rol = "admin"
            db.commit()

        admin_exists = db.query(Usuario).filter(Usuario.rol == "admin").first() is not None
        if admin_exists:
            bootstrap_code = os.getenv("INITIAL_ADMIN_CODE", "ADMIN-BOOT-2026")
            code_exists = db.query(CodigoRegistro).filter(CodigoRegistro.codigo == bootstrap_code).first()
            if code_exists is None:
                db.add(CodigoRegistro(codigo=bootstrap_code, rol="admin", descripcion="Codigo inicial de administrador", activo=True))
                db.commit()

        secop_csv_path = Path(__file__).resolve().parent / "secop" / "SECOP_II_-_Procesos_de_Contratación_20260304.csv"
        fallback_json_path = Path(__file__).resolve().parents[1] / "ejemplo_datos.json"

        if db.query(Contrato).count() == 0:
            if secop_csv_path.exists():
                try:
                    contracts_to_seed = load_secop_csv(secop_csv_path)
                    upsert_contracts(db, contracts_to_seed)
                except Exception as e:
                    print(f"Error loading SECOP CSV: {e}")
            elif fallback_json_path.exists():
                try:
                    import json
                    example_data = json.loads(fallback_json_path.read_text(encoding="utf-8"))
                    contracts_to_seed = [ContractBase.model_validate(item) for item in example_data.get("contratos", [])]
                    upsert_contracts(db, contracts_to_seed)
                except Exception as e:
                    print(f"Error loading example data: {e}")
    except Exception as e:
        print(f"Startup error: {e}")
    finally:
        db.close()

app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(admin_router, prefix="/admin", tags=["admin"])
app.include_router(contratos_router, prefix="/contratos", tags=["contratos"])
app.include_router(analisis_router, prefix="/analisis", tags=["analisis"])
app.include_router(secop_router, prefix="/api", tags=["secop"])
app.include_router(auditorias_router, prefix="/auditorias", tags=["auditorias"])
app.include_router(reportes_router, prefix="/reportes", tags=["reportes"])

@app.get("/")
def read_root() -> dict[str, str]:
    return {"message": "API de APP Contratacion Publica"}