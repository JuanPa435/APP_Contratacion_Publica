from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import Contrato, Usuario
from backend.services.secop_importer import sync_secop_csv

router = APIRouter()


@router.post("/secop/importar", status_code=status.HTTP_200_OK)
def importar_secop(
    db: Session = Depends(get_db),
) -> dict:
    """Importar contratos desde SECOP CSV"""
    secop_path = Path(__file__).parent.parent / "secop" / "SECOP_II_-_Procesos_de_Contratación_20260304.csv"

    if not secop_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Archivo SECOP no encontrado en {secop_path}",
        )

    try:
        created, updated = sync_secop_csv(db, secop_path)

        return {
            "mensaje": "Importación completada",
            "creados": created,
            "actualizados": updated,
            "total": created + updated,
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al importar SECOP: {str(e)}",
        )


@router.get("/secop/estadisticas", status_code=status.HTTP_200_OK)
def obtener_estadisticas_secop(
    db: Session = Depends(get_db),
) -> dict:
    """Obtener estadísticas de los contratos importados del SECOP"""
    total_contratos = db.query(Contrato).count()
    contratos_secop = db.query(Contrato).filter(
        Contrato.datos_secop != None
    ).count()

    valor_total = 0
    valor_query = db.query(Contrato.valor).filter(Contrato.valor != None).all()
    valor_total = sum([v[0] for v in valor_query if v[0] is not None])

    num_ofertas_query = db.query(Contrato.num_ofertas).filter(
        Contrato.num_ofertas != None
    ).all()
    total_ofertas = sum([o[0] for o in num_ofertas_query if o[0] is not None])

    return {
        "total_contratos": total_contratos,
        "contratos_secop": contratos_secop,
        "valor_total_contratos": valor_total,
        "total_ofertas": total_ofertas,
    }
