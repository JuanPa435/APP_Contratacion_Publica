from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.dependencies import get_current_user
from backend.models import Usuario
from backend.services.export_service import (
    export_contracts_to_excel,
    export_alerts_to_excel,
    export_audit_requests_to_pdf,
)

router = APIRouter()


@router.get("/contratos", status_code=status.HTTP_200_OK)
def export_contracts(
    formato: str = Query("excel", regex="^(excel|xlsx)$"),
    solo_anomalos: bool = Query(False),
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_user),
):
    """Exportar contratos a Excel"""
    try:
        output = export_contracts_to_excel(db, solo_anomalos=solo_anomalos)

        filename = "contratos_anomalos.xlsx" if solo_anomalos else "contratos.xlsx"
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename}"},
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al exportar contratos: {str(e)}",
        )


@router.get("/alertas", status_code=status.HTTP_200_OK)
def export_alerts(
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_user),
):
    """Exportar alertas a Excel"""
    try:
        output = export_alerts_to_excel(db)

        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=alertas.xlsx"},
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al exportar alertas: {str(e)}",
        )


@router.get("/auditorias", status_code=status.HTTP_200_OK)
def export_audit_requests(
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_user),
):
    """Exportar solicitudes de auditoría a PDF"""
    try:
        output = export_audit_requests_to_pdf(db)

        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=auditorias.pdf"},
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al exportar auditorías: {str(e)}",
        )
