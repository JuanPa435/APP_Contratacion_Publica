from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.dependencies import get_current_user
from backend.models import Alerta, Contrato, ResultadoAnalisis, Usuario, SolicitudAuditoria
from backend.schemas import AnalysisRunRequest, AnalysisSummary, AlertRead, AlertCreate
from backend.services.analysis_service import filter_contracts_by_publication_window, score_contracts
from datetime import datetime, timezone


router = APIRouter()


@router.post("/ejecutar", response_model=AnalysisSummary)
def execute_analysis(
    payload: AnalysisRunRequest,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    min_years_back: int = Query(default=1, ge=0, le=20),
    max_years_back: int = Query(default=2, ge=0, le=20),
) -> dict[str, int | float]:
    contracts = filter_contracts_by_publication_window(
        db.query(Contrato).all(),
        min_years_back=min_years_back,
        max_years_back=max_years_back,
    )
    if not contracts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No hay contratos SECOP en el rango de fechas solicitado",
        )

    results = score_contracts(contracts, payload.contamination)
    total_anomalies = 0

    for result in results:
        contract = db.get(Contrato, result.contrato_id)
        if contract is None:
            continue
        contract.score_anomalia = result.score
        contract.es_anomalo = result.es_anomalo
        contract.alerta_generada = result.es_anomalo
        if result.es_anomalo:
            total_anomalies += 1
            exists = (
                db.query(Alerta)
                .filter(Alerta.contrato_id == contract.id, Alerta.mensaje == result.mensaje)
                .first()
            )
            if exists is None:
                alert_data = AlertCreate(
                    contrato_id=contract.id,
                    nivel=result.nivel,
                    mensaje=result.mensaje,
                    score=result.score,
                )
                alerta = Alerta(**alert_data.model_dump())
                db.add(alerta)

            # Crear solicitud de auditoría automáticamente
            audit_exists = (
                db.query(SolicitudAuditoria)
                .filter(SolicitudAuditoria.contrato_id == contract.id, SolicitudAuditoria.estado != "rechazada")
                .first()
            )
            if audit_exists is None:
                solicitud = SolicitudAuditoria(
                    contrato_id=contract.id,
                    usuario_id=current_user.id,
                    motivo=f"Anomalía detectada en análisis: {result.mensaje}",
                    evidencia=f"Score de anomalía: {result.score:.4f}",
                    prioridad="alta" if result.score > 0.7 else "media",
                    estado="pendiente",
                )
                db.add(solicitud)

    db.add(
        ResultadoAnalisis(
            total_contratos=len(contracts),
            total_anomalias=total_anomalies,
            contamination=payload.contamination,
        )
    )
    db.commit()
    return {"total_contratos": len(contracts), "total_anomalias": total_anomalies, "contamination": payload.contamination}


@router.get("/ultimos-resultados", response_model=list[AlertRead])
def latest_alerts(db: Session = Depends(get_db), _: Usuario = Depends(get_current_user)) -> list[Alerta]:
    return db.query(Alerta).order_by(Alerta.created_at.desc()).limit(50).all()


@router.get("/salud")
def health() -> dict[str, str]:
    return {"status": "analisis ok"}