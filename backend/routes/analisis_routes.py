from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.dependencies import get_current_user
from backend.models import Alerta, Contrato, ResultadoAnalisis, Usuario
from backend.schemas import AnalysisRunRequest, AnalysisSummary, AlertRead
from backend.services.analysis_service import score_contracts


router = APIRouter()


@router.post("/ejecutar", response_model=AnalysisSummary)
def execute_analysis(
    payload: AnalysisRunRequest,
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_user),
) -> dict[str, int | float]:
    contracts = db.query(Contrato).all()
    if not contracts:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No hay contratos para analizar")

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
                db.add(
                    Alerta(
                        contrato_id=contract.id,
                        nivel=result.nivel,
                        mensaje=result.mensaje,
                        score=result.score,
                    )
                )

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